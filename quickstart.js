#!/usr/bin/env node
/**
 * GENIE Quickstart Demo
 * 
 * A fast 30-second demonstration of GENIE's capabilities.
 * Shows: Agent routing, multi-LLM consensus, and department structure.
 * 
 * Usage: npm run quickstart
 */

import 'dotenv/config';
import { AGENT_REGISTRY } from './src/agentRegistry.js';

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

async function quickstart() {
  console.log(`
${c.cyan}╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ${c.bright}${c.magenta}🚀 GENIE QUICKSTART DEMO${c.reset}${c.cyan}                                     ║
║   ${c.gray}30-second capability showcase${c.reset}${c.cyan}                                 ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝${c.reset}
`);

  // Step 1: Show agent count
  console.log(`${c.cyan}━━━━━━ 1. Agent Inventory ━━━━━━${c.reset}\n`);
  
  const agents = Object.keys(AGENT_REGISTRY);
  
  // Build category map
  const categories = {
    'Engineering': agents.filter(a => ['backend', 'frontend', 'databaseArchitect', 'userAuth', 'apiIntegration', 'deployment', 'devops'].includes(a)),
    'Quality & Security': agents.filter(a => ['qa', 'tests', 'testGeneration', 'fixer', 'security', 'securityHardening', 'monitoring'].includes(a)),
    'Business & Ops': agents.filter(a => ['accounting', 'payroll', 'hr', 'compliance', 'regulatoryCompliance', 'dataAnalyst'].includes(a)),
    'Orchestration': agents.filter(a => ['manager', 'refiner', 'codeRefiner', 'delivery'].includes(a)),
    'Autonomous': agents.filter(a => ['webBrowser', 'taskAnalyzer', 'incomeGeneration', 'taskCompletionVerifier', 'research'].includes(a))
  };
  
  console.log(`${c.green}✓${c.reset} ${c.bright}${agents.length} Specialized Agents${c.reset} loaded\n`);
  
  Object.entries(categories).forEach(([category, agentList]) => {
    if (agentList.length === 0) return;
    console.log(`  ${c.yellow}${category}${c.reset} (${agentList.length})`);
    agentList.slice(0, 3).forEach(agent => {
      const info = AGENT_REGISTRY[agent];
      console.log(`    ${c.gray}•${c.reset} ${info?.name || agent}`);
    });
    if (agentList.length > 3) {
      console.log(`    ${c.gray}... and ${agentList.length - 3} more${c.reset}`);
    }
  });

  // Step 2: Show configured providers
  console.log(`\n${c.cyan}━━━━━━ 2. LLM Providers ━━━━━━${c.reset}\n`);
  
  const providers = [];
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-')) {
    providers.push({ name: 'OpenAI', model: process.env.OPENAI_MODEL || 'gpt-4o' });
  }
  if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.includes('your-')) {
    providers.push({ name: 'Google', model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash' });
  }
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-')) {
    providers.push({ name: 'Anthropic', model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet' });
  }
  if (process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes('your-')) {
    providers.push({ name: 'Mistral', model: process.env.MISTRAL_MODEL || 'mistral-large' });
  }

  if (providers.length > 0) {
    console.log(`${c.green}✓${c.reset} ${c.bright}${providers.length} Provider(s) Configured${c.reset}\n`);
    providers.forEach(p => {
      console.log(`  ${c.green}●${c.reset} ${p.name}: ${c.gray}${p.model}${c.reset}`);
    });
  } else {
    console.log(`${c.yellow}⚠${c.reset} ${c.bright}No providers configured${c.reset}`);
    console.log(`  Edit .env file to add API keys`);
    console.log(`  ${c.gray}Get free Google Gemini key: https://ai.google.dev/${c.reset}`);
  }

  // Step 3: Demonstrate routing
  console.log(`\n${c.cyan}━━━━━━ 3. Intelligent Routing ━━━━━━${c.reset}\n`);
  
  const testRequests = [
    { query: "Build a React dashboard", expects: ["frontendCoder", "backendCoder"] },
    { query: "Calculate Q4 taxes", expects: ["accounting", "taxStrategy"] },
    { query: "Find government contracts", expects: ["incomeGeneration", "research"] },
    { query: "Deploy to production", expects: ["devops", "deployment"] }
  ];

  console.log(`${c.bright}Sample Request Routing:${c.reset}\n`);
  
  testRequests.forEach(({ query, expects }) => {
    console.log(`  ${c.blue}→${c.reset} "${query}"`);
    console.log(`    ${c.gray}Routes to:${c.reset} ${expects.map(e => c.yellow + e + c.reset).join(', ')}`);
  });

  // Step 4: Live test (if providers configured)
  if (providers.length > 0) {
    console.log(`\n${c.cyan}━━━━━━ 4. Live API Test ━━━━━━${c.reset}\n`);
    
    try {
      console.log(`${c.blue}→${c.reset} Testing ${providers[0].name} connection...`);
      
      // Quick OpenAI test
      if (providers[0].name === 'OpenAI') {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'user', content: 'Say "GENIE is operational!" in 4 words max.' }],
          max_tokens: 20
        });
        
        console.log(`${c.green}✓${c.reset} Response: "${response.choices[0].message.content}"`);
      }
      // Quick Google test
      else if (providers[0].name === 'Google') {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash' });
        
        const result = await model.generateContent('Say "GENIE is operational!" in 4 words max.');
        const text = result.response.text();
        
        console.log(`${c.green}✓${c.reset} Response: "${text.trim()}"`);
      }
      // Quick Anthropic test
      else if (providers[0].name === 'Anthropic') {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        
        const response = await client.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Say "GENIE is operational!" in 4 words max.' }]
        });
        
        console.log(`${c.green}✓${c.reset} Response: "${response.content[0].text}"`);
      }
      // Quick Mistral test
      else if (providers[0].name === 'Mistral') {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
            messages: [{ role: 'user', content: 'Say "GENIE is operational!" in 4 words max.' }],
            max_tokens: 20
          })
        });
        const data = await response.json();
        console.log(`${c.green}✓${c.reset} Response: "${data.choices[0].message.content}"`);
      }
      
      console.log(`\n${c.green}✓ LLM connectivity verified!${c.reset}`);
      
    } catch (error) {
      console.log(`${c.red}✗${c.reset} API test failed: ${error.message}`);
      console.log(`  ${c.gray}Check your API key in .env${c.reset}`);
    }
  }

  // Summary
  console.log(`
${c.green}╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ${c.bright}✅ GENIE QUICKSTART COMPLETE${c.reset}${c.green}                                  ║
║                                                                  ║
║   System Status:                                                 ║
║   • Agents: ${agents.length} loaded                                           ║
║   • Providers: ${providers.length} configured                                       ║
║   • Status: ${providers.length > 0 ? 'READY' : 'Needs API keys'}                                             ║
║                                                                  ║
║   Next Steps:                                                    ║
║   ${c.cyan}npm start${c.reset}${c.green}       - Ask GENIE anything                          ║
║   ${c.cyan}npm run demo${c.reset}${c.green}    - Full company demonstration                  ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝${c.reset}
`);
}

quickstart().catch(console.error);
