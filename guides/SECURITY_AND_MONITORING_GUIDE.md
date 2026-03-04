# 🔒 Security & Monitoring Agents - Complete Guide

## Overview

Two powerful production-support agents enable comprehensive security hardening and monitoring infrastructure:

- **SecurityHardeningAgent** - Security audits, vulnerability fixes, and hardening
- **MonitoringAgent** - Logging, metrics, alerting, and observability

Together they transform generated applications from basic code into **production-ready systems** with enterprise-grade security and operational visibility.

---

## 🔐 SecurityHardeningAgent

### Purpose
Audits generated code for security vulnerabilities and automatically applies hardening measures following OWASP guidelines.

### Capabilities

**Scanning:**
- Detects OWASP Top 10 vulnerabilities
- Identifies weak authentication patterns
- Finds data exposure risks
- Checks for injection vulnerabilities
- Validates input handling

**Hardening:**
- Implements security headers (HSTS, CSP, X-Frame-Options, etc)
- Adds rate limiting on auth endpoints
- Encrypts sensitive data
- Implements RBAC enforcement
- Sets up audit logging

**Documentation:**
- Generates security guide
- Documents best practices
- Lists compliance mappings
- Provides implementation checklists

### Generated Files

```
src/security/
├── middleware.js           ← Security headers, rate limiting, CORS
├── utilities.js            ← Encryption, hashing, token management
├── env-config.js          ← Security environment configuration
├── secrets.js             ← Secrets manager
├── headers.js             ← HTTP security headers
├── validation.js          ← Input validation & sanitization
├── audit.js               ← Audit logging
└── SECURITY.md            ← Complete security documentation
```

### Usage

```javascript
import { SecurityHardeningAgent } from './src/agents/securityHardeningAgent.js';

const agentRequest = {
  type: 'application',
  description: 'E-commerce platform with JWT auth',
  features: ['email-verification', 'password-reset', 'rbac']
};

const agent = new SecurityHardeningAgent({ logger, multiLlmSystem });
const result = await agent.hardenApplication(agentRequest);

// result.patches contains all security files ready to write
```

### Security Features Implemented

#### Authentication Security
```javascript
// Generated: src/security/utilities.js
import { hashPassword, generateJWT, verifyJWT } from './security/utilities.js';

// Bcrypt with 12 rounds
const hashedPassword = await hashPassword(userPassword);

// JWT with expiration
const token = generateJWT({ userId: user.id }, '15m');
```

#### Input Validation
```javascript
// Prevent SQL injection, XSS, CSRF
import { validateInput, sanitizeInput } from './security/validation.js';

const errors = validateInput(req.body, {
  email: { type: 'string', pattern: emailRegex },
  password: { minLength: 12, custom: validatePasswordStrength }
});

const clean = sanitizeInput(userInput);
```

#### Security Middleware
```javascript
// Generated: src/security/middleware.js
import { applySecurityMiddleware } from './security/middleware.js';

app.use(express.json());
applySecurityMiddleware(app);

// Now includes:
// - Helmet (security headers)
// - Rate limiting
// - CORS config
// - CSRF protection
// - Data sanitization
```

#### Audit Logging
```javascript
// Track all security events
import { auditLogger } from './security/audit.js';

auditLogger.logAuthEvent('login_success', userId, details, ip, userAgent);
auditLogger.logAuthorizationEvent('access_denied', userId, resource, action);

// Query audit logs
const failedLogins = auditLogger.getAuditLogs({
  eventType: 'AUTH_FAILED',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
});
```

#### OWASP Top 10 Protection

| Vulnerability | Status | Implementation |
|---|---|---|
| Injection | ✅ | Input validation, parameterized queries |
| Broken Auth | ✅ | JWT, bcrypt, rate limiting |
| XSS | ✅ | Input sanitization, CSP headers |
| CSRF | ✅ | CSRF tokens, same-site cookies |
| Bad Config | ✅ | Environment validation |
| Data Exposure | ✅ | Encryption, HTTPS enforcement |
| XXE | ✅ | Input validation |
| Bad Access Control | ✅ | RBAC, middleware checks |
| Components | ⚠️ | Keep dependencies updated |
| Logging | ✅ | Comprehensive audit logging |

---

## 📊 MonitoringAgent

### Purpose
Sets up comprehensive monitoring including logging, metrics, alerting, and performance tracking.

### Capabilities

**Logging:**
- Structured logging with Winston
- Multiple log levels (fatal, error, warn, info, debug, trace)
- Log rotation and retention
- Log aggregation ready

**Metrics:**
- Request/response metrics
- Database performance
- Error tracking
- Memory and CPU monitoring
- Custom business metrics

**Health Checks:**
- Liveness probes (is app running?)
- Readiness probes (can it serve requests?)
- Detailed health reports
- Kubernetes integration

**Alerting:**
- Configurable alert rules
- Multiple severity levels
- Alert channels (email, Slack, PagerDuty)
- Real-time monitoring

**Dashboards:**
- Grafana dashboard configuration
- Prometheus metrics export
- Real-time visualization
- Performance trends

### Generated Files

```
src/monitoring/
├── logger.js              ← Structured logging with Winston
├── metrics.js             ← Metrics collection and tracking
├── health.js              ← Health checks and probes
├── performance.js         ← Performance monitoring
├── errors.js              ← Error tracking and analysis
├── alerts.js              ← Alerting rules and engine
├── prometheus.js          ← Prometheus metrics exporter
├── config.js              ← Monitoring configuration
├── MONITORING.md          ← Complete monitoring guide
└── docker-compose.yml     ← Full monitoring stack
```

### Usage

```javascript
import { MonitoringAgent } from './src/agents/monitoringAgent.js';

const agentRequest = {
  type: 'application',
  logLevel: 'info',
  retentionDays: 30
};

const agent = new MonitoringAgent({ logger, multiLlmSystem });
const result = await agent.setupMonitoring(agentRequest);

// result.patches contains all monitoring files
```

### Logging Setup

```javascript
import { logger } from './src/monitoring/logger.js';

// Structured logging with context
logger.info('User subscribed', {
  userId: user.id,
  plan: 'premium',
  method: 'credit_card'
});

logger.error('Payment failed', {
  userId: user.id,
  error: err.message,
  code: err.code,
  retryable: err.retryable
});

logger.warn('High memory usage', {
  usage: process.memoryUsage(),
  threshold: '85%'
});

// Logs go to:
// - logs/error.log (errors only)
// - logs/warnings.log (warnings+)
// - logs/combined.log (everything)
// - logs/info.log (info+)
// - Console in development
```

### Metrics Collection

```javascript
import { metricsCollector } from './src/monitoring/metrics.js';

// Track HTTP request
metricsCollector.incrementCounter('http_requests_total');
metricsCollector.recordHistogram('http_request_duration_ms', 245);

// Track database
metricsCollector.recordHistogram('db_query_duration_ms', 125);
if (error) metricsCollector.incrementCounter('db_errors_total');

// Get snapshot
const metrics = metricsCollector.getMetrics();
console.log(metrics.http_request_duration_ms.p95); // p95 latency
```

### Health Checks

```javascript
import { healthChecker } from './src/monitoring/health.js';

// Liveness endpoint - is it running?
app.get('/health/live', async (req, res) => {
  const status = await healthChecker.getLiveness();
  res.json(status);
});

// Readiness endpoint - can it handle requests?
app.get('/health/ready', async (req, res) => {
  const status = await healthChecker.getReadiness();
  res.status(status.status === 'ready' ? 200 : 503).json(status);
});

// Full health report
app.get('/health', async (req, res) => {
  const report = await healthChecker.getHealthReport();
  res.json(report);
});
```

### Performance Tracking

```javascript
import PerformanceMonitor from './src/monitoring/performance.js';

// Add middleware
app.use(PerformanceMonitor.middleware());

// Measure operations
const user = await PerformanceMonitor.measureAsync(
  'fetch-user',
  () => User.findById(id)
);

// Performance report
const report = PerformanceMonitor.getPerformanceReport();
console.log(report.requests.p95ResponseTime); // ms
```

### Error Tracking

```javascript
import { errorTracker } from './src/monitoring/errors.js';

// Track errors
try {
  // something
} catch (error) {
  const errorId = errorTracker.trackError(error, {
    userId: req.user?.id,
    operation: 'create-order'
  });
  
  res.status(500).json({
    error: 'Internal error',
    id: errorId // For customer support reference
  });
}

// Error report
const report = errorTracker.getErrorReport('24h');
console.log(report.topErrors); // Most common ones
console.log(report.bySeverity); // Grouped by severity
```

### Alerting Rules

```javascript
import { alertingEngine } from './src/monitoring/alerts.js';

// Start monitoring with rules
alertingEngine.startMonitoring(60); // Check every 60 seconds

// Built-in rules:
// - High error rate (>5%)
// - Slow responses (p95 > 1000ms)
// - High memory (>85%)
// - Database errors (>5/min)
// - Service down (<5 min uptime)

// Get alerts
const recentAlerts = alertingEngine.getRecentAlerts(50);
const criticalAlerts = alertingEngine.getAlertsBySeverity('critical');
```

### Prometheus Metrics

```javascript
// Metrics available at /metrics endpoint
import PrometheusExporter from './src/monitoring/prometheus.js';

app.get('/metrics', PrometheusExporter.middleware());

// Query with Prometheus:
// rate(http_requests_total[5m])
// histogram_quantile(0.95, http_request_duration_ms)
// app_memory_usage_bytes
// rate(app_errors_total[1m])
```

### Full Monitoring Stack

Start the complete monitoring infrastructure:

```bash
# Start all services (Prometheus, Grafana, AlertManager, Node Exporter)
docker-compose -f monitoring/docker-compose.yml up -d

# Access:
# Grafana:     http://localhost:3001 (admin/admin)
# Prometheus:  http://localhost:9090
# AlertManager: http://localhost:9093
# Metrics:     http://localhost:3000/metrics
```

---

## 🎯 Complete Security + Monitoring Stack

### Combined Usage

```javascript
import { DatabaseArchitectAgent } from './agents/databaseArchitectAgent.js';
import { UserAuthAgent } from './agents/userAuthAgent.js';
import { ApiIntegrationAgent } from './agents/apiIntegrationAgent.js';
import { SecurityHardeningAgent } from './agents/securityHardeningAgent.js';
import { MonitoringAgent } from './agents/monitoringAgent.js';

// Step 1: Design database
const dbAgent = new DatabaseArchitectAgent({ logger, multiLlmSystem });
const dbResult = await dbAgent.designSchema({
  description: 'E-commerce with users/products/orders'
});
// Files: Prisma schema, SQL, types, migrations

// Step 2: Add authentication
const authAgent = new UserAuthAgent({ logger, multiLlmSystem });
const authResult = await authAgent.generateAuthSystem({
  features: ['email-verification', 'password-reset', 'rbac']
});
// Files: Auth routes, middleware, email service, RBAC

// Step 3: Create API client
const apiAgent = new ApiIntegrationAgent({ logger, multiLlmSystem });
const apiResult = await apiAgent.generateApiClient({
  framework: 'react',
  endpoints: ['users', 'products', 'orders']
});
// Files: React hooks, types, client, error handling

// Step 4: Harden security
const secAgent = new SecurityHardeningAgent({ logger, multiLlmSystem });
const secResult = await secAgent.hardenApplication({
  description: 'E-commerce platform'
});
// Files: Security middleware, utilities, validation, audit logging

// Step 5: Setup monitoring
const monAgent = new MonitoringAgent({ logger, multiLlmSystem });
const monResult = await monAgent.setupMonitoring({
  logLevel: 'info',
  retentionDays: 30
});
// Files: Logger, metrics, health checks, alerting, Prometheus, Grafana

// Result: Production-ready application with:
// ✅ Database schema
// ✅ Authentication system
// ✅ Type-safe frontend integration
// ✅ Security hardening
// ✅ Monitoring & alerting
```

### Integration with Express

```javascript
import express from 'express';
import { logger } from './src/monitoring/logger.js';
import { applySecurityMiddleware } from './src/security/middleware.js';
import PerformanceMonitor from './src/monitoring/performance.js';
import { healthChecker } from './src/monitoring/health.js';
import PrometheusExporter from './src/monitoring/prometheus.js';
import { errorTracker } from './src/monitoring/errors.js';

const app = express();

// 1. Security middleware
app.use(express.json());
applySecurityMiddleware(app);

// 2. Performance monitoring
app.use(PerformanceMonitor.middleware());

// 3. Health endpoints
app.get('/health/live', async (req, res) => {
  const status = await healthChecker.getLiveness();
  res.json(status);
});

app.get('/health/ready', async (req, res) => {
  const status = await healthChecker.getReadiness();
  res.status(status.status === 'ready' ? 200 : 503).json(status);
});

// 4. Metrics endpoint
app.get('/metrics', PrometheusExporter.middleware());

// 5. Your routes with logging
app.post('/api/users', (req, res) => {
  logger.info('Creating user', { email: req.body.email });
  
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    const errorId = errorTracker.trackError(error, {
      endpoint: '/api/users'
    });
    logger.error('User creation failed', { errorId, error: error.message });
    res.status(500).json({ error: 'Internal error', id: errorId });
  }
});

// 6. Error handling middleware
app.use((err, req, res, next) => {
  errorTracker.trackHttpError(req, res.statusCode, err);
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
});
```

---

## 📋 Key Metrics to Monitor

### Performance Metrics
- Request rate (requests/second)
- Response times (p50, p95, p99)
- Error rate (%)
- Database query performance
- Memory usage (%)
- CPU usage (%)

### Business Metrics
- User signups/day
- Transaction success rate
- Revenue/day
- API calls/day
- Cache hit rate

### Security Metrics
- Failed login attempts
- Authorization denials
- Suspicious patterns detected
- Security events triggered
- Audit log entries

---

## 🚀 Deployment Checklist

- [ ] Generate all 5 agents (database, auth, api, security, monitoring)
- [ ] Review generated security documentation
- [ ] Configure environment variables (.env)
- [ ] Generate new secrets: JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY
- [ ] Set up Monitoring stack: `docker-compose up -d`
- [ ] Test health endpoints: `/health/live`, `/health/ready`, `/health`
- [ ] Verify metrics: `/metrics` returns valid Prometheus output
- [ ] Configure alerting rules (email, Slack, PagerDuty)
- [ ] Set up log aggregation (ELK, Loki, Splunk)
- [ ] Enable HTTPS/TLS certificates
- [ ] Run security audit
- [ ] Load test and establish baseline metrics
- [ ] Deploy to production with monitoring enabled

---

## 📞 Support Commands

```bash
# See generated files
ls -la src/security/
ls -la src/monitoring/

# Test health endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/health

# Export metrics
curl http://localhost:3000/metrics | head -20

# Check logs
tail -f logs/combined.log
tail -f logs/error.log

# Start monitoring stack
docker-compose -f monitoring/docker-compose.yml up -d

# View Grafana dashboards
open http://localhost:3001
```

---

**Status:** ✅ Security & Monitoring Infrastructure Ready

Your application now has:
- ✅ Enterprise-grade security hardening
- ✅ Comprehensive monitoring & observability
- ✅ Production-ready infrastructure
- ✅ OWASP compliance
- ✅ Real-time alerting
- ✅ Audit logging
- ✅ Performance tracking
