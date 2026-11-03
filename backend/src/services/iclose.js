const BASE = String(process.env.ICLOSE_API_BASE_URL || process.env.ICLOSE_BASE_URL || 'https://iclose.com.ng/api/v1').replace(/\/+$/, '');
const enabled = () => Boolean(String(process.env.ICLOSE_API_KEY || '').trim());
async function request(path, method='GET', payload) {
  if (!enabled()) throw new Error('iClose is not configured.');
  const response = await fetch(`${BASE}${path}`, { method, headers: {'X-API-Key':process.env.ICLOSE_API_KEY,Accept:'application/json','Content-Type':'application/json'}, ...(payload===undefined?{}:{body:JSON.stringify(payload)}), signal:AbortSignal.timeout(25000) });
  const body = await response.json().catch(()=>({}));
  if (!response.ok || body.success===false || body.status==='failed') throw new Error(body.message || body.error || `iClose HTTP ${response.status}`);
  return body.data || body;
}
const STATE_CODES = {'lagos':'ng-la'};
function stateCode(value) { const s=String(value||'').trim().toLowerCase(); if (/^ng-[a-z]{2}$/.test(s)) return s; if (!STATE_CODES[s]) throw new Error(`iClose state code for ${value} is not configured; confirm it with iClose.`); return STATE_CODES[s]; }
function addressOf(a={}) { return [a.line1,a.line2,a.city,a.state,a.country||'Nigeria'].filter(Boolean).join(', '); }
async function quote({seller,destination,weightKg}) {
  const pickup=seller?.store?.pickupAddress||{};
  if (!pickup.line1||!pickup.city||!pickup.state) throw new Error('Seller pickup address is incomplete.');
  if (!destination?.line1||!destination?.city||!destination?.state) throw new Error('Customer delivery address is incomplete.');
  const origin=addressOf(pickup), dropoff=addressOf(destination), state=stateCode(destination.state);
  const d=await request('/distance?'+new URLSearchParams({pickup:origin,dropoff}));
  const distanceKm=Number(d.distance_km??d.distance??d.kilometers);
  if (!Number.isFinite(distanceKm)||distanceKm<=0) throw new Error('iClose returned an invalid distance.');
  const f=await request('/delivery-fees?'+new URLSearchParams({service:'ecommerce',state,pickup:origin,dropoff,distance_km:String(distanceKm),weight_kg:String(Math.max(.1,Number(weightKg)||1))}));
  const price=Number(f.fee??f.delivery_fee??f.deliveryFee??f.amount??f.total);
  if (!Number.isFinite(price)||price<0) throw new Error('iClose returned an invalid delivery fee.');
  return {price,distanceKm,state,rateType:f.rate_type||'per_km'};
}
async function book({orderNumber,seller,destination,itemValue,weightKg,description,quote:q}) {
  const p=seller?.store?.pickupAddress||{};
  if (!q?.distanceKm||!q?.state) throw new Error('Saved iClose quote details are missing.');
  const result=await request('/orders','POST',{service:'ecommerce',rate_type:q.rateType||'per_km',reference:`${orderNumber}-${String(seller?._id||'seller').slice(-6)}`,state:q.state,origin_state:stateCode(p.state),destination_state:stateCode(destination.state),distance_km:q.distanceKm,pickup:addressOf(p),dropoff:addressOf(destination),sender:{name:p.contactName||seller.name,phone:p.phone||seller.phone,email:seller.email||'',city:p.city,state:stateCode(p.state),address:addressOf(p)},recipient:{name:destination.recipient,phone:destination.phone,city:destination.city,state:stateCode(destination.state),address:addressOf(destination)},parcel:{weight_kg:Number(weightKg)||1,description:description||`MERXIOM order ${orderNumber}`,value:Number(itemValue)||0}});
  const reference=result.booking_code||result.id||result.booking_id, trackingCode=result.tracking_code;
  if (!reference&&!trackingCode) throw new Error('iClose returned no booking or tracking code.');
  return {reference:String(reference||trackingCode),trackingCode:trackingCode?String(trackingCode):'',status:result.status||'booked',raw:result};
}
async function track(reference) { const r=await request(`/track/${encodeURIComponent(reference)}`); return {status:r.status||r.delivery_status||'unknown',history:Array.isArray(r.history)?r.history:[],raw:r}; }
async function cancel(reference) {
  if (!enabled()) throw new Error('iClose is not configured.');
  const response = await fetch(`${BASE}/orders/${encodeURIComponent(reference)}/cancel`, {
    method: 'POST',
    headers: {'X-API-Key':process.env.ICLOSE_API_KEY,Accept:'application/json','Content-Type':'application/json'},
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(25000)
  });
  const envelope = await response.json().catch(()=>({}));
  if (!response.ok || envelope.success === false || envelope.status === 'failed') {
    throw new Error(envelope.message || envelope.error || `iClose cancellation failed (HTTP ${response.status}).`);
  }
  const result = envelope.data || envelope;
  const status = String(result.status || result.delivery_status || result.cancellation_status || envelope.status || '').trim().toLowerCase();
  const confirmed = envelope.success === true || result.success === true ||
    result.cancelled === true || result.canceled === true ||
    ['cancelled','canceled','success','ok'].includes(status);
  if (!confirmed) throw new Error('iClose did not return an affirmative cancellation confirmation; the local shipment status was not changed.');
  return result;
}
module.exports={enabled,quote,book,track,cancel,stateCode};
