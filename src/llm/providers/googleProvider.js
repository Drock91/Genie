/**
 * Google Gemini Provider
 * Supports Google's Gemini models for multi-LLM orchestration
 * Requires GOOGLE_API_KEY environment variable
 */

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

function assertKey() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("Missing GOOGLE_API_KEY env var");
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

export class GoogleProvider {
  constructor(logger = null) {
    this.logger = logger;
    this.client = null;
    this._initializeClient();
  }

  _initializeClient() {
    try {
      assertKey();
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    } catch (err) {
      this.logger?.warn({ error: err.message }, "Failed to initialize Google client");
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
        log?.info({ attempt, model }, "Google request");

        const generativeModel = this.client.getGenerativeModel({
          model,
          generationConfig: {
            temperature,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096,
          },
          systemInstruction: `${system}\n\nYou MUST respond with valid JSON only. No other text.`,
        });

        const response = await Promise.race([
          generativeModel.generateContent(
            `${user}\n\nRespond with ONLY valid JSON, no markdown or extra text.`
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT_MS)
          )
        ]);

        if (!response) {
          throw new Error("No response from Google Gemini");
        }

        // Handle Google's response format
        let text = null;
        
        // Try different response formats
        if (response.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = response.response.candidates[0].content.parts[0].text;
        } else if (response.response?.text) {
          text = response.response.text;
        } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = response.candidates[0].content.parts[0].text;
        } else if (response.text) {
          text = response.text;
        }

        if (!text) {
          log?.warn({ response: JSON.stringify(response, null, 2) }, "Unexpected Google response format");
          throw new Error("No text in Gemini response");
        }

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
          throw new Error(
            `No JSON found in response: ${jsonText.substring(0, 100)}`
          );
        }

        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(jsonText);
        log?.info({ attempt, model }, "Google success");
        return parsed;
      } catch (err) {
        lastError = err;
        log?.warn({ attempt, error: err.message }, "Google attempt failed");
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(`Google failed after ${MAX_RETRIES} retries: ${lastError.message}`);
  }

  async healthCheck() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

export default GoogleProvider;
