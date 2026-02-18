/**
 * Core contracts: agents return structured outputs.
 * Orchestrator is the only executor (file writes, commands, etc.) later.
 */

export const Severity = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
});

export function makePatch(diff, meta = {}) {
  return { diff, ...meta };
}

/**
 * Standard output contract for all agents.
 * - patches: unified diffs (git-apply compatible) OR empty in early stages
 * - actions: human/runner actions to perform
 * - notes: guidance for manager/fixer
 */
export function makeAgentOutput({
  summary,
  patches = [],
  actions = [],
  notes = [],
  risks = [],
  filesRead = [],
  metrics = {},
  data = null
}) {
  return { summary, patches, actions, notes, risks, filesRead, metrics, ...(data && { data }) };
}

/**
 * QA/Security issue format
 */
export function makeIssue({
  id,
  title,
  severity = Severity.MEDIUM,
  description,
  repro = [],
  recommendation = [],
  area = "general"
}) {
  return { id, title, severity, description, repro, recommendation, area };
}
