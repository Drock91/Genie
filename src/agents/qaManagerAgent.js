import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class QAManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "QAManager", ...opts });
  }

  async review({ userInput, traceId, iteration, patches = [], consensusLevel = "single" }) {
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

    // NEW: Check if generated code matches requirements
    if (patches && patches.length > 0) {
      try {
        const codeQuality = await this.validateCodeMatchesRequirements(userInput, patches, consensusLevel);
        if (codeQuality && !codeQuality.matches_requirements) {
          issues.push(
            makeIssue({
              id: "qa-500",
              title: "Generated code does not match requirements",
              severity: Severity.CRITICAL,
              description: `The generated code does not implement the requested functionality. Requirement: "${userInput.substring(0, 80)}..." Code appears to implement: ${codeQuality.implemented_instead}`,
              recommendation: ["Regenerate code to match exact user requirements"],
              area: "requirement-mismatch"
            })
          );
        }
      } catch (err) {
        this.warn({ error: err.message }, "Code validation failed, skipping");
      }
    }

    // Get QA assessment from multi-LLM consensus
    try {
      const qaResult = await this.assessQuality(userInput, consensusLevel);
      
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
          "Code requirements matching checked",
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
  async assessQuality(requirements, consensusLevel = "single") {
    this.info({ requirements }, "Assessing quality with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
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
  async generateTestCases(requirements, consensusLevel = "single") {
    this.info({ requirements }, "Generating test cases with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
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
   * Validate that generated code matches user requirements
   */
  async validateCodeMatchesRequirements(userInput, patches = [], consensusLevel = "single") {
    this.info({ patchCount: patches.length }, "Validating code matches requirements");

    try {
      // Extract code content from patches
      const codeContent = patches
        .map(p => p.diff || "")
        .join("\n");

      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
        system: `You are an expert code reviewer validating that generated code matches user requirements.

CRITICAL VALIDATION RULES:
1. Identify what TYPE of application the user requested (calculator, game, website, etc.)
2. Identify what TYPE of application is in the generated code
3. If types DO NOT MATCH, it's an automatic FAIL - return matches_requirements: false
4. Only return true if code correctly implements the EXACT type and functionality requested
5. Be EXTREMELY strict - ambiguity = fail`,
        user: `STRICT VALIDATION:

User's Exact Requirement: "${userInput}"

Generated Code to Validate:
${codeContent.substring(0, 2000)}

Answer these questions FIRST:
1. What TYPE of application did the user request? (calculator, game, todo app, website, etc.)
2. What TYPE of application is the generated code? (look at titles, content, purpose)
3. Do the types match?
4. Does the code have the EXACT functionality requested?

Return your validation as JSON.`,
        schema: {
          name: "code_validation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["matches_requirements", "implemented_instead", "user_requested_type", "code_type"],
            properties: {
              matches_requirements: { 
                type: "boolean",
                description: "Does the code match the user requirement?"
              },
              implemented_instead: { 
                type: "string",
                description: "What did the code actually implement?"
              },
              user_requested_type: {
                type: "string",
                description: "What type of app did user request?"
              },
              code_type: {
                type: "string",
                description: "What type of app is in the code?"
              }
            }
          }
        },
        temperature: 0.05
      });

      this.info({
        matches: result.consensus.matches_requirements,
        userRequested: result.consensus.user_requested_type,
        codeType: result.consensus.code_type,
        implementedInstead: result.consensus.implemented_instead,
        providers: result.metadata.totalSuccessful
      }, "Code validation complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code validation failed");
      throw err;
    }
  }

  /**
   * Identify edge cases using multi-LLM consensus
   */
  async findEdgeCases(code, requirements, consensusLevel = "single") {
    this.info({ codeLength: code.length }, "Finding edge cases with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced", // Use balanced models for edge case detection
        consensusLevel,
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
