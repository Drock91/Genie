/**
 * HR Agent
 * Human resources, recruiting, staff management, performance reviews, training
 */

export class HRAgent {
  constructor(logger = null, multiLlmSystem = null) {
    this.logger = logger;
    this.multiLlmSystem = multiLlmSystem;
    this.name = "HR Department";
    this.profile = "balanced";
    this.temperature = 0.2;
  }

  async consensusCall(prompt) {
    if (!this.multiLlmSystem) throw new Error("MultiLlmSystem not available");
    return await this.multiLlmSystem.consensusCall({ prompt, profile: this.profile, temperature: this.temperature, metadata: { department: "hr" } });
  }

  async createJobDescription(role, requirements) {
    const prompt = `Create a professional job description for:
Role: ${role}
Requirements: ${JSON.stringify(requirements)}

Include: title, department, reports to, key responsibilities, required skills, nice-to-have skills, compensation range, benefits, career path.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "hr", action: "job_description" }, "Job description created");
    return result;
  }

  async screenCandidates(jobDescription, candidates) {
    const prompt = `Screen candidates for this role:
Job: ${jobDescription}
Candidates: ${JSON.stringify(candidates)}

For each candidate, provide: match score (0-100), strengths, gaps, interview recommendations, red flags.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "hr", action: "candidate_screening" }, "Candidates screened");
    return result;
  }

  async performanceReview(employee, metrics) {
    const prompt = `Conduct performance review:
Employee: ${employee}
Metrics: ${JSON.stringify(metrics)}

Provide: overall rating, strengths, areas for improvement, goals for next period, compensation recommendation, promotion potential.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "hr", action: "performance_review" }, "Performance review completed");
    return result;
  }

  async developTrainingProgram(skills, level) {
    const prompt = `Design training program:
Skills Needed: ${skills}
Level: ${level}

Create: curriculum outline, modules, timeline, assessment methods, resources needed, success metrics.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "hr", action: "training_program" }, "Training program developed");
    return result;
  }

  async orchestrateTeamBuilding(teamSize, objectives) {
    const prompt = `Plan team building activities:
Team Size: ${teamSize}
Objectives: ${objectives}

Suggest: activities, timeline, budget estimate, expected outcomes, follow-up engagement.
Return as JSON.`;
    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "hr", action: "team_building" }, "Team building plan created");
    return result;
  }
}

export default HRAgent;
