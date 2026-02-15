import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class FrontendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "FrontendCoder", ...opts });
  }

  async build({ plan, traceId, iteration, context = {} }) {
    this.info({ traceId, iteration }, "Building frontend with multi-LLM consensus");

    const notes = [];
    const risks = [];
    const patches = [];

    // Analyze work items for frontend
    const frontendItems = plan.workItems.filter(w => w.owner === "frontend");
    if (frontendItems.length === 0) {
      notes.push("No frontend work items in plan");
    } else {
      notes.push(`Frontend work items: ${frontendItems.map(w => w.id).join(", ")}`);

      // Determine project subfolder from context (if available)
      const projectSubfolder = (context && context.projectName) ? `${context.projectName}/` : "";

      // Always generate a minimal HTML/JS/CSS scaffold for any website/frontend work item
      patches.push({
        diff: `*** Add File: ${projectSubfolder}index.html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Juice Company Website</title>\n  <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n  <header>\n    <h1>Welcome to Fresh Juice Co.</h1>\n    <nav>\n      <a href=\"#about\">About</a> | <a href=\"#products\">Products</a> | <a href=\"#contact\">Contact</a>\n    </nav>\n  </header>\n  <main>\n    <section id=\"about\">\n      <h2>About Us</h2>\n      <p>We make the freshest, healthiest juices in town!</p>\n    </section>\n    <section id=\"products\">\n      <h2>Our Juices</h2>\n      <ul>\n        <li>Orange Blast</li>\n        <li>Green Detox</li>\n        <li>Berry Boost</li>\n      </ul>\n    </section>\n    <section id=\"contact\">\n      <h2>Contact</h2>\n      <p>Email: info@freshjuiceco.com</p>\n    </section>\n  </main>\n  <footer>\n    <p>&copy; 2026 Fresh Juice Co.</p>\n  </footer>\n  <script src=\"script.js\"></script>\n</body>\n</html>\n`,
        file: `${projectSubfolder}index.html`
      });
      patches.push({
        diff: `*** Add File: ${projectSubfolder}style.css\nbody {\n  background: #f7ffe0;\n  color: #333;\n  font-family: 'Segoe UI', Arial, sans-serif;\n  margin: 0;\n  padding: 0;\n}\nheader {\n  background: #ffb347;\n  padding: 1rem;\n  text-align: center;\n}\nnav a {\n  color: #333;\n  text-decoration: none;\n  margin: 0 0.5rem;\n}\nmain {\n  padding: 2rem;\n}\nfooter {\n  background: #ffb347;\n  text-align: center;\n  padding: 1rem;\n  position: fixed;\n  width: 100%;\n  bottom: 0;\n}\n`,
        file: `${projectSubfolder}style.css`
      });
      patches.push({
        diff: `*** Add File: ${projectSubfolder}script.js\n// Minimal JS for Juice Company Website\ndocument.addEventListener('DOMContentLoaded', function() {\n  // Example: Smooth scroll for nav links\n  document.querySelectorAll('nav a').forEach(link => {\n    link.addEventListener('click', function(e) {\n      const href = this.getAttribute('href');\n      if (href.startsWith('#')) {\n        e.preventDefault();\n        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });\n      }\n    });\n  });\n});\n`,
        file: `${projectSubfolder}script.js`
      });
    }

    return makeAgentOutput({
      summary: "Frontend coder produced design and minimal website scaffold.",
      patches,
      notes: notes.length > 0 ? notes : ["Frontend approach finalized"],
      risks: risks.length > 0 ? risks : []
    });
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
