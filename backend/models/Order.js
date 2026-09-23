const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    image: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item"
      }
    },

    delivery: {
      fullName: {
        type: String,
        required: true
      },

      phone: {
        type: String,
        required: true
      },

      address: {
        type: String,
        required: true
      },

      city: {
        type: String,
        required: true
      },

      state: {
        type: String,
        required: true
      }
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    platformFee: {
      type: Number,
      default: 0,
      min: 0
    },

    sellerAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },

    courier: {
      name: {
        type: String,
        default: ""
      },
      serviceCode: {
        type: String,
        default: ""
      },
      courierId: {
        type: String,
        default: ""
      },
      requestToken: {
        type: String,
        default: ""
      },
      amount: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    shipbubble: {
      orderId: {
        type: String,
        default: ""
      },
      trackingUrl: {
        type: String,
        default: ""
      },
      status: {
        type: String,
        default: ""
      },
      bookedAt: {
        type: Date,
        default: null
      }
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    paymentReference: {
      type: String,
      default: "",
      index: true
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
