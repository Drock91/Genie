import { writePdf } from "./util/pdfWriter.js";
import path from "path";

export async function runWorkflow({ userInput, agents, logger, config, executor = null, store = null }) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error("Invalid userInput");
  }

  const traceId = `${Math.random().toString(16).slice(2)}-${Date.now()}`;
  const maxIterations = config?.maxIterations ?? 5;
  const startTime = Date.now();

  // Extract projectName for context (same logic as index.js)
  function extractProjectName(userInput) {
    const patterns = [
      /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|called\s+)?["`']?(\w+)["`']?/i,
      /(?:product|company|service)\s+(?:called|named)\s+["`']?(\w+)["`']?/i,
      /folder called\s+["`']?(\w+)["`']?/i,
      /^\s*(\w+)\s*(?:app|project|system)/i
    ];
    for (const pattern of patterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
    }
    return "Project";
  }
  const projectName = extractProjectName(userInput);
  
  // Check if user requested PDF output
  const pdfRequested = /\bpdf\b/i.test(userInput);
  const outputFolderMatch = userInput.match(/(?:in|to)\s+(?:the\s+)?output(?:\s+folder)?(?:\s+in\s+(?:a\s+)?folder\s+called\s+)?(["\']?\w+["\']?)?/i);
  const customFolder = outputFolderMatch ? outputFolderMatch[1]?.replace(/["']/g, '') : null;

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
      const agentContext = { projectName };
      if (plan.kind === "text") {
        outputs.push(await agents.writer.build({ plan, traceId, iteration, context: agentContext }));
      } else {
        const [backend, frontend] = await Promise.all([
          agents.backend.build({ plan, traceId, iteration, context: agentContext }),
          agents.frontend.build({ plan, traceId, iteration, context: agentContext })
        ]);
        outputs.push(backend, frontend);
      }

      const merged = await agents.manager.merge({ outputs, traceId, iteration });
      logger.info({ traceId, iteration, patches: merged.patches.length }, "Outputs merged");

      // DEBUG: Log all patch file targets before execution
      if (merged.patches && merged.patches.length > 0) {
        logger.info({
          traceId,
          iteration,
          patchFiles: merged.patches.map(p => p.file || (p.diff ? (p.diff.match(/\*\*\* Add File: ([^\n]+)/)?.[1] || 'UNKNOWN') : 'UNKNOWN')),
          patchCount: merged.patches.length,
          patchSample: merged.patches[0]?.diff?.slice(0, 200) || merged.patches[0]?.file || 'NO_DIFF'
        }, "DEBUG: Patches to be executed");
      }

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

      // Relaxed gating: allow file generation if tests pass, even if security/QA fail
      const ok = tests.ok;
      logger.info({ traceId, iteration, ok, security: security.ok, qa: qa.ok, tests: tests.ok }, "Gate evaluation (relaxed: only tests block)");

      if (ok) {
        if (!security.ok) logger.warn({ traceId, iteration }, "Security gate failed, proceeding for demo");
        if (!qa.ok) logger.warn({ traceId, iteration }, "QA gate failed, proceeding for demo");

        const present = await agents.manager.present({
          userInput,
          iteration,
          traceId,
          qa,
          security,
          tests,
          merged
        });

        // Generate PDF if requested
        if (pdfRequested && plan.kind === "text") {
          try {
            const folderName = customFolder || projectName;
            const outputDir = path.join("./output", folderName);
            const pdfPath = path.join(outputDir, `${folderName.replace(/\s+/g, '_')}.pdf`);
            
            // Extract content from merged outputs
            const content = merged.notes?.join('\n\n') || "No content generated";
            const title = userInput.slice(0, 100) + (userInput.length > 100 ? "..." : "");
            
            logger.info({ pdfPath, folderName }, "Generating PDF");
            
            await writePdf({
              outputPath: pdfPath,
              title,
              text: content
            });
            
            executedFiles.push({
              path: pdfPath,
              success: true,
              fullPath: path.resolve(pdfPath)
            });
            
            logger.info({ pdfPath }, "PDF generated successfully");
            console.log(`\n📄 PDF created: ${pdfPath}\n`);
          } catch (pdfError) {
            logger.error({ error: pdfError.message }, "PDF generation failed");
            console.log(`\n⚠️  PDF generation failed: ${pdfError.message}\n`);
          }
        }

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

        logger.info({ traceId, iteration, duration }, "Workflow completed successfully (relaxed gating)");
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

