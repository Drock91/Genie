import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class TestRunnerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "TestRunner", ...opts });
  }

  async run({ traceId, iteration }) {
    this.info({ traceId, iteration }, "Running tests with multi-LLM analysis");
    // Later: run npm test / dotnet test / etc.
    // For now, return stub with multi-LLM enhancements available
    return { ok: true, stdout: "", stderr: "", exitCode: 0 };
  }

  /**
   * Generate comprehensive test cases using multi-LLM consensus
   */
  async generateTestCases(code, requirements) {
    this.info({ codeLength: code.length }, "Generating test cases with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert test engineer generating comprehensive unit and integration test cases.",
        user: `Generate test cases for this code:\n${code}\n\nRequirements:\n${requirements}`,
        schema: {
          name: "test_cases",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["unit_tests", "integration_tests", "test_coverage_target"],
            properties: {
              unit_tests: {
                type: "array",
                items: { type: "string" },
                description: "Unit test cases"
              },
              integration_tests: {
                type: "array",
                items: { type: "string" },
                description: "Integration test cases"
              },
              test_coverage_target: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Target test coverage percentage"
              }
            }
          }
        },
        temperature: 0.2 // Some creativity for diverse test scenarios
      });

      this.info({
        unit_tests: result.consensus.unit_tests.length,
        integration_tests: result.consensus.integration_tests.length,
        coverage_target: result.consensus.test_coverage_target,
        testers: result.metadata.totalSuccessful
      }, "Test cases generated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Test case generation failed");
      throw err;
    }
  }

  /**
   * Analyze test coverage using multi-LLM consensus
   */
  async analyzeCoverage(code, testMetrics) {
    this.info({ coverage: testMetrics.coverage }, "Analyzing test coverage with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert analyzing code coverage metrics and test quality.",
        user: `Analyze coverage for code:\n${code}\n\nCoverage Metrics:\n${JSON.stringify(testMetrics)}`,
        schema: {
          name: "coverage_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["coverage_assessment", "gaps", "recommendations"],
            properties: {
              coverage_assessment: { type: "string" },
              gaps: {
                type: "array",
                items: { type: "string" },
                description: "Areas with insufficient test coverage"
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Recommendations to improve coverage"
              }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        gaps: result.consensus.gaps.length,
        analysts: result.metadata.totalSuccessful
      }, "Coverage analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Coverage analysis failed");
      throw err;
    }
  }

  /**
   * Plan testing strategy using multi-LLM consensus
   */
  async planTestStrategy(requirements, projectType = "web") {
    this.info({ projectType }, "Planning test strategy with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate", // Use better models for strategy
        system: "You are a QA strategy expert planning comprehensive testing approaches.",
        user: `Plan a testing strategy for a ${projectType} project with these requirements:\n${requirements}`,
        schema: {
          name: "test_strategy",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["strategy_phases", "testing_types", "tools_recommended"],
            properties: {
              strategy_phases: {
                type: "array",
                items: { type: "string" },
                description: "Sequential phases of testing"
              },
              testing_types: {
                type: "array",
                items: { type: "string" },
                description: "Types of tests to include (unit, integration, e2e, performance, etc)"
              },
              tools_recommended: {
                type: "array",
                items: { type: "string" },
                description: "Recommended testing tools"
              }
            }
          }
        },
        temperature: 0.1
      });

      this.info({
        phases: result.consensus.strategy_phases.length,
        test_types: result.consensus.testing_types.length,
        strategists: result.metadata.totalSuccessful
      }, "Test strategy planned");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Test strategy planning failed");
      throw err;
    }
  }

  /**
   * Evaluate test quality using multi-LLM consensus
   */
  async evaluateTestQuality(testSuite, code) {
    this.info({ testCount: testSuite.length }, "Evaluating test quality with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert test quality engineer evaluating test effectiveness and design.",
        user: `Evaluate the quality of these tests:\n${testSuite}\n\nCode being tested:\n${code}`,
        schema: {
          name: "test_quality",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["quality_score", "strengths", "weaknesses"],
            properties: {
              quality_score: {
                type: "number",
                minimum: 0,
                maximum: 100
              },
              strengths: {
                type: "array",
                items: { type: "string" }
              },
              weaknesses: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        quality_score: result.consensus.quality_score,
        evaluators: result.metadata.totalSuccessful
      }, "Test quality evaluated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Test quality evaluation failed");
      throw err;
    }
  }
}
