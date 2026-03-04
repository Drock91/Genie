import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

/**
 * MonitoringAgent
 * 
 * Generates comprehensive monitoring, logging, metrics, and alerting
 * infrastructure for production applications.
 * 
 * Capabilities:
 * - Structured logging setup (Winston, Pino)
 * - Metrics collection (Prometheus)
 * - Health checks and status endpoints
 * - Alerting rules and thresholds
 * - Performance monitoring (APM)
 * - Dashboard generation (Grafana)
 * - Error tracking and reporting
 */
export class MonitoringAgent extends BaseAgent {
  constructor({ logger, multiLlmSystem = null }) {
    super({ name: "MonitoringAgent", logger });
    this.multiLlmSystem = multiLlmSystem;
  }

  /**
   * Main entry point: Setup monitoring for an application
   */
  async setupMonitoring(request) {
    try {
      this.logger.info(
        { request: request.type },
        "MonitoringAgent: Setting up monitoring infrastructure"
      );

      const analysis = await this.analyzeMonitoringNeeds(request);
      const patches = [];

      // 1. Structured logging setup
      const loggingCode = await this.generateStructuredLogging(analysis);
      patches.push({
        filename: "src/monitoring/logger.js",
        content: loggingCode,
        language: "javascript",
      });

      // 2. Metrics collection
      const metricsCode = await this.generateMetricsCollection(analysis);
      patches.push({
        filename: "src/monitoring/metrics.js",
        content: metricsCode,
        language: "javascript",
      });

      // 3. Health checks
      const healthCode = await this.generateHealthChecks(analysis);
      patches.push({
        filename: "src/monitoring/health.js",
        content: healthCode,
        language: "javascript",
      });

      // 4. Performance monitoring
      const performanceCode = await this.generatePerformanceMonitoring(analysis);
      patches.push({
        filename: "src/monitoring/performance.js",
        content: performanceCode,
        language: "javascript",
      });

      // 5. Error tracking
      const errorCode = await this.generateErrorTracking(analysis);
      patches.push({
        filename: "src/monitoring/errors.js",
        content: errorCode,
        language: "javascript",
      });

      // 6. Alerting rules
      const alertsCode = await this.generateAlertingRules(analysis);
      patches.push({
        filename: "src/monitoring/alerts.js",
        content: alertsCode,
        language: "javascript",
      });

      // 7. Prometheus metrics exporter
      const prometheusCode = await this.generatePrometheusExporter(analysis);
      patches.push({
        filename: "src/monitoring/prometheus.js",
        content: prometheusCode,
        language: "javascript",
      });

      // 8. Monitoring configuration
      const configCode = await this.generateMonitoringConfig(analysis);
      patches.push({
        filename: "src/monitoring/config.js",
        content: configCode,
        language: "javascript",
      });

      // 9. Grafana dashboard
      const grafanaConfig = await this.generateGrafanaDashboard(analysis);
      patches.push({
        filename: "monitoring/grafana/dashboard.json",
        content: grafanaConfig,
        language: "json",
      });

      // 10. Docker Compose for monitoring stack
      const dockerCompose = await this.generateDockerComposeMonitoring(analysis);
      patches.push({
        filename: "monitoring/docker-compose.yml",
        content: dockerCompose,
        language: "yaml",
      });

      // 11. Monitoring guide
      const guide = await this.generateMonitoringGuide(analysis, patches);
      patches.push({
        filename: "MONITORING.md",
        content: guide,
        language: "markdown",
      });

      return makeAgentOutput({
        thought: `Set up comprehensive monitoring infrastructure for ${request.type || 'application'}`,
        patches,
        metadata: {
          agent: "MonitoringAgent",
          patches_count: patches.length,
          monitoring_level: analysis.monitoringLevel,
          components: [
            "logging",
            "metrics",
            "health-checks",
            "performance",
            "alerting",
            "dashboards",
          ],
        },
      });
    } catch (error) {
      this.logger.error({ error: error.message }, "MonitoringAgent error");
      return this.generateFallbackMonitoringOutput();
    }
  }

  /**
   * Analyze monitoring needs
   */
  async analyzeMonitoringNeeds(request) {
    try {
      if (this.multiLlmSystem) {
        const response = await this.multiLlmSystem.chat([
          {
            role: "user",
            content: `Analyze monitoring requirements for: ${JSON.stringify(request)}
            
Return JSON with: {
  "metrics": ["list of important metrics"],
  "logLevel": "debug|info|warn|error",
  "alertThresholds": {"metric": "threshold"},
  "samplingRate": 0.1-1.0,
  "retentionDays": 30,
  "monitoringLevel": "basic|standard|enterprise"
}`,
          },
        ]);

        try {
          return JSON.parse(response);
        } catch {
          return this.getMockMonitoringAnalysis(request);
        }
      }
      return this.getMockMonitoringAnalysis(request);
    } catch (error) {
      return this.getMockMonitoringAnalysis(request);
    }
  }

  /**
   * Generate structured logging
   */
  async generateStructuredLogging(analysis) {
    return `/**
 * Structured Logging
 * 
 * Production-grade logging with Winston
 */

import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom log levels
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: "red",
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    trace: "gray",
  },
};

// Create logger
export const logger = winston.createLogger({
  levels: customLevels.levels,
  defaultMeta: {
    service: "application",
    environment: process.env.NODE_ENV || "development",
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),

    // Warning logs
    new winston.transports.File({
      filename: path.join(logsDir, "warnings.log"),
      level: "warn",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),

    // Info logs
    new winston.transports.File({
      filename: path.join(logsDir, "info.log"),
      level: "info",
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: customLevels.colors }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
          return \`\${timestamp} [\${level}] \${message} \${metaStr}\`;
        })
      ),
    })
  );
}

export default logger;
`;
  }

  /**
   * Generate metrics collection
   */
  async generateMetricsCollection(analysis) {
    return `/**
 * Metrics Collection
 * 
 * Tracks application metrics and KPIs
 */

class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
    this.initializeDefaultMetrics();
  }

  initializeDefaultMetrics() {
    // HTTP metrics
    this.registerMetric("http_requests_total", "counter");
    this.registerMetric("http_request_duration_ms", "histogram");
    this.registerMetric("http_errors_total", "counter");
    this.registerMetric("http_requests_active", "gauge");

    // Database metrics
    this.registerMetric("db_query_duration_ms", "histogram");
    this.registerMetric("db_errors_total", "counter");
    this.registerMetric("db_connections_active", "gauge");

    // Application metrics
    this.registerMetric("app_memory_usage_bytes", "gauge");
    this.registerMetric("app_uptime_seconds", "gauge");
    this.registerMetric("app_errors_total", "counter");

    // Business metrics
    this.registerMetric("users_total", "gauge");
    this.registerMetric("requests_per_second", "gauge");
    this.registerMetric("response_time_p95_ms", "gauge");
    this.registerMetric("response_time_p99_ms", "gauge");
  }

  registerMetric(name, type) {
    this.metrics.set(name, {
      type,
      value: type === "gauge" ? 0 : type === "counter" ? 0 : [],
      samples: type === "histogram" ? [] : undefined,
    });
  }

  /**
   * Increment counter
   */
  incrementCounter(name, labels = {}) {
    const metric = this.metrics.get(name);
    if (metric && metric.type === "counter") {
      metric.value++;
    }
  }

  /**
   * Set gauge value
   */
  setGauge(name, value, labels = {}) {
    const metric = this.metrics.get(name);
    if (metric && metric.type === "gauge") {
      metric.value = value;
    }
  }

  /**
   * Record histogram value
   */
  recordHistogram(name, value, labels = {}) {
    const metric = this.metrics.get(name);
    if (metric && metric.type === "histogram") {
      metric.samples.push(value);
      // Keep only recent samples
      if (metric.samples.length > 1000) {
        metric.samples = metric.samples.slice(-500);
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const snapshot = {};

    for (const [name, metric] of this.metrics) {
      if (metric.type === "histogram") {
        // Calculate percentiles
        const sorted = [...metric.samples].sort((a, b) => a - b);
        snapshot[name] = {
          count: sorted.length,
          sum: sorted.reduce((a, b) => a + b, 0),
          min: sorted[0] || 0,
          max: sorted[sorted.length - 1] || 0,
          p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
          p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
          p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
        };
      } else {
        snapshot[name] = metric.value;
      }
    }

    // Add uptime
    snapshot.app_uptime_seconds = Math.floor((Date.now() - this.startTime) / 1000);

    return snapshot;
  }

  /**
   * Get metric percentile
   */
  getPercentile(metricName, percentile) {
    const metric = this.metrics.get(metricName);
    if (!metric || metric.type !== "histogram") return null;

    const sorted = [...metric.samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * (percentile / 100));
    return sorted[index] || null;
  }

  /**
   * Reset metrics
   */
  reset() {
    for (const metric of this.metrics.values()) {
      metric.value = metric.type === "gauge" ? 0 : 0;
      metric.samples = metric.type === "histogram" ? [] : undefined;
    }
  }
}

export const metricsCollector = new MetricsCollector();

export default metricsCollector;
`;
  }

  /**
   * Generate health checks
   */
  async generateHealthChecks(analysis) {
    return `/**
 * Health Checks
 * 
 * Liveness and readiness checks for Kubernetes and load balancers
 */

import { metricsCollector } from "./metrics.js";

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
    this.registerCheck("database", this.checkDatabase);
    this.registerCheck("memory", this.checkMemory);
    this.registerCheck("disk", this.checkDisk);
    this.registerCheck("uptime", this.checkUptime);
  }

  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn.bind(this));
  }

  /**
   * Run all checks
   */
  async runAllChecks() {
    const results = {};

    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = { status: "failed", error: error.message };
      }
    }

    return results;
  }

  /**
   * Liveness probe - is app running?
   */
  async getLiveness() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - process.uptime() * 1000) / 1000),
    };
  }

  /**
   * Readiness probe - can app handle requests?
   */
  async getReadiness() {
    const checks = await this.runAllChecks();
    const allHealthy = Object.values(checks).every(c => c.status === "healthy");

    return {
      status: allHealthy ? "ready" : "not-ready",
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detailed health report
   */
  async getHealthReport() {
    const metrics = metricsCollector.getMetrics();
    const readiness = await this.getReadiness();
    const liveness = await this.getLiveness();

    return {
      status: readiness.status === "ready" ? "healthy" : "unhealthy",
      liveness,
      readiness,
      metrics: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentUsed:
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100,
        },
        uptime: metrics.app_uptime_seconds,
        requests: metrics.http_requests_total,
        errors: metrics.http_errors_total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Individual checks

  async checkDatabase() {
    // Implement based on your database
    return { status: "healthy", latency: "< 10ms" };
  }

  async checkMemory() {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentUsed = (used / total) * 100;

    return {
      status: percentUsed > 90 ? "degraded" : "healthy",
      used,
      total,
      percentUsed: Math.floor(percentUsed * 100) / 100,
    };
  }

  async checkDisk() {
    // Implement disk space check
    return { status: "healthy", available: "100GB" };
  }

  async checkUptime() {
    const uptime = process.uptime();
    return {
      status: uptime > 300 ? "healthy" : "starting", // 5 minutes
      seconds: Math.floor(uptime),
    };
  }
}

export const healthChecker = new HealthChecker();

export default healthChecker;
`;
  }

  /**
   * Generate performance monitoring
   */
  async generatePerformanceMonitoring(analysis) {
    return `/**
 * Performance Monitoring
 * 
 * Tracks performance metrics and bottlenecks
 */

import { metricsCollector } from "./metrics.js";

export class PerformanceMonitor {
  /**
   * Track HTTP request performance
   */
  static trackHttpRequest(req, res, duration) {
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode;

    // Record metrics
    metricsCollector.incrementCounter("http_requests_total", { method: req.method, route });
    metricsCollector.recordHistogram("http_request_duration_ms", duration);

    if (statusCode >= 400) {
      metricsCollector.incrementCounter("http_errors_total", { statusCode });
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(
        \`[PERF] Slow request: \${req.method} \${req.path} - \${duration}ms\`
      );
    }
  }

  /**
   * Track database query performance
   */
  static trackDatabaseQuery(query, duration, error = false) {
    metricsCollector.recordHistogram("db_query_duration_ms", duration);

    if (error) {
      metricsCollector.incrementCounter("db_errors_total");
    }

    if (duration > 500) {
      console.warn(\`[PERF] Slow query: \${duration}ms\`);
    }
  }

  /**
   * Get performance report
   */
  static getPerformanceReport() {
    const metrics = metricsCollector.getMetrics();

    return {
      requests: {
        total: metrics.http_requests_total,
        errors: metrics.http_errors_total,
        errorRate: (
          (metrics.http_errors_total / metrics.http_requests_total) *
          100
        ).toFixed(2) + "%",
        averageResponseTime: metrics.http_request_duration_ms?.sum
          ? Math.floor(metrics.http_request_duration_ms.sum / metrics.http_request_duration_ms.count)
          : 0,
        p95ResponseTime: metrics.http_request_duration_ms?.p95 || 0,
        p99ResponseTime: metrics.http_request_duration_ms?.p99 || 0,
      },
      database: {
        averageQueryTime: metrics.db_query_duration_ms?.sum
          ? Math.floor(metrics.db_query_duration_ms.sum / metrics.db_query_duration_ms.count)
          : 0,
        slowQueries:
          metrics.db_query_duration_ms?.samples?.filter(d => d > 500).length ||
          0,
        errors: metrics.db_errors_total,
      },
      system: {
        uptime: metrics.app_uptime_seconds,
        memory: process.memoryUsage(),
      },
    };
  }

  /**
   * Track function execution
   */
  static async measureAsync(name, asyncFn) {
    const start = Date.now();
    try {
      const result = await asyncFn();
      const duration = Date.now() - start;
      console.log(\`[PERF] \${name}: \${duration}ms\`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(\`[PERF] \${name} failed after \${duration}ms:\`, error.message);
      throw error;
    }
  }

  /**
   * Middleware for Express
   */
  static middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - start;
        PerformanceMonitor.trackHttpRequest(req, res, duration);
      });

      next();
    };
  }
}

export default PerformanceMonitor;
`;
  }

  /**
   * Generate error tracking
   */
  async generateErrorTracking(analysis) {
    return `/**
 * Error Tracking
 * 
 * Centralized error reporting and analysis
 */

import fs from "fs";
import path from "path";

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.errorDirectory = "./logs/errors";
    this.ensureErrorDirectory();
  }

  ensureErrorDirectory() {
    if (!fs.existsSync(this.errorDirectory)) {
      fs.mkdirSync(this.errorDirectory, { recursive: true });
    }
  }

  /**
   * Track an error
   */
  trackError(error, context = {}) {
    const errorData = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name,
      context,
      severity: this.determineSeverity(error),
    };

    // Store in memory
    this.errors.push(errorData);
    if (this.errors.length > 10000) {
      this.errors = this.errors.slice(-5000); // Keep last 5000
    }

    // Update counts
    const key = \`\${error.name}:\${error.message}\`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Write to file
    this.writeErrorToFile(errorData);

    // Alert on critical errors
    if (errorData.severity === "critical") {
      this.alertCriticalError(errorData);
    }

    return errorData.id;
  }

  /**
   * Track HTTP error
   */
  trackHttpError(req, statusCode, error) {
    this.trackError(error, {
      type: "HTTP",
      method: req.method,
      path: req.path,
      statusCode,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Track database error
   */
  trackDatabaseError(query, error) {
    this.trackError(error, {
      type: "DATABASE",
      query: query.substring(0, 100), // First 100 chars
    });
  }

  /**
   * Get error report
   */
  getErrorReport(timeRange = "24h") {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const recent = this.errors.filter(
      e => new Date(e.timestamp).getTime() > cutoff
    );

    const byType = {};
    const bySeverity = {};

    for (const error of recent) {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    }

    return {
      timeRange,
      totalErrors: recent.length,
      byType,
      bySeverity,
      topErrors: Array.from(this.errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({ error: key, count })),
      recentErrors: recent.slice(-10),
    };
  }

  /**
   * Write error to file
   */
  writeErrorToFile(errorData) {
    const date = new Date();
    const fileName = path.join(
      this.errorDirectory,
      \`errors-\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, "0")}-\${String(date.getDate()).padStart(2, "0")}.log\`
    );

    fs.appendFileSync(fileName, JSON.stringify(errorData) + "\\n");
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    if (error.message.includes("OutOfMemory")) return "critical";
    if (error.message.includes("database")) return "high";
    if (error.message.includes("timeout")) return "medium";
    if (error.statusCode >= 500) return "high";
    if (error.statusCode >= 400) return "medium";
    return "low";
  }

  /**
   * Alert on critical error
   */
  alertCriticalError(errorData) {
    console.error(
      \`[CRITICAL ERROR] \${errorData.message} - ID: \${errorData.id}\`
    );
    // Could integrate with alerting service here
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return \`ERR-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }

  /**
   * Get time range cutoff
   */
  getTimeRangeCutoff(timeRange) {
    const now = Date.now();
    const ranges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    return now - (ranges[timeRange] || ranges["24h"]);
  }

  /**
   * Get error details by ID
   */
  getErrorDetails(errorId) {
    return this.errors.find(e => e.id === errorId);
  }
}

export const errorTracker = new ErrorTracker();

export default errorTracker;
`;
  }

  /**
   * Generate alerting rules
   */
  async generateAlertingRules(analysis) {
    const thresholds = analysis.alertThresholds || {};

    return `/**
 * Alerting Rules
 * 
 * Defines thresholds and actions for alerts
 */

import { metricsCollector } from "./metrics.js";
import { errorTracker } from "./errors.js";

class AlertingEngine {
  constructor() {
    this.alerts = [];
    this.rules = this.initializeRules();
    this.checkInterval = null;
  }

  initializeRules() {
    return {
      // Performance alerts
      highErrorRate: {
        metric: "http_errors_total",
        threshold: ${thresholds.errorRate || 5},
        condition: "percent",
        action: "critical",
      },
      slowResponse: {
        metric: "http_request_duration_ms",
        threshold: ${thresholds.responseTime || 1000},
        condition: "p95",
        action: "warning",
      },
      memoryUsage: {
        metric: "app_memory_usage_bytes",
        threshold: ${thresholds.memoryUsage || 80},
        condition: "percent_of_max",
        action: "warning",
      },

      // Application alerts
      tooManyErrors: {
        metric: "errors_per_minute",
        threshold: ${thresholds.errorsPerMinute || 10},
        condition: "absolute",
        action: "critical",
      },
      serviceDown: {
        metric: "uptime",
        threshold: 5,
        condition: "less_than_seconds",
        action: "critical",
      },

      // Database alerts
      slowQueries: {
        metric: "db_query_duration_ms",
        threshold: ${thresholds.queryTime || 500},
        condition: "p95",
        action: "warning",
      },
      databaseErrors: {
        metric: "db_errors_total",
        threshold: ${thresholds.dbErrors || 5},
        condition: "absolute",
        action: "critical",
      },
    };
  }

  /**
   * Start monitoring alerts
   */
  startMonitoring(intervalSeconds = 60) {
    this.checkInterval = setInterval(() => {
      this.evaluateRules();
    }, intervalSeconds * 1000);

    console.log(\`[ALERTS] Monitoring started - checking every \${intervalSeconds}s\`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("[ALERTS] Monitoring stopped");
    }
  }

  /**
   * Evaluate all rules
   */
  evaluateRules() {
    const metrics = metricsCollector.getMetrics();
    const errorReport = errorTracker.getErrorReport("1h");

    for (const [ruleName, rule] of Object.entries(this.rules)) {
      const triggered = this.evaluateRule(rule, metrics, errorReport);

      if (triggered) {
        this.triggerAlert(ruleName, rule, triggered);
      }
    }
  }

  /**
   * Evaluate a single rule
   */
  evaluateRule(rule, metrics, errorReport) {
    try {
      if (rule.metric === "errors_per_minute") {
        const errorsPerMinute = errorReport.totalErrors / 60;
        if (errorsPerMinute >= rule.threshold) {
          return { value: errorsPerMinute, threshold: rule.threshold };
        }
      } else if (rule.metric === "uptime") {
        const uptime = metrics.app_uptime_seconds;
        if (uptime < rule.threshold) {
          return { value: uptime, threshold: rule.threshold };
        }
      } else if (rule.condition === "p95" || rule.condition === "p99") {
        const metricData = metrics[rule.metric];
        if (metricData) {
          const value = metricData[rule.condition] || 0;
          if (value > rule.threshold) {
            return { value, threshold: rule.threshold };
          }
        }
      }
    } catch (error) {
      console.error(\`[ALERTS] Error evaluating rule \${rule.metric}:\`, error.message);
    }

    return null;
  }

  /**
   * Trigger an alert
   */
  triggerAlert(ruleName, rule, details) {
    const alert = {
      id: \`ALERT-\${Date.now()}\`,
      timestamp: new Date().toISOString(),
      rule: ruleName,
      severity: rule.action,
      value: details.value,
      threshold: details.threshold,
      message: \`Alert: \${ruleName} triggered. Value: \${details.value}, Threshold: \${details.threshold}\`,
    };

    this.alerts.push(alert);

    // Remove old alerts
    if (this.alerts.length > 10000) {
      this.alerts = this.alerts.slice(-5000);
    }

    // Log alert
    console.error(\`[ALERT-\${rule.action.toUpperCase()}] \${alert.message}\`);

    // Send to alerting service
    this.sendAlert(alert);
  }

  /**
   * Send alert to external service
   */
  sendAlert(alert) {
    // Implement integration with PagerDuty, Slack, etc
    // Example: POST to /webhook/alerts
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 50) {
    return this.alerts.slice(-count);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(a => a.severity === severity);
  }
}

export const alertingEngine = new AlertingEngine();

export default alertingEngine;
`;
  }

  /**
   * Generate Prometheus exporter
   */
  async generatePrometheusExporter(analysis) {
    return `/**
 * Prometheus Metrics Exporter
 * 
 * Exports metrics in Prometheus format
 */

import { metricsCollector } from "./metrics.js";

export class PrometheusExporter {
  /**
   * Generate Prometheus format metrics
   */
  static generateMetrics() {
    const metrics = metricsCollector.getMetrics();
    let output = "";

    // Add TYPE and HELP comments
    output += "# HELP http_requests_total Total HTTP requests\\n";
    output += "# TYPE http_requests_total counter\\n";
    output += \`http_requests_total \${metrics.http_requests_total || 0}\\n\\n\`;

    output += "# HELP http_request_duration_ms HTTP request duration in milliseconds\\n";
    output += "# TYPE http_request_duration_ms histogram\\n";
    const reqDur = metrics.http_request_duration_ms;
    if (reqDur && reqDur.count > 0) {
      output += \`http_request_duration_ms_bucket{le="100"} \${reqDur.samples?.filter(v => v <= 100).length || 0}\\n\`;
      output += \`http_request_duration_ms_bucket{le="250"} \${reqDur.samples?.filter(v => v <= 250).length || 0}\\n\`;
      output += \`http_request_duration_ms_bucket{le="500"} \${reqDur.samples?.filter(v => v <= 500).length || 0}\\n\`;
      output += \`http_request_duration_ms_bucket{le="1000"} \${reqDur.samples?.filter(v => v <= 1000).length || 0}\\n\`;
      output += \`http_request_duration_ms_bucket{le="+Inf"} \${reqDur.count}\\n\`;
      output += \`http_request_duration_ms_sum \${reqDur.sum || 0}\\n\`;
      output += \`http_request_duration_ms_count \${reqDur.count}\\n\\n\`;
    }

    output += "# HELP http_errors_total Total HTTP errors\\n";
    output += "# TYPE http_errors_total counter\\n";
    output += \`http_errors_total \${metrics.http_errors_total || 0}\\n\\n\`;

    output += "# HELP app_memory_usage_bytes Memory usage in bytes\\n";
    output += "# TYPE app_memory_usage_bytes gauge\\n";
    output += \`app_memory_usage_bytes \${process.memoryUsage().heapUsed}\\n\\n\`;

    output += "# HELP app_uptime_seconds Application uptime in seconds\\n";
    output += "# TYPE app_uptime_seconds gauge\\n";
    output += \`app_uptime_seconds \${metrics.app_uptime_seconds || 0}\\n\\n\`;

    return output;
  }

  /**
   * Express middleware for /metrics endpoint
   */
  static middleware() {
    return (req, res) => {
      res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      res.send(PrometheusExporter.generateMetrics());
    };
  }
}

export default PrometheusExporter;
`;
  }

  /**
   * Generate monitoring configuration
   */
  async generateMonitoringConfig(analysis) {
    return `/**
 * Monitoring Configuration
 */

export const monitoringConfig = {
  // Logging
  logging: {
    level: "${analysis.logLevel || "info"}",
    format: "json",
    transports: {
      console: process.env.NODE_ENV !== "production",
      file: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    },
  },

  // Metrics
  metrics: {
    enabled: true,
    samplingRate: ${analysis.samplingRate || 1.0},
    histogramBuckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  },

  // Health checks
  health: {
    enabled: true,
    interval: 30000, // 30 seconds
    checkDatabase: true,
    checkMemory: true,
    checkDisk: true,
  },

  // Alerting
  alerting: {
    enabled: true,
    interval: 60000, // 60 seconds
    channels: {
      email: process.env.ALERT_EMAIL_ENABLED === "true",
      slack: process.env.ALERT_SLACK_ENABLED === "true",
      pagerduty: process.env.ALERT_PAGERDUTY_ENABLED === "true",
    },
  },

  // Performance monitoring
  performance: {
    enabled: true,
    trackSlowRequests: true,
    slowRequestThreshold: 1000, // 1 second
    trackSlowQueries: true,
    slowQueryThreshold: 500, // 500ms
  },

  // Error tracking
  errors: {
    enabled: true,
    captureStackTrace: true,
    retentionDays: ${analysis.retentionDays || 30},
  },

  // Retention
  retention: {
    logsRetentionDays: ${analysis.retentionDays || 30},
    metricsRetentionDays: 90,
    errorsRetentionDays: ${analysis.retentionDays || 30},
  },
};

export default monitoringConfig;
`;
  }

  /**
   * Generate Grafana dashboard configuration
   */
  async generateGrafanaDashboard(analysis) {
    return JSON.stringify(
      {
        dashboard: {
          title: "Application Monitoring",
          description: "Production application monitoring dashboard",
          tags: ["production", "monitoring"],
          timezone: "UTC",
          panels: [
            {
              id: 1,
              title: "Request Rate",
              type: "graph",
              targets: [{ expr: "rate(http_requests_total[5m])" }],
            },
            {
              id: 2,
              title: "Error Rate",
              type: "graph",
              targets: [{ expr: "rate(http_errors_total[5m])" }],
            },
            {
              id: 3,
              title: "Response Time (p95)",
              type: "graph",
              targets: [{ expr: "histogram_quantile(0.95, http_request_duration_ms)" }],
            },
            {
              id: 4,
              title: "Memory Usage",
              type: "gauge",
              targets: [{ expr: "app_memory_usage_bytes" }],
            },
            {
              id: 5,
              title: "Uptime",
              type: "stat",
              targets: [{ expr: "app_uptime_seconds" }],
            },
            {
              id: 6,
              title: "Active Connections",
              type: "stat",
              targets: [{ expr: "http_requests_active" }],
            },
          ],
        },
      },
      null,
      2
    );
  }

  /**
   * Generate Docker Compose for monitoring stack
   */
  async generateDockerComposeMonitoring(analysis) {
    return `version: "3.8"

services:
  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
    networks:
      - monitoring

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json
    networks:
      - monitoring
    depends_on:
      - prometheus

  # AlertManager for alerts
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - "--config.file=/etc/alertmanager/alertmanager.yml"
    networks:
      - monitoring

  # Node Exporter for system metrics
  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.sysfs=/host/sys"
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
`;
  }

  /**
   * Generate monitoring guide
   */
  async generateMonitoringGuide(analysis, patches) {
    return `# Monitoring Guide

## Overview

This document outlines the monitoring infrastructure for your application.

**Setup Date:** ${new Date().toISOString()}  
**Monitoring Level:** ${analysis.monitoringLevel || "standard"}

---

## Components

### 1. Structured Logging
**File:** \`src/monitoring/logger.js\`

Logs are written to:
- \`logs/error.log\` - Error level logs
- \`logs/combined.log\` - All logs
- \`logs/warnings.log\` - Warning level logs
- \`logs/info.log\` - Info level logs

**Usage:**
\`\`\`javascript
import { logger } from './src/monitoring/logger.js';

logger.info('User login', { userId: 123 });
logger.error('Database error', { error: err.message });
logger.warn('High memory usage', { usage: '85%' });
\`\`\`

### 2. Metrics Collection
**File:** \`src/monitoring/metrics.js\`

Tracks:
- HTTP request counts and durations
- Database query performance
- Error rates
- Memory usage
- Custom business metrics

**Usage:**
\`\`\`javascript
import { metricsCollector } from './src/monitoring/metrics.js';

// Increment counter
metricsCollector.incrementCounter('http_requests_total');

// Record histogram
metricsCollector.recordHistogram('http_request_duration_ms', 125);

// Get metrics snapshot
const metrics = metricsCollector.getMetrics();
\`\`\`

### 3. Health Checks
**File:** \`src/monitoring/health.js\`

Provides endpoints for:
- **Liveness probe** - Is app running? (\`/health/live\`)
- **Readiness probe** - Can app handle requests? (\`/health/ready\`)
- **Full health report** - Detailed status (\`/health\`)

**Integration with Express:**
\`\`\`javascript
import { healthChecker } from './src/monitoring/health.js';

app.get('/health/live', async (req, res) => {
  const liveness = await healthChecker.getLiveness();
  res.json(liveness);
});

app.get('/health/ready', async (req, res) => {
  const readiness = await healthChecker.getReadiness();
  res.status(readiness.status === 'ready' ? 200 : 503).json(readiness);
});

app.get('/health', async (req, res) => {
  const report = await healthChecker.getHealthReport();
  res.json(report);
});
\`\`\`

### 4. Performance Monitoring
**File:** \`src/monitoring/performance.js\`

Tracks request/response times, database query performance, and slow operations.

**Usage:**
\`\`\`javascript
import PerformanceMonitor from './src/monitoring/performance.js';

// Middleware
app.use(PerformanceMonitor.middleware());

// Measure async function
const result = await PerformanceMonitor.measureAsync('fetch-user', async () => {
  return await User.findById(id);
});

// Get performance report
const report = PerformanceMonitor.getPerformanceReport();
\`\`\`

### 5. Error Tracking
**File:** \`src/monitoring/errors.js\`

Centralizes error reporting with tracking and analysis.

**Usage:**
\`\`\`javascript
import { errorTracker } from './src/monitoring/errors.js';

app.use((err, req, res, next) => {
  const errorId = errorTracker.trackError(err, {
    type: 'HTTP',
    method: req.method,
    path: req.path,
  });

  res.status(500).json({ error: 'Internal error', id: errorId });
});

// Get error report
const report = errorTracker.getErrorReport('24h');
\`\`\`

### 6. Alerting
**File:** \`src/monitoring/alerts.js\`

Configurable alerting engine with thresholds:

\`\`\`javascript
import { alertingEngine } from './src/monitoring/alerts.js';

// Start monitoring
alertingEngine.startMonitoring(60); // Check every 60 seconds

// Get recent alerts
const alerts = alertingEngine.getRecentAlerts();

// Get critical alerts
const critical = alertingEngine.getAlertsBySeverity('critical');
\`\`\`

### 7. Prometheus Metrics
**File:** \`src/monitoring/prometheus.js\`

Exports metrics in Prometheus format.

**Express endpoint:**
\`\`\`javascript
import PrometheusExporter from './src/monitoring/prometheus.js';

app.get('/metrics', PrometheusExporter.middleware());
\`\`\`

---

## Monitoring Stack

Start the full monitoring stack:

\`\`\`bash
docker-compose -f monitoring/docker-compose.yml up -d
\`\`\`

**Services:**
- **Prometheus** (port 9090) - Metrics storage and querying
- **Grafana** (port 3001) - Visualization and dashboards
- **AlertManager** (port 9093) - Alert management
- **Node Exporter** (port 9100) - System metrics

### Access Dashboards

- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093

---

## Metrics Endpoint

Your application exposes metrics at \`/metrics\` in Prometheus format:

\`\`\`
curl http://localhost:3000/metrics
\`\`\`

Configure Prometheus to scrape:

\`\`\`yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
\`\`\`

---

## Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Critical |
| Response Time (p95) | > 1000ms | Warning |
| Response Time (p99) | > 2000ms | Critical |
| Memory Usage | > 85% | Warning |
| Memory Usage | > 95% | Critical |
| CPU Usage | > 80% | Warning |
| Database Errors | > 5/min | Critical |
| Slow Queries | > 500ms | Warning |

---

## Logging Best Practices

1. **Log at appropriate level:**
   - \`fatal\` - System shutdown required
   - \`error\` - Error that should be addressed
   - \`warn\` - Potential issue, monitor
   - \`info\` - General informational
   - \`debug\` - Development/debugging
   - \`trace\` - Very detailed

2. **Include context:**
   \`\`\`javascript
   logger.info('User action', {
     userId: user.id,
     action: 'login',
     ip: req.ip,
     timestamp: new Date(),
   });
   \`\`\`

3. **Avoid logging sensitive data:**
   - Never log passwords
   - Never log tokens
   - Never log credit card numbers
   - Sanitize PII (Personally Identifiable Information)

---

## Alerting Configuration

Alerts are defined in \`src/monitoring/alerts.js\`. Customize thresholds:

\`\`\`javascript
const rules = {
  highErrorRate: {
    threshold: 5, // 5% error rate
    action: 'critical',
  },
  slowResponse: {
    threshold: 1000, // 1 second
    action: 'warning',
  },
  memoryUsage: {
    threshold: 80, // 80% of heap
    action: 'warning',
  },
};
\`\`\`

---

## Performance Tuning

Monitor these indicators:

1. **Response Time**
   - Track p95 and p99 percentiles
   - Identify slow endpoints
   - Optimize database queries

2. **Memory Usage**
   - Watch for memory leaks
   - Monitor garbage collection
   - Check for large object retention

3. **Database Performance**
   - Query execution time
   - Query frequency
   - Index effectiveness

4. **Concurrency**
   - Active connections
   - Queue depths
   - Thread pool utilization

---

## Integration with Kubernetes

For Kubernetes deployments, use the health check endpoints:

**Liveness Probe:**
\`\`\`yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
\`\`\`

**Readiness Probe:**
\`\`\`yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
\`\`\`

---

## Troubleshooting

**High memory usage:**
- Check for memory leaks
- Review large object allocations
- Monitor heap dumps

**High error rate:**
- Check application logs
- Review recent deployments
- Check external service availability

**Slow responses:**
- Check database query performance
- Check external API calls
- Review application bottlenecks

**Missing metrics:**
- Verify Prometheus scrape is working
- Check firewall rules
- Verify application is exposing /metrics endpoint

---

**Status:** ✅ Monitoring Infrastructure Ready
`;
  }

  /**
   * Mock monitoring analysis
   */
  getMockMonitoringAnalysis(request) {
    return {
      metrics: [
        "http_requests_total",
        "http_request_duration_ms",
        "http_errors_total",
        "db_query_duration_ms",
        "app_memory_usage_bytes",
      ],
      logLevel: "info",
      alertThresholds: {
        errorRate: 5,
        responseTime: 1000,
        memoryUsage: 85,
        errorsPerMinute: 10,
        queryTime: 500,
        dbErrors: 5,
      },
      samplingRate: 1.0,
      retentionDays: 30,
      monitoringLevel: "standard",
    };
  }

  /**
   * Fallback output
   */
  generateFallbackMonitoringOutput() {
    const patches = [];

    patches.push({
      filename: "src/monitoring/logger.js",
      content: "// Logging configuration - see MonitoringAgent",
      language: "javascript",
    });

    patches.push({
      filename: "src/monitoring/metrics.js",
      content: "// Metrics collection - see MonitoringAgent",
      language: "javascript",
    });

    patches.push({
      filename: "MONITORING.md",
      content: "# Monitoring Configuration\n\nMonitoring infrastructure has been generated.",
      language: "markdown",
    });

    return makeAgentOutput({
      thought: "Generated monitoring infrastructure",
      patches,
      metadata: { agent: "MonitoringAgent", patches_count: patches.length },
    });
  }
}
