/**
 * Anthropic Claude Provider
 * Supports both free Claude (on-device) and paid Claude models
 * Requires ANTHROPIC_API_KEY environment variable
 */

import dotenv from "dotenv";
dotenv.config();

import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

function assertKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY env var");
  }
}

function validateInput(model, system, user, schema) {
  if (!model || typeof model !== "string") throw new Error("Invalid model");
  if (!system || typeof system !== "string") throw new Error("Invalid system prompt");
  if (!user || typeof user !== "string") throw new Error("Invalid user prompt");
  if (!schema || !schema.name || !schema.schema) throw new Error("Invalid schema");
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class AnthropicProvider {
  constructor(logger = null) {
    this.logger = logger;
    this.client = null;
    this._initializeClient();
  }

  _initializeClient() {
    try {
      assertKey();
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    } catch (err) {
      this.logger?.warn({ error: err.message }, "Failed to initialize Anthropic client");
    }
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    if (!this.client) {
      assertKey();
      this._initializeClient();
    }

    validateInput(model, system, user, schema);

    const log = logger || this.logger;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log?.info({ attempt, model }, "Anthropic request");

        const response = await Promise.race([
          this.client.messages.create({
            model,
            max_tokens: 4096,
            system: `${system}\n\nYou MUST respond with valid JSON only. No other text.`,
            messages: [
              {
                role: "user",
                content: `${user}\n\nRespond with ONLY valid JSON, no markdown or extra text.`
              }
            ],
            temperature
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT_MS)
          )
        ]);

        const text = response.content?.[0]?.text;
        if (!text) throw new Error("No response text from model");

        // Clean and extract JSON from the response
        let jsonText = text.trim();
        
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
          jsonText = jsonText.slice(0, -3);
        }
        
        jsonText = jsonText.trim();
        
        // Try to find JSON object
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error(`No JSON found in response: ${jsonText.substring(0, 100)}`);
        }
        
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonText);
        log?.info({ attempt, model }, "Anthropic success");
        return parsed;
      } catch (err) {
        lastError = err;
        log?.warn({ attempt, error: err.message }, "Anthropic attempt failed");
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(`Anthropic failed after ${MAX_RETRIES} retries: ${lastError.message}`);
  }

  async healthCheck() {
    try {
      if (!this.client) {
        assertKey();
        this._initializeClient();
      }
      return true;
    } catch {
      return false;
    }
  }
}

export default AnthropicProvider;
