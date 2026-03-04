# GENIE Security & Malware Protection Guide

**Complete protection framework for verifying GENIE system integrity and generated code safety.**

---

## 🔒 Security Architecture

GENIE uses a **multi-layer security model** to protect against threats:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input                                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ╔════════════════════════════════════════╗
        ║   LAYER 1: INPUT VALIDATION & SANITIZATION │
        ║   - XSS prevention
        ║   - SQL injection prevention
        ║   - Command injection prevention
        ╚════════════════════════════════════════╝
                         │
        ╔════════════════════════════════════════╗
        ║   LAYER 2: REQUEST REFINER ANALYSIS     │
        ║   - Parse intent
        ║   - Identify suspicious requests
        ║   - Validate scope
        ╚════════════════════════════════════════╝
                         │
        ╔════════════════════════════════════════╗
        ║   LAYER 3: SECURITY HARDENING AGENT    │
        ║   - Prevents malicious patterns
        ║   - Enforces secure coding
        ║   - Removes backdoors
        ╚════════════════════════════════════════╝
                         │
        ╔════════════════════════════════════════╗
        ║   LAYER 4: CODE SCANNING               │
        ║   - Static analysis
        ║   - Signature detection
        ║   - Anomaly detection
        ╚════════════════════════════════════════╝
                         │
        ╔════════════════════════════════════════╗
        ║   LAYER 5: RUNTIME MONITORING          │
        ║   - Watch for suspicious behavior
        ║   - Monitor network activity
        ║   - Track file access
        ╚════════════════════════════════════════╝
                         │
                    SAFE OUTPUT
```

---

## 1️⃣ LAYER 1: Input Validation & Sanitization

**Purpose**: Prevent malicious input from entering the system

### Implementation
```javascript
import { configValidator } from './util/configValidator.js';
import { inputParser } from './util/inputParser.js';

// Validate all inputs
const userInput = parseArguments(process.argv).input;

// Check for suspicious patterns
if (userInput.includes('eval') || userInput.includes('require')) {
  throw new Error('Suspicious input detected');
}

// Sanitize special characters
const sanitized = userInput
  .replace(/[<>{}]/g, '')  // Remove potentially dangerous characters
  .substring(0, 1000);     // Limit length to prevent DoS
```

### What It Catches
- ✅ Command injection attempts: `npm start "'; rm -rf /"`
- ✅ Code injection: `npm start "eval(maliciousCode)"`
- ✅ Path traversal: `npm start "../../etc/passwd"`

---

## 2️⃣ LAYER 2: Request Refiner Analysis

**Purpose**: Analyze request intent and identify suspicious patterns

### Implementation
```javascript
// In requestRefinerAgent.js
async orchestrate(options) {
  const { userInput } = options;
  
  // Check for known attack patterns
  const suspiciousKeywords = [
    'delete user',      // Potential data manipulation
    'steal data',       // Explicit theft intent
    'hack',             // Attack language
    'virus',            // Malicious intent
    'backdoor',         // Persistence attempt
    'keylogger',        // Data exfiltration
  ];
  
  if (suspiciousKeywords.some(kw => userInput.includes(kw))) {
    throw new Error('Request contains suspicious intent');
  }
  
  // Analyze scope
  if (userInput.includes('access all files') || 
      userInput.includes('system admin')) {
    this.warn('Request may require elevated privileges');
  }
}
```

### What It Catches
- ✅ Explicit malicious intent in request
- ✅ Requests for excessive permissions
- ✅ Suspicious keywords associated with attacks

---

## 3️⃣ LAYER 3: Security Hardening Agent

**Purpose**: Generate only secure code, remove malicious patterns before code even exists

### Implementation
```javascript
// In securityHardeningAgent.js
async orchestrate(options) {
  const { userInput, agents } = options;
  
  // Get code from other agents
  const generatedCode = await agents.backend.orchestrate(options);
  
  // SCAN FOR THREATS
  const threats = this.scanForMaliciousPatterns(generatedCode);
  
  if (threats.length > 0) {
    // REJECT and regenerate
    this.error(`Found ${threats.length} security issues`);
    return this.regenerateWithFix(userInput, threats);
  }
  
  // RE-WRITE unsafe code
  const hardened = this.hardenCode(generatedCode);
  
  // VERIFY security of final output
  const verification = this.verifySecurePatterns(hardened);
  
  return {
    output: hardened,
    verification,
    threats: []
  };
}

hardenCode(code) {
  return code
    // Remove eval()
    .replace(/eval\s*\(/g, '__BLOCKED_EVAL__')
    // Fix SQL injection vulnerabilities
    .replace(/execute\s*\(\s*`SELECT.*\$\{/g, 'execute(parameterized(`SELECT')
    // Remove hardcoded credentials
    .replace(/password\s*:\s*['"][^'"]+['"]/g, 'password: process.env.PASSWORD')
    // Fix path traversal
    .replace(/require\s*\(\s*path\s*\+\s*/g, 'require(validatePath(path +') 
    // Prevent excessive permissions
    .replace(/fs\.chmod\s*\(\s*['"][^'"]+['"]\s*,\s*0777\s*\)/g, 'fs.chmod(..., 0755)')
}

scanForMaliciousPatterns(code) {
  const patterns = {
    dataExfiltration: /fetch.*exfil|send.*password|post.*secret/gi,
    commandInjection: /exec\s*\(|spawn\s*\(/gi,
    privilegeEscalation: /sudo|chmod.*777/gi,
    cryptominers: /crypto\.subtle|worker\.js/gi,
  };
  
  const threats = [];
  Object.entries(patterns).forEach(([type, regex]) => {
    if (regex.test(code)) {
      threats.push({ type, pattern: regex.source });
    }
  });
  return threats;
}
```

### What It Catches & Prevents
- ✅ Code injection (eval, Function constructor)
- ✅ SQL injection vulnerabilities
- ✅ Hardcoded credentials
- ✅ Path traversal attacks
- ✅ Privilege escalation attempts
- ✅ Remote code execution patterns
- ✅ Data exfiltration code
- ✅ Command injection

---

## 4️⃣ LAYER 4: Code Scanning

**Purpose**: Static analysis and threat detection before code is used

### SecurityScanner Implementation

```javascript
import { SecurityScanner } from './src/security/securityScanner.js';

// Scan generated code
const scanner = new SecurityScanner(logger);

const results = await scanner.scanGeneratedCode('./output/MyProject');

// Results structure
{
  projectDir: './output/MyProject',
  safe: true,              // No threats found
  threatCount: 0,
  threats: [
    {
      file: 'src/api.js',
      line: 42,
      category: 'SQL_INJECTION',
      severity: 'CRITICAL',
      pattern: "db.query(`SELECT * FROM users WHERE id = ${userId}`)"
    }
  ],
  scannedFiles: 25,
  scanDate: '2026-02-19T...'
}
```

### Threat Detection Categories

| Category | Detects | Examples |
|----------|---------|----------|
| **Data Exfiltration** | Data theft patterns | fetch() to external servers, base64 encoding |
| **Command Injection** | Code execution | eval(), exec(), spawn() |
| **Privilege Escalation** | Mode changes | chmod 777, sudo access |
| **File System Abuse** | Unauthorized file ops | Writing to /etc/, path traversal |
| **Cryptominers** | Resource abuse | Crypto workers, CPU-heavy loops |
| **Backdoors** | Persistence mechanisms | Hidden eval, prototype pollution |
| **Suspicious Comments** | Intent indicators | "// steal data", "// backdoor" |

### Severity Levels
- 🔴 **CRITICAL** - Immediate threat, prevents deployment
- 🟠 **HIGH** - Serious concern, requires review
- 🟡 **MEDIUM** - Monitor, consider fixes
- 🟢 **LOW** - Informational only

---

## 5️⃣ LAYER 5: Code Integrity Verification

**Purpose**: Ensure GENIE core files haven't been tampered with

### Implementation

```javascript
import { CodeIntegrityVerifier } from './src/security/securityScanner.js';

const verifier = new CodeIntegrityVerifier(logger);

// Store checksums of critical files
verifier.storeChecksums('.');

// LATER: Verify nothing changed
const verification = verifier.verifyChecksums('.');

if (!verification.verified) {
  // ALERT: Files have been modified!
  verification.issues.forEach(issue => {
    console.error(`🔴 ${issue.file} has been tampered with`);
  });
  process.exit(1);
}
```

### Checked Files
- ✅ src/index.js
- ✅ src/workflow.js
- ✅ src/orchestrator.js
- ✅ package.json
- ✅ All core agents

---

## 6️⃣ LAYER 6: Runtime Behavior Monitoring

**Purpose**: Watch for suspicious behavior during runtime

### Implementation

```javascript
import { RuntimeBehaviorMonitor } from './src/security/securityScanner.js';

const monitor = new RuntimeBehaviorMonitor(logger);

// Track suspicious behaviors
monitor.monitorBehavior({
  outgoingRequests: [
    { url: 'https://malxious-site.com/steal' }  // BLOCKED
  ],
  fileAccess: [
    { path: '/etc/passwd' }                      // BLOCKED
  ],
  processExecution: [
    { command: 'rm -rf /' }                      // BLOCKED
  ]
});

const summary = monitor.getSummary();
//  {
//   totalSuspiciousBehaviors: 3,
//   critical: 3,
//   behaviors: [...]
//  }
```

---

## 🛡️ Dependency Security

### Check for Vulnerable Dependencies

```javascript
import { DependencyVerifier } from './src/security/securityScanner.js';

const verifier = new DependencyVerifier(logger);

// Check for known vulnerabilities
const vulnReport = await verifier.checkDependencies('package.json');

if (vulnReport.vulnerablePackages > 0) {
  console.error('⚠️  Vulnerable dependencies found');
  vulnReport.vulnerabilities.forEach(v => {
    console.error(`  ${v.package}: ${v.vulnerability.id}`);
  });
}
```

### Recommended Tools
```bash
# Check for npm vulnerabilities
npm audit

# Using Snyk
npm install -g snyk
snyk test

# Using OWASP
npm audit --audit-level=moderate

# Using safety (Python dependencies)
safety check
```

---

## 🚨 How to Detect Threats

### Method 1: Run Security Scan
```bash
# Create a scan script
cat > src/runSecurityScan.js << 'EOF'
import { SecurityScanner } from './security/securityScanner.js';

const scanner = new SecurityScanner();
const results = await scanner.scanGenieSystem('.');
const report = scanner.generateReport(results);
scanner.printReport(report);

if (results.threatCount > 0) {
  process.exit(1);
}
EOF

# Run it
node src/runSecurityScan.js
```

### Method 2: Verify Generated Code
```bash
# Add to package.json scripts
"scan": "node verify-security.js"

npm run scan
```

### Method 3: Continuous Monitoring
```javascript
// Watch for file changes and rescan
import chokidar from 'chokidar';
import { SecurityScanner } from './src/security/securityScanner.js';

const scanner = new SecurityScanner(logger);

chokidar.watch('output/**/*.js').on('change', async (path) => {
  const results = await scanner.scanFile(path, true);
  if (results.length > 0) {
    logger.error({}, `🚨 Threats detected in ${path}`);
  }
});
```

---

## 📋 Manual Code Review Checklist

**Before using any generated code, verify:**

### Security Checklist
- ☐ No `eval()` or `Function()` constructors
- ☐ No `require()` with user input
- ☐ All database queries use parameterized queries
- ☐ No hardcoded passwords or API keys
- ☐ File paths sanitized (no path traversal)
- ☐ No shell command execution (`exec()`, `spawn()`)
- ☐ Input properly validated and sanitized
- ☐ Output properly escaped for context (HTML, SQL, etc.)
- ☐ Proper authentication and authorization checks
- ☐ No overly permissive file permissions (chmod 777)
- ☐ HTTPS used for all external communication
- ☐ No client-side logic revealing sensitive data
- ☐ CORS properly configured (not `*`)
- ☐ Cookies marked Secure, HttpOnly, SameSite
- ☐ Rate limiting in place for endpoints

### Dependency Checklist
- ☐ All dependencies are from official npm registry
- ☐ No typosquatted packages (npm install lodash, not loadash)
- ☐ Dependency versions pinned or carefully managed
- ☐ No dependencies with known security vulnerabilities
- ☐ Dev dependencies don't include suspicious packages
- ☐ Package-lock.json is checked in version control

---

## 🔑 Best Practices

### 1. Always Scan Before Deployment
```bash
npm audit
npm run scan
npm test
```

### 2. Pin Dependency Versions
```json
{
  "dependencies": {
    "express": "4.18.2",      // Pinned
    "lodash": "^4.17.21"      // Range acceptable
  }
}
```

### 3. Use Environment Variables for Secrets
```javascript
// ❌ WRONG
const dbPassword = "super-secret-123";

// ✅ RIGHT
const dbPassword = process.env.DB_PASSWORD;
```

### 4. Validate All Input
```javascript
// ❌ WRONG
const userId = req.params.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ RIGHT
const userId = parseInt(req.params.id, 10);
if (!Number.isInteger(userId)) throw new Error('Invalid ID');
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 5. Keep Dependencies Updated
```bash
# Check for updates
npm outdated

# Update safely
npm update

# Major updates
npm install -g npm-check-updates
ncu -u
npm install
```

---

## 🔍 Common Attack Patterns GENIE Prevents

### Attack 1: Code Injection
```javascript
// ❌ Dangerous (GENIE prevents)
eval(userInput)
new Function(userInput)

// ✅ GENIE generates
const result = parser.parse(userInput);
```

### Attack 2: SQL Injection
```javascript
// ❌ Dangerous (GENIE prevents)
db.query(`SELECT * FROM users WHERE email='${email}'`)

// ✅ GENIE generates
db.query('SELECT * FROM users WHERE email = $1', [email])
```

### Attack 3: Path Traversal
```javascript
// ❌ Dangerous (GENIE prevents)
fs.readFile(path.join('/uploads', userPath))

// ✅ GENIE generates
const safePath = path.resolve('/uploads', userPath);
if (!safePath.startsWith('/uploads/')) throw new Error('Invalid path');
fs.readFile(safePath)
```

### Attack 4: XSS (Cross-Site Scripting)
```javascript
// ❌ Dangerous (GENIE prevents)
html = `<div>${userContent}</div>`

// ✅ GENIE generates
html = `<div>${escapeHtml(userContent)}</div>`
```

### Attack 5: Credential Hardcoding
```javascript
// ❌ Dangerous (GENIE prevents)
const apiKey = "sk-1234567890"

// ✅ GENIE generates
const apiKey = process.env.API_KEY
```

---

## 📊 Security Scan Output Example

```
╔════════════════════════════════════════════════════╗
║            SECURITY SCAN REPORT                     ║
╚════════════════════════════════════════════════════╝

Overall Security: ✅ PASS
Scanned Files: 25

Threats Found:
  🔴 Critical: 0
  🟠 High: 0
  🟡 Medium: 0

✨ System is secure and ready for deployment
```

### If Threats Are Found
```
🔴 Critical: 2
  ❌ src/api.js:42
     SQL_INJECTION: db.query(`SELECT * FROM users WHERE id = ${userId}`)

  ❌ src/auth.js:15
     COMMAND_INJECTION: exec(`openssl dgst ${file}`)

🟠 High: 1
  ⚠️ src/config.js:8
     HARDCODED_CREDENTIAL: password: 'admin123'

⛔ DEPLOYMENT BLOCKED: Fix security issues before proceeding
```

---

## 🎓 Learning Resources

### Official Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

### Tools
- **npm audit** - Check for vulnerabilities
- **Snyk** - Continuous vulnerability detection
- **ESLint security plugins** - Catch code issues
- **OWASP ZAP** - Web app security scanner

### Practice
- Review generated code thoroughly
- Ask for explanations of security choices
- Test with security-focused inputs
- Participate in security audits

---

## 🚨 What to Do If You Find a Vulnerability

### Immediate Actions
1. **Stop using the vulnerable code**
2. **Document the vulnerability** (file, line, type)
3. **Create a GitHub issue** with:
   - Severity level
   - Reproduction steps
   - Expected vs actual behavior
   - Suggested fix

### Reporting Process
```bash
# 1. Isolate the issue
git branch security-issue/<issue-name>

# 2. Create a minimal test case
# 3. Document findings
# 4. Submit issue with details
# 5. Do NOT publicly disclose until fix is released
```

---

## ✅ Security Verification Checklist for Deployed Code

Before going to production:

- ☐ Ran security scan: `npm audit`
- ☐ Ran GENIE security: `npm run scan`
- ☐ Code review completed
- ☐ All dependencies up to date
- ☐ No hardcoded secrets
- ☐ Environment variables configured
- ☐ HTTPS enabled
- ☐ Authentication implemented
- ☐ Authorization checks in place
- ☐ Input validation enabled
- ☐ Output escaping enabled
- ☐ Rate limiting configured
- ☐ Error handling doesn't leak info
- ☐ Logging doesn't contain secrets
- ☐ File permissions reviewed
- ☐ Database queries parameterized
- ☐ Security headers configured
- ☐ CORS properly configured
- ☐ CSP (Content Security Policy) set
- ☐ Dependencies have no known vulnerabilities

---

**Remember**: Security is not a one-time task—it's continuous monitoring and improvement! 🛡️

