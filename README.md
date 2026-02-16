# Genie

Multi-agent AI orchestration system for software development tasks.

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
