/**
 * Multi-LLM Orchestrator
 * Manages multiple LLM providers simultaneously for consensus-based responses
 * Supports free (Claude, Grok) and paid (GPT-4, Claude Pro) models
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class MultiLlmOrchestrator {
  constructor(providers = {}, logger = null) {
    this.providers = providers; // { openai: OpenAIProvider, anthropic: AnthropicProvider, etc }
    this.logger = logger;
    this.timeout = 60000; // 60 second timeout per LLM
  }

  /**
   * Call multiple LLMs in parallel and return all responses
   * @param {Object} config - Configuration for the multi-LLM call
   * @param {Array<string>} config.llmConfigs - LLM configurations to use
   * @param {string} config.system - System prompt
   * @param {string} config.user - User prompt
   * @param {Object} config.schema - Response schema (for JSON mode)
   * @param {number} config.temperature - Temperature for generation
   * @returns {Object} { responses: [...], timestamp, metadata }
   */
  async callMultiple(config) {
    const { llmConfigs, system, user, schema, temperature = 0.2 } = config;
    
    if (!llmConfigs || llmConfigs.length === 0) {
      throw new Error("Must specify at least one LLM config");
    }

    // Filter out LLM configs whose providers don't have API keys
    const availableLlmConfigs = await this._filterAvailableProviders(llmConfigs);
    
    if (availableLlmConfigs.length === 0) {
      throw new Error("No LLM providers available. Please set required API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY");
    }

    this.logger?.info({ 
      requestedCount: llmConfigs.length, 
      availableCount: availableLlmConfigs.length 
    }, "Starting multi-LLM call with available providers");

    const promises = availableLlmConfigs.map(async (llmConfig) => {
      try {
        const result = await this._callSingleLlm(llmConfig, system, user, schema, temperature);
        return {
          model: llmConfig.model,
          provider: llmConfig.provider,
          status: "success",
          data: result,
          error: null
        };
      } catch (err) {
        this.logger?.warn({ model: llmConfig.model, error: err.message }, "LLM call failed");
        return {
          model: llmConfig.model,
          provider: llmConfig.provider,
          status: "failed",
          data: null,
          error: err.message
        };
      }
    });

    const responses = await Promise.allSettled(promises);
    const results = responses.map(r => r.value).filter(r => r);

    this.logger?.info({
      requested: llmConfigs.length,
      available: availableLlmConfigs.length,
      successful: results.filter(r => r.status === "success").length,
      failed: results.filter(r => r.status === "failed").length
    }, "Multi-LLM call complete");

    return {
      responses: results,
      timestamp: new Date().toISOString(),
      metadata: {
        totalRequested: llmConfigs.length,
        totalAvailable: availableLlmConfigs.length,
        totalSuccessful: results.filter(r => r.status === "success").length,
        totalFailed: results.filter(r => r.status === "failed").length
      }
    };
  }

  /**
   * Call multiple LLMs and reach consensus on the best response
   * @param {Object} config
   * @param {Array<string>} config.llmConfigs - LLM configurations
   * @param {string} config.system - System prompt
   * @param {string} config.user - User prompt
   * @param {Object} config.schema - Response schema
   * @param {string} config.consensusMethod - 'voting', 'averaging', 'best', 'most-similar'
   * @returns {Object} { consensus, responses, reasoning }
   */
  async consensusCall(config) {
    const {
      llmConfigs,
      system,
      user,
      schema,
      temperature = 0.2,
      consensusMethod = "voting"
    } = config;

    const result = await this.callMultiple({
      llmConfigs,
      system,
      user,
      schema,
      temperature
    });

    const successful = result.responses.filter(r => r.status === "success");
    
    if (successful.length === 0) {
      throw new Error("No successful LLM responses for consensus");
    }

    // If only one succeeded, return it
    if (successful.length === 1) {
      this.logger?.info({ model: successful[0].model }, "Only one LLM succeeded, returning single response");
      return {
        consensus: successful[0].data,
        responses: result.responses,
        reasoning: "Single response (others failed)",
        metadata: result.metadata
      };
    }

    // Multiple responses - apply consensus method
    const consensus = this._applyConsensus(successful, consensusMethod);

    return {
      consensus,
      responses: result.responses,
      reasoning: `Consensus via ${consensusMethod} method from ${successful.length} LLMs`,
      metadata: result.metadata
    };
  }

  /**
   * Call LLMs by cost profile (free/paid/balanced)
   * @param {Object} config
   * @param {string} config.costProfile - 'free', 'paid', 'balanced'
   * @param {string} config.system
   * @param {string} config.user
   * @param {Object} config.schema
   * @returns {Object} Consensus result
   */
  async callByProfile(config) {
    const { costProfile = "balanced", system, user, schema, temperature = 0.2 } = config;

    let llmConfigs = [];

    if (costProfile === "free") {
      // Use only free models
      llmConfigs = this._getFreeModels();
    } else if (costProfile === "paid") {
      // Use only paid models
      llmConfigs = this._getPaidModels();
    } else if (costProfile === "balanced") {
      // Use mix of free and paid for good coverage at lower cost
      llmConfigs = this._getBalancedModels();
    }

    if (llmConfigs.length === 0) {
      throw new Error(`No configured LLMs for profile: ${costProfile}`);
    }

    return this.consensusCall({
      llmConfigs,
      system,
      user,
      schema,
      temperature,
      consensusMethod: "voting"
    });
  }

  /**
   * Private: Filter LLM configs to only include those with available providers
   */
  async _filterAvailableProviders(llmConfigs) {
    const available = [];
    
    for (const llmConfig of llmConfigs) {
      const { provider } = llmConfig;
      const providerInstance = this.providers[provider];
      
      if (!providerInstance) {
        this.logger?.debug({ provider }, "Provider not registered, skipping");
        continue;
      }
      
      try {
        const isHealthy = await providerInstance.healthCheck?.();
        if (isHealthy) {
          available.push(llmConfig);
          this.logger?.debug({ provider, model: llmConfig.model }, "Provider available");
        } else {
          this.logger?.debug({ provider, model: llmConfig.model }, "Provider API key missing, skipping");
        }
      } catch (err) {
        this.logger?.debug({ provider, error: err.message }, "Provider healthcheck failed, skipping");
      }
    }
    
    return available;
  }

  /**
   * Private: Call a single LLM provider
   */
  async _callSingleLlm(llmConfig, system, user, schema, temperature) {
    const { provider, model } = llmConfig;
    const providerInstance = this.providers[provider];

    if (!providerInstance) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return await Promise.race([
      providerInstance.llmJson({
        model,
        system,
        user,
        schema,
        temperature,
        logger: this.logger
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), this.timeout)
      )
    ]);
  }

  /**
   * Determine best consensus from multiple responses
   */
  _applyConsensus(responses, method) {
    if (method === "voting") {
      return this._votingConsensus(responses);
    } else if (method === "averaging") {
      return this._averagingConsensus(responses);
    } else if (method === "best") {
      return responses[0].data; // First (best) response
    } else if (method === "most-similar") {
      return this._mostSimilarConsensus(responses);
    }
    return responses[0].data;
  }

  /**
   * Voting consensus: Most common response wins
   */
  _votingConsensus(responses) {
    const data = responses.map(r => r.data);
    const votes = new Map();

    data.forEach(item => {
      const key = JSON.stringify(item);
      votes.set(key, (votes.get(key) || 0) + 1);
    });

    let maxVotes = 0;
    let winner = data[0];

    votes.forEach((count, key) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = JSON.parse(key);
      }
    });

    return winner;
  }

  /**
   * Averaging consensus: Merge numeric fields, vote on others
   */
  _averagingConsensus(responses) {
    if (responses.length === 0) return {};

    const data = responses.map(r => r.data);
    const result = {};

    // Get all keys from all responses
    const allKeys = new Set();
    data.forEach(item => {
      if (typeof item === "object") {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    // Process each key
    allKeys.forEach(key => {
      const values = data
        .map(item => item?.[key])
        .filter(v => v !== undefined && v !== null);

      if (values.length === 0) return;

      // If all numeric, average them
      if (values.every(v => typeof v === "number")) {
        result[key] = values.reduce((a, b) => a + b, 0) / values.length;
      } else if (values.every(v => typeof v === "string")) {
        // For strings, take most common
        const stringVotes = new Map();
        values.forEach(v => stringVotes.set(v, (stringVotes.get(v) || 0) + 1));
        let maxCount = 0;
        let commonString = values[0];
        stringVotes.forEach((count, str) => {
          if (count > maxCount) {
            maxCount = count;
            commonString = str;
          }
        });
        result[key] = commonString;
      } else {
        // Take first value for complex types
        result[key] = values[0];
      }
    });

    return result;
  }

  /**
   * Most similar consensus: Find response most similar to others
   */
  _mostSimilarConsensus(responses) {
    if (responses.length <= 1) return responses[0]?.data;

    const data = responses.map(r => r.data);
    let bestMatch = data[0];
    let bestScore = -1;

    // For each response, score how similar it is to others
    for (let i = 0; i < data.length; i++) {
      let similarity = 0;
      for (let j = 0; j < data.length; j++) {
        if (i !== j) {
          similarity += this._calculateSimilarity(
            JSON.stringify(data[i]),
            JSON.stringify(data[j])
          );
        }
      }
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = data[i];
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity (Levenshtein-like)
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance for string similarity
   */
  _levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  /**
   * Get free LLM models
   */
  _getFreeModels() {
    return [
      { provider: "anthropic", model: "claude-free" },
      // Add more free models as configured
    ].filter(config => this.providers[config.provider]);
  }

  /**
   * Get paid LLM models
   */
  _getPaidModels() {
    return [
      { provider: "openai", model: "gpt-4o" },
      { provider: "anthropic", model: "claude-3-opus" },
      // Add more paid models as configured
    ].filter(config => this.providers[config.provider]);
  }

  /**
   * Get balanced mix of free and paid
   */
  _getBalancedModels() {
    return [
      { provider: "anthropic", model: "claude-free" },
      { provider: "openai", model: "gpt-4o" },
      // Mix of free and paid for good coverage
    ].filter(config => this.providers[config.provider]);
  }

  /**
   * Add a new provider
   */
  registerProvider(name, provider) {
    this.providers[name] = provider;
    this.logger?.info({ provider: name }, "Provider registered");
  }

  /**
   * Get health status of all providers
   */
  async getProviderStatus() {
    const status = {};

    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        const health = await provider.healthCheck?.();
        status[name] = { available: health !== false, provider: name };
      } catch (err) {
        status[name] = { available: false, error: err.message };
      }
    }

    return status;
  }
}

export default MultiLlmOrchestrator;
