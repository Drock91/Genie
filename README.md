# Genie - AI-Powered Development Agent System

**Genie** is an intelligent, multi-agent AI orchestration system that acts as your autonomous software development team. Like summoning a genie to grant your wishes, Genie transforms your natural language requests into working software solutions.

## What is Genie?

Genie is a production-ready AI agent framework that orchestrates specialized AI agents to handle complete software development workflows. Instead of manually writing code, configuring systems, or managing tasks, you simply tell Genie what you want to build, and it coordinates a team of expert AI agents to:

- **Plan and architect** your application
- **Write backend and frontend code** 
- **Create documentation**
- **Review security** concerns
- **Run quality assurance** checks
- **Execute tests** and validation
- **Fix issues** automatically

Think of Genie as having an entire development team at your fingertips, available instantly through natural language commands.

### Key Concept

The "Genie" metaphor represents the system's ability to:
1. **Understand your wishes** (natural language requests)
2. **Grant them intelligently** (autonomous execution with specialized agents)
3. **Deliver results** (production-ready code and documentation)

## Features

- **Multi-agent architecture**: Specialized agents for planning, backend, frontend, security, QA, testing, and fixes
- **Iterative workflow**: Automatic iteration with validation gates and self-healing
- **Production-ready**: Error handling, retries, structured logging, timeout protection
- **Comprehensive logging**: File-based JSON logging with daily rotation

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your OpenAI API key
```

## Usage

```bash
npm start -- "your request here"
```

Examples:
```bash
npm start -- "build me a todo list API in Node.js with Express"
npm start -- "write documentation for authentication flows"
```

## Development

```bash
npm run dev          # Watch mode
npm run test         # Run tests
npm run lint         # Lint code
npm run logs         # View logs
npm start            # Run once
```

## Environment Variables

```
OPENAI_API_KEY       - Required. Your OpenAI API key
OPENAI_MODEL         - Model to use (default: gpt-4-turbo)
OPENAI_TEMPERATURE   - Temperature for generation (default: 0.2)
MAX_ITERATIONS       - Max workflow iterations (default: 5)
RETRY_ATTEMPTS       - Retry failed LLM calls (default: 3)
REQUEST_TIMEOUT      - Request timeout in ms (default: 60000)
NODE_ENV             - Set to 'production' for production deployments
```

## Architecture

- **ManagerAgent**: Plans work and merges outputs
- **BackendCoderAgent**: Implements backend code
- **FrontendCoderAgent**: Implements frontend code  
- **WriterAgent**: Creates documentation
- **SecurityManagerAgent**: Security review
- **QAManagerAgent**: Quality assurance
- **TestRunnerAgent**: Runs tests
- **FixerAgent**: Generates fixes for issues

## Logging

All logs are written to `logs/agent-YYYY-MM-DD.log` in JSON format with full traceability.

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Monitor logs in the `logs/` directory
4. Implement CI/CD pipeline with proper secret management
