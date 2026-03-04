# GENIE Agent Logging & Image Generation Guide

## 📋 Overview

This document explains two major features added to GENIE v1.0:

1. **Automatic Image Generation** - DALL-E 3 integration for auto-generating website images
2. **Agent Request/Response Logging** - Tracking all agent inputs and outputs

---

## 🎨 Part 1: Automatic Image Generation

### What It Does

When GENIE generates a website, it now:

1. **Analyzes HTML** for all `<img>` tags with `src` attributes
2. **Detects missing image files** in the output directory
3. **Generates intelligent DALL-E prompts** based on filename context
4. **Creates professional 1024x1024 images** automatically
5. **Embeds image URLs** back into the HTML

### Architecture

**Main Components:**

```
src/agents/imageGeneratorAgent.js
└─ Handles DALL-E 3 API calls
   ├─ generateImages() - Main entry point
   ├─ _downloadImage() - Downloads generated image
   └─ Rate limiting (1sec between requests)

src/util/htmlImageEmbedder.js
└─ Detects & embeds images
   ├─ detectMissingImages() - Scans HTML file
   ├─ _generateImagePrompt() - Creates DALL-E prompts
   └─ generateMissingImagesAndEmbed() - Full pipeline

src/workflow.js
└─ Integration point
   ├─ Phase: After files written
   ├─ Auto-detects HTML with images
   └─ Calls image generation non-blocking

src/llm/multiLlmSystem.js
└─ Top-level API
   └─ generateImages(images, outputDir)
```

### Usage Example

**Request:**
```
Create a premium gelato shop website called TallahasseeGelato
```

**Automatic Result:**
```
✨ Detected 9 missing images in HTML
🎨 Generating with DALL-E 3...
   ✅ hero-gelato-shop.jpg (1.2MB)
   ✅ chocolate-hazelnut.jpg (781KB)
   ✅ strawberry-basil.jpg (976KB)
   ... [6 more images]
⚡ Embedded into HTML
✅ Complete!
```

### Configuration

**Environment:**
```bash
# Required in .env
OPENAI_API_KEY=sk-...

# Optional (defaults shown):
OPENAI_MODEL=gpt-4o
```

**System Settings** (`src/llm/multiLlmConfig.js`):
```javascript
IMAGE_GENERATION: {
  provider: 'openai',
  model: 'dall-e-3',
  size: '1024x1024',          // Image resolution
  quality: 'standard',        // 'standard' or 'hd'
  style: 'natural'            // 'natural' or 'vivid'
}
```

### Smart Prompt Generation

Filenames are converted to intelligent DALL-E prompts:

| Filename | Generated Prompt |
|----------|------------------|
| `hero-gelato-shop.jpg` | "An inviting Italian gelato shop storefront with bright lighting, premium display cases with colorful gelato, welcoming atmosphere" |
| `chocolate-hazelnut.jpg` | "A beautiful, vibrant photo of rich chocolate hazelnut gelato in a cone, Italian style, natural lighting, appetizing presentation" |
| `strawberry-basil.jpg` | "Artisanal strawberry basil gelato with fresh herbs, professional food photography, creamy texture, gourmet gelato presentation" |

### Accessing Generated Images

Generated images are saved to:
```
output/[ProjectName]/img/
├── hero-gelato-shop.jpg
├── chocolate-hazelnut.jpg
├── strawberry-basil.jpg
└── ... (other images)
```

All are automatically embedded in the HTML:
```html
<img src="img/chocolate-hazelnut.jpg" alt="Gelato flavor">
```

### Error Handling

If image generation fails:
- **Non-blocking**: Workflow continues without images
- **Logged**: All errors recorded in `logs/agent-YYYY-MM-DD.log`
- **Fallback**: HTML still works with broken image placeholders
- **Retry**: Can re-run image generation manually

### Manual Image Generation

If you want to generate images separately:

```javascript
import { initializeMultiLlm } from './src/llm/multiLlmSystem.js';

const llm = await initializeMultiLlm(logger);
const result = await llm.generateImages(
  [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg'
  ],
  'output/MyProject/img'
);

console.log(`Generated: ${result.generated}`);
console.log(`Embedded: ${result.embedded}`);
```

---

## 📊 Part 2: Agent Request/Response Logging

### What It Does

Every agent call is logged with:
- **Who** - Which agent processed the request
- **What** - Input request and output response
- **When** - Timestamp and duration
- **Status** - Success/failure indicator

### Quick Start

**1. Initialize logger:**
```javascript
import SimpleAgentLogger from './src/util/simpleAgentLogger.js';

const agentLogger = new SimpleAgentLogger();
```

**2. Log agent calls:**
```javascript
// During agent execution
await agentLogger.logAgentCall(
  'backend',                    // Agent name
  { userInput: '...' },         // Input request
  { summary: '...' },           // Output response
  { duration: 2450 }            // Metadata
);
```

**3. Save logs:**
```javascript
await agentLogger.saveToFile();
// Saves to: logs/agent-trace-YYYY-MM-DD.json
```

### API Reference

#### `SimpleAgentLogger`

**Constructor:**
```javascript
new SimpleAgentLogger(logger = null)
```

**Methods:**

##### `logAgentCall(agentName, request, response, metadata = {})`
Log a single agent execution.

```javascript
await agentLogger.logAgentCall(
  'frontend',
  { 
    plan: {...},
    iteration: 1,
    userInput: 'create website'
  },
  {
    summary: 'Generated HTML/CSS...',
    patches: [...],
    success: true
  },
  {
    duration: 3420,
    iteration: 1,
    traceId: 'abc-123'
  }
);
```

**Parameters:**
- `agentName` (string): Name of the agent
- `request` (any): Input data/request
- `response` (any): Output/response from agent
- `metadata` (object): Additional info
  - `duration` (number): Execution time in ms
  - `iteration` (number): Workflow iteration
  - `traceId` (string): Unique trace ID

**Returns:** Trace object

---

##### `saveToFile()`
Save all collected traces to JSON file.

```javascript
const result = await agentLogger.saveToFile();
console.log(result);
// { success: true, filename: '...', tracesCount: 45, newTraces: 5 }
```

**Returns:**
```javascript
{
  success: boolean,
  filename: string,
  tracesCount: number,  // Total traces in file
  newTraces: number      // Traces just added
}
```

**Saved to:** `logs/agent-trace-YYYY-MM-DD.json`

---

##### `getSummary()`
Get statistics about logged agents.

```javascript
const summary = agentLogger.getSummary();
console.log(summary);
```

**Returns:**
```javascript
{
  totalRecords: 45,
  uniqueAgents: ['manager', 'frontend', 'backend', 'qa'],
  successCount: 40,
  failureCount: 5,
  agents: {
    manager: { calls: 10, success: 10, failed: 0 },
    frontend: { calls: 12, success: 10, failed: 2 },
    backend: { calls: 15, success: 13, failed: 2 },
    qa: { calls: 8, success: 7, failed: 1 }
  }
}
```

---

##### `formatAsText()`
Format all logs as human-readable text.

```javascript
const textOutput = agentLogger.formatAsText();
console.log(textOutput);
```

**Output example:**
```
════════════════════════════════════════════════════════════════════════════════════════════════════
AGENT REQUEST/RESPONSE LOG
════════════════════════════════════════════════════════════════════════════════════════════════════
Generated: 2024-01-15T14:23:45.123Z
Total Records: 12

[1] ───────────────────────────────────────────────────────────────
TIME: 2024-01-15T14:23:45.123Z
AGENT: manager
STATUS: ✅ SUCCESS
───────────────────────────────────────────────────────────────

INPUT REQUEST:
{"userInput":"create premium gelato shop website","iteration":1}

OUTPUT RESPONSE:
{"kind":"web","consensusLevel":"single","workItems":[...]}

DURATION: 1250ms
```

### Log File Format

**Location:** `logs/agent-trace-YYYY-MM-DD.json`

**Structure:**
```json
[
  {
    "timestamp": "2024-01-15T14:23:45.123Z",
    "agent": "manager",
    "request": {
      "userInput": "create premium gelato shop website",
      "iteration": 1,
      "traceId": "trace-123"
    },
    "response": {
      "kind": "web",
      "consensusLevel": "single",
      "workItems": [
        {"owner": "frontend", "task": "Create UI"},
        {"owner": "writer", "task": "Write content"}
      ],
      "summary": "Created workflow plan"
    },
    "metadata": {
      "success": true,
      "duration": 1250,
      "iteration": 1,
      "traceId": "trace-123"
    }
  },
  ...
]
```

### Usage Examples

**Example 1: Track agent performance**
```javascript
const summary = agentLogger.getSummary();

for (const [agent, stats] of Object.entries(summary.agents)) {
  const rate = ((stats.success / stats.calls) * 100).toFixed(1);
  console.log(`${agent}: ${stats.calls} calls, ${rate}% success rate`);
}

// Output:
// manager: 10 calls, 100% success rate
// frontend: 12 calls, 83.3% success rate
// backend: 15 calls, 86.7% success rate
// qa: 8 calls, 87.5% success rate
```

**Example 2: Analyze execution times**
```javascript
const summary = agentLogger.getSummary();

for (const trace of agentLogger.traces) {
  console.log(`${trace.agent}: ${trace.metadata.duration}ms`);
}

// Output:
// manager: 1250ms
// frontend: 3420ms
// backend: 4150ms
// qa: 2100ms
```

**Example 3: Find failed agents**
```javascript
const failedTraces = agentLogger.traces.filter(t => !t.metadata.success);

failedTraces.forEach(trace => {
  console.log(`❌ ${trace.agent} FAILED on iteration ${trace.metadata.iteration}`);
  console.log(`   Request: ${JSON.stringify(trace.request)}`);
  console.log(`   Error: ${trace.response.error || 'Unknown'}`);
});
```

**Example 4: Generate audit report**
```javascript
const summary = agentLogger.getSummary();
const textLog = agentLogger.formatAsText();

// Save audit report
await fs.writeFile('audit-report.txt', textLog);

console.log(`Audit report saved!`);
console.log(`Total requests processed: ${summary.totalRecords}`);
console.log(`Success rate: ${((summary.successCount / summary.totalRecords) * 100).toFixed(1)}%`);
```

### Running the Demo

See agent logging in action:

```bash
node example-agent-logging.js
```

This demonstrates:
1. Creating a logger
2. Logging multiple agent calls
3. Saving to file
4. Displaying statistics
5. Formatting as readable text

---

## 🔧 Integration with Workflow

To add logging to the workflow:

```javascript
import SimpleAgentLogger from './src/util/simpleAgentLogger.js';

const agentLogger = new SimpleAgentLogger(logger);

// Before agent execution
const startTime = Date.now();

// Execute agent
const result = await agents.backend.build({...});

// After execution
const duration = Date.now() - startTime;

await agentLogger.logAgentCall(
  'backend',
  { plan, iteration, userInput },
  result,
  { duration, iteration, traceId }
);

// At end of workflow
await agentLogger.saveToFile();
```

---

## 📚 File Reference

### Core Files

| File | Purpose |
|------|---------|
| `src/util/simpleAgentLogger.js` | Agent logging API |
| `src/agents/imageGeneratorAgent.js` | DALL-E image generation |
| `src/util/htmlImageEmbedder.js` | Image detection & embedding |
| `src/workflow.js` | Workflow integration (both features) |
| `example-agent-logging.js` | Demo script |

### Configuration

| File | Purpose |
|------|---------|
| `.env` | API keys & settings |
| `src/llm/multiLlmConfig.js` | LLM provider config |

### Output

| Location | Purpose |
|----------|---------|
| `logs/agent-trace-YYYY-MM-DD.json` | Agent request/response pairs |
| `output/[Project]/img/` | Generated images |

---

## 🐛 Troubleshooting

### Images not generating

1. **Check OPENAI_API_KEY** is set in `.env`
2. **Verify API quota** - DALL-E calls cost credits
3. **Check logs** for error details: `logs/agent-YYYY-MM-DD.log`
4. **Try manually:**
   ```javascript
   const result = await llm.generateImages(['test.jpg'], 'output/test/img');
   console.log(result);
   ```

### Logging not working

1. **Check logs directory** exists: `mkdir -p logs`
2. **Verify write permissions** in logs folder
3. **Check for errors:** `logs/agent-YYYY-MM-DD.log`
4. **Ensure saveToFile() called:**
   ```javascript
   await agentLogger.saveToFile();
   ```

### High API costs

1. **Image generation is expensive** ($0.04-0.10 per image)
2. **Consider disabling** for development
3. **Monitor** `logs/agent-trace-*.json` for costs
4. **Batch requests** to reduce overheads

---

## 📈 Best Practices

1. **Always save logs** at end of workflow:
   ```javascript
   await agentLogger.saveToFile();
   ```

2. **Log agent calls** before/after execution:
   ```javascript
   const start = Date.now();
   const result = await agent.run();
   await agentLogger.logAgentCall(
     agentName,
     input,
     result,
     { duration: Date.now() - start }
   );
   ```

3. **Check summary** for agent health:
   ```javascript
   const summary = agentLogger.getSummary();
   if (summary.failureCount > 0) console.warn('⚠️ Some agents failed');
   ```

4. **Handle image generation gracefully:**
   ```javascript
   try {
     const result = await llm.generateImages(images, dir);
   } catch (err) {
     logger.warn('Image generation failed, continuing without images');
   }
   ```

5. **Archive old logs:**
   ```bash
   # Keep logs from last 7 days only
   find logs -name "agent-trace-*.json" -mtime +7 -delete
   ```

---

## 🔗 See Also

- [README.md](./README.md) - Main documentation
- [ARCHITECTURE_EXPERT_NETWORK.md](./ARCHITECTURE_EXPERT_NETWORK.md) - System architecture
- [MULTI_LLM_README.md](./MULTI_LLM_README.md) - LLM configuration
- [example-agent-logging.js](./example-agent-logging.js) - Working demo

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Author:** GENIE Development Team
