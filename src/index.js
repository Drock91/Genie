console.log("Genie Booting...");
import "dotenv/config";
import { logger } from "./util/logger.js";
import { runWorkflow } from "./workflow.js";
import { PatchExecutor } from "./repo/patchExecutor.js";
import { RequestStore } from "./repo/requestStore.js";
import { AgentInspector } from "./util/agentInspector.js";
import { MetricsCollector } from "./util/metricsCollector.js";
import { WorkflowReporter } from "./util/workflowReporter.js";

import { ManagerAgent } from "./agents/managerAgent.js";
import { BackendCoderAgent } from "./agents/backendCoderAgent.js";
import { FrontendCoderAgent } from "./agents/frontendCoderAgent.js";
import { SecurityManagerAgent } from "./agents/securityManagerAgent.js";
import { QAManagerAgent } from "./agents/qaManagerAgent.js";
import { TestRunnerAgent } from "./agents/testRunnerAgent.js";
import { FixerAgent } from "./agents/fixerAgent.js";
import { WriterAgent } from "./agents/writerAgent.js";
import { getConfig } from "./util/config.js";

let config;
try {
  config = getConfig();
} catch (err) {
  logger.error({ error: err.message }, "Configuration error");
  process.exit(1);
}

const userInput = process.argv.slice(2).join(" ").trim();
if (!userInput) {
  logger.error({}, "No user input provided");
  console.log('Usage: npm start -- "build me X"');
  process.exit(1);
}

logger.info({ env: config.env, model: config.openaiModel }, "Initializing agents");

const agents = {
  manager: new ManagerAgent({ logger }),
  backend: new BackendCoderAgent({ logger }),
  frontend: new FrontendCoderAgent({ logger }),
  security: new SecurityManagerAgent({ logger }),
  qa: new QAManagerAgent({ logger }),
  tests: new TestRunnerAgent({ logger }),
  fixer: new FixerAgent({ logger }),
  writer: new WriterAgent({ logger }),
};

// Initialize executor, store, inspector, and metrics
const executor = new PatchExecutor({ workspaceDir: "./output", logger });
const store = new RequestStore({ storageDir: "./requests", logger });
const inspector = new AgentInspector({ logger });
const metricsCollector = new MetricsCollector({ logger });
const reporter = new WorkflowReporter({ inspector, metricsCollector, logger });

// Health check before running
const health = reporter.generateHealthReport(agents);
logger.info(health, "Agent health check");

try {
  const startTime = Date.now();

  const result = await runWorkflow({
    userInput,
    agents,
    logger,
    config: { maxIterations: config.maxIterations },
    executor,
    store
  });

  const duration = Date.now() - startTime;

  // Record metrics
  metricsCollector.recordWorkflow({
    traceId: result.traceId,
    duration,
    success: result.success,
    iterations: result.iteration,
    input: userInput
  });

  // Generate and print reports
  const executionReport = reporter.generateExecutionReport(result, agents);
  const performanceSummary = reporter.generatePerformanceSummary();

  reporter.printReport(executionReport);
  reporter.printPerformanceSummary(performanceSummary);

  console.log("\n=== RESULT ===");
  console.log(JSON.stringify(result, null, 2));

  if (result.executedFiles && result.executedFiles.length > 0) {
    console.log("\n=== CREATED FILES ===");
    for (const file of result.executedFiles) {
      console.log(`✓ ${file.path}`);
    }
  }

  logger.info({ success: result.success, traceId: result.traceId }, "Workflow completed");
  process.exit(result.success ? 0 : 1);
} catch (err) {
  logger.error({ error: err.message, stack: err.stack }, "Fatal error");
  console.error("\n=== FATAL ERROR ===");
  console.error(err.message);
  process.exit(1);
}
