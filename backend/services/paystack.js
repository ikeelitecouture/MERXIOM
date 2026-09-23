const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const getHeaders = () => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json"
  };
};

const initializeTransaction = async ({
  email,
  amount,
  reference,
  callbackUrl,
  metadata
}) => {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email,
      amount: Math.round(Number(amount) * 100),
      reference,
      callback_url: callbackUrl,
      metadata
    },
    {
      headers: getHeaders()
    }
  );

  return response.data;
};

const verifyTransaction = async (reference) => {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: getHeaders()
    }
  );

  return response.data;
};

module.exports = {
  initializeTransaction,
  verifyTransaction
};
