#!/usr/bin/env node
/**
 * Investment Report Generator CLI
 * 
 * Generates comprehensive PDF investment reports with market analysis,
 * entry/exit targets, and timing recommendations.
 * 
 * Usage:
 *   node generate-report.js                    # Full report (all sectors)
 *   node generate-report.js --war              # War profit focus
 *   node generate-report.js --income           # Income/dividend focus
 *   node generate-report.js --crypto           # Crypto focus
 *   node generate-report.js --no-veteran       # Exclude SDVOSB section
 *   npm run report                             # Via npm script
 */

import "dotenv/config";
import NewsAnalysisAgent from "./src/agents/newsAnalysisAgent.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  focus: "all",
  includeVeteran: true,
  outputPath: path.join(__dirname, "reports")
};

// Parse flags
for (const arg of args) {
  if (arg === "--war" || arg === "-w") {
    options.focus = "war";
  } else if (arg === "--income" || arg === "-i") {
    options.focus = "income";
  } else if (arg === "--crypto" || arg === "-c") {
    options.focus = "crypto";
  } else if (arg === "--no-veteran" || arg === "--no-vet") {
    options.includeVeteran = false;
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║              INVESTMENT REPORT GENERATOR                              ║
╚══════════════════════════════════════════════════════════════════════╝

Usage: node generate-report.js [options]

Options:
  --war, -w        Focus on war profit sectors (defense, energy, uranium, commodities)
  --income, -i     Focus on income generation (dividends, energy, commodities)
  --crypto, -c     Focus on cryptocurrency only
  --no-veteran     Exclude SDVOSB contracting section
  --help, -h       Show this help message

Examples:
  node generate-report.js              Generate full report
  node generate-report.js --war        War profit focus
  node generate-report.js --income     Income/dividend focus
  npm run report                       Generate via npm script

Output: reports/investment-report-YYYY-MM-DD.pdf
`);
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║              INVESTMENT REPORT GENERATOR                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Focus: ${options.focus.toUpperCase().padEnd(60)}║
║  Include Veteran Section: ${options.includeVeteran ? "YES" : "NO ".padEnd(48)}║
╚══════════════════════════════════════════════════════════════════════╝
`);

  console.log("🔄 Initializing analysis engine...\n");
  
  const agent = new NewsAnalysisAgent();
  
  console.log("📊 Analyzing market sectors (this may take 1-2 minutes)...\n");
  
  try {
    const startTime = Date.now();
    const result = await agent.generateInvestmentReport(options);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result.success) {
      console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    ✅ REPORT GENERATED                                ║
╠══════════════════════════════════════════════════════════════════════╣
║  File: ${result.filename.padEnd(62)}║
║  Path: ${result.filepath.substring(0, 62).padEnd(62)}║
║  Sectors Analyzed: ${result.sectors.length.toString().padEnd(50)}║
║  Generation Time: ${(duration + " seconds").padEnd(51)}║
╚══════════════════════════════════════════════════════════════════════╝
`);
      
      console.log("📈 SECTORS INCLUDED:");
      for (const sector of result.sectors) {
        const analysis = result.analyses[sector];
        const status = analysis?.error ? "❌ FAILED" : "✅ ANALYZED";
        console.log(`   ${status} ${sector}`);
        if (analysis && !analysis.error) {
          console.log(`      └─ Best Pick: ${analysis.best_pick?.substring(0, 50) || 'N/A'}...`);
        }
      }
      
      console.log(`\n📄 Open the PDF: ${result.filepath}\n`);
      
    } else {
      console.error("❌ Report generation failed:", result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Error generating report:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
