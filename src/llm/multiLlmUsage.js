/**
 * Multi-LLM Usage Example & Integration Guide
 * Shows how to integrate multi-LLM consensus into Genie
 */

import MultiLlmOrchestrator from "./multiLlmOrchestrator.js";
import OpenAIProvider from "./providers/openaiProvider.js";
import AnthropicProvider from "./providers/anthropicProvider.js";
import ConsensusEngine from "./consensusEngine.js";
import { LLM_PROFILES } from "./multiLlmConfig.js";

/**
 * Example: Set up multi-LLM orchestrator with OpenAI and Anthropic
 */
export async function setupMultiLlmOrchestrator(logger = null) {
  const orchestrator = new MultiLlmOrchestrator();

  // Register providers
  orchestrator.registerProvider("openai", new OpenAIProvider(logger));
  orchestrator.registerProvider("anthropic", new AnthropicProvider(logger));

  return orchestrator;
}

/**
 * Example: Get consensus answer from multiple LLMs
 * This replaces a single llmJson() call with a consensus-based call
 */
export async function consensusLlmCall(orchestrator, config) {
  const {
    profile = "balanced", // or specific llmConfigs array
    system,
    user,
    schema,
    temperature = 0.2,
    consensusMethod = "voting"
  } = config;

  let llmConfigs = profile;
  if (typeof profile === "string") {
    llmConfigs = LLM_PROFILES[profile] || LLM_PROFILES.balanced;
  }

  return await orchestrator.consensusCall({
    llmConfigs,
    system,
    user,
    schema,
    temperature,
    consensusMethod
  });
}

/**
 * Example: Use specific cost profile
 */
export async function consensusByProfile(orchestrator, config) {
  const {
    costProfile = "balanced", // "free", "paid", or "balanced"
    system,
    user,
    schema,
    temperature = 0.2
  } = config;

  return await orchestrator.callByProfile({
    costProfile,
    system,
    user,
    schema,
    temperature
  });
}

/**
 * Example: Get all responses and analyze them
 */
export async function multiLlmAnalysis(orchestrator, config) {
  const {
    profile = "balanced",
    system,
    user,
    schema,
    temperature = 0.2
  } = config;

  const llmConfigs = LLM_PROFILES[profile] || LLM_PROFILES.balanced;

  // Get all responses
  const result = await orchestrator.callMultiple({
    llmConfigs,
    system,
    user,
    schema,
    temperature
  });

  // Extract successful responses
  const successful = result.responses.filter(r => r.status === "success");
  const responses = successful.map(r => r.data);

  // Apply different consensus methods and compare
  const analysis = {
    totalCalls: result.metadata.totalRequested,
    successful: result.metadata.totalSuccessful,
    failed: result.metadata.totalFailed,
    
    // Different consensus approaches
    voting: ConsensusEngine.voting(responses),
    committee: ConsensusEngine.committee(responses),
    ranking: ConsensusEngine.ranking(responses),
    augmented: ConsensusEngine.augmented(responses, result.responses),
    
    allResponses: result.responses
  };

  return analysis;
}

/**
 * Example: Expert agent with multi-LLM consensus
 */
export async function agentWithConsensus(orchestrator, config) {
  const {
    role = "backend", // "backend", "frontend", "architecture", etc.
    task,
    context,
    profile = "balanced",
    systemPromptBuilder, // function that builds system prompt
    userPromptBuilder,   // function that builds user prompt
    schema
  } = config;

  // Build prompts specific to the role
  const system = systemPromptBuilder(role, context);
  const user = userPromptBuilder(role, task, context);

  // Get consensus from multiple LLMs
  return await consensusLlmCall(orchestrator, {
    profile,
    system,
    user,
    schema,
    temperature: 0.1 // Lower temp for consistency in technical decisions
  });
}

/**
 * Example: Integration with existing agent
 * Before: Single LLM call per request
 * After: Multi-LLM consensus
 */
export class MultiLlmBackendAgent {
  constructor(orchestrator, logger = null) {
    this.orchestrator = orchestrator;
    this.logger = logger;
  }

  async generateArchitecture(requirements, context) {
    const result = await consensusLlmCall(this.orchestrator, {
      profile: "accurate", // Use best models for architecture
      system: `You are a backend architecture expert. ${context.guidelines || ""}`,
      user: `Design the backend architecture for: ${requirements}`,
      schema: {
        name: "backend_architecture",
        schema: {
          type: "object",
          required: ["architecture", "components", "rationale"],
          properties: {
            architecture: { type: "string" },
            components: {
              type: "array",
              items: { type: "string" }
            },
            rationale: { type: "string" }
          }
        }
      }
    });

    this.logger?.info({
      agreement: result.reasoning,
      models: result.metadata.totalSuccessful
    }, "Architecture consensus generated");

    return result.consensus;
  }

  async reviewCode(code, context) {
    const result = await consensusLlmCall(this.orchestrator, {
      profile: "balanced",
      system: "You are a code review expert.",
      user: `Review this code for issues:\n\n${code}`,
      schema: {
        name: "code_review",
        schema: {
          type: "object",
          required: ["issues", "suggestions", "score"],
          properties: {
            issues: {
              type: "array",
              items: { type: "string" }
            },
            suggestions: {
              type: "array",
              items: { type: "string" }
            },
            score: { type: "number", minimum: 0, maximum: 100 }
          }
        }
      }
    });

    return result;
  }

  async getHealthMetrics() {
    return await this.orchestrator.getProviderStatus();
  }
}

/**
 * Example: Cost-aware orchestration
 * Starts with cheap models, escalates if confidence is low
 */
export async function adaptiveConsensus(orchestrator, config) {
  const { system, user, schema, temperature = 0.2 } = config;

  // First: Try with economical models
  const economical = await orchestrator.consensusCall({
    llmConfigs: LLM_PROFILES.economical,
    system,
    user,
    schema,
    temperature,
    consensusMethod: "voting"
  });

  // Check confidence
  const confidence = economical.metadata.totalSuccessful / economical.metadata.totalRequested;

  if (confidence >= 0.7) {
    // Good agreement, return result
    return {
      consensus: economical.consensus,
      reason: "High confidence from economical models",
      cost: "low"
    };
  }

  // Low confidence, escalate to premium models
  const premium = await orchestrator.consensusCall({
    llmConfigs: LLM_PROFILES.premium,
    system,
    user,
    schema,
    temperature,
    consensusMethod: "voting"
  });

  return {
    consensus: premium.consensus,
    reason: "Escalated to premium models due to low initial confidence",
    cost: "high",
    escalation: true
  };
}

export default {
  setupMultiLlmOrchestrator,
  consensusLlmCall,
  consensusByProfile,
  multiLlmAnalysis,
  agentWithConsensus,
  MultiLlmBackendAgent,
  adaptiveConsensus
};
