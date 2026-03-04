/**
 * Core contracts: agents return structured outputs.
 * Orchestrator is the only executor (file writes, commands, etc.) later.
 */

/**
 * Severity levels for issues and risks
 * @type {Object}
 */
export const Severity = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
});

/**
 * Create a patch object for file modifications
 * @param {string} diff - Unified diff (git-apply compatible)
 * @param {Object} meta - Optional metadata
 * @returns {Object} Patch object
 */
export function makePatch(diff, meta = {}) {
  return { diff, ...meta };
}

/**
 * Standard output contract for all agents.
 * - patches: unified diffs (git-apply compatible) OR empty in early stages
 * - actions: human/runner actions to perform
 * - notes: guidance for manager/fixer
 *
 * @param {Object} options - Output options
 * @param {string} options.summary - Agent action summary
 * @param {Array} options.patches - Array of patch objects (default: [])
 * @param {Array} options.actions - Array of actions (default: [])
 * @param {Array} options.notes - Array of notes (default: [])
 * @param {Array} options.risks - Array of risks (default: [])
 * @param {Array} options.filesRead - Array of files read (default: [])
 * @param {Object} options.metrics - Performance metrics (default: {})
 * @param {*} options.data - Optional structured data
 * @returns {Object} Standardized agent output
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
 *
 * @param {Object} options - Issue options
 * @param {string} options.id - Unique issue ID
 * @param {string} options.title - Issue title
 * @param {string} options.severity - Severity level (use Severity constants)
 * @param {string} options.description - Full description
 * @param {Array} options.repro - Steps to reproduce
 * @param {Array} options.recommendation - Recommended fixes
 * @param {string} options.area - Affected area (default: "general")
 * @returns {Object} Issue object
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
