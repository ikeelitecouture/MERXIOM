const DEFAULT_BASE = 'https://obana-logistics-t6qg.onrender.com';
function base() { return (process.env.OBANA_BASE_URL || DEFAULT_BASE).replace(/\/$/, ''); }
async function request(path, { method='GET', body, auth=true }={}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    if (!process.env.OBANA_STORE_KEY) throw new Error('Obana shipment booking is not configured. Add OBANA_STORE_KEY after creating a store key in Obana Logistics.');
    headers.Authorization = `Bearer ${process.env.OBANA_STORE_KEY}`;
  }
  const r = await fetch(`${base()}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || `Obana request failed (${r.status})`);
  return data.data || data;
}
async function quote(payload) { return request('/routes/quote', { method: 'POST', body: payload, auth: false }); }
async function createShipment(payload) { return request('/shipments', { method: 'POST', body: payload, auth: true }); }
async function track(reference) { return request(`/shipments/track/${encodeURIComponent(reference)}`, { auth: true }); }
async function listShipments(query='') { return request(`/stores/me/shipments${query ? `?${query}` : ''}`, { auth: true }); }
module.exports = { quote, createShipment, track, listShipments };
