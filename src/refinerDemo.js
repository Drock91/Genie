#!/usr/bin/env node
/**
 * Request Refiner Demo
 * Shows how the RequestRefinerAgent improves input precision
 */

import "dotenv/config";
import { logger } from "./util/logger.js";
import { RequestRefinerAgent } from "./agents/requestRefinerAgent.js";
import { initializeMultiLlm } from "./llm/multiLlmSystem.js";

const testInputs = [
  "make me a website",
  "build api",
  "I want a todo app",
  "create social media platform",
  "build workout tracker with nutrition",
  "make game",
];

(async () => {
  console.log("🔬 Request Refiner Agent Demo");
  console.log("=" .repeat(80));
  console.log("Testing how the refiner improves vague requests\n");

  try {
    await initializeMultiLlm(logger);
    const refiner = new RequestRefinerAgent({ logger });

    // Allow custom input from command line
    const userInput = process.argv.slice(2).join(" ").trim();
    
    if (userInput) {
      // Single refinement from command line
      console.log(`\n🎯 Refining your request: "${userInput}"\n`);
      const result = await refiner.refineRequest(userInput);
      refiner.printRefinementResult(result);
      
      // Validate the refined request
      console.log("🔍 Validating refined request...\n");
      const validation = await refiner.validateRefinedRequest(result.refined);
      console.log("VALIDATION RESULTS:");
      console.log(`  ✓ Valid: ${validation.is_valid ? "YES" : "NO"}`);
      console.log(`  ✓ Completeness: ${validation.completeness_score}%`);
      console.log(`  ✓ Actionability: ${validation.actionability_score}%`);
      
      if (validation.issues && validation.issues.length > 0) {
        console.log("\n  Issues:");
        validation.issues.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`));
      }
      
      if (validation.recommendations && validation.recommendations.length > 0) {
        console.log("\n  Recommendations:");
        validation.recommendations.forEach((rec, i) => console.log(`    ${i + 1}. ${rec}`));
      }
      console.log("\n");
      
    } else {
      // Demo mode - test multiple examples
      console.log("Running demo mode with example inputs...\n");
      
      for (let i = 0; i < testInputs.length; i++) {
        const input = testInputs[i];
        console.log(`\n[${ i + 1}/${testInputs.length}] Testing: "${input}"`);
        console.log("-".repeat(80));
        
        const result = await refiner.refineRequest(input);
        
        console.log(`\n  ORIGINAL:  ${result.original}`);
        console.log(`  REFINED:   ${result.refined}`);
        console.log(`  CONFIDENCE: ${result.confidence}%`);
        console.log(`  CLARIFICATIONS: ${result.clarifications.length}`);
        
        if (result.assumptions.length > 0) {
          console.log(`  ASSUMPTIONS:`);
          result.assumptions.forEach(a => console.log(`    - ${a}`));
        }
        
        console.log("");
      }
      
      console.log("\n" + "=".repeat(80));
      console.log("✅ Demo complete!");
      console.log("\nTo test your own request, run:");
      console.log('  npm run refiner-demo -- "your request here"');
    }

  } catch (err) {
    console.error("\n❌ Error:", err.message);
    logger.error({ error: err.message, stack: err.stack }, "Demo failed");
    process.exit(1);
  }
})();
