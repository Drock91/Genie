/**
 * ExpenseTracker - Track and report LLM costs per agent
 * 
 * Provides real-time visibility into spending
 */
export class ExpenseTracker {
  constructor({ logger = null } = {}) {
    this.logger = logger;
    this.expenses = new Map(); // Map<agentName, array of expenses>
    this.totals = {
      calls: 0,
      estimatedCost: 0,
      savings: 0
    };

    // Cost per token by provider (approximate)
    this.costPerToken = {
      gpt4o: { input: 0.000005, output: 0.000015 },
      "gpt-4o": { input: 0.000005, output: 0.000015 },
      "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
      claude: { input: 0.000003, output: 0.000024 },
      "claude-opus": { input: 0.000015, output: 0.00008 },
      gemini: { input: 0.00000075, output: 0.0000025 },
      "gemini-2.0-flash": { input: 0.00000075, output: 0.0000025 }
    };
  }

  /**
   * Record an LLM call
   */
  recordCall({
    agentName,
    model,
    inputTokens = 100,
    outputTokens = 100,
    profile = "balanced",
    cacheHit = false,
    complexity = "medium"
  }) {
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    if (!this.expenses.has(agentName)) {
      this.expenses.set(agentName, []);
    }

    this.expenses.get(agentName).push({
      timestamp: Date.now(),
      model,
      inputTokens,
      outputTokens,
      cost,
      profile,
      cacheHit,
      complexity
    });

    this.totals.calls++;
    this.totals.estimatedCost += cost;

    if (cacheHit) {
      // Estimate what it would have cost without cache (3x for consensus)
      this.totals.savings += cost * 2;
    }

    this.logger?.debug(
      {
        agent: agentName,
        model,
        cost: `$${cost.toFixed(6)}`,
        cacheHit,
        totalCost: `$${this.totals.estimatedCost.toFixed(2)}`
      },
      "Expense recorded"
    );
  }

  /**
   * Calculate cost for a call
   */
  calculateCost(model, inputTokens, outputTokens) {
    const rates = this.costPerToken[model] || { input: 0.000005, output: 0.000015 };
    return inputTokens * rates.input + outputTokens * rates.output;
  }

  /**
   * Get expenses for specific agent
   */
  getAgentExpenses(agentName) {
    const calls = this.expenses.get(agentName) || [];
    const total = calls.reduce((sum, call) => sum + call.cost, 0);
    const average = calls.length > 0 ? total / calls.length : 0;

    return {
      agentName,
      callCount: calls.length,
      totalCost: `$${total.toFixed(3)}`,
      averageCost: `$${average.toFixed(5)}`,
      models: this.groupBy(calls, 'model'),
      byComplexity: this.groupBy(calls, 'complexity'),
      cacheHitRate: calls.length > 0 
        ? `${((calls.filter(c => c.cacheHit).length / calls.length) * 100).toFixed(1)}%`
        : "N/A"
    };
  }

  /**
   * Get all expenses summary
   */
  getSummary() {
    const agents = [];

    for (const [agentName] of this.expenses) {
      agents.push(this.getAgentExpenses(agentName));
    }

    // Sort by cost descending
    agents.sort((a, b) => {
      const aCost = parseFloat(a.totalCost.replace('$', ''));
      const bCost = parseFloat(b.totalCost.replace('$', ''));
      return bCost - aCost;
    });

    return {
      summary: {
        totalCalls: this.totals.calls,
        totalCost: `$${this.totals.estimatedCost.toFixed(2)}`,
        estimatedSavings: `$${this.totals.savings.toFixed(2)}`,
        averageCostPerCall: this.totals.calls > 0
          ? `$${(this.totals.estimatedCost / this.totals.calls).toFixed(5)}`
          : "$0"
      },
      byAgent: agents,
      topSpenders: agents.slice(0, 5)
    };
  }

  /**
   * Get expense report
   */
  generateReport() {
    const summary = this.getSummary();

    let report = `\n📊 LLM EXPENSE REPORT\n`;
    report += `═══════════════════════════════════\n\n`;

    report += `💰 SUMMARY\n`;
    report += `──────────\n`;
    report += `Total Calls: ${summary.summary.totalCalls}\n`;
    report += `Total Cost: ${summary.summary.totalCost}\n`;
    report += `Estimated Savings: ${summary.summary.estimatedSavings}\n`;
    report += `Average per Call: ${summary.summary.averageCostPerCall}\n\n`;

    report += `🔝 TOP 5 SPENDERS\n`;
    report += `─────────────────\n`;
    summary.topSpenders.forEach((agent, i) => {
      report += `${i + 1}. ${agent.agentName}\n`;
      report += `   Cost: ${agent.totalCost} (${agent.callCount} calls)\n`;
      report += `   Cache Hit Rate: ${agent.cacheHitRate}\n`;
    });

    report += `\n📋 FULL BREAKDOWN\n`;
    report += `─────────────────\n`;
    summary.byAgent.forEach(agent => {
      report += `\n${agent.agentName}\n`;
      report += `  Calls: ${agent.callCount}\n`;
      report += `  Total: ${agent.totalCost} (avg: ${agent.averageCost})\n`;
      report += `  Cache Hit Rate: ${agent.cacheHitRate}\n`;
    });

    return report;
  }

  /**
   * Helper: group by property
   */
  groupBy(array, property) {
    const grouped = {};
    for (const item of array) {
      const key = item[property];
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key]++;
    }
    return grouped;
  }

  /**
   * Reset all data
   */
  reset() {
    this.expenses.clear();
    this.totals = {
      calls: 0,
      estimatedCost: 0,
      savings: 0
    };
  }

  /**
   * Export data as JSON
   */
  export() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      rawExpenses: Array.from(this.expenses.entries()).map(([agent, calls]) => ({
        agent,
        calls
      }))
    };
  }
}

export default ExpenseTracker;
