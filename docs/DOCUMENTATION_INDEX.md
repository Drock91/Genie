# 📚 GENIE Documentation Master Index

**Complete guide to all GENIE documentation organized by topic.**

---

## 🚀 Start Here

**New to GENIE?** Start with these files in order:

1. **[README.md](../README.md)** - Project overview and quick start
2. **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Fast lookup and common tasks
3. **[GENIE_ARCHITECTURE.md](../GENIE_ARCHITECTURE.md)** - System architecture overview

---

## 📖 Core Documentation

### System Architecture & Design
| Document | Purpose |
|----------|---------|
| [GENIE_ARCHITECTURE.md](../GENIE_ARCHITECTURE.md) | Complete system architecture with diagrams |
| [README.md](../README.md) | Project overview and getting started |
| [guides/READme.md](../guides/README.md) | **NEW** - Complete guides navigation |

### Agent & Feature Documentation
| Document | Purpose |
|----------|---------|
| [guides/HOW_AGENTS_WORK.md](../guides/HOW_AGENTS_WORK.md) | How the agent system works |
| [guides/README_AGENTS.md](../guides/README_AGENTS.md) | Agent system overview |
| [src/agents/AGENT_TEMPLATE.js](../src/agents/AGENT_TEMPLATE.js) | How to create new agents |
| [src/agentRegistry.js](../src/agentRegistry.js) | All 35 agents documented |

### Configuration & Setup
| Document | Purpose |
|----------|---------|
| [.env.example](../../.env.example) | Environment variables guide |
| [package.json](../../package.json) | Dependencies and scripts |
| [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) | All configuration options |

---

## 🔐 Security Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[SECURITY_GUIDE.md](../SECURITY_GUIDE.md)** | Comprehensive security framework | Everyone |
| **[SECURITY_IMPLEMENTATION.md](../SECURITY_IMPLEMENTATION.md)** | How to integrate security | Developers |
| **[SECURITY_VISUAL_GUIDE.md](../SECURITY_VISUAL_GUIDE.md)** | Visual security architecture | Teams |
| **[securityScanner.js](../../src/security/securityScanner.js)** | Security scanner implementation | Developers |

### Key Security Topics
- 🛡️ 6-layer security model
- 🔍 Malware pattern detection
- ✅ Code integrity verification
- 📦 Dependency vulnerability checking
- 📡 Runtime behavior monitoring

---

## 🧪 Testing & Development

| Document | Purpose |
|----------|---------|
| **Tests Folder**: `tests/` | Unit tests and demos |
| **[executionContext.test.js](../../src/util/executionContext.test.js)** | Example unit tests (27 passing) |
| **[verify-genie-system.js](../verify-genie-system.js)** | System verification script |

### Running Tests
```bash
npm test                    # Run all tests
npm run verify             # Verify system health
node verify-genie-system.js # Check project status
```

---

## 📊 Utility Modules

Located in `src/util/`:

| Module | Purpose |
|--------|---------|
| **config.js** | Configuration management |
| **logger.js** | Logging system |
| **executionContext.js** | Execution context manager (replaces globals) |
| **performanceMetrics.js** | Performance tracking |
| **inputParser.js** | User input parsing |
| **argumentParser.js** | CLI argument handling |
| **configValidator.js** | Configuration validation |
| **costOptimization.js** | Cost optimization engine |

---

## 🔧 Workflow & Orchestration

Located in `src/workflow/`:

| Module | Purpose |
|--------|---------|
| **workflow.js** | Main workflow orchestration |
| **refinementWorkflow.js** | Code refinement module |
| **iterationManager.js** | Iteration loop management |
| **reportingEngine.js** | Result reporting and exports |

---

## 🤖 Multi-LLM System

Located in `src/llm/`:

| File | Purpose |
|------|---------|
| **multiLlmSystem.js** | Main OLM orchestrator |
| **multiLlmConfig.js** | Provider configuration |
| **consensusEngine.js** | Consensus voting logic |
| **openaiClient.js** | OpenAI integration |
| **providers/** | Provider adapters |

---

## 📁 Repository Management

Located in `src/repo/`:

| File | Purpose |
|------|---------|
| **patchExecutor.js** | File patching and execution |
| **requestStore.js** | Request caching and storage |
| **projectGenerator.js** | Project generation |
| **templateRegistry.js** | Template management |
| **contextBuilder.js** | Context for generation |

---

## 🏢 Compliance & Regulatory

Located in `src/compliance/`:

| File | Purpose |
|------|---------|
| **regulatoryKnowledgeBase.js** | Regulatory rules engine |
| **taxRegulations.js** | Tax-specific regulations |

---

## 📚 Archive & Historical Documents

These are old documents kept for reference. Generally superseded by current docs:

**Archived in**: `/archive/` (if created)

- Old audit reports
- Previous cleanup summaries
- Deprecated guides
- Historical implementation notes

---

## 🎯 Quick Navigation by Audience

### For New Users
1. README.md
2. QUICK_REFERENCE.md
3. Try: `npm start "simple request"`

### For Developers
1. GENIE_ARCHITECTURE.md
2. [guides/HOW_AGENTS_WORK.md](../guides/HOW_AGENTS_WORK.md)
3. [guides/README.md](../guides/README.md) - Browse agent guides

### For DevOps/Operations
1. GENIE_ARCHITECTURE.md (#deployment section)
2. [guides/DEPLOYMENT_AGENT_GUIDE.md](../guides/DEPLOYMENT_AGENT_GUIDE.md)
3. verify-genie-system.js
4. package.json scripts

### For Security Teams
1. SECURITY_GUIDE.md
2. SECURITY_VISUAL_GUIDE.md
3. [guides/SECURITY_AND_MONITORING_GUIDE.md](../guides/SECURITY_AND_MONITORING_GUIDE.md)
4. src/security/ folder

### For Contributors
1. PROJECT_CLEANUP_SUMMARY.md
2. [guides/README.md](../guides/README.md)
3. src/agentRegistry.js
4. Test examples in tests/

---

## 📋 Common Tasks Lookup

### "How do I...?"

**...get started?**
→ README.md + QUICK_REFERENCE.md

**...create a custom agent?**
→ AGENT_TEMPLATE.js + GENIE_ARCHITECTURE.md

**...set up security?**
→ SECURITY_IMPLEMENTATION.md

**...configure the system?**
→ .env.example + QUICK_REFERENCE.md

**...troubleshoot issues?**
→ QUICK_REFERENCE.md (Troubleshooting section)

**...check if code is safe?**
→ SECURITY_GUIDE.md + run `npm run security-scan`

**...deploy to production?**
→ SECURITY_IMPLEMENTATION.md + GENIE_ARCHITECTURE.md

**...understand the architecture?**
→ GENIE_ARCHITECTURE.md + agentRegistry.js

**...run tests?**
→ npm test + tests/ folder

**...optimize performance?**
→ src/util/performanceMetrics.js + QUICK_REFERENCE.md

---

## 📊 Documentation Statistics

- **Core Files**: 3 (README, Architecture, Quick Reference)
- **Security Docs**: 4 (Guide, Implementation, Visual Guide + code)
- **Source Files**: 40+ well-documented modules
- **Agent Files**: 20 core agents + examples
- **Test Coverage**: 27+ unit tests
- **Total Documentation**: 5,000+ lines providing comprehensive coverage

---

## 🔗 File Organization

```
GENIE/
├── README.md                          ← START HERE
├── QUICK_REFERENCE.md                ← Fast lookup
├── GENIE_ARCHITECTURE.md              ← System design
├── SECURITY_GUIDE.md                  ← Security overview
├── SECURITY_IMPLEMENTATION.md         ← Integration guide
├── SECURITY_VISUAL_GUIDE.md           ← Visual reference
├── PROJECT_CLEANUP_SUMMARY.md         ← Project standards
├── docs/                              ← Core documentation
│   ├── DOCUMENTATION_INDEX.md         ← This file (master index)
│   ├── QUICKSTART.md                  ← Quick start guide
│   ├── QUICK_REFERENCE.md             ← Configuration reference
│   └── FILE_STRUCTURE.md              ← File organization
├── guides/                            ← How-to & Agent Guides
│   ├── RESOURCES_INDEX.md             ← Guide navigation index
│   ├── HOW_AGENTS_WORK.md             ← Agent fundamentals
│   ├── AGENT_LOGGING_GUIDE.md         ← Logging setup
│   ├── DEPLOYMENT_AGENT_GUIDE.md      ← Deployment guide
│   ├── SECURITY_AND_MONITORING_GUIDE.md
│   ├── REGULATORY_COMPLIANCE_GUIDE.md
│   └── architecture/                  ← Technical Implementation
│       ├── ARCHITECTURE_EXPERT_NETWORK.md
│       ├── DATABASE_ARCHITECT_IMPLEMENTATION.md
│       ├── USER_AUTH_IMPLEMENTATION.md
│       └── MULTI_LLM_QUICK_REFERENCE.md
├── src/
│   ├── agentRegistry.js               ← Agent catalog
│   ├── agents/
│   │   ├── AGENT_TEMPLATE.js          ← How to create agents
│   │   ├── baseAgent.js               ← Base implementation
│   │   └── ... (35 agents)
│   ├── security/
│   │   ├── securityScanner.js         ← Malware detection
│   │   └── securityOrchestrator.js
│   ├── util/                          ← Utilities
│   ├── workflow/                      ← Orchestration
│   └── ... (other modules)
├── tests/
│   ├── test-agents.js
│   ├── test-complete-system.js
│   └── demos/
├── archive/                           ← Historical documentation
├── verify-genie-system.js             ← Verification script
└── package.json                       ← Scripts & deps
```

---

## ✅ Using This Index

1. **Lost?** Use the "Quick Navigation by Audience" section
2. **Need help?** Use the "Common Tasks Lookup" section
3. **Want to learn?** Follow the "Start Here" recommendations
4. **Building features?** Check relevant sections for your task
5. **Reading code?** Find the file in the organization chart

---

## 🚀 Running Common Commands

```bash
# First time setup
npm install                           # Install dependencies
cp .env.example .env                 # Configure
npm start "simple request"           # Try it

# Development
npm run dev                          # Development mode
npm test                             # Run tests
npm run verify                       # Verify system

# Security
npm run security-scan                # Scan for threats
npm audit                            # Check dependencies

# Verification
node verify-genie-system.js          # Full system check
```

---

## 📞 Documentation Maintenance

This index is maintained to keep documentation organized and current.

**When adding new documentation:**
1. Choose the appropriate category
2. Add entry to this index
3. Keep descriptions brief and actionable
4. Link to the document

**When archiving old docs:**
1. Move to `/archive/` folder
2. Update this index
3. Keep for historical reference

---

**Last Updated**: February 19, 2026  
**Status**: ✅ Complete & Current

