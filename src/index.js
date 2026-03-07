console.log("Super Agent System Booting...");
import "dotenv/config";
import fs from 'fs';
import path from 'path';
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
import { parseArguments, validateArguments, getUsageText } from "./util/argumentParser.js";
import { extractProjectName, extractOutputFolder, isPdfRequested, isRefinementRequest } from "./util/inputParser.js";

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
import { DatabaseArchitectAgent } from "./agents/databaseArchitectAgent.js";
import { UserAuthAgent } from "./agents/userAuthAgent.js";
import { ApiIntegrationAgent } from "./agents/apiIntegrationAgent.js";
import { SecurityHardeningAgent } from "./agents/securityHardeningAgent.js";
import { MonitoringAgent } from "./agents/monitoringAgent.js";
import { DeploymentAgent } from "./agents/deploymentAgent.js";
import { TestGenerationAgent } from "./agents/testGenerationAgent.js";
import { APIDocumentationAgent } from "./agents/apiDocumentationAgent.js";
import { PerformanceOptimizationAgent } from "./agents/performanceOptimizationAgent.js";
import { NewsAnalysisAgent } from "./agents/newsAnalysisAgent.js";
import { TaxStrategyAgent } from "./agents/taxStrategyAgent.js";
import { TaskAnalyzerAgent } from "./agents/taskAnalyzerAgent.js";
import { IncomeGenerationAgent } from "./agents/incomeGenerationAgent.js";
import { TaskCompletionVerifierAgent } from "./agents/taskCompletionVerifierAgent.js";
import { ResearchAgent } from "./agents/researchAgent.js";
import { DataAnalystAgent } from "./agents/dataAnalystAgent.js";
import { getConfig } from "./util/config.js";
import { initializeMultiLlm } from "./llm/multiLlmSystem.js";
import { generateAgentSummaryReport, generateRequestSerial } from "./util/agentSummaryGenerator.js";

// Generate unique serial for this request
const REQUEST_SERIAL = generateRequestSerial();

let config;
try {
  config = getConfig();
} catch (err) {
  logger.error({ error: err.message }, "Configuration error");
  process.exit(1);
}

// Parse and validate command-line arguments
const parsed = parseArguments(process.argv.slice(2));
const validation = validateArguments(parsed);

if (!validation.valid) {
  logger.error({}, validation.error);
  console.log(getUsageText());
  process.exit(1);
}

// Read input from file or command line
let userInput = parsed.input;
if (parsed.file) {
  try {
    const filePath = path.resolve(parsed.file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const requestData = JSON.parse(fileContent);
    userInput = requestData.input || requestData.request || '';
    console.log(`📄 Loaded request from file: ${parsed.file}`);
    console.log(`📝 Request length: ${userInput.length} characters`);
  } catch (err) {
    logger.error({ error: err.message }, `Failed to read request file: ${parsed.file}`);
    process.exit(1);
  }
}

const interactiveMode = parsed.interactive;
const researchOnly = parsed.researchOnly;
const powerLevel = parsed.power;

console.log(`\n┌─────────────────────────────────────────────┐`);
console.log(`│ 🎯 REQUEST SERIAL: ${REQUEST_SERIAL}      │`);
console.log(`└─────────────────────────────────────────────┘\n`);

if (researchOnly) {
  console.log("🔬 Research-Only Mode Enabled (consensus analysis, no code/file generation)\n");
}

// Store original user input for reporting
const ORIGINAL_INPUT = userInput;

// Note: extractProjectName and extractOutputFolder are now imported from inputParser.js

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
      // === CRITICAL PATH AGENTS (Enterprise) ===
      databaseArchitect: new DatabaseArchitectAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      userAuth: new UserAuthAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      apiIntegration: new ApiIntegrationAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      // === PRODUCTION SUPPORT AGENTS ===
      securityHardening: new SecurityHardeningAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      monitoring: new MonitoringAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      // === DEPLOYMENT AGENT ===
      deployment: new DeploymentAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      // === PHASE 3 AGENTS ===
      testGeneration: new TestGenerationAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      apiDocumentation: new APIDocumentationAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      performanceOptimization: new PerformanceOptimizationAgent({ logger, multiLlmSystem: global.multiLlmSystem }),
      // === INVESTMENT & TAX AGENTS ===
      newsAnalysis: new NewsAnalysisAgent({ logger }),
      taxStrategy: new TaxStrategyAgent({ logger }),
      // === INTELLIGENT TASK MANAGEMENT ===
      taskAnalyzer: new TaskAnalyzerAgent({ logger }),
      incomeGeneration: new IncomeGenerationAgent({ logger }),
      taskCompletionVerifier: new TaskCompletionVerifierAgent({ logger }),
      // === RESEARCH & ANALYSIS ===
      research: new ResearchAgent(logger, global.multiLlmSystem),
      dataAnalyst: new DataAnalystAgent(logger, global.multiLlmSystem),
    }

    // Extract project name and use as subfolder in output
    const outputFolder = extractOutputFolder(userInput);
    const projectName = outputFolder ? outputFolder.split("/")[0] : extractProjectName(userInput);
    
    // For research-only mode, use reports folder instead of creating empty output folders
    const executor = researchOnly 
      ? new PatchExecutor({ workspaceDir: "./reports", projectName: null, logger })
      : new PatchExecutor({ workspaceDir: "./output", projectName, logger });
    
    const store = new RequestStore({ storageDir: "./requests", logger });
    const inspector = new AgentInspector({ logger });
    const metricsCollector = new MetricsCollector({ logger });
    const llmUsageTracker = new LLMUsageTracker({ logger });
    const reporter = new WorkflowReporter({ inspector, metricsCollector, logger });

    // Store original request in tracker for reporting
    llmUsageTracker.setOriginalRequest(ORIGINAL_INPUT);
    
    // Make tracker globally available for providers to record rate limits
    global.llmUsageTracker = llmUsageTracker;

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
    let REFINED_INPUT = ORIGINAL_INPUT;  // Initialize here so it's available in all code paths

    if (interactiveMode) {
      // === INTERACTIVE MODE ===
      console.log("\n🎮 Interactive Mode Enabled");
      console.log("You will be asked to approve each step and can refine as needed.\n");
      
      const interactiveWorkflow = new InteractiveWorkflow({
        agents,
        logger,
        config: {
          maxIterations: config.maxIterations,
          powerLevel,
          researchOnly
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
        REFINED_INPUT = refinementResult.refined;  // Capture the refined version
        llmUsageTracker.setRefinedRequest(refinementResult.refined);  // Track for reporting
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
          powerLevel,
          researchOnly
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

      // Generate automatic agent summary report
      try {
        console.log("\n📊 Generating agent execution summary...");
        // In standard mode, REFINED_INPUT is captured; in interactive mode, use original
        const refinedInputForReport = interactiveMode ? ORIGINAL_INPUT : REFINED_INPUT;
        const summaryResult = await generateAgentSummaryReport(
          result.traceId, 
          REQUEST_SERIAL, 
          ORIGINAL_INPUT, 
          refinedInputForReport
        );
        console.log(`\n✅ Agent summary report saved to: ${summaryResult.path}`);
      } catch (err) {
        logger.warn({ error: err.message }, "Failed to generate summary report");
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
