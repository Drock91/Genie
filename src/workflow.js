import { writePdf } from "./util/pdfWriter.js";
import { CostOptimizationSystem } from "./util/costOptimization.js";
import HtmlImageEmbedder from "./util/htmlImageEmbedder.js";
import { extractProjectName, extractOutputFolder, isPdfRequested, isRefinementRequest } from "./util/inputParser.js";
import path from "path";
import fs from "fs";

export async function runWorkflow({ userInput, agents, logger, config, executor = null, store = null, costOptimization = null, llmUsageTracker = null }) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error("Invalid userInput");
  }

  const traceId = `${Math.random().toString(16).slice(2)}-${Date.now()}`;
  const maxIterations = config?.maxIterations ?? 5;
  const researchOnly = Boolean(config?.researchOnly);
  const startTime = Date.now();

  // Store tracker globally for multiLlm system to access
  if (llmUsageTracker) {
    global.llmUsageTracker = llmUsageTracker;
  }

  // Initialize cost optimization if not provided
  if (!costOptimization && !config?.disableCostOptimization) {
    costOptimization = new CostOptimizationSystem({ logger });
    await costOptimization.initialize();
    costOptimization.integrateWithAgents(agents);
    
    logger.info({}, "🟢 Cost Optimization activated - 70-85% savings expected!");
  }

  // Extract projectName and other metadata from user input
  const projectName = extractProjectName(userInput);
  const pdfRequested = isPdfRequested(userInput);
  const customFolder = extractOutputFolder(userInput);
  const isRefinement = isRefinementRequest(userInput);
  const projectPath = executor ? path.join(executor.workspaceDir) : null;
  const hasExistingFiles = projectPath && fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0;

  // If refinement requested AND files exist, use CodeRefinerAgent
  if (!researchOnly && isRefinement && hasExistingFiles && agents.codeRefiner) {
    logger.info({ traceId, projectPath, isRefinement: true }, "Detected refinement request for existing code");
    
    try {
      const refinementResult = await agents.codeRefiner.refineExistingCode({
        userInput,
        projectPath,
        filePaths: [] // Auto-detect all code files
      });

      // Validate refinement result
      if (!refinementResult) {
        throw new Error("CodeRefiner returned empty result");
      }

      // Execute the patches
      let executedFiles = [];
      if (executor && refinementResult.patches && refinementResult.patches.length > 0) {
        try {
          const execResult = await executor.execute(refinementResult.patches);
          executedFiles = execResult.files || [];
          logger.info({ traceId, filesUpdated: execResult.executed }, "Refinement patches applied successfully");
        } catch (execError) {
          logger.error({ traceId, error: execError.message }, "Failed to execute refinement patches");
          throw new Error(`Patch execution failed: ${execError.message}`);
        }
      }

      const duration = Date.now() - startTime;
      
      const result = {
        traceId,
        iteration: 1,
        plan: { kind: 'refinement', goal: userInput },
        merged: { patches: refinementResult.patches, summary: refinementResult.summary },
        success: true,
        executedFiles,
        refinement: refinementResult.analysis,
        duration
      };

      if (store) {
        store.save({
          traceId,
          userInput,
          iteration: 1,
          success: true,
          type: 'refinement',
          executedFiles,
          duration
        });
      }

      logger.info({ traceId, duration }, "Refinement workflow completed");
      return result;

    } catch (err) {
      logger.error({ traceId, error: err.message }, "Refinement failed, falling back to normal workflow");
      // Fall through to normal workflow if refinement fails
    }
  }

  logger.info({ traceId, userInput, maxIterations, researchOnly }, "Workflow started");

  let iteration = 0;
  let lastError = null;
  let executedFiles = [];

  while (iteration < maxIterations) {
    iteration++;
    logger.info({ traceId, iteration }, "Iteration start");

    try {
      const plan = await agents.manager.plan({ userInput, iteration, traceId, researchOnly });
      if (config?.powerLevel) {
        const normalized = config.powerLevel === "med" ? "medium" : config.powerLevel;
        const power = ["low", "medium", "high"].includes(normalized) ? normalized : null;
        if (power) {
          plan.consensusLevel = power === "high" ? "consensus" : "single";
          logger.info({ traceId, iteration, powerLevel: power, consensusLevel: plan.consensusLevel }, "Power override applied");
        }
      }

      if (researchOnly) {
        const existingWriterItems = (plan.workItems || []).filter(w => w.owner === "writer");

        plan.kind = "text";
        plan.workItems = existingWriterItems.length > 0
          ? existingWriterItems
          : [{
              id: `research-${iteration}`,
              owner: "writer",
              task: `Research and synthesize a detailed answer for: ${userInput}`
            }];
        plan.requiredAgents = { security: false, qa: false, legal: false };
        if (!config?.powerLevel) {
          plan.consensusLevel = "consensus";
        }
      }

      logger.info({ traceId, iteration, kind: plan.kind }, "Plan created");

      const outputs = [];
      const agentContext = {
        projectName,
        consensusLevel: plan.consensusLevel || "single"
      };

      // Determine which agents need to run based on work items
      const hasWriterWork = plan.workItems?.some(w => w.owner === "writer");
      const hasBackendWork = plan.workItems?.some(w => w.owner === "backend");
      const hasFrontendWork = plan.workItems?.some(w => w.owner === "frontend");

      // Run agents in parallel if they have work
      const agentPromises = [];
      
      if (hasWriterWork) {
        agentPromises.push(agents.writer.build({ plan, traceId, iteration, context: agentContext, userInput, researchOnly }));
      }
      if (hasBackendWork) {
        agentPromises.push(agents.backend.build({ plan, traceId, iteration, context: agentContext, userInput }));
      }
      if (hasFrontendWork) {
        agentPromises.push(agents.frontend.build({ plan, traceId, iteration, context: agentContext, userInput }));
      }

      // If no specific work items, fall back to plan.kind
      if (agentPromises.length === 0) {
        if (plan.kind === "text" || researchOnly) {
          agentPromises.push(agents.writer.build({ plan, traceId, iteration, context: agentContext, userInput, researchOnly }));
        } else {
          agentPromises.push(
            agents.backend.build({ plan, traceId, iteration, context: agentContext, userInput }),
            agents.frontend.build({ plan, traceId, iteration, context: agentContext, userInput })
          );
        }
      }

      const results = await Promise.all(agentPromises);
      outputs.push(...results);

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
      if (!researchOnly && executor && merged.patches && merged.patches.length > 0) {
        const execResult = await executor.execute(merged.patches);
        executedFiles.push(...(execResult.files || []));
        logger.info({ traceId, iteration, executed: execResult.executed }, "Patches executed");
      }

      // Conditionally call review agents based on plan requirements
      const reviewPromises = [];
      const requiredAgents = plan.requiredAgents || { security: false, qa: true, legal: false };
      
      logger.info({ 
        traceId, 
        iteration, 
        requiredAgents,
        skippedAgents: {
          security: !requiredAgents.security,
          legal: !requiredAgents.legal
        }
      }, "Running required review agents only");

      if (!researchOnly) {
        reviewPromises.push(
          agents.tests.run({ traceId, iteration }).then(result => ({ type: 'tests', result }))
        );

        if (requiredAgents.qa) {
          reviewPromises.push(
            agents.qa.review({
              userInput,
              traceId,
              iteration,
              patches: merged.patches,
              consensusLevel: plan.consensusLevel || "single"
            })
              .then(result => ({ type: 'qa', result }))
          );
        }

        if (requiredAgents.security) {
          reviewPromises.push(
            agents.security.review({
              userInput,
              traceId,
              iteration,
              consensusLevel: plan.consensusLevel || "single"
            })
              .then(result => ({ type: 'security', result }))
          );
        }

        if (requiredAgents.legal && agents.legal) {
          reviewPromises.push(
            agents.legal.review({
              userInput,
              traceId,
              iteration,
              consensusLevel: plan.consensusLevel || "single"
            })
              .then(result => ({ type: 'legal', result }))
          );
        }
      }

      const reviewResults = await Promise.all(reviewPromises);
      
      // Extract results by type
      const tests = reviewResults.find(r => r.type === 'tests')?.result || { ok: true };
      const qa = reviewResults.find(r => r.type === 'qa')?.result || { ok: true, issues: [] };
      const security = reviewResults.find(r => r.type === 'security')?.result || { ok: true };
      const legal = reviewResults.find(r => r.type === 'legal')?.result || { ok: true };

      // Check for requirement mismatch - this is critical and must block
      const hasRequirementMismatch = qa.issues && qa.issues.some(issue => 
        issue.area === 'requirement-mismatch' || 
        issue.id === 'qa-500'
      );

      if (hasRequirementMismatch) {
        logger.error({ traceId, iteration, qaIssues: qa.issues }, "CRITICAL: Generated code doesn't match user requirements!");
        
        // Force regeneration by advancing iteration
        if (iteration < maxIterations) {
          logger.info({ traceId, iteration }, "Regenerating code due to requirement mismatch");
          
          const refinedInput = `${userInput}. CRITICAL FIX: The previous code did not match the requirement. Regenerate with exact functionality requested.`;
          
          return await runWorkflow({
            userInput: refinedInput,
            agents,
            logger,
            config,
            executor,
            store
          });
        } else {
          return {
            traceId,
            iteration,
            success: false,
            error: "Generated code does not match requirements after multiple attempts",
            executedFiles: []
          };
        }
      }

      // Only tests are required to pass for standard execution
      const ok = tests.ok;
      logger.info({ traceId, iteration, ok, security: security.ok, qa: qa.ok, tests: tests.ok }, "Gate evaluation");

      if (ok) {
        if (!security.ok) logger.warn({ traceId, iteration }, "Security gate failed, proceeding");
        if (!qa.ok) logger.warn({ traceId, iteration }, "QA gate failed, proceeding");

        // NEW: Delivery Manager verification - check all deliverables match requirements
        let deliveryVerification = { ok: true, issues: [] };
        if (!researchOnly && agents.delivery && executor) {
          // Use executor.workspaceDir which already includes projectName if provided
          const outputPath = executor.workspaceDir;
          deliveryVerification = await agents.delivery.verifyDelivery({
            userInput,
            outputPath,
            executedFiles,
            traceId,
            iteration
          });

          if (!deliveryVerification.ok) {
            logger.warn({ 
              traceId, 
              iteration,
              deliveryIssues: deliveryVerification.issues.length,
              issues: deliveryVerification.issues.map(i => i.title)
            }, "Delivery verification found issues");

            // Display fix instructions from consensus
            if (deliveryVerification.fixInstructions) {
              const fixInstr = deliveryVerification.fixInstructions;
              console.log('\n' + fixInstr.instruction);
              
              if (fixInstr.consensusMetadata) {
                logger.info({
                  traceId,
                  iteration,
                  consensusModels: fixInstr.consensusMetadata.modelsUsed,
                  consensusConfidence: fixInstr.consensusMetadata.confidence
                }, "Fix instructions generated via consensus");
              }
            }

            // Critical delivery issues should trigger targeted fixes via Manager agent
            const hasCriticalIssues = deliveryVerification.issues.some(i => i.severity === "CRITICAL");
            if (hasCriticalIssues && iteration < maxIterations) {
              logger.info({ traceId, iteration }, "Delivery Manager requesting targeted fixes from Manager agent");
              
              // Use consensus-generated fix instructions for precision
              const fixRequest = deliveryVerification.fixInstructions 
                ? deliveryVerification.fixInstructions.instruction
                : deliveryVerification.issues
                    .filter(i => i.severity === "CRITICAL")
                    .map(i => `${i.title}: ${i.description}`)
                    .join("; ");
              
              const precisionFixRequest = `${userInput}

DELIVERY MANAGER FEEDBACK (Precision Required):
${fixRequest}

IMPORTANT: Focus on PRECISION and ACCURACY. Generate deliverables with exact names and structure specified above.`;
              
              logger.info({ traceId, iteration, fixRequest: precisionFixRequest.substring(0, 200) }, "Triggering precision fix iteration");
              
              return await runWorkflow({
                userInput: precisionFixRequest,
                agents,
                logger,
                config,
                executor,
                store,
                llmUsageTracker
              });
            }
          } else {
            logger.info({ traceId, iteration }, "✅ Delivery verification PASSED - all deliverables correct");
          }
        }

        const present = await agents.manager.present({
          userInput,
          iteration,
          traceId,
          qa,
          security,
          tests,
          merged,
          delivery: deliveryVerification
        });

        // Write HTML/CSS/JS files from patches (code tasks only)
        if (plan.kind === "code" && merged.patches && merged.patches.length > 0 && outputFolderMatch) {
          try {
            const folderName = customFolder || "output";
            const outputDir = path.join("./output", folderName);
            
            // Create output directory
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
              logger.info({ outputDir }, "Created output directory");
            }

            // Write files from patches
            for (const patch of merged.patches) {
              if (patch.diff && patch.diff.includes("*** Add File:")) {
                const lines = patch.diff.split("\n");
                const fileHeader = lines[0];
                const fileName = fileHeader.replace("*** Add File:", "").trim();
                const fileContent = lines.slice(1).join("\n");
                
                const filePath = path.join(outputDir, path.basename(fileName));
                fs.writeFileSync(filePath, fileContent, "utf-8");
                
                executedFiles.push({
                  path: filePath,
                  success: true,
                  fullPath: path.resolve(filePath)
                });
                
                logger.info({ filePath }, "File written successfully");
                console.log(`✅ Created: ${filePath}`);
              }
            }
            
            if (executedFiles.length > 0) {
              console.log(`\n📁 Files created in: ${outputDir}\n`);
            }

            // Auto-generate images for HTML files with missing image references
            try {
              const htmlFiles = executedFiles.filter(f => (f.path || "").endsWith('.html'));
              if (htmlFiles.length > 0) {
                const embedder = new HtmlImageEmbedder({ logger });
                
                for (const htmlFile of htmlFiles) {
                  try {
                    const htmlFilePath = htmlFile.fullPath || htmlFile.path;
                    const htmlDir = path.dirname(htmlFilePath);
                    logger.info({ htmlFile: htmlFilePath }, "Checking for missing images in HTML");
                    
                    const imgDir = path.join(htmlDir, 'img');
                    
                    // Detect missing images and generate them
                    const result = await embedder.generateMissingImagesAndEmbed(
                      htmlFilePath,
                      imgDir,
                      'img/'
                    );
                    
                    if (result.success && result.generated > 0) {
                      logger.info({ 
                        htmlFile: htmlFile.path, 
                        generated: result.generated,
                        embedded: result.embedded
                      }, "Images generated and embedded successfully");
                      console.log(`✨ Generated ${result.generated} DALL-E images and embedded them`);
                    } else if (!result.success && result.error) {
                      logger.warn({ htmlFile: htmlFile.path, error: result.error }, "Image generation skipped");
                    }
                  } catch (imgErr) {
                    logger.warn({ htmlFile: htmlFile.path, error: imgErr.message }, "Image generation failed");
                  }
                }
              }
            } catch (imgError) {
              logger.warn({ error: imgError.message }, "Image generation phase failed but workflow continues");
            }
          } catch (writeError) {
            logger.error({ error: writeError.message }, "File writing failed");
            console.log(`\n⚠️  File writing failed: ${writeError.message}\n`);
          }
        }

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

  // Add cost optimization metrics to result
  if (costOptimization) {
    const costReport = costOptimization.getStatus();
    result.costOptimization = costReport;
    
    logger.info(costReport, "💰 Cost Optimization Report");
    
    // Log full report
    const fullReport = costOptimization.generateReport();
    logger.info({}, fullReport);
  }

  return result;
}

