import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

export class FixerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Fixer", ...opts });
  }

  async patch({ qa, security, tests, traceId, iteration }) {
    this.info({ traceId, iteration }, "Generating fix plan (stub)");

    const notes = [];
    if (!security.ok) notes.push(`Security issues: ${security.issues.map(i => i.id).join(", ")}`);
    if (!qa.ok) notes.push(`QA issues: ${qa.issues.map(i => i.id).join(", ")}`);
    if (!tests.ok) notes.push(`Test failures: exitCode=${tests.exitCode}`);

    return makeAgentOutput({
      summary: "Fixer produced remediation plan (no diffs yet)",
      notes,
      risks: ["No repo/diff integration yet, cannot generate patches"]
    });
  }
}
