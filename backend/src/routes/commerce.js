const express = require('express');
const crypto = require('node:crypto');
const { Product, Order, User } = require('../models');
const ShipmentEvent = require('../models/ShipmentEvent');
const { saveTrackingEvent, normalizeStatus } = require('../services/tracking');
const { auth, requireVerified, requireRole } = require('../middleware/auth');
const paystack = require('../services/paystack');
const fez = require('../services/fez');
const iclose = require('../services/iclose');
const { requestFingerprint, createQuoteToken, readQuoteToken } = require('../services/quote-token');
const router = express.Router();
const orderNo = () => `MRX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const pickupOf = seller => seller?.store?.pickupAddress || {};
function validatePickup(seller) { const p = pickupOf(seller); return p.contactName && p.phone && p.line1 && p.city && p.state; }
async function sellerGroups(items, products) {
  const groups = new Map();
  for (const item of items) {
    const product = products.find(p => String(p._id) === String(item.productId || item.product));
    if (!product) throw new Error('One or more products are unavailable.');
    const key = String(product.seller);
    if (!groups.has(key)) groups.set(key, { sellerId: product.seller, products: [], weightKg: 0, declaredValue: 0 });
    const group = groups.get(key); const quantity = Math.floor(Number(item.quantity));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}.`);
    group.products.push({ product, quantity }); group.weightKg += (product.weightKg || 0.5) * quantity; group.declaredValue += Number(product.price) * quantity;
  }
  const sellers = await User.find({ _id: { $in: [...groups.values()].map(g => g.sellerId) } }).select('name phone store');
  for (const group of groups.values()) { group.seller = sellers.find(s => String(s._id) === String(group.sellerId)); if (!validatePickup(group.seller)) throw new Error(`Seller ${group.seller?.store?.name || group.seller?.name || ''} has not completed a pickup address. The seller must save a valid pickup address before this item can be shipped.`); }
  return [...groups.values()];
}
async function createProviderQuote({ items, destination, providerId, userId }) {
  if (!destination?.line1 || !destination?.city || !destination?.state) { const e = new Error('Enter the full delivery address first.'); e.status = 400; throw e; }
  const provider = providerId === 'fez' ? fez : providerId === 'iclose' ? iclose : null;
  if (!provider || !provider.enabled()) { const e = new Error(`${providerId || 'Selected courier'} is not configured.`); e.status = 503; throw e; }
  const ids = [...new Set(items.map(i => String(i.productId || i.product || '')))];
  const products = await Product.find({ _id: { $in: ids }, status: 'active' });
  if (!ids.length || products.length !== ids.length) { const e = new Error('One or more products are unavailable.'); e.status = 400; throw e; }
  const groups = await sellerGroups(items, products);
  const quotes = await Promise.all(groups.map(async g => {
    const result = providerId === 'fez'
      ? await fez.quote({ destinationState: destination.state, pickupState: pickupOf(g.seller).state, weightKg: g.weightKg })
      : await iclose.quote({ seller: g.seller, destination, weightKg: g.weightKg });
    return { sellerId: String(g.sellerId), price: Number(result.price), weightKg: g.weightKg, storeName: g.seller.store?.name || g.seller.name, quoteData: providerId === 'iclose' ? { distanceKm: result.distanceKm, state: result.state, rateType: result.rateType } : null };
  }));
  const total = quotes.reduce((sum,q)=>sum+q.price,0);
  const name = providerId === 'fez' ? 'Fez Delivery' : 'iClose';
  const fingerprint = requestFingerprint(userId, items, destination);
  const signed = createQuoteToken({ providerId, quotes, userId: String(userId), fingerprint });
  return { option: { id: signed.token, providerId, provider:name, carrier_name:`${name} · ${quotes.length} seller pickup${quotes.length===1?'':'s'}`, service_level:'Seller-to-customer delivery', price:total, eta:'', expiresAt:signed.expiresAt }, groups, quotes };
}
async function createAllCourierQuotes({items,destination,userId}) {
  const results = await Promise.allSettled(['fez','iclose'].map(providerId => createProviderQuote({items,destination,providerId,userId})));
  const options = results.filter(x=>x.status==='fulfilled').map(x=>x.value.option);
  const warnings = results.filter(x=>x.status==='rejected').map(x=>x.reason?.message || 'Courier unavailable');
  if (!options.length) { const e=new Error(`No courier returned a quote. ${warnings.join(' ')}`); e.status=502; throw e; }
  options.sort((a,b)=>a.price-b.price);
  return {options,cheapest_id:options[0].id,providers:options.map(o=>({id:o.providerId,name:o.provider,options:1})),warnings};
}

router.get('/seller/pickup-address', auth, requireVerified, requireRole('seller', 'admin'), async (req, res, next) => { try { const user = await User.findById(req.user._id).select('store'); res.json({ pickupAddress: pickupOf(user) }); } catch (e) { next(e); } });
router.put('/seller/pickup-address', auth, requireVerified, requireRole('seller', 'admin'), async (req, res, next) => { try {
  const p = req.body || {}; const required = ['contactName', 'phone', 'line1', 'city', 'state'];
  if (required.some(k => !String(p[k] || '').trim())) return res.status(400).json({ error: 'Contact name, phone, street address, city and state are required.' });
  const user = await User.findById(req.user._id);
  user.store = user.store || {}; user.store.pickupAddress = { contactName: String(p.contactName).trim(), phone: String(p.phone).trim(), line1: String(p.line1).trim(), line2: String(p.line2 || '').trim(), city: String(p.city).trim(), state: String(p.state).trim(), country: 'Nigeria' };
  await user.save(); res.json({ message: 'Seller pickup address saved.', pickupAddress: user.store.pickupAddress });
} catch (e) { next(e); } });

router.post('/shipping/quote', auth, requireVerified, async (req,res,next)=>{ try {

  const {items,destination}=req.body||{};
  if(!Array.isArray(items)||!items.length) return res.status(400).json({error:'Your cart is empty.'});
  const quote=await createAllCourierQuotes({items,destination,userId:req.user._id});
  res.json({quote});
} catch(e) { res.status(e.status||502).json({error:e.message||'Unable to get delivery quotes.'}); } });

router.post('/orders', auth, requireVerified, async (req, res, next) => { try {
  const { items, shippingAddress, quoteOptionId } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty.' });
  if (!shippingAddress?.recipient || !shippingAddress?.phone || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.state) return res.status(400).json({ error: 'Complete the delivery address before placing the order.' });
  const token = readQuoteToken(quoteOptionId);
  if (!token || !['fez','iclose'].includes(token.providerId) ||
      token.userId !== String(req.user._id) ||
      token.fingerprint !== requestFingerprint(req.user._id, items, shippingAddress)) {
    return res.status(409).json({ error: 'Your delivery quote expired or no longer matches your account, cart or delivery address. Request fresh delivery rates.' });
  }
  const ids = [...new Set(items.map(i => String(i.productId || '')))];
  const products = await Product.find({ _id: { $in: ids }, status: 'active' });
  if (products.length !== ids.length) return res.status(400).json({ error: 'One or more products are unavailable.' });
  const normalized = []; let subtotal = 0;
  for (const item of items) {
    const product = products.find(p => String(p._id) === String(item.productId)); const quantity = Math.floor(Number(item.quantity));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) return res.status(400).json({ error: `Insufficient stock for ${product.name}.` });
    const submitted = item.variant || null; let variant = null;
    if (product.variants?.length) { const matched = product.variants.find(v => (submitted?.sku && v.sku === submitted.sku) || (submitted?.size && v.size === submitted.size && (!submitted?.color || v.color === submitted.color))); if (!matched) return res.status(400).json({ error: `Choose a valid available variant for ${product.name}.` }); if (quantity > matched.stock) return res.status(400).json({ error: `Insufficient stock for the selected ${product.name} variant.` }); variant = { sku: matched.sku, size: matched.size, color: matched.color }; }
    else if (submitted) { variant = {}; for (const [k, v] of Object.entries(submitted)) if (['size','color','condition','storage','material','skinType','dimensions','ageRange','makeModel','serviceArea','availability'].includes(k) && typeof v === 'string') variant[k] = v; }
    const unitPrice = Number(product.price); subtotal += unitPrice * quantity; normalized.push({ product: product._id, seller: product.seller, name: product.name, imageUrl: product.images?.[0]?.url || '', quantity, unitPrice, variant });
  }
  const providerId = token.providerId;
  const current = await createProviderQuote({ items, destination: shippingAddress, providerId, userId:req.user._id });
  const quoted = token;
  const sameSellerGroups = JSON.stringify(quoted.quotes.map(q=>q.sellerId).sort()) === JSON.stringify(current.quotes.map(q=>q.sellerId).sort());
  const ratesMatch = quoted.quotes.every(q => {
    const now = current.quotes.find(n => n.sellerId === q.sellerId);
    if (!now || Math.abs(Number(now.price)-Number(q.price)) > 0.01 ||
        Math.abs(Number(now.weightKg)-Number(q.weightKg)) > 0.001) return false;
    if (providerId === 'iclose') {
      return Number(q.quoteData?.distanceKm) === Number(now.quoteData?.distanceKm) &&
        q.quoteData?.state === now.quoteData?.state &&
        q.quoteData?.rateType === now.quoteData?.rateType;
    }
    return true;
  });
  if (!sameSellerGroups || !ratesMatch) return res.status(409).json({error:'Delivery rates changed or quote no longer matches your cart. Request new rates.'});
  const shippingFee=current.option.price; const carrier=providerId==='fez'?'Fez Delivery':'iClose';
  const order=await Order.create({orderNumber:orderNo(),buyer:req.user._id,items:normalized,shippingFee,subtotal,total:subtotal+shippingFee,shippingAddress:{...shippingAddress,country:shippingAddress.country||'Nigeria'},shipment:{provider:providerId,shippingFee,carrier,status:'awaiting_payment',quoteOptionId},shipments:current.groups.map(g=>{const q=quoted.quotes.find(x=>x.sellerId===String(g.sellerId));return {seller:g.sellerId,provider:providerId,shippingFee:q?.price||0,weightKg:g.weightKg,quoteData:q?.quoteData||null,status:'awaiting_payment',carrier};})});
  return res.status(201).json({ order });
} catch (e) { next(e); } });

router.post('/orders/:id/pay', auth, requireVerified, async (req, res, next) => { try { const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id }); if (!order) return res.status(404).json({ error: 'Order not found.' }); if (order.paymentStatus === 'paid') return res.status(409).json({ error: 'This order has already been paid.' }); const reference = `MRX${Date.now()}${crypto.randomBytes(4).toString('hex')}`; const result = await paystack.initialize({ email: req.user.email, amountNaira: order.total, reference, metadata: { orderId: String(order._id), orderNumber: order.orderNumber, buyerId: String(req.user._id) }, callbackUrl: `${(process.env.WEB_URL || 'http://localhost:2445').replace(/\/$/, '')}/payment/verify` }); order.paymentReference = reference; order.paystackAccessCode = result.access_code; order.paymentStatus = 'pending'; await order.save(); res.json({ authorizationUrl: result.authorization_url, reference, orderId: order._id }); } catch (e) { next(e); } });
router.post('/payments/verify', auth, requireVerified, async (req, res, next) => { try { const reference = String(req.body?.reference || ''); if (!reference) return res.status(400).json({ error: 'Payment reference is required.' }); const order = await Order.findOne({ paymentReference: reference, buyer: req.user._id }); if (!order) return res.status(404).json({ error: 'Order for this payment was not found.' }); const tx = await paystack.verify(reference); if (tx.status !== 'success' || tx.currency !== 'NGN' || Number(tx.amount) !== Math.round(order.total * 100)) return res.status(400).json({ error: 'Payment has not been verified as successful for the expected amount.' }); await markPaid(order, tx); res.json({ message: 'Payment verified.', order: await Order.findById(order._id) }); } catch (e) { next(e); } });

async function bookShipments(order) {
  const sellerIds=[...new Set(order.items.map(i=>String(i.seller)))];
  const sellers=await User.find({_id:{$in:sellerIds}}).select('name phone email store');
  const products=await Product.find({_id:{$in:order.items.map(i=>i.product)}}).select('weightKg');
  for(const shipment of (order.shipments||[])) {
    if(shipment.reference || shipment.status==='booking_failed') continue;
    const seller=sellers.find(x=>String(x._id)===String(shipment.seller));
    if(!seller||!validatePickup(seller)){shipment.status='pickup_address_missing';continue;}
    const provider=shipment.provider==='iclose'?iclose:shipment.provider==='fez'?fez:null;
    if(!provider){shipment.status='booking_failed';shipment.bookingError='Unsupported courier provider';continue;}
    const lines=order.items.filter(i=>String(i.seller)===String(shipment.seller));
    const weightKg=Math.max(1,Math.ceil(lines.reduce((sum,i)=>sum+(products.find(p=>String(p._id)===String(i.product))?.weightKg||.5)*i.quantity,0)));
    try {
      const result=await provider.book({orderNumber:order.orderNumber,seller,destination:order.shippingAddress,itemValue:lines.reduce((sum,i)=>sum+i.unitPrice*i.quantity,0),weightKg,description:lines.map(i=>`${i.quantity} x ${i.name}`).join(', '),quote:shipment.quoteData});
      shipment.reference=result.reference;
      shipment.providerReference=result.reference;
      if(result.trackingCode) shipment.trackingCode=result.trackingCode;
      shipment.status=result.status||'booked'; shipment.lastUpdatedAt=new Date();
    } catch(e) { shipment.status='booking_failed'; shipment.bookingError=String(e.message||e).slice(0,500); console.error(`${shipment.provider} shipment booking failed:`,order.orderNumber,String(shipment.seller),e.message); }
  }
  const first=(order.shipments||[]).find(s=>s.reference);
  if(first) order.shipment={provider:first.provider,reference:first.reference,trackingUrl:first.trackingUrl,status:first.status,carrier:first.carrier,shippingFee:order.shippingFee,lastUpdatedAt:new Date()};
  await order.save();
}
async function markPaid(order) {
  const claimed = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: { $in: ['unpaid', 'pending'] } }, { $set: { paymentStatus: 'paid', status: 'paid', createdAtPaid: new Date() } }, { new: true });
  if (!claimed) return await Order.findById(order._id);
  for (const item of claimed.items) {
    const updated = await Product.findOneAndUpdate({ _id: item.product, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
    if (!updated) console.error('Paid order stock reconciliation requires admin review:', claimed.orderNumber, item.name);
  }
  await bookShipments(claimed);
  return await Order.findById(claimed._id);
}
router.post('/payments/paystack-webhook', express.raw({ type: 'application/json' }), async (req, res) => { const sig = req.headers['x-paystack-signature']; if (!paystack.validWebhook(req.body, sig)) return res.status(401).send('Invalid signature'); let event; try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).send('Invalid JSON'); } if (event.event === 'charge.success' && event.data?.reference) { try { const order = await Order.findOne({ paymentReference: event.data.reference }); if (order && event.data.status === 'success' && Number(event.data.amount) === Math.round(order.total * 100) && event.data.currency === 'NGN') await markPaid(order, event.data); } catch (e) { console.error('Paystack webhook reconciliation error:', e.message); return res.status(500).send('Retry later'); } } return res.sendStatus(200); });
router.get('/orders/mine', auth, requireVerified, async (req, res, next) => { try { const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }).lean(); res.json({ orders }); } catch (e) { next(e); } });
router.get('/orders/:id', auth, requireVerified, async (req, res, next) => { try { const order = await Order.findById(req.params.id).lean(); if (!order) return res.status(404).json({ error: 'Order not found.' }); if (req.user.role !== 'admin' && String(order.buyer) !== String(req.user._id) && !order.items.some(i => String(i.seller) === String(req.user._id))) return res.status(403).json({ error: 'You cannot view this order.' }); res.json({ order }); } catch (e) { next(e); } });

async function persistTrackingHistory(order, shipment, result) {
  const history = Array.isArray(result.history) ? result.history : [];
  const events = history.length ? history : [{
    status: result.status,
    description: `Tracking status synchronized from ${shipment.provider || "courier"}`,
    raw: result.raw || null
  }];

  for (const item of events) {
    if (!item || typeof item !== "object") continue;

    const status =
      item.status ||
      item.orderStatus ||
      item.trackingStatus ||
      item.event ||
      item.title ||
      result.status;

    const description =
      item.description ||
      item.message ||
      item.remark ||
      item.details ||
      item.statusDescription ||
      "";

    const location =
      item.location ||
      item.currentLocation ||
      item.address ||
      "";

    const eventTime =
      item.eventTime ||
      item.timestamp ||
      item.date ||
      item.createdAt ||
      item.time ||
      item.eventDate ||
      null;

    const eventId =
      item.eventId ||
      item.event_id ||
      item.id ||
      item.eventReference ||
      null;

    await saveTrackingEvent({
      orderId: order._id,
      shipmentId: shipment._id,
      eventId,
      status,
      description,
      location,
      eventTime,
      rawEvent: item,
      provider: shipment.provider
    });
  }
}

router.get('/orders/:id/tracking', auth, requireVerified, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const isAdmin = req.user.role === 'admin';
    const isBuyer = String(order.buyer) === String(req.user._id);
    const isSeller = order.items.some(i => String(i.seller) === String(req.user._id));

    if (!isAdmin && !isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You cannot track this order.' });
    }

    let shipments = (order.shipments || []).filter(s =>
      isAdmin || isBuyer || String(s.seller) === String(req.user._id)
    );

    if (!order.shipments?.length && order.shipment?.reference && (isAdmin || isBuyer)) {
      shipments = [order.shipment];
    }

    const updates = [];

    for (const shipment of shipments) {
      if (!shipment.reference) {
        updates.push({
          reference: null,
          status: shipment.status || 'awaiting_booking',
          message: 'A courier tracking reference has not been issued yet.'
        });
        continue;
      }

      try {
        const courier = shipment.provider === 'iclose' ? iclose : fez;
        const result = await courier.track(shipment.provider === 'iclose' ? (shipment.trackingCode || shipment.reference) : shipment.reference);

        await persistTrackingHistory(order, shipment, result);

        const normalized = normalizeStatus(result.status);
        if (normalized !== 'unknown') shipment.status = normalized;

        shipment.lastUpdatedAt = new Date();

        updates.push({
          reference: shipment.reference,
          status: shipment.status,
          synchronized: true
        });
      } catch (error) {
        updates.push({
          reference: shipment.reference,
          status: shipment.status,
          synchronized: false,
          message: `Unable to refresh this shipment from ${shipment.provider || 'courier'}.`,
          error: error.message
        });
      }
    }

    if (order.shipments?.length) {
      const first = order.shipments.find(s => s.reference);
      if (first) {
        order.shipment = {
          provider: first.provider,
          reference: first.reference,
          trackingUrl: first.trackingUrl,
          status: first.status,
          carrier: first.carrier,
          shippingFee: order.shippingFee,
          lastUpdatedAt: first.lastUpdatedAt
        };
      }
    }

    await order.save();

    const shipmentIds = shipments
      .filter(s => s._id)
      .map(s => s._id);

    const events = shipmentIds.length
      ? await ShipmentEvent.find({
          orderId: order._id,
          shipmentId: { $in: shipmentIds }
        }).sort({ eventTime: 1, createdAt: 1 }).lean()
      : [];

    res.json({
      orderNumber: order.orderNumber,
      shipment: isAdmin || isBuyer ? order.shipment : undefined,
      shipments,
      updates,
      events,
      orderStatus: order.status
    });
  } catch (error) {
    next(error);
  }
});


// Public shipment tracking. Never return buyer/seller personal information.
router.get('/track/:reference', async (req, res) => {
  try {
    const reference = String(req.params.reference || '').trim();

    if (!reference || reference.length > 120) {
      return res.status(400).json({ message: 'Enter a valid tracking reference.' });
    }

    const order = await Order.findOne({
      $or: [
        { 'shipment.reference': reference },
        { 'shipments.reference': reference },
        { 'shipments.trackingCode': reference }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Tracking reference not found.' });
    }

    let shipment = null;

    if (order.shipment && order.shipment.reference === reference) {
      shipment = order.shipment;
    } else if (Array.isArray(order.shipments)) {
      shipment = order.shipments.find(item => item.reference === reference || item.trackingCode === reference) || null;
    }

    if (!shipment) {
      return res.status(404).json({ message: 'Tracking reference not found.' });
    }

    let synchronized = false;

    // If the courier is temporarily unavailable, return saved tracking history.
    try {
      const courier = shipment.provider === 'iclose' ? iclose : fez;
      const result = await courier.track(shipment.provider === 'iclose' ? (shipment.trackingCode || reference) : reference);

      if (result && result.history) {
        await persistTrackingHistory(order, shipment, result);
      }

      const normalized = normalizeStatus(result && result.status);
      if (normalized) {
        shipment.status = normalized;
        shipment.lastUpdatedAt = new Date();
        order.markModified('shipment');
        order.markModified('shipments');
        await order.save();
      }

      synchronized = true;
    } catch (providerError) {
      console.error('Public tracking refresh failed:', providerError.message);
    }

    const eventQuery = { orderId: order._id };
    if (shipment._id) eventQuery.shipmentId = shipment._id;

    const events = await ShipmentEvent.find(eventQuery)
      .sort({ eventTime: -1, createdAt: -1 })
      .limit(50)
      .lean();

    const timeline = events.map(event => ({
      status: event.status,
      description: event.description || event.status,
      location: event.location || null,
      time: event.eventTime || event.createdAt
    }));

    return res.json({
      trackingReference: reference,
      status: shipment.status || 'pending',
      carrier: shipment.carrier || null,
      provider: shipment.provider || null,
      trackingUrl: shipment.trackingUrl || null,
      lastUpdatedAt: shipment.lastUpdatedAt || null,
      synchronized,
      events: timeline
    });
  } catch (error) {
    console.error('Public tracking lookup failed:', error.message);
    return res.status(500).json({ message: 'Unable to retrieve tracking information right now.' });
  }
});

router.get('/seller/shipments', auth, requireVerified, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { 'shipments.0': { $exists: true } }
      : { 'shipments.seller': req.user._id };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('buyer', 'name email')
      .lean();

    const shipments = [];

    for (const order of orders) {
      for (const shipment of order.shipments || []) {
        if (req.user.role !== 'admin' &&
            String(shipment.seller) !== String(req.user._id)) continue;

        const events = await ShipmentEvent.find({
          orderId: order._id,
          shipmentId: shipment._id
        }).sort({ eventTime: 1 }).lean();

        shipments.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          buyer: order.buyer,
          shipment,
          events
        });
      }
    }

    res.json({ shipments });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/shipments', auth, requireVerified, requireRole('admin'), async (req, res, next) => {
  try {
    const orders = await Order.find({
      'shipments.0': { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('buyer', 'name email')
      .lean();

    const shipments = [];

    for (const order of orders) {
      for (const shipment of order.shipments || []) {
        const events = await ShipmentEvent.find({
          orderId: order._id,
          shipmentId: shipment._id
        }).sort({ eventTime: 1 }).lean();

        shipments.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          buyer: order.buyer,
          shipment,
          events
        });
      }
    }

    res.json({ shipments });
  } catch (error) {
    next(error);
  }
});

router.get('/seller/orders', auth, requireVerified, requireRole('seller', 'admin'), async (req, res, next) => { try { const orders = await Order.find({ 'items.seller': req.user._id }).sort({ createdAt: -1 }).lean(); res.json({ orders }); } catch (e) { next(e); } });
router.patch('/seller/orders/:id/status', auth, requireVerified, requireRole('seller', 'admin'), async (req, res, next) => { try { const allowed = ['processing', 'shipped', 'delivered']; if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid order status.' }); const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ error: 'Order not found.' }); if (req.user.role !== 'admin' && !order.items.some(i => String(i.seller) === String(req.user._id))) return res.status(403).json({ error: 'You cannot update this order.' }); if (order.paymentStatus !== 'paid') return res.status(409).json({ error: 'Only paid orders can be processed.' }); order.status = req.body.status; await order.save(); res.json({ order }); } catch (e) { next(e); } });
router.get('/admin/orders', auth, requireVerified, requireRole('admin'), async (req, res, next) => { try { const orders = await Order.find().sort({ createdAt: -1 }).limit(200).populate('buyer', 'name email').lean(); res.json({ orders }); } catch (e) { next(e); } });

// iClose bookings can only be cancelled while the provider still reports them as booked.
router.post('/orders/:id/shipments/:shipmentId/cancel', auth, requireVerified, async (req,res,next)=>{ try {
  const order=await Order.findById(req.params.id); if(!order) return res.status(404).json({error:'Order not found.'});
  const shipment=(order.shipments||[]).id(req.params.shipmentId); if(!shipment) return res.status(404).json({error:'Shipment not found.'});
  const allowed=req.user.role==='admin'||String(order.buyer)===String(req.user._id)||String(shipment.seller)===String(req.user._id);
  if(!allowed) return res.status(403).json({error:'You cannot cancel this shipment.'});
  if(shipment.provider!=='iclose') return res.status(409).json({error:'Cancellation through this endpoint is only supported for iClose shipments.'});
  if(shipment.status!=='booked') return res.status(409).json({error:'iClose cancellation is only available while the shipment is booked.'});
  await iclose.cancel(shipment.providerReference||shipment.reference);
  shipment.status='cancelled'; shipment.lastUpdatedAt=new Date(); await order.save();
  return res.json({message:'iClose confirmed the cancellation.',shipment});
 } catch(e){ next(e); } });
module.exports = { router, markPaid, createProviderQuote, createAllCourierQuotes };
