import { consensusCall, initializeMultiLlm } from "./src/llm/multiLlmSystem.js";
import { logger } from "./src/util/logger.js";

async function test() {
  console.log("🧪 Testing consensusCall...");
  
  try {
    // Initialize multi-LLM system
    await initializeMultiLlm(logger);
    console.log("✅ Multi-LLM initialized\n");
    
    const result = await consensusCall({
      profile: "balanced",
      system: "You are a code generator. Generate frontend code.",
      user: "Generate a simple calculator in HTML, CSS, and JavaScript",
      schema: {
        name: "frontend_code",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["html", "css", "js"],
          properties: {
            html: { type: "string" },
            css: { type: "string" },
            js: { type: "string" }
          }
        }
      }
    });

    console.log("\n✅ Result received:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.consensus) {
      const c = result.consensus;
      console.log("\n📊 Consensus content:");
      console.log("  HTML length:", c.html?.length || 0);
      console.log("  CSS length:", c.css?.length || 0);
      console.log("  JS length:", c.js?.length || 0);
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  
  process.exit(0);
}

test();
