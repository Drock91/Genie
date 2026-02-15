/**
 * Payroll Agent
 * Handles payroll processing, service cost tracking, payment calculations, compensation analysis
 */

export class PayrollAgent {
  constructor(logger = null, multiLlmSystem = null) {
    this.logger = logger;
    this.multiLlmSystem = multiLlmSystem;
    this.name = "Payroll Department";
    this.profile = "accurate"; // payroll requires high precision
    this.temperature = 0.05; // very low for calculation accuracy
  }

  /**
   * Call multi-LLM with payroll profile
   */
  async consensusCall(prompt) {
    if (!this.multiLlmSystem) {
      throw new Error("MultiLlmSystem not available");
    }

    return await this.multiLlmSystem.consensusCall({
      prompt,
      profile: this.profile,
      temperature: this.temperature,
      metadata: {
        department: "payroll"
      }
    });
  }

  /**
   * Calculate payroll for employees
   */
  async calculatePayroll(employees, payPeriod) {
    const prompt = `As a certified payroll manager, calculate payroll for the following pay period:

Pay Period: ${payPeriod}
Employees: ${JSON.stringify(employees, null, 2)}

For each employee, calculate:
- Gross pay (hourly rate × hours OR salary prorated)
- Federal withholding (use 2024 tax tables)
- Social Security (6.2%)
- Medicare (1.45%)
- State income tax (use employee's state, estimate 5% average)
- Any additional deductions listed
- Net pay
- Employer contributions (6.2% SS, 1.45% Medicare, 0.6% FUTA)

Generate:
1. Individual pay stubs (JSON)
2. Payroll summary
3. Total employer liability
4. Payment schedule/due dates

Return as structured JSON.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "payroll_calculation", period: payPeriod }, "Payroll calculated");
    return result;
  }

  /**
   * Track service vendor payments
   */
  async trackServiceExpenses(vendors) {
    const prompt = `Track and analyze service vendor expenses:

Vendors & Services: ${JSON.stringify(vendors, null, 2)}

For each vendor, provide:
- Service provided
- Contract terms (monthly, per-use, etc)
- Current spend
- Year-to-date total
- Utilization metrics (if applicable)
- Cost per unit or cost efficiency
- Renewal dates
- Escalation clauses

Aggregate:
- Total monthly service costs
- Top 5 most expensive services
- Services due for renewal in next 90 days
- Cost trend analysis
- Recommendations for optimization

Return as JSON with vendor-by-vendor detail.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "service_tracking" }, "Service expenses tracked");
    return result;
  }

  /**
   * Generate W2 forms
   */
  async generateW2Forms(employeeData, taxYear) {
    const prompt = `Generate W2 forms for tax filing:

Tax Year: ${taxYear}
Employee Data: ${JSON.stringify(employeeData, null, 2)}

For each employee, calculate:
- Box 1: Wages, tips, other compensation (gross)
- Box 2: Federal income tax withheld
- Boxes 3-4: Social Security wages and tax
- Boxes 5-6: Medicare wages and tax
- Box 12: Other compensation codes
- Local/State wages if applicable

Validate:
- Totals match payroll records
- Tax withholdings are accurate
- All required fields present

Return as JSON per employee with all IRS boxes.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "w2_generation", year: taxYear }, "W2 forms generated");
    return result;
  }

  /**
   * Compensation analysis and recommendations
   */
  async analyzeCompensation(employees, marketData) {
    const prompt = `Analyze employee compensation against market rates:

Employees: ${JSON.stringify(employees, null, 2)}
Market Data: ${JSON.stringify(marketData, null, 2)}

Provide:
1. Market salary analysis per role
2. Employees below market (red flag)
3. Employees above market (overpaid check)
4. Recommended compensation adjustments
5. Equity analysis (if applicable)
6. Retention risk assessment
7. 12-month comp budget impact of adjustments

Include:
- Salary comparison percentiles (25th, 50th, 75th)
- Cost of living adjustments by location
- Industry benchmarks
- Recommendations for raises/adjustments

Return as structured JSON with individual employee analysis.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "compensation_analysis" }, "Compensation analysis complete");
    return result;
  }

  /**
   * Benefits cost analysis
   */
  async analyzeBenefits(employees, benefits) {
    const prompt = `Analyze company benefits costs and usage:

Employees: ${employees}
Current Benefits: ${JSON.stringify(benefits, null, 2)}

Calculate:
- Employee benefits cost per employee per month
- Employer contribution amount
- Total benefits as % of payroll
- Utilization rates
- Cost per claim (health insurance)
- Premium trends

Analyze:
- Are benefits competitive for industry?
- ROI on each benefit type
- Redundancies or gaps
- Cost optimization opportunities
- Industry benchmarks for comparison

Recommendations:
- Potential changes to benefit mix
- Cost reduction strategies (without hurting retention)
- New benefits to consider
- Communication strategy for changes

Return as JSON with detailed analysis and recommendations.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "benefits_analysis" }, "Benefits analyzed");
    return result;
  }

  /**
   * Tax filing requirements and calendar
   */
  async generateTaxCalendar(companyState, employees) {
    const prompt = `Generate comprehensive tax filing calendar:

Company State: ${companyState}
Number of Employees: ${employees}

Provide:
1. Federal tax deadlines
   - Payroll tax deposits (quarterly)
   - Form 941-X corrections
   - Annual reconciliation
   
2. State tax deadlines
   - State income tax deposits
   - Unemployment insurance (SUTA)
   - Quarterly tax returns

3. Local tax deadlines (if applicable)
   - City/county returns

4. Year-end requirements
   - Form 940 (FUTA)
   - State unemployment returns
   - W2 generation and filing
   - 1099 tracking
   - Year-end reconciliation

5. Payroll debit item approval codes

Format as calendar with:
- Due dates
- Required forms
- Penalties for late payment
- Extension options where available
- Safe harbor dates

Return as JSON timeline.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "tax_calendar_generation" }, "Tax calendar generated");
    return result;
  }

  /**
   * Contractor payment and 1099 tracking
   */
  async trackContractors(contractors) {
    const prompt = `Track contractor payments and 1099 requirements:

Contractors: ${JSON.stringify(contractors, null, 2)}

For each contractor, track:
- Service provided
- Payment terms (hourly, fixed, milestone)
- Year-to-date payments
- Payment dates and amounts
- 1099 threshold status ($600+)
- Tax ID verification status
- Contract end dates

Aggregate:
- Total contractor spend YTD
- Contractors requiring 1099-NEC
- 1099 filing requirements and deadlines
- Payment due schedule for current contracts
- Risk assessment (misclassification audit risk)

Generate:
- 1099-NEC forms for those over threshold
- Contractor payment reconciliation
- Budget tracking vs approved vendor agreements

Return as JSON with compliance flags.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "payroll", action: "contractor_tracking" }, "Contractors tracked");
    return result;
  }
}

export default PayrollAgent;
