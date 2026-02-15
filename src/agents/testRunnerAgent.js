import { BaseAgent } from "./baseAgent.js";

export class TestRunnerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "TestRunner", ...opts });
  }

  async run({ traceId, iteration }) {
    this.info({ traceId, iteration }, "Running tests (stub)");
    // Later: run npm test / dotnet test / etc.
    return { ok: true, stdout: "", stderr: "", exitCode: 0 };
  }
}
