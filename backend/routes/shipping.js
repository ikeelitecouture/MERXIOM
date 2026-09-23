const express = require("express");
const protect = require("../middleware/auth");

const {
  validateCustomerAddress,
  getShippingRates
} = require("../controllers/shippingController");

const router = express.Router();

router.post("/validate-address", protect, validateCustomerAddress);

router.post("/rates", protect, getShippingRates);

module.exports = router;
