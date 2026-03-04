#!/usr/bin/env node

/**
 * GENIE Enterprise Agents Quick Start
 * 
 * This script demonstrates how to use the three critical-path agents
 * to generate complete enterprise applications.
 */

const { spawn } = require('child_process');

console.log('\n🚀 GENIE Enterprise Agents - Quick Start Demo\n');
console.log('=' .repeat(60));

const examples = [
  {
    title: '1️⃣  DATABASE DESIGN',
    command: 'npm start -- "Design database for an e-commerce platform with users, products, orders, reviews, and inventory tracking. Use PostgreSQL with proper indexes and relationships."',
    description: 'Generates: Prisma schema, SQL DDL, TypeScript types, migrations'
  },
  {
    title: '2️⃣  AUTHENTICATION SYSTEM',
    command: 'npm start -- "Generate complete authentication system with JWT tokens, email verification, password reset, account lockout after failed attempts, and role-based access control with admin and user roles."',
    description: 'Generates: Auth routes, middleware, utilities, email service, RBAC'
  },
  {
    title: '3️⃣  API INTEGRATION CLIENT',
    command: 'npm start -- "Create React API client with TypeScript hooks for products, orders, users, and reviews. Include automatic token refresh, error handling, and react-query integration."',
    description: 'Generates: API client, React hooks, types, error handling, mock server'
  },
  {
    title: '🌟 COMPLETE STACK',
    command: 'npm start -- "Build complete SaaS: database with users/teams/projects/tasks, JWT authentication with email verification, password reset, role-based access, React frontend with hooks, types, and error handling."',
    description: 'Generates: All three critical-path agents produce complete stack'
  }
];

console.log('\nAVAILABLE EXAMPLES:\n');

examples.forEach((example, idx) => {
  console.log(`${example.title}`);
  console.log(`Description: ${example.description}`);
  console.log(`\nRun: ${example.command}\n`);
  if (idx < examples.length - 1) console.log('-'.repeat(60));
});

console.log('\n' + '='.repeat(60));
console.log('\nQUICK COMMANDS:\n');

console.log('👉 Try the complete stack example:');
console.log('npm start -- "Build SaaS with database, users, teams, projects, tasks, JWT auth, email verification, and React frontend integration"');

console.log('\n👉 Or design just a database:');
console.log('npm start -- "design database for blog with posts comments and users"');

console.log('\n👉 Or add just authentication:');
console.log('npm start -- "add JWT authentication with email verification"');

console.log('\n' + '='.repeat(60));
console.log('\nAGENT INFORMATION:\n');

console.log('📊 DatabaseArchitectAgent');
console.log('   Entry: agents.databaseArchitect');
console.log('   Method: designSchema(request)');
console.log('   Output: Prisma schema, SQL DDL, types, migrations\n');

console.log('🔐 UserAuthAgent');
console.log('   Entry: agents.userAuth');
console.log('   Method: generateAuthSystem(request)');
console.log('   Output: Auth routes, middleware, email service, RBAC\n');

console.log('🔗 ApiIntegrationAgent');
console.log('   Entry: agents.apiIntegration');
console.log('   Method: generateApiClient(request)');
console.log('   Output: React hooks, types, API client, error handling\n');

console.log('='.repeat(60));
console.log('\nDOCUMENTATION:\n');
console.log('📖 Read: ENTERPRISE_AGENTS_GUIDE.md');
console.log('   Complete documentation for all three agents');
console.log('   Examples, API reference, and usage patterns\n');

console.log('📖 Read: IMPLEMENTATION_COMPLETE.md');
console.log('   Overview of what was implemented');
console.log('   System architecture and capabilities\n');

console.log('📖 Read: ENTERPRISE_ROADMAP.md');
console.log('   Long-term vision and additional agents planned\n');

console.log('='.repeat(60));
console.log('\n✅ System Status: OPERATIONAL');
console.log('✅ Critical Path: Database → Auth → API Integration');
console.log('✅ Multi-LLM Consensus: Enabled (OpenAI, Anthropic, Groq, etc)');
console.log('\n🎯 Ready to generate enterprise applications!\n');
