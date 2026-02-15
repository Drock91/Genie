import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

export class FrontendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "FrontendCoder", ...opts });
  }

  async build({ plan, traceId, iteration }) {
    this.info({ traceId, iteration }, "Producing frontend changes (stub)");

    return makeAgentOutput({
      summary: "Frontend coder produced proposed approach (stub)",
      notes: [
        "No repo wired yet, so no diffs generated.",
        `Work items: ${plan.workItems.filter(w => w.owner === "frontend").map(w => w.id).join(", ")}`
      ],
      risks: ["Frontend implementation pending repo/tools integration"]
    });
  }
}
