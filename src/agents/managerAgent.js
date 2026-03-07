import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { llmJson } from "../llm/openaiClient.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import { ManagerPlanSchema } from "../llm/schemas.js";
import { PROJECT_TEMPLATES, getProjectRequirements, getFileChecklist } from "../experts/projectTemplates.js";

export class ManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Manager", ...opts });
    this.consensusManager = opts.consensusManager || null;
    this.expenseTracker = opts.expenseTracker || null;
  }

    async plan({ userInput, iteration, traceId, researchOnly = false }) {
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
      "CRITICAL: PRESERVE ALL USER DETAILS",
      "- Include ALL specific requirements (prices, colors, features, names) in work item descriptions",
      "- Do NOT summarize or simplify user requirements",
      "- Each work item task should contain the relevant specific details from the user request",
      "- If user specifies '$15 per signature' or 'navy blue', include those EXACT values in tasks",
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
      "Determine which review agents are needed based on the request complexity and domain.",
      researchOnly
        ? "Research-only mode is ON: enforce kind='text', owner='writer', and do not include code generation work items."
        : ""
    ].join("\n");

    // Use multi-LLM consensus for important planning decision
    const result = await consensusCall({
      profile: "balanced", // Use balanced models for planning - still good quality
      system,
      user,
      schema: ManagerPlanSchema,
      consensusLevel: researchOnly ? "consensus" : "single",
      temperature: 0.1
    });


    // Patch: assign owner to all work items if missing (default: frontend for code)
    const planJson = result.consensus;
    const isMediaRequest = /\b(png|jpe?g|gif|image|video|mp4)\b/i.test(userInput);
    const isWebsite = /website|web site|webpage|web page|site for|company|business|landing page/i.test(userInput);
    const isMultiPage = /\b([0-9]+|five|ten|multiple)[-\s]?page\b/i.test(userInput);
    const hasTextFiles = /\.txt\b|text file|facts file/i.test(userInput);

    // Ensure workItems array exists
    if (!Array.isArray(planJson.workItems)) {
      planJson.workItems = [];
    }

    // Normalize work items to ensure task/file fields exist
    planJson.workItems = planJson.workItems.map(item => {
      const normalized = { ...item };

      if (!normalized.task) {
        normalized.task = normalized.description || normalized.title || normalized.name || "";
      }

      if (!normalized.file && normalized.outputPath) {
        const filePath = this.normalizeOutputPath(normalized.outputPath);
        if (filePath) {
          normalized.file = filePath;
        }
      }

      return normalized;
    });

    // Handle media requests (images, videos)
    if (isMediaRequest) {
      const hasImageWork = planJson.workItems.some(w => w.owner === 'backend');
      if (!hasImageWork) {
        planJson.workItems.push({
          id: `media-${iteration}`,
          owner: "backend",
          task: "Generate the requested media output and save it to the specified output folder."
        });
      }
    }

    // Handle text file requests (.txt files)
    if (hasTextFiles) {
      const hasWriterWork = planJson.workItems.some(w => w.owner === 'writer');
      if (!hasWriterWork) {
        // Extract what kind of text file from userInput
        const textFileMatch = userInput && typeof userInput === 'string' ? userInput.match(/([\w-]+\.txt)/i) : null;
        const fileName = textFileMatch ? textFileMatch[1] : 'content.txt';
        const contentMatch = userInput && typeof userInput === 'string' ? (userInput.match(/with ([\w\s]+) facts?/i) || userInput.match(/about ([\w\s]+)/i)) : null;
        const subject = contentMatch ? contentMatch[1] : 'the topic';
        
        planJson.workItems.push({
          id: `writer-${iteration}`,
          owner: "writer",
          task: `Create ${fileName} with detailed facts about ${subject}.`
        });
      }
    }

    // Assign owner to work items if missing
    planJson.workItems = planJson.workItems.map(w => {
      if (!w.owner) {
        // Default: frontend for code, writer for text
        if (planJson.kind === "text") {
          return { ...w, owner: "writer" };
        } else if (planJson.kind === "code") {
          return { ...w, owner: "frontend" };
        }
      }
      return w;
    });

    // Handle website requests - but DON'T add duplicate work items
    if (isWebsite && !isMediaRequest) {
      const hasFrontendWork = planJson.workItems.some(w => w.owner === 'frontend');
      
      if (!hasFrontendWork) {
        // No frontend work item yet, add one
        if (isMultiPage) {
          // Extract number of pages
          const pageMatch = userInput && typeof userInput === 'string' ? userInput.match(/\b([0-9]+)[-\s]?page\b/i) : null;
          const pageCount = pageMatch ? parseInt(pageMatch[1]) : 5;
          
          planJson.workItems.push({
            id: `frontend-${iteration}`,
            owner: "frontend",
            task: `Create a ${pageCount}-page website with index.html and ${pageCount - 1} additional pages. Include navigation between all pages.`
          });
        } else {
          // Single page website
          planJson.workItems.push({
            id: `frontend-${iteration}`,
            owner: "frontend",
            task: "Create a website with index.html homepage."
          });
        }
      }
    }

    // ========== PROJECT TEMPLATE CHECKING ==========
    // ENSURE PLANNER HAS ALL REQUIRED FILES FOR PROJECT TYPE
    
    // 1. Detect project type from user input
    const detectedProjectType = this.detectProjectType(userInput);
    this.info({ detectedProjectType }, "Detected project type from request");
    
    if (detectedProjectType) {
      const requirements = getProjectRequirements(detectedProjectType);
      if (requirements) {
        // 2. Get all required files for this project type
        const requiredFiles = [];
        Object.keys(requirements.requiredFiles).forEach(category => {
          requirements.requiredFiles[category].forEach(file => {
            if (file.required) {
              requiredFiles.push({
                category,
                name: file.name,
                description: file.description
              });
            }
          });
        });

        // 3. Check which files are already in work items
        const filesInPlan = new Set();
        planJson.workItems.forEach(item => {
          if (item.file) {
            const normalized = item.file.toLowerCase();
            filesInPlan.add(normalized);
            const baseName = normalized.split('/').pop();
            if (baseName) filesInPlan.add(baseName);
          }

          // Extract file names from task descriptions
          const fileMatches = item.task.match(/[\w.-]+\.(js|html|css|sql|md|json|env)/gi);
          if (fileMatches) {
            fileMatches.forEach(f => filesInPlan.add(f.toLowerCase()));
          }
        });

        // 4. Add missing required files to work items
        requiredFiles.forEach(file => {
          const filePath = this.getFilePath(file.category, file.name);
          const normalizedPath = filePath.toLowerCase();
          const normalizedName = file.name.toLowerCase();

          if (!filesInPlan.has(normalizedPath) && !filesInPlan.has(normalizedName)) {
            const owner = this.getFileOwner(file.category, file.name);
            planJson.workItems.push({
              id: `file-${file.name}`,
              owner,
              file: filePath,
              task: `Create ${filePath} (${file.category}): ${file.description}`
            });
            this.info({ file: filePath }, "Added missing required file to plan");
          }
        });

        // 4b. Image tasks are now handled dynamically based on user request
        // No hardcoded image names - let the frontend agent generate appropriate images

        // 5. Update required agents from template
        if (requirements.agentsNeeded) {
          planJson.requiredAgents = requirements.agentsNeeded;
          planJson.consensusLevel = requirements.agentsNeeded.consensusLevel || "single";
          this.info({ agentsNeeded: requirements.agentsNeeded }, "Updated agents from project template");
        }
      }
    }

    // Set default required agents if not provided by LLM or template
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

    if (researchOnly) {
      const writerItems = planJson.workItems.filter(w => w.owner === "writer");
      planJson.kind = "text";
      planJson.workItems = writerItems.length > 0
        ? writerItems
        : [{
            id: `research-${iteration}`,
            owner: "writer",
            task: `Research and provide a comprehensive evidence-based answer for: ${userInput}`
          }];
      planJson.requiredAgents = { security: false, qa: false, legal: false };
      planJson.consensusLevel = "consensus";
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

  /**
   * Detect project type from user input
   * Matches keywords to known project templates
   */
  detectProjectType(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      return null;
    }
    
    const input = userInput.toLowerCase();

    // Pizza delivery app
    if (input.includes("pizza") && (input.includes("delivery") || input.includes("shop") || input.includes("restaurant"))) {
      return "pizza-delivery";
    }

    // Web application (full stack)
    const mentionsFrontend = input.includes("frontend") || input.includes("ui") || input.includes("website") || input.includes("web app") || input.includes("web application");
    const mentionsBackend = input.includes("backend") || input.includes("api") || input.includes("server");
    const mentionsDatabase = input.includes("database") || input.includes("postgres") || input.includes("sql");
    const mentionsDocs = input.includes("docs") || input.includes("documentation") || input.includes("readme");
    const mentionsPlatform = input.includes("platform") || input.includes("e-commerce") || input.includes("ecommerce") || input.includes("subscription") || input.includes("enterprise");

    if ((mentionsFrontend || mentionsPlatform) && (mentionsBackend || mentionsDatabase || mentionsDocs)) {
      return "web-app";
    }

    // Calculator app
    if (input.includes("calculator") && !input.includes("api")) {
      return "calculator";
    }

    // Game
    if (input.includes("game") || input.includes("card game") || input.includes("browser game")) {
      return "game";
    }

    // REST API
    if ((input.includes("api") || input.includes("rest")) && 
        !input.includes("frontend") && !input.includes("ui")) {
      return "rest-api";
    }

    // Default: web-app for any full-stack request
    if (input.includes("complete") && input.includes("app")) {
      return "web-app";
    }

    return null;
  }

  /**
   * Determine which agent should own a file
   */
  getFileOwner(category, fileName) {
    const file = fileName.toLowerCase();

    // Frontend files
    if (category === "frontend" || file.endsWith(".html") || file.endsWith(".css") || 
        file === "app.js" || file === "script.js" || file === "game.js") {
      return "frontend";
    }

    // Backend files
    if (category === "backend" || category === "database" || 
        file === "server.js" || file.endsWith(".sql") || file === "package.json") {
      return "backend";
    }

    // Documentation files
    if (category === "docs" || file.endsWith(".md")) {
      return "writer";
    }

    // Default based on file type
    if (file.endsWith(".html") || file.endsWith(".css") || file === "app.js") {
      return "frontend";
    }
    if (file.endsWith(".js") && !file.endsWith(".sql")) {
      return "backend";
    }
    if (file.endsWith(".sql") || file === ".env.example") {
      return "backend";
    }

    return "writer"; // Default to documentation
  }

  /**
   * Map a file into its standard folder based on category
   */
  getFilePath(category, fileName) {
    if (!fileName) {
      return fileName;
    }

    const normalized = fileName.replace(/^\//, "");
    if (normalized.includes("/")) {
      return normalized;
    }

    if (category === "frontend") {
      return `frontend/${normalized}`;
    }

    if (category === "backend") {
      return `backend/${normalized}`;
    }

    if (category === "database") {
      return `database/${normalized}`;
    }

    if (category === "docs") {
      return `docs/${normalized}`;
    }

    return normalized;
  }

  normalizeOutputPath(outputPath) {
    if (!outputPath || typeof outputPath !== "string") {
      return null;
    }

    let cleaned = outputPath.replace(/\\/g, "/").replace(/^\.?\/?output\//i, "");
    cleaned = cleaned.replace(/^\/?/, "");

    if (cleaned.endsWith("/")) {
      return null;
    }

    const parts = cleaned.split("/");
    const knownFolders = new Set(["frontend", "backend", "database", "docs", "img", "assets"]);

    if (parts.length > 1 && !knownFolders.has(parts[0]) && parts[1] && parts[1].includes(".")) {
      cleaned = parts.slice(1).join("/");
    }

    if (!cleaned.includes("/")) {
      const lower = cleaned.toLowerCase();
      if (lower.endsWith(".md")) {
        return this.getFilePath("docs", cleaned);
      }
      if (lower.endsWith(".sql")) {
        return this.getFilePath("database", cleaned);
      }
      if (lower.endsWith(".html") || lower.endsWith(".css") || lower.endsWith(".js")) {
        return this.getFilePath("frontend", cleaned);
      }
      if (lower.endsWith(".json") || lower.includes(".env")) {
        return this.getFilePath("backend", cleaned);
      }
      if (lower === "server.js" || lower === "package.json") {
        return this.getFilePath("backend", cleaned);
      }
    }

    return cleaned;
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

