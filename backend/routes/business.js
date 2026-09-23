const express = require("express");
const protect = require("../middleware/auth");

const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  validateBusinessShippingAddress
} = require("../controllers/businessController");

const router = express.Router();

router.get("/mine", protect, getMyBusinesses);

router.get("/:businessId", getBusinessById);

router.post("/", protect, createBusiness);

router.post(
  "/:businessId/shipping/validate",
  protect,
  validateBusinessShippingAddress
);

module.exports = router;
