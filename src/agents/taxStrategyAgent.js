/**
 * Tax Strategy Agent
 * 
 * Expert tax advisor for investment and income tax optimization.
 * Provides legal strategies to minimize tax burden while maximizing wealth.
 * 
 * Key Capabilities:
 * - Federal and state tax calculations
 * - Capital gains optimization (short-term vs long-term)
 * - Tax-loss harvesting strategies
 * - Tax-advantaged account recommendations
 * - Dividend and crypto tax handling
 * - Veteran-specific tax benefits
 * - SDVOSB business tax strategies
 * 
 * DISCLAIMER: This is for informational purposes only, not professional tax advice.
 * Consult a CPA or tax attorney for your specific situation.
 * 
 * @class TaxStrategyAgent
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { llmJson } from "../llm/openaiClient.js";

// 2026 Tax Brackets (Federal - estimated based on inflation adjustments)
const FEDERAL_TAX_BRACKETS_2026 = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 }
  ],
  marriedJoint: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 }
  ]
};

// Capital gains rates
const CAPITAL_GAINS_RATES_2026 = {
  shortTerm: "ordinary income rate", // held < 1 year
  longTerm: {
    single: [
      { min: 0, max: 47025, rate: 0.00 },
      { min: 47025, max: 518900, rate: 0.15 },
      { min: 518900, max: Infinity, rate: 0.20 }
    ],
    marriedJoint: [
      { min: 0, max: 94050, rate: 0.00 },
      { min: 94050, max: 583750, rate: 0.15 },
      { min: 583750, max: Infinity, rate: 0.20 }
    ]
  },
  collectibles: 0.28, // Gold, silver, collectible assets
  qualifiedDividends: "same as long-term capital gains",
  netInvestmentIncomeTax: 0.038 // Additional 3.8% NIIT above $200K single / $250K married
};

// State tax info (major states)
const STATE_TAX_RATES = {
  // No income tax states
  TX: { name: "Texas", rate: 0, type: "none", notes: "No state income tax" },
  FL: { name: "Florida", rate: 0, type: "none", notes: "No state income tax" },
  NV: { name: "Nevada", rate: 0, type: "none", notes: "No state income tax" },
  WA: { name: "Washington", rate: 0, type: "none", notes: "No income tax, but 7% cap gains tax on gains > $262K" },
  WY: { name: "Wyoming", rate: 0, type: "none", notes: "No state income tax" },
  AK: { name: "Alaska", rate: 0, type: "none", notes: "No state income tax" },
  SD: { name: "South Dakota", rate: 0, type: "none", notes: "No state income tax" },
  TN: { name: "Tennessee", rate: 0, type: "none", notes: "No state income tax (Hall Tax ended 2021)" },
  NH: { name: "New Hampshire", rate: 0, type: "none", notes: "No income tax (interest/dividends tax ended 2025)" },
  
  // Flat tax states
  CO: { name: "Colorado", rate: 0.044, type: "flat", notes: "4.4% flat rate" },
  IL: { name: "Illinois", rate: 0.0495, type: "flat", notes: "4.95% flat rate" },
  IN: { name: "Indiana", rate: 0.0305, type: "flat", notes: "3.05% flat rate" },
  MI: { name: "Michigan", rate: 0.0425, type: "flat", notes: "4.25% flat rate" },
  NC: { name: "North Carolina", rate: 0.0475, type: "flat", notes: "4.75% flat rate" },
  PA: { name: "Pennsylvania", rate: 0.0307, type: "flat", notes: "3.07% flat rate" },
  UT: { name: "Utah", rate: 0.0465, type: "flat", notes: "4.65% flat rate" },
  
  // High tax states (progressive)
  CA: { name: "California", rate: 0.133, type: "progressive", notes: "Top rate 13.3%, highest in US" },
  NY: { name: "New York", rate: 0.109, type: "progressive", notes: "Top rate 10.9% + NYC adds 3.876%" },
  NJ: { name: "New Jersey", rate: 0.1075, type: "progressive", notes: "Top rate 10.75%" },
  OR: { name: "Oregon", rate: 0.099, type: "progressive", notes: "Top rate 9.9%" },
  MN: { name: "Minnesota", rate: 0.0985, type: "progressive", notes: "Top rate 9.85%" },
  
  // Moderate states
  AZ: { name: "Arizona", rate: 0.025, type: "flat", notes: "2.5% flat rate" },
  GA: { name: "Georgia", rate: 0.055, type: "progressive", notes: "Moving to 5.49% flat" },
  OH: { name: "Ohio", rate: 0.04, type: "progressive", notes: "Top rate ~4%" },
  VA: { name: "Virginia", rate: 0.0575, type: "progressive", notes: "Top rate 5.75%" }
};

// Tax-advantaged accounts
const TAX_ADVANTAGED_ACCOUNTS = {
  traditional401k: {
    name: "Traditional 401(k)",
    limit2026: 23500,
    catchUp50Plus: 7500,
    catchUp60to63: 11250, // New SECURE 2.0 provision
    taxBenefit: "Pre-tax contributions, tax-deferred growth, taxed on withdrawal",
    bestFor: "High earners expecting lower tax bracket in retirement"
  },
  roth401k: {
    name: "Roth 401(k)",
    limit2026: 23500,
    catchUp50Plus: 7500,
    taxBenefit: "After-tax contributions, tax-free growth and withdrawals",
    bestFor: "Younger workers, expecting higher tax bracket in retirement"
  },
  traditionalIRA: {
    name: "Traditional IRA",
    limit2026: 7000,
    catchUp50Plus: 1000,
    taxBenefit: "Deductible contributions (income limits apply), tax-deferred growth",
    incomePhaseout: { single: 87000, married: 143000 }
  },
  rothIRA: {
    name: "Roth IRA",
    limit2026: 7000,
    catchUp50Plus: 1000,
    taxBenefit: "After-tax, tax-free growth and withdrawals",
    incomePhaseout: { single: 161000, married: 240000 }
  },
  hsa: {
    name: "Health Savings Account",
    limitSelf2026: 4300,
    limitFamily2026: 8550,
    catchUp55Plus: 1000,
    taxBenefit: "Triple tax advantage: deductible, tax-free growth, tax-free medical withdrawals",
    notes: "Best tax-advantaged account available. Can invest and use in retirement."
  },
  sep_ira: {
    name: "SEP-IRA",
    limit2026: "25% of net self-employment income, max $69,000",
    taxBenefit: "Pre-tax, great for self-employed/contractors",
    bestFor: "SDVOSB business owners with high income"
  },
  solo401k: {
    name: "Solo 401(k)",
    limit2026: "Employee: $23,500 + Employer: 25% of compensation, max $69,000 total",
    taxBenefit: "Highest contribution limits for self-employed",
    bestFor: "Self-employed with no employees"
  }
};

// Veteran-specific tax benefits
const VETERAN_TAX_BENEFITS = {
  disability: {
    name: "VA Disability Compensation",
    taxStatus: "100% tax-free at federal and state level",
    notes: "Not reported as income, does not count toward AGI"
  },
  combatPay: {
    name: "Combat Zone Tax Exclusion",
    taxStatus: "Tax-free, can still contribute to Roth IRA",
    notes: "Can elect to include in earned income for EITC"
  },
  propertyTax: {
    name: "Property Tax Exemptions",
    taxStatus: "Varies by state",
    notes: "Many states offer 100% exemption for 100% disabled vets"
  },
  capitalGainsExclusion: {
    name: "Home Sale Exclusion",
    amount: "$250K single / $500K married",
    notes: "Extended timeline for military/veteran deployments"
  },
  sdvosbDeductions: {
    name: "SDVOSB Business Deductions",
    benefits: [
      "Section 179 equipment deduction up to $1,160,000",
      "Qualified Business Income (QBI) deduction up to 20%",
      "Home office deduction",
      "Vehicle and mileage deductions",
      "Health insurance premium deduction"
    ]
  }
};

export class TaxStrategyAgent extends BaseAgent {
  constructor(opts = {}) {
    super({ name: "TaxStrategy", ...opts });
    this.federalBrackets = FEDERAL_TAX_BRACKETS_2026;
    this.capitalGainsRates = CAPITAL_GAINS_RATES_2026;
    this.stateTaxRates = STATE_TAX_RATES;
    this.taxAdvantagedAccounts = TAX_ADVANTAGED_ACCOUNTS;
    this.veteranBenefits = VETERAN_TAX_BENEFITS;
  }

  /**
   * Calculate federal income tax
   */
  calculateFederalTax(income, filingStatus = "single") {
    const brackets = this.federalBrackets[filingStatus] || this.federalBrackets.single;
    let tax = 0;
    let remainingIncome = income;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return {
      grossIncome: income,
      federalTax: Math.round(tax * 100) / 100,
      effectiveRate: Math.round((tax / income) * 10000) / 100,
      marginalRate: this.getMarginalRate(income, filingStatus)
    };
  }

  /**
   * Get marginal tax rate for income level
   */
  getMarginalRate(income, filingStatus = "single") {
    const brackets = this.federalBrackets[filingStatus] || this.federalBrackets.single;
    for (const bracket of brackets) {
      if (income >= bracket.min && income < bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }

  /**
   * Calculate capital gains tax
   */
  calculateCapitalGainsTax(gains, holdingPeriod, totalIncome, filingStatus = "single") {
    const isLongTerm = holdingPeriod >= 365; // days
    
    if (!isLongTerm) {
      // Short-term = ordinary income rate
      const marginalRate = this.getMarginalRate(totalIncome + gains, filingStatus);
      return {
        type: "short-term",
        rate: marginalRate,
        tax: Math.round(gains * marginalRate * 100) / 100,
        recommendation: "Consider holding 1+ year for lower long-term rates"
      };
    }

    // Long-term capital gains
    const ltBrackets = this.capitalGainsRates.longTerm[filingStatus] || 
                       this.capitalGainsRates.longTerm.single;
    
    let rate = 0;
    for (const bracket of ltBrackets) {
      if (totalIncome >= bracket.min && totalIncome < bracket.max) {
        rate = bracket.rate;
        break;
      }
    }

    // Check for NIIT (Net Investment Income Tax)
    const niitThreshold = filingStatus === "marriedJoint" ? 250000 : 200000;
    const niit = totalIncome > niitThreshold ? gains * 0.038 : 0;

    return {
      type: "long-term",
      rate: rate,
      niitRate: niit > 0 ? 0.038 : 0,
      totalRate: rate + (niit > 0 ? 0.038 : 0),
      tax: Math.round((gains * rate + niit) * 100) / 100,
      niitTax: Math.round(niit * 100) / 100
    };
  }

  /**
   * Analyze investment portfolio for tax efficiency
   */
  async analyzePortfolioTax(portfolio) {
    this.info({}, "Analyzing portfolio for tax efficiency");

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are an expert tax strategist specializing in investment tax optimization.
Your goal is to legally minimize tax burden while maximizing after-tax returns.

Key principles:
1. Tax-loss harvesting opportunities
2. Asset location optimization (which accounts for which assets)
3. Holding period management (short vs long-term)
4. Qualified dividend optimization
5. Wash sale rule awareness (30-day rule)
6. Crypto-specific tax strategies

Current tax law knowledge:
- Long-term capital gains (>1 year): 0%, 15%, or 20% depending on income
- Short-term capital gains: Ordinary income rates (up to 37%)
- Qualified dividends: Same as long-term cap gains
- Crypto: Treated as property, each sale is taxable event
- NFTs: Collectible rate of 28%
- Staking rewards: Ordinary income when received

Be specific and actionable. Include dollar estimates where possible.`,
        user: `Analyze this investment portfolio for tax optimization:

${JSON.stringify(portfolio, null, 2)}

Provide:
1. current_tax_exposure: Estimated taxes owed on current positions if sold
2. tax_efficiency_score: Rate portfolio 1-10 for tax efficiency
3. immediate_actions: Things to do right now to reduce taxes
4. tax_loss_harvest: Positions to sell at loss to offset gains
5. hold_longer: Positions close to long-term threshold
6. asset_location: Which assets should be in which account types
7. dividend_strategy: Optimize for qualified dividends
8. crypto_specific: Crypto tax strategies
9. estimated_savings: How much could be saved with optimizations
10. warnings: Tax traps to avoid`,
        schema: {
          name: "portfolio_tax_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["current_tax_exposure", "tax_efficiency_score", "immediate_actions", "tax_loss_harvest", "hold_longer", "asset_location", "dividend_strategy", "crypto_specific", "estimated_savings", "warnings"],
            properties: {
              current_tax_exposure: { type: "string" },
              tax_efficiency_score: { type: "string" },
              immediate_actions: { type: "array", items: { type: "string" } },
              tax_loss_harvest: { type: "string" },
              hold_longer: { type: "string" },
              asset_location: { type: "string" },
              dividend_strategy: { type: "string" },
              crypto_specific: { type: "string" },
              estimated_savings: { type: "string" },
              warnings: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });

      return { success: true, analysis: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get tax-optimized investment strategy
   */
  async getTaxOptimizedStrategy(investmentGoal, options = {}) {
    const { 
      income = 100000, 
      filingStatus = "single", 
      state = "TX",
      isVeteran = false,
      hasSDVOSB = false,
      age = 35
    } = options;

    this.info({}, `Generating tax-optimized strategy for ${filingStatus} in ${state}`);

    const stateInfo = this.stateTaxRates[state] || { rate: 0.05, type: "unknown" };

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are a tax optimization expert providing LEGAL strategies to minimize taxes.
All recommendations must be legally compliant with IRS rules.

Context:
- Filing Status: ${filingStatus}
- Annual Income: $${income.toLocaleString()}
- State: ${stateInfo.name} (${stateInfo.type} tax: ${(stateInfo.rate * 100).toFixed(1)}%)
- Age: ${age}
- Veteran: ${isVeteran ? "Yes" : "No"}
- SDVOSB Business: ${hasSDVOSB ? "Yes" : "No"}

${isVeteran ? `Veteran Tax Benefits Available:
- VA Disability: 100% tax-free
- Property tax exemptions (state dependent)
- Combat pay exclusions` : ""}

${hasSDVOSB ? `SDVOSB Business Tax Benefits:
- Section 179 deduction up to $1,160,000
- QBI deduction up to 20%
- Home office deduction
- Health insurance deduction
- Self-employed retirement accounts (SEP-IRA, Solo 401k)` : ""}

Tax-Advantaged Account Limits (2026):
- 401(k): $23,500 (+ $7,500 catch-up if 50+)
- IRA: $7,000 (+ $1,000 catch-up if 50+)
- HSA: $4,300 individual / $8,550 family
- SEP-IRA: 25% of net income, max $69,000
- Solo 401(k): Up to $69,000 total

Be specific with dollar amounts and actionable steps.`,
        user: `Investment Goal: ${investmentGoal}

Create a comprehensive tax-optimized investment strategy including:
1. recommended_accounts: Which accounts to use and why
2. contribution_order: Priority order for contributions
3. asset_allocation: Tax-efficient asset placement
4. estimated_tax_savings: Annual savings from strategy
5. state_specific: Strategies for ${stateInfo.name}
6. veteran_strategies: If applicable, veteran-specific optimizations
7. business_strategies: If SDVOSB, business tax optimizations
8. timeline: When to execute each step
9. retirement_projection: Tax-advantaged retirement savings impact
10. warnings: Common mistakes to avoid`,
        schema: {
          name: "tax_strategy",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["recommended_accounts", "contribution_order", "asset_allocation", "estimated_tax_savings", "state_specific", "veteran_strategies", "business_strategies", "timeline", "retirement_projection", "warnings"],
            properties: {
              recommended_accounts: { type: "string" },
              contribution_order: { type: "array", items: { type: "string" } },
              asset_allocation: { type: "string" },
              estimated_tax_savings: { type: "string" },
              state_specific: { type: "string" },
              veteran_strategies: { type: "string" },
              business_strategies: { type: "string" },
              timeline: { type: "string" },
              retirement_projection: { type: "string" },
              warnings: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });

      // Add manual calculations
      const federalTax = this.calculateFederalTax(income, filingStatus);
      const stateTax = stateInfo.rate * income;

      return {
        success: true,
        strategy: result,
        calculations: {
          federalTax,
          stateTax: { 
            state: stateInfo.name, 
            tax: Math.round(stateTax), 
            rate: stateInfo.rate 
          },
          combinedRate: federalTax.effectiveRate + (stateInfo.rate * 100),
          taxAdvantagedLimits: age >= 50 
            ? { "401k": 31000, ira: 8000, hsa: 4300 }
            : { "401k": 23500, ira: 7000, hsa: 4300 }
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Calculate tax on investment income report
   */
  async analyzeInvestmentReportTax(sectors, options = {}) {
    const {
      investmentAmount = 100000,
      income = 100000,
      filingStatus = "single",
      state = "TX",
      isVeteran = false
    } = options;

    this.info({}, "Analyzing investment report for tax implications");

    const stateInfo = this.stateTaxRates[state] || { rate: 0, name: "Unknown" };

    try {
      const result = await llmJson({
        model: "gpt-4o",
        system: `You are a tax expert analyzing investment recommendations for tax implications.
Calculate expected taxes and suggest optimizations.

Investor Profile:
- Investment Amount: $${investmentAmount.toLocaleString()}
- Annual Income: $${income.toLocaleString()}  
- Filing Status: ${filingStatus}
- State: ${stateInfo.name} (${(stateInfo.rate * 100).toFixed(1)}% income tax)
- Disabled Veteran: ${isVeteran ? "Yes - VA disability income is tax-free" : "No"}

Tax Rates Reference:
- Long-term cap gains (>1 year): 0%, 15%, or 20%
- Short-term cap gains: Up to 37% (ordinary income)
- Qualified dividends: Same as long-term rates
- Crypto: Property treatment, taxable on disposition
- Gold/Collectibles: 28% max rate

Investment Types in Report:
- Defense/Energy stocks: Qualified dividends + potential cap gains
- Crypto (XRP, BTC, ETH): Property, taxed on sale
- Gold/Uranium: Collectibles rate for physical, regular for ETFs
- Dividend stocks: Qualified dividend treatment`,
        user: `Analyze tax implications for this investment allocation:

${JSON.stringify(sectors, null, 2)}

Provide comprehensive tax analysis:
1. sector_tax_breakdown: Tax treatment for each sector
2. dividend_income_estimate: Expected annual dividends and tax
3. capital_gains_scenarios: Tax on 10%, 20%, 50% gains
4. tax_drag: Annual tax cost reducing returns
5. optimal_account_placement: Where to hold each sector type
6. tax_loss_harvesting: Opportunities in volatile sectors
7. state_impact: How ${stateInfo.name} taxes affect returns
8. veteran_optimization: ${isVeteran ? "Specific veteran strategies" : "N/A"}
9. total_tax_estimate: Expected annual tax burden
10. optimization_savings: How much can be saved with strategies
11. legal_warnings: Compliance considerations`,
        schema: {
          name: "investment_tax_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["sector_tax_breakdown", "dividend_income_estimate", "capital_gains_scenarios", "tax_drag", "optimal_account_placement", "total_tax_estimate", "optimization_savings", "legal_warnings"],
            properties: {
              sector_tax_breakdown: { type: "string" },
              dividend_income_estimate: { type: "string" },
              capital_gains_scenarios: { type: "string" },
              tax_drag: { type: "string" },
              optimal_account_placement: { type: "string" },
              tax_loss_harvesting: { type: "string" },
              state_impact: { type: "string" },
              veteran_optimization: { type: "string" },
              total_tax_estimate: { type: "string" },
              optimization_savings: { type: "string" },
              legal_warnings: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.2
      });

      return { success: true, taxAnalysis: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get state tax comparison for relocation decisions
   */
  getStateTaxComparison(income, currentState, targetStates = []) {
    const states = targetStates.length > 0 ? targetStates : ["TX", "FL", "NV", "WA", "TN", "AZ", "CO", "NC"];
    
    const comparison = states.map(stateCode => {
      const stateInfo = this.stateTaxRates[stateCode];
      if (!stateInfo) return null;
      
      const stateTax = Math.round(income * stateInfo.rate);
      return {
        state: stateCode,
        name: stateInfo.name,
        type: stateInfo.type,
        rate: stateInfo.rate,
        annualTax: stateTax,
        notes: stateInfo.notes
      };
    }).filter(Boolean).sort((a, b) => a.annualTax - b.annualTax);

    const currentInfo = this.stateTaxRates[currentState];
    const currentTax = currentInfo ? income * currentInfo.rate : 0;

    return {
      currentState: {
        state: currentState,
        name: currentInfo?.name || "Unknown",
        annualTax: Math.round(currentTax)
      },
      comparison,
      potentialSavings: comparison.map(s => ({
        state: s.name,
        savings: Math.round(currentTax - s.annualTax)
      })).filter(s => s.savings > 0)
    };
  }

  /**
   * Get tax calendar for important deadlines
   */
  getTaxCalendar(year = 2026) {
    return {
      year,
      quarterly: [
        { date: `${year}-01-15`, description: "Q4 estimated tax payment due (prior year)" },
        { date: `${year}-04-15`, description: "Tax filing deadline / Q1 estimated payment" },
        { date: `${year}-06-15`, description: "Q2 estimated tax payment due" },
        { date: `${year}-09-15`, description: "Q3 estimated tax payment due" }
      ],
      important: [
        { date: `${year}-04-15`, description: "IRA/HSA contribution deadline for prior year" },
        { date: `${year}-10-15`, description: "Extended tax filing deadline" },
        { date: `${year}-12-31`, description: "Tax-loss harvesting deadline" },
        { date: `${year}-12-31`, description: "401(k) contribution deadline" },
        { date: `${year}-12-31`, description: "Required Minimum Distribution (RMD) deadline" }
      ],
      crypto: [
        { date: `${year}-01-31`, description: "1099-DA/B forms from exchanges" },
        { date: `${year}-04-15`, description: "Report crypto gains/losses on Schedule D" }
      ]
    };
  }

  /**
   * Quick tax estimate for a single trade
   */
  estimateTradeTax(buyPrice, sellPrice, quantity, holdingDays, income, filingStatus = "single") {
    const proceeds = sellPrice * quantity;
    const costBasis = buyPrice * quantity;
    const gain = proceeds - costBasis;
    
    if (gain <= 0) {
      return {
        gain,
        tax: 0,
        type: "loss",
        carryover: Math.min(3000, Math.abs(gain)),
        remainingLoss: Math.max(0, Math.abs(gain) - 3000),
        note: "Losses offset gains; up to $3,000 can offset ordinary income; rest carries forward"
      };
    }

    const capGainsTax = this.calculateCapitalGainsTax(gain, holdingDays, income, filingStatus);
    
    return {
      proceeds,
      costBasis,
      gain,
      holdingPeriod: holdingDays >= 365 ? "long-term" : "short-term",
      daysUntilLongTerm: holdingDays < 365 ? 365 - holdingDays : 0,
      ...capGainsTax,
      afterTaxGain: Math.round((gain - capGainsTax.tax) * 100) / 100
    };
  }

  /**
   * Get all veteran tax benefits
   */
  getVeteranTaxBenefits(state = "TX") {
    const stateInfo = this.stateTaxRates[state];
    
    return {
      federal: this.veteranBenefits,
      state: {
        name: stateInfo?.name || state,
        propertyTaxExemption: "Check state-specific rules - many exempt 100% disabled vets",
        incomeExemption: stateInfo?.rate === 0 
          ? "No state income tax" 
          : "VA disability always exempt at state level"
      },
      sdvosb: {
        description: "Service-Disabled Veteran-Owned Small Business Tax Benefits",
        benefits: this.veteranBenefits.sdvosbDeductions.benefits
      },
      recommendation: "Maximize tax-free VA disability + SDVOSB business deductions for optimal tax efficiency"
    };
  }

  /**
   * Build method for orchestration
   */
  async build({ plan, traceId, iteration, userInput }) {
    this.info({ traceId, iteration }, "TaxStrategyAgent build called");

    const input = (userInput || "").toLowerCase();
    const isTaxRequest = input.includes("tax") || input.includes("deduction") || input.includes("irs");

    if (!isTaxRequest) {
      return makeAgentOutput({
        summary: "No tax strategy work items",
        notes: []
      });
    }

    // Default to veteran tax analysis
    const benefits = this.getVeteranTaxBenefits("TX");
    const calendar = this.getTaxCalendar(2026);

    return makeAgentOutput({
      summary: "Tax strategy analysis complete",
      notes: [
        `Veteran benefits analyzed`,
        `Tax calendar generated for 2026`
      ],
      patches: [{
        type: "file",
        path: `reports/tax-strategy-${new Date().toISOString().split("T")[0]}.json`,
        content: JSON.stringify({ benefits, calendar }, null, 2)
      }]
    });
  }
}

export default TaxStrategyAgent;
