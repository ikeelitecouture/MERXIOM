const fez = require('../fez');
const iclose = require('../iclose');

// Only these two couriers are exposed to checkout. Legacy Obana source is
// retained separately for migration; Chowdeck Relay and Gokada are not active.
const PROVIDERS = {
  fez: { id: 'fez', name: 'Fez Delivery', enabled: fez.enabled, quote: fez.quote, book: fez.book, track: fez.track },
  iclose: { id: 'iclose', name: 'iClose', enabled: iclose.enabled, quote: iclose.quote, book: iclose.book, track: iclose.track, cancel: iclose.cancel }
};

function normalizeOptions(providerId, result) {
  if (!Object.prototype.hasOwnProperty.call(PROVIDERS, providerId)) {
    throw new Error('Unsupported courier provider.');
  }
  const options = Array.isArray(result?.options) ? result.options :
    Array.isArray(result?.quotes) ? result.quotes : [];
  return {
    providerId,
    options: options.map(option => ({
      id: `${providerId}::${String(option.id || option.quote_id || option.reference || '')}`,
      providerOptionId: String(option.id || option.quote_id || option.reference || ''),
      providerId,
      provider: providerId,
      carrier_name: option.carrier_name || option.carrier?.name || option.provider_name || PROVIDERS[providerId].name,
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
  if (!providers.length) throw new Error('Neither Fez nor iClose is configured.');
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
