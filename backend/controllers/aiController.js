const Product = require("../models/Product");
const MERXIOMConversation = require("../models/MERXIOMConversation");
const { routeAI } = require("../services/merxiomRouter");
const { learnFromMessage } = require("../services/merxiomLearner");

const shoppingAI = async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Shopping request is required",
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;
    const cleanMessage = String(message).trim();

    let conversation;

    if (conversationId) {
      conversation = await MERXIOMConversation.findOne({
        _id: conversationId,
        user: userId,
      });
    }

    if (!conversation) {
      conversation = await MERXIOMConversation.create({
        user: userId,
        title:
          cleanMessage.length > 45
            ? `${cleanMessage.slice(0, 45)}...`
            : cleanMessage,
        messages: [],
      });
    }

    const products = await Product.find({
      status: "active",
      stock: { $gt: 0 },
    })
      .select(
        "name description price category stock image images business shipping"
      )
      .limit(100)
      .lean();

    let languageLearning = null;

    try {
      languageLearning = await learnFromMessage(cleanMessage);
    } catch (learningError) {
      console.error(
        "MERXIOM language learning skipped:",
        learningError.message
      );
    }

    const recentMessages = conversation.messages
      .slice(-12)
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));

    const result = await routeAI({
      message: cleanMessage,
      context: {
        products,
        conversation: recentMessages,
        languageKnowledge: languageLearning?.analysis?.known || [],
        newlyLearned: languageLearning?.learned || [],
      },
    });

    conversation.messages.push({
      role: "user",
      content: cleanMessage,
    });

    conversation.messages.push({
      role: "assistant",
      content: result.answer,
      provider: result.provider || null,
    });

    conversation.lastMessageAt = new Date();

    await conversation.save();

    res.json({
      success: true,
      message: result.answer,
      products,
      conversationId: conversation._id,
      aiProvider: result.provider,
      aiProviderName: result.providerName,
      aiQuota: result.quota || null,
    });
  } catch (error) {
    console.error(
      "MERXIOM Shopping AI error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "MERXIOM AI is temporarily unavailable",
    });
  }
};

module.exports = {
  shoppingAI,
};
