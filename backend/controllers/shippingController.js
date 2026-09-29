const { getQuote } = require("../services/obana");

const validateCustomerAddress = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country = "Nigeria"
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, address, city and state are required"
      });
    }

    res.json({
      success: true,
      message: "Delivery address accepted",
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        addressValidated: true
      }
    });
  } catch (error) {
    console.error(
      "Obana address validation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to validate address"
    });
  }
};

const getShippingRates = async (req, res) => {
  try {
    const {
      origin,
      destination,
      weightKg,
      declaredValue
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup and delivery locations are required"
      });
    }

    if (!origin.country || !origin.state || !origin.city) {
      return res.status(400).json({
        success: false,
        message:
          "Pickup country, state and city are required"
      });
    }

    if (
      !destination.country ||
      !destination.state ||
      !destination.city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery country, state and city are required"
      });
    }

    if (!Number(weightKg) || Number(weightKg) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "A valid package weight is required"
      });
    }

    const result = await getQuote({
      origin,
      destination,
      weightKg,
      declaredValue: declaredValue || 0
    });

    const options = Array.isArray(result?.data?.options)
      ? result.data.options
      : [];

    const couriers = options.map((option) => ({
      courier_name: option.carrier_name || "Obana Logistics",
      service_code: option.id || "",
      courier_id: option.id || "",
      service_level: option.service_level || "",
      eta: option.eta || "",
      total: Number(option.price || 0),
      amount: Number(option.price || 0),
      provider: "obana",
      quote_reference: result?.data?.reference || ""
    }));

    res.json({
      success: true,
      message: "Obana shipping rates retrieved successfully",
      data: {
        ...result.data,
        couriers
      }
    });
  } catch (error) {
    console.error(
      "Obana rate error:",
      error.message
    );

    res.status(502).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch shipping rates"
    });
  }
};

module.exports = {
  validateCustomerAddress,
  getShippingRates
};
