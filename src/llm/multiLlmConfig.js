/**
 * Multi-LLM Configuration
 * Defines available LLM configurations and their groupings
 */

export const LLM_CONFIGS = {
  // OpenAI Models
  OPENAI_GPT4O_MINI: {
    provider: "openai",
    model: "gpt-4o-mini",
    type: "paid",
    cost: "low",
    latency: "very-fast",
    features: ["json-mode", "fast"]
  },
  OPENAI_GPT4O: {
    provider: "openai",
    model: "gpt-4o",
    type: "paid",
    cost: "high",
    latency: "fast",
    features: ["json-mode", "vision", "latest"]
  },
  OPENAI_GPT4_TURBO: {
    provider: "openai",
    model: "gpt-4-turbo",
    type: "paid",
    cost: "high",
    latency: "fast",
    features: ["json-mode", "vision"]
  },
  OPENAI_GPT35_TURBO: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    type: "paid",
    cost: "low",
    latency: "very-fast",
    features: ["json-mode"]
  },

  // Anthropic Claude Models
  CLAUDE_OPUS: {
    provider: "anthropic",
    model: "claude-opus-4-1-20250805",
    type: "paid",
    cost: "high",
    latency: "moderate",
    features: ["vision", "long-context", "best-reasoning"]
  },
  CLAUDE_SONNET: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    type: "paid",
    cost: "medium",
    latency: "fast",
    features: ["vision", "balanced"]
  },
  CLAUDE_HAIKU: {
    provider: "anthropic",
    model: "claude-3-5-haiku-20241022",
    type: "paid",
    cost: "low",
    latency: "very-fast",
    features: ["fast", "cost-effective"]
  },

  // Google Models
  GOOGLE_GEMINI_PRO: {
    provider: "google",
    model: "gemini-2.0-flash",
    type: "paid",
    cost: "medium",
    latency: "fast",
    features: ["multimodal", "latest"]
  },

  // Mistral Models
  MISTRAL_LARGE: {
    provider: "mistral",
    model: "mistral-large-latest",
    type: "paid",
    cost: "medium",
    latency: "fast",
    features: ["json-mode", "reasoning"]
  },
  MISTRAL_MEDIUM: {
    provider: "mistral",
    model: "mistral-medium-latest",
    type: "paid",
    cost: "low",
    latency: "fast",
    features: ["balanced"]
  },
  MISTRAL_SMALL: {
    provider: "mistral",
    model: "mistral-small-latest",
    type: "paid",
    cost: "low",
    latency: "very-fast",
    features: ["fast", "cost-effective"]
  },

  // AI21 Models
  AI21_JAMBA_ULTRA: {
    provider: "ai21",
    model: "jambachat",
    type: "paid",
    cost: "medium",
    latency: "moderate",
    features: ["reasoning", "long-context"]
  },
  AI21_J2_ULTRA: {
    provider: "ai21",
    model: "j2-ultra",
    type: "paid",
    cost: "high",
    latency: "moderate",
    features: ["best-quality", "long-context"]
  },
  AI21_J2_MID: {
    provider: "ai21",
    model: "j2-mid",
    type: "paid",
    cost: "low",
    latency: "fast",
    features: ["balanced"]
  },

  // Grok (xAI) Models
  GROK_3: {
    provider: "grok",
    model: "grok-3-latest",
    type: "paid",
    cost: "high",
    latency: "fast",
    features: ["reasoning", "real-time", "latest"]
  },
  GROK_3_FAST: {
    provider: "grok",
    model: "grok-3-fast-latest",
    type: "paid",
    cost: "medium",
    latency: "very-fast",
    features: ["fast", "real-time"]
  },
  GROK_2: {
    provider: "grok",
    model: "grok-2-latest",
    type: "paid",
    cost: "medium",
    latency: "fast",
    features: ["balanced", "real-time"]
  },

  // Groq Models (FREE TIER!)
  GROQ_LLAMA_70B: {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    type: "free",
    cost: "free",
    latency: "very-fast",
    features: ["reasoning", "fast", "free"]
  },
  GROQ_LLAMA_8B: {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    type: "free",
    cost: "free",
    latency: "ultra-fast",
    features: ["fast", "free", "instant"]
  },
  GROQ_MIXTRAL: {
    provider: "groq",
    model: "mixtral-8x7b-32768",
    type: "free",
    cost: "free",
    latency: "very-fast",
    features: ["balanced", "free", "long-context"]
  }
};

/**
 * Pools used for random or round-robin selection.
 * Note: "free" here means lowest-cost models from available providers.
 */
export const LLM_POOLS = {
  free: [
    LLM_CONFIGS.GROQ_LLAMA_70B,
    LLM_CONFIGS.GROQ_MIXTRAL,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO
  ],
  paid: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO,
    LLM_CONFIGS.MISTRAL_LARGE,
    LLM_CONFIGS.AI21_J2_ULTRA,
    LLM_CONFIGS.GROK_3
  ]
};

/**
 * Preset LLM combinations for different scenarios
 */
export const LLM_PROFILES = {
  // Maximum quality and consensus - use best paid models across providers
  premium: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.MISTRAL_LARGE
  ],

  // Balance quality and cost with diverse providers
  balanced: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.MISTRAL_LARGE,
    LLM_CONFIGS.CLAUDE_SONNET
  ],

  // Cost-optimized but still good quality
  economical: [
    LLM_CONFIGS.OPENAI_GPT4O_MINI,
    LLM_CONFIGS.MISTRAL_SMALL,
    LLM_CONFIGS.AI21_J2_MID
  ],

  // Speed-focused for latency-sensitive tasks
  fast: [
    LLM_CONFIGS.OPENAI_GPT4O_MINI,
    LLM_CONFIGS.MISTRAL_SMALL
  ],

  // Accuracy-focused with best reasoners across providers
  accurate: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.MISTRAL_LARGE
  ],

  // Diverse provider consensus with 4 different LLMs
  diverse_consensus: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.MISTRAL_LARGE,
    LLM_CONFIGS.GROK_3
  ],

  // Maximum diversity with 5 providers
  max_consensus: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.GROK_3,
    LLM_CONFIGS.MISTRAL_LARGE,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO
  ],

  // Grok-focused for real-time reasoning
  grok_focus: [
    LLM_CONFIGS.GROK_3,
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET
  ],

  // Two-model consensus for quick decisions
  quick_consensus: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.MISTRAL_LARGE
  ],

  // Single model (fallback)
  fallback: [LLM_CONFIGS.OPENAI_GPT4O]
};

/**
 * Get models by characteristics
 */
export const selectModels = (options = {}) => {
  const {
    count = 2,
    maxCost = "high",
    requireFeature = null,
    profile = "balanced"
  } = options;

  // If profile is specified, use it
  if (profile && LLM_PROFILES[profile]) {
    return LLM_PROFILES[profile].slice(0, count);
  }

  // Otherwise build custom selection
  const allModels = Object.values(LLM_CONFIGS);
  
  let filtered = allModels;

  // Filter by cost
  const costOrder = { low: 1, medium: 2, high: 3 };
  filtered = filtered.filter(m => costOrder[m.cost] <= costOrder[maxCost]);

  // Filter by feature
  if (requireFeature) {
    filtered = filtered.filter(m => m.features.includes(requireFeature));
  }

  return filtered.slice(0, count);
};

export default {
  LLM_CONFIGS,
  LLM_POOLS,
  LLM_PROFILES,
  selectModels
};
