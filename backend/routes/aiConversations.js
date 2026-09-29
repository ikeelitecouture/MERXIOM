const express = require("express");
const {
  getMyConversations,
  getConversation,
  createConversation,
} = require("../controllers/aiConversationController");

const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getMyConversations);
router.post("/", auth, createConversation);
router.get("/:id", auth, getConversation);

module.exports = router;
