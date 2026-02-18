import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple Agent Request/Response Logger
 * Tracks agent inputs and outputs in clean JSON format
 * Saves to logs/agent-trace-YYYY-MM-DD.json
 */
export class SimpleAgentLogger {
  constructor(logger = null) {
    this.logger = logger;
    this.traces = [];
    this.logsDir = path.join(__dirname, "../../logs");
  }

  /**
   * Log a single agent request/response
   * @param {string} agentName - Name of the agent
   * @param {*} request - The input/request to the agent
   * @param {*} response - The response/output from the agent
   * @param {object} metadata - Additional metadata (duration, etc.)
   */
  async logAgentCall(agentName, request, response, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const trace = {
      timestamp,
      agent: agentName,
      request: this._cleanData(request),
      response: this._cleanData(response),
      metadata: {
        success: !!response && !response.error,
        duration: metadata.duration || 0,
        iteration: metadata.iteration || 0,
        traceId: metadata.traceId || null
      }
    };

    this.traces.push(trace);
    
    return trace;
  }

  /**
   * Clean and truncate data for logging
   */
  _cleanData(data) {
    if (data === null || data === undefined) return null;
    
    // If string, truncate to 500 chars
    if (typeof data === 'string') {
      return data.length > 500 ? data.substring(0, 500) + '...' : data;
    }
    
    // If object, create cleaned copy
    if (typeof data === 'object') {
      const cleaned = JSON.parse(JSON.stringify(data));
      
      // Truncate patch/file content
      if (cleaned.patches && Array.isArray(cleaned.patches)) {
        cleaned.patches = cleaned.patches.map(p => ({
          file: p.file,
          type: p.type,
          status: p.status,
          diffPreview: (p.diff || '').substring(0, 200) + '...'
        }));
      }
      
      // Truncate large fields
      if (cleaned.content && typeof cleaned.content === 'string') {
        cleaned.content = cleaned.content.substring(0, 300) + '...';
      }
      
      if (cleaned.summary && typeof cleaned.summary === 'string') {
        cleaned.summary = cleaned.summary.substring(0, 300) + '...';
      }
      
      return cleaned;
    }
    
    return data;
  }

  /**
   * Save all collected traces to file
   */
  async saveToFile() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = path.join(this.logsDir, `agent-trace-${dateStr}.json`);
      
      // Read existing traces
      let allTraces = [];
      try {
        const existing = await fs.readFile(filename, 'utf-8');
        allTraces = JSON.parse(existing);
      } catch {
        // File doesn't exist
      }
      
      // Append new traces
      allTraces.push(...this.traces);
      
      // Write back
      await fs.writeFile(filename, JSON.stringify(allTraces, null, 2));
      
      return {
        success: true,
        filename,
        tracesCount: allTraces.length,
        newTraces: this.traces.length
      };
    } catch (err) {
      console.error("Failed to save agent traces:", err.message);
      throw err;
    }
  }

  /**
   * Format traces as human-readable text
   */
  formatAsText() {
    let output = "═".repeat(100) + "\n";
    output += "AGENT REQUEST/RESPONSE LOG\n";
    output += "═".repeat(100) + "\n";
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `Total Records: ${this.traces.length}\n`;
    output += "═".repeat(100) + "\n\n";

    for (let i = 0; i < this.traces.length; i++) {
      const trace = this.traces[i];
      output += `\n[${i + 1}] ───────────────────────────────────────────────────────────────\n`;
      output += `TIME: ${trace.timestamp}\n`;
      output += `AGENT: ${trace.agent}\n`;
      output += `STATUS: ${trace.metadata.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
      output += `───────────────────────────────────────────────────────────────\n\n`;
      
      output += `INPUT REQUEST:\n`;
      output += this._formatForText(trace.request);
      output += `\n`;
      
      output += `OUTPUT RESPONSE:\n`;
      output += this._formatForText(trace.response);
      output += `\n`;
      
      if (trace.metadata.duration > 0) {
        output += `DURATION: ${trace.metadata.duration}ms\n`;
      }
      
      output += `\n`;
    }

    output += "\n" + "═".repeat(100) + "\n";
    output += "END OF LOG\n";
    output += "═".repeat(100) + "\n";

    return output;
  }

  /**
   * Helper to format data for text output
   */
  _formatForText(data, indent = 0) {
    if (!data) return "  (none)\n";
    
    const indentStr = "  ".repeat(indent);
    
    if (typeof data === 'string') {
      return indentStr + data.substring(0, 200) + "\n";
    }
    
    if (typeof data === 'object') {
      return indentStr + JSON.stringify(data, null, 2).split('\n').join('\n' + indentStr) + "\n";
    }
    
    return indentStr + String(data) + "\n";
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const summary = {
      totalRecords: this.traces.length,
      uniqueAgents: [...new Set(this.traces.map(t => t.agent))],
      successCount: this.traces.filter(t => t.metadata.success).length,
      failureCount: this.traces.filter(t => !t.metadata.success).length,
      agents: {}
    };

    for (const trace of this.traces) {
      if (!summary.agents[trace.agent]) {
        summary.agents[trace.agent] = { calls: 0, success: 0, failed: 0 };
      }
      summary.agents[trace.agent].calls++;
      if (trace.metadata.success) {
        summary.agents[trace.agent].success++;
      } else {
        summary.agents[trace.agent].failed++;
      }
    }

    return summary;
  }
}

export default SimpleAgentLogger;
