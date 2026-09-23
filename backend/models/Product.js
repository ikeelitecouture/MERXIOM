const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    images: [
      {
        type: String
      }
    ],

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    shipping: {
      weight: {
        type: Number,
        default: 1,
        min: 0.01
      },

      length: {
        type: Number,
        default: 30,
        min: 1
      },

      width: {
        type: Number,
        default: 20,
        min: 1
      },

      height: {
        type: Number,
        default: 10,
        min: 1
      }
    },

    status: {
      type: String,
      enum: ["active", "draft", "out_of_stock"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
