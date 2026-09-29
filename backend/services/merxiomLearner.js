const { understand, storeLearnedMeaning } = require("./merxiomLanguage");
const { callProvider } = require("./merxiomRouter");
const {
  getConfiguredProviders,
} = require("./aiProviders");

function cleanJSON(text) {
  const raw = String(text || "").trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function askAIToTeach(term, fullMessage) {
  const providers = getConfiguredProviders();

  if (!providers.length) {
    throw new Error("No AI provider is configured");
  }

  const prompt = `
You are teaching the MERXIOM language engine.

Unknown term:
"${term}"

User message:
"${fullMessage}"

Determine what the unknown term most likely means in this context.

Return ONLY valid JSON:

{
  "meaning": "short clear meaning",
  "intent": "general",
  "examples": ["short example"]
}

Rules:
- Understand Nigerian English, slang, abbreviations and internet language.
- Do not invent a meaning when the evidence is weak.
- If genuinely uncertain, use:
  {
    "meaning": "unknown",
    "intent": "unknown",
    "examples": []
  }
- Do not include markdown.
`;

  const result = await callProvider(providers[0], {
    message: prompt,
    context: {},
  });

  const parsed = cleanJSON(result.answer);

  if (!parsed || !parsed.meaning) {
    throw new Error("AI returned an invalid learning response");
  }

  return {
    ...parsed,
    provider: providers[0].id,
    providerName: providers[0].name,
  };
}

async function learnUnknownTerm(term, fullMessage) {
  const learned = await askAIToTeach(term, fullMessage);

  if (
    !learned.meaning ||
    learned.meaning.toLowerCase() === "unknown"
  ) {
    return {
      learned: false,
      term,
      provider: learned.provider,
      providerName: learned.providerName,
    };
  }

  const saved = await storeLearnedMeaning({
    term,
    meaning: learned.meaning,
    intent: learned.intent || "general",
    examples: Array.isArray(learned.examples)
      ? learned.examples
      : [],
    source: "ai",
    confidence: 0.9,
  });

  return {
    learned: true,
    term,
    meaning: saved.meaning,
    intent: saved.intent,
    provider: learned.provider,
    providerName: learned.providerName,
  };
}

async function learnFromMessage(message) {
  const analysis = await understand(message);

  if (!analysis.needsLearning) {
    return {
      analysis,
      learned: [],
    };
  }

  const learned = [];

  for (const term of analysis.unknown) {
    try {
      const result = await learnUnknownTerm(term, message);

      if (result.learned) {
        learned.push(result);
      }
    } catch (error) {
      console.error(
        "MERXIOM learning error:",
        term,
        error.message
      );
    }
  }

  return {
    analysis,
    learned,
  };
}

module.exports = {
  askAIToTeach,
  learnUnknownTerm,
  learnFromMessage,
};
