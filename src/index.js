console.log("Super Agent System Booting...");
import "dotenv/config";
import { logger } from "./util/logger.js";
import { runWorkflow } from "./workflow.js";
import { CostOptimizationSystem } from "./util/costOptimization.js";
import { PatchExecutor } from "./repo/patchExecutor.js";
import { RequestStore } from "./repo/requestStore.js";
import { AgentInspector } from "./util/agentInspector.js";
import { MetricsCollector } from "./util/metricsCollector.js";
import { WorkflowReporter } from "./util/workflowReporter.js";
import { InteractiveWorkflow } from "./util/interactiveWorkflow.js";
import { LLMUsageTracker } from "./util/llmUsageTracker.js";

import { ManagerAgent } from "./agents/managerAgent.js";
import { BackendCoderAgent } from "./agents/backendCoderAgent.js";
import { FrontendCoderAgent } from "./agents/frontendCoderAgent.js";
import { SecurityManagerAgent } from "./agents/securityManagerAgent.js";
import { QAManagerAgent } from "./agents/qaManagerAgent.js";
import { TestRunnerAgent } from "./agents/testRunnerAgent.js";
import { FixerAgent } from "./agents/fixerAgent.js";
import { WriterAgent } from "./agents/writerAgent.js";
import { RequestRefinerAgent } from "./agents/requestRefinerAgent.js";
import { CodeRefinerAgent } from "./agents/codeRefinerAgent.js";
import { DeliveryManagerAgent } from "./agents/deliveryManagerAgent.js";
import { getConfig } from "./util/config.js";
import { initializeMultiLlm } from "./llm/multiLlmSystem.js";

let config;
try {
  config = getConfig();
} catch (err) {
  logger.error({ error: err.message }, "Configuration error");
  process.exit(1);
}

// Check for flags
const args = process.argv.slice(2);
const interactiveMode = args.includes('--interactive') || args.includes('-i');
const powerArg = args.find(arg => arg.startsWith('--power='));
const powerIndex = args.findIndex(arg => arg === '--power');
const rawPower = powerArg
  ? powerArg.split('=')[1]
  : (powerIndex >= 0 ? args[powerIndex + 1] : null);
const powerLevel = rawPower ? rawPower.toLowerCase() : null;
const userInput = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-')).join(" ").trim();

if (!userInput) {
  logger.error({}, "No user input provided");
  console.log('Usage: npm start -- "build me X"');
  console.log('       npm start -- --interactive "build me X"  (for interactive mode)');
  process.exit(1);
}

// Helper to extract project name from user input
function extractProjectName(userInput) {
  const patterns = [
    /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|called\s+)?["`']?(\w+)["`']?/i,
    /(?:product|company|service)\s+(?:called|named)\s+["`']?(\w+)["`']?/i,
    /^\s*(\w+)\s*(?:app|project|system)/i
  ];
  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
  }
  return "Project";
}

function extractOutputFolder(userInput) {
  const slashMatch = userInput.match(/output\/?([\w\-\/]+)/i);
  if (slashMatch && slashMatch[1]) {
    return slashMatch[1].replace(/\/+$/, "");
  }
  const namedMatch = userInput.match(/output(?:\s+folder)?\s+(?:called|named)\s+["']?([\w\-\/]+)["']?/i);
  if (namedMatch && namedMatch[1]) {
    return namedMatch[1].replace(/\/+$/, "");
  }
  return null;
}

// Wrap in async IIFE for top-level await
(async () => {
  try {
    logger.info({ env: config.env, model: config.openaiModel }, "Initializing agents");

    // Initialize the multi-LLM system for agent consensus calls
    await initializeMultiLlm(logger);

    const agents = {
      refiner: new RequestRefinerAgent({ logger }),
      codeRefiner: new CodeRefinerAgent({ logger }),
      manager: new ManagerAgent({ logger }),
      backend: new BackendCoderAgent({ logger }),
      frontend: new FrontendCoderAgent({ logger }),
      security: new SecurityManagerAgent({ logger }),
      qa: new QAManagerAgent({ logger }),
      tests: new TestRunnerAgent({ logger }),
      fixer: new FixerAgent({ logger }),
      writer: new WriterAgent({ logger }),
      delivery: new DeliveryManagerAgent({ logger }),
    };

    // Extract project name and use as subfolder in output
    const outputFolder = extractOutputFolder(userInput);
    const projectName = outputFolder ? outputFolder.split("/")[0] : extractProjectName(userInput);
    const executor = new PatchExecutor({ workspaceDir: "./output", projectName, logger });
    const store = new RequestStore({ storageDir: "./requests", logger });
    const inspector = new AgentInspector({ logger });
    const metricsCollector = new MetricsCollector({ logger });
    const llmUsageTracker = new LLMUsageTracker({ logger });
    const reporter = new WorkflowReporter({ inspector, metricsCollector, logger });

    // Health check before running
    const health = reporter.generateHealthReport(agents);
    logger.info(health, "Agent health check");

    // === INITIALIZE COST OPTIMIZATION ===
    // This system reduces costs by 70-85% through caching, tiering, and batching
    const costOptimization = new CostOptimizationSystem({ logger });
    await costOptimization.initialize();
    costOptimization.integrateWithAgents(agents);

    const startTime = Date.now();
    let result;

    if (interactiveMode) {
      // === INTERACTIVE MODE ===
      console.log("\n🎮 Interactive Mode Enabled");
      console.log("You will be asked to approve each step and can refine as needed.\n");
      
      const interactiveWorkflow = new InteractiveWorkflow({
        agents,
        logger,
        config: {
          maxIterations: config.maxIterations,
          powerLevel
        },
        executor,
        store,
        costOptimization
      });
      
      result = await interactiveWorkflow.runInteractive({
        userInput,
        workflow: runWorkflow
      });
      
    } else {
      // === STANDARD MODE ===
      // Refine user input for precision and accuracy
      console.log("\n🔄 Refining your request for maximum precision...\n");
      const refinementResult = await agents.refiner.refineRequest(userInput);
      agents.refiner.printRefinementResult(refinementResult);

      // Use refined request if confidence is high, otherwise ask user
      let finalInput = userInput;
      if (refinementResult.confidence >= 70) {
        finalInput = refinementResult.refined;
        logger.info({ 
          original: userInput, 
          refined: finalInput, 
          confidence: refinementResult.confidence 
        }, "Using refined request");
      } else {
        console.log("⚠️  Confidence is low. Using original request. Consider providing more details.\n");
        logger.warn({ confidence: refinementResult.confidence }, "Low confidence - using original request");
      }

      result = await runWorkflow({
        userInput: finalInput,
        agents,
        logger,
        config: {
          maxIterations: config.maxIterations,
          powerLevel
        },
        executor,
        store,
        costOptimization,
        llmUsageTracker
      });
    }

    const duration = Date.now() - startTime;

    // Only show detailed reports in standard mode (interactive mode handles its own output)
    if (!interactiveMode) {
      // Record metrics
      metricsCollector.recordWorkflow({
        traceId: result.traceId,
        duration,
        success: result.success,
        iterations: result.iteration,
        input: result.finalInput || userInput,
        originalInput: userInput
      });

      // Generate and print reports
      const executionReport = reporter.generateExecutionReport(result, agents);
      const performanceSummary = reporter.generatePerformanceSummary();

      reporter.printReport(executionReport);
      reporter.printPerformanceSummary(performanceSummary);

      // Print LLM usage report
      console.log('\n');
      llmUsageTracker.printReport();

      console.log("\n=== RESULT ===");
      console.log(JSON.stringify(result, null, 2));

      if (result.executedFiles && result.executedFiles.length > 0) {
        console.log("\n=== CREATED FILES ===");
        for (const file of result.executedFiles) {
          console.log(`✓ ${file.path}`);
        }
      }
    }

    logger.info({ success: result.success, duration }, "Workflow completed");
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, "Fatal error");
    console.error("\n=== FATAL ERROR ===");
    console.error(err.message);
    process.exit(1);
  }
})();
