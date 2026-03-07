/**
 * Example: Using Agent Logging in GENIE
 * 
 * This demonstrates how to capture and log agent requests/responses
 * for debugging, analysis, and audit purposes.
 */

import SimpleAgentLogger from './src/util/simpleAgentLogger.js';
import { logger as mainLogger } from './src/util/logger.js';

// Initialize the agent logger
const agentLogger = new SimpleAgentLogger(mainLogger);

// Example: Simulate agent calls
async function demonstrateLogging() {
  console.log("\n🔍 DEMONSTRATING AGENT LOGGING SYSTEM\n");

  // Simulate Agent 1: Manager making a plan
  console.log("📋 Simulating Manager Agent...");
  await agentLogger.logAgentCall(
    'manager',
    {
      userInput: 'create a premium gelato shop website called TallahasseeGelato',
      iteration: 1,
      traceId: 'trace-123'
    },
    {
      kind: 'web',
      consensusLevel: 'single',
      workItems: [
        { owner: 'frontend', task: 'Create responsive HTML/CSS website' },
        { owner: 'writer', task: 'Write company description and product info' }
      ],
      summary: 'Created workflow plan for website project'
    },
    { duration: 1250, iteration: 1, traceId: 'trace-123' }
  );

  // Simulate Agent 2: Frontend creating HTML
  console.log("🎨 Simulating Frontend Agent...");
  await agentLogger.logAgentCall(
    'frontend',
    {
      plan: { kind: 'web', workItems: [] },
      iteration: 1,
      userInput: 'create a premium gelato shop website called TallahasseeGelato'
    },
    {
      summary: 'Generated responsive HTML website with sticky navigation, hero section, product grid, and contact form',
      patches: [
        { 
          file: 'index.html',
          type: 'create',
          status: 'success'
        },
        { 
          file: 'style.css',
          type: 'create',
          status: 'success'
        }
      ],
      filesCreated: ['index.html', 'style.css']
    },
    { duration: 3420, iteration: 1, traceId: 'trace-123' }
  );

  // Simulate Agent 3: Writer creating content
  console.log("✍️  Simulating Writer Agent...");
  await agentLogger.logAgentCall(
    'writer',
    {
      plan: { kind: 'web', workItems: [] },
      iteration: 1,
      userInput: 'create a premium gelato shop website called TallahasseeGelato'
    },
    {
      summary: 'Generated company content including heritage story, product descriptions for 8 gelato flavors, location information',
      content: 'Founded in 1982 by the Heinrichs family...',
      filesCreated: []
    },
    { duration: 890, iteration: 1, traceId: 'trace-123' }
  );

  // Simulate Agent 4: Image generation
  console.log("🎨 Simulating Image Generator Agent...");
  await agentLogger.logAgentCall(
    'imageGenerator',
    {
      images: [
        'hero-gelato-shop.jpg',
        'chocolate-hazelnut.jpg',
        'strawberry-basil.jpg'
      ],
      outputDir: 'output/TallahasseeGelato_Build/img',
      count: 3
    },
    {
      summary: 'Generated 3 professional DALL-E images and embedded them into HTML',
      generated: 3,
      embedded: 3,
      totalSize: '3.2MB',
      success: true
    },
    { duration: 8500, iteration: 1, traceId: 'trace-123' }
  );

  // Simulate Agent 5: QA review
  console.log("✅ Simulating QA Agent...");
  await agentLogger.logAgentCall(
    'qa',
    {
      userInput: 'create a premium gelato shop website called TallahasseeGelato',
      iteration: 1,
      patches: []
    },
    {
      summary: 'Reviewed website quality - all images present, responsive design verified, forms functional',
      checksPassed: 8,
      checksFailed: 0,
      issues: [],
      approved: true
    },
    { duration: 2100, iteration: 1, traceId: 'trace-123' }
  );

  // Now save all logs and display summary
  console.log("\n📊 SAVING LOGS...");
  const result = await agentLogger.saveToFile();
  console.log(`✅ Logs saved to: ${result.filename}`);
  console.log(`   Total traces: ${result.tracesCount}`);
  console.log(`   New traces: ${result.newTraces}\n`);

  // Display summary
  console.log("📈 SUMMARY STATISTICS:");
  const summary = agentLogger.getSummary();
  console.log(`Total records: ${summary.totalRecords}`);
  console.log(`Unique agents: ${summary.uniqueAgents.join(', ')}`);
  console.log(`Success count: ${summary.successCount}`);
  console.log(`Failure count: ${summary.failureCount}`);
  
  console.log("\nAgent breakdown:");
  for (const [agent, stats] of Object.entries(summary.agents)) {
    const rate = ((stats.success / stats.calls) * 100).toFixed(1);
    console.log(`  ${agent}: ${stats.calls} calls, ${rate}% success`);
  }

  // Display formatted text output
  console.log("\n📄 FORMATTED LOG OUTPUT:");
  console.log(agentLogger.formatAsText());

  console.log("\n✨ Logging demonstration complete!");
  console.log("\n📍 Check the following files:");
  console.log(`   - logs/agent-trace-YYYY-MM-DD.json (structured logs)`);
  console.log(`   - logs/agent-YYYY-MM-DD.log (detailed logs)\n`);
}

// Run the demonstration
demonstrateLogging().catch(console.error);
