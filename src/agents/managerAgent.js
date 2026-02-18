import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { llmJson } from "../llm/openaiClient.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import { ManagerPlanSchema } from "../llm/schemas.js";

export class ManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Manager", ...opts });
    this.consensusManager = opts.consensusManager || null;
    this.expenseTracker = opts.expenseTracker || null;
  }

    async plan({ userInput, iteration, traceId }) {
    this.info({ traceId, iteration }, "Planning work items with multi-LLM consensus");

    const system = [
      "You are the Manager agent in a multi-agent software pipeline.",
      "Your job: classify the request as text vs code and generate work items.",
      "",
      "KIND CLASSIFICATION RULES:",
      "- kind='text' for: documentation, text files, articles, reports, descriptions, text content creation",
      "- kind='code' for: applications, games, websites, backend services, HTML/CSS/JS projects",
      "",
      "OWNER ASSIGNMENT RULES:",
      "- owner='writer' for: all text content (txt, md, doc files), documentation, articles",
      "- owner='frontend' for: HTML, CSS, JavaScript, user interfaces, web pages",
      "- owner='backend' for: server code, APIs, databases, scripts, media generation (png/jpg/gif/mp4/video)",
      "",
      "IMPORTANT: Creating text files (.txt, .md) should use kind='text' and owner='writer'",
      "IMPORTANT: Creating images or videos should use kind='code' and owner='backend'",
      "",
      "ALSO determine which review agents are needed:",
      "- security: true if handling payments, auth, data storage, APIs, or sensitive operations",
      "- qa: always true for code projects",
      "- legal: true if handling user data, payments, contracts, or compliance requirements",
      "Set consensusLevel to 'consensus' ONLY for high-risk or complex tasks (security, legal, compliance, payment flows).",
      "Use consensusLevel 'single' for normal tasks to reduce cost.",
      "Return ONLY JSON that matches the provided schema.",
      "Keep workItems minimal and actionable."
    ].join("\n");

    const user = [
      `User request: ${userInput}`,
      "Decide kind=text for writing tasks, kind=code for software tasks.",
      "Determine which review agents are needed based on the request complexity and domain."
    ].join("\n");

    // Use multi-LLM consensus for important planning decision
    const result = await consensusCall({
      profile: "balanced", // Use balanced models for planning - still good quality
      system,
      user,
      schema: ManagerPlanSchema,
      temperature: 0.1
    });


    // Patch: assign owner to all work items if missing (default: frontend for code)
    const planJson = result.consensus;
    const isMediaRequest = /\b(png|jpe?g|gif|image|video|mp4)\b/i.test(userInput);
    const isWebsite = /website|web site|webpage|web page|site for|company|business|landing page/i.test(userInput);

    if (isMediaRequest) {
      planJson.kind = "code";
      planJson.workItems = [
        {
          id: `media-${iteration}`,
          owner: "backend",
          task: "Generate the requested media output and save it to the specified output folder."
        }
      ];
      planJson.requiredAgents = { security: false, qa: false, legal: false };
    }

    if (Array.isArray(planJson.workItems)) {
      planJson.workItems = planJson.workItems.map(w => {
        // If kind is code and owner is missing, assign frontend
        if ((planJson.kind === "code" || w.kind === "code") && !w.owner) {
          return { ...w, owner: "frontend" };
        }
        return w;
      });

      // Force: Always add a frontend work item for website requests
      if (isWebsite && !isMediaRequest) {
        planJson.workItems.push({
          id: `frontend-forced-${iteration}`,
          owner: "frontend",
          task: "Create a minimal homepage for the website."
        });
      }

      if (isWebsite && /\b(5|five)[-\s]?page\b/i.test(userInput)) {
        planJson.workItems.push({
          id: `frontend-pages-${iteration}`,
          owner: "frontend",
          task: "Create a 5-page site with separate files: index.html plus overview.html, species.html, habitats.html, conservation.html, fun-facts.html, and link between pages."
        });
      }
    }

    // Set default required agents if not provided by LLM
    if (!planJson.requiredAgents) {
      planJson.requiredAgents = {
        security: false,  // Only if needed
        qa: planJson.kind === "code",  // Always for code
        legal: false  // Only if needed
      };
    }

    if (!planJson.consensusLevel) {
      const needsConsensus = planJson.requiredAgents.security || planJson.requiredAgents.legal;
      planJson.consensusLevel = needsConsensus ? "consensus" : "single";
    }

    this.info({
      traceId,
      iteration,
      agreement: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + "%",
      reasoning: result.reasoning
    }, "Plan generated with consensus");

    return {
      traceId,
      iteration,
      goal: userInput,
      ...planJson,
      consensusMetadata: {
        modelsUsed: result.metadata.totalSuccessful,
        agreement: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + "%"
      }
    };
  }


  /**
   * Analyze request complexity using multi-LLM consensus
   */
  async analyzeComplexity(userInput) {
    this.info({ userInput }, "Analyzing request complexity with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert project manager analyzing request complexity.",
        user: `Analyze the complexity of this request:\n${userInput}`,
        schema: {
          name: "complexity_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["complexity_level", "estimated_effort", "risks"],
            properties: {
              complexity_level: { type: "string", enum: ["simple", "medium", "complex", "very_complex"] },
              estimated_effort: { type: "string" },
              risks: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Complexity analysis failed");
      throw err;
    }
  }

  /**
   * Generate team recommendations using multi-LLM consensus
   */
  async recommendTeam(complexity, requirements) {
    this.info({ complexity, requirements }, "Recommending team with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an HR expert recommending team composition.",
        user: `For this complexity level (${complexity}) and requirements:\n${requirements}\n\nWho should be on the team?`,
        schema: {
          name: "team_recommendation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["roles", "count", "notes"],
            properties: {
              roles: {
                type: "array",
                items: { type: "string" }
              },
              count: { type: "number" },
              notes: { type: "string" }
            }
          }
        },
        temperature: 0.2
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Team recommendation failed");
      throw err;
    }
  }


  async merge({ outputs, traceId, iteration }) {
    this.info({ traceId, iteration }, "Merging coder outputs");
    const patches = outputs.flatMap(o => o.patches || []);
    const notes = outputs.flatMap(o => o.notes || []);
    const risks = outputs.flatMap(o => o.risks || []);
    const summary = outputs.map(o => o.summary).filter(Boolean).join(" | ");

    return makeAgentOutput({
      summary: `Merged: ${summary}`.trim(),
      patches,
      notes,
      risks,
      metrics: { mergedAgents: outputs.length }
    });
  }

async present({ userInput, iteration, traceId, qa, security, tests, merged, delivery = null }) {
    this.info({ traceId, iteration }, "Presenting result");
    const finalLine = (merged?.notes || []).slice(-1)[0];

    const notes = [
      `Iteration: ${iteration}`,
      `QA: ${qa?.ok ? "PASS" : "FAIL"}`,
      `Security: ${security?.ok ? "PASS" : "FAIL"}`,
      `Tests: ${tests?.ok ? "PASS" : "FAIL"}`
    ];

    // Add delivery verification status
    if (delivery) {
      notes.push(`Delivery: ${delivery.ok ? "✅ PASS" : "❌ FAIL"}`);
      if (!delivery.ok && delivery.issues) {
        notes.push(`Delivery Issues: ${delivery.issues.length}`);
        delivery.issues.forEach(issue => {
          notes.push(`  - ${issue.severity}: ${issue.title}`);
        });
      }
    }

    if (finalLine) {
      notes.push(`Output: ${finalLine}`);
    }

    return makeAgentOutput({
      summary: delivery?.ok 
        ? `✅ Delivery ready for: "${userInput}"`
        : `⚠️ Delivery complete with issues: "${userInput}"`,
      notes: notes.filter(Boolean)
    });
  }

  /**
   * COST OPTIMIZATION: Batch consensus questions for all agents
   * Instead of each agent calling consensus independently,
   * Manager calls once with all questions, returns to all agents
   */
  async gatherConsensusForTeam({ userInput, questionsNeeded = [] }) {
    this.info(
      { questionsNeeded: questionsNeeded.length },
      "🎯 CENTRALIZED: Gathering consensus for team"
    );

    if (this.consensusManager) {
      try {
        const decisions = await this.consensusManager.getConsensusForMultiple({
          questions: questionsNeeded,
          agentName: "Manager",
          complexity: "medium"
        });

        this.info(
          { decisionsCount: Object.keys(decisions).length },
          "✅ Team consensus ready - agents will use cached results"
        );

        return decisions;
      } catch (err) {
        this.warn({ error: err.message }, "Fallback: using direct consensus");
        return {};
      }
    }

    return {};
  }

  /**
   * Get a cached consensus decision instead of calling LLM
   */
  async getConsensus({ question, complexity = "medium", agentName = "unknown" }) {
    if (this.consensusManager) {
      return await this.consensusManager.getConsensus({
        question,
        context: "Manager coordinated decision",
        agentName,
        complexity
      });
    }

    // Fallback to direct call if manager not available
    return await consensusCall({
      profile: "balanced",
      user: question,
      temperature: 0.15
    });
  }

  /**
   * Share team consensus with another agent
   * Prevents duplicate LLM calls
   */
  async provideTeamConsensus(agentName, question) {
    if (this.consensusManager) {
      return await this.consensusManager.getConsensus({
        question,
        agentName,
        complexity: "balanced",
        cacheKey: `team-${agentName}-${question.slice(0, 30)}`
      });
    }
    return null;
  }

  /**
   * Report on costs and savings
   */
  getSavingsReport() {
    if (!this.consensusManager) {
      return { message: "ConsensusManager not available" };
    }

    const stats = this.consensusManager.getStats();
    return {
      ...stats,
      message: `💰 SAVINGS: Hit rate: ${stats.hitRate}, Estimated savings: ${stats.estimatedSavings}`
    };
  }
}

function classify(input) {
  const s = (input || "").toLowerCase();

  const textSignals = ["say ", "write ", "rewrite", "summarize", "draft", "email", "hello"];
  const codeSignals = ["api", "endpoint", "express", "react", "ui", "node", "database", "auth", "server", "client", "typescript"];

  const textScore = textSignals.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);
  const codeScore = codeSignals.reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);

  return codeScore > textScore ? "code" : "text";
}

