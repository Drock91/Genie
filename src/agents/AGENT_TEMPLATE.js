/**
 * Agent Development Template
 * 
 * Use this template as a reference when creating new agents.
 * All new agents should follow this pattern and structure.
 */

import { BaseAgent } from "./baseAgent.js";

/**
 * [AgentName]Agent
 * 
 * Responsible for: [Brief description of agent purpose]
 * 
 * Key Capabilities:
 * - [Capability 1]
 * - [Capability 2]
 * - [Capability 3]
 * 
 * @class [AgentName]Agent
 * @extends BaseAgent
 * 
 * @example
 * const agent = new [AgentName]Agent({ logger });
 * const result = await agent.orchestrate({...});
 */
export class TemplateAgent extends BaseAgent {
  /**
   * Create a new TemplateAgent
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.logger - Logger instance
   * @param {Object} [options.multiLlmSystem] - Multi-LLM system (optional)
   * 
   * @example
   * const agent = new TemplateAgent({
   *   logger: logger,
   *   multiLlmSystem: llmSystem // optional
   * });
   */
  constructor(options) {
    super("TemplateAgent", options.logger);
    this.multiLlmSystem = options.multiLlmSystem || null;
  }

  /**
   * Main orchestration method
   * 
   * This is the primary entry point for this agent.
   * It should analyze input, perform operations, and return structured results.
   * 
   * @param {Object} options - Execution options
   * @param {string} options.userInput - User request or instruction
   * @param {Object} [options.context] - Execution context data
   * @param {Object} [options.agents] - Reference to other agents (if needed)
   * @param {number} [options.iteration=1] - Current iteration number
   * 
   * @returns {Promise<Object>} Result object with:
   *   - {string} output - Generated content/analysis
   *   - {boolean} success - Whether operation succeeded
   *   - {Array<string>} [files] - Generated files (if any)
   *   - {Array<Object>} [recommendations] - Suggestions for next steps
   * 
   * @example
   * const result = await agent.orchestrate({
   *   userInput: "Create a new API endpoint",
   *   context: { projectPath: "./output/MyProject" },
   *   iteration: 1
   * });
   * 
   * // Result structure:
   * // {
   * //   output: "Created POST /api/users endpoint...",
   * //   success: true,
   * //   files: ["src/routes/users.js"],
   * //   recommendations: ["Add authentication", "Add rate limiting"]
   * // }
   */
  async orchestrate(options) {
    const { userInput, context = {}, agents = {}, iteration = 1 } = options;

    this.info(`[Iteration ${iteration}] Processing: ${userInput.substring(0, 50)}...`);

    try {
      // ============================================================================
      // STEP 1: ANALYZE INPUT
      // ============================================================================
      const analysis = this.analyzeInput(userInput, context);
      this.info(`Analysis complete: Found ${analysis.tasks.length} tasks`);

      // ============================================================================
      // STEP 2: PERFORM OPERATIONS
      // ============================================================================
      const operationResults = await this.performOperations(analysis, context);
      this.info(`Operations complete: Generated ${operationResults.count} components`);

      // ============================================================================
      // STEP 3: VALIDATE RESULTS
      // ============================================================================
      const validation = this.validateResults(operationResults);
      if (!validation.valid) {
        this.warn(`Validation issues found: ${validation.issues.join(", ")}`);
      }

      // ============================================================================
      // STEP 4: GENERATE RECOMMENDATIONS
      // ============================================================================
      const recommendations = this.generateRecommendations(operationResults, agents);

      // ============================================================================
      // STEP 5: RETURN RESULTS
      // ============================================================================
      return {
        output: operationResults.summary,
        success: validation.valid,
        files: operationResults.files || [],
        recommendations,
        metadata: {
          agent: this.name,
          iteration,
          timestamp: new Date().toISOString(),
          processingTime: operationResults.processingTime
        }
      };
    } catch (error) {
      this.error(`Orchestration failed: ${error.message}`);
      return {
        output: `Error: ${error.message}`,
        success: false,
        files: [],
        recommendations: ["Review error details", "Check input format"],
        metadata: {
          agent: this.name,
          iteration,
          error: error.message
        }
      };
    }
  }

  /**
   * Analyze user input and extract requirements
   * 
   * @param {string} userInput - User request
   * @param {Object} context - Execution context
   * @returns {Object} Analysis object
   * @private
   */
  analyzeInput(userInput, context) {
    // TODO: Implement input analysis
    // This should parse requirements, extract key information, identify constraints
    return {
      tasks: [],
      requirements: [],
      constraints: []
    };
  }

  /**
   * Perform the actual operations
   * 
   * @param {Object} analysis - Analysis results
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Operation results
   * @private
   */
  async performOperations(analysis, context) {
    // TODO: Implement operations
    // This is where the agent does its main work
    const startTime = Date.now();

    try {
      // Example: Call LLM if multiLlmSystem is available
      if (this.multiLlmSystem) {
        const llmResponse = await this.callLLM(analysis);
        // Process LLM response
      }

      return {
        summary: "Operations completed successfully",
        count: 0,
        files: [],
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      this.error(`Operation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate operation results
   * 
   * @param {Object} results - Operation results
   * @returns {Object} Validation object
   * @private
   */
  validateResults(results) {
    const issues = [];

    // TODO: Add validation checks
    // Example: if (!results.summary) issues.push("Missing summary");

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate recommendations for next steps
   * 
   * @param {Object} results - Operation results
   * @param {Object} agents - Available agents
   * @returns {Array<string>} Recommendations
   * @private
   */
  generateRecommendations(results, agents) {
    const recommendations = [];

    // TODO: Add recommendation logic
    // Example recommendations:
    // recommendations.push("Consider adding error handling");
    // recommendations.push("Review security implications");

    return recommendations;
  }

  /**
   * Call the multi-LLM system for consensus
   * 
   * @param {Object} request - LLM request
   * @returns {Promise<string>} LLM response
   * @protected
   */
  async callLLM(request) {
    if (!this.multiLlmSystem) {
      throw new Error("Multi-LLM system not available");
    }

    return this.multiLlmSystem.consensus({
      prompt: this.formatPrompt(request),
      temperature: 0.7,
      maxTokens: 2000
    });
  }

  /**
   * Format request into LLM prompt
   * 
   * @param {Object} request - Request object
   * @returns {string} Formatted prompt
   * @private
   */
  formatPrompt(request) {
    // TODO: Implement prompt formatting
    return JSON.stringify(request);
  }
}

// ============================================================================
// USAGE GUIDE
// ============================================================================
/**
 * 
 * ## How to Use This Template
 * 
 * 1. Copy this file to `src/agents/[YourAgent]Agent.js`
 * 2. Replace "Template" with your agent name
 * 3. Implement the TODO sections:
 *    - analyzeInput() - Parse user requirements
 *    - performOperations() - Execute main logic
 *    - validateResults() - Check for errors
 *    - generateRecommendations() - Suggest next steps
 * 4. Register in `src/agentRegistry.js`
 * 5. Add to agents object in `src/index.js`
 * 
 * ## Pattern Examples
 * 
 * ### Simple Agent
 * - Analyses input and returns analysis
 * - No file generation
 * - No LLM calls
 * 
 * ### Complex Agent
 * - Calls LLM for content generation
 * - Generates files
 * - Coordinates with other agents
 * 
 * ### Integration Agent
 * - Calls external APIs
 * - Transforms between formats
 * - Bridges multiple systems
 * 
 * ## Best Practices
 * 
 * - Always log progress with info(), warn(), error()
 * - Use executionContext for state management
 * - Structure results consistently
 * - Add recommendations for next steps
 * - Include error handling with clear messages
 * - Document public methods with JSDoc
 * - Use meaningful variable names
 * - Keep methods focused and small
 * - Test with various inputs
 * 
 * ## Testing Your Agent
 * 
 * Create `[YourAgent].test.js`:
 * 
 * import { test } from 'node:test';
 * import assert from 'node:assert';
 * import { TemplateAgent } from './[YourAgent]Agent.js';
 * import { logger } from '../util/logger.js';
 * 
 * test('TemplateAgent', async (t) => {
 *   const agent = new TemplateAgent({ logger });
 *   
 *   const result = await agent.orchestrate({
 *     userInput: "Test input",
 *     context: {}
 *   });
 *   
 *   assert.ok(result);
 *   assert.equal(typeof result.output, 'string');
 * });
 * 
 */

export default TemplateAgent;
