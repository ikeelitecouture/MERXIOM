const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const User = require("../models/User");

const getUserId = (req) => req.user.userId;

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return { error: "Conversation not found", status: 404 };
  }

  const isParticipant = conversation.participants.some(
    (id) => String(id) === String(userId)
  );

  if (!isParticipant) {
    return { error: "You are not part of this conversation", status: 403 };
  }

  return { conversation };
};

exports.createConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { participantId, productId, businessId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "A participant is required"
      });
    }

    if (String(participantId) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself"
      });
    }

    const participant = await User.findById(participantId).select(
      "_id name email role"
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found"
      });
    }

    if (!["customer", "seller", "admin"].includes(participant.role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid participant"
      });
    }

    if (productId) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
      product: productId || null
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, participantId],
        product: productId || null,
        business: businessId || null,
        unreadCounts: {
          [String(userId)]: 0,
          [String(participantId)]: 0
        }
      });
    }

    await conversation.populate([
      {
        path: "participants",
        select: "_id name email role"
      },
      {
        path: "product",
        select: "name price images business"
      }
    ]);

    return res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation"
    });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "_id name email role")
      .populate("product", "name price images business")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await ensureParticipant(req.params.id, userId);

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    const messages = await Message.find({
      conversation: req.params.id
    })
      .populate("sender", "_id name email role")
      .populate("product", "name price images business")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: req.params.id,
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    return res.json({
      success: true,
      conversation: result.conversation,
      messages
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation"
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { conversationId, type = "text", text, imageUrl, productId } =
      req.body;

    const result = await ensureParticipant(conversationId, userId);

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    if (!["text", "image", "product"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type"
      });
    }

    if (type === "text" && !String(text || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required"
      });
    }

    if (type === "image" && !String(imageUrl || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required"
      });
    }

    if (type === "product" && !productId) {
      return res.status(400).json({
        success: false,
        message: "Product is required"
      });
    }

    if (productId) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      type,
      text: String(text || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      product: productId || null,
      readBy: [userId]
    });

    const otherParticipants = result.conversation.participants.filter(
      (id) => String(id) !== String(userId)
    );

    const unreadCounts = result.conversation.unreadCounts || new Map();

    for (const participantId of otherParticipants) {
      const current = Number(unreadCounts.get(String(participantId)) || 0);
      unreadCounts.set(String(participantId), current + 1);
    }

    result.conversation.lastMessage =
      type === "image"
        ? "Sent an image"
        : type === "product"
          ? "Shared a product"
          : String(text || "").trim();

    result.conversation.lastMessageAt = new Date();
    result.conversation.unreadCounts = unreadCounts;

    await result.conversation.save();

    await message.populate([
      {
        path: "sender",
        select: "_id name email role"
      },
      {
        path: "product",
        select: "name price images business"
      }
    ]);

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

module.exports = exports;
