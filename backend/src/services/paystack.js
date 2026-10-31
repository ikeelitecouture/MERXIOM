const crypto = require('node:crypto');
const BASE = 'https://api.paystack.co';
function configured() { if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('Paystack is not configured. Add PAYSTACK_SECRET_KEY on the server.'); if (process.env.NODE_ENV === 'production' && process.env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')) throw new Error('Production is configured with a Paystack test key. Replace it with the live secret key before accepting real payments.'); }
async function call(path, body) {
  configured();
  const response = await fetch(`${BASE}${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok || !data.status) throw new Error(data.message || `Paystack request failed (${response.status})`);
  return data.data;
}
async function initialize({ email, amountNaira, reference, metadata, callbackUrl }) {
  if (!Number.isFinite(amountNaira) || amountNaira <= 0) throw new Error('Order total must be greater than zero.');
  return call('/transaction/initialize', { email, amount: Math.round(amountNaira * 100), currency: 'NGN', reference, metadata, callback_url: callbackUrl });
}
async function verify(reference) { return call(`/transaction/verify/${encodeURIComponent(reference)}`); }
function validWebhook(rawBody, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
}
module.exports = { initialize, verify, validWebhook };
