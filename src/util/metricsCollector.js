/**
 * Metrics Collector
 * Tracks performance of agents and workflow
 */

export class MetricsCollector {
  constructor({ logger }) {
    this.logger = logger;
    this.metrics = {
      workflowRuns: [],
      agentMetrics: {},
      gateMetrics: {}
    };
  }

  /**
   * Record a workflow run
   */
  recordWorkflow({ traceId, duration, success, iterations, input }) {
    const workflow = {
      traceId,
      timestamp: new Date().toISOString(),
      duration,
      success,
      iterations,
      inputLength: input?.length || 0
    };

    this.metrics.workflowRuns.push(workflow);
    this.logger?.info({ traceId, duration }, "Workflow metrics recorded");

    return workflow;
  }

  /**
   * Record agent execution
   */
  recordAgent({ agentName, duration, outputSize, patchCount, success }) {
    if (!this.metrics.agentMetrics[agentName]) {
      this.metrics.agentMetrics[agentName] = {
        name: agentName,
        runs: [],
        stats: {
          totalRuns: 0,
          avgDuration: 0,
          avgOutputSize: 0,
          avgPatchCount: 0,
          successRate: 0
        }
      };
    }

    const agent = this.metrics.agentMetrics[agentName];
    agent.runs.push({
      timestamp: new Date().toISOString(),
      duration,
      outputSize,
      patchCount,
      success
    });

    this._updateAgentStats(agent);
  }

  /**
   * Record gate evaluation (security, qa, tests)
   */
  recordGate({ gateName, duration, ok, issues }) {
    if (!this.metrics.gateMetrics[gateName]) {
      this.metrics.gateMetrics[gateName] = {
        name: gateName,
        runs: [],
        stats: {
          totalRuns: 0,
          passRate: 0,
          avgDuration: 0,
          issuesFound: []
        }
      };
    }

    const gate = this.metrics.gateMetrics[gateName];
    gate.runs.push({
      timestamp: new Date().toISOString(),
      duration,
      ok,
      issuesCount: issues?.length || 0
    });

    this._updateGateStats(gate);
  }

  _updateAgentStats(agent) {
    const runs = agent.runs;
    agent.stats.totalRuns = runs.length;
    agent.stats.avgDuration = runs.reduce((sum, r) => sum + r.duration, 0) / runs.length;
    agent.stats.avgOutputSize = runs.reduce((sum, r) => sum + r.outputSize, 0) / runs.length;
    agent.stats.avgPatchCount = runs.reduce((sum, r) => sum + r.patchCount, 0) / runs.length;
    agent.stats.successRate = (runs.filter(r => r.success).length / runs.length * 100).toFixed(1);
  }

  _updateGateStats(gate) {
    const runs = gate.runs;
    gate.stats.totalRuns = runs.length;
    gate.stats.passRate = (runs.filter(r => r.ok).length / runs.length * 100).toFixed(1);
    gate.stats.avgDuration = runs.reduce((sum, r) => sum + r.duration, 0) / runs.length;
  }

  /**
   * Get comprehensive metrics report
   */
  getReport() {
    return {
      timestamp: new Date().toISOString(),
      workflows: {
        total: this.metrics.workflowRuns.length,
        successful: this.metrics.workflowRuns.filter(w => w.success).length,
        failed: this.metrics.workflowRuns.filter(w => !w.success).length,
        avgDuration: this.metrics.workflowRuns.length > 0
          ? Math.round(this.metrics.workflowRuns.reduce((sum, w) => sum + w.duration, 0) / this.metrics.workflowRuns.length)
          : 0,
        successRate: this.metrics.workflowRuns.length > 0
          ? (this.metrics.workflowRuns.filter(w => w.success).length / this.metrics.workflowRuns.length * 100).toFixed(1) + '%'
          : 'N/A'
      },
      agents: Object.values(this.metrics.agentMetrics),
      gates: Object.values(this.metrics.gateMetrics)
    };
  }

  /**
   * Get agent performance ranking
   */
  getRanking() {
    const agents = Object.values(this.metrics.agentMetrics)
      .map(a => ({
        name: a.name,
        successRate: parseFloat(a.stats.successRate),
        avgDuration: Math.round(a.stats.avgDuration),
        totalRuns: a.stats.totalRuns,
        avgPatchCount: a.stats.avgPatchCount.toFixed(1)
      }))
      .sort((a, b) => b.successRate - a.successRate);

    return agents;
  }

  /**
   * Identify underperforming agents
   */
  getUnderperformers(threshold = 70) {
    return Object.values(this.metrics.agentMetrics)
      .filter(a => parseFloat(a.stats.successRate) < threshold)
      .map(a => ({
        name: a.name,
        successRate: a.stats.successRate,
        runs: a.stats.totalRuns,
        recommendation: `Agent ${a.name} has success rate of ${a.stats.successRate}%. Consider review or improvement.`
      }));
  }
}
