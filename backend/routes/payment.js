const express = require("express");
const protect = require("../middleware/auth");

const {
  initializePayment,
  verifyPayment
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.get("/verify/:reference", protect, verifyPayment);

module.exports = router;
