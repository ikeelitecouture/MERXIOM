const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    description: {
      type: String,
      default: ""
    },

    logo: {
      type: String,
      default: ""
    },

    shipping: {
      pickupAddress: {
        type: String,
        default: ""
      },

      city: {
        type: String,
        default: ""
      },

      state: {
        type: String,
        default: ""
      },

      phone: {
        type: String,
        default: ""
      },

      shipbubbleAddressCode: {
        type: Number,
        default: null
      },

      addressValidated: {
        type: Boolean,
        default: false
      },

      addressValidatedAt: {
        type: Date,
        default: null
      }
    },

    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Business", businessSchema);
