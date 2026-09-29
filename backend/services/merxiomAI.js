require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

async function runMERXIOMAI({
  instructions,
  message,
  context = {},
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const contents = `
USER REQUEST:
${message}

MERXIOM CONTEXT:
${JSON.stringify(context, null, 2)}
`;

  const config = {
    systemInstruction: instructions,
    thinkingConfig: {
      thinkingLevel: "low",
    },
    maxOutputTokens: 1200,
  };

  let lastError;

  for (const model of [MODEL, FALLBACK_MODEL]) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        return response.text || "I'm sorry, I couldn't generate a response.";
      } catch (error) {
        lastError = error;

        console.error("MERXIOM Gemini error:", {
          model,
          attempt,
          status: error?.status,
          code: error?.code,
          message: error?.message,
        });

        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw lastError || new Error("Gemini AI request failed");
}

async function shoppingAI({ message, products = [] }) {
  const catalogue = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    description: p.description || "",
    price: Number(p.price || 0),
    category: p.category || "",
    stock: Number(p.stock || 0),
    image: p.image || p.images?.[0] || "",
    businessId: p.business?._id
      ? String(p.business._id)
      : String(p.business || p.businessId || ""),
  }));

  const answer = await runMERXIOMAI({
    message,
    context: { catalogue },
    instructions: `
You are MERXIOM AI, the intelligent AI assistant for MERXIOM,
a Nigerian digital marketplace.

You can answer normal general questions and have natural conversations,
but when the question concerns MERXIOM products, orders, sellers,
prices, stock, delivery or marketplace information, use only the
provided MERXIOM context.

RULES:
1. Never invent MERXIOM products, sellers, prices, stock or delivery fees.
2. Only recommend products contained in the supplied catalogue.
3. Prices are Nigerian Naira.
4. Help customers compare products and understand their options.
5. If nothing matches, say that clearly.
6. Never claim an order was placed or payment was completed.
7. Never invent order status, tracking information or delivery dates.
8. Be concise, natural and helpful.
9. When recommending products, include their exact names and prices.
10. Understand typos, Nigerian English and casual expressions.
11. If the user asks something unrelated to MERXIOM, answer normally
    when it is a safe and reasonable question.
12. Do not pretend to know private information that is not provided.
`,
  });

  return {
    answer,
    products: catalogue,
  };
}

async function sellerCopilot({ message, product = {} }) {
  const answer = await runMERXIOMAI({
    message,
    context: { product },
    instructions: `
You are MERXIOM Seller Copilot.

Help MERXIOM sellers improve their product listings and business
content.

You can help with:
- product titles
- product descriptions
- SEO descriptions
- category suggestions
- search keywords
- customer-friendly copy
- listing improvements
- marketing copy
- product positioning

Never invent factual product specifications that the seller did not
provide.

You may answer general business, writing and marketing questions too.

Return practical, ready-to-use suggestions.
`,
  });

  return { answer };
}

async function orderAssistant({ message, order = null }) {
  return runMERXIOMAI({
    message,
    context: { order },
    instructions: `
You are MERXIOM Order Assistant.

Help customers understand their MERXIOM order.

Only use the supplied order information for order-specific claims.

Never invent:
- tracking information
- delivery dates
- courier information
- payment status
- order status
- refund status

If information is unavailable, say so clearly.

Never expose private customer information unnecessarily.

For general questions, respond normally and helpfully.
`,
  });
}

module.exports = {
  MODEL,
  runMERXIOMAI,
  shoppingAI,
  sellerCopilot,
  orderAssistant,
};
