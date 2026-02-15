import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { llmJson } from "../llm/openaiClient.js";
import { ManagerPlanSchema } from "../llm/schemas.js";

export class ManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Manager", ...opts });
  }

    async plan({ userInput, iteration, traceId }) {
    this.info({ traceId, iteration }, "Planning work items (LLM)");

    const system = [
      "You are the Manager agent in a multi-agent software pipeline.",
      "Your job: classify the request as text vs code and generate work items.",
      "Return ONLY JSON that matches the provided schema.",
      "Keep workItems minimal and actionable."
    ].join("\n");

    const user = [
      `User request: ${userInput}`,
      "Decide kind=text for writing tasks, kind=code for software tasks."
    ].join("\n");

    const planJson = await llmJson({
      model: "gpt-5.2", // or whatever model you choose
      system,
      user,
      schema: ManagerPlanSchema,
      temperature: 0.1
    });

    return {
      traceId,
      iteration,
      goal: userInput,
      ...planJson
    };
  }


  async merge({ outputs, traceId, iteration }) {
    this.info({ traceId, iteration }, "Merging coder outputs");
    const patches = outputs.flatMap(o => o.patches || []);
    const notes = outputs.flatMap(o => o.notes || []);
    const risks = outputs.flatMap(o => o.risks || []);
    const summary = outputs.map(o => o.summary).filter(Boolean).join(" | ");

    return makeAgentOutput({
      summary: `Merged: ${summary}`.trim(),
      patches,
      notes,
      risks,
      metrics: { mergedAgents: outputs.length }
    });
  }

async present({ userInput, iteration, traceId, qa, security, tests, merged }) {
    this.info({ traceId, iteration }, "Presenting result");
    const finalLine = (merged?.notes || []).slice(-1)[0];

    return makeAgentOutput({
      summary: `Delivery ready for: "${userInput}"`,
      notes: [
        `Iteration: ${iteration}`,
        `QA: ${qa?.ok ? "PASS" : "FAIL"}`,
        `Security: ${security?.ok ? "PASS" : "FAIL"}`,
        `Tests: ${tests?.ok ? "PASS" : "FAIL"}`,
        finalLine ? `Output: ${finalLine}` : null
      ].filter(Boolean)
    });
  }
}

function classify(input) {
  const s = (input || "").toLowerCase();

  const textSignals = ["say ", "write ", "rewrite", "summarize", "draft", "email", "hello"];
  const codeSignals = ["api", "endpoint", "express", "react", "ui", "node", "database", "auth", "server", "client", "typescript"];

  const textScore = textSignals.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);
  const codeScore = codeSignals.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);

  return codeScore > textScore ? "code" : "text";
}

