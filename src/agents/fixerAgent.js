import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class FixerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Fixer", ...opts });
  }

  async patch({ qa, security, tests, traceId, iteration }) {
    this.info({ traceId, iteration }, "Generating fix plan with multi-LLM consensus");

    const notes = [];
    const issues = [];

    // Collect all issues
    if (!security.ok) {
      issues.push(...security.issues);
      notes.push(`Security issues: ${security.issues.map(i => i.id).join(", ")}`);
    }
    if (!qa.ok) {
      issues.push(...qa.issues);
      notes.push(`QA issues: ${qa.issues.map(i => i.id).join(", ")}`);
    }
    if (!tests.ok) {
      notes.push(`Test failures: exitCode=${tests.exitCode}`);
    }

    // Get remediation plan from multi-LLM consensus
    if (issues.length > 0) {
      try {
        const remediationPlan = await this.generateRemediationPlan(issues);
        notes.push(`Remediation priority: ${remediationPlan.priority_order.join(" → ")}`);
        remediationPlan.fixes.forEach(fix => {
          notes.push(`Fix for ${fix.issue_id}: ${fix.description}`);
        });
      } catch (err) {
        this.warn({ error: err.message }, "Remediation planning failed");
      }
    }

    return makeAgentOutput({
      summary: issues.length === 0 ? "No issues to fix" : "Fixer produced remediation plan with consensus",
      notes,
      risks: issues.length > 0 ? ["Remediation execution still pending"] : []
    });
  }

  /**
   * Generate remediation plan using multi-LLM consensus
   */
  async generateRemediationPlan(issues) {
    this.info({ issueCount: issues.length }, "Generating remediation plan with multi-LLM");

    const issueDescriptions = issues
      .map(i => `[${i.severity}] ${i.id}: ${i.title} - ${i.description}`)
      .join("\n");

    try {
      const result = await consensusCall({
        profile: "balanced", // Good balance for practical remediation planning
        system: "You are an expert software engineer prioritizing and planning fixes for reported issues.",
        user: `Prioritize and plan fixes for these issues:\n${issueDescriptions}`,
        schema: {
          name: "remediation_plan",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["priority_order", "fixes", "risk_summary"],
            properties: {
              priority_order: {
                type: "array",
                items: { type: "string" },
                description: "Issue IDs in priority order"
              },
              fixes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    issue_id: { type: "string" },
                    description: { type: "string" },
                    effort: { type: "string", enum: ["low", "medium", "high"] }
                  }
                }
              },
              risk_summary: { type: "string" }
            }
          }
        },
        temperature: 0.15 // Consistent prioritization
      });

      this.info({
        fixes: result.consensus.fixes.length,
        fixers: result.metadata.totalSuccessful
      }, "Remediation plan generated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Remediation planning failed");
      throw err;
    }
  }

  /**
   * Suggest code fixes using multi-LLM consensus
   */
  async suggestCodeFix(issue, code) {
    this.info({ issue_id: issue.id }, "Suggesting code fix with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert debugging and code fixing engineer.",
        user: `Fix this issue: [${issue.severity}] ${issue.title}\nDescription: ${issue.description}\n\nCode:\n${code}`,
        schema: {
          name: "code_fix",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["explanation", "fixed_code", "confidence"],
            properties: {
              explanation: { type: "string" },
              fixed_code: { type: "string" },
              confidence: {
                type: "string",
                enum: ["low", "medium", "high"]
              }
            }
          }
        },
        temperature: 0.2
      });

      this.info({
        confidence: result.consensus.confidence,
        fixers: result.metadata.totalSuccessful
      }, "Code fix suggested");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code fix suggestion failed");
      throw err;
    }
  }

  /**
   * Assess fix risk using multi-LLM consensus
   */
  async assessFixRisk(issue, proposedFix) {
    this.info({ issue_id: issue.id }, "Assessing fix risk with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate", // Use better models for risk assessment
        system: "You are a risk assessment expert evaluating potential side effects of code fixes.",
        user: `Assess risks for fixing [${issue.severity}] ${issue.title}:\n\nProposed fix:\n${proposedFix}`,
        schema: {
          name: "fix_risk",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["risk_level", "potential_side_effects", "mitigation"],
            properties: {
              risk_level: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              },
              potential_side_effects: {
                type: "array",
                items: { type: "string" }
              },
              mitigation: { type: "string" }
            }
          }
        },
        temperature: 0.1
      });

      this.info({
        risk_level: result.consensus.risk_level,
        assessors: result.metadata.totalSuccessful
      }, "Fix risk assessed");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Fix risk assessment failed");
      throw err;
    }
  }
}
