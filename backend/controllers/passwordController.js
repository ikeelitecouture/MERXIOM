const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../services/email");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    // Don't reveal whether the account exists.
    if (!user) {
      return res.json({
        success: true,
        message:
          "If an MERXIOM account exists with that email, a password reset link will be sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;

    // Token expires after 30 minutes.
    user.passwordResetExpires =
      new Date(Date.now() + 30 * 60 * 1000);

    await user.save();

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: rawToken
    });

    res.json({
      success: true,
      message:
        "If an MERXIOM account exists with that email, a password reset link will be sent."
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request"
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token and new password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: new Date()
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired password reset token"
      });
    }

    user.password = await bcrypt.hash(
      password,
      12
    );

    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully. You can now sign in."
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to reset password"
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword
};
