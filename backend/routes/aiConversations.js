const express = require("express");
const {
  getMyConversations,
  getConversation,
  createConversation,
  deleteConversation,
} = require("../controllers/aiConversationController");

const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getMyConversations);
router.post("/", auth, createConversation);
router.get("/:id", auth, getConversation);
router.delete("/:id", auth, deleteConversation);

module.exports = router;
