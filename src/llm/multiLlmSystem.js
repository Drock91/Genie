/**
 * Multi-LLM System Initialization
 * Sets up and initializes the multi-LLM orchestrator for use in the agent system
 */

import MultiLlmOrchestrator from "./multiLlmOrchestrator.js";
import OpenAIProvider from "./providers/openaiProvider.js";
import AnthropicProvider from "./providers/anthropicProvider.js";
import GoogleProvider from "./providers/googleProvider.js";
import { LLM_CONFIGS, LLM_POOLS, LLM_PROFILES } from "./multiLlmConfig.js";

class MultiLlmSystem {
  constructor(logger = null) {
    this.logger = logger;
    this.orchestrator = null;
    this.initialized = false;
    this.paidBudgetUsd = Number(process.env.PAID_BUDGET_USD || "0");
    this.paidSpentUsd = 0;
    this.selectionMode = process.env.PAID_SELECTION_MODE || "round_robin";
    this.poolQueues = {
      paid: [],
      free: []
    };
    this.poolIndex = {
      paid: 0,
      free: 0
    };
  }

  /**
   * Initialize the multi-LLM system
   * Sets up all available providers
   */
  async initialize() {
    try {
      this.logger?.info("Initializing MultiLLM system");

      this.orchestrator = new MultiLlmOrchestrator({}, this.logger);

      // Register OpenAI provider
      try {
        const openaiProvider = new OpenAIProvider(this.logger);
        this.orchestrator.registerProvider("openai", openaiProvider);
        this.logger?.info("OpenAI provider registered");
      } catch (err) {
        this.logger?.warn({ error: err.message }, "Failed to register OpenAI");
      }

      // Register Anthropic provider
      try {
        const anthropicProvider = new AnthropicProvider(this.logger);
        this.orchestrator.registerProvider("anthropic", anthropicProvider);
        this.logger?.info("Anthropic provider registered");
      } catch (err) {
        this.logger?.warn({ error: err.message }, "Failed to register Anthropic");
      }

      // Register Google provider
      try {
        const googleProvider = new GoogleProvider(this.logger);
        this.orchestrator.registerProvider("google", googleProvider);
        this.logger?.info("Google provider registered");
      } catch (err) {
        this.logger?.warn({ error: err.message }, "Failed to register Google");
      }

      // Check provider health
      const status = await this.orchestrator.getProviderStatus();
      this.logger?.info({ status }, "Provider health check complete");

      this.paidSpentUsd = 0;

      this.initialized = true;
      return true;
    } catch (err) {
      this.logger?.error({ error: err.message }, "Failed to initialize MultiLLM");
      return false;
    }
  }

  /**
   * Get orchestrator instance
   */
  getOrchestrator() {
    if (!this.initialized) {
      throw new Error("MultiLLM system not initialized. Call initialize() first.");
    }
    return this.orchestrator;
  }

  /**
   * Get available profiles
   */
  getProfiles() {
    return Object.keys(LLM_PROFILES);
  }

  /**
   * Call multiple LLMs with consensus
   */
  async consensusCall(config) {
    if (!this.initialized) {
      throw new Error("MultiLLM system not initialized");
    }

    const {
      profile = "balanced",
      system,
      user,
      schema,
      temperature = 0.2,
      consensusMethod = "voting",
      consensusLevel = "single",
      pool = null,
      selectionMode = null
    } = config;

    const desiredPool = pool || (profile === "fast" || profile === "economical" ? "free" : "paid");
    const mode = selectionMode || this.selectionMode;
    const desiredCount = consensusLevel === "consensus"
      ? Number(process.env.CONSENSUS_COUNT || "2")
      : 1;

    let llmConfigs = await this._selectFromPool(desiredPool, desiredCount, mode, profile);
    
    // Add pool information to configs for tracking
    llmConfigs = llmConfigs.map(cfg => ({ ...cfg, pool: desiredPool }));

    if (llmConfigs.length === 0) {
      this.logger?.error({ profile, pool: desiredPool }, "No available providers for pool");
      throw new Error("No available LLM providers for selected pool. Check API keys.");
    }

    // Enforce paid budget cap by falling back to free pool when possible
    if (desiredPool === "paid" && this.paidBudgetUsd > 0) {
      const estimated = this._estimateCost(llmConfigs);
      if (this.paidSpentUsd + estimated > this.paidBudgetUsd) {
        this.logger?.warn(
          { estimated, spent: this.paidSpentUsd, budget: this.paidBudgetUsd },
          "Paid budget exceeded, falling back to free pool"
        );
        llmConfigs = await this._selectFromPool("free", desiredCount, mode, profile);
      }
    }

    try {
      const result = await this.orchestrator.consensusCall({
        llmConfigs,
        system,
        user,
        schema,
        temperature,
        consensusMethod
      });

      if (desiredPool === "paid") {
        this.paidSpentUsd += this._estimateCost(llmConfigs);
      }

      return result;
    } catch (err) {
      // Fallback to free pool if paid providers fail
      if (desiredPool === "paid") {
        this.logger?.warn({ error: err.message }, "Paid pool failed, retrying with free pool");
        const fallbackConfigs = await this._selectFromPool("free", desiredCount, mode, profile);
        if (fallbackConfigs.length === 0) {
          throw err;
        }

        return await this.orchestrator.consensusCall({
          llmConfigs: fallbackConfigs,
          system,
          user,
          schema,
          temperature,
          consensusMethod
        });
      }

      throw err;
    }
  }

  async _selectFromPool(pool, count, selectionMode, profile) {
    const poolConfigs = LLM_POOLS[pool] || LLM_PROFILES[profile] || [];
    let available = await this.orchestrator._filterAvailableProviders(poolConfigs);

    if (available.length === 0) {
      return [];
    }

    // Ensure stable distribution with a shuffled queue
    if (selectionMode === "round_robin") {
      if (this.poolQueues[pool].length === 0) {
        this.poolQueues[pool] = this._shuffle([...available]);
        this.poolIndex[pool] = 0;
      }

      const picked = [];
      while (picked.length < Math.min(count, available.length)) {
        if (this.poolIndex[pool] >= this.poolQueues[pool].length) {
          this.poolQueues[pool] = this._shuffle([...available]);
          this.poolIndex[pool] = 0;
        }
        picked.push(this.poolQueues[pool][this.poolIndex[pool]]);
        this.poolIndex[pool] += 1;
      }
      return picked;
    }

    // Random selection
    return this._shuffle([...available]).slice(0, Math.min(count, available.length));
  }

  _estimateCost(llmConfigs) {
    const perCallUsd = {
      "gpt-4o": 0.02,
      "gpt-4o-mini": 0.002,
      "gpt-4-turbo": 0.02,
      "gpt-3.5-turbo": 0.001,
      "claude-opus-4-1-20250805": 0.03,
      "claude-sonnet-4-20250514": 0.015,
      "claude-3-5-haiku-20241022": 0.003,
      "gemini-2.0-flash": 0.002
    };

    return llmConfigs.reduce((sum, cfg) => sum + (perCallUsd[cfg.model] || 0.01), 0);
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Call by cost profile
   */
  async callByProfile(config) {
    if (!this.initialized) {
      throw new Error("MultiLLM system not initialized");
    }

    return await this.orchestrator.callByProfile(config);
  }

  /**
   * Get provider status
   */
  async getStatus() {
    if (!this.initialized) {
      return { initialized: false };
    }

    const status = await this.orchestrator.getProviderStatus();
    return {
      initialized: true,
      providers: status,
      availableProfiles: this.getProfiles()
    };
  }

  /**
   * Health check - verify system is working
   */
  async healthCheck() {
    if (!this.initialized) return false;

    try {
      const status = await this.getStatus();
      const activeProviders = Object.values(status.providers)
        .filter(p => p.available).length;
      
      // System is healthy if at least one provider is available
      return activeProviders > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Global instance for application-wide use
 */
let globalInstance = null;

/**
 * Initialize global MultiLLM system
 */
export async function initializeMultiLlm(logger = null) {
  if (globalInstance && globalInstance.initialized) {
    return globalInstance;
  }

  globalInstance = new MultiLlmSystem(logger);
  await globalInstance.initialize();
  return globalInstance;
}

/**
 * Get global MultiLLM system
 */
export function getMultiLlm() {
  if (!globalInstance || !globalInstance.initialized) {
    throw new Error(
      "MultiLLM system not initialized. Call initializeMultiLlm() first."
    );
  }
  return globalInstance;
}

/**
 * Shorthand for consensus call
 */
export async function consensusCall(config) {
  const multiLlm = getMultiLlm();
  return await multiLlm.consensusCall(config);
}

/**
 * Shorthand for cost-based call
 */
export async function callByProfile(config) {
  const multiLlm = getMultiLlm();
  return await multiLlm.callByProfile(config);
}

export default MultiLlmSystem;
