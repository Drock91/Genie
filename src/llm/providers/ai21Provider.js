/**
 * AI21 Provider
 * Integrates AI21 Labs models into the multi-LLM orchestrator
 * Requires AI21_API_KEY environment variable
 */

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

function assertKey() {
  if (!process.env.AI21_API_KEY) {
    throw new Error("Missing AI21_API_KEY env var");
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

export class AI21Provider {
  constructor(logger = null) {
    this.logger = logger;
    this.apiKey = process.env.AI21_API_KEY;
    this.baseUrl = "https://api.ai21.com/studio/v1";
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    assertKey();
    validateInput(model, system, user, schema);

    const log = logger || this.logger;
    let lastError;

    // Map model names to AI21 endpoints
    const modelMap = {
      "j2-ultra": "j2-ultra",
      "j2-mid": "j2-mid",
      "jambachat": "jambachat"
    };

    const ai21Model = modelMap[model] || model;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log?.info({ attempt, model: ai21Model }, "AI21 request");

        const response = await axios.post(
          `${this.baseUrl}/${ai21Model}/chat/completions`,
          {
            model: ai21Model,
            temperature,
            maxTokens: 4096,
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

        const text = response.data?.choices?.[0]?.message?.content 
          || response.data?.completions?.[0]?.data?.text;

        if (!text) throw new Error("No response text from AI21 model");

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
        log?.info({ attempt, model: ai21Model }, "AI21 success");
        return parsed;
      } catch (err) {
        lastError = err;
        log?.warn({ attempt, error: err.message }, "AI21 attempt failed");
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(`AI21 failed after ${MAX_RETRIES} retries: ${lastError.message}`);
  }

  async healthCheck() {
    try {
      if (!process.env.AI21_API_KEY) {
        return false;
      }
      // Simple check - try a minimal request
      const response = await axios.post(
        `${this.baseUrl}/j2-ultra/chat/completions`,
        {
          model: "j2-ultra",
          maxTokens: 10,
          messages: [{ role: "user", content: "ping" }]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AI21_API_KEY}`,
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

export default AI21Provider;
