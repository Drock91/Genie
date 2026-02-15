import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";

export class QAManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "QAManager", ...opts });
  }

  async review({ userInput, traceId, iteration }) {
    this.info({ traceId, iteration }, "QA review");

    // Stub: without concrete code, only validate plan completeness.
    const issues = [];
    if (!userInput || userInput.trim().length < 10) {
      issues.push(
        makeIssue({
          id: "qa-001",
          title: "Input too vague",
          severity: Severity.MEDIUM,
          description: "Not enough detail to derive acceptance criteria and test cases.",
          recommendation: ["Provide concrete requirements and constraints."],
          area: "requirements"
        })
      );
    }

    const ok = issues.length === 0;
    return {
      ok,
      issues,
      output: makeAgentOutput({
        summary: ok ? "QA gate PASS (requirements heuristic)" : "QA gate FAIL",
        notes: [
          "QA currently validates request completeness only.",
          "Later: diff review + test case synthesis + edge-case checklist."
        ],
        risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
      })
    };
  }
}
