# GENIE Security Implementation Quick Guide

**Practical steps to integrate security scanning into your GENIE workflows.**

---

## 🚀 Quick Start: Enable Security Scanning

### Step 1: Create a Security Check Script
```bash
cat > check-security.js << 'EOF'
import { SecurityOrchestrator } from './src/security/securityOrchestrator.js';
import { logger } from './src/util/logger.js';

const orchestrator = new SecurityOrchestrator(logger);

// Run full security check
const results = await orchestrator.performFullSecurityCheck({
  genieDir: '.',
  generatedCodeDir: './output/MyProject',
  packageJsonPath: './package.json'
});

orchestrator.printSummary(results);

process.exit(results.overallSecurity === 'PASS ✅' ? 0 : 1);
EOF
```

### Step 2: Run the Check
```bash
node check-security.js
```

### Step 3: Add to Package.json
```json
{
  "scripts": {
    "security-scan": "node check-security.js",
    "security-scan:watch": "nodemon check-security.js"
  }
}
```

---

## 🔧 Integration with Workflow

### Option A: Automatic Post-Generation Scan

Add to your workflow:

```javascript
// In src/workflow.js or your orchestration code
import { SecurityOrchestrator } from './security/securityOrchestrator.js';

async function runWorkflow(options) {
  // ... existing workflow code ...
  
  const result = await executeWorkflow(options);
  
  // NEW: Security check on generated code
  const securityOrchestrator = new SecurityOrchestrator(logger);
  const securityResults = await securityOrchestrator.integrateWithWorkflow(
    result,
    '.'  // GENIE root directory
  );
  
  // Only proceed if secure
  if (!securityResults.secureForDeployment) {
    logger.error({}, '🚨 Generated code failed security check');
    logger.error({}, securityResults.security);
    return { ...result, success: false };
  }
  
  logger.info({}, '✅ Generated code passed security verification');
  return securityResults;
}
```

### Option B: Manual Verification

```bash
npm run build          # Generate code
npm run security-scan  # Verify security
npm run deploy         # Deploy only if secure
```

---

## 🔍 Specific Use Cases

### Use Case 1: Scan Generated Backend Code
```javascript
import { SecurityScanner } from './src/security/securityScanner.js';

const scanner = new SecurityScanner(logger);

// Scan only the generated API
const results = await scanner.scanGeneratedCode('./output/MyProject/src/api');
const report = scanner.generateReport(results);

if (results.threatCount > 0) {
  console.error('Found security issues in generated API code');
  report.details.bySeverity.CRITICAL?.forEach(threat => {
    console.error(`  Line ${threat.line}: ${threat.category}`);
  });
}
```

### Use Case 2: Verify GENIE Hasn't Been Compromised
```javascript
import { CodeIntegrityVerifier } from './src/security/securityScanner.js';

const verifier = new CodeIntegrityVerifier(logger);

// On first setup, store checksums
verifier.storeChecksums('.');  // Save to memory or file

// Later, verify integrity
const verification = verifier.verifyChecksums('.');

if (!verification.verified) {
  // ALERT: System has been tampered with!
  console.error('🚨 CRITICAL: GENIE system files have been modified!');
  process.exit(1);
}
```

### Use Case 3: Check Dependencies for Vulnerabilities
```javascript
import { DependencyVerifier } from './src/security/securityScanner.js';

const verifier = new DependencyVerifier(logger);

const vulnReport = await verifier.checkDependencies('./package.json');

if (vulnReport.vulnerablePackages > 0) {
  vulnReport.vulnerabilities.forEach(v => {
    console.warn(`⚠️  ${v.package}: ${v.vulnerability.id}`);
  });
  
  console.log('\nRun: npm audit for details');
  console.log('Run: npm update to patch');
}
```

### Use Case 4: Continuous Security Monitoring
```bash
cat > monitor-security.js << 'EOF'
import chokidar from 'chokidar';
import { SecurityScanner } from './src/security/securityScanner.js';
import { logger } from './src/util/logger.js';

const scanner = new SecurityScanner(logger);

// Watch for changes to generated code
chokidar.watch('output/**/*.js', {
  ignored: /node_modules/,
  persistent: true
}).on('change', async (path) => {
  console.log(`\n🔍 Scanning changed file: ${path}`);
  
  const threats = await scanner.scanFile(path, true);
  
  if (threats.length > 0) {
    console.error(`\n🚨 SECURITY ALERT: ${threats.length} threats detected!`);
    threats.forEach(threat => {
      console.error(`  ${threat.severity}: ${threat.category}`);
      console.error(`    ${threat.pattern}`);
    });
  } else {
    console.log('✅ File is secure');
  }
});

console.log('📡 Continuous security monitoring enabled');
EOF

# Run it
node monitor-security.js
```

---

## 🛡️ Security in CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Security Check

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Check for vulnerabilities
        run: npm audit --audit-level=high
      
      - name: Run GENIE security scan
        run: |
          cat > security-check.js << 'EOF'
          import { SecurityScanner } from './src/security/securityScanner.js';
          const scanner = new SecurityScanner();
          const results = await scanner.scanGenieSystem('.');
          if (!results.safe) process.exit(1);
          EOF
          node security-check.js
      
      - name: Scan generated code (if exists)
        run: |
          if [ -d "./output" ]; then
            node -e "
            import { SecurityScanner } from './src/security/securityScanner.js';
            const scanner = new SecurityScanner();
            const results = await scanner.scanGeneratedCode('./output');
            if (!results.safe) process.exit(1);
            "
          fi
```

---

## 🚨 Threat Response Workflow

### If Vulnerabilities Are Found

```
1. IMMEDIATE ACTION
   ├─ Stop using the vulnerable code
   ├─ Review the specific threat
   └─ Determine severity level

2. ASSESSMENT
   ├─ Is this a false positive?
   ├─ Is the threat actually exploitable?
   └─ What data/systems could be affected?

3. REMEDIATION
   ├─ Regenerate using updated agents
   ├─ Update dependencies if needed
   │  └─ npm audit fix
   │  └─ npm update
   ├─ Manual code review and fix
   └─ Re-scan to verify fix

4. PREVENTION
   ├─ Update security patterns to catch similar issues
   ├─ Document the lesson learned
   └─ Add to security runbook

5. DOCUMENTATION
   ├─ Log the incident
   ├─ Create GitHub issue (if open source)
   └─ Update security documentation
```

### Example Remediation
```javascript
// Step 1: Identify the issue
// ❌ Vulnerable code found at src/api.js:42
// SQL_INJECTION: db.query(`SELECT * FROM users WHERE id = ${userId}`)

// Step 2: Fix it
// ✅ Use parameterized query
db.query('SELECT * FROM users WHERE id = $1', [userId])

// Step 3: Update agent to prevent this
// In securityHardeningAgent.js, add to pattern detection:
// ✅ Automatically fixes this pattern

// Step 4: Verify fix
npm run security-scan
// ✅ No threats found
```

---

## 📊 Security Metrics & Reporting

### Track Over Time
```javascript
const securityMetrics = {
  date: new Date(),
  threatCount: 0,
  criticalThreats: 0,
  codeScanned: 0,
  vulnerablePackages: 0
};

// Store in CSV or database
fs.appendFileSync('security-metrics.csv', 
  `${securityMetrics.date},${securityMetrics.threatCount},${securityMetrics.criticalThreats}\n`
);
```

### Monthly Security Report
```bash
cat > generate-security-report.js << 'EOF'
// Collect metrics from last 30 days
// Generate trends
// Create executive summary
// Include recommendations

const report = {
  period: 'Last 30 days',
  averageThreatsPerScan: 2,
  trend: 'decreasing',  // Good!
  recommendations: [
    'Continue security scanning in CI/CD',
    'Update vulnerable packages',
    'Add more security tests'
  ]
};

console.table(report);
EOF
```

---

## 🎓 Security Best Practices Checklist

**Before Each Deployment:**

- ☐ Run `npm audit`
- ☐ Run `npm run security-scan`
- ☐ Review security scan output
- ☐ Fix all CRITICAL threats
- ☐ Review and fix HIGH threats
- ☐ Update vulnerable dependencies
- ☐ Run all tests
- ☐ Manual code review of critical paths
- ☐ Check for hardcoded secrets
- ☐ Verify environment configuration

**In Your Development Process:**

- ☐ Enable security checks in CI/CD
- ☐ Review security findings in code reviews
- ☐ Keep dependencies updated
- ☐ Monitor for new vulnerabilities
- ☐ Train team on security best practices
- ☐ Document security decisions
- ☐ Plan regular security audits

---

## 🔧 Customizing Security Rules

### Add Custom Threat Pattern
```javascript
// In securityScanner.js
initializeThreatPatterns() {
  return {
    ...this.patterns,
    
    // Add custom patterns
    customThreat: [
      /your-dangerous-pattern/gi,
      /another-pattern/gi
    ]
  };
}
```

### Add Custom Validation
```javascript
// Create custom validator
class CustomSecurityValidator {
  validate(code) {
    // Your custom logic
    const threats = [];
    
    // Check for your specific patterns
    if (code.includes('dangerous')) {
      threats.push({
        severity: 'HIGH',
        message: 'Found dangerous pattern'
      });
    }
    
    return threats;
  }
}
```

---

## 🆘 Troubleshooting

### "False Positives" (Security Scanner reports safe code as dangerous)

**Solution:**
```javascript
// Review the alert
// If truly safe, you can:

// Option 1: Add exception
if (isDef initelyNotMalicious(code)) {
  // Allow
}

// Option 2: Refactor to remove alert
// Instead of:  eval(...) // ❌ Triggers alert
// Use:        Function(...)    // Still bad
// Really use: safer.evaluate() // ✅ Safe
```

### "Missed Threats" (Security Scanner doesn't catch something)

**Action:**
```javascript
// 1. Report the issue
// 2. Add a new pattern to detection
// 3. Include in tests
// 4. Deploy updated scanner
```

### Tool Integration Issues

```bash
# Make sure eslint security plugins are installed
npm install --save-dev @microsoft/eslint-plugin-security

# Configure .eslintrc.json
{
  "plugins": ["@microsoft/eslint-plugin-security"],
  "extends": ["plugin:@microsoft/eslint-plugin-security/recommended"]
}

# Run eslint
npx eslint src/ --ext .js,.jsx,.ts,.tsx
```

---

## 📚 Additional Resources

### Built-in Tools
```bash
# Node.js security audit
npm audit
npm audit fix

# ESLint security plugins
npm install --save-dev eslint-plugin-security

# Snyk integration
npm install -g snyk
snyk test

# OWASP dependency checker
npm install --save-dev @owasp/depend-check
```

### Commands to Add to package.json
```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:audit-fix": "npm audit fix",
    "security:scan": "node check-security.js",
    "security:monitor": "node monitor-security.js",
    "security:full": "npm run security:audit && npm run security:scan",
    "precommit": "npm run security:audit",
    "prepush": "npm run security:scan"
  }
}
```

---

## ✅ Verification Checklist

**Your GENIE security setup is complete when:**

- ☐ Security scanner installed and working
- ☐ Code integrity verifier configured
- ☐ Dependency verifier integrated
- ☐ Security checks in CI/CD pipeline
- ☐ Team trained on security processes
- ☐ Documentation reviewed
- ☐ All tests passing
- ☐ First security scan passed

---

**Questions?** Refer back to [SECURITY_GUIDE.md](SECURITY_GUIDE.md) for comprehensive documentation!

