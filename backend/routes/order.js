const express = require("express");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getAdminStats,
  updateSellerOrderStatus
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/mine", protect, getMyOrders);

router.get("/admin/stats", adminOnly, getAdminStats);

router.get("/seller", protect, getSellerOrders);

router.patch("/:orderId/status", protect, updateSellerOrderStatus);

module.exports = router;
