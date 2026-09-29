const MERXIOMKnowledge = require("../models/MERXIOMKnowledge");

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function findKnowledge(term) {
  const key = normalizeKey(term);

  if (!key) return null;

  const knowledge = await MERXIOMKnowledge.findOne({ key });

  if (!knowledge) return null;

  knowledge.usageCount += 1;
  knowledge.lastUsedAt = new Date();
  await knowledge.save();

  return knowledge;
}

async function saveKnowledge({
  original,
  meaning,
  intent = "general",
  examples = [],
  source = "learned",
  confidence = 0.8,
  metadata = {},
}) {
  const key = normalizeKey(original);

  if (!key || !meaning) return null;

  return MERXIOMKnowledge.findOneAndUpdate(
    { key },
    {
      $set: {
        original: String(original).trim(),
        meaning: String(meaning).trim(),
        intent,
        examples,
        source,
        confidence,
        metadata,
      },
      $setOnInsert: {
        usageCount: 0,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function learn({
  term,
  meaning,
  intent,
  examples,
  source = "ai",
  confidence = 0.9,
  metadata,
}) {
  return saveKnowledge({
    original: term,
    meaning,
    intent,
    examples,
    source,
    confidence,
    metadata,
  });
}

module.exports = {
  normalizeKey,
  findKnowledge,
  saveKnowledge,
  learn,
};
