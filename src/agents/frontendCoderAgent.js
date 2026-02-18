import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class FrontendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "FrontendCoder", ...opts });
  }

  async build({ plan, traceId, iteration, context = {}, userInput = "" }) {
    this.info({ traceId, iteration, receivedUserInput: userInput }, "Building frontend with multi-LLM consensus");

    const notes = [];
    const risks = [];
    const patches = [];

    // Analyze work items for frontend
    const frontendItems = plan.workItems.filter(w => w.owner === "frontend");
    if (frontendItems.length === 0) {
      notes.push("No frontend work items in plan");
    } else {
      notes.push(`Frontend work items: ${frontendItems.map(w => w.id).join(", ")}`);

      // Frontend files always go in the root of the project output folder
      // The executor already sets workspaceDir to output/ProjectName
      const projectSubfolder = "";

      // Generate application-specific code using LLM based on requirements
      try {
        const generatedCode = await this.generateAppCode({
          userInput,
          workItems: frontendItems,
          projectName: context.projectName,
          consensusLevel: context.consensusLevel
        });

        if (generatedCode && generatedCode.html) {
          patches.push({
            diff: `*** Add File: ${projectSubfolder}index.html\n${generatedCode.html}`,
            file: `${projectSubfolder}index.html`
          });
        }

        if (generatedCode && generatedCode.css) {
          patches.push({
            diff: `*** Add File: ${projectSubfolder}style.css\n${generatedCode.css}`,
            file: `${projectSubfolder}style.css`
          });
        }

        if (generatedCode && generatedCode.js) {
          patches.push({
            diff: `*** Add File: ${projectSubfolder}script.js\n${generatedCode.js}`,
            file: `${projectSubfolder}script.js`
          });
        }

        notes.push("Generated code from LLM consensus");
      } catch (err) {
        this.error({ error: err.message }, "Failed to generate code via LLM");
        throw err;
      }
    }

    return makeAgentOutput({
      summary: "Frontend coder produced application-specific code.",
      patches,
      notes: notes.length > 0 ? notes : ["Frontend code generated"],
      risks: risks.length > 0 ? risks : []
    });
  }

  /**
   * Generate application-specific code using multi-LLM consensus
   */
  async generateAppCode({ userInput, workItems, projectName, consensusLevel = "single" }) {
    this.info({ userInput, workItems: workItems.length }, "Generating application code with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
        system: `You are an expert frontend developer. Generate complete, working HTML5/CSS3/JavaScript code.
CRITICAL: Return ONLY valid JSON with these exact keys: {"html": "...", "css": "...", "js": "..."}
Do NOT include markdown, code fences, or any text outside the JSON object.`,
        user: `Generate code for: ${userInput}

Work items:
${workItems.map(w => `- ${w.title}`).join('\n')}

Return as JSON object with html, css, js properties. Code must be complete and runnable.`,
        temperature: 0.3
      });

      // Extract consensus result
      const rawResult = result.consensus || result;
      
      // If result is a string, try to parse it as JSON
      let codeResult = rawResult;
      if (typeof rawResult === 'string') {
        try {
          // Extract JSON from string if wrapped in markdown code blocks
          const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
          codeResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResult);
        } catch (parseErr) {
          this.warn({ error: parseErr.message, rawResult: rawResult.substring(0, 200) }, "Failed to parse JSON response");
          // Return empty code structure
          codeResult = { html: "", css: "", js: "" };
        }
      }
      
      // Ensure we have the expected properties
      if (!codeResult.html) codeResult.html = "";
      if (!codeResult.css) codeResult.css = "";
      if (!codeResult.js) codeResult.js = "";
      
      this.info({
        providers: result.responses?.length || 3,
        htmlSize: codeResult.html?.length || 0,
        cssSize: codeResult.css?.length || 0,
        jsSize: codeResult.js?.length || 0,
        userRequest: userInput.substring(0, 100)
      }, "Application code generated");

      return codeResult;
    } catch (err) {
      this.error({ error: err.message }, "Code generation failed");
      throw err;
    }
  }

  /**
   * Analyze design patterns using multi-LLM consensus
   */
  async analyzeDesign(requirements) {
    this.info({ requirements }, "Analyzing design with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert UI/UX designer analyzing component architecture and design patterns.",
        user: `Design UI components for:\n${requirements}`,
        schema: {
          name: "design_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["recommended_patterns", "components", "concerns"],
            properties: {
              recommended_patterns: {
                type: "array",
                items: { type: "string" }
              },
              components: {
                type: "array",
                items: { type: "string" }
              },
              concerns: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.2 // Allow some creativity for design
      });

      this.info({
        patterns: result.consensus.recommended_patterns.length,
        components: result.consensus.components.length,
        designers: result.metadata.totalSuccessful
      }, "Design analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Design analysis failed");
      throw err;
    }
  }

  /**
   * Review accessibility (WCAG) using multi-LLM consensus
   */
  async reviewAccessibility(requirements) {
    this.info({ requirements }, "Reviewing accessibility with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a web accessibility expert reviewing for WCAG 2.1 compliance.",
        user: `Review accessibility for:\n${requirements}`,
        schema: {
          name: "accessibility_review",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["accessibility_issues", "wcag_level", "recommendations"],
            properties: {
              accessibility_issues: {
                type: "array",
                items: { type: "string" }
              },
              wcag_level: {
                type: "string",
                enum: ["A", "AA", "AAA"]
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1 // Consistency important for compliance
      });

      this.info({
        issues: result.consensus.accessibility_issues.length,
        wcag_level: result.consensus.wcag_level,
        reviewers: result.metadata.totalSuccessful
      }, "Accessibility review complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Accessibility review failed");
      throw err;
    }
  }

  /**
   * Evaluate performance considerations using multi-LLM consensus
   */
  async evaluatePerformance(requirements) {
    this.info({ requirements }, "Evaluating performance with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are a frontend performance expert evaluating optimization strategies.",
        user: `Evaluate performance for:\n${requirements}`,
        schema: {
          name: "performance_eval",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["optimization_strategies", "performance_risks", "estimated_impact"],
            properties: {
              optimization_strategies: {
                type: "array",
                items: { type: "string" }
              },
              performance_risks: {
                type: "array",
                items: { type: "string" }
              },
              estimated_impact: { type: "string" }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        strategies: result.consensus.optimization_strategies.length,
        risks: result.consensus.performance_risks.length,
        experts: result.metadata.totalSuccessful
      }, "Performance evaluation complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Performance evaluation failed");
      throw err;
    }
  }
}
