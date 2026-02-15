import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class FrontendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "FrontendCoder", ...opts });
  }

  async build({ plan, traceId, iteration }) {
    this.info({ traceId, iteration }, "Building frontend with multi-LLM consensus");

    const notes = [];
    const risks = [];

    // Analyze work items for frontend
    const frontendItems = plan.workItems.filter(w => w.owner === "frontend");
    if (frontendItems.length === 0) {
      notes.push("No frontend work items in plan");
    } else {
      notes.push(`Frontend work items: ${frontendItems.map(w => w.id).join(", ")}`);

      // Design analysis with consensus
      try {
        const designAnalysis = await this.analyzeDesign(plan.summary);
        notes.push(`Design patterns: ${designAnalysis.recommended_patterns.join(", ")}`);
        if (designAnalysis.concerns.length > 0) {
          risks.push(`Design concerns: ${designAnalysis.concerns.join("; ")}`);
        }
      } catch (err) {
        this.warn({ error: err.message }, "Design analysis failed");
        risks.push("Design analysis incomplete");
      }

      // Accessibility review with consensus
      try {
        const a11y = await this.reviewAccessibility(plan.summary);
        if (a11y.accessibility_issues.length > 0) {
          risks.push(`A11Y issues: ${a11y.accessibility_issues.join("; ")}`);
        } else {
          notes.push("Accessibility review: No critical issues");
        }
      } catch (err) {
        this.warn({ error: err.message }, "Accessibility review failed");
      }
    }

    return makeAgentOutput({
      summary: "Frontend coder produced design with multi-LLM consensus",
      notes: notes.length > 0 ? notes : ["Frontend approach finalized"],
      risks: risks.length > 0 ? risks : []
    });
  }

  /**
   * Analyze design patterns using multi-LLM consensus
   */
  async analyzeDesign(requirements) {
    this.info({ requirements }, "Analyzing design with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert UI/UX designer analyzing component architecture and design patterns.",
        user: `Design UI components for:\n${requirements}`,
        schema: {
          name: "design_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["recommended_patterns", "components", "concerns"],
            properties: {
              recommended_patterns: {
                type: "array",
                items: { type: "string" }
              },
              components: {
                type: "array",
                items: { type: "string" }
              },
              concerns: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.2 // Allow some creativity for design
      });

      this.info({
        patterns: result.consensus.recommended_patterns.length,
        components: result.consensus.components.length,
        designers: result.metadata.totalSuccessful
      }, "Design analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Design analysis failed");
      throw err;
    }
  }

  /**
   * Review accessibility (WCAG) using multi-LLM consensus
   */
  async reviewAccessibility(requirements) {
    this.info({ requirements }, "Reviewing accessibility with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a web accessibility expert reviewing for WCAG 2.1 compliance.",
        user: `Review accessibility for:\n${requirements}`,
        schema: {
          name: "accessibility_review",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["accessibility_issues", "wcag_level", "recommendations"],
            properties: {
              accessibility_issues: {
                type: "array",
                items: { type: "string" }
              },
              wcag_level: {
                type: "string",
                enum: ["A", "AA", "AAA"]
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1 // Consistency important for compliance
      });

      this.info({
        issues: result.consensus.accessibility_issues.length,
        wcag_level: result.consensus.wcag_level,
        reviewers: result.metadata.totalSuccessful
      }, "Accessibility review complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Accessibility review failed");
      throw err;
    }
  }

  /**
   * Evaluate performance considerations using multi-LLM consensus
   */
  async evaluatePerformance(requirements) {
    this.info({ requirements }, "Evaluating performance with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a frontend performance expert evaluating optimization strategies.",
        user: `Evaluate performance for:\n${requirements}`,
        schema: {
          name: "performance_eval",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["optimization_strategies", "performance_risks", "estimated_impact"],
            properties: {
              optimization_strategies: {
                type: "array",
                items: { type: "string" }
              },
              performance_risks: {
                type: "array",
                items: { type: "string" }
              },
              estimated_impact: { type: "string" }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        strategies: result.consensus.optimization_strategies.length,
        risks: result.consensus.performance_risks.length,
        experts: result.metadata.totalSuccessful
      }, "Performance evaluation complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Performance evaluation failed");
      throw err;
    }
  }
}
