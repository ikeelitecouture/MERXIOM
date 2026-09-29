const OBANA_BASE_URL =
  process.env.OBANA_BASE_URL ||
  "https://obana-logistics-t6qg.onrender.com";

function getHeaders() {
  if (!process.env.OBANA_API_KEY) {
    throw new Error("OBANA_API_KEY is not configured");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OBANA_API_KEY}`,
  };
}

async function obanaRequest(path, options = {}) {
  const response = await fetch(`${OBANA_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === "error") {
    throw new Error(
      data.message || `Obana request failed (${response.status})`
    );
  }

  return data;
}

async function getStore() {
  return obanaRequest("/stores/me");
}

async function getShipments(page = 1, limit = 20) {
  return obanaRequest(
    `/stores/me/shipments?page=${page}&limit=${limit}`
  );
}

async function getQuote({
  origin,
  destination,
  weightKg,
  declaredValue,
}) {
  return obanaRequest("/routes/quote", {
    method: "POST",
    body: JSON.stringify({
      origin,
      destination,
      weight_kg: Number(weightKg),
      declared_value: Number(declaredValue),
    }),
  });
}

module.exports = {
  getStore,
  getShipments,
  getQuote,
};
