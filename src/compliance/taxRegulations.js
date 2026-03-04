/**
 * Tax Compliance Regulations Configuration
 * 
 * Example: How to build TurboTax with GENIE
 * Defines tax rules for multiple jurisdictions
 */

/**
 * US Federal Tax Regulations
 */
export const usFederalTaxRules = [
  {
    id: '1040_FILING',
    name: 'Form 1040 Filing Requirement',
    description: 'U.S. citizens and resident aliens must file Form 1040',
    applicability: {
      entityTypes: ['individual'],
      incomeRange: { min: 400, max: Infinity },
    },
    requirements: [
      {
        appliesTo: 'user_income_input',
        validation: 'Validate total income from all sources',
        errorMessage: 'Income must be accurately reported',
      },
      {
        appliesTo: 'deduction_calculation',
        validation: 'Calculate standard or itemized deductions',
        errorMessage: 'Deductions must comply with IRS rules',
      },
    ],
    validations: ['INCOME_VALIDATION', 'DEDUCTION_LIMIT_CHECK'],
    penalties: {
      description: 'Failure to file penalty',
      amount: '25% of unpaid tax or $100 minimum',
    },
    effectiveDate: '2024-01-01',
    references: [
      {
        title: 'IRS Form 1040 Instructions',
        url: 'https://www.irs.gov/pub/irs-pdf/i1040.pdf',
      },
      {
        title: 'IRC Section 6012',
        url: 'https://www.law.cornell.edu/uscode/text/26/6012',
      },
    ],
  },
  {
    id: 'STANDARD_DEDUCTION_2024',
    name: '2024 Standard Deduction Amounts',
    description:
      'Standard deduction amounts for 2024 tax year per filing status',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'deduction_selection',
        validation: `
          Single: $13,850
          Married Filing Jointly: $27,700
          Married Filing Separately: $13,850
          Head of Household: $20,800
          Qualifying Widow(er): $27,700
        `,
        errorMessage: 'Deduction amount must match current year limits',
      },
    ],
    dependsOn: ['1040_FILING'],
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
    references: [
      {
        title: '2024 Standard Deduction Amounts',
        url: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024',
      },
    ],
  },
  {
    id: 'CHILD_TAX_CREDIT',
    name: 'Child Tax Credit',
    description: '$2,000 credit for each qualifying child under 17',
    applicability: {
      entityTypes: ['individual'],
      incomeRange: { min: 0, max: 500000 },
    },
    requirements: [
      {
        appliesTo: 'dependent_management',
        validation:
          'Verify dependent Social Security Number and relationship',
        errorMessage: 'Invalid dependent information',
      },
      {
        appliesTo: 'credit_calculation',
        validation: 'Calculate $2,000 per qualifying dependent',
        errorMessage: 'Credit calculation incorrect',
      },
    ],
    validations: ['DEPENDENT_SSN_VALIDATION', 'INCOME_LIMITATION_CHECK'],
    penalties: {
      description: 'Claiming ineligible child credit',
      amount: 'Disallowance of credit plus accuracy-related penalty',
    },
    effectiveDate: '2024-01-01',
  },
  {
    id: 'IRA_CONTRIBUTION_LIMITS',
    name: '2024 IRA Contribution Limits',
    description: 'Annual contribution limits for Traditional and Roth IRAs',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'retirement_savings',
        validation: 'Limit contributions to $7,000 (age < 50) or $8,000 (age >= 50)',
        errorMessage: 'IRA contributions exceed annual limit',
      },
      {
        appliesTo: 'income_limits',
        validation: 'Apply income phase-out for Roth IRA contributions',
        errorMessage: 'Income exceeds Roth IRA contribution limits',
      },
    ],
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
  },
  {
    id: 'CAPITAL_GAINS_REPORTING',
    name: 'Capital Gains and Losses Reporting',
    description: 'Requirements for reporting investment income',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'investment_income',
        validation:
          'Report all sales of securities and track holding periods',
        errorMessage: 'Capital gains or losses not properly reported',
      },
      {
        appliesTo: 'holding_period',
        validation: 'Distinguish long-term (>1 year) vs short-term gains',
        errorMessage: 'Holding period incorrectly classified',
      },
      {
        appliesTo: 'tax_rates',
        validation:
          'Apply appropriate rates (0%, 15%, 20% for long-term; ordinary rates for short-term)',
        errorMessage: 'Incorrect tax rate applied to capital gains',
      },
    ],
    dependsOn: ['1040_FILING'],
    validations: [
      'COST_BASIS_VALIDATION',
      'HOLDING_PERIOD_VALIDATION',
      'RATE_TABLE_VALIDATION',
    ],
  },
  {
    id: 'AUDIT_DOCUMENTATION',
    name: 'Audit Trail and Documentation Requirements',
    description: 'Maintain records for tax compliance and audit purposes',
    applicability: {
      entityTypes: ['individual', 'business'],
    },
    requirements: [
      {
        appliesTo: 'all_features',
        validation:
          'Maintain audit trail of all entries and changes with timestamp and user',
        errorMessage: 'Audit trail not properly maintained',
      },
      {
        appliesTo: 'calculations',
        validation: 'Document calculation methodology and source documents',
        errorMessage: 'Calculation working papers missing',
      },
    ],
  },
];

/**
 * US State Tax Rules - California Example
 */
export const californiaStateTaxRules = [
  {
    id: 'CA_RESIDENT_REQUIREMENT',
    name: 'California Resident Status Determination',
    description:
      'Determine if resident, nonresident, or part-year resident for CA tax purposes',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'residency_determination',
        validation:
          'Apply CA residency rules based on physical presence, intent, and domicile',
        errorMessage: 'Incorrect residency status determination',
      },
    ],
  },
  {
    id: 'CA_STATE_TAX_RATE',
    name: 'California State Income Tax Rates 2024',
    description: 'Progressive tax rates from 1% to 13.3% (including NIIT)',
    applicability: {
      entityTypes: [ 'individual'],
    },
    requirements: [
      {
        appliesTo: 'state_tax_calculation',
        validation:
          'Apply California progressive rate schedule and top rate surcharge (13.3% bracket includes 1% Mental Health Tax)',
        errorMessage: 'Incorrect California tax rate applied',
      },
    ],
    references: [
      {
        title: 'California 2024 Tax Rates',
        url: 'https://www.ftb.ca.gov/file/personal-income-tax-rates.html',
      },
    ],
  },
  {
    id: 'CA_EARNED_INCOME_TAX_CREDIT',
    name: 'California Earned Income Tax Credit (CalEITC)',
    description: 'State credit for lower-income working individuals and families',
    applicability: {
      entityTypes: ['individual'],
      incomeRange: { min: 0, max: 60000 },
    },
    requirements: [
      {
        appliesTo: 'state_credits',
        validation: 'Calculate CalEITC based on earned income and family size',
        errorMessage: 'CalEITC calculation incorrect',
      },
    ],
  },
];

/**
 * US Federal Business Tax Rules
 */
export const businessTaxRules = [
  {
    id: 'BUSINESS_STRUCTURE_TAXATION',
    name: 'Business Structure Tax Treatment',
    description: 'Tax implications vary by business structure',
    applicability: {
      entityTypes: ['business'],
      businessTypes: ['sole_proprietor', 'llc', 'partnership', 'corporation'],
    },
    requirements: [
      {
        appliesTo: 'business_income',
        validation:
          'Determine pass-through (1040 Schedule C) vs corporate (Form 1120) taxation',
        errorMessage: 'Incorrect business tax filing method',
      },
    ],
  },
  {
    id: 'SECTION_179_DEDUCTION',
    name: 'Section 179 Expensing Election',
    description:
      'Immediate deduction for qualifying business property purchases up to $1,220,000 (2024)',
    applicability: {
      entityTypes: ['business'],
    },
    requirements: [
      {
        appliesTo: 'fixed_asset_deduction',
        validation:
          'Allow election to immediately deduct qualifying property purchases',
        errorMessage: 'Section 179 election not properly applied',
      },
      {
        appliesTo: 'limitation_phase_out',
        validation: 'Phase out deduction if purchases exceed $4,890,000 (2024)',
        errorMessage: 'Section 179 phase-out incorrectly calculated',
      },
    ],
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
  },
];

/**
 * Canada Tax Regulations Example
 */
export const canadianTaxRules = [
  {
    id: 'T1_GENERAL_FILING',
    name: 'T1 General - Notice of Assessment',
    description:
      'Canadian residents must file T1 General form annually if conditions are met',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'income_reporting',
        validation:
          'Report all worldwide income (employment, self-employment, investment)',
        errorMessage: 'Income not properly reported',
      },
    ],
    references: [
      {
        title: 'CRA Form T1 General',
        url: 'https://www.canada.ca/taxes/individuals/deductions',
      },
    ],
  },
  {
    id: 'CANADIAN_DEDUCTION_RULES',
    name: 'Canadian Personal Amount Deduction 2024',
    description: '$15,705 basic personal amount deduction for 2024 (federal)',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'personal_deduction',
        validation:
          'Deduct basic personal amount (indexed annually) from federal tax calculation',
        errorMessage: 'Basic personal amount not correctly applied',
      },
    ],
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
  },
];

/**
 * UK Tax Regulations Example
 */
export const ukTaxRules = [
  {
    id: 'UK_SELF_ASSESSMENT',
    name: 'UK Self-Assessment Tax Return',
    description: 'Self-employed and certain employees must file SA form',
    applicability: {
      entityTypes: ['individual'],
      businessTypes: ['self_employed'],
    },
    requirements: [
      {
        appliesTo: 'business_income',
        validation:
          'Report business income and claim allowable business expenses',
        errorMessage: 'Business income not properly reported',
      },
    ],
  },
  {
    id: 'UK_TAX_ALLOWANCE',
    name: 'UK Personal Allowance 2024/25',
    description:
      'First £12,570 of income is tax-free for most people born after 5 April 1960',
    applicability: {
      entityTypes: ['individual'],
    },
    requirements: [
      {
        appliesTo: 'personal_allowance',
        validation: 'Apply £12,570 personal allowance to taxable income',
        errorMessage: 'Personal allowance incorrectly calculated',
      },
    ],
  },
];

/**
 * Export all rule sets
 */
export const regulatoryRuleSets = {
  'US:FEDERAL': {
    domain: 'tax',
    rules: usFederalTaxRules,
  },
  'US:CA': {
    domain: 'tax',
    rules: californiaStateTaxRules,
  },
  'US:FEDERAL:BUSINESS': {
    domain: 'tax',
    rules: businessTaxRules,
  },
  'CA:FEDERAL': {
    domain: 'tax',
    rules: canadianTaxRules,
  },
  'GB:HMRC': {
    domain: 'tax',
    rules: ukTaxRules,
  },
};

/**
 * Load regulations into knowledge base
 */
export function loadCompleteRegulatorySet(knowledgeBase) {
  Object.entries(regulatoryRuleSets).forEach(([jurisdiction, { domain, rules }]) => {
    knowledgeBase.loadRegulations(domain, jurisdiction, rules);
  });

  return knowledgeBase;
}

export default {
  usFederalTaxRules,
  californiaStateTaxRules,
  businessTaxRules,
  canadianTaxRules,
  ukTaxRules,
  regulatoryRuleSets,
  loadCompleteRegulatorySet,
};
