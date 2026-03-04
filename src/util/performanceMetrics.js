/**
 * Performance Metrics Tracker
 * Tracks execution time, LLM calls, file operations, and other metrics
 */

/**
 * Metric entry
 */
class MetricEntry {
  constructor(name, category, value) {
    this.name = name;
    this.category = category;
    this.value = value;
    this.timestamp = Date.now();
  }
}

/**
 * Performance Metrics Tracker
 */
export class PerformanceMetrics {
  constructor(traceId = 'default') {
    this.traceId = traceId;
    this.metrics = [];
    this.startTime = Date.now();
    this.agentTimes = new Map();
    this.llmCallCount = 0;
    this.llmTokensUsed = 0;
    this.filesGenerated = 0;
    this.patchesApplied = 0;
  }

  /**
   * Record metric
   * @param {string} name - Metric name
   * @param {*} value - Metric value
   * @param {string} category - Category (agent, llm, file, etc.)
   */
  recordMetric(name, value, category = 'general') {
    this.metrics.push(new MetricEntry(name, category, value));
  }

  /**
   * Track agent execution time
   * @param {string} agentName - Agent name
   * @param {number} duration - Duration in milliseconds
   */
  recordAgentTime(agentName, duration) {
    if (!this.agentTimes.has(agentName)) {
      this.agentTimes.set(agentName, []);
    }
    this.agentTimes.get(agentName).push(duration);
    this.recordMetric(`agent_${agentName}_time`, duration, 'agent');
  }

  /**
   * Track LLM call
   * @param {string} model - Model name
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   * @param {number} duration - Duration in milliseconds
   */
  recordLLMCall(model, inputTokens, outputTokens, duration) {
    this.llmCallCount++;
    this.llmTokensUsed += inputTokens + outputTokens;
    this.recordMetric(`llm_call_${model}`, { inputTokens, outputTokens, duration }, 'llm');
  }

  /**
   * Track file generation
   * @param {string} filePath - File path
   * @param {number} size - File size in bytes
   */
  recordFileGenerated(filePath, size) {
    this.filesGenerated++;
    this.recordMetric(`file_generated_${filePath}`, size, 'file');
  }

  /**
   * Track patch applied
   * @param {string} filePath - File path
   * @param {number} chunkCount - Number of chunks in patch
   */
  recordPatchApplied(filePath, chunkCount = 1) {
    this.patchesApplied++;
    this.recordMetric(`patch_applied_${filePath}`, chunkCount, 'patch');
  }

  /**
   * Get total execution time
   * @returns {number} Milliseconds elapsed
   */
  getTotalTime() {
    return Date.now() - this.startTime;
  }

  /**
   * Get agent statistics
   * @returns {Object} Stats per agent
   */
  getAgentStats() {
    const stats = {};
    for (const [agent, times] of this.agentTimes.entries()) {
      stats[agent] = {
        callCount: times.length,
        totalTime: times.reduce((a, b) => a + b, 0),
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times)
      };
    }
    return stats;
  }

  /**
   * Get LLM statistics
   * @returns {Object} LLM stats
   */
  getLLMStats() {
    return {
      callCount: this.llmCallCount,
      totalTokens: this.llmTokensUsed,
      averageTokensPerCall: this.llmCallCount > 0 
        ? this.llmTokensUsed / this.llmCallCount 
        : 0
    };
  }

  /**
   * Get file operation statistics
   * @returns {Object} File stats
   */
  getFileStats() {
    return {
      filesGenerated: this.filesGenerated,
      patchesApplied: this.patchesApplied,
      totalOperations: this.filesGenerated + this.patchesApplied
    };
  }

  /**
   * Get summary report
   * @returns {Object} Summary report
   */
  getSummaryReport() {
    const totalTime = this.getTotalTime();
    return {
      traceId: this.traceId,
      totalTime,
      totalTimeFormatted: this.formatTime(totalTime),
      agents: this.getAgentStats(),
      llm: this.getLLMStats(),
      files: this.getFileStats(),
      metricsRecorded: this.metrics.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format milliseconds to human-readable time
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted time
   */
  formatTime(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  /**
   * Get detailed metrics list
   * @returns {Array} Metrics array
   */
  getDetailedMetrics() {
    return this.metrics.map(m => ({
      ...m,
      timeElapsed: m.timestamp - this.startTime
    }));
  }

  /**
   * Export metrics to JSON
   * @returns {string} JSON string
   */
  toJSON() {
    return JSON.stringify({
      traceId: this.traceId,
      summary: this.getSummaryReport(),
      detailedMetrics: this.getDetailedMetrics()
    }, null, 2);
  }
}

/**
 * Create metrics tracker with optional initial data
 * @param {string} traceId - Trace ID
 * @returns {PerformanceMetrics} Metrics instance
 */
export function createMetricsTracker(traceId = 'default') {
  return new PerformanceMetrics(traceId);
}
