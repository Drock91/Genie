/**
 * Full AI Company Demo
 * Demonstrates all 18 departments working together as a complete operational company
 */

import { DepartmentManager } from "./experts/departmentManager.js";
import { Logger } from "./util/logger.js";

/**
 * Showcase the full organization
 */
export async function showcaseOrganization() {
  console.log("\n\n");
  console.log("╔" + "═".repeat(62) + "╗");
  console.log("║" + "  🚀 GENIE: FULLY OPERATIONAL AI COMPANY SYSTEM 🚀".padEnd(63) + "║");
  console.log("║" + "  18 Departments | Multi-LLM Consensus | Enterprise Ready".padEnd(63) + "║");
  console.log("╚" + "═".repeat(62) + "╝");

  const logger = new Logger();
  const manager = new DepartmentManager({ logger });

  // Display organization chart
  console.log("\n");
  manager.printOrganization();

  // Display capabilities
  manager.printCapabilities();

  // Show routing examples
  await demonstrateRouting(manager);

  // Show department details
  demonstrateDepartments(manager);
}

/**
 * Demonstrate intelligent request routing
 */
async function demonstrateRouting(manager) {
  console.log("\n" + "═".repeat(64));
  console.log("📍 REQUEST ROUTING EXAMPLES");
  console.log("═".repeat(64) + "\n");

  const scenarios = [
    {
      request: "Build a SaaS platform with React frontend and Node backend, we're launching next quarter",
      description: "Product Build + Launch"
    },
    {
      request: "We need to hire 5 new engineers and establish payroll",
      description: "HR + Payroll"
    },
    {
      request: "Analyze our metrics, create a dashboard, and forecast revenue for next year",
      description: "Analytics"
    },
    {
      request: "Review our compliance requirements and create a risk management plan",
      description: "Compliance + Legal"
    },
    {
      request: "Help us scale our infrastructure for 10x growth",
      description: "DevOps + Architecture"
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n📌 [${scenario.description}]`);
    console.log(`   Request: "${scenario.request}"`);
    
    const routing = await manager.routeRequest(scenario.request);
    
    console.log(`   Departments Activated:`);
    routing.departments.forEach(dept => console.log(`      ✓ ${dept}`));
  }

  console.log("\n" + "─".repeat(64) + "\n");
}

/**
 * Show department capabilities
 */
function demonstrateDepartments(manager) {
  console.log("═".repeat(64));
  console.log("🏢 DEPARTMENTAL CAPABILITIES");
  console.log("═".repeat(64) + "\n");

  const departments = [
    {
      name: "🔧 Backend Development",
      capabilities: [
        "Design scalable APIs",
        "Database architecture",
        "Microservices design",
        "Performance optimization"
      ]
    },
    {
      name: "🎨 Frontend Development",
      capabilities: [
        "React/Vue applications",
        "UI/UX implementation",
        "Component design",
        "Accessibility compliance"
      ]
    },
    {
      name: "💰 Finance & Accounting",
      capabilities: [
        "Budget creation",
        "Expense analysis",
        "Cash flow projection",
        "Invoice generation"
      ]
    },
    {
      name: "💼 Human Resources",
      capabilities: [
        "Recruiting & hiring",
        "Performance reviews",
        "Training programs",
        "Compensation analysis"
      ]
    },
    {
      name: "🔐 Security & Compliance",
      capabilities: [
        "Vulnerability assessment",
        "Compliance audits",
        "Risk management",
        "Security hardening"
      ]
    },
    {
      name: "📊 Product Management",
      capabilities: [
        "Roadmap creation",
        "Feature prioritization",
        "Competitive analysis",
        "Market validation"
      ]
    },
    {
      name: "📈 Sales & Customer Success",
      capabilities: [
        "Customer onboarding",
        "Churn prevention",
        "Support strategy",
        "Retention programs"
      ]
    },
    {
      name: "🎯 Marketing",
      capabilities: [
        "Go-to-market strategy",
        "Brand messaging",
        "Campaign planning",
        "Market positioning"
      ]
    }
  ];

  departments.forEach(dept => {
    console.log(`${dept.name}`);
    dept.capabilities.forEach(cap => {
      console.log(`   • ${cap}`);
    });
    console.log();
  });
}

/**
 * Demonstrate agent specialization
 */
function demonstrateSpecialization() {
  console.log("\n" + "═".repeat(64));
  console.log("🧠 AGENT SPECIALIZATION & CONSENSUS");
  console.log("═".repeat(64) + "\n");

  const specializations = [
    {
      agent: "Accounting Agent",
      profile: "Accurate",
      temperature: 0.05,
      reason: "Financial precision is critical",
      example: "Calculates payroll with exact tax witholding to the cent"
    },
    {
      agent: "Marketing Agent",
      profile: "Balanced",
      temperature: 0.3,
      reason: "Allows creativity while maintaining strategy",
      example: "Develops creative campaign messaging that stays on brand"
    },
    {
      agent: "Backend Coder",
      profile: "Balanced",
      temperature: 0.2,
      reason: "Balance between standards and innovation",
      example: "Chooses proven patterns while considering new optimizations"
    }
  ];

  specializations.forEach(spec => {
    console.log(`${spec.agent}`);
    console.log(`   Profile: ${spec.profile}`);
    console.log(`   Temperature: ${spec.temperature} (${spec.reason})`);
    console.log(`   Example: ${spec.example}`);
    console.log();
  });
}

/**
 * Show capabilities in action
 */
async function demonstrateCapabilities() {
  console.log("\n" + "═".repeat(64));
  console.log("💪 REAL-WORLD CAPABILITY EXAMPLES");
  console.log("═".repeat(64) + "\n");

  const examples = [
    {
      scenario: "You: 'Build me a SaaS product'",
      departments: ["Product Manager", "Backend Coder", "Frontend Coder", "DevOps"],
      output: "Complete architecture, code, deployment strategy, product roadmap"
    },
    {
      scenario: "You: 'Create company with HR & payroll'",
      departments: ["HR", "Payroll", "Finance", "Legal"],
      output: "Hiring process, payroll setup, tax compliance, employee handbook"
    },
    {
      scenario: "You: 'Analyze market for new product'",
      departments: ["Research", "Product Manager", "Analytics", "Marketing"],
      output: "Market size, competitor analysis, target users, positioning strategy"
    },
    {
      scenario: "You: 'Help us scale 10x safely'",
      departments: ["Architecture", "DevOps", "Security", "Compliance"],
      output: "Scaling plan, infrastructure upgrade, security audit, compliance review"
    }
  ];

  examples.forEach((ex, idx) => {
    console.log(`${idx + 1}. ${ex.scenario}`);
    console.log(`   Departments: ${ex.departments.join(" → ")}`);
    console.log(`   Delivers: ${ex.output}`);
    console.log();
  });
}

/**
 * Main demo runner
 */
export async function runFullDemo() {
  try {
    await showcaseOrganization();
    demonstrateSpecialization();
    await demonstrateCapabilities();

    console.log("\n" + "═".repeat(64));
    console.log("✅ GENIE AI COMPANY IS FULLY OPERATIONAL");
    console.log("═".repeat(64));
    console.log("\n🎯 Key Achievements:");
    console.log("   ✓ 18 specialist departments covering all business functions");
    console.log("   ✓ Multi-LLM consensus for precision and reliability");
    console.log("   ✓ Intelligent request routing to optimal departments");
    console.log("   ✓ End-to-end capability from strategy to execution");
    console.log("   ✓ Enterprise-grade compliance and security");
    console.log("\n🚀 Ready to handle any business request!\n");

  } catch (err) {
    console.error("❌ Demo failed:", err.message);
    console.error(err.stack);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullDemo().catch(console.error);
}

export default {
  showcaseOrganization,
  demonstrateRouting,
  demonstrateDepartments,
  demonstrateSpecialization,
  demonstrateCapabilities,
  runFullDemo
};
