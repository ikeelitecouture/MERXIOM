const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null
    },

    lastMessage: {
      type: String,
      default: ""
    },

    lastMessageAt: {
      type: Date,
      default: null
    },

    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ product: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
