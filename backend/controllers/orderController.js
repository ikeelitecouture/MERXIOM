const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const { items, delivery, deliveryFee, courier } = req.body;

    console.log("MERXIOM ORDER COURIER DEBUG:", {
      name: courier?.name,
      serviceCode: courier?.serviceCode,
      courierId: courier?.courierId,
      requestToken: courier?.requestToken,
      hasRequestToken: !!courier?.requestToken
    });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    if (
      !delivery ||
      !delivery.fullName ||
      !delivery.phone ||
      !delivery.address ||
      !delivery.city ||
      !delivery.state
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery information is required"
      });
    }

    const productIds = items.map((item) => item.productId);

    if (productIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product in cart"
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
      status: "active"
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are no longer available"
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find(
        (p) => p._id.toString() === item.productId
      );

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`
        });
      }

      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of ${product.name} are available`
        });
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        business: product.business,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.[0] || ""
      });
    }

    const shippingFee = Number(deliveryFee);

    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid delivery fee is required"
      });
    }

    if (!courier || !courier.name) {
      return res.status(400).json({
        success: false,
        message: "Please select a delivery courier"
      });
    }

    const platformFee = Number(
      (subtotal * 0.075).toFixed(2)
    );

    const sellerAmount = Number(
      (subtotal - platformFee).toFixed(2)
    );

    const total = subtotal + shippingFee;

    const orderReference =
      `MERXIOM-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    const order = await Order.create({
      orderReference,
      customer: req.user.userId,
      items: orderItems,
      delivery,
      subtotal,
      platformFee,
      sellerAmount,
      deliveryFee: shippingFee,
      courier: {
        name: courier.name,
        serviceCode: courier.serviceCode || "",
        courierId: courier.courierId || "",
        requestToken: courier.requestToken || "",
        amount: shippingFee
      },
      total
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user.userId
    })
      .populate("items.product", "name price images")
      .populate("items.business", "name slug")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "items.business": {
        $in: await require("../models/Business")
          .find({ owner: req.user.userId })
          .distinct("_id")
      }
    })
      .populate("customer", "name email")
      .populate("items.product", "name price images")
      .populate("items.business", "name slug")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders"
    });
  }
};



const getAdminStats = async (req, res) => {
  try {
    const User = require("../models/User");
    const Business = require("../models/Business");

    const [
      totalUsers,
      customers,
      sellers,
      businesses,
      totalOrders,
      paidOrders,
      revenueData
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "seller" }),
      Business.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid"
          }
        },
        {
          $group: {
            _id: null,
            gmv: { $sum: "$subtotal" },
            platformRevenue: { $sum: "$platformFee" },
            sellerEarnings: { $sum: "$sellerAmount" },
            shippingCollected: {
              $sum: "$deliveryFee"
            }
          }
        }
      ])
    ]);

    const revenue = revenueData[0] || {
      gmv: 0,
      platformRevenue: 0,
      sellerEarnings: 0,
      shippingCollected: 0
    };

    res.json({
      success: true,
      stats: {
        totalUsers,
        customers,
        sellers,
        businesses,
        totalOrders,
        paidOrders,
        gmv: Number(revenue.gmv || 0),
        platformRevenue: Number(
          revenue.platformRevenue || 0
        ),
        sellerEarnings: Number(
          revenue.sellerEarnings || 0
        ),
        shippingCollected: Number(
          revenue.shippingCollected || 0
        )
      }
    });
  } catch (error) {
    console.error(
      "Admin stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics"
    });
  }
};

module.exports.getAdminStats = getAdminStats;

const updateSellerOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const Business = require("../models/Business");

    const sellerBusinessIds = await Business.find({
      owner: req.user.userId
    }).distinct("_id");

    const order = await Order.findOne({
      _id: orderId,
      "items.business": { $in: sellerBusinessIds }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.orderStatus = status;
    await order.save();

    res.json({
      success: true,
      message: `Order marked as ${status}`,
      order
    });
  } catch (error) {
    console.error("Seller order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getAdminStats,
  updateSellerOrderStatus
};
