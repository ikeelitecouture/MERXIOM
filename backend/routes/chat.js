const express = require("express");
const protect = require("../middleware/auth");

const {
  createConversation,
  getMyConversations,
  getConversation,
  sendMessage
} = require("../controllers/chatController");

const router = express.Router();

router.use(protect);

router.post("/conversations", createConversation);
router.get("/conversations", getMyConversations);
router.get("/conversations/:id", getConversation);
router.post("/messages", sendMessage);

module.exports = router;
