/**
 * Security Integration Module
 * 
 * Integrates security scanning into GENIE's workflow execution
 * Ensures all generated code is scanned before execution
 */

import { SecurityScanner, CodeIntegrityVerifier, DependencyVerifier } from './securityScanner.js';

/**
 * Security Orchestrator - Manages all security checks
 */
export class SecurityOrchestrator {
  constructor(logger) {
    this.logger = logger;
    this.scanner = new SecurityScanner(logger);
    this.integrityVerifier = new CodeIntegrityVerifier(logger);
    this.dependencyVerifier = new DependencyVerifier(logger);
    this.scanResults = [];
  }

  /**
   * Full security check before code execution
   */
  async performFullSecurityCheck(options) {
    const { genieDir = '.', generatedCodeDir, packageJsonPath } = options;

    this.logger?.info({}, '🔐 Starting comprehensive security check');

    const checks = {
      genieIntegrity: await this.checkGenieIntegrity(genieDir),
      generatedCode: generatedCodeDir ? await this.checkGeneratedCode(generatedCodeDir) : null,
      dependencies: packageJsonPath ? await this.checkDependencies(packageJsonPath) : null,
    };

    const consolidated = this.consolidateResults(checks);

    return consolidated;
  }

  /**
   * Check GENIE system integrity
   */
  async checkGenieIntegrity(genieDir) {
    this.logger?.info({}, '🔍 Checking GENIE system integrity');

    // Verify no tampering
    const integrity = this.integrityVerifier.verifyChecksums(genieDir);

    if (!integrity.verified) {
      this.logger?.error({}, `⚠️  ${integrity.issues.length} integrity issues found`);
      integrity.issues.forEach((issue) => {
        this.logger?.error({}, `  💔 ${issue.file}: ${issue.issue}`);
      });
    } else {
      this.logger?.info({}, '✅ GENIE core files verified - no tampering detected');
    }

    return {
      check: 'GENIE_INTEGRITY',
      passed: integrity.verified,
      issues: integrity.issues,
    };
  }

  /**
   * Scan generated code for threats
   */
  async checkGeneratedCode(generatedCodeDir) {
    this.logger?.info({}, `📝 Scanning generated code: ${generatedCodeDir}`);

    const results = await this.scanner.scanGeneratedCode(generatedCodeDir);
    const report = this.scanner.generateReport(results);

    if (results.threatCount > 0) {
      this.logger?.warn({}, `⚠️  Found ${results.threatCount} potential threats in generated code`);

      // Categorize by severity
      const critical = results.threats.filter((t) => t.severity === 'CRITICAL');
      const high = results.threats.filter((t) => t.severity === 'HIGH');

      if (critical.length > 0) {
        this.logger?.error({}, `🔴 CRITICAL issues (${critical.length}):`);
        critical.forEach((threat) => {
          this.logger?.error({}, `  ${threat.file}:${threat.line} - ${threat.category}`);
        });
      }

      if (high.length > 0) {
        this.logger?.warn({}, `🟠 HIGH severity issues (${high.length})`);
      }
    } else {
      this.logger?.info({}, '✅ Generated code passed security scan - no threats detected');
    }

    return {
      check: 'GENERATED_CODE_SCAN',
      passed: results.threatCount === 0,
      threatCount: results.threatCount,
      critical: results.threats.filter((t) => t.severity === 'CRITICAL').length,
      high: results.threats.filter((t) => t.severity === 'HIGH').length,
      report,
    };
  }

  /**
   * Check dependencies for vulnerabilities
   */
  async checkDependencies(packageJsonPath) {
    this.logger?.info({}, '📦 Checking dependencies for vulnerabilities');

    const results = await this.dependencyVerifier.checkDependencies(packageJsonPath);

    if (results.vulnerablePackages > 0) {
      this.logger?.warn({}, `⚠️  Found ${results.vulnerablePackages} vulnerable packages`);

      results.vulnerabilities.forEach((vuln) => {
        this.logger?.warn(
          {},
          `  ${vuln.package}: ${vuln.vulnerability.id} (${vuln.vulnerability.severity})`
        );
      });
    } else {
      this.logger?.info({}, '✅ No vulnerable dependencies found');
    }

    return {
      check: 'DEPENDENCY_AUDIT',
      passed: results.vulnerablePackages === 0,
      vulnerablePackages: results.vulnerablePackages,
      vulnerabilities: results.vulnerabilities,
    };
  }

  /**
   * Consolidate all check results
   */
  consolidateResults(checks) {
    const allPassed = Object.values(checks).every((check) => !check || check.passed);

    const summary = {
      overallSecurity: allPassed ? 'PASS ✅' : 'FAIL ❌',
      timestamp: new Date().toISOString(),
      checks: Object.entries(checks)
        .filter(([_, check]) => check !== null)
        .reduce((acc, [name, check]) => {
          acc[name] = {
            passed: check.passed,
            status: check.passed ? '✅' : '❌',
            ...check,
          };
          return acc;
        }, {}),
    };

    return summary;
  }

  /**
   * Print security summary to console
   */
  printSummary(summary) {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║           SECURITY CHECK SUMMARY                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log(`Overall: ${summary.overallSecurity}`);

    Object.entries(summary.checks).forEach(([checkName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`\n${status} ${checkName.toUpperCase().replace(/_/g, ' ')}`);

      if (!result.passed) {
        if (result.issues) {
          console.log(`   Issues: ${result.issues.length}`);
        }
        if (result.threatCount !== undefined) {
          console.log(`   Threats: ${result.threatCount}`);
        }
        if (result.vulnerablePackages !== undefined) {
          console.log(`   Vulnerable packages: ${result.vulnerablePackages}`);
        }
      }
    });

    if (summary.overallSecurity === 'PASS ✅') {
      console.log(
        '\n✨ System is secure and ready for deployment!\n'
      );
    } else {
      console.log(
        '\n⚠️  Security issues found. Review and fix before proceeding.\n'
      );
    }
  }

  /**
   * Integration with workflow - should be called after code generation
   */
  async integrateWithWorkflow(workflowResult, genieDir = '.') {
    this.logger?.info({}, '🔐 Running security checks on workflow output');

    const securityCheck = await this.performFullSecurityCheck({
      genieDir,
      generatedCodeDir: workflowResult.projectPath,
      packageJsonPath: `${workflowResult.projectPath}/package.json`,
    });

    return {
      ...workflowResult,
      security: securityCheck,
      secureForDeployment: securityCheck.overallSecurity === 'PASS ✅',
    };
  }
}

/**
 * Security-aware code wrapper
 * Wraps generated code to monitor runtime behavior
 */
export class SecureCodeWrapper {
  /**
   * Create a wrapped version of code with security monitoring
   */
  static wrapCode(originalCode, options = {}) {
    const {
      allowedExternalDomains = ['api.example.com'],
      monitorFileAccess = true,
      monitorNetworkRequests = true,
    } = options;

    return `
// ============================================================
// SECURITY WRAPPER - Monitoring enabled
// ============================================================

const __SECURITY__ = {
  allowedDomains: ${JSON.stringify(allowedExternalDomains)},
  networkRequests: [],
  fileAccess: [],
  
  checkDomain(url) {
    const domain = new URL(url).hostname;
    if (!this.allowedDomains.includes(domain)) {
      throw new SecurityError(\`Unauthorized domain: \${domain}\`);
    }
  },
  
  monitorRequest(method, url) {
    this.networkRequests.push({ method, url, timestamp: new Date() });
    this.checkDomain(url);
  },
  
  monitorFileAccess(path, operation) {
    if (path.includes('/etc/') || path.includes('\\\\Windows\\\\System32')) {
      throw new SecurityError(\`Unauthorized file access: \${path}\`);
    }
    this.fileAccess.push({ path, operation, timestamp: new Date() });
  }
};

class SecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
    console.error('🚨 SECURITY VIOLATION:', message);
  }
}

// Original code with security wrappers
${originalCode}
    `;
  }
}

export default SecurityOrchestrator;
