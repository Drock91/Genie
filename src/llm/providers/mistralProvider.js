/**
 * Mistral Provider
 * Integrates Mistral AI models into the multi-LLM orchestrator
 * Requires MISTRAL_API_KEY environment variable
 */

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

function assertKey() {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("Missing MISTRAL_API_KEY env var");
  }
}

function validateInput(model, system, user, schema) {
  if (!model || typeof model !== "string") throw new Error("Invalid model");
  if (!system || typeof system !== "string") throw new Error("Invalid system prompt");
  if (!user || typeof user !== "string") throw new Error("Invalid user prompt");
  if (schema && (!schema.name || !schema.schema)) throw new Error("Invalid schema format");
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class MistralProvider {
  constructor(logger = null) {
    this.logger = logger;
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = "https://api.mistral.ai/v1";
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    assertKey();
    validateInput(model, system, user, schema);

    const log = logger || this.logger;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log?.info({ attempt, model }, "Mistral request");

        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model,
            temperature,
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content: `${system}\n\nYou MUST respond with valid JSON only. No other text.`
              },
              {
                role: "user",
                content: `${user}\n\nRespond with ONLY valid JSON, no markdown or extra text.`
              }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: REQUEST_TIMEOUT_MS
          }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        if (!text) throw new Error("No response text from Mistral model");

        // Clean and extract JSON from the response
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }

        jsonText = jsonText.trim();

        // Try to find JSON object
        const firstBrace = jsonText.indexOf("{");
        const lastBrace = jsonText.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error(`No JSON found in response: ${jsonText.substring(0, 100)}`);
        }

        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonText);
        log?.info({ attempt, model }, "Mistral success");
        return parsed;
      } catch (err) {
        lastError = err;
        log?.warn({ attempt, error: err.message }, "Mistral attempt failed");
        
        // Check for rate limit error and record it
        const isRateLimit = err.message?.includes('rate') || 
                            err.response?.status === 429;
        if (isRateLimit && global.llmUsageTracker) {
          const retryAfter = err.response?.headers?.['retry-after'] || null;
          global.llmUsageTracker.recordRateLimitHit({
            provider: 'mistral',
            model,
            errorMessage: err.message,
            retryAfter
          });
        }
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(`Mistral failed after ${MAX_RETRIES} retries: ${lastError.message}`);
  }

  async healthCheck() {
    try {
      if (!process.env.MISTRAL_API_KEY) {
        return false;
      }
      // Simple check - try a minimal request
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "mistral-small",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 10
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 5000
        }
      );
      return !!response.data;
    } catch {
      return false;
    }
  }
}

export default MistralProvider;
