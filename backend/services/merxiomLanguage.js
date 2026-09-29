const {
  normalizeKey,
  findKnowledge,
  learn,
} = require("./merxiomKnowledge");

const COMMON = new Set([
  "a","an","and","are","as","at","be","but","by","can","do","for","from",
  "get","good","hello","help","how","i","if","in","is","it","me","my",
  "need","of","on","or","please","product","products","seller","shop",
  "that","the","this","to","want","was","we","what","when","where","who",
  "with","you","your","yes","no","thanks","thank","delivery","order",
  "price","buy","sell","show","find","give","have","has","can","will",
  "would","could","should","morning","afternoon","evening","night",
  "today","tomorrow","now","na","dey","wetin","abeg","oya","bobo"
]);

const LOCAL_ALIASES = {
  gud: "good",
  goodd: "good",
  mornin: "morning",
  evenin: "evening",
  pls: "please",
  plz: "please",
  thx: "thanks",
  tnx: "thanks",
  u: "you",
  ur: "your",
  r: "are",
  dis: "this",
  dat: "that",
  wetin: "what",
  abeg: "please",
};

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'₦$.,!? -]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function extractCandidates(text) {
  const tokens = tokenize(text);

  return [...new Set(
    tokens
      .filter(token => token.length >= 2)
      .filter(token => !COMMON.has(token))
      .filter(token => !/^\d+(?:[.,]\d+)?$/.test(token))
      .filter(token => !/^[₦$]?\d/.test(token))
  )];
}

async function lookupLocal(term) {
  const normalized = normalizeKey(term);

  if (LOCAL_ALIASES[normalized]) {
    return {
      term,
      meaning: LOCAL_ALIASES[normalized],
      source: "local",
      confidence: 1,
    };
  }

  const stored = await findKnowledge(normalized);

  if (!stored) return null;

  return {
    term: stored.original,
    meaning: stored.meaning,
    intent: stored.intent,
    source: stored.source,
    confidence: stored.confidence,
  };
}

async function understand(message) {
  const cleanMessage = String(message || "").trim().toLowerCase();

  const known = [];
  const unknown = [];

  // First check the complete phrase.
  if (cleanMessage.length >= 2) {
    const phraseKnowledge = await lookupLocal(cleanMessage);

    if (phraseKnowledge) {
      known.push(phraseKnowledge);

      return {
        originalMessage: message,
        candidates: [cleanMessage],
        known,
        unknown: [],
        needsLearning: false,
      };
    }
  }

  const candidates = extractCandidates(message);

  for (const candidate of candidates) {
    const result = await lookupLocal(candidate);

    if (result) {
      known.push(result);
    } else {
      unknown.push(candidate);
    }
  }

  return {
    originalMessage: message,
    candidates,
    known,
    unknown,
    needsLearning: unknown.length > 0,
  };
}

async function storeLearnedMeaning({
  term,
  meaning,
  intent = "general",
  examples = [],
  source = "ai",
  confidence = 0.9,
}) {
  return learn({
    term,
    meaning,
    intent,
    examples,
    source,
    confidence,
  });
}

module.exports = {
  tokenize,
  extractCandidates,
  lookupLocal,
  understand,
  storeLearnedMeaning,
};
