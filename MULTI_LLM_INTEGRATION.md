# Multi-LLM Integration Guide for Agent System

## What Was Added

A complete multi-LLM consensus system that allows your agents to get opinions from multiple language models (free + paid) simultaneously and reach consensus on answers.

## Why This Matters

Your current system uses a single OpenAI model. The new system:
- Gets multiple perspectives on complex problems
- Combines free models (Claude, Grok) with paid ones (GPT-4)
- Validates decisions through consensus
- Falls back gracefully if any LLM fails
- Optimizes costs dynamically

## Quick Example

**Before:**
```javascript
const response = await llmJson({
  model: "gpt-4o",
  system: "You are a backend architect",
  user: "Design API for real-time notifications",
  schema: architectureSchema
});
```

**After:**
```javascript
// Initialize once
const orchestrator = await setupMultiLlmOrchestrator(logger);

// Call multiple LLMs in parallel
const result = await consensusLlmCall(orchestrator, {
  profile: "balanced", // GPT-4o + Claude Sonnet + Claude Haiku
  system: "You are a backend architect",
  user: "Design API for real-time notifications",
  schema: architectureSchema
});

const response = result.consensus; // The agreed-upon answer
```

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install
# Installs @anthropic-ai/sdk and @google/generative-ai
```

### Step 2: Set Environment Variables

```env
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=... (optional)
```

### Step 3: Update Your Agent Initialization

**Before:**
```javascript
import { llmJson } from "./llm/openaiClient.js";

class BackendAgent {
  async generateCode(requirements) {
    return await llmJson({
      model: "gpt-4o",
      system, user, schema
    });
  }
}
```

**After:**
```javascript
import { setupMultiLlmOrchestrator, consensusLlmCall } from "./llm/multiLlmUsage.js";

class BackendAgent {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async generateCode(requirements) {
    return await consensusLlmCall(this.orchestrator, {
      profile: "balanced",
      system, user, schema
    });
  }
}

// In manager/main setup
const orchestrator = await setupMultiLlmOrchestrator(logger);
const agent = new BackendAgent(orchestrator);
```

### Step 4: Choose Your Profile

For different scenarios, use different profiles:

```javascript
// For simple tasks - fast & cheap
await consensusLlmCall(orchestrator, { profile: "economical", ... });

// For general work - balanced
await consensusLlmCall(orchestrator, { profile: "balanced", ... });

// For critical decisions - best models
await consensusLlmCall(orchestrator, { profile: "premium", ... });

// For complex reasoning - accuracy focused
await consensusLlmCall(orchestrator, { profile: "accurate", ... });
```

## Real Integration Patterns

### Pattern 1: Manager Agent with Consensus

```javascript
class ManagerAgent {
  constructor(orchestrator, experts) {
    this.orchestrator = orchestrator;
    this.experts = experts;
  }

  async analyzeTask(request) {
    // Get consensus on task complexity
    const analysis = await consensusLlmCall(this.orchestrator, {
      profile: "balanced",
      system: "Analyze task complexity and requirements",
      user: request,
      schema: taskAnalysisSchema,
      temperature: 0.1 // Low temp for consistent decisions
    });

    return analysis.consensus;
  }

  async createPlan(task) {
    // Multiple LLMs create plans, merge them
    const result = await multiLlmAnalysis(this.orchestrator, {
      profile: "premium", // Use best models
      system: "Create project plan",
      user: task,
      schema: planSchema
    });

    // Use the most agreed-upon plan
    return result.augmented.consensus;
  }
}
```

### Pattern 2: Expert Agent with Multi-LLM Review

```javascript
class SecurityAgent {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async reviewSecurity(architecture) {
    return await agentWithConsensus(this.orchestrator, {
      role: "security",
      task: `Review architecture for security issues: ${architecture}`,
      profile: "premium", // Security critical - use best
      systemPromptBuilder: (role) =>
        "You are a security expert reviewing architecture",
      userPromptBuilder: (role, task) => task,
      schema: securityReviewSchema
    });
  }
}
```

### Pattern 3: Cost-Aware Escalation

```javascript
class SmartAgent {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  async solve(problem) {
    // Try with cheap models first
    const result = await adaptiveConsensus(this.orchestrator, {
      system: "Solve this problem",
      user: problem,
      schema: solutionSchema
      // Automatically escalates if confidence < 70%
    });

    console.log(result.cost); // "low" or "high"
    return result.consensus;
  }
}
```

## File Structure

```
src/llm/
├── multiLlmOrchestrator.js      # Main orchestrator
├── consensusEngine.js            # Consensus algorithms
├── multiLlmConfig.js             # LLM profiles & config
├── multiLlmUsage.js              # Usage examples
├── providers/
│   ├── openaiProvider.js         # OpenAI wrapper
│   └── anthropicProvider.js      # Anthropic wrapper
├── openaiClient.js               # Existing (still works)
└── schemas.js                    # Existing
```

## Available Consensus Methods

When analyzing multiple responses, use different methods:

```javascript
const analysis = await multiLlmAnalysis(orchestrator, config);

// consensus.voting()
// - Most common answer wins
// - Simple, predictable

// consensus.committee()
// - Groups similar answers
// - Shows diversity of opinion

// consensus.ranking()
// - Scores by quality
// - Identifies best response

// consensus.weighted()
// - Custom model weights
// - GPT-4 opinion worth more than others

// consensus.augmented()
// - All methods + reasoning
// - Comprehensive analysis
```

## Examples for Your Agents

### BackendCoder + Consensus

```javascript
async generateCode(requirements) {
  return await consensusLlmCall(this.orchestrator, {
    profile: "balanced", // Good code usually
    system: "You are an expert backend developer",
    user: `Generate backend code for: ${requirements}`,
    schema: codeSchema,
    temperature: 0.2 // Slightly creative
  });
}
```

### Architecture + Consensus

```javascript
async designSystem(requirements) {
  return await consensusLlmCall(this.orchestrator, {
    profile: "accurate", // Important decision
    system: "You are a system architect",
    user: `Design the architecture for: ${requirements}`,
    schema: archSchema,
    temperature: 0.1 // Consistent architecture
  });
}
```

### QA + Consensus

```javascript
async generateTests(code) {
  return await consensusLlmCall(this.orchestrator, {
    profile: "balanced",
    system: "You are a QA expert",
    user: `Generate tests for:\n${code}`,
    schema: testSchema,
    temperature: 0.3 // Some creativity okay
  });
}
```

## Backwards Compatibility

Your existing code still works! The new system is opt-in:

```javascript
// Old way - still works
import { llmJson } from "./llm/openaiClient.js";
const response = await llmJson(...);

// New way - with consensus
import { consensusLlmCall } from "./llm/multiLlmUsage.js";
const result = await consensusLlmCall(...);
const response = result.consensus;
```

## Monitoring & Debugging

### Check provider health

```javascript
const status = await orchestrator.getProviderStatus();
console.log(status); // { openai: {...}, anthropic: {...} }
```

### See all responses

```javascript
const analysis = await multiLlmAnalysis(orchestrator, config);
console.log(analysis.allResponses); // Array of all LLM outputs
```

### Debug consensus

```javascript
const result = await consensusLlmCall(orchestrator, config);
console.log(result.reasoning); // Why this answer was chosen
console.log(result.metadata.totalSuccessful); // How many succeeded
```

## Cost Examples

**For a single task:**
- Economical: $0.01-0.05
- Balanced: $0.10-0.30
- Premium: $0.50-1.00

**How to optimize:**
- Simple tasks: Use economical
- Standard work: Use balanced
- Critical decisions: Use premium
- Unknown complexity: Use adaptive (starts cheap, escalates if needed)

## Next: Integration Steps

1. ✅ Install: `npm install`
2. ✅ Set .env variables
3. ✅ Pick one agent to update first (e.g., ManagerAgent)
4. ✅ Replace `llmJson()` with `consensusLlmCall()`
5. ✅ Test with "balanced" profile
6. ✅ Gradually update other agents
7. ✅ Add logging/monitoring
8. ✅ Optimize profiles per use case

## Questions to Consider

- **For code generation:** Use "balanced" (speed + quality)
- **For architecture:** Use "accurate" (best reasoning)
- **For quick-and-dirty:** Use "economical" (fast + cheap)
- **For customer-facing:** Use "premium" (best quality)
- **For security:** Use "premium" (can't take risks)

---

The system is designed to be flexible and easy to integrate while providing significant improvements in decision quality through consensus-based LLM orchestration.
