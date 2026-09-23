const Product = require("../models/Product");
const Business = require("../models/Business");

const createProduct = async (req, res) => {
  try {
    const {
      businessId,
      name,
      description,
      price,
      category,
      stock,
      images
    } = req.body;

    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/products/${file.filename}`
    );

    if (!businessId || !name || price === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: "Business, name, price and category are required"
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      owner: req.user.userId
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        message: "You do not own this store"
      });
    }

    const product = await Product.create({
      business: businessId,
      name,
      description: description || "",
      price,
      category,
      stock: stock || 0,
      images: uploadedImages,
      status: "active"
    });

    res.status(201).json({
      success: true,
      message: "Product created",
      product
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create product"
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .populate("business", "name slug logo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const businesses = await Business.find({
      owner: req.user.userId
    }).select("_id");

    const businessIds = businesses.map((business) => business._id);

    const products = await Product.find({
      business: { $in: businessIds }
    })
      .populate("business", "name slug logo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your products"
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const business = await Business.findOne({
      _id: product.business,
      owner: req.user.userId
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        message: "You do not own this product"
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
      "images",
      "status"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.files && req.files.length > 0) {
      product.images = req.files.map(
        (file) => `/uploads/products/${file.filename}`
      );
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated",
      product
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const business = await Business.findOne({
      _id: product.business,
      owner: req.user.userId
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        message: "You do not own this product"
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product deleted"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getMyProducts,
  updateProduct,
  deleteProduct
};
