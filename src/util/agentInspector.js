/**
 * Agent Inspector & Validator
 * Verifies agents are doing their job and producing expected output
 */

export class AgentInspector {
  constructor({ logger }) {
    this.logger = logger;
  }

  /**
   * Validate an agent's output against expected schema
   */
  validateOutput(output, agentName) {
    const issues = [];

    // Check base structure
    if (!output || typeof output !== 'object') {
      issues.push(`${agentName}: Output is not an object`);
      return { valid: false, issues };
    }

    // Required fields for all agents
    const requiredFields = ['summary', 'patches', 'actions', 'notes', 'risks', 'filesRead', 'metrics'];
    for (const field of requiredFields) {
      if (!(field in output)) {
        issues.push(`${agentName}: Missing required field "${field}"`);
      }
    }

    // Validate field types
    if (typeof output.summary !== 'string') {
      issues.push(`${agentName}: "summary" must be a string`);
    }
    if (!Array.isArray(output.patches)) {
      issues.push(`${agentName}: "patches" must be an array`);
    }
    if (!Array.isArray(output.notes)) {
      issues.push(`${agentName}: "notes" must be an array`);
    }
    if (!Array.isArray(output.risks)) {
      issues.push(`${agentName}: "risks" must be an array`);
    }

    // Validate patches structure
    for (const patch of output.patches || []) {
      if (!patch.path && !patch.type) {
        issues.push(`${agentName}: Patch missing "path" or "type"`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      quality: this._calculateQuality(output)
    };
  }

  /**
   * Calculate output quality score
   */
  _calculateQuality(output) {
    let score = 100;

    // Penalize missing data
    if (!output.summary || output.summary.length < 10) score -= 20;
    if (output.patches.length === 0) score -= 15; // Agent should produce something
    if (output.notes.length === 0) score -= 10;
    if (output.risks.length === 0) score -= 5; // Good to acknowledge risks

    return Math.max(0, score);
  }

  /**
   * Inspect all agents at once
   */
  inspectAgents(agents, outputs) {
    const report = {
      timestamp: new Date().toISOString(),
      agents: {},
      summary: {
        totalAgents: Object.keys(agents).length,
        validAgents: 0,
        invalidAgents: 0,
        averageQuality: 0
      }
    };

    let qualitySum = 0;

    for (const [agentName, agent] of Object.entries(agents)) {
      const output = outputs[agentName];

      if (!output) {
        report.agents[agentName] = {
          status: 'no-output',
          issues: ['No output produced']
        };
        report.summary.invalidAgents++;
        continue;
      }

      const validation = this.validateOutput(output, agent.name || agentName);
      report.agents[agentName] = validation;

      if (validation.valid) {
        report.summary.validAgents++;
      } else {
        report.summary.invalidAgents++;
      }

      qualitySum += validation.quality || 0;
    }

    report.summary.averageQuality = Math.round(qualitySum / Object.keys(agents).length);

    return report;
  }

  /**
   * Generate detailed agent report
   */
  generateReport(agentName, output) {
    const validation = this.validateOutput(output, agentName);

    return {
      agent: agentName,
      timestamp: new Date().toISOString(),
      validation,
      details: {
        summaryLength: output?.summary?.length || 0,
        patchesCount: output?.patches?.length || 0,
        notesCount: output?.notes?.length || 0,
        risksIdentified: output?.risks?.length || 0,
        filesRead: output?.filesRead?.length || 0
      },
      workDone: {
        hasSummary: !!output?.summary,
        hasPatches: (output?.patches?.length || 0) > 0,
        hasNotes: (output?.notes?.length || 0) > 0,
        hasRisks: (output?.risks?.length || 0) > 0
      },
      grade: this._assignGrade(validation.quality || 0)
    };
  }

  _assignGrade(quality) {
    if (quality >= 90) return 'A';
    if (quality >= 80) return 'B';
    if (quality >= 70) return 'C';
    if (quality >= 60) return 'D';
    return 'F';
  }
}
