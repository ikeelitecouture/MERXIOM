const express = require("express");

const {
  register,
  login,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} = require("../controllers/authController");

const {
  forgotPassword,
  resetPassword
} = require("../controllers/passwordController");

const passwordResetLimiter = require("../middleware/passwordResetLimiter");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);

router.post("/forgot-password", passwordResetLimiter, forgotPassword);

router.post(
  "/reset-password",
  resetPassword
);

module.exports = router;
