import { initializeMultiLlm } from "./src/llm/multiLlmSystem.js";
import { DatabaseArchitectAgent } from "./src/agents/databaseArchitectAgent.js";
import { UserAuthAgent } from "./src/agents/userAuthAgent.js";
import { ApiIntegrationAgent } from "./src/agents/apiIntegrationAgent.js";
import { SecurityHardeningAgent } from "./src/agents/securityHardeningAgent.js";
import { MonitoringAgent } from "./src/agents/monitoringAgent.js";
import { DeploymentAgent } from "./src/agents/deploymentAgent.js";
import { logger } from "./src/util/logger.js";
global.multiLlmSystem = await initializeMultiLlm(logger);

console.log("\n✅ GENIE COMPLETE TEST\n");
console.log("=".repeat(70));

const agents = {
  database: new DatabaseArchitectAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
  auth: new UserAuthAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
  api: new ApiIntegrationAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
  security: new SecurityHardeningAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
  monitoring: new MonitoringAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
  deployment: new DeploymentAgent({ logger, multiLlmSystem: global.multiLlmSystem })
};

const request = {
  description: "E-commerce platform with user auth, products, payments, and monitoring",
  type: "SaaS",
  features: ["auth", "database", "api", "security", "monitoring", "deployment"]
};

console.log("📌 REQUEST:", request.description);
console.log("=".repeat(70));

// Test each agent
const results = {};

for (const [name, agent] of Object.entries(agents)) {
  console.log(`\n🧪 Testing ${name.toUpperCase()} Agent...`);
  try {
    const result = name === "database" ? await agent.designSchema(request)
    : name === "auth" ? await agent.generateAuthSystem(request)
    : name === "api" ? await agent.generateApiClient(request)
    : name === "security" ? await agent.hardenApplication(request)
    : name === "monitoring" ? await agent.setupMonitoring(request)
    : name === "deployment" ? await agent.setupDeployment(request)
    : null;
    
    if (result?.patches?.length) {
      results[name] = { status: "✅ PASS", patches: result.patches.length };
      console.log(`   ✅ Generated ${result.patches.length} files`);
      result.patches.slice(0, 3).forEach(p => console.log(`      • ${p.fileName}`));
      if (result.patches.length > 3) console.log(`      ... and ${result.patches.length - 3} more`);
    } else {
      results[name] = { status: "⚠️  PARTIAL" };
      console.log(`   ⚠️  Limited output (fallback)`);
    }
  } catch (err) {
    results[name] = { status: "❌ FAIL", error: err.message };
    console.log(`   ❌ Error: ${err.message}`);
  }
}

console.log("\n" + "=".repeat(70));
console.log("📊 TEST RESULTS SUMMARY");
console.log("=".repeat(70));

let passCount = 0;
for (const [name, result] of Object.entries(results)) {
  console.log(`${result.status}  ${name.padEnd(15)} - ${result.patches || result.error || "OK"}`);
  if (result.status.includes("✅")) passCount++;
}

console.log("=".repeat(70));
console.log(`\n📈 Final Score: ${passCount}/${Object.keys(results).length} agents operational`);
console.log(`💾 Total Files Generated: ${Object.values(results).reduce((sum, r) => sum + (r.patches || 0), 0)}`);

if (passCount === Object.keys(results).length) {
  console.log("\n🎉 ALL TESTS PASSED - FULL SYSTEM OPERATIONAL\n");
} else {
  console.log("\n⚠️  Some tests need attention\n");
}

process.exit(0);
