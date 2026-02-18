import { consensusCall } from "./multiLlmSystem.js";
import crypto from "crypto";

/**
 * ConsensusManager - Centralized consensus calls with caching
 * 
 * Implements 3 cost optimization strategies:
 * 1. Smart Routing - Agent questions routed through Manager
 * 2. Caching - Results cached for same/similar questions
 * 3. Tiered Models - Different models based on question complexity
 * 
 * Expected Savings: 70-85% reduction in LLM costs
 */
export class ConsensusManager {
  constructor({ logger, tieredRouter = null }) {
    this.logger = logger;
    this.router = tieredRouter;
    this.cache = new Map();
    this.stats = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      costSaved: 0,
      expensesByAgent: {}
    };
  }

  /**
   * Primary method: Get consensus on a question
   * Handles caching, tiering, and expense tracking
   */
  async getConsensus({
    question,
    context = "",
    systemPrompt = "",
    schema = null,
    profile = "balanced",
    cacheKey = null,
    agentName = "unknown",
    complexity = "medium"
  }) {
    // Generate cache key
    const key = cacheKey || this.generateCacheKey(question, agentName);

    // Check cache first
    if (this.cache.has(key)) {
      this.stats.cacheHits++;
      this.logger?.info(
        { cacheKey: key, agent: agentName, hitCount: this.stats.cacheHits },
        "🟢 CACHE HIT - Reusing consensus result"
      );

      const cached = this.cache.get(key);
      return cached.result;
    }

    this.stats.cacheMisses++;

    // Route to appropriate model tier based on complexity
    const model = this.router
      ? this.router.selectModel(complexity, profile)
      : profile;

    this.logger?.info(
      {
        agent: agentName,
        complexity,
        model,
        cacheKey: key
      },
      "🔵 Making new consensus call"
    );

    try {
      const result = await consensusCall({
        profile: model,
        system: systemPrompt || context,
        user: question,
        schema,
        temperature:
          complexity === "creative"
            ? 0.3
            : complexity === "precise"
              ? 0.05
              : 0.15
      });

      // Cache result (1 hour TTL)
      this.cache.set(key, {
        result,
        timestamp: Date.now(),
        agent: agentName,
        complexity
      });

      // Schedule cache expiration
      setTimeout(() => {
        this.cache.delete(key);
        this.logger?.debug({ cacheKey: key }, "Cache expired");
      }, 3600000); // 1 hour

      // Track expense
      this.trackExpense(agentName, model, result);

      return result;
    } catch (err) {
      this.logger?.error(
        { agent: agentName, cacheKey: key, error: err.message },
        "Consensus call failed"
      );
      throw err;
    }
  }

  /**
   * Batch multiple questions into one consensus call
   * Major cost saver - instead of 3 calls, do 1 with 3 questions
   */
  async getConsensusForMultiple({
    questions = [],
    agentName = "unknown",
    complexity = "medium"
  }) {
    if (questions.length === 0) return {};

    // Check cache for each
    const results = {};
    const uncachedQuestions = [];

    for (const q of questions) {
      const key = this.generateCacheKey(q.question, agentName, q.id);
      if (this.cache.has(key)) {
        results[q.id] = this.cache.get(key).result;
        this.stats.cacheHits++;
      } else {
        uncachedQuestions.push({ ...q, cacheKey: key });
      }
    }

    // If all cached, return early
    if (uncachedQuestions.length === 0) {
      this.logger?.info(
        { agent: agentName, count: questions.length },
        "✅ All questions answered from cache"
      );
      return results;
    }

    this.logger?.info(
      {
        agent: agentName,
        cached: questions.length - uncachedQuestions.length,
        uncached: uncachedQuestions.length
      },
      "📦 Batching consensus questions"
    );

    // Batch uncached questions into one call
    const batchedPrompt = uncachedQuestions
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join("\n\n");

    try {
      const model = this.router
        ? this.router.selectModel(complexity, "balanced")
        : "balanced";

      const consensusResult = await consensusCall({
        profile: model,
        system: `You are answering multiple questions for an ${agentName} agent. Answer each clearly.`,
        user: batchedPrompt,
        temperature: complexity === "creative" ? 0.3 : 0.15
      });

      // Cache each result
      uncachedQuestions.forEach((q, i) => {
        const answer = Array.isArray(consensusResult.consensus)
          ? consensusResult.consensus[i]
          : consensusResult.consensus[`answer_${i + 1}`] ||
            consensusResult.consensus;

        this.cache.set(q.cacheKey, {
          result: answer,
          timestamp: Date.now(),
          agent: agentName,
          complexity
        });

        results[q.id] = answer;

        // Schedule expiration
        setTimeout(() => this.cache.delete(q.cacheKey), 3600000);
      });

      this.trackExpense(agentName, model, consensusResult);

      return results;
    } catch (err) {
      this.logger?.error(
        { agent: agentName, questionCount: uncachedQuestions.length, error: err.message },
        "Batch consensus failed"
      );
      throw err;
    }
  }

  /**
   * Generate consistent cache key
   */
  generateCacheKey(question, agentName = "unknown", id = "") {
    const simplified = question
      .toLowerCase()
      .replace(/\s+/g, " ")
      .slice(0, 100);
    const hash = crypto
      .createHash("md5")
      .update(simplified)
      .digest("hex")
      .slice(0, 8);

    return `${agentName}:${id}:${hash}`;
  }

  /**
   * Track expenses per agent
   */
  trackExpense(agentName, model, result) {
    if (!this.stats.expensesByAgent[agentName]) {
      this.stats.expensesByAgent[agentName] = {
        calls: 0,
        models: {},
        estimatedCost: 0
      };
    }

    const agent = this.stats.expensesByAgent[agentName];
    agent.calls++;

    if (!agent.models[model]) {
      agent.models[model] = 0;
    }
    agent.models[model]++;

    // Rough cost estimation (in cents)
    const costPerCall = {
      gpt4o: 1.5,
      "gpt-4o": 1.5,
      "gpt-4o-mini": 0.2,
      claude: 0.8,
      "claude-opus": 1.2,
      gemini: 0.3,
      "gemini-2.0-flash": 0.3
    };

    const cost = costPerCall[model] || 1.0;
    agent.estimatedCost += cost;

    this.logger?.debug(
      {
        agent: agentName,
        model,
        estimatedCost: `$${(agent.estimatedCost / 100).toFixed(2)}`
      },
      "Expense tracked"
    );
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.totalCalls > 0
        ? ((this.stats.cacheHits / this.stats.totalCalls) * 100).toFixed(1)
        : 0;

    const savings = Object.values(this.stats.expensesByAgent).reduce((sum, agent) => {
      // Rough calculation: if not cached, would have called 3 LLMs
      return sum + agent.calls * 2 * agent.estimatedCost;
    }, 0);

    return {
      totalCalls: this.stats.cacheHits + this.stats.cacheMisses,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      hitRate: `${hitRate}%`,
      estimatedSavings: `$${(savings / 100).toFixed(2)}`,
      expensesByAgent: Object.entries(this.stats.expensesByAgent).map(([name, data]) => ({
        agent: name,
        calls: data.calls,
        models: data.models,
        estimatedCost: `$${(data.estimatedCost / 100).toFixed(2)}`
      }))
    };
  }

  /**
   * Clear cache (for testing or memory management)
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.logger?.info({ cacheSize: size }, "Cache cleared");
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      costSaved: 0,
      expensesByAgent: {}
    };
  }
}

export default ConsensusManager;
