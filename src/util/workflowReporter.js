/**
 * Workflow Reporter
 * Generates detailed reports on workflow execution and agent performance
 */

export class WorkflowReporter {
  constructor({ inspector, metricsCollector, logger }) {
    this.inspector = inspector;
    this.metricsCollector = metricsCollector;
    this.logger = logger;
  }

  /**
   * Generate comprehensive workflow execution report
   */
  generateExecutionReport(workflowResult, agents) {
    const report = {
      timestamp: new Date().toISOString(),
      workflowId: workflowResult.traceId,
      status: workflowResult.success ? 'SUCCESS' : 'FAILED',
      summary: {
        duration: workflowResult.duration,
        iterations: workflowResult.iteration,
        inputLength: workflowResult.userInput?.length || 0,
        filesCreated: workflowResult.executedFiles?.length || 0
      },
      stages: {
        planning: this._reportPlan(workflowResult.plan),
        execution: this._reportExecution(workflowResult),
        validation: this._reportValidation(workflowResult),
        results: this._reportResults(workflowResult)
      },
      agentPerformance: {},
      metrics: this.metricsCollector.getReport()
    };

    return report;
  }

  _reportPlan(plan) {
    if (!plan) return { status: 'N/A' };

    return {
      kind: plan.kind,
      workItems: plan.workItems?.length || 0,
      acceptanceCriteria: plan.acceptanceCriteria?.length || 0,
      details: plan.workItems?.map(w => {
        const task = typeof w.task === "string" ? w.task : "";
        return {
          id: w.id,
          owner: w.owner,
          task: task.substring(0, 80) + (task.length > 80 ? '...' : '')
        };
      }) || []
    };
  }

  _reportExecution(result) {
    return {
      merged: {
        patches: result.merged?.patches?.length || 0,
        notes: result.merged?.notes?.length || 0
      },
      filesExecuted: result.executedFiles?.length || 0,
      executedFiles: result.executedFiles?.map(f => ({
        path: f.path,
        status: f.success ? 'OK' : 'FAILED'
      })) || []
    };
  }

  _reportValidation(result) {
    return {
      security: {
        ok: result.security?.ok,
        issues: result.security?.issues?.length || 0
      },
      qa: {
        ok: result.qa?.ok,
        issues: result.qa?.issues?.length || 0
      },
      tests: {
        ok: result.tests?.ok,
        passed: result.tests?.passed || 0,
        failed: result.tests?.failed || 0
      }
    };
  }

  _reportResults(result) {
    return {
      success: result.success,
      iterations: result.iteration,
      error: result.error || null,
      lastError: result.lastError || null
    };
  }

  /**
   * Generate detailed per-agent report
   */
  generateAgentReports(agents, outputs) {
    const reports = {};

    for (const [agentKey, agent] of Object.entries(agents)) {
      const output = outputs[agentKey];
      reports[agentKey] = this.inspector.generateReport(agent.name || agentKey, output);
    }

    return reports;
  }

  /**
   * Generate health check report
   */
  generateHealthReport(agents) {
    const report = {
      timestamp: new Date().toISOString(),
      agents: {},
      overallHealth: 'UNKNOWN'
    };

    let healthyCount = 0;

    for (const [name, agent] of Object.entries(agents)) {
      const health = {
        name: agent.name || name,
        type: agent.constructor.name,
        status: 'ONLINE',
        capabilities: this._detectCapabilities(agent)
      };

      if (typeof agent.build === 'function') health.canBuild = true;
      if (typeof agent.review === 'function') health.canReview = true;
      if (typeof agent.run === 'function') health.canRun = true;
      if (typeof agent.patch === 'function') health.canPatch = true;
      if (typeof agent.plan === 'function') health.canPlan = true;
      if (typeof agent.merge === 'function') health.canMerge = true;
      if (typeof agent.present === 'function') health.canPresent = true;

      report.agents[name] = health;
      healthyCount++;
    }

    report.overallHealth = healthyCount === Object.keys(agents).length ? 'HEALTHY' : 'DEGRADED';

    return report;
  }

  _detectCapabilities(agent) {
    const capabilities = [];
    if (typeof agent.build === 'function') capabilities.push('Build');
    if (typeof agent.review === 'function') capabilities.push('Review');
    if (typeof agent.run === 'function') capabilities.push('Run Tests');
    if (typeof agent.patch === 'function') capabilities.push('Patch');
    if (typeof agent.plan === 'function') capabilities.push('Plan');
    if (typeof agent.merge === 'function') capabilities.push('Merge');
    if (typeof agent.present === 'function') capabilities.push('Present');
    return capabilities;
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary() {
    const metrics = this.metricsCollector.getReport();
    const underperformers = this.metricsCollector.getUnderperformers();
    const ranking = this.metricsCollector.getRanking();

    return {
      timestamp: new Date().toISOString(),
      overview: metrics.workflows,
      topPerformers: ranking.slice(0, 3),
      underperformers,
      agents: ranking,
      recommendations: this._generateRecommendations(metrics, underperformers)
    };
  }

  _generateRecommendations(metrics, underperformers) {
    const recommendations = [];

    if (metrics.workflows.successRate && parseFloat(metrics.workflows.successRate) < 70) {
      recommendations.push('Overall success rate is below 70%. Consider workflow improvements.');
    }

    if (underperformers.length > 0) {
      recommendations.push(`${underperformers.length} agent(s) underperforming. Review their implementation.`);
    }

    if (metrics.workflows.avgDuration > 30000) {
      recommendations.push('Average workflow duration is high (>30s). Optimize agent execution.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performing well. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Print formatted report to console
   */
  printReport(report) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           WORKFLOW EXECUTION REPORT                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Workflow ID: ${report.workflowId}`);
    console.log(`Status: ${report.status}`);
    console.log(`Duration: ${report.summary.duration}ms`);
    console.log(`Iterations: ${report.summary.iterations}`);
    console.log(`Files Created: ${report.summary.filesCreated}\n`);

    console.log('─ Planning ─');
    console.log(`  Kind: ${report.stages.planning.kind}`);
    console.log(`  Work Items: ${report.stages.planning.workItems}`);
    console.log(`  Acceptance Criteria: ${report.stages.planning.acceptanceCriteria}\n`);

    console.log('─ Execution ─');
    console.log(`  Patches Generated: ${report.stages.execution.merged.patches}`);
    console.log(`  Files Executed: ${report.stages.execution.filesExecuted}\n`);

    console.log('─ Validation ─');
    console.log(`  Security: ${report.stages.validation.security.ok ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  QA: ${report.stages.validation.qa.ok ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Tests: ${report.stages.validation.tests.ok ? '✓ PASS' : '✗ FAIL'}\n`);
  }

  /**
   * Print performance summary
   */
  printPerformanceSummary(summary) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           PERFORMANCE SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('─ Overall Metrics ─');
    console.log(`  Total Workflows: ${summary.overview.total}`);
    console.log(`  Success Rate: ${summary.overview.successRate}`);
    console.log(`  Avg Duration: ${summary.overview.avgDuration}ms\n`);

    if (summary.topPerformers.length > 0) {
      console.log('─ Top Performers ─');
      for (const agent of summary.topPerformers) {
        console.log(`  ${agent.name}: ${agent.successRate}% success rate (${agent.totalRuns} runs)`);
      }
      console.log();
    }

    if (summary.underperformers.length > 0) {
      console.log('─ Needs Improvement ─');
      for (const agent of summary.underperformers) {
        console.log(`  ⚠ ${agent.name}: ${agent.successRate}% success rate`);
      }
      console.log();
    }

    console.log('─ Recommendations ─');
    for (const rec of summary.recommendations) {
      console.log(`  • ${rec}`);
    }
  }
}
