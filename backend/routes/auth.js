const express = require("express");

const {
  register,
  login
} = require("../controllers/authController");

const {
  forgotPassword,
  resetPassword
} = require("../controllers/passwordController");

const passwordResetLimiter = require("../middleware/passwordResetLimiter");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", passwordResetLimiter, forgotPassword);

router.post(
  "/reset-password",
  resetPassword
);

module.exports = router;
