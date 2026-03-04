# Multi-LLM Consensus System

## Overview

The Multi-LLM Consensus System enables your agent network to query multiple language models simultaneously (free and paid) and reach consensus on better answers. This dramatically improves response quality, reliability, and decision-making.

## Key Features

✅ **Multiple Providers** - OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Google (Gemini)
✅ **Consensus Mechanisms** - Voting, weighted, committee, ranking, hybrid approaches
✅ **Cost Profiles** - Free, paid, balanced, economical, premium combinations
✅ **Fallback Support** - Automatic fallback if some LLMs fail
✅ **Parallel Execution** - All LLMs called simultaneously for speed
✅ **Provider Status** - Health checks for all providers
✅ **Adaptive Escalation** - Start cheap, escalate if confidence is low

## Why Use Multiple LLMs?

### Better Quality
- Different models excel at different tasks
- Multiple perspectives reduce bias
- Consensus validates important decisions

### Higher Reliability
- If one LLM fails, others continue
- No single point of failure
- Graceful degradation

### Cost Optimization
- Use free/cheap models for initial analysis
- Use expensive models only when needed
- Adaptive escalation based on confidence

### Improved Decision Making
- Architecture decisions benefit from multiple expert opinions
- Code reviews from different perspectives catch more issues
- Complex problems solved with consensus approach

## Architecture

```
User Request
    ↓
TaskAnalyzer (determine complexity)
    ↓
MultiLlmOrchestrator
    ├─→ OpenAI Provider (GPT-4)
    ├─→ Anthropic Provider (Claude)
    ├─→ Google Provider (Gemini)
    └─→ ... more providers
    ↓
Consensus Engine
    ├─ Voting
    ├─ Weighted
    ├─ Committee
    └─ Ranking
    ↓
Merged Result
    ↓
Expert (Backend, Frontend, etc.)
    ↓
Output
```

## Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."
```

### 2. Basic Usage

```javascript
import { setupMultiLlmOrchestrator, consensusLlmCall } from "./src/llm/multiLlmUsage.js";

// Initialize
const orchestrator = await setupMultiLlmOrchestrator(logger);

// Get consensus answer
const result = await consensusLlmCall(orchestrator, {
  profile: "balanced", // Use fast/economical/balanced/accurate/premium
  system: "You are a backend architecture expert.",
  user: "Design an API for a real-time notification system.",
  schema: YOUR_SCHEMA,
  temperature: 0.1
});

console.log(result.consensus); // The agreed-upon answer
console.log(result.reasoning); // Why this answer was chosen
```

### 3. Advanced Usage: Different Consensus Methods

```javascript
import ConsensusEngine from "./src/llm/consensusEngine.js";

// All responses from orchestrator
const analysis = await multiLlmAnalysis(orchestrator, config);

// Try different methods
const voting = analysis.voting; // Most common answer
const committee = analysis.committee; // Group similar answers
const ranking = analysis.ranking; // Score by quality
```

## LLM Profiles

Pre-configured combinations optimized for different scenarios:

| Profile | Models | Best For | Cost | Speed |
|---------|--------|----------|------|-------|
| **premium** | GPT-4o, Claude Opus, Gemini | Maximum quality | $$$$ | Fast |
| **balanced** | GPT-4o, Claude Sonnet, Claude Haiku | General purpose | $$$ | Fast |
| **accurate** | Claude Opus, GPT-4o, Claude Sonnet | Complex decisions | $$$$ | Moderate |
| **economical** | Claude Haiku, GPT-3.5, Claude Haiku | Budget-conscious | $ | Fast |
| **fast** | GPT-3.5, Claude Haiku | Speed critical | $ | Very Fast |
| **quick_consensus** | GPT-4o, Claude Sonnet | Quick decisions | $$ | Fast |

## Configuration

### Using Profile

```javascript
const result = await consensusLlmCall(orchestrator, {
  profile: "balanced", // Use predefined profile
  system, user, schema
});
```

### Using Specific Models

```javascript
import { LLM_CONFIGS } from "./src/llm/multiLlmConfig.js";

const result = await orchestrator.consensusCall({
  llmConfigs: [
    LLM_CONFIGS.OPENAI_GPT4O,
    LLM_CONFIGS.CLAUDE_OPUS,
    LLM_CONFIGS.CLAUDE_HAIKU
  ],
  system, user, schema
});
```

### By Cost Profile

```javascript
const result = await consensusByProfile(orchestrator, {
  costProfile: "balanced", // "free", "paid", "balanced"
  system, user, schema
});
```

## Consensus Methods

### Voting
Returns the response that most LLMs agreed on.
```javascript
const result = ConsensusEngine.voting(responses);
// { consensus, agreementPercentage, totalVotes, totalResponses }
```

### Weighted
Scores responses based on custom weights for each LLM.
```javascript
const result = ConsensusEngine.weighted(responses, [3, 2, 1]); // GPT-4 worth 3x
```

### Committee
Groups similar responses and returns the largest group.
```javascript
const result = ConsensusEngine.committee(responses);
// { consensus, groups, consensusGroupSize }
```

### Ranking
Scores responses based on completeness, clarity, specificity.
```javascript
const result = ConsensusEngine.ranking(responses);
// { consensus, ranking: [{ rank, score, index }] }
```

### Hybrid
Combines voting with confidence scores.
```javascript
const result = ConsensusEngine.hybrid(responses, confidenceScores);
// { consensus, confidenceScore }
```

### Augmented
Includes comprehensive analysis and reasoning.
```javascript
const result = ConsensusEngine.augmented(responses, llmResponses);
// { consensus, voting, committee, reasoning, originalResponses }
```

## Integration with Existing Agents

### Before (Single LLM)

```javascript
const response = await llmJson({
  model: "gpt-4o",
  system: systemPrompt,
  user: userPrompt,
  schema: outputSchema
});
```

### After (Multi-LLM Consensus)

```javascript
const result = await consensusLlmCall(orchestrator, {
  profile: "balanced",
  system: systemPrompt,
  user: userPrompt,
  schema: outputSchema
});

const response = result.consensus; // Drop-in replacement
```

## Real-World Examples

### Architecture Design (Enterprise Complexity)

```javascript
const result = await agentWithConsensus(orchestrator, {
  role: "architect",
  task: "Design microservices architecture for SaaS platform",
  profile: "premium", // Use best models for critical decisions
  systemPromptBuilder: (role, context) => 
    `You are an ${role} expert. ${context.guidelines}`,
  userPromptBuilder: (role, task) => 
    `As a ${role}, ${task}`,
  schema: architectureSchema
});
```

### Code Review (Multiple Perspectives)

```javascript
const analysis = await multiLlmAnalysis(orchestrator, {
  profile: "balanced",
  system: "Perform comprehensive code review",
  user: `Review this code:\n${code}`,
  schema: codeReviewSchema
});

// See where LLMs agree/disagree
console.log("Consensus issues:", analysis.voting.consensus.issues);
console.log("Different viewpoints:", analysis.committee.totalGroups);
```

### Adaptive Cost (Smart Escalation)

```javascript
const result = await adaptiveConsensus(orchestrator, {
  system, user, schema
  // Starts with economical models
  // Escalates to premium if confidence < 70%
});

console.log(result.cost); // "low" or "high"
console.log(result.escalation); // true if escalated
```

## Monitoring & Health

### Check Provider Status

```javascript
const status = await orchestrator.getProviderStatus();
// {
//   openai: { available: true, provider: "openai" },
//   anthropic: { available: true, provider: "anthropic" },
//   google: { available: false, error: "API key missing" }
// }
```

### Track Success Rates

```javascript
const result = await orchestrator.callMultiple({ ... });
console.log(result.metadata);
// {
//   totalRequested: 3,
//   totalSuccessful: 3,
//   totalFailed: 0
// }
```

## Performance Metrics

### Response Time
All LLMs called in parallel = ~same time as single LLM

### Success Rate
If any 1 of N LLMs succeeds, you get a response

### Cost per Request
- **Premium Setup**: ~0.5-1.0 USD
- **Balanced Setup**: ~0.1-0.3 USD
- **Economical Setup**: ~0.01-0.05 USD

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
GOOGLE_API_KEY=...
MAX_RETRIES=3
REQUEST_TIMEOUT_MS=60000
```

## Error Handling

```javascript
try {
  const result = await consensusLlmCall(orchestrator, config);
  console.log(result.consensus);
} catch (err) {
  // All LLMs failed
  console.error("Consensus failed:", err.message);
  
  // Fallback to single LLM
  const fallback = await orchestrator.callByProfile({
    costProfile: "paid",
    ...config
  });
}
```

## Advanced: Custom Provider

```javascript
class MyCustomProvider {
  async llmJson({ model, system, user, schema, temperature }) {
    // Your LLM call logic
    return jsonResult;
  }

  async healthCheck() {
    return isHealthy;
  }
}

orchestrator.registerProvider("custom", new MyCustomProvider());
```

## Best Practices

1. **Use profiles, not individual models** - Profiles are optimized for different scenarios
2. **Start economical, escalate if needed** - Use `adaptiveConsensus()` for cost efficiency
3. **Match LLM count to complexity** - 2 models for simple tasks, 3+ for complex
4. **Set low temperature** - Use 0.1-0.2 for consistent technical decisions
5. **Use voting for consensus** - Simple, effective, and predictable
6. **Monitor provider health** - Check status before critical operations
7. **Implement timeouts** - Prevent hanging on slow providers

## Troubleshooting

### No responses from any LLM
- Check environment variables
- Verify API keys are valid
- Check provider status: `orchestrator.getProviderStatus()`

### Some LLMs failing
- Check logs for specific provider errors
- Verify rate limits aren't exceeded
- Consider implementing backoff/retry

### High costs
- Use "economical" profile instead of "premium"
- Implement adaptive escalation
- Use faster models for initial analysis

### Slow responses
- Reduce number of LLMs
- Use "fast" profile
- Lower temperature for faster convergence

## Files

- `multiLlmOrchestrator.js` - Main orchestrator class
- `consensusEngine.js` - Consensus algorithms
- `multiLlmConfig.js` - Profiles and configurations
- `multiLlmUsage.js` - Usage examples and integration helpers
- `providers/openaiProvider.js` - OpenAI provider
- `providers/anthropicProvider.js` - Anthropic provider

## Next Steps

1. ✅ Set environment variables
2. ✅ Install dependencies: `npm install`
3. ✅ Try examples in `multiLlmUsage.js`
4. ✅ Integrate with existing agents
5. ✅ Monitor and optimize

---

Questions? Check the usage examples or review the source code comments.
