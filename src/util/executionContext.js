/**
 * Execution Context Manager
 * Replaces global state with a centralized, thread-safe context system
 */

/**
 * Execution context - stores request-specific state
 * Replaces: global.currentAgent, global.llmUsageTracker, etc.
 */
class ExecutionContext {
  constructor(traceId) {
    this.traceId = traceId;
    this.currentAgent = null;
    this.llmUsageTracker = null;
    this.startTime = Date.now();
    this.metadata = {};
    this.state = new Map();
  }

  /**
   * Set current agent in context
   * @param {string} agentName - Name of agent
   */
  setCurrentAgent(agentName) {
    this.currentAgent = agentName;
  }

  /**
   * Get current agent
   * @returns {string|null} Current agent name
   */
  getCurrentAgent() {
    return this.currentAgent;
  }

  /**
   * Set LLM usage tracker
   * @param {Object} tracker - Tracker instance
   */
  setLLMUsageTracker(tracker) {
    this.llmUsageTracker = tracker;
  }

  /**
   * Get LLM usage tracker
   * @returns {Object|null} Tracker instance
   */
  getLLMUsageTracker() {
    return this.llmUsageTracker;
  }

  /**
   * Set arbitrary metadata
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   */
  setMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Get metadata
   * @param {string} key - Metadata key
   * @returns {*} Metadata value
   */
  getMetadata(key) {
    return this.metadata[key];
  }

  /**
   * Set custom state
   * @param {string} key - State key
   * @param {*} value - State value
   */
  setState(key, value) {
    this.state.set(key, value);
  }

  /**
   * Get custom state
   * @param {string} key - State key
   * @returns {*} State value
   */
  getState(key) {
    return this.state.get(key);
  }

  /**
   * Get elapsed time in milliseconds
   * @returns {number} Elapsed time
   */
  getElapsedTime() {
    return Date.now() - this.startTime;
  }

  /**
   * Get full context snapshot
   * @returns {Object} Context snapshot
   */
  snapshot() {
    return {
      traceId: this.traceId,
      currentAgent: this.currentAgent,
      elapsedTime: this.getElapsedTime(),
      metadata: { ...this.metadata },
      stateSize: this.state.size
    };
  }
}

/**
 * Execution Context Manager - manages context lifecycle
 */
class ExecutionContextManager {
  constructor() {
    this.contexts = new Map();
    this.currentTraceId = null;
  }

  /**
   * Create new execution context
   * @param {string} traceId - Unique trace ID
   * @returns {ExecutionContext} New context
   */
  createContext(traceId) {
    const context = new ExecutionContext(traceId);
    this.contexts.set(traceId, context);
    this.currentTraceId = traceId;
    return context;
  }

  /**
   * Get context by trace ID
   * @param {string} traceId - Trace ID
   * @returns {ExecutionContext|null} Context or null
   */
  getContext(traceId) {
    return this.contexts.get(traceId);
  }

  /**
   * Get current context
   * @returns {ExecutionContext|null} Current context or null
   */
  getCurrentContext() {
    if (!this.currentTraceId) return null;
    return this.contexts.get(this.currentTraceId);
  }

  /**
   * Set current trace ID
   * @param {string} traceId - Trace ID
   */
  setCurrentTraceId(traceId) {
    if (!this.contexts.has(traceId)) {
      throw new Error(`Trace ID not found: ${traceId}`);
    }
    this.currentTraceId = traceId;
  }

  /**
   * Clean up context
   * @param {string} traceId - Trace ID to clean up
   */
  cleanupContext(traceId) {
    this.contexts.delete(traceId);
    if (this.currentTraceId === traceId) {
      this.currentTraceId = null;
    }
  }

  /**
   * Get all active contexts
   * @returns {Array} Array of context snapshots
   */
  getActiveContexts() {
    return Array.from(this.contexts.values()).map(ctx => ctx.snapshot());
  }

  /**
   * Clear all contexts
   */
  clear() {
    this.contexts.clear();
    this.currentTraceId = null;
  }

  /**
   * Get context stats
   * @returns {Object} Stats object
   */
  getStats() {
    const contexts = Array.from(this.contexts.values());
    return {
      totalContexts: contexts.length,
      averageElapsedTime: contexts.length > 0 
        ? contexts.reduce((sum, ctx) => sum + ctx.getElapsedTime(), 0) / contexts.length 
        : 0,
      oldestContext: contexts.length > 0 
        ? Math.max(...contexts.map(ctx => ctx.getElapsedTime()))
        : 0
    };
  }
}

// Singleton instance
export const executionContextManager = new ExecutionContextManager();

/**
 * Get or create context for current execution
 * @param {string} traceId - Trace ID
 * @returns {ExecutionContext} Context
 */
export function getOrCreateContext(traceId) {
  let context = executionContextManager.getContext(traceId);
  if (!context) {
    context = executionContextManager.createContext(traceId);
  }
  return context;
}

/**
 * Get current execution context
 * @returns {ExecutionContext|null} Current context
 */
export function getCurrentContext() {
  return executionContextManager.getCurrentContext();
}

/**
 * Cleanup execution context
 * @param {string} traceId - Trace ID
 */
export function cleanupContext(traceId) {
  executionContextManager.cleanupContext(traceId);
}
