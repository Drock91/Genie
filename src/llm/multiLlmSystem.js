/**
 * Multi-LLM System Initialization
 * Sets up and initializes the multi-LLM orchestrator for use in the agent system
 */

import MultiLlmOrchestrator from "./multiLlmOrchestrator.js";
import OpenAIProvider from "./providers/openaiProvider.js";
import AnthropicProvider from "./providers/anthropicProvider.js";
import GoogleProvider from "./providers/googleProvider.js";
import { LLM_PROFILES } from "./multiLlmConfig.js";

class MultiLlmSystem {
  constructor(logger = null) {
    this.logger = logger;
    this.orchestrator = null;
    this.initialized = false;
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
      consensusMethod = "voting"
    } = config;

    return await this.orchestrator.consensusCall({
      llmConfigs: LLM_PROFILES[profile] || LLM_PROFILES.balanced,
      system,
      user,
      schema,
      temperature,
      consensusMethod
    });
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
