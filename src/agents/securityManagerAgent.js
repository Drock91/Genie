import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";

export class SecurityManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "SecurityManager", ...opts });
  }

  async review({ userInput, traceId, iteration }) {
    this.info({ traceId, iteration }, "Security review");

    // Stub logic: until we have concrete code, we gate on checklist only.
    // Later: scan diffs, detect risky patterns, run npm audit, etc.
    const issues = [];

    // Example policy checks based on request text
    if (userInput.toLowerCase().includes("token") || userInput.toLowerCase().includes("secret")) {
      issues.push(
        makeIssue({
          id: "sec-001",
          title: "Potential secret handling requirement",
          severity: Severity.HIGH,
          description: "Request mentions secrets/tokens; ensure no secrets are logged or committed.",
          recommendation: [
            "Never log secrets",
            "Use env vars or secret manager",
            "Redact in structured logs"
          ],
          area: "secrets"
        })
      );
    }

    const ok = issues.length === 0; // strict for now; you can downgrade to allow warnings
    return {
      ok,
      issues,
      output: makeAgentOutput({
        summary: ok ? "Security gate PASS (checklist only)" : "Security gate FAIL",
        notes: [
          "Security checklist enforced (stub).",
          "Later: diff scanning + dependency audit + SAST-lite."
        ],
        risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
      })
    };
  }
}
