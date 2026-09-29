const providers = [
  {
    id: "gemini",
    name: "Google Gemini",
    enabled: true,
    free: true,
    priority: 3,
    models: ["gemini-3.8-flash"],
    envKey: "GEMINI_API_KEY",
    status: "ready",
  },
  {
    id: "groq",
    name: "Groq",
    enabled: true,
    free: true,
    priority: 1,
    models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
    envKey: "GROQ_API_KEY",
    status: "not_configured",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    enabled: true,
    free: true,
    priority: 2,
    models: ["openrouter/free"],
    envKey: "OPENROUTER_API_KEY",
    status: "ready",
  },

  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    enabled: true,
    free: true,
    priority: 4,
    models: ["@cf/zai-org/glm-4.7-flash"],
    envKey: "CLOUDFLARE_API_TOKEN",
    status: "not_configured",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    enabled: true,
    free: true,
    priority: 5,
    models: [],
    envKey: "MISTRAL_API_KEY",
    status: "not_configured",
  },
  {
    id: "cohere",
    name: "Cohere",
    enabled: true,
    free: true,
    priority: 6,
    models: [],
    envKey: "COHERE_API_KEY",
    status: "not_configured",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    enabled: true,
    free: true,
    priority: 7,
    models: [],
    envKey: "HUGGINGFACE_API_KEY",
    status: "not_configured",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    enabled: true,
    free: true,
    priority: 8,
    models: [],
    envKey: "NVIDIA_API_KEY",
    status: "not_configured",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "CEREBRAS_API_KEY",
    status: "paid_or_trial",
  },
  {
    id: "sambanova",
    name: "SambaNova",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "SAMBANOVA_API_KEY",
    status: "not_verified_free",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "FIREWORKS_API_KEY",
    status: "paid_or_trial",
  },
  {
    id: "together",
    name: "Together AI",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "TOGETHER_API_KEY",
    status: "paid_or_trial",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "DEEPINFRA_API_KEY",
    status: "paid_or_trial",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "DEEPSEEK_API_KEY",
    status: "not_verified_free",
  },
  {
    id: "xai",
    name: "xAI",
    enabled: false,
    free: false,
    priority: 99,
    models: [],
    envKey: "XAI_API_KEY",
    status: "paid_or_trial",
  },
];

function getConfiguredProviders() {
  return providers
    .filter(provider =>
      provider.enabled &&
      provider.free &&
      Boolean(process.env[provider.envKey])
    )
    .sort((a, b) => a.priority - b.priority);
}

function getFreeProviders() {
  return providers
    .filter(provider => provider.enabled && provider.free)
    .sort((a, b) => a.priority - b.priority);
}

function getAllProviders() {
  return providers;
}

module.exports = {
  providers,
  getConfiguredProviders,
  getFreeProviders,
  getAllProviders,
};
