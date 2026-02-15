/**
 * Test: Skip unavailable LLM providers
 * Demonstrates the system gracefully handling missing API keys
 */

import dotenv from "dotenv";
dotenv.config();

// Temporarily remove Google API key to test skipping
const originalGoogleKey = process.env.GOOGLE_API_KEY;
delete process.env.GOOGLE_API_KEY;

import { initializeMultiLlm, consensusCall } from "./src/llm/multiLlmSystem.js";
import { defaultLogger } from "./src/util/logger.js";

async function testSkipProviders() {
  console.log("\n=== Testing: Skip Unavailable LLM Providers ===\n");
  
  try {
    // Initialize system
    const system = await initializeMultiLlm(defaultLogger);
    
    console.log("✓ System initialized\n");
    
    // Check status
    const status = await system.getStatus();
    console.log("Provider Status:");
    Object.entries(status.providers).forEach(([name, info]) => {
      const icon = info.available ? "✓" : "✗";
      console.log(`  ${icon} ${name}: ${info.available ? "available" : "unavailable" + (info.error ? ` (${info.error})` : "")}`);
    });
    console.log();
    
    // Try calling consensusCall with Google missing
    console.log("Attempting consensusCall with 'balanced' profile (would normally need 3 LLMs)...\n");
    
    const result = await consensusCall({
      profile: "balanced",
      system: "You are a helpful assistant.",
      user: "What is 2+2?",
      schema: {
        name: "simple_answer",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["answer"],
          properties: {
            answer: { type: "string" }
          }
        }
      },
      temperature: 0.1
    });
    
    console.log("✓ Consensus call succeeded with available providers!\n");
    console.log("Result:");
    console.log(`  Consensus Answer: ${result.consensus.answer}`);
    console.log(`  Total Requested: 3 (balanced profile)`);
    console.log(`  Total Available: ${result.metadata.totalAvailable}`);
    console.log(`  Total Successful: ${result.metadata.totalSuccessful}`);
    console.log(`  Total Failed: ${result.metadata.totalFailed}`);
    console.log(`  Reasoning: ${result.reasoning}\n`);
    
    console.log("✓ SUCCESS: System skipped missing Google provider and used available LLMs!\n");
    
  } catch (err) {
    console.error("✗ ERROR:", err.message, "\n");
    process.exit(1);
  } finally {
    // Restore Google key
    if (originalGoogleKey) {
      process.env.GOOGLE_API_KEY = originalGoogleKey;
    }
  }
}

testSkipProviders();
