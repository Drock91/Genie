/**
 * GENIE System Verification & Health Check
 * 
 * Run this script to verify your GENIE installation is clean,
 * properly configured, and ready for production use.
 * 
 * Usage: node verify-genie-system.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GenieSystemVerifier {
  constructor() {
    this.results = {
      passed: [],
      warnings: [],
      errors: [],
      stats: {}
    };
  }

  /**
   * Run all verification checks
   */
  async runAll() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║       GENIE SYSTEM VERIFICATION & CLEANUP CHECK     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Core checks
    this.checkFileStructure();
    this.checkDuplicateImports();
    this.checkAgentRegistry();
    this.checkDocumentation();
    this.checkEnvironment();
    this.checkDependencies();
    this.checkGitIgnore();
    this.checkAgentCount();

    // Print results
    this.printResults();

    return this.results;
  }

  /**
   * Check project file structure
   */
  checkFileStructure() {
    console.log('📂 Checking file structure...');

    const requiredFolders = [
      'src',
      'src/agents',
      'src/util',
      'src/llm',
      'src/workflow',
      'src/repo'
    ];

    const requiredFiles = [
      'package.json',
      'src/index.js',
      '.env.example',
      '.gitignore',
      'README.md'
    ];

    let folderIssues = 0;
    requiredFolders.forEach(folder => {
      const fullPath = path.join(__dirname, folder);
      if (fs.existsSync(fullPath)) {
        this.pass(`✓ Folder exists: ${folder}`);
      } else {
        this.error(`✗ Missing folder: ${folder}`);
        folderIssues++;
      }
    });

    let fileIssues = 0;
    requiredFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        this.pass(`✓ File exists: ${file}`);
      } else {
        this.error(`✗ Missing file: ${file}`);
        fileIssues++;
      }
    });

    this.results.stats.folderIssues = folderIssues;
    this.results.stats.fileIssues = fileIssues;
  }

  /**
   * Check for duplicate imports in index.js
   */
  checkDuplicateImports() {
    console.log('\n🔍 Checking for duplicate imports...');

    const indexPath = path.join(__dirname, 'src/index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    const imports = content.split('\n').filter(line => line.startsWith('import'));

    const importCounts = {};
    let duplicates = 0;

    imports.forEach(imp => {
      importCounts[imp] = (importCounts[imp] || 0) + 1;
    });

    Object.entries(importCounts).forEach(([imp, count]) => {
      if (count > 1) {
        this.error(`✗ Duplicate import (${count}x): ${imp.substring(0, 60)}...`);
        duplicates++;
      }
    });

    if (duplicates === 0) {
      this.pass(`✓ No duplicate imports found (${imports.length} imports)`);
    }

    this.results.stats.duplicateImports = duplicates;
  }

  /**
   * Check agent registry
   */
  checkAgentRegistry() {
    console.log('\n📋 Checking agent registry...');

    try {
      const registryPath = path.join(__dirname, 'src/agentRegistry.js');
      if (!fs.existsSync(registryPath)) {
        this.error('✗ Agent registry not found (src/agentRegistry.js)');
        return;
      }

      this.pass('✓ Agent registry file exists');

      const content = fs.readFileSync(registryPath, 'utf8');
      const agentCount = (content.match(/name:/g) || []).length;

      if (agentCount >= 20) {
        this.pass(`✓ Agent registry contains ${agentCount} agents (expected 20+)`);
      } else if (agentCount >= 15) {
        this.warn(`⚠ Agent registry contains ${agentCount} agents (expected 20+)`);
      } else {
        this.error(`✗ Agent registry contains only ${agentCount} agents (expected 20+)`);
      }

      this.results.stats.registeredAgents = agentCount;
    } catch (err) {
      this.error(`✗ Error reading agent registry: ${err.message}`);
    }
  }

  /**
   * Check documentation
   */
  checkDocumentation() {
    console.log('\n📚 Checking documentation...');

    const docFiles = [
      'README.md',
      'docs/GENIE_ARCHITECTURE.md',
      'docs/PROJECT_CLEANUP_SUMMARY.md',
      'docs/QUICK_REFERENCE.md',
      'src/agents/AGENT_TEMPLATE.js'
    ];

    let missing = 0;
    docFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        this.pass(`✓ ${file} (${lines} lines)`);
      } else {
        this.error(`✗ Missing: ${file}`);
        missing++;
      }
    });

    this.results.stats.missingDocs = missing;
  }

  /**
   * Check environment configuration
   */
  checkEnvironment() {
    console.log('\n⚙️  Checking environment...');

    const envExample = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf8');
      const vars = content.split('\n').filter(line => line && !line.startsWith('#'));
      this.pass(`✓ .env.example exists with ${vars.length} variables`);
    } else {
      this.warn('⚠ No .env.example file');
    }

    const env = path.join(__dirname, '.env');
    if (fs.existsSync(env)) {
      this.pass('✓ .env file exists (configured)');
    } else {
      this.warn('⚠ No .env file (copy from .env.example)');
    }
  }

  /**
   * Check dependencies
   */
  checkDependencies() {
    console.log('\n📦 Checking dependencies...');

    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const requiredDeps = [
      'openai',
      '@anthropic-ai/sdk',
      '@google/generative-ai',
      'dotenv',
      'pdfkit'
    ];

    let missing = 0;
    requiredDeps.forEach(dep => {
      if (pkg.dependencies[dep]) {
        this.pass(`✓ ${dep} (${pkg.dependencies[dep]})`);
      } else {
        this.error(`✗ Missing dependency: ${dep}`);
        missing++;
      }
    });

    this.results.stats.missingDependencies = missing;
  }

  /**
   * Check .gitignore
   */
  checkGitIgnore() {
    console.log('\n🚫 Checking .gitignore...');

    const gitignorePath = path.join(__dirname, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');

    const requiredPatterns = [
      'node_modules',
      '.env',
      'logs',
      'output',
      'requests'
    ];

    let missing = 0;
    requiredPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        this.pass(`✓ ${pattern} is in .gitignore`);
      } else {
        this.warn(`⚠ ${pattern} not in .gitignore`);
        missing++;
      }
    });

    this.results.stats.gitignoreMissing = missing;
  }

  /**
   * Check agent count and organization
   */
  checkAgentCount() {
    console.log('\n👥 Checking agents...');

    const agentsPath = path.join(__dirname, 'src/agents');
    const files = fs.readdirSync(agentsPath)
      .filter(f => f.endsWith('Agent.js') || f.endsWith('agent.js'))
      .filter(f => !f.startsWith('base') && !f.startsWith('AGENT_TEMPLATE'));

    const coreCount = files.length;
    this.pass(`✓ Found ${coreCount} agent files`);

    // Check deprecated folder
    const deprecatedPath = path.join(agentsPath, 'deprecated');
    if (fs.existsSync(deprecatedPath)) {
      const deprecated = fs.readdirSync(deprecatedPath)
        .filter(f => f.endsWith('Agent.js') || f.endsWith('agent.js'));
      this.pass(`✓ Deprecated folder exists with ${deprecated.length} archived agents`);
      this.results.stats.deprecatedAgents = deprecated.length;
    } else {
      this.warn('⚠ No deprecated agents folder');
    }

    this.results.stats.coreAgents = coreCount;
  }

  /**
   * Print verification results
   */
  printResults() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                  VERIFICATION RESULTS               ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Passed checks
    if (this.results.passed.length > 0) {
      console.log(`✅ PASSED (${this.results.passed.length}):`);
      this.results.passed.forEach(msg => console.log(`   ${msg}`));
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.results.warnings.length}):`);
      this.results.warnings.forEach(msg => console.log(`   ${msg}`));
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.errors.length}):`);
      this.results.errors.forEach(msg => console.log(`   ${msg}`));
    }

    // Statistics
    console.log('\n📊 STATISTICS:');
    console.log(`   Core Agents: ${this.results.stats.coreAgents || 0}`);
    console.log(`   Deprecated Agents: ${this.results.stats.deprecatedAgents || 0}`);
    console.log(`   Registered Agents: ${this.results.stats.registeredAgents || 0}`);
    console.log(`   Duplicate Imports: ${this.results.stats.duplicateImports || 0}`);
    console.log(`   Missing Dependencies: ${this.results.stats.missingDependencies || 0}`);

    // Overall status
    console.log('\n╔════════════════════════════════════════════════════╗');
    if (this.results.errors.length === 0) {
      console.log('║              ✅ SYSTEM READY FOR USE                ║');
    } else {
      console.log('║              ⚠️  ISSUES FOUND - REVIEW ABOVE         ║');
    }
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Recommendations
    if (this.results.errors.length > 0 || this.results.warnings.length > 0) {
      console.log('📋 RECOMMENDED NEXT STEPS:\n');

      if (!fs.existsSync(path.join(__dirname, '.env'))) {
        console.log('   1. Copy .env.example to .env');
        console.log('      cp .env.example .env');
        console.log('\n   2. Add your API keys to .env\n');
      }

      if (this.results.stats.missingDependencies > 0) {
        console.log('   3. Install missing dependencies:');
        console.log('      npm install\n');
      }

      if (this.results.stats.duplicateImports > 0) {
        console.log('   4. Remove duplicate imports from src/index.js\n');
      }
    }

    console.log('✨ For more information, see: docs/GENIE_ARCHITECTURE.md\n');
  }

  /**
   * Record a passed check
   */
  pass(message) {
    this.results.passed.push(message);
  }

  /**
   * Record a warning
   */
  warn(message) {
    this.results.warnings.push(message);
  }

  /**
   * Record an error
   */
  error(message) {
    this.results.errors.push(message);
  }
}

// Run verification
const verifier = new GenieSystemVerifier();
await verifier.runAll();

process.exit(verifier.results.errors.length > 0 ? 1 : 0);
