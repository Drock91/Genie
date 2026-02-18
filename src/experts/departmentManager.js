/**
 * Department Manager
 * Central coordinator that routes requests to the right agents
 * Like a CEO coordinating all company departments
 */

import { BackendCoderAgent } from "./agents/backendCoderAgent.js";
import { FrontendCoderAgent } from "./agents/frontendCoderAgent.js";
import { ManagerAgent } from "./agents/managerAgent.js";
import { QAManagerAgent } from "./agents/qaManagerAgent.js";
import { SecurityManagerAgent } from "./agents/securityManagerAgent.js";
import { FixerAgent } from "./agents/fixerAgent.js";
import { TestRunnerAgent } from "./agents/testRunnerAgent.js";
import { WriterAgent } from "./agents/writerAgent.js";
import { LegalSpecialistAgent } from "./agents/legalSpecialistAgent.js";
import { MarketingStrategistAgent } from "./agents/marketingStrategistAgent.js";
import { AccountingAgent } from "./agents/accountingAgent.js";
import { DevOpsAgent } from "./agents/devopsAgent.js";
import { DataAnalystAgent } from "./agents/dataAnalystAgent.js";
import { CustomerSuccessAgent } from "./agents/customerSuccessAgent.js";
import { ProductManagerAgent } from "./agents/productManagerAgent.js";
import { ArchitectureAgent } from "./agents/architectureAgent.js";
import { ResearchAgent } from "./agents/researchAgent.js";
import { ComplianceOfficerAgent } from "./agents/complianceOfficerAgent.js";

export class DepartmentManager {
  constructor({ logger = null, multiLlmSystem = null, config = {} } = {}) {
    this.logger = logger;
    this.multiLlmSystem = multiLlmSystem;
    this.config = config;

    // Initialize all departments
    this.departments = {
      // Technical Departments
      engineering: {
        backend: new BackendCoderAgent(logger, multiLlmSystem),
        frontend: new FrontendCoderAgent(logger, multiLlmSystem),
        architecture: new ArchitectureAgent(logger, multiLlmSystem),
        devops: new DevOpsAgent(logger, multiLlmSystem),
        qa: new QAManagerAgent(logger, multiLlmSystem),
        security: new SecurityManagerAgent(logger, multiLlmSystem),
        testing: new TestRunnerAgent(logger, multiLlmSystem),
        fixer: new FixerAgent(logger, multiLlmSystem)
      },
      // Business Departments
      business: {
        product: new ProductManagerAgent(logger, multiLlmSystem),
        marketing: new MarketingStrategistAgent(logger, multiLlmSystem),
        sales: new CustomerSuccessAgent(logger, multiLlmSystem),
        legal: new LegalSpecialistAgent(logger, multiLlmSystem),
        research: new ResearchAgent(logger, multiLlmSystem)
      },
      // Operations Departments
      operations: {
        finance: new AccountingAgent(logger, multiLlmSystem),
        compliance: new ComplianceOfficerAgent(logger, multiLlmSystem)
      },
      // Support Departments
      support: {
        analytics: new DataAnalystAgent(logger, multiLlmSystem),
        management: new ManagerAgent(logger, multiLlmSystem),
        writing: new WriterAgent(logger, multiLlmSystem)
      }
    };

    this.departmentMap = this._flattenDepartments();
  }

  /**
   * Flatten nested departments for easy lookup
   */
  _flattenDepartments() {
    const map = {};
    Object.entries(this.departments).forEach(([group, depts]) => {
      Object.entries(depts).forEach(([name, agent]) => {
        map[name] = agent;
      });
    });
    return map;
  }

  /**
   * Route request to appropriate departments
   */
  async routeRequest(request) {
    const routing = await this._analyzeRequest(request);
    
    this.logger?.info(
      { routing },
      "Request routed to departments"
    );

    return routing;
  }

  /**
   * Analyze request and determine which departments are needed
   */
  async _analyzeRequest(request) {
    const keywords = {
      technical: ["build", "code", "api", "frontend", "backend", "database", "deploy", "infrastructure", "scale"],
      product: ["feature", "roadmap", "prioritize", "user", "persona", "strategy"],
      financial: ["budget", "cost", "expense", "revenue", "invoice", "financial", "payment"],
      hr: ["hire", "recruit", "onboard", "training", "team", "performance"],
      legal: ["compliance", "legal", "contract", "terms", "privacy", "gdpr"],
      marketing: ["launch", "campaign", "messaging", "audience", "positioning"],
      customer: ["support", "feedback", "churn", "satisfaction", "onboarding"],
      analytics: ["metrics", "dashboard", "kpi", "forecast", "analyze"]
    };

    const requestLower = request.toLowerCase();
    const requiredDepts = new Set();

    // Keyword matching
    Object.entries(keywords).forEach(([dept, words]) => {
      if (words.some(word => requestLower.includes(word))) {
        requiredDepts.add(dept);
      }
    });

    return {
      departments: Array.from(requiredDepts),
      details: {
        needsTechnical: requiredDepts.has("technical") || requiredDepts.has("product"),
        needsFinance: requiredDepts.has("financial"),
        needsLegal: requiredDepts.has("legal"),
        needsMarketing: requiredDepts.has("marketing"),
        needsHR: requiredDepts.has("hr"),
        needsAnalytics: requiredDepts.has("analytics")
      }
    };
  }

  /**
   * Execute coordinated multi-department operation
   */
  async executeMultiDept(request, departments) {
    const traceId = `${Math.random().toString(16).slice(2)}-${Date.now()}`;
    const results = {};

    this.logger?.info(
      { traceId, request, departments },
      "Multi-department execution started"
    );

    for (const dept of departments) {
      const agent = this.departmentMap[dept];
      if (!agent) {
        this.logger?.warn({ dept }, "Department not found");
        continue;
      }

      try {
        this.logger?.info({ traceId, dept }, `Executing ${dept} department`);
        // Each department would implement its own execution logic
        results[dept] = {
          status: "executed",
          timestamp: new Date()
        };
      } catch (err) {
        this.logger?.error({ traceId, dept, error: err.message }, "Department execution failed");
        results[dept] = {
          status: "failed",
          error: err.message
        };
      }
    }

    return {
      traceId,
      request,
      results,
      summary: this._generateExecutionSummary(results)
    };
  }

  /**
   * Get all available departments
   */
  getOrganizationChart() {
    return {
      organization: "Genie AI Company",
      departments: this.departments,
      summary: {
        totalDepartments: Object.keys(this.departmentMap).length,
        byGroup: Object.entries(this.departments).map(([group, depts]) => ({
          group,
          count: Object.keys(depts).length,
          departments: Object.keys(depts)
        }))
      }
    };
  }

  /**
   * Generate execution summary
   */
  _generateExecutionSummary(results) {
    const successful = Object.values(results).filter(r => r.status === "executed").length;
    const failed = Object.values(results).filter(r => r.status === "failed").length;

    return {
      successful,
      failed,
      total: successful + failed,
      successRate: `${Math.round((successful / (successful + failed)) * 100)}%`
    };
  }

  /**
   * Get capabilities summary
   */
  getCapabilities() {
    return {
      "🏗️ Engineering": {
        "Backend Development": "Build APIs, databases, services",
        "Frontend Development": "Create UIs, web apps, dashboards",
        "Architecture": "System design, scalability",
        "DevOps": "Infrastructure, deployment, monitoring",
        "Quality Assurance": "Testing, quality metrics",
        "Security": "Vulnerability assessment, hardening"
      },
      "💼 Business": {
        "Product Management": "Roadmap, strategy, prioritization",
        "Marketing": "Go-to-market, messaging, strategy",
        "Customer Success": "Support, retention, feedback",
        "Legal": "Compliance, contracts, risk",
        "Research": "Market analysis, trends, competition"
      },
      "📊 Operations": {
        "Finance/Accounting": "Budgets, invoices, forecasts",
        "Payroll": "Salaries, tax, vendor tracking",
        "HR": "Recruitment, onboarding, performance",
        "Compliance": "Audit, risk, certifications"
      },
      "🔧 Support": {
        "Analytics": "Metrics, dashboards, insights",
        "Management": "Orchestration, planning",
        "Writing": "Documentation, content"
      }
    };
  }

  /**
   * Print organization overview to console
   */
  printOrganization() {
    const chart = this.getOrganizationChart();
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║     GENIE AI COMPANY ORGANIZATION         ║");
    console.log("╚════════════════════════════════════════════╝\n");

    chart.summary.byGroup.forEach(group => {
      console.log(`📂 ${group.group.toUpperCase()} (${group.count} departments)`);
      group.departments.forEach(dept => {
        console.log(`   ├─ ${dept}`);
      });
      console.log();
    });

    console.log(`TOTAL OPERATIONAL DEPARTMENTS: ${chart.summary.totalDepartments}\n`);
  }

  /**
   * Print capabilities to console
   */
  printCapabilities() {
    const capabilities = this.getCapabilities();
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║        GENIE AI COMPANY CAPABILITIES       ║");
    console.log("╚════════════════════════════════════════════╝\n");

    Object.entries(capabilities).forEach(([category, items]) => {
      console.log(`${category}`);
      Object.entries(items).forEach(([dept, capability]) => {
        console.log(`   • ${dept}: ${capability}`);
      });
      console.log();
    });
  }
}

export default DepartmentManager;
