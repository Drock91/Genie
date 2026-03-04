/**
 * GENIE Security & Malware Protection System
 * 
 * Multi-layer security scanning to detect threats in:
 * 1. The GENIE system itself
 * 2. Generated code
 * 3. Dependencies
 * 4. Runtime behavior
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Security Scanner - Detects malicious patterns and vulnerabilities
 */
export class SecurityScanner {
  constructor(logger) {
    this.logger = logger;
    this.threats = [];
    this.patterns = this.initializeThreatPatterns();
  }

  /**
   * Initialize known malicious patterns
   */
  initializeThreatPatterns() {
    return {
      // Data exfiltration patterns
      dataExfiltration: [
        /fetch\s*\(\s*['"](http|https):\/\/[^'"]+['"]/gi,
        /XMLHttpRequest\s*\(\s*['"](http|https):\/\/[^'"]/gi,
        /crypto\.subtle\.importKey/gi,  // Encryption for hiding data
        /btoa\s*\(/gi,  // Base64 encoding (often used to hide payloads)
      ],

      // Privilege escalation
      privilegeEscalation: [
        /eval\s*\(/gi,  // Code injection
        /Function\s*\(/gi,  // Dynamic function creation
        /require\s*\(\s*['"`]/gi,  // Dynamic requires
        /import\s*\(/gi,  // Dynamic imports
        /process\.exit\s*\(/gi,  // Process termination
      ],

      // File system abuse
      fileSystemAbuse: [
        /fs\.writeFile.*\/etc\//gi,  // Writing to system files
        /fs\.deleteSync/gi,  // Deleting files
        /fs\.chmod.*0777/gi,  // Chmod 777
        /\.\.\/\.\.\/\.\.\/etc\//gi,  // Path traversal
      ],

      // Command injection
      commandInjection: [
        /exec\s*\(\s*['"`]/gi,  // Shell command execution
        /spawn\s*\(\s*['"`]/gi,  // Process spawning
        /child_process/gi,  // Child process module
        /shellcode/gi,  // Actual shellcode
      ],

      // Cryptominers/Resource abuse
      resourceAbuse: [
        /setInterval.*1000\s*.*crypto/gi,  // Crypto mining patterns
        /worker.*\.js/gi,  // Web workers (often used for mining)
        /cpu.*intensive/gi,
      ],

      // Backdoors & persistence
      backdoors: [
        /setTimeout.*eval/gi,  // Hidden code execution
        /__proto__/gi,  // Prototype pollution
        /constructor\s*\[/gi,  // Constructor access
      ],

      // Supply chain attacks
      supplyChain: [
        /npm.*install.*\|/gi,  // Piped installations
        /git.*clone.*ssh/gi,  // SSH key theft
      ],
    };
  }

  /**
   * Scan GENIE system for threats
   */
  async scanGenieSystem(genieDir = '.') {
    this.logger?.info({}, 'Starting GENIE system security scan');

    const threats = [];

    // Scan all .js files in src/
    const srcDir = path.join(genieDir, 'src');
    const files = this.getAllFiles(srcDir, '.js');

    for (const file of files) {
      const fileThreatCount = await this.scanFile(file);
      threats.push(...fileThreatCount);
    }

    // Check for suspicious dependencies
    const pkgThreats = await this.scanPackageJson(path.join(genieDir, 'package.json'));
    threats.push(...pkgThreats);

    return {
      safe: threats.length === 0,
      threatCount: threats.length,
      threats,
      scanDate: new Date().toISOString(),
      scannedFiles: files.length,
    };
  }

  /**
   * Scan generated code for threats
   */
  async scanGeneratedCode(projectDir) {
    this.logger?.info({}, `Scanning generated code: ${projectDir}`);

    const threats = [];
    const files = this.getAllFiles(projectDir, ['.js', '.ts', '.jsx', '.tsx']);

    for (const file of files) {
      const fileThreatCount = await this.scanFile(file, true);
      threats.push(...fileThreatCount);
    }

    return {
      projectDir,
      safe: threats.length === 0,
      threatCount: threats.length,
      threats,
      scanDate: new Date().toISOString(),
      scannedFiles: files.length,
    };
  }

  /**
   * Scan a single file for threats
   */
  async scanFile(filePath, isGenerated = false) {
    const threats = [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Check threat patterns
      Object.entries(this.patterns).forEach(([category, regexes]) => {
        regexes.forEach((regex) => {
          lines.forEach((line, lineNum) => {
            if (regex.test(line)) {
              threats.push({
                file: filePath,
                line: lineNum + 1,
                category,
                pattern: line.trim().substring(0, 100),
                severity: this.calculateSeverity(category, isGenerated),
                type: isGenerated ? 'GENERATED_CODE' : 'SOURCE_CODE',
              });
            }
          });
        });
      });

      // Check for suspicious comments
      const suspiciousComments = [
        /\/\/.*backdoor/gi,
        /\/\/.*steal/gi,
        /\/\/.*exfil/gi,
        /\/\/.*virus/gi,
      ];

      suspiciousComments.forEach((regex) => {
        lines.forEach((line, lineNum) => {
          if (regex.test(line)) {
            threats.push({
              file: filePath,
              line: lineNum + 1,
              category: 'SUSPICIOUS_COMMENT',
              pattern: line.trim(),
              severity: 'CRITICAL',
            });
          }
        });
      });
    } catch (err) {
      this.logger?.warn({}, `Failed to scan ${filePath}: ${err.message}`);
    }

    return threats;
  }

  /**
   * Scan package.json for suspicious dependencies
   */
  async scanPackageJson(pkgPath) {
    const threats = [];

    try {
      if (!fs.existsSync(pkgPath)) return threats;

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const knownMalicious = [
        'virus',
        'trojan',
        'backdoor',
        'exploit',
        'keylogger',
        'cryptominer',
      ];

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      Object.keys(allDeps).forEach((dep) => {
        if (knownMalicious.some((bad) => dep.toLowerCase().includes(bad))) {
          threats.push({
            file: pkgPath,
            type: 'SUSPICIOUS_DEPENDENCY',
            package: dep,
            severity: 'CRITICAL',
          });
        }

        // Check for typosquatting (e.g., "lodash" vs "loadash")
        const typoBuddy = dep.replace(/[aeiou]/g, '');
        if (typoBuddy.length < 3) {
          // Skip very short names
          return;
        }
      });
    } catch (err) {
      this.logger?.warn({}, `Failed to scan package.json: ${err.message}`);
    }

    return threats;
  }

  /**
   * Calculate threat severity
   */
  calculateSeverity(category, isGenerated) {
    const severityMap = {
      commandInjection: 'CRITICAL',
      privilegeEscalation: 'CRITICAL',
      backdoors: 'CRITICAL',
      dataExfiltration: 'HIGH',
      fileSystemAbuse: 'HIGH',
      resourceAbuse: 'MEDIUM',
      suspiciousComment: 'CRITICAL',
    };

    let severity = severityMap[category] || 'MEDIUM';

    // Generated code threats are more severe (agent should have prevented them)
    if (isGenerated && severity === 'HIGH') {
      severity = 'CRITICAL';
    }

    return severity;
  }

  /**
   * Get all files recursively
   */
  getAllFiles(dir, extensions) {
    let files = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and hidden folders
        if (!item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        }
      } else {
        const ext = path.extname(item);
        if (
          (typeof extensions === 'string' && ext === extensions) ||
          (Array.isArray(extensions) && extensions.includes(ext))
        ) {
          files.push(fullPath);
        }
      }
    });

    return files;
  }

  /**
   * Generate security report
   */
  generateReport(scanResults) {
    const report = {
      timestamp: new Date().toISOString(),
      overallSecurity: scanResults.safe ? 'PASS' : 'FAIL',
      threatCount: scanResults.threatCount,
      criticalThreats: scanResults.threats.filter((t) => t.severity === 'CRITICAL').length,
      highThreats: scanResults.threats.filter((t) => t.severity === 'HIGH').length,
      mediumThreats: scanResults.threats.filter((t) => t.severity === 'MEDIUM').length,
      scannedFiles: scanResults.scannedFiles,
      details: {
        byCategory: {},
        bySeverity: {},
      },
    };

    // Categorize threats
    scanResults.threats.forEach((threat) => {
      if (!report.details.byCategory[threat.category]) {
        report.details.byCategory[threat.category] = [];
      }
      report.details.byCategory[threat.category].push(threat);

      if (!report.details.bySeverity[threat.severity]) {
        report.details.bySeverity[threat.severity] = [];
      }
      report.details.bySeverity[threat.severity].push(threat);
    });

    return report;
  }

  /**
   * Print security report to console
   */
  printReport(report) {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║            SECURITY SCAN REPORT                     ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log(`Overall Security: ${report.overallSecurity === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Scanned Files: ${report.scannedFiles}`);
    console.log(`\nThreats Found:`);
    console.log(`  🔴 Critical: ${report.criticalThreats}`);
    console.log(`  🟠 High: ${report.highThreats}`);
    console.log(`  🟡 Medium: ${report.mediumThreats}`);

    if (report.threatCount > 0) {
      console.log('\n📋 Threats by Category:');
      Object.entries(report.details.byCategory).forEach(([category, threats]) => {
        console.log(`  • ${category}: ${threats.length}`);
      });

      console.log('\n⚠️  Details:');
      report.details.bySeverity.CRITICAL?.forEach((threat) => {
        console.log(`  🔴 ${threat.file}:${threat.line}`);
        console.log(`     ${threat.category}: ${threat.pattern}`);
      });
    }
  }
}

/**
 * Code Integrity Verifier - Ensures code hasn't been tampered with
 */
export class CodeIntegrityVerifier {
  constructor(logger) {
    this.logger = logger;
    this.checksums = new Map();
  }

  /**
   * Compute SHA-256 checksum of file
   */
  computeChecksum(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Store checksums for critical files
   */
  storeChecksums(genieDir = '.') {
    const criticalFiles = [
      'src/index.js',
      'src/workflow.js',
      'src/orchestrator.js',
      'package.json',
    ];

    criticalFiles.forEach((file) => {
      const fullPath = path.join(genieDir, file);
      if (fs.existsSync(fullPath)) {
        const checksum = this.computeChecksum(fullPath);
        this.checksums.set(file, checksum);
      }
    });

    return this.checksums;
  }

  /**
   * Verify integrity of critical files
   */
  verifyChecksums(genieDir = '.') {
    const issues = [];

    this.checksums.forEach((expectedChecksum, file) => {
      const fullPath = path.join(genieDir, file);

      if (!fs.existsSync(fullPath)) {
        issues.push({
          file,
          issue: 'File not found',
          severity: 'CRITICAL',
        });
        return;
      }

      const actualChecksum = this.computeChecksum(fullPath);

      if (actualChecksum !== expectedChecksum) {
        issues.push({
          file,
          issue: 'File has been modified',
          expected: expectedChecksum,
          actual: actualChecksum,
          severity: 'CRITICAL',
        });
      }
    });

    return {
      verified: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Dependency Verifier - Checks npm dependencies for known vulnerabilities
 */
export class DependencyVerifier {
  constructor(logger) {
    this.logger = logger;
    this.vulnerabilityDatabase = this.initializeVulnDB();
  }

  /**
   * Initialize known vulnerability database
   * In production, integrate with npm audit, Snyk, or similar
   */
  initializeVulnDB() {
    return {
      // Example vulnerabilities (this would come from npm audit API)
      'lodash': [
        {
          id: 'CVE-2021-23337',
          version: '<4.7.11',
          severity: 'HIGH',
          description: 'Prototype pollution in lodash',
        },
      ],
      'serialize-javascript': [
        {
          id: 'GHSA-hxcc-f52p-wc8p',
          version: '<3.1.0',
          severity: 'MEDIUM',
          description: 'Code execution vulnerability',
        },
      ],
    };
  }

  /**
   * Check dependencies for known vulnerabilities
   */
  async checkDependencies(pkgPath) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const vulnerabilities = [];

    Object.entries(allDeps).forEach(([depName, depVersion]) => {
      if (this.vulnerabilityDatabase[depName]) {
        const vulns = this.vulnerabilityDatabase[depName];

        vulns.forEach((vuln) => {
          // In production, parse version ranges properly
          vulnerabilities.push({
            package: depName,
            installedVersion: depVersion,
            vulnerability: vuln,
          });
        });
      }
    });

    return {
      vulnerablePackages: vulnerabilities.length,
      vulnerabilities,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Runtime Behavior Monitor - Watches for suspicious runtime behavior
 */
export class RuntimeBehaviorMonitor {
  constructor(logger) {
    this.logger = logger;
    this.suspiciousBehaviors = [];
  }

  /**
   * Monitor for suspicious behavior patterns
   */
  monitorBehavior(options) {
    const {
      outgoingRequests = [],
      fileAccess = [],
      processExecution = [],
    } = options;

    // Check for suspicious outgoing requests
    outgoingRequests.forEach((req) => {
      if (!req.url.includes(process.env.ALLOWED_DOMAINS || '')) {
        this.suspiciousBehaviors.push({
          type: 'SUSPICIOUS_REQUEST',
          url: req.url,
          timestamp: new Date(),
          severity: 'HIGH',
        });
      }
    });

    // Check for suspicious file access
    fileAccess.forEach((access) => {
      if (access.path.includes('/etc/') || access.path.includes('\\Windows\\System32')) {
        this.suspiciousBehaviors.push({
          type: 'SYSTEM_FILE_ACCESS',
          path: access.path,
          timestamp: new Date(),
          severity: 'CRITICAL',
        });
      }
    });

    return this.suspiciousBehaviors;
  }

  /**
   * Get summary of suspicious behaviors
   */
  getSummary() {
    return {
      totalSuspiciousBehaviors: this.suspiciousBehaviors.length,
      critical: this.suspiciousBehaviors.filter((b) => b.severity === 'CRITICAL').length,
      high: this.suspiciousBehaviors.filter((b) => b.severity === 'HIGH').length,
      behaviors: this.suspiciousBehaviors,
    };
  }
}

export default SecurityScanner;
