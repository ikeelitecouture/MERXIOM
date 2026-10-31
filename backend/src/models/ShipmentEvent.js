const mongoose = require("mongoose");

const ShipmentEventSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  provider: {
    type: String,
    default: "fez",
    required: true
  },
  eventId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },
  eventTime: {
    type: Date,
    default: Date.now
  },
  rawEvent: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

ShipmentEventSchema.index(
  { provider: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      eventId: { $type: "string" }
    }
  }
);

module.exports =
  mongoose.models.ShipmentEvent ||
  mongoose.model("ShipmentEvent", ShipmentEventSchema);
