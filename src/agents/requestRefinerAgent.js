import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

/**
 * Request Refiner Agent
 * Takes raw user input and refines it for maximum precision and accuracy
 * Expands vague requests, clarifies intent, and adds missing context
 */
export class RequestRefinerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "RequestRefiner", ...opts });
  }

  /**
   * Refine a raw user request into a precise, actionable request
   * @param {string} rawInput - The raw user input from console
   * @returns {Promise<Object>} - Refined request with original, refined text, clarifications, and confidence
   */
  async refineRequest(rawInput) {
    this.info({ rawInput }, "Refining user request for precision");

    try {
      const result = await consensusCall({
        profile: "economical", // Use cost-effective models for understanding intent
        system: `You are an expert request analyst who refines vague user requests into precise, actionable specifications.

Your job:
1. Understand the user's TRUE intent (what they really want, not just what they said)
2. Identify missing details that would help deliver better results
3. Expand abbreviations, vague terms, and incomplete descriptions
4. Add relevant context and constraints
5. Clarify ambiguous requirements
6. Structure the request for maximum clarity

Keep the user's core intent but make it crystal clear and complete.`,
        user: `Refine this user request to make it more precise and actionable:\n\n"${rawInput}"`,
        schema: {
          name: "refined_request",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["refined_request", "clarifications", "assumptions", "missing_info", "confidence_score", "suggested_departments"],
            properties: {
              refined_request: {
                type: "string",
                description: "The refined, precise version of the user's request"
              },
              clarifications: {
                type: "array",
                items: { type: "string" },
                description: "List of clarifications made to the original request"
              },
              assumptions: {
                type: "array",
                items: { type: "string" },
                description: "Assumptions made when refining (e.g., tech stack, scale, features)"
              },
              missing_info: {
                type: "array",
                items: { type: "string" },
                description: "Information that would further improve precision (optional)"
              },
              confidence_score: {
                type: "number",
                minimum: 0,
                maximum: 100,
                description: "Confidence that the refined request matches user intent (0-100)"
              },
              suggested_departments: {
                type: "array",
                items: { type: "string" },
                description: "Suggested departments/agents to handle this request"
              }
            }
          }
        },
        temperature: 0.1 // Very low temperature for consistent, accurate refinement
      });

      const refined = result.consensus;

      this.info({
        originalLength: rawInput.length,
        refinedLength: refined.refined_request.length,
        clarifications: refined.clarifications.length,
        confidence: refined.confidence_score,
        models: result.metadata.totalSuccessful
      }, "Request refined successfully");

      return {
        original: rawInput,
        refined: refined.refined_request,
        clarifications: refined.clarifications,
        assumptions: refined.assumptions,
        missingInfo: refined.missing_info || [],
        confidence: refined.confidence_score,
        suggestedDepartments: refined.suggested_departments || [],
        metadata: {
          modelsUsed: result.metadata.totalSuccessful,
          timestamp: new Date().toISOString()
        }
      };

    } catch (err) {
      this.error({ error: err.message }, "Request refinement failed");
      // Fallback: return original request if refinement fails
      return {
        original: rawInput,
        refined: rawInput,
        clarifications: [],
        assumptions: [],
        missingInfo: [],
        confidence: 50,
        suggestedDepartments: [],
        error: err.message
      };
    }
  }

  /**
   * Interactive refinement - asks follow-up questions if confidence is low
   * @param {string} rawInput - The raw user input
   * @param {number} minConfidence - Minimum confidence threshold (default 80)
   * @returns {Promise<Object>} - Refined request with questions if needed
   */
  async interactiveRefine(rawInput, minConfidence = 80) {
    this.info({ rawInput, minConfidence }, "Starting interactive refinement");

    const initialRefinement = await this.refineRequest(rawInput);

    // If confidence is high enough, return immediately
    if (initialRefinement.confidence >= minConfidence) {
      this.info({ confidence: initialRefinement.confidence }, "High confidence - no questions needed");
      return {
        ...initialRefinement,
        needsQuestions: false,
        questions: []
      };
    }

    // Generate clarifying questions
    this.info({ confidence: initialRefinement.confidence }, "Low confidence - generating questions");

    try {
      const questionResult = await consensusCall({
        profile: "balanced",
        system: "You are an expert at asking clarifying questions to understand vague requests.",
        user: `The user said: "${rawInput}"\n\nMissing information: ${initialRefinement.missingInfo.join(", ")}\n\nGenerate 2-4 specific questions to clarify their intent.`,
        schema: {
          name: "clarifying_questions",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["questions"],
            properties: {
              questions: {
                type: "array",
                items: { type: "string" },
                maxItems: 4
              }
            }
          }
        },
        temperature: 0.2
      });

      return {
        ...initialRefinement,
        needsQuestions: true,
        questions: questionResult.consensus.questions
      };

    } catch (err) {
      this.error({ error: err.message }, "Question generation failed");
      return {
        ...initialRefinement,
        needsQuestions: false,
        questions: []
      };
    }
  }

  /**
   * Validate a refined request
   * @param {string} refinedRequest - The refined request to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateRefinedRequest(refinedRequest) {
    this.info({ refinedRequest }, "Validating refined request");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a quality assurance expert validating request specifications.",
        user: `Validate this request for completeness and actionability:\n\n"${refinedRequest}"`,
        schema: {
          name: "validation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["is_valid", "completeness_score", "actionability_score", "issues"],
            properties: {
              is_valid: { type: "boolean" },
              completeness_score: { type: "number", minimum: 0, maximum: 100 },
              actionability_score: { type: "number", minimum: 0, maximum: 100 },
              issues: {
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
        temperature: 0.1
      });

      return result.consensus;

    } catch (err) {
      this.error({ error: err.message }, "Validation failed");
      return {
        is_valid: true,
        completeness_score: 70,
        actionability_score: 70,
        issues: [],
        recommendations: []
      };
    }
  }

  /**
   * Print refinement results to console in a user-friendly format
   */
  printRefinementResult(result) {
    if (!result) {
      console.log("⚠️  Request refinement failed or returned no result\n");
      return;
    }

    console.log("\n" + "=".repeat(80));
    console.log("📝 REQUEST REFINEMENT RESULTS");
    console.log("=".repeat(80));
    
    console.log("\n🔹 ORIGINAL REQUEST:");
    console.log(`   ${result.original || 'N/A'}`);
    
    console.log("\n✨ REFINED REQUEST:");
    console.log(`   ${result.refined || 'N/A'}`);
    
    console.log(`\n📊 CONFIDENCE: ${result.confidence || 0}%`);
    
    if (result.clarifications && result.clarifications.length > 0) {
      console.log("\n🔍 CLARIFICATIONS MADE:");
      result.clarifications.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
    }
    
    if (result.assumptions && result.assumptions.length > 0) {
      console.log("\n💭 ASSUMPTIONS:");
      result.assumptions.forEach((a, i) => console.log(`   ${i + 1}. ${a}`));
    }
    
    if (result.missingInfo && result.missingInfo.length > 0) {
      console.log("\n⚠️  MISSING INFO (would improve accuracy):");
      result.missingInfo.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
    }
    
    if (result.suggestedDepartments && result.suggestedDepartments.length > 0) {
      console.log("\n🏢 SUGGESTED DEPARTMENTS:");
      console.log(`   ${result.suggestedDepartments.join(", ")}`);
    }
    
    if (result.needsQuestions && result.questions && result.questions.length > 0) {
      console.log("\n❓ CLARIFYING QUESTIONS:");
      result.questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    }
    
    console.log("\n" + "=".repeat(80) + "\n");
  }
}
