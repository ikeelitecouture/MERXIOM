const BASE = () => {
  const configured = String(
    process.env.FEZ_API_BASE_URL || 'https://api.fezdelivery.co/v1'
  ).trim().replace(/\/+$/, '');

  return /\/v1$/i.test(configured) ? configured : `${configured}/v1`;
};

let authCache = {
  token: '',
  secret: '',
  expiresAt: 0
};

function enabled() {
  return Boolean(
    process.env.FEZ_USER_ID &&
    process.env.FEZ_PASSWORD
  );
}

async function authenticate(force = false) {
  if (
    !force &&
    authCache.token &&
    authCache.secret &&
    authCache.expiresAt > Date.now() + 60000
  ) {
    return authCache;
  }

  if (!enabled()) {
    throw new Error(
      'Fez credentials are incomplete. Configure FEZ_USER_ID and FEZ_PASSWORD in backend/.env.'
    );
  }

  const response = await fetch(`${BASE()}/user/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      user_id: process.env.FEZ_USER_ID,
      password: process.env.FEZ_PASSWORD
    }),
    signal: AbortSignal.timeout(20000)
  });

  const body = await response.json().catch(() => ({}));

  if (
    !response.ok ||
    String(body.status || '').toLowerCase() !== 'success'
  ) {
    throw new Error(
      body.description ||
      `Fez authentication failed (HTTP ${response.status}).`
    );
  }

  const auth = body.authDetails || {};

  // Prefer the organisation secret returned by Fez.
  // FEZ_SECRET_KEY is an explicit override, not the API key.
  const secret =
    process.env.FEZ_SECRET_KEY ||
    body.orgDetails?.['secret-key'];

  if (!auth.authToken || !secret) {
    throw new Error(
      'Fez authentication succeeded, but the required auth token or organisation secret-key is missing. Check your Fez account configuration.'
    );
  }

  const expiry = auth.expireToken
    ? new Date(auth.expireToken).getTime()
    : Date.now() + 50 * 60 * 1000;

  authCache = {
    token: auth.authToken,
    secret,
    expiresAt: Number.isFinite(expiry)
      ? expiry
      : Date.now() + 50 * 60 * 1000
  };

  return authCache;
}

async function request(path, method = 'GET', payload, retry = true) {
  const auth = await authenticate();

  const response = await fetch(`${BASE()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'secret-key': auth.secret,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...(payload === undefined
      ? {}
      : { body: JSON.stringify(payload) }),
    signal: AbortSignal.timeout(25000)
  });

  // Refresh the token once if Fez rejects the current authentication.
  if (response.status === 401 && retry) {
    authCache = {
      token: '',
      secret: '',
      expiresAt: 0
    };

    await authenticate(true);
    return request(path, method, payload, false);
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.description ||
      body.message ||
      `Fez API returned HTTP ${response.status}.`
    );
  }

  if (
    body.status &&
    !['success', 'ok'].includes(String(body.status).toLowerCase())
  ) {
    throw new Error(
      body.description ||
      body.message ||
      'Fez rejected the request.'
    );
  }

  return body;
}

async function quote({ destinationState, pickupState, weightKg }) {
  if (!destinationState) {
    throw new Error('A destination state is required for a Fez quote.');
  }

  const weight = Math.max(
    1,
    Math.ceil(Number(weightKg) || 1)
  );

  const response = await request('/order/cost', 'POST', {
    state: destinationState,
    ...(pickupState ? { pickUpState: pickupState } : {}),
    weight
  });

  const data = response.data || response;

  const costValue = data.cost?.cost ?? data.cost ??
    data.deliveryCost ?? data.delivery_cost;

  const cost = Number(costValue);
  const vat = Number(
    data.vat?.vatAmount ??
    data.vatAmount ??
    data.vat_amount ??
    0
  );

  const total = Number(
    data.totalCost ??
    data.total_cost ??
    (cost + vat)
  );

  if (!Number.isFinite(total) || total < 0) {
    throw new Error('Fez returned an invalid delivery price.');
  }

  return {
    price: total,
    currency: 'NGN',
    raw: data
  };
}

async function book({
  orderNumber,
  seller,
  destination,
  itemValue,
  weightKg,
  description
}) {
  const pickup = seller?.store?.pickupAddress || {};

  const requiredPickup = [
    ['pickup contact name', pickup.contactName],
    ['pickup phone', pickup.phone],
    ['pickup address', pickup.line1],
    ['pickup city', pickup.city],
    ['pickup state', pickup.state]
  ];

  const missingPickup = requiredPickup
    .filter(([, value]) => !String(value || '').trim())
    .map(([name]) => name);

  if (missingPickup.length) {
    throw new Error(
      `Seller pickup details are incomplete: ${missingPickup.join(', ')}.`
    );
  }

  const requiredDestination = [
    ['recipient name', destination?.recipient],
    ['recipient phone', destination?.phone],
    ['delivery address', destination?.line1],
    ['delivery city', destination?.city],
    ['delivery state', destination?.state]
  ];

  const missingDestination = requiredDestination
    .filter(([, value]) => !String(value || '').trim())
    .map(([name]) => name);

  if (missingDestination.length) {
    throw new Error(
      `Delivery details are incomplete: ${missingDestination.join(', ')}.`
    );
  }

  const sellerId = String(seller?._id || 'seller').slice(-6);
  const requestId = `${orderNumber}-${sellerId}`;

  const senderAddress = [
    pickup.line1,
    pickup.line2,
    pickup.city,
    pickup.state
  ].filter(Boolean).join(', ');

  const recipientAddress = [
    destination.line1,
    destination.line2,
    destination.city,
    destination.state
  ].filter(Boolean).join(', ');

  const payload = [{
    recipientAddress,
    recipientState: destination.state,
    recipientName: destination.recipient,
    recipientPhone: destination.phone,
    uniqueID: requestId,
    BatchID: String(orderNumber),
    valueOfItem: Number(itemValue) || 0,
    weight: Math.max(1, Math.ceil(Number(weightKg) || 1)),
    pickUpState: pickup.state,
    pickUpAddress: senderAddress,
    thirdparty: 'true',
    senderName: pickup.contactName,
    senderAddress,
    senderPhone: pickup.phone,
    itemDescription: String(
      description || 'MERXIOM order'
    ).slice(0, 250)
  }];

  const response = await request('/order', 'POST', payload);
  const data = response.data || response;

  const orders =
    data.orderNos ??
    data.orderNo ??
    data.orders ??
    response.orderNos ??
    response.orderNo;

  let reference = '';

  if (typeof orders === 'string' || typeof orders === 'number') {
    reference = String(orders);
  } else if (Array.isArray(orders)) {
    const matching = orders.find(item =>
      String(item.uniqueID || item.uniqueId || '') === requestId
    );

    const first = matching || orders[0];

    if (first) {
      reference = String(
        first.orderNo ||
        first.orderNumber ||
        first.reference ||
        first.id ||
        ''
      );
    }
  } else if (orders && typeof orders === 'object') {
    reference = String(
      orders[requestId] ||
      Object.values(orders)[0] ||
      ''
    );
  }

  if (!reference || reference === 'undefined') {
    throw new Error(
      'Fez returned a response without a usable shipment order number. Check the Fez order dashboard before attempting another booking.'
    );
  }

  return {
    reference,
    status: data.status || 'booked',
    raw: data
  };
}

async function track(reference) {
  if (!reference) {
    throw new Error('A Fez shipment reference is required for tracking.');
  }

  const response = await request(
    `/order/track/${encodeURIComponent(reference)}`,
    'GET'
  );

  const data =
    response.data?.order ||
    response.data ||
    response.order ||
    response;

  return {
    status: data.orderStatus || data.status || 'unknown',
    history: Array.isArray(data.history) ? data.history : [],
    raw: data
  };
}

module.exports = {
  enabled,
  authenticate,
  quote,
  book,
  track,
  _resetAuthCache: () => {
    authCache = {
      token: '',
      secret: '',
      expiresAt: 0
    };
  }
};
