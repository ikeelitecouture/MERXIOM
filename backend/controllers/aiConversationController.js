const MERXIOMConversation = require("../models/MERXIOMConversation");

const getMyConversations = async (req, res) => {
  try {
    const conversations = await MERXIOMConversation.find({
      user: req.user.userId,
    })
      .select("_id title lastMessageAt createdAt updatedAt")
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("MERXIOM conversations fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load conversations",
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const conversation = await MERXIOMConversation.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("MERXIOM conversation fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load conversation",
    });
  }
};

const createConversation = async (req, res) => {
  try {
    const conversation = await MERXIOMConversation.create({
      user: req.user.userId,
      title: "New conversation",
      messages: [],
    });

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("MERXIOM conversation creation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create conversation",
    });
  }
};

module.exports = {
  getMyConversations,
  getConversation,
  createConversation,
};
