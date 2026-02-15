/**
 * OpenAI Provider
 * Wraps the existing OpenAI functionality as a provider for multi-LLM orchestrator
 */

import { llmJson as openaiLlmJson } from "../openaiClient.js";

export class OpenAIProvider {
  constructor(logger = null) {
    this.logger = logger;
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    const log = logger || this.logger;
    return await openaiLlmJson({
      model,
      system,
      user,
      schema,
      temperature,
      logger: log
    });
  }

  async healthCheck() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

export default OpenAIProvider;
