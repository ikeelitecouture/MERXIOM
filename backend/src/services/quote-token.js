const crypto = require('node:crypto');

const TTL_MS = 10 * 60 * 1000;

function secret() {
  const value = String(process.env.JWT_SECRET || '');
  if (!value) {
    throw new Error('JWT_SECRET must be configured before delivery quotes can be issued.');
  }
  if (process.env.NODE_ENV === 'production' && value.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }
  return value;
}

function requestFingerprint(userId, items, destination) {
  const normalizedItems = (Array.isArray(items) ? items : []).map(item => ({
    productId: String(item.productId || item.product || ''),
    quantity: Math.floor(Number(item.quantity) || 0)
  })).sort((a, b) => a.productId.localeCompare(b.productId));
  const normalizedAddress = {};
  for (const key of ['recipient', 'phone', 'line1', 'line2', 'city', 'state', 'country']) {
    normalizedAddress[key] = String(destination?.[key] || '').trim().toLowerCase();
  }
  return crypto.createHash('sha256').update(JSON.stringify({
    userId: String(userId || ''),
    items: normalizedItems,
    destination: normalizedAddress
  })).digest('hex');
}

function createQuoteToken(payload) {
  const exp = Date.now() + TTL_MS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return { token: `${body}.${signature}`, expiresAt: exp };
}

function readQuoteToken(token) {
  try {
    if (typeof token !== 'string' || token.length > 12000) return null;
    const separator = token.lastIndexOf('.');
    if (separator <= 0) return null;
    const body = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    const actualBytes = Buffer.from(signature);
    const expectedBytes = Buffer.from(expected);
    if (actualBytes.length !== expectedBytes.length ||
        !crypto.timingSafeEqual(actualBytes, expectedBytes)) return null;
    const value = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!Number.isFinite(value.exp) || value.exp <= Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

module.exports = { TTL_MS, requestFingerprint, createQuoteToken, readQuoteToken };
