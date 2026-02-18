import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

function assertKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY env var");
  }
}

function validateInput(model, system, user, schema) {
  if (!model || typeof model !== 'string') throw new Error("Invalid model");
  if (!system || typeof system !== 'string') throw new Error("Invalid system prompt");
  if (!user || typeof user !== 'string') throw new Error("Invalid user prompt");
  // Schema is optional - if not provided, we'll use regular text generation
  if (schema && (!schema.name || !schema.schema)) throw new Error("Invalid schema format");
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function llmJson({ model, system, user, schema, temperature = 0.2, logger = null }) {
  assertKey();
  validateInput(model, system, user, schema);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (logger) logger.info({ attempt, model }, "LLM request");

      const requestConfig = {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature
      };

      // Add JSON schema mode only if schema is provided
      if (schema && schema.name && schema.schema) {
        requestConfig.response_format = {
          type: "json_schema",
          json_schema: {
            name: schema.name,
            strict: true,
            schema: schema.schema
          }
        };
      }

      const resp = await Promise.race([
        client.chat.completions.create(requestConfig),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS))
      ]);

      const text = resp.choices?.[0]?.message?.content;
      if (!text) throw new Error("No response text from model");

      const parsed = JSON.parse(text);
      if (logger) logger.info({ attempt, model }, "LLM success");
      return parsed;
    } catch (err) {
      lastError = err;
      if (logger) logger.warn({ attempt, error: err.message }, "LLM attempt failed");
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`LLM failed after ${MAX_RETRIES} retries: ${lastError.message}`);
}

/**
 * Generate an image using DALL-E
 */
export async function generateImage({ prompt, size = "1024x1024", model = "dall-e-3", logger = null }) {
  assertKey();

  if (!prompt || typeof prompt !== 'string') {
    throw new Error("Invalid prompt");
  }

  try {
    if (logger) logger.info({ model, size }, "Image generation request");

    const resp = await client.images.generate({
      model,
      prompt,
      n: 1,
      size,
      response_format: "b64_json"
    });

    if (!resp.data || !resp.data[0]) {
      throw new Error("No image data returned");
    }

    const imageData = resp.data[0].b64_json;
    if (logger) logger.info({ model }, "Image generation success");

    return {
      b64: imageData,
      prompt,
      model,
      size
    };
  } catch (err) {
    if (logger) logger.error({ error: err.message, prompt }, "Image generation failed");
    throw new Error(`Image generation failed: ${err.message}`);
  }
}
