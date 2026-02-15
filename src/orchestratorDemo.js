/**
 * Demo: Enhanced Orchestrator with Specialist Agents and Reporting
 * Shows how request routing activates legal/marketing specialists only when needed
 */

import { EnhancedOrchestrator } from "./orchestrator.js";
import { RequestAnalyzer } from "./experts/requestAnalyzer.js";
import { MultiLlmSystem } from "./llm/multiLlmSystem.js";
import { Logger } from "./util/logger.js";

/**
 * Test scenario: Product company formation request
 * SHOULD trigger: Legal + Marketing agents
 */
export async function demoProductBuild() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 1: Product Company Build Request");
  console.log("Expected: Legal + Marketing specialists ACTIVATED");
  console.log("=".repeat(60) + "\n");

  const userInput = `
    I want to build a SaaS platform called "DataSync" that helps businesses 
    synchronize their databases in real-time. We need to collect customer 
    data, use credit cards for payments, and operate in Europe and US.
  `;

  const analyzer = new RequestAnalyzer();
  const analysis = await analyzer.analyzeRequest(userInput);

  console.log("📋 REQUEST ANALYSIS");
  console.log(`   Type: ${analysis.request_type}`);
  console.log(`   Needs Legal: ${analysis.needs_legal_review ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Marketing: ${analysis.needs_marketing_strategy ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Technical: ${analysis.needs_technical_build ? "✅ YES" : "❌ NO"}`);
  console.log(`   Priority: ${analysis.priority_level}`);

  console.log("\n" + "~".repeat(60) + "\n");
}

/**
 * Test scenario: Simple question
 * SHOULD NOT trigger: Legal or Marketing specialists
 */
export async function demoSimpleQuestion() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: Simple Knowledge Question");
  console.log("Expected: Only analysis, NO Legal/Marketing specialists");
  console.log("=".repeat(60) + "\n");

  const userInput = "What is the difference between REST API and GraphQL?";

  const analyzer = new RequestAnalyzer();
  const analysis = await analyzer.analyzeRequest(userInput);

  console.log("📋 REQUEST ANALYSIS");
  console.log(`   Type: ${analysis.request_type}`);
  console.log(`   Needs Legal: ${analysis.needs_legal_review ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Marketing: ${analysis.needs_marketing_strategy ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Technical: ${analysis.needs_technical_build ? "✅ YES" : "❌ NO"}`);
  console.log(`   Priority: ${analysis.priority_level}`);

  console.log("\n" + "~".repeat(60) + "\n");
}

/**
 * Test scenario: Feature request
 * SHOULD trigger: Technical agents only
 */
export async function demoFeatureRequest() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: Feature Request");
  console.log("Expected: Technical build only, NO Legal/Marketing");
  console.log("=".repeat(60) + "\n");

  const userInput = `
    Add a dark mode toggle to the React dashboard that persists user preference 
    in localStorage and respects system dark mode settings.
  `;

  const analyzer = new RequestAnalyzer();
  const analysis = await analyzer.analyzeRequest(userInput);

  console.log("📋 REQUEST ANALYSIS");
  console.log(`   Type: ${analysis.request_type}`);
  console.log(`   Needs Legal: ${analysis.needs_legal_review ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Marketing: ${analysis.needs_marketing_strategy ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Technical: ${analysis.needs_technical_build ? "✅ YES" : "❌ NO"}`);
  console.log(`   Priority: ${analysis.priority_level}`);

  console.log("\n" + "~".repeat(60) + "\n");
}

/**
 * Test scenario: Company formation
 * SHOULD trigger: Legal + Marketing agents
 */
export async function demoCompanyFormation() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: Company Formation");
  console.log("Expected: Legal + Marketing specialists ACTIVATED");
  console.log("=".repeat(60) + "\n");

  const userInput = `
    We're starting a new company called "GreenLogistics" that will focus on 
    carbon-neutral shipping solutions. We want to launch our website and 
    take initial customers in Q2 2024.
  `;

  const analyzer = new RequestAnalyzer();
  const analysis = await analyzer.analyzeRequest(userInput);

  console.log("📋 REQUEST ANALYSIS");
  console.log(`   Type: ${analysis.request_type}`);
  console.log(`   Needs Legal: ${analysis.needs_legal_review ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Marketing: ${analysis.needs_marketing_strategy ? "✅ YES" : "❌ NO"}`);
  console.log(`   Needs Technical: ${analysis.needs_technical_build ? "✅ YES" : "❌ NO"}`);
  console.log(`   Priority: ${analysis.priority_level}`);

  console.log("\n" + "~".repeat(60) + "\n");
}

/**
 * Test scenario: Demonstrating agent pipeline
 */
export async function demoAgentPipeline() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: Agent Pipeline Determination");
  console.log("=".repeat(60) + "\n");

  const scenarios = [
    {
      name: "Product Build",
      input: "Build a SaaS product that collects customer data"
    },
    {
      name: "Simple Question",
      input: "What is JavaScript?"
    },
    {
      name: "Game Development",
      input: "Create a browser-based board game"
    }
  ];

  const analyzer = new RequestAnalyzer();

  for (const scenario of scenarios) {
    console.log(`\n📌 ${scenario.name}`);
    const pipeline = await analyzer.determineAgentPipeline(scenario.input);
    
    console.log("   Agents to activate:");
    Object.entries(pipeline.agents).forEach(([agent, active]) => {
      console.log(`   ${active ? "✅" : "❌"} ${agent}`);
    });
  }

  console.log("\n" + "~".repeat(60) + "\n");
}

/**
 * Test report generation
 */
export async function demoReportGeneration() {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 6: Report Generation");
  console.log("=".repeat(60) + "\n");

  const { ReportGenerator } = await import("./repo/reportGenerator.js");
  const generator = new ReportGenerator();

  // Sample legal analysis
  const legalAnalysis = {
    compliance_concerns: [
      {
        title: "GDPR Compliance",
        severity: "critical",
        description: "Platform collects personal data from EU users",
        recommendations: [
          "Implement privacy impact assessment",
          "Add data processing agreement",
          "Implement right to deletion"
        ]
      },
      {
        title: "Payment Processing",
        severity: "high",
        description: "Needs PCI DSS compliance",
        recommendations: ["Use PCI-compliant payment processor", "Never store full card numbers"]
      }
    ],
    affected_jurisdictions: ["EU (GDPR)", "US (CCPA)", "UK (UK GDPR)"],
    recommended_actions: [
      "Consult with data privacy lawyer",
      "Implement privacy policy",
      "Add terms of service"
    ]
  };

  // Sample marketing strategy
  const marketingStrategy = {
    target_market: "Mid-market B2B SaaS companies (50-500 employees)",
    value_proposition: "Real-time database synchronization saving developers 40+ hours/month",
    primary_channels: ["Product Hunt", "LinkedIn", "Developer communities", "SaaS directories"],
    secondary_channels: ["Content marketing", "Webinars", "Partnerships"],
    launch_timeline: "Q2 2024",
    competitive_advantages: [
      "Lowest latency synchronization (<100ms)",
      "Zero configuration setup"
    ]
  };

  const summary = generator.generateSummary({
    projectName: "DataSync",
    legalAnalysis,
    marketingStrategy
  });

  console.log(summary);

  // Generate full report
  const report = generator.generateComplianceReport({
    projectName: "DataSync",
    projectType: "product_build",
    legalAnalysis,
    marketingStrategy,
    requestAnalysis: {
      request_type: "product_build",
      needs_legal_review: true,
      needs_marketing_strategy: true,
      priority_level: "high"
    }
  });

  console.log("✅ Full report generated (first 40 lines):");
  console.log(report.split("\n").slice(0, 40).join("\n"));
  console.log("\n... [report continues] ...\n");

  console.log("~".repeat(60) + "\n");
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log("\n\n");
  console.log("╔" + "=".repeat(58) + "╗");
  console.log("║" + "  GENIE: INTELLIGENT REQUEST ROUTING SYSTEM DEMO".padEnd(59) + "║");
  console.log("║" + "  (Legal/Marketing Specialists Activated Only When Needed)".padEnd(59) + "║");
  console.log("╚" + "=".repeat(58) + "╝");

  try {
    await demoProductBuild();
    await demoSimpleQuestion();
    await demoFeatureRequest();
    await demoCompanyFormation();
    await demoAgentPipeline();
    await demoReportGeneration();

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL DEMOS COMPLETED");
    console.log("=".repeat(60) + "\n");

    console.log("Key Features Demonstrated:");
    console.log("  ✓ Request analysis classifies request type automatically");
    console.log("  ✓ Legal specialist activates ONLY for products/companies");
    console.log("  ✓ Marketing specialist activates ONLY for launches/companies");
    console.log("  ✓ Simple questions skip all specialists (efficient)");
    console.log("  ✓ Agent pipeline determined dynamically");
    console.log("  ✓ Compliance reports generated with full context");
    console.log("\n");
  } catch (err) {
    console.error("❌ Demo failed:", err.message);
    console.error(err.stack);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch(console.error);
}

export default {
  demoProductBuild,
  demoSimpleQuestion,
  demoFeatureRequest,
  demoCompanyFormation,
  demoAgentPipeline,
  demoReportGeneration,
  runAllDemos
};
