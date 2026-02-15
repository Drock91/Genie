/**
 * Multi-LLM System Test & Demo
 * Run this to test your multi-LLM setup
 * 
 * Usage:
 *  node src/llm/multiLlmDemo.js
 */

import dotenv from "dotenv";
dotenv.config();

import { initializeMultiLlm, consensusCall } from "./multiLlmSystem.js";
import { multiLlmAnalysis, adaptiveConsensus } from "./multiLlmUsage.js";
import ConsensusEngine from "./consensusEngine.js";

// Simple logger for demo
const logger = {
  info: (data, msg) => console.log(`✓ ${msg}`, data),
  warn: (data, msg) => console.warn(`⚠ ${msg}`, data),
  error: (data, msg) => console.error(`✗ ${msg}`, data)
};

// Test schema
const testSchema = {
  name: "demo_response",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["answer", "reasoning"],
    properties: {
      answer: { type: "string" },
      reasoning: { type: "string" }
    }
  }
};

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Multi-LLM Consensus System Demo      ║");
  console.log("╚════════════════════════════════════════╝\n");

  try {
    // Step 1: Initialize
    console.log("📦 Step 1: Initializing Multi-LLM System (OpenAI + Anthropic + Google)...");
    const multiLlm = await initializeMultiLlm(logger);
    console.log("✅ Initialized\n");

    // Step 2: Check status
    console.log("🔍 Step 2: Checking Provider Status...");
    const status = await multiLlm.getStatus();
    console.log("Status:", JSON.stringify(status, null, 2), "\n");

    // Step 3: Test consensus call
    console.log("🤖 Step 3: Testing Consensus Call...");
    console.log("Profile available:", multiLlm.getProfiles());

    const consensusResult = await consensusCall({
      profile: "balanced",
      system: "You are a helpful assistant.",
      user: "What is 2+2? Answer very briefly.",
      schema: testSchema,
      temperature: 0.1
    });

    console.log("✅ Consensus Result:");
    console.log("  - Consensus Answer:", consensusResult.consensus.answer);
    console.log("  - Success Rate:", 
      `${consensusResult.metadata.totalSuccessful}/${consensusResult.metadata.totalRequested}`);
    console.log("  - Reasoning:", consensusResult.reasoning);
    console.log("");

    // Step 4: Test different profiles
    console.log("📊 Step 4: Testing Different Profiles...");
    
    const profiles = ["economical", "balanced", "accurate"];
    for (const profile of profiles) {
      try {
        const result = await consensusCall({
          profile,
          system: "You are helpful.",
          user: "Is Python good for web development?",
          schema: testSchema,
          temperature: 0.2
        });
        console.log(`✓ ${profile}: Success (${result.metadata.totalSuccessful} LLMs)`);
      } catch (err) {
        console.log(`⚠ ${profile}: ${err.message}`);
      }
    }
    console.log("");

    // Step 5: Test consensus methods
    console.log("🔀 Step 5: Testing Consensus Methods...");
    
    // Simulate multiple responses
    const mockResponses = [
      { method: "REST", reason: "Simple and standard" },
      { method: "REST", reason: "Simple and standard" },
      { method: "GraphQL", reason: "More flexible" }
    ];

    const voting = ConsensusEngine.voting(mockResponses);
    console.log("Voting consensus:", voting.consensus);
    console.log("Agreement: ", voting.agreementPercentage.toFixed(1) + "%");
    
    const committee = ConsensusEngine.committee(mockResponses);
    console.log("Committee groups:", committee.totalGroups);
    console.log("");

    // Step 6: Summary
    console.log("╔════════════════════════════════════════╗");
    console.log("║  ✅ Demo Complete!                    ║");
    console.log("╚════════════════════════════════════════╝\n");

    console.log("Next steps:");
    console.log("1. Check the documentation:");
    console.log("   - MULTI_LLM_README.md");
    console.log("   - MULTI_LLM_INTEGRATION.md");
    console.log("   - MULTI_LLM_QUICK_REFERENCE.md");
    console.log("");
    console.log("2. Update your agents to use consensusCall()");
    console.log("");
    console.log("3. Choose profiles based on use case:");
    console.log("   - economical: Quick, cheap");
    console.log("   - balanced: General use");
    console.log("   - accurate: Important decisions");
    console.log("");

  } catch (err) {
    console.error("❌ Error during demo:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run demo
main();
