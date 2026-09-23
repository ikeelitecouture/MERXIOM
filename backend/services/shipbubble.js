const SHIPBUBBLE_BASE_URL = "https://api.shipbubble.com/v1";

const getHeaders = () => {
  if (!process.env.SHIPBUBBLE_API_KEY) {
    throw new Error("SHIPBUBBLE_API_KEY is not configured");
  }

  return {
    Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`,
    "Content-Type": "application/json"
  };
};

const shipbubbleRequest = async (endpoint, options = {}) => {
  const response = await fetch(
    `${SHIPBUBBLE_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {})
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.message || "Shipbubble API request failed"
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const validateAddress = async ({
  name,
  email,
  phone,
  address
}) => {
  return shipbubbleRequest(
    "/shipping/address/validate",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        address
      })
    }
  );
};

const fetchShippingRates = async ({
  senderAddressCode,
  receiverAddressCode,
  pickupDate,
  categoryId,
  packageItems,
  packageDimension,
  deliveryInstructions
}) => {
  return shipbubbleRequest(
    "/shipping/fetch_rates",
    {
      method: "POST",
      body: JSON.stringify({
        sender_address_code: Number(senderAddressCode),
        reciever_address_code: Number(receiverAddressCode),
        pickup_date: pickupDate,
        category_id: Number(categoryId),
        package_items: packageItems,
        package_dimension: packageDimension,
        ...(deliveryInstructions
          ? { delivery_instructions: deliveryInstructions }
          : {})
      })
    }
  );
};


const createShipment = async ({
  requestToken,
  serviceCode,
  courierId
}) => {
  return shipbubbleRequest(
    "/shipping/labels",
    {
      method: "POST",
      body: JSON.stringify({
        request_token: requestToken,
        service_code: serviceCode,
        courier_id: courierId
      })
    }
  );
};

module.exports = {
  validateAddress,
  fetchShippingRates,
  createShipment
};
