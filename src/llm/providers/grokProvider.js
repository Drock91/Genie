/**
 * Grok (xAI) Provider
 * Implements xAI's Grok models using their OpenAI-compatible API
 * 
 * API Docs: https://docs.x.ai/docs
 * Base URL: https://api.x.ai/v1
 */

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

// Initialize Grok client with xAI's base URL
function getClient() {
  if (!process.env.GROK_API_KEY) {
    throw new Error("Missing GROK_API_KEY env var");
  }
  
  return new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1"
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractJsonText(text) {
  let jsonText = text.trim();

  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.slice(3);
  }

  if (jsonText.endsWith("```")) {
    jsonText = jsonText.slice(0, -3);
  }

  jsonText = jsonText.trim();

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`No JSON found in response: ${jsonText.substring(0, 100)}`);
  }

  return jsonText.substring(firstBrace, lastBrace + 1);
}

export async function llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
  const client = getClient();

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (logger) logger.info({ attempt, model, provider: 'grok' }, "Grok LLM request");

      const requestConfig = {
        model: model || process.env.GROK_MODEL || "grok-3-latest",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature
      };

      // Grok supports JSON mode - add schema if provided
      if (schema && schema.name && schema.schema) {
        // Use response_format for JSON mode
        requestConfig.response_format = { type: "json_object" };
        // Add schema instructions to system prompt
        requestConfig.messages[0].content += `\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(schema.schema, null, 2)}`;
      }

      const resp = await Promise.race([
        client.chat.completions.create(requestConfig),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS))
      ]);

      const text = resp.choices?.[0]?.message?.content;
      if (!text) throw new Error("No response text from Grok model");

      const jsonText = extractJsonText(text);
      const parsed = JSON.parse(jsonText);
      
      if (logger) logger.info({ attempt, model, provider: 'grok' }, "Grok LLM success");
      return parsed;
    } catch (err) {
      lastError = err;
      if (logger) logger.warn({ attempt, error: err.message, provider: 'grok' }, "Grok attempt failed");
      
      // Don't retry on auth errors
      if (err.status === 401 || err.status === 403) {
        throw new Error(`Grok auth error: ${err.message}`);
      }
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

export class GrokProvider {
  constructor(logger = null) {
    this.logger = logger;
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    const log = logger || this.logger;
    return await llmJson({
      model: model || process.env.GROK_MODEL || "grok-3-latest",
      system,
      user,
      schema,
      temperature,
      logger: log
    });
  }

  async healthCheck() {
    try {
      if (!process.env.GROK_API_KEY) {
        return false;
      }
      // Quick connectivity test
      const client = getClient();
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

export default GrokProvider;
