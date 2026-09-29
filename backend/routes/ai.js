const express = require("express");
const { shoppingAI } = require("../controllers/aiController");
const protect = require("../middleware/auth");

const router = express.Router();

router.post("/shopping", protect, shoppingAI);

module.exports = router;
