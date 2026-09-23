const Order = require("../models/Order");
const User = require("../models/User");
const {
  initializeTransaction,
  verifyTransaction
} = require("../services/paystack");

const {
  createShipment
} = require("../services/shipbubble");

const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid for"
      });
    }

    const user = await User.findById(req.user.userId).select("email");

    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email could not be found"
      });
    }

    const reference = `AXIOM-${order._id}-${Date.now()}`;

    const result = await initializeTransaction({
      email: user.email,
      amount: order.total,
      reference,
      callbackUrl: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        orderId: order._id.toString(),
        customerId: req.user.userId.toString()
      }
    });

    if (!result.status || !result.data?.authorization_url) {
      return res.status(502).json({
        success: false,
        message: result.message || "Unable to initialize payment"
      });
    }

    order.paymentReference = reference;
    await order.save();

    res.json({
      success: true,
      message: "Payment initialized",
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
      reference
    });
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to initialize payment"
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required"
      });
    }

    const result = await verifyTransaction(reference);

    if (
      !result.status ||
      result.data?.status !== "success"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed",
        status: result.data?.status || "unknown"
      });
    }

    const order = await Order.findOne({
      paymentReference: reference,
      customer: req.user.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order linked to this payment was not found"
      });
    }

    if (Number(result.data.amount) !== Math.round(order.total * 100)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match the order total"
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";

    await order.save();

    // Create the Shipbubble shipment after successful payment.
    // Only attempt booking when a shipment has not already been created.
    if (
      !order.shipbubble?.orderId &&
      order.courier?.requestToken &&
      order.courier?.serviceCode &&
      order.courier?.courierId
    ) {
      try {
        const shipment = await createShipment({
          requestToken: order.courier.requestToken,
          serviceCode: order.courier.serviceCode,
          courierId: order.courier.courierId
        });

        const shipmentData = shipment?.data || {};

        order.shipbubble = {
          orderId: String(
            shipmentData.order_id ||
            shipmentData.id ||
            ""
          ),
          trackingUrl:
            shipmentData.tracking_url ||
            shipmentData.trackingUrl ||
            "",
          status:
            shipmentData.status ||
            "",
          bookedAt: new Date()
        };

        order.orderStatus = "shipped";

        await order.save();
      } catch (shippingError) {
        console.error(
          "Shipbubble shipment creation error:",
          shippingError.data ||
          shippingError.message
        );

        // Payment remains successful even if shipment booking fails.
        // The order stays confirmed so it can be retried manually.
      }
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order
    });
  } catch (error) {
    console.error(
      "Paystack verification error:",
      error.response?.data || error.message
    );

    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to verify payment"
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment
};
