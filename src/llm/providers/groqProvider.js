/**
 * Groq Provider
 * Implements Groq's ultra-fast inference API (FREE tier available!)
 * 
 * API Docs: https://console.groq.com/docs/quickstart
 * Base URL: https://api.groq.com/openai/v1
 * 
 * Models:
 * - llama-3.3-70b-versatile (best quality)
 * - llama-3.1-8b-instant (fastest)
 * - mixtral-8x7b-32768 (good balance)
 * - gemma2-9b-it (compact)
 */

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

// Initialize Groq client (OpenAI-compatible)
function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY env var");
  }
  
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
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
      if (logger) logger.info({ attempt, model, provider: 'groq' }, "Groq LLM request");

      const requestConfig = {
        model: model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature
      };

      // Groq supports JSON mode
      if (schema && schema.name && schema.schema) {
        requestConfig.response_format = { type: "json_object" };
        // Add schema instructions to system prompt
        requestConfig.messages[0].content += `\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(schema.schema, null, 2)}`;
      }

      const resp = await Promise.race([
        client.chat.completions.create(requestConfig),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS))
      ]);

      const text = resp.choices?.[0]?.message?.content;
      if (!text) throw new Error("No response text from Groq model");

      const jsonText = extractJsonText(text);
      const parsed = JSON.parse(jsonText);
      
      if (logger) logger.info({ attempt, model, provider: 'groq' }, "Groq LLM success");
      return parsed;
    } catch (err) {
      lastError = err;
      if (logger) logger.warn({ attempt, error: err.message, provider: 'groq' }, "Groq attempt failed");
      
      // Don't retry on auth errors
      if (err.status === 401 || err.status === 403) {
        throw new Error(`Groq auth error: ${err.message}`);
      }
      
      // Handle rate limiting (Groq has rate limits even on free tier)
      if (err.status === 429) {
        const waitTime = RETRY_DELAY_MS * attempt * 2; // Back off more aggressively
        if (logger) logger.info({ waitTime }, "Rate limited, waiting...");
        await sleep(waitTime);
        continue;
      }
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

export class GroqProvider {
  constructor(logger = null) {
    this.logger = logger;
  }

  async llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
    const log = logger || this.logger;
    return await llmJson({
      model: model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      system,
      user,
      schema,
      temperature,
      logger: log
    });
  }

  async healthCheck() {
    try {
      if (!process.env.GROQ_API_KEY) {
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

export default GroqProvider;
