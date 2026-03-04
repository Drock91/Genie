import { makeAgentOutput } from "../models.js";
import { getCurrentContext } from "../util/executionContext.js";

/**
 * BaseAgent - Foundation class for all specialized agents
 * Provides logging and standard output contract
 */
export class BaseAgent {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.name - Agent name for logging
   * @param {Object} options.logger - Logger instance
   */
  constructor({ name, logger }) {
    this.name = name;
    this.logger = logger;
  }

  /**
   * Set current agent in execution context
   * Replaces global state with context manager
   */
  setCurrentAgent() {
    const context = getCurrentContext();
    if (context) {
      context.setCurrentAgent(this.name);
    }
  }

  /**
   * Log info message with agent context
   * @param {Object} meta - Metadata object
   * @param {string} msg - Message text
   */
  info(meta, msg) {
    this.logger?.info?.({ agent: this.name, ...meta }, msg);
  }

  /**
   * Log warning message with agent context
   * @param {Object} meta - Metadata object
   * @param {string} msg - Message text
   */
  warn(meta, msg) {
    this.logger?.warn?.({ agent: this.name, ...meta }, msg);
  }

  /**
   * Log error message with agent context
   * @param {Object} meta - Metadata object
   * @param {string} msg - Message text
   */
  error(meta, msg) {
    this.logger?.error?.({ agent: this.name, ...meta }, msg);
  }

  /**
   * Run agent (override in subclasses)
   * @param {*} _input - Input data
   * @returns {Promise<Object>} Standardized agent output
   */
  async run(_input) {
    return makeAgentOutput({ summary: `${this.name}: no-op` });
  }
}
