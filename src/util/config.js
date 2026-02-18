export function getConfig() {
  const required = ["OPENAI_API_KEY"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";

  return {
    env,
    isProduction,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4-turbo",
    openaiTemp: Number(process.env.OPENAI_TEMPERATURE ?? "0.2"),
    maxIterations: Number(process.env.MAX_ITERATIONS ?? "5"),
    retryAttempts: Number(process.env.RETRY_ATTEMPTS ?? "3"),
    requestTimeout: Number(process.env.REQUEST_TIMEOUT ?? "60000"),
    paidBudgetUsd: Number(process.env.PAID_BUDGET_USD ?? "0"),
    paidSelectionMode: process.env.PAID_SELECTION_MODE || "round_robin",
    consensusCount: Number(process.env.CONSENSUS_COUNT ?? "2")
  };
}
