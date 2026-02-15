/**
 * Request Analyzer
 * Determines which specialized agents are needed based on request type
 */

import { consensusCall } from "../llm/multiLlmSystem.js";

export class RequestAnalyzer {
  constructor(logger = null) {
    this.logger = logger;
  }

  /**
   * Analyze request and determine required agents
   */
  async analyzeRequest(userInput) {
    this.logger?.info({ inputLength: userInput.length }, "Analyzing request");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert at categorizing requests and determining what type of expertise is needed.",
        user: `Categorize this user request and determine what expertise is needed:\n\n"${userInput}"`,
        schema: {
          name: "request_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["request_type", "needs_legal_review", "needs_marketing_strategy", "reasoning"],
            properties: {
              request_type: {
                type: "string",
                enum: ["product_build", "company_formation", "feature_request", "question", "analysis", "other"],
                description: "Type of request"
              },
              needs_legal_review: {
                type: "boolean",
                description: "Does this require legal/compliance analysis?"
              },
              needs_marketing_strategy: {
                type: "boolean",
                description: "Does this require marketing strategy?"
              },
              needs_technical_build: {
                type: "boolean",
                description: "Does this require building/coding?"
              },
              reasoning: { type: "string" },
              priority_level: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              }
            }
          }
        },
        temperature: 0.1 // Low for consistency
      });

      const analysis = result.consensus;

      this.logger?.info({
        requestType: analysis.request_type,
        needsLegal: analysis.needs_legal_review,
        needsMarketing: analysis.needs_marketing_strategy,
        needsTech: analysis.needs_technical_build
      }, "Request analysis complete");

      return analysis;
    } catch (err) {
      this.logger?.warn({ error: err.message }, "Request analysis failed, using defaults");
      return {
        request_type: "other",
        needs_legal_review: false,
        needs_marketing_strategy: false,
        needs_technical_build: false,
        reasoning: "Analysis failed, defaulting to minimal agents",
        priority_level: "medium"
      };
    }
  }

  /**
   * Determine agent pipeline based on request
   */
  async determineAgentPipeline(userInput) {
    const analysis = await this.analyzeRequest(userInput);

    const pipeline = {
      analysis,
      agents: {
        // Always include these
        manager: true,

        // Core agents if building tech
        backend: analysis.needs_technical_build,
        frontend: analysis.needs_technical_build,
        qa: analysis.needs_technical_build,

        // Specialized agents
        security: analysis.needs_technical_build,
        writer: true,

        // Expertise agents if needed
        legal: analysis.needs_legal_review,
        marketing: analysis.needs_marketing_strategy,

        // Conditional
        test: analysis.needs_technical_build,
        fixer: analysis.needs_technical_build
      }
    };

    this.logger?.info(
      { enabledAgents: Object.keys(pipeline.agents).filter(k => pipeline.agents[k]) },
      "Agent pipeline determined"
    );

    return pipeline;
  }

  /**
   * Classify request urgency and complexity
   */
  async classifyRequestProperties(userInput) {
    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are analyzing request properties.",
        user: `Classify this request:\n"${userInput}"`,
        schema: {
          name: "request_properties",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["complexity", "urgency", "scope"],
            properties: {
              complexity: {
                type: "string",
                enum: ["simple", "moderate", "complex", "highly_complex"]
              },
              urgency: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              scope: {
                type: "string",
                enum: ["micro", "small", "medium", "large", "enterprise"]
              },
              budget_range: { type: "string" },
              timeline_estimate: { type: "string" }
            }
          }
        },
        temperature: 0.1
      });

      return result.consensus;
    } catch (err) {
      this.logger?.warn({ error: err.message }, "Property classification failed");
      return null;
    }
  }
}

export default RequestAnalyzer;
