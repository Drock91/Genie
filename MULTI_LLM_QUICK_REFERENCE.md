# Multi-LLM Consensus System - Quick Reference

## TL;DR

You now have a system that gets opinions from multiple LLMs (free + paid) simultaneously and reaches consensus on better answers.

## One-Minute Setup

```javascript
// 1. Initialize in your main file
import { initializeMultiLlm, consensusCall } from "./src/llm/multiLlmSystem.js";

const multiLlm = await initializeMultiLlm(logger);

// 2. Use in any agent
const result = await consensusCall({
  profile: "balanced",
  system: "You are an expert",
  user: "Do something",
  schema: { /* your schema */ }
});

const answer = result.consensus; // That's it!
```

## Profiles at a Glance

```javascript
"economical"  // Fast, cheap - for simple tasks
"balanced"    // Good quality, reasonable cost - general use
"accurate"    // Best models - for important decisions
"premium"     // All best models - for critical decisions
"fast"        // Speed-focused - for time-sensitive work
```

## Usage in Agents

### Before (Single LLM)
```javascript
const response = await llmJson({ model: "gpt-4o", system, user, schema });
```

### After (Multi-LLM Consensus)
```javascript
const result = await consensusCall({ profile: "balanced", system, user, schema });
const response = result.consensus; // Drop-in replacement
```

## How It Works

```
3 LLMs called in parallel → Get 3 different answers
                  ↓
        Apply consensus algorithm
                  ↓
      Return the answer most LLMs agreed on
                  ↓
           Higher confidence result!
```

## Key Benefits

| Aspect | Single LLM | Multi-LLM Consensus |
|--------|-----------|-------------------|
| Quality | Good | Better (multiple perspectives) |
| Reliability | One point of failure | Resilient (1 of 3 failing is fine) |
| Cost | Fixed | Optimizable (start cheap, escalate) |
| Confidence | Unknown | Measurable (% agreement) |
| Speed | 1s | ~1s (parallel execution) |

## Real Examples

### Architecture Design
```javascript
const result = await consensusCall({
  profile: "accurate", // Best models for architecture
  system: "You are a system architect",
  user: "Design microservices for real-time SaaS",
  schema: architectureSchema
});

// result.consensus = agreed-upon architecture
// result.reasoning = why this was chosen
// result.metadata.totalSuccessful = 3 (all agreed!)
```

### Code Review
```javascript
const result = await consensusCall({
  profile: "balanced",
  system: "Perform code review",
  user: `Review:\n${code}`,
  schema: reviewSchema
});

// Get code review from multiple perspectives
// result.consensus = merged review with consensus issues
```

### Quick Decision
```javascript
const result = await consensusCall({
  profile: "economical", // Just need quick opinion
  system: "Brief analysis",
  user: "Should we use REST or GraphQL?",
  schema: decisionSchema
});

// Cost: ~$0.03, Speed: ~1s
```

## Integration with Your Manager

```javascript
// In your orchestrator/manager setup
class ManagerAgent {
  constructor(logger) {
    this.multiLlm = await initializeMultiLlm(logger);
    this.logger = logger;
  }

  async analyzePlan(request) {
    const result = await consensusCall({
      profile: "balanced",
      system: "Analyze requirements and create plan",
      user: request,
      schema: planSchema
    });

    this.logger.info(`Consensus from ${result.metadata.totalSuccessful} LLMs`);
    return result.consensus;
  }
}
```

## Controlling Costs

```javascript
// Cheap (start here)
profile: "economical"  // ~$0.01-0.05 per call

// Mid-range (most use)
profile: "balanced"    // ~$0.10-0.30 per call

// Expensive (critical only)
profile: "premium"     // ~$0.50-1.00 per call

// Smart escalation (best)
await adaptiveConsensus(config) // Starts cheap, escalates if needed
```

## Environment Setup

```bash
# .env file - required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
GOOGLE_API_KEY=...
```

## What Each LLM Excels At

| Model | Strength | Use For |
|-------|----------|---------|
| GPT-4o | Latest, balanced | General decisions |
| Claude Opus | Complex reasoning | Architecture, strategy |
| Claude Sonnet | Good balance | Code, reviews |
| Claude Haiku | Very fast, cheap | Simple tasks |
| GPT-3.5 | Budget option | Quick analysis |

## Consensus Methods

```javascript
// Voting (most common) - most LLMs agree
const result = ConsensusEngine.voting(responses);

// Committee - groups similar answers
const result = ConsensusEngine.committee(responses);

// Ranking - scores by quality
const result = ConsensusEngine.ranking(responses);

// Weighted - custom model weights
const result = ConsensusEngine.weighted(responses, [3, 2, 1]);
```

## Monitoring

```javascript
// Check if everything is working
const status = await multiLlm.getStatus();
// { initialized: true, providers: {...}, availableProfiles: [...] }

// See all responses (debugging)
const analysis = await multiLlmAnalysis(orchestrator, config);
console.log(analysis.allResponses);
```

## Files You Need to Know

```
src/llm/
├── multiLlmSystem.js           ← Use this for initialization
├── multiLlmOrchestrator.js     ← Core logic
├── consensusEngine.js          ← Consensus algorithms
├── multiLlmConfig.js           ← Profiles
└── providers/
    ├── openaiProvider.js
    └── anthropicProvider.js
```

## Common Patterns

### Pattern 1: Simple Integration
```javascript
import { consensusCall } from "./src/llm/multiLlmSystem.js";

const answer = (await consensusCall({
  profile: "balanced",
  system: prompt.system,
  user: prompt.user,
  schema: outputSchema
})).consensus;
```

### Pattern 2: With Analysis
```javascript
import { multiLlmAnalysis } from "./src/llm/multiLlmUsage.js";

const analysis = await multiLlmAnalysis(orchestrator, {
  profile: "balanced",
  system, user, schema
});

console.log("Consensus:", analysis.voting.consensus);
console.log("Agreement:", analysis.voting.agreementPercentage);
console.log("Groups:", analysis.committee.totalGroups);
```

### Pattern 3: Cost-Aware
```javascript
import { adaptiveConsensus } from "./src/llm/multiLlmUsage.js";

const result = await adaptiveConsensus({
  system, user, schema
  // Auto-escalates from cheap to expensive if needed
});

console.log(result.cost); // "low" or "high"
```

## Troubleshooting

### No responses
```javascript
// Check what's available
const status = await multiLlm.getStatus();
console.log(status.providers); // See which providers work
```

### Want to debug
```javascript
// See all LLM responses
const { allResponses } = await multiLlmAnalysis(...);
allResponses.forEach(r => console.log(r.model, r.data));
```

### Costs too high
```javascript
// Use cheaper profile
profile: "economical" // instead of "premium"

// Or use adaptive
await adaptiveConsensus(...) // Smart escalation
```

### One LLM failing
```javascript
// System continues with others!
// Only fails if ALL fail

const result = await consensusCall(...);
console.log(result.metadata);
// { totalRequested: 3, totalSuccessful: 2, totalFailed: 1 }
```

## Next Steps

1. **Install**: `npm install`
2. **Setup**: Add API keys to .env
3. **Test**: Run a simple `consensusCall()`
4. **Integrate**: Update one agent to use it
5. **Monitor**: Check agreement percentages
6. **Optimize**: Choose best profile for each use case

## Reference: All Available Methods

```javascript
// Initialize
const multiLlm = await initializeMultiLlm(logger);

// Simple consensus
await consensusCall({ profile, system, user, schema });

// By cost profile
await callByProfile({ costProfile: "balanced", system, user, schema });

// All responses + analysis
await multiLlmAnalysis(orchestrator, config);

// Expert-specific
await agentWithConsensus(orchestrator, { role, task, ... });

// Cost-aware with escalation
await adaptiveConsensus(config);

// Get status
await multiLlm.getStatus();
```

## Success Indicators

✅ Multiple LLMs returning consistent answers → High confidence
✅ Slight variations between LLMs → Good diversity
✅ One LLM failing, others succeeding → System resilience working
✅ All LLMs agreeing → Probable correct answer

---

That's it! You now have multi-LLM consensus. Start with "balanced" profile and adjust from there.

For detailed docs, see `MULTI_LLM_README.md` and `MULTI_LLM_INTEGRATION.md`.
