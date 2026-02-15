/**
 * Example: Integrating Multi-LLM into BackendCoderAgent
 * 
 * Shows how to modify existing agents to use multi-LLM consensus
 * This is a template - adapt for your other agents too
 */

import { consensusCall, callByProfile } from "../llm/multiLlmSystem.js";

/**
 * Before: BackendCoderAgent with single LLM
 */
export class BackendCoderAgent_OLD {
  constructor(logger) {
    this.logger = logger;
  }

  async analyzeRequirements(requirements) {
    // Single LLM call
    const result = await llmJson({
      model: "gpt-4o",
      system: "You are an expert backend developer",
      user: `Analyze these requirements:\n${requirements}`,
      schema: analysisSchema,
      logger: this.logger
    });
    return result;
  }

  async generateCode(requirements) {
    const result = await llmJson({
      model: "gpt-4o",
      system: "You are an expert backend developer generating production code",
      user: `Generate backend code for:\n${requirements}`,
      schema: codeSchema,
      logger: this.logger
    });
    return result;
  }
}

/**
 * After: BackendCoderAgent with Multi-LLM Consensus
 */
export class BackendCoderAgent_Multi {
  constructor(logger) {
    this.logger = logger;
    // Note: MultiLLM is initialized globally in main app
  }

  async analyzeRequirements(requirements) {
    // Multi-LLM consensus call
    const result = await consensusCall({
      profile: "balanced",
      system: "You are an expert backend developer",
      user: `Analyze these requirements:\n${requirements}`,
      schema: analysisSchema,
      temperature: 0.1 // Lower temp for consistent analysis
    });

    // Log the consensus strength
    this.logger?.info({
      agreement: result.metadata.totalSuccessful / result.metadata.totalRequested,
      models: result.metadata.totalSuccessful
    }, "Backend analysis consensus");

    return result.consensus;
  }

  async generateCode(requirements) {
    // Use balanced profile for code generation
    const result = await consensusCall({
      profile: "balanced",
      system: "You are an expert backend developer generating production code",
      user: `Generate backend code for:\n${requirements}`,
      schema: codeSchema,
      temperature: 0.2 // Slightly creative
    });

    this.logger?.info({
      models: result.metadata.totalSuccessful,
      reasoning: result.reasoning
    }, "Code generation consensus");

    return result.consensus;
  }

  async reviewCode(code, context) {
    // Code review benefits from multiple perspectives
    const result = await consensusCall({
      profile: "balanced",
      system: "You are an expert code reviewer",
      user: `Review this code for issues, performance, and best practices:\n${code}`,
      schema: reviewSchema,
      temperature: 0.15
    });

    this.logger?.info({
      reviewerCount: result.metadata.totalSuccessful,
      agreement: `${(result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(0)}%`
    }, "Code review consensus");

    return result.consensus;
  }

  async optimizePerformance(code) {
    const result = await consensusCall({
      profile: "accurate", // Use best models for optimization
      system: "You are a performance optimization expert",
      user: `Suggest performance optimizations for:\n${code}`,
      schema: optimizationSchema,
      temperature: 0.1
    });

    return result.consensus;
  }

  async generateTests(code) {
    const result = await consensusCall({
      profile: "balanced",
      system: "You are a QA expert generating comprehensive test cases",
      user: `Generate test cases for:\n${code}`,
      schema: testSchema,
      temperature: 0.3 // Can be more creative with tests
    });

    return result.consensus;
  }

  // Adaptive method: start cheap, escalate to better models if needed
  async complexRefactoring(code, context) {
    try {
      // First try with economical models
      const result = await callByProfile({
        costProfile: "economical",
        system: "You are a refactoring expert",
        user: `Refactor this code:\n${code}\nContext: ${context}`,
        schema: refactoringSchema,
        temperature: 0.2
      });

      // Check confidence
      const hasError = JSON.stringify(result.consensus).toLowerCase().includes("error");
      if (!hasError) {
        this.logger?.info("Refactoring done with economical profile");
        return result.consensus;
      }

      // Low confidence, escalate to premium
      this.logger?.info("Escalating to premium models for refactoring");
      const premiumResult = await callByProfile({
        costProfile: "premium",
        system: "You are a senior refactoring expert",
        user: `Carefully refactor this code:\n${code}\nContext: ${context}`,
        schema: refactoringSchema,
        temperature: 0.1
      });

      return premiumResult.consensus;
    } catch (err) {
      this.logger?.error({ error: err.message }, "Failed to refactor");
      throw err;
    }
  }

  // Cost-aware helper
  async getCostInfo() {
    return {
      profiles: {
        economical: "$0.01-0.05 per call",
        balanced: "$0.10-0.30 per call",
        accurate: "$0.50-1.00 per call"
      },
      profiles_description: {
        economical: "Fast, cheap - for simple analysis",
        balanced: "Good quality, reasonable cost - general use",
        accurate: "Best models - for critical decisions"
      }
    };
  }
}

/**
 * Example: Integration with FrontendCoderAgent
 */
export class FrontendCoderAgent_Multi {
  constructor(logger) {
    this.logger = logger;
  }

  async analyzeDesign(requirements) {
    return (await consensusCall({
      profile: "balanced",
      system: "You are an expert UI/UX designer",
      user: `Analyze design requirements:\n${requirements}`,
      schema: designSchema,
      temperature: 0.2
    })).consensus;
  }

  async generateComponent(spec) {
    return (await consensusCall({
      profile: "balanced",
      system: "You are an expert React developer",
      user: `Generate React component:\n${spec}`,
      schema: componentSchema,
      temperature: 0.2
    })).consensus;
  }

  async reviewUI(code) {
    // UI review benefits from multiple design perspectives
    return (await consensusCall({
      profile: "balanced",
      system: "You are an expert UI/UX reviewer",
      user: `Review this component for UX, accessibility, and performance:\n${code}`,
      schema: uiReviewSchema,
      temperature: 0.15
    })).consensus;
  }
}

/**
 * Example: Integration with ManagerAgent
 */
export class ManagerAgent_Multi {
  constructor(logger) {
    this.logger = logger;
  }

  async planProject(requirements) {
    // Important decision - use accurate profile
    const result = await consensusCall({
      profile: "accurate",
      system: "You are a project management expert",
      user: `Create project plan for:\n${requirements}`,
      schema: planSchema,
      temperature: 0.1 // Consistent planning
    });

    this.logger?.info({
      agreement: result.metadata.totalSuccessful / result.metadata.totalRequested,
      models: result.metadata.totalSuccessful
    }, "Project plan consensus");

    return result.consensus;
  }

  async analyzeFeasibility(proposal) {
    return (await consensusCall({
      profile: "balanced",
      system: "You are a technical feasibility analyst",
      user: `Analyze feasibility:\n${proposal}`,
      schema: feasibilitySchema,
      temperature: 0.15
    })).consensus;
  }

  async identifyRisks(plan) {
    return (await consensusCall({
      profile: "premium", // Security/risk - use best
      system: "You are a risk management expert",
      user: `Identify risks in plan:\n${plan}`,
      schema: risksSchema,
      temperature: 0.1
    })).consensus;
  }
}

/**
 * Migration Path: How to update your existing agents
 * 
 * 1. Replace single llmJson() calls with consensusCall()
 * 2. Choose appropriate profile for each use case
 * 3. Extract .consensus from result
 * 4. Update logging to show consensus strength
 * 
 * Example conversion:
 * 
 * BEFORE:
 *   const result = await llmJson({ model: "gpt-4o", system, user, schema });
 * 
 * AFTER:
 *   const result = await consensusCall({ profile: "balanced", system, user, schema });
 *   const finalResult = result.consensus;
 */

// Quick reference for which profile to use in each agent type:
export const PROFILE_RECOMMENDATIONS = {
  BackendCoder: {
    analyzeRequirements: "balanced",
    generateCode: "balanced",
    reviewCode: "balanced",
    optimizePerformance: "accurate",
    generateTests: "balanced",
    complexRefactoring: "adaptive" // escalate if needed
  },
  FrontendCoder: {
    analyzeDesign: "balanced",
    generateComponent: "balanced",
    reviewUI: "balanced",
    optimization: "balanced"
  },
  Manager: {
    planProject: "accurate", // Important decisions
    analyzeFeasibility: "balanced",
    identifyRisks: "premium", // Risk - none can be missed
    stakeholderUpdate: "balanced"
  },
  QAManager: {
    generateTestPlan: "balanced",
    reviewTests: "balanced",
    identifyEdgeCases: "accurate",
    performanceReview: "balanced"
  },
  SecurityManager: {
    threatModeling: "premium", // Critical
    codeSecurityReview: "premium", // Critical
    complianceCheck: "accurate",
    vulnerabilityAnalysis: "premium" // Critical
  }
};

export default {
  BackendCoderAgent_Multi,
  FrontendCoderAgent_Multi,
  ManagerAgent_Multi,
  PROFILE_RECOMMENDATIONS
};
