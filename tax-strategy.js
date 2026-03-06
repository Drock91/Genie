#!/usr/bin/env node
/**
 * Tax Strategy CLI
 * 
 * Quick tax analysis and optimization recommendations.
 * 
 * Usage:
 *   node tax-strategy.js                           # Interactive tax analysis
 *   node tax-strategy.js --income 150000           # Analyze specific income
 *   node tax-strategy.js --state CA                # State-specific analysis
 *   node tax-strategy.js --veteran                 # Veteran tax benefits
 *   node tax-strategy.js --trade 100 150 10 400    # Trade tax (buy, sell, qty, days)
 *   node tax-strategy.js --compare                 # State tax comparison
 *   node tax-strategy.js --report                  # Full tax strategy for investments
 */

import "dotenv/config";
import TaxStrategyAgent from "./src/agents/taxStrategyAgent.js";

const args = process.argv.slice(2);

// Parse options
const options = {
  income: 100000,
  state: "TX",
  filingStatus: "single",
  isVeteran: true,  // Default for our user
  hasSDVOSB: true,  // Default for our user
  age: 35
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--income" && args[i + 1]) {
    options.income = parseInt(args[i + 1]);
    i++;
  } else if (arg === "--state" && args[i + 1]) {
    options.state = args[i + 1].toUpperCase();
    i++;
  } else if (arg === "--status" && args[i + 1]) {
    options.filingStatus = args[i + 1];
    i++;
  } else if (arg === "--age" && args[i + 1]) {
    options.age = parseInt(args[i + 1]);
    i++;
  } else if (arg === "--no-veteran") {
    options.isVeteran = false;
  } else if (arg === "--no-sdvosb") {
    options.hasSDVOSB = false;
  }
}

const agent = new TaxStrategyAgent();

function printBox(title, content) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(70)}\n`);
  console.log(content);
}

function printTaxBracket(income, filingStatus) {
  const result = agent.calculateFederalTax(income, filingStatus);
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                     FEDERAL TAX CALCULATION                           ║
╠══════════════════════════════════════════════════════════════════════╣
║  Gross Income:     $${income.toLocaleString().padEnd(49)}║
║  Federal Tax:      $${result.federalTax.toLocaleString().padEnd(49)}║
║  Effective Rate:   ${(result.effectiveRate + "%").padEnd(50)}║
║  Marginal Rate:    ${((result.marginalRate * 100).toFixed(0) + "%").padEnd(50)}║
╚══════════════════════════════════════════════════════════════════════╝
`);
  return result;
}

async function runTaxAnalysis() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    TAX STRATEGY ANALYZER                              ║
║                 Service-Disabled Veteran Edition                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  // Check for specific commands
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node tax-strategy.js [command] [options]

Commands:
  --trade <buy> <sell> <qty> <days>    Calculate tax on a specific trade
  --compare                            Compare state tax rates
  --veteran                            Show veteran tax benefits
  --calendar                           Show tax filing calendar
  --report                             Generate full tax strategy

Options:
  --income <amount>     Annual income (default: 100000)
  --state <code>        State code like TX, CA, FL (default: TX)
  --status <type>       Filing status: single, marriedJoint (default: single)
  --age <years>         Your age for catch-up contribution limits
  --no-veteran          Disable veteran-specific analysis
  --no-sdvosb           Disable SDVOSB business analysis

Examples:
  node tax-strategy.js --income 150000 --state CA
  node tax-strategy.js --trade 50 75 100 400
  node tax-strategy.js --veteran --state TX
  node tax-strategy.js --compare --income 200000
`);
    return;
  }

  // Trade calculation
  if (args.includes("--trade")) {
    const tradeIdx = args.indexOf("--trade");
    const buyPrice = parseFloat(args[tradeIdx + 1]) || 100;
    const sellPrice = parseFloat(args[tradeIdx + 2]) || 150;
    const quantity = parseInt(args[tradeIdx + 3]) || 100;
    const holdingDays = parseInt(args[tradeIdx + 4]) || 365;

    const result = agent.estimateTradeTax(buyPrice, sellPrice, quantity, holdingDays, options.income, options.filingStatus);

    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                     TRADE TAX CALCULATION                             ║
╠══════════════════════════════════════════════════════════════════════╣
║  Buy Price:        $${buyPrice.toFixed(2).padEnd(50)}║
║  Sell Price:       $${sellPrice.toFixed(2).padEnd(50)}║
║  Quantity:         ${quantity.toString().padEnd(51)}║
║  Holding Days:     ${holdingDays.toString().padEnd(51)}║
╠══════════════════════════════════════════════════════════════════════╣
║  Proceeds:         $${result.proceeds?.toLocaleString().padEnd(49) || "N/A".padEnd(49)}║
║  Cost Basis:       $${result.costBasis?.toLocaleString().padEnd(49) || "N/A".padEnd(49)}║
║  Gain/Loss:        $${result.gain?.toLocaleString().padEnd(49) || "N/A".padEnd(49)}║
║  Type:             ${(result.holdingPeriod || result.type || "N/A").toString().toUpperCase().padEnd(50)}║
║  Tax Rate:         ${((result.rate !== undefined ? (result.rate * 100).toFixed(1) + "%" : result.type === "loss" ? "0%" : "N/A")).padEnd(51)}║
║  Tax Owed:         $${(result.tax?.toLocaleString() || "0").padEnd(49)}║
║  After-Tax Gain:   $${(result.afterTaxGain?.toLocaleString() || result.gain?.toLocaleString() || "0").padEnd(49)}║
╚══════════════════════════════════════════════════════════════════════╝
`);

    if (result.daysUntilLongTerm > 0) {
      console.log(`⚠️  WAIT ${result.daysUntilLongTerm} MORE DAYS for long-term capital gains rate!`);
    }
    if (result.type === "loss") {
      console.log(`💡 Loss Deduction: Up to $${result.carryover} against ordinary income`);
      if (result.remainingLoss > 0) {
        console.log(`   Remaining $${result.remainingLoss} carries forward to future years`);
      }
    }
    return;
  }

  // State comparison
  if (args.includes("--compare")) {
    const comparison = agent.getStateTaxComparison(options.income, options.state);
    
    console.log(`\n📊 STATE TAX COMPARISON (Income: $${options.income.toLocaleString()})\n`);
    console.log(`Current State: ${comparison.currentState.name} - $${comparison.currentState.annualTax.toLocaleString()}/year\n`);
    console.log("State Comparison (sorted by tax, lowest first):");
    console.log("─".repeat(60));
    
    for (const state of comparison.comparison) {
      const savingsVsCurrent = comparison.currentState.annualTax - state.annualTax;
      const savingsStr = savingsVsCurrent > 0 ? `  (SAVE $${savingsVsCurrent.toLocaleString()})` : "";
      console.log(`  ${state.state.padEnd(4)} ${state.name.padEnd(18)} ${state.type.padEnd(12)} $${state.annualTax.toLocaleString().padStart(8)}${savingsStr}`);
    }
    
    if (comparison.potentialSavings.length > 0) {
      console.log(`\n💰 POTENTIAL SAVINGS by relocating from ${comparison.currentState.name}:`);
      for (const s of comparison.potentialSavings.slice(0, 5)) {
        console.log(`   ${s.state}: $${s.savings.toLocaleString()}/year`);
      }
    }
    return;
  }

  // Veteran benefits
  if (args.includes("--veteran")) {
    const benefits = agent.getVeteranTaxBenefits(options.state);
    
    console.log(`\n🎖️  VETERAN TAX BENEFITS (${benefits.state.name})\n`);
    
    console.log("FEDERAL BENEFITS:");
    console.log("─".repeat(50));
    for (const [key, benefit] of Object.entries(benefits.federal)) {
      if (benefit.name) {
        console.log(`  ${benefit.name}`);
        console.log(`    Status: ${benefit.taxStatus || "N/A"}`);
        if (benefit.notes) console.log(`    Note: ${benefit.notes}`);
        if (benefit.benefits) {
          for (const b of benefit.benefits) {
            console.log(`    • ${b}`);
          }
        }
        console.log();
      }
    }
    
    console.log("\nSTATE BENEFITS:");
    console.log("─".repeat(50));
    console.log(`  Property Tax: ${benefits.state.propertyTaxExemption}`);
    console.log(`  Income Tax: ${benefits.state.incomeExemption}`);
    
    console.log("\nSDVOSB BUSINESS BENEFITS:");
    console.log("─".repeat(50));
    for (const b of benefits.sdvosb.benefits) {
      console.log(`  • ${b}`);
    }
    
    console.log(`\n💡 ${benefits.recommendation}`);
    return;
  }

  // Tax calendar
  if (args.includes("--calendar")) {
    const calendar = agent.getTaxCalendar(2026);
    
    console.log(`\n📅 TAX CALENDAR ${calendar.year}\n`);
    
    console.log("QUARTERLY ESTIMATED PAYMENTS:");
    console.log("─".repeat(50));
    for (const item of calendar.quarterly) {
      console.log(`  ${item.date}  ${item.description}`);
    }
    
    console.log("\nIMPORTANT DEADLINES:");
    console.log("─".repeat(50));
    for (const item of calendar.important) {
      console.log(`  ${item.date}  ${item.description}`);
    }
    
    console.log("\nCRYPTO TAX DATES:");
    console.log("─".repeat(50));
    for (const item of calendar.crypto) {
      console.log(`  ${item.date}  ${item.description}`);
    }
    return;
  }

  // Full report/strategy
  if (args.includes("--report")) {
    console.log("🔄 Generating comprehensive tax strategy...\n");
    
    printTaxBracket(options.income, options.filingStatus);
    
    const strategy = await agent.getTaxOptimizedStrategy(
      "Maximize after-tax returns on war-profit investments while building wealth for medical treatments",
      options
    );
    
    if (strategy.success) {
      console.log("\n📊 TAX-OPTIMIZED STRATEGY:");
      console.log("═".repeat(70));
      
      console.log("\n💼 RECOMMENDED ACCOUNTS:");
      console.log(strategy.strategy.recommended_accounts);
      
      console.log("\n📋 CONTRIBUTION ORDER:");
      for (const item of strategy.strategy.contribution_order || []) {
        console.log(`  ${item}`);
      }
      
      console.log("\n📈 ASSET ALLOCATION:");
      console.log(strategy.strategy.asset_allocation);
      
      console.log("\n💰 ESTIMATED TAX SAVINGS:");
      console.log(strategy.strategy.estimated_tax_savings);
      
      if (strategy.strategy.veteran_strategies) {
        console.log("\n🎖️  VETERAN STRATEGIES:");
        console.log(strategy.strategy.veteran_strategies);
      }
      
      if (strategy.strategy.business_strategies) {
        console.log("\n🏢 SDVOSB BUSINESS STRATEGIES:");
        console.log(strategy.strategy.business_strategies);
      }
      
      console.log("\n⏰ TIMELINE:");
      console.log(strategy.strategy.timeline);
      
      console.log("\n⚠️  WARNINGS:");
      for (const warning of strategy.strategy.warnings || []) {
        console.log(`  ⚠️  ${warning}`);
      }
      
      console.log("\n📊 CALCULATIONS:");
      console.log(`  Federal Tax: $${strategy.calculations.federalTax.federalTax.toLocaleString()}`);
      console.log(`  Effective Rate: ${strategy.calculations.federalTax.effectiveRate}%`);
      console.log(`  State Tax (${strategy.calculations.stateTax.state}): $${strategy.calculations.stateTax.tax.toLocaleString()}`);
      console.log(`  Combined Rate: ~${strategy.calculations.combinedRate.toFixed(1)}%`);
      console.log(`\n  Tax-Advantaged Limits:`);
      console.log(`    401(k): $${strategy.calculations.taxAdvantagedLimits["401k"].toLocaleString()}`);
      console.log(`    IRA: $${strategy.calculations.taxAdvantagedLimits.ira.toLocaleString()}`);
      console.log(`    HSA: $${strategy.calculations.taxAdvantagedLimits.hsa.toLocaleString()}`);
    } else {
      console.error("❌ Strategy generation failed:", strategy.error);
    }
    return;
  }

  // Default: Quick tax overview
  console.log(`Profile: ${options.isVeteran ? "🎖️ Disabled Veteran" : "Civilian"} | ${options.hasSDVOSB ? "SDVOSB Owner" : ""}`);
  console.log(`State: ${options.state} | Filing: ${options.filingStatus} | Age: ${options.age}\n`);

  printTaxBracket(options.income, options.filingStatus);

  // Quick veteran benefits summary
  if (options.isVeteran) {
    console.log(`\n🎖️  VETERAN TAX ADVANTAGES:`);
    console.log(`  • VA Disability: 100% TAX-FREE (federal & state)`);
    console.log(`  • Property Tax: Check ${options.state} exemptions for disabled vets`);
    console.log(`  • SDVOSB: Section 179, QBI deduction, home office, etc.`);
  }

  // Tax-advantaged limits
  console.log(`\n📊 2026 TAX-ADVANTAGED LIMITS:`);
  const limits = agent.taxAdvantagedAccounts;
  console.log(`  • 401(k): $${limits.traditional401k.limit2026.toLocaleString()} ${options.age >= 50 ? `(+ $${limits.traditional401k.catchUp50Plus.toLocaleString()} catch-up)` : ""}`);
  console.log(`  • IRA: $${limits.traditionalIRA.limit2026.toLocaleString()} ${options.age >= 50 ? `(+ $${limits.traditionalIRA.catchUp50Plus.toLocaleString()} catch-up)` : ""}`);
  console.log(`  • HSA: $${limits.hsa.limitSelf2026.toLocaleString()} individual / $${limits.hsa.limitFamily2026.toLocaleString()} family`);
  console.log(`  • SEP-IRA: ${limits.sep_ira.limit2026}`);
  console.log(`  • Solo 401(k): ${limits.solo401k.limit2026}`);

  console.log(`\n💡 Run with --report for full strategy, --veteran for benefits, --compare for state comparison`);
}

runTaxAnalysis().catch(console.error);
