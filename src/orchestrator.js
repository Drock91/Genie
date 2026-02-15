/**
 * Enhanced Orchestrator
 * Coordinates request analysis, specialist agent routing, and compliance reporting
 */

import { RequestAnalyzer }from "../experts/requestAnalyzer.js";
import { LegalSpecialistAgent } from "../agents/legalSpecialistAgent.js";
import { MarketingStrategistAgent } from "../agents/marketingStrategistAgent.js";
import { ReportGenerator } from "./reportGenerator.js";

export class EnhancedOrchestrator {
  constructor({ logger, config = {}, multiLlmSystem = null } = {}) {
    this.logger = logger;
    this.config = config;
    this.multiLlmSystem = multiLlmSystem;
    
    this.requestAnalyzer = new RequestAnalyzer(logger, multiLlmSystem);
    this.legalAgent = new LegalSpecialistAgent(logger, multiLlmSystem);
    this.marketingAgent = new MarketingStrategistAgent(logger, multiLlmSystem);
    this.reportGenerator = new ReportGenerator(logger);
  }

  /**
   * Enhanced workflow execution with request analysis and specialist routing
   */
  async executeWithAnalysis({ userInput, workflow, agents, executor = null, store = null }) {
    const traceId = `${Math.random().toString(16).slice(2)}-${Date.now()}`;
    
    this.logger.info({ traceId, userInput }, "Enhanced orchestration started");

    try {
      // Step 1: Analyze the request to determine if specialists are needed
      this.logger.info({ traceId }, "Analyzing request for specialist routing");
      const requestAnalysis = await this.requestAnalyzer.analyzeRequest(userInput);
      
      this.logger.info(
        { 
          traceId, 
          requestType: requestAnalysis.request_type,
          needsLegal: requestAnalysis.needs_legal_review,
          needsMarketing: requestAnalysis.needs_marketing_strategy,
          needsTechnical: requestAnalysis.needs_technical_build
        },
        "Request classified"
      );

      // Step 2: Run legal analysis if needed
      let legalAnalysis = null;
      if (requestAnalysis.needs_legal_review) {
        this.logger.info({ traceId }, "Running legal specialist analysis");
        legalAnalysis = await this.legalAgent.analyzeLegalImplications(userInput);
        this.logger.info(
          { 
            traceId, 
            concerns: legalAnalysis.compliance_concerns?.length ?? 0 
          },
          "Legal analysis complete"
        );
      }

      // Step 3: Run marketing analysis if needed
      let marketingStrategy = null;
      if (requestAnalysis.needs_marketing_strategy) {
        this.logger.info({ traceId }, "Running marketing strategist analysis");
        marketingStrategy = await this.marketingAgent.developMarketingStrategy(userInput);
        this.logger.info(
          { 
            traceId, 
            targetMarket: marketingStrategy.target_market 
          },
          "Marketing strategy complete"
        );
      }

      // Step 4: Run main workflow if technical build is needed
      let workflowResult = null;
      if (requestAnalysis.needs_technical_build) {
        this.logger.info({ traceId }, "Running main workflow for technical build");
        workflowResult = await workflow({
          userInput,
          agents,
          logger: this.logger,
          config: this.config,
          executor,
          store
        });
        this.logger.info(
          { 
            traceId, 
            success: workflowResult.success,
            iteration: workflowResult.iteration 
          },
          "Main workflow complete"
        );
      } else {
        this.logger.info({ traceId }, "Skipping main workflow (not a technical build request)");
      }

      // Step 5: Generate comprehensive report
      const report = this._generateReport({
        projectName: this._extractProjectName(userInput),
        projectType: requestAnalysis.request_type,
        legalAnalysis,
        marketingStrategy,
        requestAnalysis,
        timestamp: new Date()
      });

      this.logger.info({ traceId }, "Report generated");

      // Return enhanced result with all components
      return {
        traceId,
        requestAnalysis,
        legalAnalysis,
        marketingStrategy,
        workflowResult,
        report,
        summary: this.reportGenerator.generateSummary({
          projectName: this._extractProjectName(userInput),
          legalAnalysis,
          marketingStrategy
        }),
        success: true
      };

    } catch (err) {
      this.logger.error({ traceId, error: err.message, stack: err.stack }, "Enhanced orchestration failed");
      return {
        traceId,
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Get agent execution plan based on request analysis
   */
  async getExecutionPlan(userInput) {
    try {
      const analysis = await this.requestAnalyzer.analyzeRequest(userInput);
      const pipeline = await this.requestAnalyzer.determineAgentPipeline(userInput);
      
      return {
        requestType: analysis.request_type,
        agents: pipeline.agents,
        reasoning: {
          needsLegal: analysis.needs_legal_review,
          needsMarketing: analysis.needs_marketing_strategy,
          needsTechnical: analysis.needs_technical_build,
          priority: analysis.priority_level
        }
      };
    } catch (err) {
      this.logger.error({ error: err.message }, "Failed to get execution plan");
      throw err;
    }
  }

  /**
   * Generate and save report
   */
  _generateReport(config) {
    try {
      const report = this.reportGenerator.generateComplianceReport(config);
      
      // Also save to file
      this.reportGenerator.saveReport(config);
      
      return report;
    } catch (err) {
      this.logger.error({ error: err.message }, "Report generation failed");
      return "Report generation failed. See logs for details.";
    }
  }

  /**
   * Extract project name from user input
   */
  _extractProjectName(userInput) {
    // Try to extract project name from common patterns
    const patterns = [
      /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|called\s+)?["`]?(\w+)["`]?/i,
      /(?:product|company|service)\s+(?:called|named)\s+["`]?(\w+)["`]?/i,
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

  /**
   * Print summary report to console
   */
  printSummary(result) {
    if (result.summary) {
      console.log(result.summary);
    }
  }

  /**
   * Get all analysis results
   */
  getAllAnalysis(result) {
    return {
      request: result.requestAnalysis,
      legal: result.legalAnalysis,
      marketing: result.marketingStrategy,
      workflow: result.workflowResult
    };
  }
}

export default EnhancedOrchestrator;
