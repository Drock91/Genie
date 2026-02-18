/**
 * LLM Usage Tracker
 * Detailed tracking of all LLM calls, costs, providers, and usage patterns
 */

export class LLMUsageTracker {
  constructor({ logger }) {
    this.logger = logger;
    this.calls = [];
    this.providerStats = {
      openai: { calls: 0, tokens: 0, cost: 0, models: {} },
      anthropic: { calls: 0, tokens: 0, cost: 0, models: {} },
      google: { calls: 0, tokens: 0, cost: 0, models: {} }
    };
    this.poolStats = {
      paid: { calls: 0, cost: 0 },
      free: { calls: 0, cost: 0 }
    };
    this.agentUsage = {};
    this.totalCost = 0;
    this.startTime = Date.now();
  }

  /**
   * Record an LLM call
   */
  recordCall({
    agent = 'unknown',
    provider,
    model,
    pool = 'unknown',
    promptTokens = 0,
    completionTokens = 0,
    totalTokens = 0,
    cost = 0,
    duration = 0,
    success = true,
    purpose = '',
    consensusUsed = false
  }) {
    const call = {
      timestamp: new Date().toISOString(),
      agent,
      provider,
      model,
      pool,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      duration,
      success,
      purpose,
      consensusUsed
    };

    this.calls.push(call);

    // Update provider stats
    if (this.providerStats[provider]) {
      this.providerStats[provider].calls++;
      this.providerStats[provider].tokens += totalTokens;
      this.providerStats[provider].cost += cost;
      
      if (!this.providerStats[provider].models[model]) {
        this.providerStats[provider].models[model] = {
          calls: 0,
          tokens: 0,
          cost: 0
        };
      }
      this.providerStats[provider].models[model].calls++;
      this.providerStats[provider].models[model].tokens += totalTokens;
      this.providerStats[provider].models[model].cost += cost;
    }

    // Update pool stats
    if (this.poolStats[pool]) {
      this.poolStats[pool].calls++;
      this.poolStats[pool].cost += cost;
    }

    // Update agent usage
    if (!this.agentUsage[agent]) {
      this.agentUsage[agent] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        providers: {}
      };
    }
    this.agentUsage[agent].calls++;
    this.agentUsage[agent].tokens += totalTokens;
    this.agentUsage[agent].cost += cost;
    
    if (!this.agentUsage[agent].providers[provider]) {
      this.agentUsage[agent].providers[provider] = 0;
    }
    this.agentUsage[agent].providers[provider]++;

    this.totalCost += cost;

    this.logger?.debug({
      agent,
      provider,
      model,
      tokens: totalTokens,
      cost: cost.toFixed(4)
    }, "LLM call recorded");
  }

  /**
   * Generate comprehensive usage report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    
    return {
      summary: {
        totalCalls: this.calls.length,
        totalTokens: this.calls.reduce((sum, c) => sum + c.totalTokens, 0),
        totalCost: this.totalCost,
        duration: duration,
        durationMinutes: (duration / 1000 / 60).toFixed(2),
        successRate: ((this.calls.filter(c => c.success).length / this.calls.length) * 100).toFixed(1) + '%'
      },
      providers: this._generateProviderReport(),
      pools: this._generatePoolReport(),
      agents: this._generateAgentReport(),
      timeline: this._generateTimeline(),
      costBreakdown: this._generateCostBreakdown()
    };
  }

  _generateProviderReport() {
    const providers = [];
    
    Object.entries(this.providerStats).forEach(([name, stats]) => {
      if (stats.calls > 0) {
        const models = [];
        Object.entries(stats.models).forEach(([modelName, modelStats]) => {
          models.push({
            model: modelName,
            calls: modelStats.calls,
            tokens: modelStats.tokens,
            cost: modelStats.cost.toFixed(4),
            avgTokensPerCall: (modelStats.tokens / modelStats.calls).toFixed(0)
          });
        });

        providers.push({
          provider: name,
          calls: stats.calls,
          tokens: stats.tokens,
          cost: stats.cost.toFixed(4),
          percentage: ((stats.cost / this.totalCost) * 100).toFixed(1) + '%',
          models: models.sort((a, b) => b.calls - a.calls)
        });
      }
    });

    return providers.sort((a, b) => b.calls - a.calls);
  }

  _generatePoolReport() {
    return {
      paid: {
        calls: this.poolStats.paid.calls,
        cost: this.poolStats.paid.cost.toFixed(4),
        percentage: ((this.poolStats.paid.cost / this.totalCost) * 100).toFixed(1) + '%'
      },
      free: {
        calls: this.poolStats.free.calls,
        cost: this.poolStats.free.cost.toFixed(4),
        percentage: ((this.poolStats.free.cost / this.totalCost) * 100).toFixed(1) + '%'
      },
      savings: {
        amount: this._calculateSavings().toFixed(4),
        percentage: this._calculateSavingsPercentage().toFixed(1) + '%'
      }
    };
  }

  _generateAgentReport() {
    const agents = [];
    
    Object.entries(this.agentUsage).forEach(([name, stats]) => {
      const providerBreakdown = [];
      Object.entries(stats.providers).forEach(([provider, count]) => {
        providerBreakdown.push({
          provider,
          calls: count,
          percentage: ((count / stats.calls) * 100).toFixed(1) + '%'
        });
      });

      agents.push({
        agent: name,
        calls: stats.calls,
        tokens: stats.tokens,
        cost: stats.cost.toFixed(4),
        avgTokensPerCall: (stats.tokens / stats.calls).toFixed(0),
        costPercentage: ((stats.cost / this.totalCost) * 100).toFixed(1) + '%',
        providers: providerBreakdown.sort((a, b) => b.calls - a.calls)
      });
    });

    return agents.sort((a, b) => b.calls - a.calls);
  }

  _generateTimeline() {
    const timeline = [];
    let cumulativeCost = 0;

    this.calls.forEach(call => {
      cumulativeCost += call.cost;
      timeline.push({
        timestamp: call.timestamp,
        agent: call.agent,
        provider: call.provider,
        model: call.model,
        tokens: call.totalTokens,
        cost: call.cost.toFixed(4),
        cumulativeCost: cumulativeCost.toFixed(4),
        purpose: call.purpose
      });
    });

    return timeline;
  }

  _generateCostBreakdown() {
    return {
      byProvider: Object.entries(this.providerStats)
        .filter(([_, stats]) => stats.calls > 0)
        .map(([name, stats]) => ({
          provider: name,
          cost: stats.cost.toFixed(4),
          percentage: ((stats.cost / this.totalCost) * 100).toFixed(1) + '%'
        }))
        .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost)),
      
      byAgent: Object.entries(this.agentUsage)
        .map(([name, stats]) => ({
          agent: name,
          cost: stats.cost.toFixed(4),
          percentage: ((stats.cost / this.totalCost) * 100).toFixed(1) + '%'
        }))
        .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost))
    };
  }

  _calculateSavings() {
    // Estimate what it would cost using only paid tier
    const freeCalls = this.calls.filter(c => c.pool === 'free');
    const estimatedPaidCost = freeCalls.reduce((sum, call) => {
      // Assume free calls would cost ~0.015 on average if paid
      return sum + 0.015;
    }, 0);
    return estimatedPaidCost;
  }

  _calculateSavingsPercentage() {
    const estimatedFullCost = this.totalCost + this._calculateSavings();
    if (estimatedFullCost === 0) return 0;
    return (this._calculateSavings() / estimatedFullCost) * 100;
  }

  /**
   * Print formatted report to console
   */
  printReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 LLM USAGE REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📈 SUMMARY:');
    console.log(`  Total LLM Calls: ${report.summary.totalCalls}`);
    console.log(`  Total Tokens: ${report.summary.totalTokens.toLocaleString()}`);
    console.log(`  Total Cost: $${report.summary.totalCost.toFixed(4)}`);
    console.log(`  Duration: ${report.summary.durationMinutes} minutes`);
    console.log(`  Success Rate: ${report.summary.successRate}`);
    
    console.log('\n🏢 PROVIDERS USED:');
    report.providers.forEach(p => {
      console.log(`\n  ${p.provider.toUpperCase()}:`);
      console.log(`    Calls: ${p.calls} (${p.percentage} of total cost)`);
      console.log(`    Tokens: ${p.tokens.toLocaleString()}`);
      console.log(`    Cost: $${p.cost}`);
      console.log(`    Models:`);
      p.models.forEach(m => {
        console.log(`      - ${m.model}: ${m.calls} calls, ${m.tokens.toLocaleString()} tokens, $${m.cost}`);
      });
    });
    
    console.log('\n💰 POOL USAGE:');
    console.log(`  Paid Pool:`);
    console.log(`    Calls: ${report.pools.paid.calls}`);
    console.log(`    Cost: $${report.pools.paid.cost} (${report.pools.paid.percentage})`);
    console.log(`  Free Pool:`);
    console.log(`    Calls: ${report.pools.free.calls}`);
    console.log(`    Cost: $${report.pools.free.cost} (${report.pools.free.percentage})`);
    console.log(`  💡 Estimated Savings: $${report.pools.savings.amount} (${report.pools.savings.percentage})`);
    
    console.log('\n🤖 AGENT USAGE:');
    report.agents.forEach(a => {
      console.log(`\n  ${a.agent}:`);
      console.log(`    Calls: ${a.calls}`);
      console.log(`    Tokens: ${a.tokens.toLocaleString()} (avg: ${a.avgTokensPerCall} per call)`);
      console.log(`    Cost: $${a.cost} (${a.costPercentage} of total)`);
      console.log(`    Providers: ${a.providers.map(p => `${p.provider} (${p.percentage})`).join(', ')}`);
    });
    
    console.log('\n💵 COST BREAKDOWN:');
    console.log('  By Provider:');
    report.costBreakdown.byProvider.forEach(item => {
      console.log(`    ${item.provider}: $${item.cost} (${item.percentage})`);
    });
    console.log('  By Agent:');
    report.costBreakdown.byAgent.forEach(item => {
      console.log(`    ${item.agent}: $${item.cost} (${item.percentage})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 What Each LLM Did:');
    console.log('='.repeat(80));
    report.timeline.slice(0, 20).forEach(call => { // Show first 20 calls
      console.log(`[${call.timestamp.substring(11, 19)}] ${call.agent} → ${call.provider}/${call.model}`);
      console.log(`  Purpose: ${call.purpose || 'General processing'}`);
      console.log(`  Tokens: ${call.tokens}, Cost: $${call.cost}, Cumulative: $${call.cumulativeCost}`);
    });
    
    if (report.timeline.length > 20) {
      console.log(`\n  ... and ${report.timeline.length - 20} more calls`);
    }
    
    console.log('\n' + '='.repeat(80));
    
    return report;
  }

  /**
   * Get raw call data
   */
  getCalls() {
    return this.calls;
  }

  /**
   * Reset tracker
   */
  reset() {
    this.calls = [];
    this.providerStats = {
      openai: { calls: 0, tokens: 0, cost: 0, models: {} },
      anthropic: { calls: 0, tokens: 0, cost: 0, models: {} },
      google: { calls: 0, tokens: 0, cost: 0, models: {} }
    };
    this.poolStats = {
      paid: { calls: 0, cost: 0 },
      free: { calls: 0, cost: 0 }
    };
    this.agentUsage = {};
    this.totalCost = 0;
    this.startTime = Date.now();
  }
}
