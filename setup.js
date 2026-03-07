#!/usr/bin/env node
/**
 * GENIE Setup Wizard
 * 
 * Interactive setup that guides users through:
 * 1. Checking prerequisites
 * 2. Installing dependencies
 * 3. Configuring API keys
 * 4. Verifying the installation
 * 5. Running a quick demo
 * 
 * Usage: npm run setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync, spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const c = colors;

class GenieSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {
      providers: [],
      openaiKey: '',
      anthropicKey: '',
      googleKey: '',
      mistralKey: ''
    };
  }

  async run() {
    this.printBanner();
    
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Install dependencies
      await this.installDependencies();
      
      // Step 3: Configure API keys
      await this.configureApiKeys();
      
      // Step 4: Create .env file
      await this.createEnvFile();
      
      // Step 5: Verify installation
      await this.verifyInstallation();
      
      // Step 6: Run quick demo
      await this.askRunDemo();
      
      this.printSuccess();
    } catch (error) {
      this.printError(error.message);
    } finally {
      this.rl.close();
    }
  }

  printBanner() {
    console.log(`
${c.cyan}╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ${c.bright}${c.magenta}   ██████╗ ███████╗███╗   ██╗██╗███████╗${c.reset}${c.cyan}                     ║
║   ${c.bright}${c.magenta}  ██╔════╝ ██╔════╝████╗  ██║██║██╔════╝${c.reset}${c.cyan}                     ║
║   ${c.bright}${c.magenta}  ██║  ███╗█████╗  ██╔██╗ ██║██║█████╗${c.reset}${c.cyan}                       ║
║   ${c.bright}${c.magenta}  ██║   ██║██╔══╝  ██║╚██╗██║██║██╔══╝${c.reset}${c.cyan}                       ║
║   ${c.bright}${c.magenta}  ╚██████╔╝███████╗██║ ╚████║██║███████╗${c.reset}${c.cyan}                     ║
║   ${c.bright}${c.magenta}   ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝╚══════╝${c.reset}${c.cyan}                     ║
║                                                                  ║
║   ${c.bright}AI Multi-Agent System - Setup Wizard${c.reset}${c.cyan}                         ║
║   ${c.yellow}46 Specialized Agents | Multi-LLM Consensus${c.reset}${c.cyan}                  ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝${c.reset}
`);
  }

  async prompt(question) {
    return new Promise(resolve => {
      this.rl.question(question, answer => resolve(answer.trim()));
    });
  }

  async checkPrerequisites() {
    console.log(`\n${c.cyan}━━━━━━ Step 1/5: Checking Prerequisites ━━━━━━${c.reset}\n`);

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      console.log(`${c.green}✓${c.reset} Node.js ${nodeVersion} (requires 18+)`);
    } else {
      throw new Error(`Node.js 18+ required. You have ${nodeVersion}. Please upgrade.`);
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`${c.green}✓${c.reset} npm ${npmVersion}`);
    } catch {
      throw new Error('npm not found. Please install Node.js with npm.');
    }

    // Check if package.json exists
    if (fs.existsSync(path.join(__dirname, 'package.json'))) {
      console.log(`${c.green}✓${c.reset} package.json found`);
    } else {
      throw new Error('package.json not found. Are you in the GENIE directory?');
    }

    console.log(`\n${c.green}All prerequisites met!${c.reset}`);
    await this.pause();
  }

  async installDependencies() {
    console.log(`\n${c.cyan}━━━━━━ Step 2/5: Installing Dependencies ━━━━━━${c.reset}\n`);

    const nodeModules = path.join(__dirname, 'node_modules');
    
    if (fs.existsSync(nodeModules)) {
      const answer = await this.prompt(`${c.yellow}?${c.reset} node_modules exists. Reinstall? (y/N): `);
      if (answer.toLowerCase() !== 'y') {
        console.log(`${c.green}✓${c.reset} Using existing dependencies`);
        return;
      }
    }

    console.log(`${c.blue}→${c.reset} Running npm install (this may take a minute)...\n`);
    
    try {
      execSync('npm install', { 
        cwd: __dirname, 
        stdio: 'inherit',
        timeout: 300000 // 5 minute timeout
      });
      console.log(`\n${c.green}✓${c.reset} Dependencies installed successfully`);
    } catch (error) {
      throw new Error('npm install failed. Check error above.');
    }
    
    await this.pause();
  }

  async configureApiKeys() {
    console.log(`\n${c.cyan}━━━━━━ Step 3/5: Configure API Keys ━━━━━━${c.reset}\n`);
    
    console.log(`GENIE uses multiple LLM providers for consensus-based decisions.`);
    console.log(`${c.yellow}At minimum, you need ONE provider API key.${c.reset}`);
    console.log(`For best results, configure 2-3 providers.\n`);
    
    console.log(`${c.bright}Available Providers:${c.reset}`);
    console.log(`  1. OpenAI     - Best for complex reasoning (gpt-4o)`);
    console.log(`  2. Google     - Fast and free tier available (gemini-2.0-flash)`);
    console.log(`  3. Anthropic  - Excellent for analysis (claude-3-5-sonnet)`);
    console.log(`  4. Mistral    - Great European alternative (mistral-large)`);
    console.log();

    // OpenAI
    const openaiKey = await this.prompt(`${c.yellow}?${c.reset} OpenAI API Key (or press Enter to skip): `);
    if (openaiKey && openaiKey.startsWith('sk-')) {
      this.config.openaiKey = openaiKey;
      this.config.providers.push('OpenAI');
      console.log(`${c.green}✓${c.reset} OpenAI configured`);
    } else if (openaiKey) {
      console.log(`${c.yellow}⚠${c.reset} Invalid key format (should start with sk-), skipping`);
    }

    // Google
    const googleKey = await this.prompt(`${c.yellow}?${c.reset} Google Gemini API Key (or press Enter to skip): `);
    if (googleKey && googleKey.length > 10) {
      this.config.googleKey = googleKey;
      this.config.providers.push('Google');
      console.log(`${c.green}✓${c.reset} Google Gemini configured`);
    }

    // Anthropic
    const anthropicKey = await this.prompt(`${c.yellow}?${c.reset} Anthropic API Key (or press Enter to skip): `);
    if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
      this.config.anthropicKey = anthropicKey;
      this.config.providers.push('Anthropic');
      console.log(`${c.green}✓${c.reset} Anthropic configured`);
    } else if (anthropicKey) {
      console.log(`${c.yellow}⚠${c.reset} Invalid key format (should start with sk-ant-), skipping`);
    }

    // Mistral
    const mistralKey = await this.prompt(`${c.yellow}?${c.reset} Mistral API Key (or press Enter to skip): `);
    if (mistralKey && mistralKey.length > 10) {
      this.config.mistralKey = mistralKey;
      this.config.providers.push('Mistral');
      console.log(`${c.green}✓${c.reset} Mistral configured`);
    }

    if (this.config.providers.length === 0) {
      console.log(`\n${c.yellow}⚠ No API keys configured.${c.reset}`);
      console.log(`You can add them later by editing the .env file.`);
      console.log(`Get free API keys:`);
      console.log(`  • Google Gemini: https://ai.google.dev/`);
      console.log(`  • OpenAI: https://platform.openai.com/`);
    } else {
      console.log(`\n${c.green}✓ Configured ${this.config.providers.length} provider(s): ${this.config.providers.join(', ')}${c.reset}`);
    }

    await this.pause();
  }

  async createEnvFile() {
    console.log(`\n${c.cyan}━━━━━━ Step 4/5: Creating Configuration ━━━━━━${c.reset}\n`);

    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
      const answer = await this.prompt(`${c.yellow}?${c.reset} .env already exists. Overwrite? (y/N): `);
      if (answer.toLowerCase() !== 'y') {
        console.log(`${c.green}✓${c.reset} Keeping existing .env file`);
        return;
      }
    }

    const envContent = `# GENIE Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# ==================== LLM PROVIDERS ====================
# At least one provider is required

# OpenAI (gpt-4o)
OPENAI_API_KEY=${this.config.openaiKey || 'your-openai-key-here'}
OPENAI_MODEL=gpt-4o

# Google Gemini (gemini-2.0-flash) - Free tier available!
GOOGLE_API_KEY=${this.config.googleKey || 'your-google-key-here'}
GOOGLE_MODEL=gemini-2.0-flash

# Anthropic Claude
ANTHROPIC_API_KEY=${this.config.anthropicKey || 'your-anthropic-key-here'}
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Mistral
MISTRAL_API_KEY=${this.config.mistralKey || 'your-mistral-key-here'}
MISTRAL_MODEL=mistral-large-latest

# ==================== SYSTEM SETTINGS ====================
NODE_ENV=development
MAX_ITERATIONS=5
RETRY_ATTEMPTS=3
`;

    fs.writeFileSync(envPath, envContent);
    console.log(`${c.green}✓${c.reset} Created .env file`);
    
    await this.pause();
  }

  async verifyInstallation() {
    console.log(`\n${c.cyan}━━━━━━ Step 5/5: Verifying Installation ━━━━━━${c.reset}\n`);

    console.log(`${c.blue}→${c.reset} Running verification checks...\n`);

    try {
      execSync('node verify-genie-system.js', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
    } catch {
      console.log(`\n${c.yellow}⚠ Some checks reported warnings (see above)${c.reset}`);
    }

    await this.pause();
  }

  async askRunDemo() {
    const answer = await this.prompt(`\n${c.yellow}?${c.reset} Run a quick demo to test GENIE? (Y/n): `);
    
    if (answer.toLowerCase() !== 'n') {
      console.log(`\n${c.blue}→${c.reset} Running quick demo...\n`);
      
      try {
        execSync('node quickstart.js', { 
          cwd: __dirname, 
          stdio: 'inherit',
          timeout: 120000 // 2 minute timeout
        });
      } catch (error) {
        if (error.message.includes('timeout')) {
          console.log(`\n${c.yellow}Demo timed out - this usually means API keys need configuration${c.reset}`);
        } else {
          console.log(`\n${c.yellow}Demo had issues - check API key configuration${c.reset}`);
        }
      }
    }
  }

  printSuccess() {
    console.log(`
${c.green}╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ${c.bright}✅ GENIE SETUP COMPLETE!${c.reset}${c.green}                                     ║
║                                                                  ║
║   Quick Commands:                                                ║
║   ${c.cyan}npm start${c.reset}${c.green}          - Interactive mode (ask anything)          ║
║   ${c.cyan}npm run demo${c.reset}${c.green}       - Full company demonstration               ║
║   ${c.cyan}npm run quickstart${c.reset}${c.green} - 30-second capability test                ║
║                                                                  ║
║   Documentation:                                                 ║
║   ${c.cyan}QUICKSTART.md${c.reset}${c.green}      - Quick reference guide                    ║
║   ${c.cyan}README.md${c.reset}${c.green}          - Full documentation                       ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝${c.reset}
`);
  }

  printError(message) {
    console.log(`\n${c.red}╔════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.red}║ ❌ Setup Error${c.reset}`);
    console.log(`${c.red}║ ${message}${c.reset}`);
    console.log(`${c.red}╚════════════════════════════════════════════════════════════════╝${c.reset}\n`);
  }

  async pause() {
    await this.prompt(`\n${c.blue}Press Enter to continue...${c.reset}`);
  }
}

// Run setup
const setup = new GenieSetup();
setup.run();
