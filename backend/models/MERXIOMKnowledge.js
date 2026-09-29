const mongoose = require("mongoose");

const merxiomKnowledgeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    original: {
      type: String,
      required: true,
      trim: true,
    },

    meaning: {
      type: String,
      required: true,
      trim: true,
    },

    intent: {
      type: String,
      default: "general",
      trim: true,
    },

    examples: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      default: "learned",
      enum: [
        "learned",
        "local",
        "user",
        "ai",
        "research",
        "admin",
      ],
    },

    confidence: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MERXIOMKnowledge",
  merxiomKnowledgeSchema
);
