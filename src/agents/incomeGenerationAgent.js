/**
 * Income Generation Agent
 * 
 * Specialized agent for finding and optimizing income opportunities.
 * Analyzes skills, resources, and market conditions to recommend
 * the best ways to generate income.
 * 
 * Capabilities:
 * - Analyze skills and create income strategies
 * - Find government contracts (SAM.gov, SBIR/STTR)
 * - Identify freelance and consulting opportunities
 * - Research grants and funding programs
 * - Create income-focused action plans
 */

import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

// Income stream categories
export const INCOME_CATEGORIES = {
  GOVERNMENT_CONTRACTS: {
    id: "gov_contracts",
    description: "Federal, state, and local government contracts",
    platforms: ["SAM.gov", "GSA Schedules", "State procurement portals"],
    requirements: ["SAM.gov registration", "UEI number", "Relevant certifications"],
    timeToRevenue: "30-90 days after award"
  },
  GRANTS: {
    id: "grants",
    description: "Government and private grants",
    platforms: ["Grants.gov", "SBIR.gov", "Foundation websites"],
    requirements: ["Nonprofit status (some)", "Business registration", "Proposal writing"],
    timeToRevenue: "60-180 days after award"
  },
  FREELANCING: {
    id: "freelancing",
    description: "Project-based client work",
    platforms: ["Upwork", "Toptal", "Fiverr", "LinkedIn", "Direct outreach"],
    requirements: ["Portfolio", "Reviews", "Communication skills"],
    timeToRevenue: "7-30 days"
  },
  CONSULTING: {
    id: "consulting",
    description: "Expertise-based advisory services",
    platforms: ["Clarity.fm", "Expert360", "LinkedIn", "Direct network"],
    requirements: ["Demonstrated expertise", "Case studies", "Network"],
    timeToRevenue: "14-60 days"
  },
  PRODUCTS: {
    id: "products",
    description: "Digital or physical products",
    platforms: ["Gumroad", "AWS Marketplace", "App stores", "Your website"],
    requirements: ["Product development", "Marketing", "Support infrastructure"],
    timeToRevenue: "30-180 days"
  },
  SAAS: {
    id: "saas",
    description: "Software as a Service",
    platforms: ["Direct sales", "Cloud marketplaces"],
    requirements: ["MVP", "Infrastructure", "Customer support"],
    timeToRevenue: "60-365 days"
  },
  CONTENT: {
    id: "content",
    description: "Content creation and monetization",
    platforms: ["YouTube", "Substack", "Medium", "Courses"],
    requirements: ["Content skills", "Audience building", "Consistency"],
    timeToRevenue: "90-365 days"
  },
  REAL_ESTATE: {
    id: "real_estate",
    description: "Real estate investment and services",
    platforms: ["Direct deals", "REI networks", "MLS"],
    requirements: ["Capital or creative financing", "Market knowledge", "Licenses"],
    timeToRevenue: "30-180 days"
  }
};

// Veteran-specific programs
export const VETERAN_PROGRAMS = {
  SDVOSB: {
    name: "Service-Disabled Veteran-Owned Small Business",
    description: "Federal set-aside contracts for SDVOSBs",
    certification: "SBA VetCert",
    website: "veterans.certify.sba.gov",
    benefits: ["3% federal contracting goal", "Sole source up to $5M", "Set-aside contracts"]
  },
  VRE: {
    name: "Veteran Readiness & Employment",
    description: "VA program for self-employment support",
    requirements: ["VA disability rating", "Employment handicap"],
    benefits: ["Business funding", "Training", "Equipment", "Monthly subsistence"]
  },
  SBIR_STTR: {
    name: "Small Business Innovation Research / Technology Transfer",
    description: "R&D grants for small businesses",
    phases: [
      { name: "Phase I", amount: "$250,000", duration: "6-12 months" },
      { name: "Phase II", amount: "$1,000,000", duration: "24 months" },
      { name: "Phase III", amount: "Unlimited", duration: "Varies" }
    ],
    website: "sbir.gov"
  }
};

export class IncomeGenerationAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "IncomeGeneration", ...opts });
  }

  /**
   * Analyze skills and resources to generate income strategy
   */
  async analyzeIncomeOpportunities({ skills, resources, constraints, goals }) {
    this.info({ skillCount: skills?.length }, "Analyzing income opportunities");

    const system = `You are an expert income strategist specializing in helping technical professionals monetize their skills.

You understand:
- Government contracting (SAM.gov, SBIR/STTR, federal set-asides)
- Freelancing and consulting markets
- Product development and SaaS
- Real estate investment strategies
- Tax optimization for self-employment

Given someone's skills, resources, and constraints, provide:
1. IMMEDIATE opportunities (can start earning within 30 days)
2. SHORT-TERM opportunities (30-90 days to revenue)
3. LONG-TERM opportunities (90+ days but higher potential)

For each opportunity:
- Specific action steps
- Expected income range
- Time investment required
- Risks and mitigations

Return comprehensive JSON with prioritized income strategies.`;

    const user = `Analyze income opportunities for:

SKILLS: ${JSON.stringify(skills || [])}
RESOURCES: ${JSON.stringify(resources || {})}
CONSTRAINTS: ${JSON.stringify(constraints || {})}
GOALS: ${JSON.stringify(goals || {})}

Provide detailed, actionable income strategies with specific steps and realistic projections.`;

    try {
      const result = await consensusCall({
        profile: "premium",
        consensusLevel: "consensus",
        system,
        user,
        temperature: 0.3
      });

      const analysis = result.consensus || {};
      
      this.info({ 
        opportunityCount: analysis.opportunities?.length || 0
      }, "Income analysis complete");

      return {
        success: true,
        analysis,
        metadata: {
          timestamp: new Date().toISOString(),
          inputSkills: skills,
          consensusAchieved: true
        }
      };
    } catch (err) {
      this.error({ error: err.message }, "Income analysis failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Research government contract opportunities
   */
  async researchGovernmentContracts({ skills, certifications, naicsCodes }) {
    this.info({}, "Researching government contract opportunities");

    const system = `You are an expert in federal government contracting, particularly for small businesses and veteran-owned companies.

You know:
- SAM.gov search strategies
- NAICS code matching
- Set-aside programs (SDVOSB, 8(a), HUBZone, WOSB)
- BAAs (Broad Agency Announcements)
- SBIR/STTR programs
- GSA Schedules

Provide specific, actionable guidance for:
1. Relevant NAICS codes for their skills
2. Current active solicitations they could pursue
3. Registration requirements (SAM.gov, VetCert, etc.)
4. Teaming/subcontracting opportunities
5. Set-aside programs they qualify for

Return JSON with specific opportunities and action steps.`;

    const user = `Find government contracting opportunities for:

SKILLS: ${JSON.stringify(skills || [])}
CERTIFICATIONS: ${JSON.stringify(certifications || [])}
NAICS CODES (if known): ${JSON.stringify(naicsCodes || [])}

Include:
- Specific solicitation types to search for
- Key agencies to target
- Contract vehicles to pursue
- Registration checklist`;

    try {
      const result = await consensusCall({
        profile: "balanced",
        system,
        user,
        temperature: 0.2
      });

      return {
        success: true,
        opportunities: result.consensus,
        programs: VETERAN_PROGRAMS,
        categories: INCOME_CATEGORIES.GOVERNMENT_CONTRACTS
      };
    } catch (err) {
      this.error({ error: err.message }, "Government contract research failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a prioritized income action plan
   */
  async createIncomePlan({ profile, timeline, targetIncome }) {
    this.info({ targetIncome, timeline }, "Creating income action plan");

    const system = `You are a strategic income planner. Create a detailed, week-by-week action plan to achieve income goals.

The plan should:
1. Start with QUICK WINS (immediate income in 1-2 weeks)
2. Build SUSTAINABLE INCOME (recurring revenue streams)
3. Develop GROWTH OPPORTUNITIES (scaling and expansion)

For each action item, specify:
- Exact task to complete
- Time required
- Expected outcome
- Dependencies
- Success metrics

Return a JSON action plan with weekly milestones.`;

    const user = `Create income plan for:

PROFILE: ${JSON.stringify(profile)}
TIMELINE: ${timeline || "90 days"}
TARGET INCOME: ${targetIncome || "maximize"}

Provide week-by-week action plan with specific, measurable tasks.`;

    try {
      const result = await consensusCall({
        profile: "premium",
        consensusLevel: "consensus",
        system,
        user,
        temperature: 0.3
      });

      return {
        success: true,
        plan: result.consensus,
        timeline,
        targetIncome
      };
    } catch (err) {
      this.error({ error: err.message }, "Income plan creation failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Analyze a specific income opportunity
   */
  async evaluateOpportunity({ opportunity, context }) {
    this.info({ opportunity: opportunity?.name || opportunity }, "Evaluating income opportunity");

    const system = `You are an opportunity analyst. Evaluate income opportunities objectively.

Provide:
1. VIABILITY SCORE (1-10)
2. TIME TO FIRST DOLLAR
3. INCOME POTENTIAL (monthly/annual)
4. REQUIRED INVESTMENT (time, money, skills)
5. RISK FACTORS
6. SUCCESS PROBABILITY
7. SPECIFIC NEXT STEPS

Be realistic and data-driven in your assessment.`;

    const user = `Evaluate this opportunity:

OPPORTUNITY: ${JSON.stringify(opportunity)}
CONTEXT: ${JSON.stringify(context || {})}

Provide detailed evaluation with specific recommendations.`;

    try {
      const result = await consensusCall({
        profile: "balanced",
        system,
        user,
        temperature: 0.2
      });

      return {
        success: true,
        evaluation: result.consensus,
        opportunity
      };
    } catch (err) {
      this.error({ error: err.message }, "Opportunity evaluation failed");
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate income report in structured format
   */
  async generateIncomeReport({ analysis, format = "markdown" }) {
    this.info({ format }, "Generating income report");

    const reportContent = this._formatReport(analysis);

    return {
      success: true,
      report: reportContent,
      format,
      generatedAt: new Date().toISOString()
    };
  }

  _formatReport(analysis) {
    const lines = [
      "# INCOME GENERATION REPORT",
      "",
      `**Generated:** ${new Date().toISOString()}`,
      "",
      "## Executive Summary",
      "",
      analysis.summary || "Income opportunities analysis complete.",
      "",
      "## Immediate Opportunities (0-30 Days)",
      ""
    ];

    if (analysis.immediate) {
      analysis.immediate.forEach((opp, i) => {
        lines.push(`### ${i + 1}. ${opp.name || opp.title || "Opportunity"}`);
        lines.push(`- **Income Potential:** ${opp.income || "Varies"}`);
        lines.push(`- **Time Required:** ${opp.timeRequired || "Varies"}`);
        lines.push(`- **Action:** ${opp.action || opp.description || "See details"}`);
        lines.push("");
      });
    }

    lines.push("## Short-Term Opportunities (30-90 Days)");
    lines.push("");

    if (analysis.shortTerm) {
      analysis.shortTerm.forEach((opp, i) => {
        lines.push(`### ${i + 1}. ${opp.name || opp.title || "Opportunity"}`);
        lines.push(`- **Income Potential:** ${opp.income || "Varies"}`);
        lines.push(`- **Action:** ${opp.action || opp.description || "See details"}`);
        lines.push("");
      });
    }

    lines.push("## Long-Term Opportunities (90+ Days)");
    lines.push("");

    if (analysis.longTerm) {
      analysis.longTerm.forEach((opp, i) => {
        lines.push(`### ${i + 1}. ${opp.name || opp.title || "Opportunity"}`);
        lines.push(`- **Income Potential:** ${opp.income || "Varies"}`);
        lines.push(`- **Action:** ${opp.action || opp.description || "See details"}`);
        lines.push("");
      });
    }

    lines.push("## Action Checklist");
    lines.push("");

    if (analysis.actionItems) {
      analysis.actionItems.forEach((item, i) => {
        lines.push(`- [ ] ${item}`);
      });
    }

    return lines.join("\n");
  }
}

export default IncomeGenerationAgent;
