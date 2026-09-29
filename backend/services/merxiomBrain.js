/**
 * MERXIOM Intelligence Engine
 *
 * Local-first intelligence layer.
 * This module intentionally uses no external AI provider.
 *
 * Goal:
 * Handle as much MERXIOM conversation and commerce logic locally
 * as reasonably possible before falling back to an external model.
 */

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "am", "i", "me", "my", "you",
  "your", "we", "our", "they", "them", "this", "that", "these",
  "those", "to", "for", "of", "on", "in", "at", "and", "or",
  "but", "with", "from", "do", "does", "did", "can", "could",
  "would", "should", "please", "pls", "plz"
]);

const GREETINGS = [
  "hello",
  "hi",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "good evenin",
  "good morn",
  "good afternoon",
  "howdy",
  "yo"
];

const THANKS = [
  "thanks",
  "thank you",
  "thank",
  "tnx",
  "thx"
];

const GOODBYES = [
  "bye",
  "goodbye",
  "see you",
  "see ya",
  "later"
];

function normalizeText(input = "") {
  let text = String(input)
    .toLowerCase()
    .trim();

  const replacements = [
    [/\bgud\b/g, "good"],
    [/\bgoodd\b/g, "good"],
    [/\bevenin\b/g, "evening"],
    [/\bmornin\b/g, "morning"],
    [/\bafternun\b/g, "afternoon"],
    [/\bpls\b/g, "please"],
    [/\bplz\b/g, "please"],
    [/\bthx\b/g, "thanks"],
    [/\btnx\b/g, "thanks"],
    [/\bu\b/g, "you"],
    [/\bur\b/g, "your"],
    [/\br\b/g, "are"],
    [/\bya\b/g, "you"],
    [/\bdis\b/g, "this"],
    [/\bdat\b/g, "that"],
    [/\bdey\b/g, "they"],
    [/\bwetin\b/g, "what"],
    [/\bwey\b/g, "where"],
    [/\babi\b/g, "or"],
    [/\bav\b/g, "have"],
    [/\bget\b/g, "have"],
    [/\bshow me\b/g, "show me"]
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .replace(/[!?.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function tokenize(text = "") {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean);
}

function meaningfulWords(text = "") {
  return tokenize(text).filter((word) => !STOP_WORDS.has(word));
}

function containsAny(text, phrases) {
  return phrases.some((phrase) => text === phrase || text.includes(phrase));
}

function detectIntent(message = "") {
  const normalized = normalizeText(message);
  const words = tokenize(normalized);

  if (!normalized) {
    return {
      intent: "empty",
      confidence: 1
    };
  }

  if (
    GREETINGS.some(
      (greeting) =>
        normalized === greeting ||
        normalized.startsWith(`${greeting} `)
    )
  ) {
    return {
      intent: "greeting",
      confidence: 0.98
    };
  }

  if (containsAny(normalized, THANKS)) {
    return {
      intent: "thanks",
      confidence: 0.97
    };
  }

  if (containsAny(normalized, GOODBYES)) {
    return {
      intent: "goodbye",
      confidence: 0.97
    };
  }

  if (
    /\b(order|orders|ordered|purchase|bought|buy)\b/.test(normalized)
  ) {
    return {
      intent: "order",
      confidence: 0.85
    };
  }

  if (
    /\b(delivery|deliver|shipping|ship|courier|dispatch|tracking|track)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "delivery",
      confidence: 0.86
    };
  }

  if (
    /\b(price|cost|cheap|cheaper|expensive|₦|naira|budget|under|below)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "product_search",
      confidence: 0.8
    };
  }

  if (
    /\b(product|products|item|items|shoe|shoes|sneaker|sneakers|dress|dresses|shirt|shirts|bag|bags|phone|laptop)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "product_search",
      confidence: 0.8
    };
  }

  if (
    /\b(compare|comparison|difference|better|best|recommend|recommendation|suggest)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "product_comparison",
      confidence: 0.82
    };
  }

  if (
    /\b(seller|sell|selling|store|shop|listing|seo|business)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "seller",
      confidence: 0.8
    };
  }

  if (
    /\b(help|assist|how|what|why|when|where|who|can you)\b/.test(
      normalized
    )
  ) {
    return {
      intent: "general_question",
      confidence: 0.55
    };
  }

  return {
    intent: "unknown",
    confidence: 0.35
  };
}

function extractPrice(message = "") {
  const normalized = normalizeText(message);

  const matches = [
    ...normalized.matchAll(/(?:₦|ngn|n)\s?([\d,]+(?:\.\d+)?)/gi),
    ...normalized.matchAll(/\b([\d,]+)\s?(?:naira|k)\b/gi)
  ];

  if (!matches.length) {
    return null;
  }

  const raw = matches[0][1].replace(/,/g, "");
  let value = Number(raw);

  if (/\bk\b/i.test(matches[0][0])) {
    value *= 1000;
  }

  return Number.isFinite(value) ? value : null;
}

function extractQuantity(message = "") {
  const normalized = normalizeText(message);
  const match = normalized.match(
    /\b(\d+)\s?(?:pieces?|pcs?|items?|units?)\b/i
  );

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function extractSearchTerms(message = "") {
  return meaningfulWords(message).slice(0, 12);
}

function analyze(message = "") {
  const normalized = normalizeText(message);
  const intent = detectIntent(message);

  return {
    original: String(message),
    normalized,
    intent: intent.intent,
    confidence: intent.confidence,
    words: tokenize(normalized),
    meaningfulWords: meaningfulWords(normalized),
    searchTerms: extractSearchTerms(normalized),
    price: extractPrice(normalized),
    quantity: extractQuantity(normalized)
  };
}

function localResponse(message = "") {
  const analysis = analyze(message);

  switch (analysis.intent) {
    case "greeting":
      return {
        handled: true,
        answer:
          "Good evening! Welcome to MERXIOM. How can I help you today?",
        analysis
      };

    case "thanks":
      return {
        handled: true,
        answer:
          "You're welcome! 😊 I'm here whenever you need help.",
        analysis
      };

    case "goodbye":
      return {
        handled: true,
        answer:
          "See you soon! 👋",
        analysis
      };

    case "empty":
      return {
        handled: true,
        answer:
          "I'm here. What would you like to know?",
        analysis
      };

    default:
      return {
        handled: false,
        answer: null,
        analysis
      };
  }
}

module.exports = {
  normalizeText,
  tokenize,
  meaningfulWords,
  detectIntent,
  extractPrice,
  extractQuantity,
  extractSearchTerms,
  analyze,
  localResponse
};
