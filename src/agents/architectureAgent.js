/**
 * Architecture Agent
 * Technical architecture, system design, technical strategy, scalability planning
 */

export class ArchitectureAgent {
  constructor(logger = null, multiLlmSystem = null) {
    this.logger = logger;
    this.multiLlmSystem = multiLlmSystem;
    this.name = "Architecture Team";
    this.profile = "accurate";
    this.temperature = 0.1;
  }

  async consensusCall(prompt) {
    if (!this.multiLlmSystem) throw new Error("MultiLlmSystem not available");
    return await this.multiLlmSystem.consensusCall({ prompt, profile: this.profile, temperature: this.temperature, metadata: { department: "architecture" } });
  }

  async designSystem(requirements) {
    const prompt = `Design system architecture:
Requirements: ${JSON.stringify(requirements)}

Create: high-level diagram, component breakdown, data flows, technology choices, justification, trade-offs, scalability considerations, tech debt management.
Return as detailed JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "architecture", action: "system_design" }, "System designed");
    return result;
  }

  async reviewArchitecture(currentArch) {
    const prompt = `Architecture review:
Current: ${JSON.stringify(currentArch)}

Analyze: strengths, weaknesses, scalability limits, security concerns, maintenance burden, technical debt, refactoring opportunities.
Return as JSON with severity levels.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "architecture", action: "architecture_review" }, "Architecture reviewed");
    return result;
  }

  async planMigration(from, to) {
    const prompt = `Plan architecture migration:
From: ${from}
To: ${to}

Create: migration strategy, phases, rollback plan, resource needs, cost estimate, risk analysis, testing approach, success criteria.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "architecture", action: "migration_planning" }, "Migration planned");
    return result;
  }

  async evaluateTechStack(requirements) {
    const prompt = `Evaluate technology stack:
Requirements: ${JSON.stringify(requirements)}

Compare: frontend frameworks, backend frameworks, databases, caching, queues, monitoring, trade-offs, learning curve, community support.
Return as JSON comparison.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "architecture", action: "tech_evaluation" }, "Tech stack evaluated");
    return result;
  }

  async identifyTechDebt(codebase) {
    const prompt = `Identify technical debt:
Codebase: ${codebase}

Find: outdated dependencies, code smells, architectural issues, missing tests, security vulnerabilities, performance bottlenecks.
Prioritize: by impact and effort to resolve.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "architecture", action: "tech_debt_analysis" }, "Tech debt identified");
    return result;
  }
}

export default ArchitectureAgent;
