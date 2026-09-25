const Business = require("../models/Business");
const { validateAddress } = require("../services/shipbubble");

const createBusiness = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Business name and slug are required"
      });
    }

    const existing = await Business.findOne({ slug });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "That store URL is already taken"
      });
    }

    const business = await Business.create({
      owner: req.user.userId,
      name,
      slug,
      description
    });

    res.status(201).json({
      success: true,
      message: "MERXIOM store created",
      business
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create store"
    });
  }
};

const getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({
      owner: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: businesses.length,
      businesses
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your stores"
    });
  }
};

const getBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId).select(
      "name slug shipping"
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    res.json({
      success: true,
      business
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch business"
    });
  }
};

const validateBusinessShippingAddress = async (req, res) => {
  try {
    const { businessId } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      state
    } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and pickup address are required"
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      owner: req.user.userId
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    const fullAddress = [address, city, state, "Nigeria"]
      .filter(Boolean)
      .join(", ");

    const result = await validateAddress({
      name,
      email,
      phone,
      address: fullAddress
    });

    const addressData = result?.data;

    if (!addressData?.address_code) {
      return res.status(502).json({
        success: false,
        message: "Shipbubble did not return a valid address code",
        data: addressData || null
      });
    }

    business.shipping = {
      pickupAddress: address,
      city: city || "",
      state: state || "",
      phone,
      shipbubbleAddressCode: Number(addressData.address_code),
      addressValidated: true,
      addressValidatedAt: new Date()
    };

    await business.save();

    res.json({
      success: true,
      message: "Business pickup address validated successfully",
      shipping: business.shipping,
      shipbubble: addressData
    });
  } catch (error) {
    console.error(
      "Business shipping validation error:",
      error.data || error.message
    );

    res.status(error.status || 500).json({
      success: false,
      message:
        error.data?.message ||
        error.message ||
        "Failed to validate business pickup address"
    });
  }
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  validateBusinessShippingAddress
};
