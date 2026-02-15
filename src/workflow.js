export async function runWorkflow({ userInput, agents, logger, config, executor = null, store = null }) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error("Invalid userInput");
  }

  const traceId = `${Math.random().toString(16).slice(2)}-${Date.now()}`;
  const maxIterations = config?.maxIterations ?? 5;
  const startTime = Date.now();

  logger.info({ traceId, userInput, maxIterations }, "Workflow started");

  let iteration = 0;
  let lastError = null;
  let executedFiles = [];

  while (iteration < maxIterations) {
    iteration++;
    logger.info({ traceId, iteration }, "Iteration start");

    try {
      const plan = await agents.manager.plan({ userInput, iteration, traceId });
      logger.info({ traceId, iteration, kind: plan.kind }, "Plan created");

      const outputs = [];
      if (plan.kind === "text") {
        outputs.push(await agents.writer.build({ plan, traceId, iteration }));
      } else {
        const [backend, frontend] = await Promise.all([
          agents.backend.build({ plan, traceId, iteration }),
          agents.frontend.build({ plan, traceId, iteration })
        ]);
        outputs.push(backend, frontend);
      }

      const merged = await agents.manager.merge({ outputs, traceId, iteration });
      logger.info({ traceId, iteration, patches: merged.patches.length }, "Outputs merged");

      // Execute patches if executor provided
      if (executor && merged.patches && merged.patches.length > 0) {
        const execResult = await executor.execute(merged.patches);
        executedFiles.push(...(execResult.files || []));
        logger.info({ traceId, iteration, executed: execResult.executed }, "Patches executed");
      }

      const [security, qa, tests] = await Promise.all([
        agents.security.review({ userInput, traceId, iteration }),
        agents.qa.review({ userInput, traceId, iteration }),
        agents.tests.run({ traceId, iteration })
      ]);

      const ok = security.ok && qa.ok && tests.ok;
      logger.info({ traceId, iteration, ok, security: security.ok, qa: qa.ok, tests: tests.ok }, "Gate evaluation");

      if (ok) {
        const present = await agents.manager.present({
          userInput,
          iteration,
          traceId,
          qa,
          security,
          tests,
          merged
        });

        const duration = Date.now() - startTime;
        const result = { traceId, iteration, plan, merged, security, qa, tests, present, success: true, executedFiles };

        // Save request if store provided
        if (store) {
          store.save({
            traceId,
            userInput,
            iteration,
            success: true,
            plan,
            results: { security, qa, tests, present },
            executedFiles,
            duration
          });
        }

        logger.info({ traceId, iteration, duration }, "Workflow completed successfully");
        return result;
      }

      // Fix loop
      const fix = await agents.fixer.patch({ qa, security, tests, traceId, iteration });
      logger.info({ traceId, iteration, fixes: fix.patches?.length ?? 0 }, "Fixes generated");

      // Execute fix patches if executor provided
      if (executor && fix.patches && fix.patches.length > 0) {
        const execResult = await executor.execute(fix.patches);
        executedFiles.push(...(execResult.files || []));
        logger.info({ traceId, iteration, executed: execResult.executed }, "Fix patches executed");
      }

      if (fix.patches && fix.patches.length > 0) {
        logger.info({ traceId, iteration }, "Fixes available, continuing iteration");
      } else {
        logger.warn({ traceId, iteration }, "No fixes generated, stopping");
        const duration = Date.now() - startTime;

        const result = {
          traceId,
          iteration,
          plan,
          merged,
          security,
          qa,
          tests,
          fix,
          success: false,
          error: "Validation failures but no fixes generated",
          executedFiles,
          duration
        };

        if (store) {
          store.save({
            traceId,
            userInput,
            iteration,
            success: false,
            plan,
            results: { security, qa, tests, fix },
            errors: [result.error],
            executedFiles,
            duration
          });
        }

        return result;
      }
    } catch (err) {
      lastError = err;
      logger.error({ traceId, iteration, error: err.message }, "Iteration failed");
      if (iteration >= maxIterations) break;
    }
  }

  const duration = Date.now() - startTime;
  logger.error({ traceId, maxIterations, duration }, "Workflow max iterations reached");

  const result = { traceId, iteration, error: "Max iterations reached", lastError: lastError?.message, success: false, executedFiles, duration };

  if (store) {
    store.save({
      traceId,
      userInput,
      iteration,
      success: false,
      errors: [result.error, lastError?.message].filter(Boolean),
      executedFiles,
      duration
    });
  }

  return result;
}

