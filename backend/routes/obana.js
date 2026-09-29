const express = require("express");
const { getStore, getShipments, getQuote } = require("../services/obana");

const router = express.Router();

// Confirm Obana connection
router.get("/store", async (req, res) => {
  try {
    const result = await getStore();
    res.json(result);
  } catch (error) {
    console.error("Obana store error:", error.message);
    res.status(502).json({
      success: false,
      message: error.message,
    });
  }
});

// Get existing shipments
router.get("/shipments", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await getShipments(page, limit);
    res.json(result);
  } catch (error) {
    console.error("Obana shipments error:", error.message);
    res.status(502).json({
      success: false,
      message: error.message,
    });
  }
});

// Get delivery quote
router.post("/quote", async (req, res) => {
  try {
    const {
      origin,
      destination,
      weightKg,
      declaredValue,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required",
      });
    }

    if (!Number(weightKg) || Number(weightKg) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid weightKg is required",
      });
    }

    const result = await getQuote({
      origin,
      destination,
      weightKg,
      declaredValue: declaredValue || 0,
    });

    res.json(result);
  } catch (error) {
    console.error("Obana quote error:", error.message);
    res.status(502).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
