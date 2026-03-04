/**
 * Refinement Workflow Handler
 * Handles code refinement requests for existing projects
 */

import path from "path";
import fs from "fs";

/**
 * Check if project has existing files
 * @param {string} projectPath - Path to project
 * @returns {boolean} True if files exist
 */
function hasExistingFiles(projectPath) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return false;
  }
  try {
    const files = fs.readdirSync(projectPath);
    return files.length > 0;
  } catch {
    return false;
  }
}

/**
 * Execute refinement workflow
 * @param {Object} options - Workflow options
 * @param {string} options.userInput - User input
 * @param {Object} options.agents - Agent instances
 * @param {Object} options.executor - Code executor
 * @param {Object} options.logger - Logger instance
 * @param {string} options.projectPath - Project path
 * @param {string} options.traceId - Request trace ID
 * @returns {Promise<Object|null>} Refinement result or null if not applicable
 */
export async function executeRefinementWorkflow({
  userInput,
  agents,
  executor,
  logger,
  projectPath,
  traceId
}) {
  // Validate inputs
  if (!agents?.codeRefiner) {
    logger.debug({ traceId }, "CodeRefiner agent not available");
    return null;
  }

  if (!hasExistingFiles(projectPath)) {
    logger.debug({ traceId, projectPath }, "No existing files found");
    return null;
  }

  logger.info({ traceId, projectPath }, "🔧 Detected refinement request for existing code");

  try {
    // Call refinement agent
    const refinementResult = await agents.codeRefiner.refineExistingCode({
      userInput,
      projectPath,
      filePaths: [] // Auto-detect all code files
    });

    // Validate result
    if (!refinementResult) {
      throw new Error("CodeRefiner returned empty result");
    }

    // Execute patches if available
    let executedFiles = [];
    if (executor && refinementResult.patches && refinementResult.patches.length > 0) {
      try {
        logger.debug({ traceId, patchCount: refinementResult.patches.length }, "Executing refinement patches");
        
        const execResult = await executor.execute(refinementResult.patches);
        executedFiles = execResult.files || [];
        
        logger.info(
          { traceId, filesUpdated: execResult.executed, filesCount: executedFiles.length },
          "✅ Refinement patches applied successfully"
        );
      } catch (execError) {
        logger.error({ traceId, error: execError.message }, "Failed to execute refinement patches");
        throw new Error(`Patch execution failed: ${execError.message}`);
      }
    }

    return {
      type: 'refinement',
      success: true,
      executedFiles,
      patches: refinementResult.patches,
      summary: refinementResult.summary,
      analysis: refinementResult.analysis
    };

  } catch (err) {
    logger.error(
      { traceId, error: err.message },
      "❌ Refinement workflow failed, will fall back to normal workflow"
    );
    return null; // Signal to fall back to normal workflow
  }
}

/**
 * Check if request should trigger refinement
 * @param {string} userInput - User input
 * @param {string} projectPath - Project path
 * @returns {boolean} True if refinement should be attempted
 */
export function shouldAttemptRefinement(userInput, projectPath) {
  // Check for refinement keywords
  const refinementKeywords = /\b(refine|improve|fix|update|change|modify|enhance|adjust|optimize|beautify|refactor)\b/i;
  
  if (!refinementKeywords.test(userInput)) {
    return false;
  }

  // Check if project has existing files
  if (!projectPath || !fs.existsSync(projectPath)) {
    return false;
  }

  try {
    return fs.readdirSync(projectPath).length > 0;
  } catch {
    return false;
  }
}
