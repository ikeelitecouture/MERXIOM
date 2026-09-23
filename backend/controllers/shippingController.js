const {
  validateAddress,
  fetchShippingRates
} = require("../services/shipbubble");

const validateCustomerAddress = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      latitude,
      longitude
    } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and address are required"
      });
    }

    const result = await validateAddress({
      name,
      email,
      phone,
      address,
      latitude,
      longitude
    });

    res.json({
      success: true,
      message: "Address validated successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Shipbubble address validation error:", error.data || error.message);

    res.status(error.status || 500).json({
      success: false,
      message:
        error.data?.message ||
        error.message ||
        "Failed to validate address"
    });
  }
};

const getShippingRates = async (req, res) => {
  try {
    const {
      senderAddressCode,
      receiverAddressCode,
      pickupDate,
      categoryId,
      packageItems,
      packageDimension,
      deliveryInstructions
    } = req.body;

    if (
      !senderAddressCode ||
      !receiverAddressCode ||
      !pickupDate ||
      !categoryId ||
      !Array.isArray(packageItems) ||
      packageItems.length === 0 ||
      !packageDimension
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping rate information is required"
      });
    }

    const result = await fetchShippingRates({
      senderAddressCode,
      receiverAddressCode,
      pickupDate,
      categoryId,
      packageItems,
      packageDimension,
      deliveryInstructions
    });

    const requestToken =
      result?.data?.request_token ||
      result?.request_token ||
      "";

    const couriers = Array.isArray(
      result?.data?.couriers
    )
      ? result.data.couriers.map((courier) => ({
          ...courier,
          request_token: requestToken
        }))
      : [];

    res.json({
      success: true,
      message: "Shipping rates retrieved successfully",
      data: {
        ...result.data,
        request_token: requestToken,
        couriers
      }
    });
  } catch (error) {
    console.error("Shipbubble rate error:", error.data || error.message);

    res.status(error.status || 500).json({
      success: false,
      message:
        error.data?.message ||
        error.message ||
        "Failed to fetch shipping rates"
    });
  }
};

module.exports = {
  validateCustomerAddress,
  getShippingRates
};
