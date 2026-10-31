const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const opts = { timestamps: true, strict: true };

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true, default: '' },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['buyer','seller','admin'], default: 'buyer', index: true },
  emailVerified: { type: Boolean, default: false },
  verificationCodeHash: String,
  verificationExpiresAt: Date,
  resetCodeHash: String,
  resetExpiresAt: Date,
  addresses: [{ label: String, recipient: String, phone: String, line1: String, line2: String, city: String, state: String, country: { type: String, default: 'Nigeria' }, isDefault: Boolean }],
  store: { name: String, description: String, logoUrl: String, verified: { type: Boolean, default: false }, pickupAddress: { contactName: String, phone: String, line1: String, line2: String, city: String, state: String, country: { type: String, default: 'Nigeria' } } }
}, opts);

const categorySchema = new Schema({ name: { type: String, required: true, unique: true }, slug: { type: String, required: true, unique: true }, parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, active: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 }, attributes: [{ key: String, label: String, type: { type: String, enum: ['text','select','number','boolean'], default: 'text' }, options: [String], required: Boolean }], imageUrl: String }, opts);

const productSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storeName: { type: String, required: true, trim: true },
  isOwnerStore: { type: Boolean, default: false, index: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, index: true },
  description: { type: String, required: true, maxlength: 10000 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  currency: { type: String, default: 'NGN', enum: ['NGN'] },
  images: [{ url: String, alt: String }],
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, trim: true },
  status: { type: String, enum: ['draft','active','paused','archived'], default: 'active', index: true },
  isPopular: { type: Boolean, default: false, index: true },
  attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
  variants: [{ sku: String, size: String, color: String, attributes: { type: Map, of: Schema.Types.Mixed }, stock: { type: Number, min: 0, default: 0 }, price: Number }],
  weightKg: { type: Number, min: 0.1, default: 0.5 },
  moderationNote: String
}, opts);
productSchema.index({ name: 'text', description: 'text', storeName: 'text' });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true }, buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, seller: { type: Schema.Types.ObjectId, ref: 'User' }, name: String, imageUrl: String, quantity: Number, unitPrice: Number, variant: Schema.Types.Mixed }],
  subtotal: { type: Number, required: true }, shippingFee: { type: Number, required: true, default: 0 }, total: { type: Number, required: true }, currency: { type: String, default: 'NGN' },
  shippingAddress: { recipient: String, phone: String, line1: String, line2: String, city: String, state: String, country: { type: String, default: 'Nigeria' } },
  status: { type: String, enum: ['pending_payment','paid','processing','shipped','delivered','cancelled','refunded'], default: 'pending_payment', index: true },
  paymentStatus: { type: String, enum: ['unpaid','pending','paid','failed','refunded'], default: 'unpaid', index: true },
  paymentReference: String, paystackAccessCode: String,
  shipment: { provider: String, reference: String, trackingUrl: String, status: String, carrier: String, shippingFee: Number, quoteOptionId: String, lastUpdatedAt: Date },
  shipments: [{ seller: { type: Schema.Types.ObjectId, ref: 'User' }, provider: String, reference: String, status: String, carrier: String, shippingFee: Number, weightKg: Number, trackingUrl: String, lastUpdatedAt: Date }],
  createdAtPaid: Date
}, opts);

const rfqSchema = new Schema({ reference: { type: String, unique: true, required: true }, title: { type: String, required: true }, buyerName: String, buyerEmail: String, source: { type: String, default: 'internal' }, items: [{ productName: String, quantity: Number, specifications: String }], destination: String, targetBudget: Number, currency: { type: String, default: 'NGN' }, status: { type: String, enum: ['new','sourcing','quoted','accepted','fulfilled','declined'], default: 'new', index: true }, supplierQuotes: [{ supplier: String, unitCost: Number, quantity: Number, leadTime: String, notes: String }], customerUnitPrice: Number, estimatedOtherCosts: Number, notes: String }, opts);
const supportTicketSchema = new Schema({ name:{type:String,required:true,trim:true}, email:{type:String,required:true,lowercase:true,trim:true}, subject:{type:String,required:true,trim:true}, message:{type:String,required:true,maxlength:12000}, user:{type:Schema.Types.ObjectId,ref:'User',default:null}, status:{type:String,enum:['open','in_progress','resolved','closed'],default:'open',index:true}, adminNotes:String }, opts);
const conversationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, default: 'New conversation' }, messages: [{ role: { type: String, enum: ['user','assistant'], required: true }, content: { type: String, required: true, maxlength: 12000 }, createdAt: { type: Date, default: Date.now } }] }, opts);
const brainMemorySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scope: { type: String, enum: ['private_user','private_business'], required: true, default: 'private_user' },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, opts);
brainMemorySchema.index({ owner: 1, updatedAt: -1 });

module.exports = {
  User: model('User', userSchema), Category: model('Category', categorySchema), Product: model('Product', productSchema), Order: model('Order', orderSchema), RFQ: model('RFQ', rfqSchema), Conversation: model('Conversation', conversationSchema), SupportTicket: model('SupportTicket', supportTicketSchema), BrainMemory: model('BrainMemory', brainMemorySchema)
};
