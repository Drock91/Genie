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

  // Google Models (if integrated)
  GOOGLE_GEMINI_PRO: {
    provider: "google",
    model: "gemini-2.0-flash",
    type: "paid",
    cost: "medium",
    latency: "fast",
    features: ["multimodal", "latest"]
  }
};

/**
 * Pools used for random or round-robin selection.
 * Note: "free" here means lowest-cost models from available providers.
 */
export const LLM_POOLS = {
  free: [
    LLM_CONFIGS.OPENAI_GPT4O_MINI,
    LLM_CONFIGS.CLAUDE_HAIKU,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO
  ],
  paid: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO
  ]
};

/**
 * Preset LLM combinations for different scenarios
 */
export const LLM_PROFILES = {
  // Maximum quality and consensus - use best paid models
  premium: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET
  ],

  // Balance quality and cost
  balanced: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET
  ],

  // Cost-optimized but still good quality
  economical: [
    LLM_CONFIGS.OPENAI_GPT4O_MINI,
    LLM_CONFIGS.CLAUDE_HAIKU
  ],

  // Speed-focused for latency-sensitive tasks
  fast: [
    LLM_CONFIGS.OPENAI_GPT4O_MINI
  ],

  // Accuracy-focused with best reasoners
  accurate: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET,
    LLM_CONFIGS.GOOGLE_GEMINI_PRO
  ],

  // Two-model consensus for quick decisions
  quick_consensus: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_SONNET
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
