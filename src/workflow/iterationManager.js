/**
 * Iteration Manager
 * Handles the main agent workflow iteration loop
 */

/**
 * Execute single workflow iteration
 * @param {Object} options - Iteration options
 * @param {number} options.iteration - Current iteration number
 * @param {number} options.maxIterations - Maximum iterations allowed
 * @param {string} options.userInput - User input
 * @param {string} options.traceId - Request trace ID
 * @param {Object} options.agents - Agent instances
 * @param {Object} options.logger - Logger instance
 * @param {Object} options.metrics - Performance metrics tracker
 * @returns {Promise<Object>} Iteration result
 */
export async function executeIteration({
  iteration,
  maxIterations,
  userInput,
  traceId,
  agents,
  logger,
  metrics
}) {
  logger.debug({ traceId, iteration, maxIterations }, "Starting iteration");

  if (!agents?.manager) {
    throw new Error("Manager agent is required");
  }

  try {
    // Record iteration start time
    const iterationStart = Date.now();

    // Call manager agent
    const managerResult = await agents.manager.orchestrate({
      userInput,
      iteration,
      maxIterations,
      traceId
    });

    // Record metrics
    const duration = Date.now() - iterationStart;
    if (metrics) {
      metrics.recordAgentTime('manager', duration);
      metrics.recordMetric(`iteration_${iteration}_result`, managerResult.summary);
    }

    logger.info(
      { traceId, iteration, duration },
      `Iteration ${iteration} completed: ${managerResult.summary}`
    );

    return {
      iteration,
      success: true,
      duration,
      result: managerResult,
      shouldContinue: iteration < maxIterations
    };

  } catch (err) {
    logger.error(
      { traceId, iteration, error: err.message },
      `Iteration ${iteration} failed`
    );

    return {
      iteration,
      success: false,
      error: err.message,
      shouldContinue: false
    };
  }
}

/**
 * Run main workflow loop
 * @param {Object} options - Loop options
 * @param {string} options.userInput - User input
 * @param {string} options.traceId - Request trace ID
 * @param {Object} options.agents - Agent instances
 * @param {Object} options.logger - Logger instance
 * @param {Object} options.config - Configuration
 * @param {Object} options.executor - Code executor
 * @param {Object} options.store - Request store
 * @param {Object} options.metrics - Performance metrics
 * @returns {Promise<Object>} Workflow result
 */
export async function runWorkflowLoop({
  userInput,
  traceId,
  agents,
  logger,
  config,
  executor = null,
  store = null,
  metrics = null
}) {
  const maxIterations = config?.maxIterations ?? 5;
  let iteration = 0;
  let lastError = null;
  let executedFiles = [];
  const iterationResults = [];

  logger.info({ traceId, maxIterations }, "Starting main workflow loop");

  while (iteration < maxIterations) {
    iteration++;

    try {
      const result = await executeIteration({
        iteration,
        maxIterations,
        userInput,
        traceId,
        agents,
        logger,
        metrics
      });

      iterationResults.push(result);

      if (!result.success) {
        lastError = new Error(result.error || `Iteration ${iteration} failed`);
        break; // Stop on first error
      }

      // Track executed files
      if (result.result?.executedFiles) {
        executedFiles.push(...result.result.executedFiles);
      }

      // Check convergence - if we have a complete solution, can exit early
      if (result.result?.converged === true) {
        logger.info({ traceId, iteration }, "✅ Workflow converged early");
        break;
      }

    } catch (err) {
      lastError = err;
      logger.error({ traceId, iteration, error: err.message }, "Critical error in iteration");
      break;
    }
  }

  // Remove duplicates from executedFiles
  executedFiles = [...new Set(executedFiles)];

  return {
    traceId,
    iteration,
    maxIterations,
    success: !lastError,
    error: lastError?.message || null,
    executedFiles,
    iterationCount: iteration,
    iterationResults,
    converged: lastError === null && iteration < maxIterations
  };
}

/**
 * Get human-readable summary of iterations
 * @param {Array} iterationResults - Results from each iteration
 * @returns {string} Summary text
 */
export function summarizeIterations(iterationResults) {
  if (!iterationResults || iterationResults.length === 0) {
    return "No iterations completed";
  }

  const successful = iterationResults.filter(r => r.success).length;
  const failed = iterationResults.filter(r => !r.success).length;
  const totalTime = iterationResults.reduce((sum, r) => sum + (r.duration || 0), 0);

  return `${successful}/${iterationResults.length} iterations successful (${failed} failed), ${totalTime}ms total`;
}
