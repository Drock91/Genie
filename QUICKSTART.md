# GENIE Quick Start Guide

**Get GENIE running in under 2 minutes.**

---

## ⚡ One-Line Setup

```bash
git clone https://github.com/Drock91/Genie.git && cd Genie && npm run setup
```

The setup wizard will guide you through everything.

---

## 📋 Manual Setup (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Add API Keys

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add at least ONE API key:

| Provider | Get Key | Free Tier? |
|----------|---------|------------|
| **Google Gemini** | [ai.google.dev](https://ai.google.dev/) | ✅ Yes |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/) | ❌ Paid |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | ❌ Paid |
| **Mistral** | [console.mistral.ai](https://console.mistral.ai/) | ✅ Limited |

**Minimum `.env` file:**
```env
# Just need one provider to start
GOOGLE_API_KEY=your-google-gemini-key
GOOGLE_MODEL=gemini-2.0-flash
```

### Step 3: Verify Installation
```bash
npm run verify
```

---

## 🚀 Run GENIE

### Quick Test (30 seconds)
```bash
npm run quickstart
```

### Interactive Mode (Ask Anything)
```bash
npm start
```

### Full Company Demo
```bash
npm run demo
```

---

## 💡 Example Prompts

Once running, try these:

| Category | Example Prompt |
|----------|----------------|
| **Code** | "Build a REST API for user authentication" |
| **Business** | "Create a marketing strategy for a SaaS product" |
| **Research** | "Find federal contracts for software development" |
| **Finance** | "Calculate tax deductions for my LLC" |
| **Analysis** | "Analyze competitors in the AI agent space" |

---

## 🔧 Troubleshooting

### "No providers configured"
→ Add an API key to your `.env` file

### "npm install failed"
→ Make sure you have Node.js 18+ (`node --version`)

### API errors
→ Check your API key is valid and has credits

### Need help?
→ Run `npm run verify` to diagnose issues

---

## 📁 Project Structure

```
Genie/
├── src/
│   ├── agents/       # 46 specialized agents
│   ├── llm/          # Multi-LLM consensus system
│   ├── tools/        # Web browser, utilities
│   └── index.js      # Main entry point
├── docs/             # Full documentation
├── .env              # Your API keys (create from .env.example)
├── setup.js          # Interactive setup wizard
├── quickstart.js     # Quick demo
└── verify-genie-system.js  # Health check
```

---

## 🎯 Key Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Interactive setup wizard |
| `npm run quickstart` | 30-second capability test |
| `npm run verify` | System health check |
| `npm start` | Interactive mode |
| `npm run demo` | Full company demo |

---

## 📚 More Documentation

- [README.md](README.md) - Full system documentation
- [docs/GENIE_ARCHITECTURE.md](docs/GENIE_ARCHITECTURE.md) - Technical architecture
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Agent reference

---

**Built by Derek Heinrichs | DKP Gaming LLC | SDVOSB**
