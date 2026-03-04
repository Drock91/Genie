# 📊 GENIE Agent Logging - Quick Reference

## 🚀 Quick Start (30 seconds)

```javascript
import SimpleAgentLogger from './src/util/simpleAgentLogger.js';

// 1. Create logger
const agentLogger = new SimpleAgentLogger();

// 2. Log an agent call
await agentLogger.logAgentCall(
  'backend',        // Agent name
  { userInput: 'create API' },  // Input
  { summary: 'Generated endpoints' },  // Output
  { duration: 2450 }  // Metadata
);

// 3. Save logs
await agentLogger.saveToFile();
// ✅ Saved to: logs/agent-trace-YYYY-MM-DD.json
```

---

## 📍 Where to Find Logs

```
logs/
├── agent-trace-2024-01-15.json   ← Agent I/O pairs (structured)
├── agent-2024-01-15.log           ← Detailed logs (verbose)
└── agent-2024-01-15-usage.log    ← LLM usage tracking
```

---

## 🎯 Main Methods

### `logAgentCall(name, request, response, metadata)`

Log an agent execution:
```javascript
await agentLogger.logAgentCall(
  'frontend',                         // Agent name
  { plan: {...}, iteration: 1 },      // Input request
  { summary: '...', patches: [...] }, // Output response
  { duration: 3420, iteration: 1 }    // Metadata
);
```

### `saveToFile()`

Save all logs to JSON:
```javascript
const result = await agentLogger.saveToFile();
// { success: true, filename: '...', tracesCount: 45, newTraces: 5 }
```

### `getSummary()`

Get stats:
```javascript
const summary = agentLogger.getSummary();
// {
//   totalRecords: 45,
//   uniqueAgents: ['manager', 'frontend', 'backend'],
//   successCount: 40,
//   failureCount: 5,
//   agents: { ... }
// }
```

### `formatAsText()`

Format as readable text:
```javascript
const text = agentLogger.formatAsText();
console.log(text);
// ════════════════════════════════════════
// AGENT REQUEST/RESPONSE LOG
// ════════════════════════════════════════
// [1] Agent: manager ...
```

---

## 📊 JSON Format Example

```json
{
  "timestamp": "2024-01-15T14:23:45.123Z",
  "agent": "frontend",
  "request": {
    "plan": {...},
    "iteration": 1,
    "userInput": "create website"
  },
  "response": {
    "summary": "Generated HTML/CSS",
    "patches": [...],
    "success": true
  },
  "metadata": {
    "success": true,
    "duration": 3420,
    "iteration": 1,
    "traceId": "trace-123"
  }
}
```

---

## 💡 Common Patterns

### Pattern 1: Track execution time
```javascript
const start = Date.now();
const result = await agent.run(input);
const duration = Date.now() - start;

await agentLogger.logAgentCall('agent', input, result, { duration });
```

### Pattern 2: Check success rate
```javascript
const summary = agentLogger.getSummary();
const rate = ((summary.successCount / summary.totalRecords) * 100).toFixed(1);
console.log(`Success rate: ${rate}%`);
```

### Pattern 3: Find failures
```javascript
const failures = agentLogger.traces.filter(t => !t.metadata.success);
failures.forEach(t => console.log(`❌ ${t.agent} failed`));
```

### Pattern 4: Analyze by agent
```javascript
const summary = agentLogger.getSummary();
for (const [agent, stats] of Object.entries(summary.agents)) {
  console.log(`${agent}: ${stats.calls} calls, ${((stats.success/stats.calls)*100).toFixed(1)}% success`);
}
```

### Pattern 5: Save and summarize
```javascript
await agentLogger.saveToFile();
const summary = agentLogger.getSummary();
console.log(`📊 Processed: ${summary.totalRecords} requests`);
console.log(`   Success: ${summary.successCount}`);
console.log(`   Failed: ${summary.failureCount}`);
```

---

## 🎨 Image Generation Quick Reference

### Auto-generate images
```javascript
// Happens automatically in workflow!
// Just set OPENAI_API_KEY in .env
```

### Manual image generation
```javascript
const result = await llm.generateImages(
  ['hero.jpg', 'feature1.jpg'],
  'output/MyProject/img'
);
console.log(`Generated: ${result.generated}`);
```

### Configuration
```javascript
// In src/llm/multiLlmConfig.js
IMAGE_GENERATION: {
  provider: 'openai',
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'standard'
}
```

---

## 🔧 Integration Checklist

- [ ] Import logger: `import SimpleAgentLogger from './src/util/simpleAgentLogger.js'`
- [ ] Create instance: `const agentLogger = new SimpleAgentLogger()`
- [ ] Log each agent: `await agentLogger.logAgentCall(...)`
- [ ] Save at end: `await agentLogger.saveToFile()`
- [ ] Check logs: `logs/agent-trace-YYYY-MM-DD.json`

---

## 📋 Metadata Options

```javascript
{
  duration: 0,           // Execution time in ms
  iteration: 0,          // Workflow iteration number
  traceId: null,         // Unique trace identifier
  // Add custom fields as needed
}
```

---

## 📖 Full Documentation

See [AGENT_LOGGING_GUIDE.md](./AGENT_LOGGING_GUIDE.md) for complete details and examples.

---

**Version:** 1.0.0  
**Quick Ref Last Updated:** 2024-01-15
