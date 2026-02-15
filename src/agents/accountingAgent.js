/**
 * Accounting Agent
 * Handles financial management, budgeting, expense tracking, revenue analysis, invoicing
 */

export class AccountingAgent {
  constructor(logger = null, multiLlmSystem = null) {
    this.logger = logger;
    this.multiLlmSystem = multiLlmSystem;
    this.name = "Accounting Department";
    this.profile = "accurate"; // financial data requires precision
    this.temperature = 0.05; // very low for consistency in numbers
  }

  /**
   * Call multi-LLM with accounting profile
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
        department: "accounting"
      }
    });
  }

  /**
   * Create financial budget for project
   */
  async createBudget(projectDetails) {
    const prompt = `You are a certified financial accountant. Create a comprehensive budget for:
${projectDetails}

Return a structured financial breakdown including:
- Fixed costs (licenses, infrastructure, tools)
- Variable costs (per-user, per-transaction)
- Personnel costs estimate
- Contingency (20% buffer)
- Total first-year cost
- ROI projection (if applicable)
- Break-even analysis

Format as JSON with clear categories and line items.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "budget_creation" }, "Budget created");
    return result;
  }

  /**
   * Analyze expenses and generate cost optimization
   */
  async analyzeExpenses(transactions) {
    const prompt = `As a financial analyst, review these business expenses and provide cost optimization strategies:

Transactions: ${JSON.stringify(transactions)}

Provide:
1. Current spending by category
2. Outliers and anomalies
3. Recommendations for cost reduction (top 5)
4. Potential savings amount ($)
5. Risk analysis for proposed cuts
6. 12-month financial projection

Return as structured JSON.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "expense_analysis" }, "Expense analysis complete");
    return result;
  }

  /**
   * Generate income statement
   */
  async generateIncomeStatement(financialData) {
    const prompt = `As a CPA, prepare a professional income statement from:

Financial Period: ${financialData.period}
Revenue: ${financialData.revenue}
Expenses: ${financialData.expenses}
Other Income: ${financialData.otherIncome || 0}

Generate a standard income statement format including:
- Revenue
- Cost of Goods Sold (COGS)
- Gross Profit
- Operating Expenses
- Operating Income
- Other Income/Expenses
- Income Before Tax
- Tax Estimate (use appropriate rate)
- Net Income

Include year-over-year comparison if available.
Return as JSON with clear formatting.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "income_statement" }, "Income statement generated");
    return result;
  }

  /**
   * Create invoice
   */
  async generateInvoice(invoiceDetails) {
    const prompt = `Generate a professional business invoice with these details:

${JSON.stringify(invoiceDetails, null, 2)}

Required fields:
- Invoice number
- Date
- Due date (net 30)
- Client information
- Line items with description, qty, unit price, total
- Subtotal, tax (calculate 8%), total
- Payment terms
- Bank details for payment

Return as formatted text and JSON.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "invoice_generation" }, "Invoice generated");
    return result;
  }

  /**
   * Cash flow projection
   */
  async projectCashFlow(monthlyData) {
    const prompt = `As a financial planner, create a 12-month cash flow projection:

Historical/Projected Monthly Data: ${JSON.stringify(monthlyData)}

Include:
- Beginning cash balance
- Operating cash flows
- Investing cash flows
- Financing cash flows
- Ending cash balance each month
- Cumulative cash position
- Identify months with cash shortfalls
- Recommendations for cash management

Return as JSON with month-by-month detail.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "cash_flow_projection" }, "Cash flow projected");
    return result;
  }

  /**
   * Financial compliance review
   */
  async reviewFinancialCompliance(transactions, regulations) {
    const prompt = `Review these business transactions for financial compliance:

Transactions: ${JSON.stringify(transactions)}
Applicable Regulations: ${regulations}

Analyze:
1. Tax implications by jurisdiction
2. Audit risk assessment
3. Record-keeping requirements
4. Compliance violations (if any)
5. Recommendations for compliance
6. Documentation requirements

Return as JSON with severity levels for any issues.`;

    const result = await this.consensusCall(prompt);
    this.logger?.info({ department: "accounting", action: "compliance_review" }, "Compliance review complete");
    return result;
  }
}

export default AccountingAgent;
