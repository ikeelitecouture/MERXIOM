const { getConfiguredProviders } = require("./aiProviders");

async function callGemini({ message, context = {} }) {
  const { GoogleGenAI } = require("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `
USER REQUEST:
${message}

MERXIOM CONTEXT:
${JSON.stringify(context, null, 2)}
`,
    config: {
      systemInstruction: `
You are MERXIOM AI.

You are the conversational intelligence layer of MERXIOM.

Be natural, helpful, conversational and human.
Understand Nigerian English, Nigerian slang, abbreviations, shortcuts, typos and casual expressions.

IMPORTANT:
MERXIOM has a local knowledge system.

When MERXIOM CONTEXT contains languageKnowledge or newlyLearned knowledge:
- Use that knowledge to understand the user's message.
- Do not ask another AI about a term that MERXIOM already knows.
- If newlyLearned contains a meaning, use it immediately in your response.
- Do not mention the internal learning system to the customer unless specifically asked.

Never invent MERXIOM-specific:
- products
- prices
- stock
- orders
- delivery status
- customer information
- seller information

Use only the supplied MERXIOM context for MERXIOM-specific facts.

If the user is simply chatting, respond naturally.
If the user asks about products, use only supplied catalogue data.
If the user uses Nigerian slang or shorthand, interpret it naturally.
`,
      thinkingConfig: {
        thinkingLevel: "low",
      },
      maxOutputTokens: 1200,
    },
  });

  return response.text || "I couldn't generate a response.";
}

async function callGroq({ message, context = {} }) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `
You are MERXIOM AI.

You are the conversational intelligence layer of MERXIOM.

Be natural, helpful, conversational and human.
Understand Nigerian English, Nigerian slang, abbreviations, shortcuts, typos and casual expressions.

IMPORTANT:
MERXIOM has a local knowledge system.

When MERXIOM CONTEXT contains languageKnowledge or newlyLearned knowledge:
- Use that knowledge to understand the user's message.
- Do not ask another AI about a term that MERXIOM already knows.
- If newlyLearned contains a meaning, use it immediately in your response.
- Do not mention the internal learning system to the customer unless specifically asked.

Never invent MERXIOM-specific:
- products
- prices
- stock
- orders
- delivery status
- customer information
- seller information

Use only the supplied MERXIOM context for MERXIOM-specific facts.

If the user is simply chatting, respond naturally.
If the user asks about products, use only supplied catalogue data.
If the user uses Nigerian slang or shorthand, interpret it naturally.
`,
          },
          {
            role: "user",
            content: `
USER REQUEST:
${message}

MERXIOM CONTEXT:
${JSON.stringify(context, null, 2)}
`,
          },
        ],
        max_tokens: 1200,
      }),
    }
  );

  const remainingRequests = response.headers.get(
    "x-ratelimit-remaining-requests"
  );
  const remainingTokens = response.headers.get(
    "x-ratelimit-remaining-tokens"
  );
  const resetRequests = response.headers.get(
    "x-ratelimit-reset-requests"
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || `Groq request failed (${response.status})`
    );
    error.status = response.status;
    error.quota = {
      remainingRequests,
      remainingTokens,
      resetRequests,
    };
    throw error;
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content;

  if (content && String(content).trim()) {
    return {
      answer: String(content).trim(),
      quota: {
        remainingRequests,
        remainingTokens,
        resetRequests,
      },
    };
  }

  const reasoning = choice?.message?.reasoning;

  if (reasoning && String(reasoning).trim()) {
    return {
      answer: String(reasoning).trim(),
      quota: {
        remainingRequests,
        remainingTokens,
        resetRequests,
      },
    };
  }

  throw Object.assign(
    new Error("Groq returned an empty response"),
    { status: 502 }
  );
}


async function callOpenRouter({ message, context = {} }) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://merxiom.netlify.app",
        "X-Title": "MERXIOM",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You are MERXIOM AI. Be helpful and natural. Never invent MERXIOM-specific facts. Use only supplied MERXIOM context.",
          },
          {
            role: "user",
            content: `USER REQUEST:\n${message}\n\nMERXIOM CONTEXT:\n${JSON.stringify(context)}`,
          },
        ],
        max_tokens: 1200,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || `OpenRouter request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content || !String(content).trim()) {
    throw Object.assign(
      new Error("OpenRouter returned an empty response"),
      { status: 502 }
    );
  }

  return {
    answer: String(content).trim(),
    quota: null,
  };
}


async function callCloudflare({ message, context = {} }) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    throw Object.assign(
      new Error("Cloudflare credentials are not configured"),
      { status: 503 }
    );
  }

  const model = "@cf/zai-org/glm-4.7-flash";

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${encodeURIComponent(model)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are MERXIOM AI. Be helpful and natural. Never invent MERXIOM-specific facts. Use only supplied MERXIOM context.",
          },
          {
            role: "user",
            content: `USER REQUEST:\n${message}\n\nMERXIOM CONTEXT:\n${JSON.stringify(context)}`,
          },
        ],
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.errors?.[0]?.message ||
      `Cloudflare request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  const result = data?.result;
  const content =
    result?.response ||
    result?.text ||
    result?.output_text ||
    result?.choices?.[0]?.message?.content;

  if (!content || !String(content).trim()) {
    throw Object.assign(
      new Error("Cloudflare returned an empty response"),
      { status: 502 }
    );
  }

  return {
    answer: String(content).trim(),
    quota: null,
  };
}

async function callProvider(provider, payload) {
  switch (provider.id) {
    case "gemini":
      return callGemini(payload);

    case "groq":
      return callGroq(payload);

    case "openrouter":
      return callOpenRouter(payload);

    case "cloudflare":
      return callCloudflare(payload);

    default:
      throw new Error(`${provider.name} adapter is not connected yet`);
  }
}

function shouldFallback(error) {
  const status = Number(error?.status);

  return (
    status === 401 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function routeAI(payload) {
  const providers = getConfiguredProviders();

  if (!providers.length) {
    throw new Error("No free MERXIOM AI provider is configured");
  }

  const failures = [];

  for (const provider of providers) {
    try {
      const result = await callProvider(provider, payload);

      return {
        answer: result.answer || result,
        provider: provider.id,
        providerName: provider.name,
        quota: result.quota || null,
        failures,
      };
    } catch (error) {
      console.error(
        `MERXIOM AI provider failed: ${provider.name}`,
        error.message
      );

      failures.push({
        provider: provider.id,
        status: error?.status || null,
        message: error.message,
      });

      if (!shouldFallback(error)) {
        throw error;
      }
    }
  }

  const error = new Error("All configured free MERXIOM AI providers failed");
  error.failures = failures;
  throw error;
}

module.exports = {
  callProvider,
  routeAI,
};
