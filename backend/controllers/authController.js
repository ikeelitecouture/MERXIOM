const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === "seller" ? "seller" : "customer"
    });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "MERXIOM account created",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};



const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      addresses: user.addresses || []
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load saved addresses"
    });
  }
};

const addAddress = async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      address,
      city,
      state,
      addressCode,
      isDefault
    } = req.body;

    if (!fullName || !phone || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, address, city and state are required"
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const shouldBeDefault =
      Boolean(isDefault) || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    user.addresses.push({
      label: label || "Home",
      fullName,
      phone,
      address,
      city,
      state,
      addressCode: addressCode || null,
      isDefault: shouldBeDefault
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error("Add address error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save address"
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const savedAddress = user.addresses.id(req.params.id);

    if (!savedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    const {
      label,
      fullName,
      phone,
      address,
      city,
      state,
      addressCode,
      isDefault
    } = req.body;

    if (!fullName || !phone || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, address, city and state are required"
      });
    }

    if (Boolean(isDefault)) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    savedAddress.label = label || "Home";
    savedAddress.fullName = fullName;
    savedAddress.phone = phone;
    savedAddress.address = address;
    savedAddress.city = city;
    savedAddress.state = state;
    savedAddress.addressCode = addressCode || null;

    if (Boolean(isDefault)) {
      savedAddress.isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      address: savedAddress
    });
  } catch (error) {
    console.error("Update address error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update address"
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const savedAddress = user.addresses.id(req.params.id);

    if (!savedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    const wasDefault = savedAddress.isDefault;

    savedAddress.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("Delete address error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete address"
    });
  }
};

module.exports = {
  register,
  login,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};
