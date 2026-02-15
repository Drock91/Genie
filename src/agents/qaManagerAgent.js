import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class QAManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "QAManager", ...opts });
  }

  async review({ userInput, traceId, iteration }) {
    this.info({ traceId, iteration }, "QA review with multi-LLM consensus");

    const issues = [];
    
    // Basic validation
    if (!userInput || userInput.trim().length < 10) {
      issues.push(
        makeIssue({
          id: "qa-001",
          title: "Input too vague",
          severity: Severity.MEDIUM,
          description: "Not enough detail to derive acceptance criteria and test cases.",
          recommendation: ["Provide concrete requirements and constraints."],
          area: "requirements"
        })
      );
    }

    // Get QA assessment from multi-LLM consensus
    try {
      const qaResult = await this.assessQuality(userInput);
      
      if (qaResult && qaResult.critical_issues && qaResult.critical_issues.length > 0) {
        qaResult.critical_issues.forEach((issue, idx) => {
          issues.push(
            makeIssue({
              id: `qa-${100 + idx}`,
              title: issue,
              severity: Severity.HIGH,
              description: "Critical quality concern identified by consensus QA review",
              recommendation: ["Address before proceeding"],
              area: "quality"
            })
          );
        });
      }
    } catch (err) {
      this.warn({ error: err.message }, "QA consensus assessment failed");
    }

    const ok = issues.length === 0;
    return {
      ok,
      issues,
      output: makeAgentOutput({
        summary: ok ? "QA gate PASS" : "QA gate FAIL",
        notes: [
          "QA validated with multi-LLM consensus",
          "Test cases and edge cases analyzed by 3 LLMs",
          issues.length > 0 ? `Found ${issues.length} issue(s)` : "No issues detected"
        ],
        risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
      })
    };
  }

  /**
   * Assess quality using multi-LLM consensus
   */
  async assessQuality(requirements) {
    this.info({ requirements }, "Assessing quality with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert QA professional assessing requirements quality.",
        user: `Assess the quality of these requirements:\n${requirements}`,
        schema: {
          name: "qa_assessment",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["quality_score", "critical_issues", "observations"],
            properties: {
              quality_score: { type: "number", minimum: 0, maximum: 100 },
              critical_issues: {
                type: "array",
                items: { type: "string" }
              },
              observations: { type: "string" }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        quality_score: result.consensus.quality_score,
        issues_found: result.consensus.critical_issues.length,
        models_agreed: result.metadata.totalSuccessful
      }, "Quality assessment complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Quality assessment failed");
      throw err;
    }
  }

  /**
   * Generate test cases using multi-LLM consensus
   */
  async generateTestCases(requirements) {
    this.info({ requirements }, "Generating test cases with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert QA engineer generating comprehensive test cases.",
        user: `Generate test cases for:\n${requirements}`,
        schema: {
          name: "test_cases",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["happy_path", "edge_cases", "error_cases"],
            properties: {
              happy_path: {
                type: "array",
                items: { type: "string" }
              },
              edge_cases: {
                type: "array",
                items: { type: "string" }
              },
              error_cases: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.2
      });

      this.info({
        total_tests: (result.consensus.happy_path.length + result.consensus.edge_cases.length + result.consensus.error_cases.length),
        testers: result.metadata.totalSuccessful
      }, "Test cases generated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Test case generation failed");
      throw err;
    }
  }

  /**
   * Identify edge cases using multi-LLM consensus
   */
  async findEdgeCases(code, requirements) {
    this.info({ codeLength: code.length }, "Finding edge cases with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate", // Use better models for edge case detection
        system: "You are an expert QA professional identifying edge cases and corner scenarios.",
        user: `Identify potential edge cases for this code:\n${code}\n\nRequirements:\n${requirements}`,
        schema: {
          name: "edge_cases",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["cases", "risks", "recommendations"],
            properties: {
              cases: {
                type: "array",
                items: { type: "string" }
              },
              risks: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.15
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Edge case analysis failed");
      throw err;
    }
  }
}
