const crypto = require("node:crypto");
const ShipmentEvent = require("../models/ShipmentEvent");

function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  const mapping = {
    pending: "pending",
    booked: "booked",
    dispatched: "dispatched",
    picked_up: "picked_up",
    "picked up": "picked_up",
    in_transit: "in_transit",
    "in transit": "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    cancelled: "cancelled",
    failed: "failed",
    returned: "returned"
  };

  return mapping[status] || "unknown";
}

async function saveTrackingEvent(data) {
  const {
    orderId,
    shipmentId,
    eventId,
    status,
    description,
    location,
    eventTime,
    rawEvent
  } = data;

  const normalized = normalizeStatus(status);

  if (normalized === "unknown") {
    return { duplicate: false, event: null, ignored: true };
  }

  // Provider event IDs are preferred. When absent, create a stable
  // fingerprint so repeated tracking refreshes do not duplicate events.
  const stableEventId = eventId
    ? String(eventId)
    : crypto.createHash("sha256").update(JSON.stringify({
        orderId: String(orderId),
        shipmentId: String(shipmentId),
        status: normalized,
        description: description || "",
        location: location || "",
        rawEvent: rawEvent || null
      })).digest("hex");

  try {
    const event = await ShipmentEvent.create({
      orderId,
      shipmentId,
      provider: "fez",
      eventId: stableEventId,
      status: normalized,
      description: description || "",
      location: location || "",
      eventTime: eventTime && !Number.isNaN(Date.parse(eventTime))
        ? new Date(eventTime)
        : new Date(),
      rawEvent: rawEvent || null
    });

    return { duplicate: false, event };
  } catch (error) {
    if (error.code === 11000) {
      return { duplicate: true, event: null };
    }
    throw error;
  }
}

module.exports = {
  normalizeStatus,
  saveTrackingEvent
};
