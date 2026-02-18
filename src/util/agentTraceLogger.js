import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Agent Request/Response Logger
 * Tracks all agent requests and outputs in a clean, structured format
 * Outputs to logs/agent-trace-YYYY-MM-DD.json
 */
export class AgentTraceLogger {
  constructor(logger = null) {
    this.logger = logger;
    this.traceId = `trace-${Date.now()}`;
    this.traces = [];
    this.logsDir = path.join(__dirname, "../../logs");
    this.initializeLogs();
  }

  async initializeLogs() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (err) {
      console.error("Failed to create logs directory:", err.message);
    }
  }

  /**
   * Log an agent request and response
   */
  logAgent(agentName, request, response, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const trace = {
      timestamp,
      agent: agentName,
      request: this._sanitizeData(request),
      response: this._sanitizeData(response),
      metadata: {
        success: !!response && !response.error,
        duration: metadata.duration || 0,
        ...metadata
      }
    };

    this.traces.push(trace);
    this.logger?.info({ agent: agentName }, `Agent request logged`);
    
    return trace;
  }

  /**
   * Sanitize sensitive data from logs
   */
  _sanitizeData(data) {
    if (!data) return null;
    if (typeof data !== 'object') return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove API keys and sensitive fields
    const sensitiveFields = ['apiKey', 'api_key', 'token', 'password', 'secret', 'authorization'];
    
    const removeSensitive = (obj) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitive(obj[key]);
        }
      }
    };
    
    removeSensitive(sanitized);
    return sanitized;
  }

  /**
   * Save traces to JSON file
   */
  async saveTraces() {
    try {
      await this.initializeLogs();
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = path.join(this.logsDir, `agent-trace-${dateStr}.json`);
      
      // Read existing traces if file exists
      let allTraces = [];
      try {
        const existing = await fs.readFile(filename, 'utf-8');
        allTraces = JSON.parse(existing);
      } catch {
        // File doesn't exist, start fresh
      }
      
      // Append new traces
      allTraces.push(...this.traces);
      
      // Write back to file
      await fs.writeFile(filename, JSON.stringify(allTraces, null, 2));
      
      this.logger?.info({ file: filename, count: allTraces.length }, "Agent traces saved");
      return filename;
    } catch (err) {
      this.logger?.error({ error: err.message }, "Failed to save traces");
      throw err;
    }
  }

  /**
   * Get summary report of all traces
   */
  getSummary() {
    const summary = {
      totalAgents: new Set(this.traces.map(t => t.agent)).size,
      totalRequests: this.traces.length,
      successCount: this.traces.filter(t => t.metadata.success).length,
      failureCount: this.traces.filter(t => !t.metadata.success).length,
      agentBreakdown: {},
      totalDuration: 0
    };

    for (const trace of this.traces) {
      if (!summary.agentBreakdown[trace.agent]) {
        summary.agentBreakdown[trace.agent] = {
          count: 0,
          success: 0,
          failure: 0
        };
      }
      summary.agentBreakdown[trace.agent].count++;
      if (trace.metadata.success) {
        summary.agentBreakdown[trace.agent].success++;
      } else {
        summary.agentBreakdown[trace.agent].failure++;
      }
      summary.totalDuration += trace.metadata.duration || 0;
    }

    return summary;
  }

  /**
   * Format traces as readable text output
   */
  formatAsText() {
    let output = "=".repeat(80) + "\n";
    output += "AGENT REQUEST/RESPONSE TRACE LOG\n";
    output += "=".repeat(80) + "\n\n";

    for (const trace of this.traces) {
      output += `\n${"─".repeat(80)}\n`;
      output += `[${trace.timestamp}] AGENT: ${trace.agent}\n`;
      output += `${"─".repeat(80)}\n`;
      
      output += `REQUEST:\n`;
      output += this._formatObject(trace.request, 2) + "\n\n";
      
      output += `RESPONSE:\n`;
      output += this._formatObject(trace.response, 2) + "\n\n";
      
      output += `STATUS: ${trace.metadata.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
      output += `DURATION: ${trace.metadata.duration}ms\n`;
    }

    output += "\n" + "=".repeat(80) + "\n";
    output += "SUMMARY\n";
    output += "=".repeat(80) + "\n";
    const summary = this.getSummary();
    output += JSON.stringify(summary, null, 2);
    
    return output;
  }

  /**
   * Helper to format objects for text output
   */
  _formatObject(obj, indent = 0) {
    if (!obj) return "  ".repeat(indent) + "(empty)";
    if (typeof obj !== 'object') return "  ".repeat(indent) + String(obj);

    let str = "";
    const keys = Array.isArray(obj) ? obj.keys() : Object.keys(obj);
    
    for (const key of keys) {
      const value = obj[key];
      const indentStr = "  ".repeat(indent);
      
      if (typeof value === 'object' && value !== null) {
        str += `${indentStr}${key}:\n${this._formatObject(value, indent + 1)}\n`;
      } else {
        str += `${indentStr}${key}: ${String(value).substring(0, 100)}\n`;
      }
    }
    
    return str;
  }
}

export default AgentTraceLogger;
