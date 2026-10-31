const obana = require('../obana');
const fez = require('../fez');

const PROVIDERS = {
  obana: {
    id: 'obana',
    name: 'Obana Logistics',
    enabled: () => Boolean(process.env.OBANA_BASE_URL || process.env.OBANA_STORE_KEY),
    async quote(input) {
      const result = await obana.quote({
        origin: input.origin,
        destination: input.destination,
        weight_kg: input.weightKg,
        declared_value: input.declaredValue,
        display_currency: 'NGN'
      });
      return normalizeOptions('obana', result);
    },
    async book(input) {
      return obana.createShipment(input);
    },
    async track(reference) { return obana.track(reference); }
  },
  'chowdeck-relay': chowdeckRelayProvider(),
  gokada: restProvider('gokada', 'GOKADA'),
  fez: { id: 'fez', name: 'Fez Delivery', enabled: fez.enabled, quote: fez.quote, book: fez.book, track: fez.track }
};

function chowdeckRelayProvider() {
  const base = () => String(process.env.CHOWDECK_RELAY_API_BASE_URL || 'https://api.relay.chowdeck.com/relay').trim().replace(/\/+$/, '');
  const key = () => String(process.env.CHOWDECK_RELAY_API_KEY || '').trim();
  async function request(path, method, payload) {
    if (!key()) throw new Error('Chowdeck Relay is not configured. Add CHOWDECK_RELAY_API_KEY.');
    const response = await fetch(`${base()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status === 'failed') throw new Error(data.message || `Chowdeck Relay API returned HTTP ${response.status}.`);
    return data.data || data;
  }
  return {
    id: 'chowdeck-relay', name: 'Chowdeck Relay',
    enabled: () => Boolean(key()),
    async quote(input) {
      const result = await request('/delivery/fee', 'POST', {
        source_address_string: input.origin.address,
        destination_address_string: input.destination.address,
        estimated_order_amount: Math.round(Number(input.declaredValue || 0) * 100)
      });
      const option = {
        id: String(result.id || result.fee_id || ''),
        price: Number(result.total_amount ?? result.delivery_amount ?? result.amount) / 100,
        carrier_name: 'Chowdeck Relay',
        service_level: 'On-demand package delivery',
        eta: result.eta || result.estimated_delivery || ''
      };
      return normalizeOptions('chowdeck-relay', { options: [option], cheapest_id: option.id });
    },
    async book(input) {
      const source = input.pickup_address || {};
      const destination = input.delivery_address || {};
      const result = await request('/delivery', 'POST', {
        fee_id: Number(input.quote_option_id),
        reference: input.order_id,
        item_type: 'package',
        user_action: 'sending',
        source_contact: {
          name: source.contact_name || 'MERXIOM Dispatch',
          phone: source.phone || '',
          country_code: 'NG'
        },
        destination_contact: {
          name: `${destination.first_name || ''} ${destination.last_name || ''}`.trim(),
          phone: destination.phone || '',
          country_code: 'NG'
        },
        estimated_order_amount: Math.round(Number(input.declared_value || 0) * 100),
        customer_delivery_note: `${destination.line1 || ''} ${destination.line2 || ''}, ${destination.city || ''}, ${destination.state || ''}`.trim()
      });
      return {
        ...result,
        reference: result.reference || String(result.id || input.order_id),
        tracking_url: result.tracking_url || '',
        shipping_fee: Number(result.delivery_price ?? result.total_amount ?? 0) / 100
      };
    },
    async track(reference) { return request(`/delivery/${encodeURIComponent(reference)}`, 'GET'); }
  };
}

function restProvider(id, prefix) {
  const name = {
    'chowdeck-relay': 'Chowdeck Relay',
    gokada: 'Gokada',
    fez: 'Fez'
  }[id];
  const base = () => String(process.env[`${prefix}_API_BASE_URL`] || '').trim().replace(/\/+$/, '');
  const key = () => String(process.env[`${prefix}_API_KEY`] || '').trim();
  return {
    id, name,
    enabled: () => Boolean(base() && key()),
    async request(path, method, payload) {
      if (!base() || !key()) throw new Error(`${name} is not configured. Add ${prefix}_API_BASE_URL and ${prefix}_API_KEY.`);
      const response = await fetch(`${base()}${path}`, {
        method,
        headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`${name} API returned HTTP ${response.status}.`);
      return data.data || data;
    },
    async quote(input) {
      // This adapter contract is for an API-compatible provider gateway or a
      // provider API confirmed to support this shape. It does not guess vendor APIs.
      return normalizeOptions(id, await this.request('/quotes', 'POST', {
        origin: input.origin,
        destination: input.destination,
        weight_kg: input.weightKg,
        declared_value: input.declaredValue,
        currency: 'NGN'
      }));
    },
    async book(input) {
      return this.request('/shipments', 'POST', input);
    },
    async track(reference) {
      return this.request(`/shipments/${encodeURIComponent(reference)}`, 'GET');
    }
  };
}

function normalizeOptions(providerId, result) {
  const options = Array.isArray(result?.options) ? result.options :
    Array.isArray(result?.quotes) ? result.quotes : [];
  return {
    providerId,
    options: options.map(option => ({
      id: `${providerId}::${String(option.id || option.quote_id || option.reference || '')}`,
      providerOptionId: String(option.id || option.quote_id || option.reference || ''),
      providerId,
      provider: providerId,
      carrier_name: option.carrier_name || option.carrier?.name || option.provider_name || PROVIDERS[providerId]?.name || providerId,
      service_level: option.service_level || option.service || '',
      transport_mode: option.transport_mode || '',
      eta: option.eta || option.estimated_delivery || '',
      price: Number(option.price ?? option.amount ?? option.fee),
      raw: option
    })).filter(option => option.providerOptionId && Number.isFinite(option.price) && option.price >= 0),
    cheapest_id: result?.cheapest_id ? `${providerId}::${result.cheapest_id}` : undefined
  };
}

function get(id) { return PROVIDERS[id] || null; }
function listConfigured() { return Object.values(PROVIDERS).filter(provider => provider.enabled()); }

async function quoteAll(input) {
  const providers = listConfigured();
  if (!providers.length) throw new Error('No courier provider is configured. Configure Obana or a supported courier adapter.');
  const settled = await Promise.allSettled(providers.map(async provider => ({
    providerId: provider.id,
    providerName: provider.name,
    ...await provider.quote(input)
  })));
  const quotes = settled.filter(item => item.status === 'fulfilled').map(item => item.value);
  const failures = settled.filter(item => item.status === 'rejected').map(item => item.reason?.message || 'Provider unavailable');
  const options = quotes.flatMap(quote => quote.options);
  if (!options.length) {
    const err = new Error(`No courier returned a usable quote.${failures.length ? ` ${failures.join(' ')}` : ''}`);
    err.status = 502;
    throw err;
  }
  options.sort((a, b) => a.price - b.price);
  return { options, cheapest_id: options[0].id, providers: quotes.map(q => ({ id: q.providerId, name: q.providerName, options: q.options.length })), warnings: failures };
}

module.exports = { get, listConfigured, quoteAll, normalizeOptions };
