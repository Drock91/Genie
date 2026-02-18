import { makeAgentOutput } from "../models.js";

export class BaseAgent {
  constructor({ name, logger }) {
    this.name = name;
    this.logger = logger;
    
    // Set global context for LLM tracking
    if (typeof global !== 'undefined') {
      global.currentAgent = this.name;
    }
  }

  info(meta, msg) {
    this.logger?.info?.({ agent: this.name, ...meta }, msg);
  }

  warn(meta, msg) {
    this.logger?.warn?.({ agent: this.name, ...meta }, msg);
  }

  error(meta, msg) {
    this.logger?.error?.({ agent: this.name, ...meta }, msg);
  }

  // Override in subclasses
  async run(_input) {
    return makeAgentOutput({ summary: `${this.name}: no-op` });
  }
}
