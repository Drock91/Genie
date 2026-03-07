/**
 * Task Analyzer Agent
 * 
 * Intelligently analyzes user requests to determine:
 * 1. What type of task is being requested
 * 2. What agents should be involved
 * 3. What outputs are expected
 * 4. What success criteria should be met
 * 
 * This is the "brain" that makes GENIE smart about understanding intent.
 */

import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

// Task type definitions with their characteristics
export const TASK_TYPES = {
  CODE_GENERATION: {
    id: "code_generation",
    description: "Building software, websites, applications, scripts",
    requiredAgents: ["frontend", "backend", "qa", "security"],
    optionalAgents: ["databaseArchitect", "apiIntegration", "deployment"],
    outputs: ["code files", "documentation", "tests"],
    keywords: ["build", "create", "website", "app", "application", "code", "software", "program", "script"]
  },
  
  RESEARCH: {
    id: "research",
    description: "Researching topics, gathering information, analysis",
    requiredAgents: ["writer", "research"],
    optionalAgents: ["dataAnalyst", "newsAnalysis"],
    outputs: ["reports", "summaries", "analysis documents"],
    keywords: ["research", "find", "investigate", "analyze", "learn about", "what is", "how does", "explain"]
  },
  
  INCOME_GENERATION: {
    id: "income_generation",
    description: "Finding ways to make money, contracts, grants, opportunities",
    requiredAgents: ["incomeGeneration", "research", "writer"],
    optionalAgents: ["taxStrategy", "dataAnalyst", "marketing"],
    outputs: ["opportunity reports", "action plans", "financial projections"],
    keywords: ["income", "money", "profit", "earn", "contract", "grant", "job", "gig", "freelance", "business", "revenue", "monetize"]
  },
  
  MARKET_RESEARCH: {
    id: "market_research",
    description: "Market analysis, competitor research, industry trends",
    requiredAgents: ["research", "dataAnalyst", "writer"],
    optionalAgents: ["marketing", "newsAnalysis"],
    outputs: ["market reports", "competitor analysis", "trend reports"],
    keywords: ["market", "competitor", "industry", "trend", "demand", "opportunity", "niche", "target audience"]
  },
  
  DOCUMENT_CREATION: {
    id: "document_creation",
    description: "Creating documents, PDFs, reports, guides",
    requiredAgents: ["writer"],
    optionalAgents: [],
    outputs: ["documents", "PDFs", "guides", "manuals"],
    keywords: ["document", "pdf", "report", "guide", "manual", "write", "create file", "generate report"]
  },
  
  IMAGE_GENERATION: {
    id: "image_generation",
    description: "Creating images, graphics, visual content",
    requiredAgents: ["backend"],
    optionalAgents: [],
    outputs: ["images", "graphics"],
    keywords: ["image", "picture", "graphic", "logo", "icon", "visual", "generate image", "create image"]
  },
  
  BUSINESS_PLANNING: {
    id: "business_planning",
    description: "Business plans, strategies, roadmaps",
    requiredAgents: ["writer", "research", "dataAnalyst"],
    optionalAgents: ["taxStrategy", "legal", "marketing"],
    outputs: ["business plans", "strategy documents", "roadmaps"],
    keywords: ["business plan", "strategy", "roadmap", "growth plan", "startup", "launch", "scale"]
  },
  
  TAX_FINANCIAL: {
    id: "tax_financial",
    description: "Tax strategies, financial planning, accounting",
    requiredAgents: ["taxStrategy", "writer"],
    optionalAgents: ["dataAnalyst", "legal"],
    outputs: ["tax reports", "financial plans", "accounting documents"],
    keywords: ["tax", "financial", "accounting", "deduction", "expense", "profit", "loss", "irs", "revenue"]
  },
  
  LEGAL_COMPLIANCE: {
    id: "legal_compliance",
    description: "Legal documents, compliance, regulations",
    requiredAgents: ["legal", "writer"],
    optionalAgents: ["regulatoryCompliance"],
    outputs: ["legal documents", "compliance reports"],
    keywords: ["legal", "contract", "compliance", "regulation", "license", "permit", "terms", "policy"]
  }
};

export class TaskAnalyzerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "TaskAnalyzer", ...opts });
  }

  /**
   * Analyze a user request and determine what type of task it is
   * @param {string} userInput - The user's request
   * @returns {Object} Task analysis with type, agents, outputs, and success criteria
   */
  async analyzeTask(userInput) {
    this.info({}, "Analyzing task to determine optimal approach");

    // First do quick keyword matching for obvious cases
    const quickMatch = this._quickMatchTaskType(userInput);
    
    // Then use LLM for nuanced understanding
    const llmAnalysis = await this._deepAnalyze(userInput, quickMatch);
    
    // Combine analyses for final result
    const result = this._combineAnalyses(quickMatch, llmAnalysis, userInput);
    
    this.info({ 
      taskType: result.primaryType,
      secondaryTypes: result.secondaryTypes,
      agentCount: result.agents.length 
    }, "Task analysis complete");

    return result;
  }

  /**
   * Quick keyword-based task type matching
   */
  _quickMatchTaskType(userInput) {
    const inputLower = userInput.toLowerCase();
    const matches = {};
    
    for (const [typeName, taskType] of Object.entries(TASK_TYPES)) {
      const keywordMatches = taskType.keywords.filter(kw => inputLower.includes(kw));
      if (keywordMatches.length > 0) {
        matches[typeName] = {
          score: keywordMatches.length,
          keywords: keywordMatches
        };
      }
    }
    
    // Sort by score
    const sorted = Object.entries(matches)
      .sort((a, b) => b[1].score - a[1].score);
    
    return {
      matches: sorted.map(([type, data]) => ({ type, ...data })),
      primaryType: sorted[0]?.[0] || "RESEARCH"
    };
  }

  /**
   * Deep LLM-based analysis for nuanced understanding
   */
  async _deepAnalyze(userInput, quickMatch) {
    const taskTypeDescriptions = Object.entries(TASK_TYPES)
      .map(([name, type]) => `- ${name}: ${type.description}`)
      .join("\n");

    const system = `You are a task analysis expert. Analyze user requests to determine:
1. The PRIMARY task type (most important goal)
2. SECONDARY task types (supporting goals)
3. Specific outputs the user expects
4. Success criteria (how to know if the task is complete)
5. Any special requirements or constraints

Available task types:
${taskTypeDescriptions}

Consider:
- What is the user's ultimate goal?
- What would they consider "complete"?
- Are there multiple things they want done?
- What format should outputs be in?

Return JSON with: primaryType, secondaryTypes, expectedOutputs, successCriteria, specialRequirements, complexity (low/medium/high)`;

    const user = `Analyze this request:
"${userInput}"

Initial keyword analysis suggests: ${quickMatch.primaryType}
Matched keywords: ${quickMatch.matches.slice(0, 3).map(m => m.keywords.join(", ")).join(" | ")}

Provide detailed task analysis as JSON.`;

    try {
      const result = await consensusCall({
        profile: "balanced",
        system,
        user,
        temperature: 0.2
      });

      return result.consensus || {};
    } catch (err) {
      this.warn({ error: err.message }, "Deep analysis failed, using quick match only");
      return {};
    }
  }

  /**
   * Combine quick match and LLM analysis into final result
   */
  _combineAnalyses(quickMatch, llmAnalysis, userInput) {
    const primaryType = llmAnalysis.primaryType || quickMatch.primaryType || "RESEARCH";
    const taskTypeDef = TASK_TYPES[primaryType] || TASK_TYPES.RESEARCH;
    
    // Determine secondary types
    const secondaryTypes = llmAnalysis.secondaryTypes || 
      quickMatch.matches.slice(1, 3).map(m => m.type);
    
    // Build agent list from primary and secondary types
    const agents = new Set(taskTypeDef.requiredAgents);
    taskTypeDef.optionalAgents?.forEach(a => agents.add(a));
    
    secondaryTypes.forEach(secType => {
      const secDef = TASK_TYPES[secType];
      if (secDef) {
        secDef.requiredAgents.forEach(a => agents.add(a));
      }
    });

    // Check for PDF request
    const wantsPdf = /\bpdf\b/i.test(userInput);
    
    // Check for comprehensive/detailed request
    const isComprehensive = /comprehensive|detailed|thorough|complete|full/i.test(userInput);

    return {
      primaryType,
      secondaryTypes,
      taskDefinition: taskTypeDef,
      agents: Array.from(agents),
      expectedOutputs: llmAnalysis.expectedOutputs || taskTypeDef.outputs,
      successCriteria: llmAnalysis.successCriteria || [],
      specialRequirements: {
        wantsPdf,
        isComprehensive,
        ...llmAnalysis.specialRequirements
      },
      complexity: llmAnalysis.complexity || (isComprehensive ? "high" : "medium"),
      rawAnalysis: {
        quickMatch,
        llmAnalysis
      }
    };
  }

  /**
   * Get recommended workflow steps based on task analysis
   */
  getWorkflowSteps(taskAnalysis) {
    const steps = [];
    
    switch (taskAnalysis.primaryType) {
      case "CODE_GENERATION":
        steps.push(
          { phase: "planning", action: "Analyze requirements and create architecture" },
          { phase: "development", action: "Generate frontend code" },
          { phase: "development", action: "Generate backend code" },
          { phase: "testing", action: "Run QA and security checks" },
          { phase: "documentation", action: "Generate README and docs" }
        );
        break;
        
      case "RESEARCH":
        steps.push(
          { phase: "research", action: "Gather information on topic" },
          { phase: "analysis", action: "Analyze and synthesize findings" },
          { phase: "output", action: "Generate comprehensive report" }
        );
        if (taskAnalysis.specialRequirements.wantsPdf) {
          steps.push({ phase: "output", action: "Convert to PDF format" });
        }
        break;
        
      case "INCOME_GENERATION":
        steps.push(
          { phase: "analysis", action: "Analyze skills and resources" },
          { phase: "research", action: "Research income opportunities" },
          { phase: "planning", action: "Create prioritized action plan" },
          { phase: "output", action: "Generate opportunity report" }
        );
        break;
        
      case "MARKET_RESEARCH":
        steps.push(
          { phase: "research", action: "Identify market landscape" },
          { phase: "analysis", action: "Analyze competitors and trends" },
          { phase: "output", action: "Generate market analysis report" }
        );
        break;
        
      case "DOCUMENT_CREATION":
        steps.push(
          { phase: "planning", action: "Outline document structure" },
          { phase: "writing", action: "Generate document content" },
          { phase: "output", action: "Format and finalize document" }
        );
        if (taskAnalysis.specialRequirements.wantsPdf) {
          steps.push({ phase: "output", action: "Convert to PDF" });
        }
        break;
        
      case "BUSINESS_PLANNING":
        steps.push(
          { phase: "research", action: "Research market and competition" },
          { phase: "analysis", action: "Analyze business viability" },
          { phase: "planning", action: "Create business plan" },
          { phase: "financial", action: "Project financials" },
          { phase: "output", action: "Generate comprehensive business plan" }
        );
        break;
        
      default:
        steps.push(
          { phase: "analysis", action: "Analyze request requirements" },
          { phase: "execution", action: "Execute primary task" },
          { phase: "output", action: "Generate deliverables" }
        );
    }
    
    return steps;
  }
}

export default TaskAnalyzerAgent;
