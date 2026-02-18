import prompt from "./interactivePrompt.js";

/**
 * Interactive Workflow Wrapper
 * Adds user approval checkpoints and iterative refinement
 */

export class InteractiveWorkflow {
  constructor({ agents, logger, config, executor, store, costOptimization = null }) {
    this.agents = agents;
    this.logger = logger;
    this.config = config;
    this.executor = executor;
    this.store = store;
    this.costOptimization = costOptimization;
  }

  /**
   * Run workflow with interactive checkpoints
   */
  async runInteractive({ userInput, workflow }) {
    prompt.progress("Starting Interactive Workflow");
    
    let currentInput = userInput;
    let satisfied = false;
    let iterationCount = 0;
    const maxIterations = 10; // Safety limit

    console.log(`\n📝 Original Request: "${userInput}"\n`);

    while (!satisfied && iterationCount < maxIterations) {
      iterationCount++;
      
      prompt.info(`Iteration ${iterationCount}/${maxIterations}`);

      // Step 1: Show refined request
      if (this.agents.refiner && iterationCount === 1) {
        prompt.progress("Step 1: Refining your request for clarity");
        
        const refinementResult = await this.agents.refiner.refineRequest(currentInput);
        
        if (refinementResult.confidence >= 70 && refinementResult.refined !== currentInput) {
          console.log(`\n📝 Original: ${currentInput}`);
          console.log(`✨ Refined:  ${refinementResult.refined}`);
          console.log(`📊 Confidence: ${refinementResult.confidence}%\n`);
          
          if (refinementResult.clarifications && refinementResult.clarifications.length > 0) {
            console.log("Clarifications made:");
            refinementResult.clarifications.forEach(c => console.log(`  • ${c}`));
            console.log();
          }
          
          const useRefined = await prompt.confirm("Use the refined request?", true);
          if (useRefined) {
            currentInput = refinementResult.refined;
          }
        }
      }

      // Step 2: Show execution plan
      prompt.progress("Step 2: Planning the work");

      if (this.config?.powerLevel) {
        console.log(`Power mode: ${this.config.powerLevel}`);
      }
      
      console.log("The following agents will work on your request:");
      console.log("  • Manager (planning & coordination)");
      
      // Determine which agents based on request type
      const planPreview = await this.agents.manager.plan({ 
        userInput: currentInput, 
        iteration: 1, 
        traceId: 'preview' 
      });

      if (this.config?.powerLevel) {
        const normalized = this.config.powerLevel === "med" ? "medium" : this.config.powerLevel;
        const power = ["low", "medium", "high"].includes(normalized) ? normalized : null;
        if (power) {
          planPreview.consensusLevel = power === "high" ? "consensus" : "single";
        }
      }
      
      if (planPreview.kind === 'code') {
        console.log("  • Backend Coder");
        console.log("  • Frontend Coder");
      } else {
        console.log("  • Writer");
      }
      
      console.log("  • Security Manager (review)");
      console.log("  • QA Manager (quality check)");
      console.log("  • Test Runner (validation)");
      
      if (planPreview.workItems && planPreview.workItems.length > 0) {
        console.log("\nPlanned work items:");
        planPreview.workItems.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.task || item.name || 'Work item'}`);
        });
      }
      
      console.log();
      
      const proceedWithPlan = await prompt.confirm("Proceed with this plan?", true);
      if (!proceedWithPlan) {
        const action = await prompt.choice(
          "What would you like to do?", 
          ["Modify the request", "Cancel"]
        );
        
        if (action === "Modify the request") {
          const newInput = await prompt.ask("Enter your modified request:");
          if (newInput) {
            currentInput = newInput;
            continue;
          }
        }
        
        prompt.warning("Workflow cancelled by user");
        prompt.close();
        return { success: false, cancelled: true, reason: "User cancelled at planning stage" };
      }

      // Step 3: Execute the workflow
      prompt.progress("Step 3: Executing workflow");
      
      const result = await workflow({
        userInput: currentInput,
        agents: this.agents,
        logger: this.logger,
        config: this.config,
        executor: this.executor,
        store: this.store
      });

      // Step 4: Show results
      prompt.progress("Step 4: Review results");
      
      if (result.success) {
        prompt.success("Workflow completed successfully!");
        
        // Show what was created
        if (result.executedFiles && result.executedFiles.length > 0) {
          console.log("\n📁 Files created/updated:");
          result.executedFiles.forEach(file => {
            console.log(`  ✓ ${file.path}`);
          });
          console.log();
        }
        
        // Show summary
        if (result.present && result.present.notes) {
          console.log("📋 Summary:");
          result.present.notes.forEach(note => {
            console.log(`  • ${note}`);
          });
          console.log();
        }
        
        // Show quality metrics
        console.log("📊 Quality Metrics:");
        console.log(`  Security: ${result.security?.ok ? '✅ PASS' : '⚠️  NEEDS REVIEW'}`);
        console.log(`  QA: ${result.qa?.ok ? '✅ PASS' : '⚠️  NEEDS REVIEW'}`);
        console.log(`  Tests: ${result.tests?.ok ? '✅ PASS' : '❌ FAIL'}`);
        console.log();
        
      } else {
        prompt.error("Workflow encountered issues");
        
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
      }

      // Step 5: Check satisfaction
      prompt.progress("Step 5: Satisfaction check");
      
      satisfied = await prompt.confirm("Are you satisfied with the results?", true);
      
      if (!satisfied) {
        // Capture SPECIFIC feedback about what's wrong
        const feedback = await prompt.ask("What's the issue? (e.g., 'wrong type of app', 'missing features', 'wrong design')");
        
        const action = await prompt.choice(
          "What would you like to do?",
          [
            "Refine the request and try again",
            "Keep results and make manual adjustments",
            "Cancel and discard results"
          ]
        );
        
        if (action === "Refine the request and try again") {
          // Use the specific feedback to refine the request
          if (feedback && feedback.trim().length > 0) {
            currentInput = `${currentInput}. IMPORTANT: ${feedback}`;
            prompt.info(`Updated request with feedback: "${currentInput}"`);
          }
          continue;
        } else if (action === "Keep results and make manual adjustments") {
          prompt.success("Results saved. You can now make manual adjustments.");
          satisfied = true;
        } else {
          prompt.warning("Results discarded");
          prompt.close();
          return { success: false, cancelled: true, reason: `User not satisfied: ${feedback}` };
        }
      }
    }

    if (iterationCount >= maxIterations) {
      prompt.warning(`Reached maximum iterations (${maxIterations})`);
    }

    // Final confirmation
    if (satisfied) {
      prompt.progress("Finalizing");
      
      console.log("\n🎉 Workflow complete!");
      console.log(`   Iterations: ${iterationCount}`);
      console.log(`   Final request: "${currentInput}"`);
      console.log();
      
      const viewFiles = await prompt.confirm("Would you like to view the output files?", false);
      
      if (viewFiles && this.executor) {
        const files = this.executor.listOutputs();
        if (files.length > 0) {
          console.log("\n📂 Output files:");
          files.forEach(f => {
            console.log(`   ${f.path} (${f.size} bytes)`);
          });
          console.log();
        }
      }

      // Show cost savings
      if (this.costOptimization) {
        const report = this.costOptimization.generateReport();
        console.log(report);
      }
    }

    prompt.close();
    
    return { 
      success: satisfied, 
      iterations: iterationCount,
      finalRequest: currentInput,
      costOptimization: this.costOptimization?.getStatus()
    };
  }
}
