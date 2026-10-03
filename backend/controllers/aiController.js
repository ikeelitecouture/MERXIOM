const Product = require("../models/Product");
const MERXIOMConversation = require("../models/MERXIOMConversation");
const {
  routeAI,
  routeVisionAI,
} = require("../services/merxiomRouter");
const { learnFromMessage } = require("../services/merxiomLearner");



function isComparisonRequest(message) {
  const text = String(message || "").toLowerCase().trim();

  return (
    /\bcompare\b/.test(text) ||
    /\bcomparison\b/.test(text) ||
    /\bdifference between\b/.test(text) ||
    /\bcompare .* (and|vs|versus)\b/.test(text) ||
    /\bwhich .* (better|best)\b/.test(text)
  );
}

function parseShoppingIntent(message) {
  const text = String(message || "").toLowerCase();

  const intent = {
    maxPrice: null,
    minPrice: null,
    colors: [],
    sizes: [],
    brands: [],
    locations: [],
  };

  const priceValue = (value, suffix = "") => {
    const number = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(number)) return null;

    const normalizedSuffix = String(suffix || "").toLowerCase();

    if (normalizedSuffix === "k" || normalizedSuffix === "thousand") {
      return number * 1000;
    }

    if (normalizedSuffix === "m" || normalizedSuffix === "million") {
      return number * 1000000;
    }

    return number;
  };

  const between = text.match(
    /(?:between|from)\s*(?:₦|ngn|n)?\s*([\d,.]+)\s*(k|thousand|m|million)?\s*(?:and|to|-)\s*(?:₦|ngn|n)?\s*([\d,.]+)\s*(k|thousand|m|million)?/i
  );

  if (between) {
    intent.minPrice = priceValue(between[1], between[2]);
    intent.maxPrice = priceValue(between[3], between[4]);
  } else {
    const maxMatch = text.match(
      /(?:under|below|less than|up to|max(?:imum)?|not more than)\s*(?:₦|ngn|n)?\s*([\d,.]+)\s*(k|thousand|m|million)?/i
    );

    const minMatch = text.match(
      /(?:over|above|more than|at least|from)\s*(?:₦|ngn|n)?\s*([\d,.]+)\s*(k|thousand|m|million)?/i
    );

    if (maxMatch) {
      intent.maxPrice = priceValue(maxMatch[1], maxMatch[2]);
    }

    if (minMatch) {
      intent.minPrice = priceValue(minMatch[1], minMatch[2]);
    }
  }

  const colorWords = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "pink",
    "purple",
    "orange",
    "brown",
    "grey",
    "gray",
    "gold",
    "silver",
    "cream",
    "beige",
    "navy",
    "maroon",
  ];

  intent.colors = colorWords.filter((color) =>
    new RegExp(`\\b${color}\\b`, "i").test(text)
  );

  const sizeMatches = text.match(
    /\b(?:size\s*)?(xs|s|m|l|xl|xxl|xxxl|[2-6]\d)\b/gi
  ) || [];

  intent.sizes = [
    ...new Set(
      sizeMatches.map((size) =>
        size.toLowerCase().replace(/^size\s*/, "").trim()
      )
    ),
  ];

  const brandWords = [
    "nike",
    "adidas",
    "puma",
    "gucci",
    "prada",
    "zara",
    "apple",
    "samsung",
    "tecno",
    "infinix",
    "hp",
    "dell",
    "lenovo",
    "sony",
    "lg",
  ];

  intent.brands = brandWords.filter((brand) =>
    new RegExp(`\\b${brand}\\b`, "i").test(text)
  );

  const locationWords = [
    "lagos",
    "abuja",
    "ibadan",
    "ogun",
    "port harcourt",
    "ph",
    "benin",
    "ilorin",
    "enugu",
    "kano",
    "kaduna",
    "jos",
    "abeokuta",
  ];

  intent.locations = locationWords.filter((location) =>
    text.includes(location)
  );

  return intent;
}

function findMatchingProducts(products, message) {
  const query = String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ");

  const words = query
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);

  const productRequestWords = [
    "show",
    "find",
    "available",
    "available products",
    "product",
    "products",
    "buy",
    "selling",
    "sell",
    "looking",
    "search",
    "want",
    "need",
    "have",
    "stock",
  ];

  const asksForProducts =
    productRequestWords.some((word) => query.includes(word)) ||
    /what.*(have|available|selling)/i.test(query);

  if (!asksForProducts) {
    return [];
  }

  const intent = parseShoppingIntent(message);

  const filtered = products.filter((product) => {
    const price = Number(product.price || 0);

    if (intent.maxPrice !== null && price > intent.maxPrice) {
      return false;
    }

    if (intent.minPrice !== null && price < intent.minPrice) {
      return false;
    }

    if (intent.colors.length > 0) {
      const productColors = Array.isArray(product.colors)
        ? product.colors.map((color) => String(color).toLowerCase())
        : [];

      const searchableColors = [
        ...productColors,
        String(product.name || "").toLowerCase(),
        String(product.description || "").toLowerCase(),
      ].join(" ");

      if (
        !intent.colors.some((color) =>
          searchableColors.includes(color)
        )
      ) {
        return false;
      }
    }

    if (intent.sizes.length > 0) {
      const productSizes = Array.isArray(product.sizes)
        ? product.sizes.map((size) => String(size).toLowerCase())
        : [];

      if (
        productSizes.length > 0 &&
        !intent.sizes.some((size) =>
          productSizes.includes(size)
        )
      ) {
        return false;
      }
    }

    if (intent.brands.length > 0) {
      const brand = String(product.brand || "").toLowerCase();

      const searchableBrand = [
        brand,
        String(product.name || "").toLowerCase(),
        String(product.description || "").toLowerCase(),
      ].join(" ");

      if (
        !intent.brands.some((item) =>
          searchableBrand.includes(item)
        )
      ) {
        return false;
      }
    }

    if (intent.locations.length > 0) {
      const location = String(product.location || "").toLowerCase();

      if (
        !intent.locations.some((item) =>
          location.includes(item)
        )
      ) {
        return false;
      }
    }

    return true;
  });

  const candidates =
    filtered.length > 0 || (
      intent.maxPrice !== null ||
      intent.minPrice !== null ||
      intent.colors.length > 0 ||
      intent.sizes.length > 0 ||
      intent.brands.length > 0 ||
      intent.locations.length > 0
    )
      ? filtered
      : products;

  const scored = candidates
    .map((product) => {
      const searchable = [
        product.name,
        product.description,
        product.category,
        product.brand,
        ...(Array.isArray(product.colors) ? product.colors : []),
        ...(Array.isArray(product.sizes) ? product.sizes : []),
        product.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const word of words) {
        if (word.length < 3) continue;

        if (searchable.includes(word)) {
          score += 3;
        }

        if (
          String(product.category || "")
            .toLowerCase()
            .includes(word)
        ) {
          score += 5;
        }

        if (
          String(product.name || "")
            .toLowerCase()
            .includes(word)
        ) {
          score += 6;
        }
      }

      if (intent.maxPrice !== null) {
        score += 4;
      }

      if (intent.minPrice !== null) {
        score += 4;
      }

      if (intent.colors.length > 0) {
        score += 4;
      }

      if (intent.sizes.length > 0) {
        score += 4;
      }

      if (intent.brands.length > 0) {
        score += 4;
      }

      if (intent.locations.length > 0) {
        score += 4;
      }

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.product);

  return scored;
}



function buildProductComparison(products) {
  if (!Array.isArray(products) || products.length < 2) {
    return [];
  }

  return products.slice(0, 4).map((product) => ({
    id: product._id || product.id,
    name: product.name || "Product",
    price: Number(product.price || 0),
    category: product.category || "",
    brand: product.brand || "",
    colors: Array.isArray(product.colors) ? product.colors : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    location: product.location || "",
    stock: Number(product.stock || 0),
    shipping: product.shipping || null,
    image: product.images?.[0] || product.image || "",
  }));
}

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
        "name description price category brand colors sizes location stock image images business shipping"
      )
      .limit(100)
      .lean();

    const matchingProducts = findMatchingProducts(
      products,
      cleanMessage
    );

    const comparisonRequested = isComparisonRequest(cleanMessage);

    const comparisonProducts = comparisonRequested
      ? buildProductComparison(
          matchingProducts.length >= 2
            ? matchingProducts
            : products
        )
      : [];

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

    const aiContext = {
      products,
      matchingProducts,
      comparisonRequested,
      comparisonProducts,
      conversation: recentMessages,
      languageKnowledge: languageLearning?.analysis?.known || [],
      newlyLearned: languageLearning?.learned || [],
    };

    const result = req.file
      ? await routeVisionAI({
          message: cleanMessage,
          context: aiContext,
          imageBuffer: req.file.buffer,
          mimeType: req.file.mimetype,
        })
      : await routeAI({
          message: cleanMessage,
          context: aiContext,
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
      matchingProducts,
      comparisonRequested,
      comparisonProducts,
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
