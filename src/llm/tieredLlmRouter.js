/**
 * TieredLLMRouter - Route questions to appropriate models based on complexity
 * 
 * Implements tiered cost optimization:
 * - Simple questions → cheaper models (gpt-4o-mini, Gemini)
 * - Medium questions → balanced models (gpt-4o, Claude)
 * - Complex questions → best models (full consensus)
 * 
 * Estimated Savings: 15-25% additional reduction
 */
export class TieredLLMRouter {
  constructor({ logger = null } = {}) {
    this.logger = logger;

    // Model tiers by cost and capability
    this.tiers = {
      // Simple/fast decisions - cheapest
      cheap: {
        profile: "fast",
        description: "Fast, cheap responses",
        models: ["gpt-4o-mini", "gemini-2.0-flash"],
        costMultiplier: 0.1, // ~10% of normal
        for: [
          "logging",
          "formatting",
          "syntax check",
          "simple analysis",
          "template selection"
        ]
      },

      // Medium - balanced cost/quality
      balanced: {
        profile: "balanced",
        description: "Standard consensus",
        models: ["gpt-4o", "claude-sonnet-4"],
        costMultiplier: 0.5, // 50% baseline - using cheaper Sonnet instead of Opus
        for: [
          "code generation",
          "requirement analysis",
          "architecture decisions",
          "testing strategy"
        ]
      },

      // Complex - full power
      expensive: {
        profile: "accurate",
        description: "All 3 LLMs consensus",
        models: ["gpt-4o", "claude-opus-4-1", "gemini-2.0-flash"],
        costMultiplier: 3.0, // 300% baseline (all 3 providers)
        for: [
          "security review",
          "edge cases",
          "conflict resolution",
          "critical decisions",
          "requirement validation"
        ]
      }
    };
  }

  /**
   * Select model based on question complexity and task type
   */
  selectModel(complexity = "medium", profile = "balanced", taskType = "") {
    let selectedTier = "balanced";

    // Determine tier from complexity
    if (complexity === "simple" || complexity === "fast") {
      selectedTier = "cheap";
    } else if (complexity === "complex" || complexity === "critical" || complexity === "precise") {
      selectedTier = "expensive";
    } else {
      selectedTier = "balanced";
    }

    // Override based on task type
    const taskOverrides = {
      security: "expensive",
      validation: "expensive",
      "code-generation": "balanced",
      formatting: "cheap",
      logging: "cheap",
      analysis: "balanced",
      "edge-cases": "expensive",
      "requirement-check": "expensive",
      "quality-assurance": "expensive"
    };

    if (taskOverrides[taskType]) {
      selectedTier = taskOverrides[taskType];
    }

    const tier = this.tiers[selectedTier];

    this.logger?.debug(
      {
        complexity,
        profile,
        taskType,
        selectedTier,
        models: tier.models,
        costMultiplier: `${tier.costMultiplier}x`
      },
      "Model selection"
    );

    return tier.profile;
  }

  /**
   * Get routing advice for a question
   */
  analyzeQuestion(question) {
    // Keywords that suggest complexity level
    const expensiveKeywords = [
      "security",
      "vulnerability",
      "edge case",
      "requirement",
      "validation",
      "critical",
      "compliance",
      "risk",
      "ensure",
      "verify"
    ];

    const cheapKeywords = [
      "format",
      "log",
      "simple",
      "check",
      "list",
      "summarize",
      "count",
      "syntax"
    ];

    const q = question.toLowerCase();
    let score = 0; // -1 = cheap, 0 = balanced, 1 = expensive

    for (const k of expensiveKeywords) {
      if (q.includes(k)) score += 0.5;
    }

    for (const k of cheapKeywords) {
      if (q.includes(k)) score -= 0.5;
    }

    // Length heuristic
    if (question.length > 500) score += 0.3;
    if (question.length < 50) score -= 0.3;

    let complexity = "balanced";
    if (score > 1) complexity = "complex";
    if (score < -1) complexity = "simple";

    return {
      complexity,
      score,
      recommendation: this.selectModel(complexity, "balanced")
    };
  }

  /**
   * Get cost estimate for a task
   */
  estimateCost(taskType, estimatedCallCount = 1) {
    const tier = this.getTaskTier(taskType);
    const baselineCost = 0.005; // $0.005 per call baseline

    return {
      tier: tier.profile,
      costPerCall: `$${(baselineCost * tier.costMultiplier).toFixed(4)}`,
      totalEstimate: `$${(baselineCost * tier.costMultiplier * estimatedCallCount).toFixed(3)}`
    };
  }

  /**
   * Get tier for task type
   */
  getTaskTier(taskType) {
    const taskMap = {
      security: this.tiers.expensive,
      validation: this.tiers.expensive,
      "code-generation": this.tiers.balanced,
      formatting: this.tiers.cheap,
      logging: this.tiers.cheap,
      analysis: this.tiers.balanced,
      "edge-cases": this.tiers.expensive,
      "requirement-check": this.tiers.expensive,
      "quality-assurance": this.tiers.expensive
    };

    return taskMap[taskType] || this.tiers.balanced;
  }

  /**
   * Get all available tiers
   */
  getTiers() {
    return Object.entries(this.tiers).map(([key, tier]) => ({
      name: key,
      ...tier,
      examples: tier.for
    }));
  }

  /**
   * List all models and their tiers
   */
  listModels() {
    const models = {};
    for (const [tierName, tier] of Object.entries(this.tiers)) {
      for (const model of tier.models) {
        models[model] = {
          tier: tierName,
          costMultiplier: tier.costMultiplier
        };
      }
    }
    return models;
  }
}

export default TieredLLMRouter;
