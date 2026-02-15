import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { llmJson } from "../llm/openaiClient.js";
import { WriterOutputSchema } from "../llm/schemas.js";

export class WriterAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Writer", ...opts });
  }

  async build({ plan, traceId, iteration }) {
    this.info({ traceId, iteration }, "Producing textual response (LLM)");

    const system = [
      "You are a writing agent.",
      "Produce exactly one final answer for the user's request.",
      "No preamble, no analysis, no bullet points unless requested.",
      "Return ONLY JSON matching the provided schema."
    ].join("\n");

    const user = `User request: ${plan.goal}`;

    const out = await llmJson({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      system,
      user,
      schema: WriterOutputSchema,
      temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.2")
    });

    return makeAgentOutput({
      summary: out.summary,
      notes: [out.final]
    });
  }
}
