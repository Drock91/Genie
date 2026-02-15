/**
 * Compliance & Strategy Report Generator
 * Creates comprehensive summaries of legal, compliance, and marketing considerations
 */

import fs from "fs";
import path from "path";

export class ReportGenerator {
  constructor(logger = null) {
    this.logger = logger;
    this.reportsPath = "./reports";
    this._ensureReportsDir();
  }

  /**
   * Ensure reports directory exists
   */
  _ensureReportsDir() {
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  /**
   * Generate comprehensive compliance and strategy report
   */
  generateComplianceReport(config) {
    const {
      projectName,
      projectType,
      legalAnalysis,
      marketingStrategy,
      requestAnalysis,
      timestamp = new Date()
    } = config;

    try {
      let report = this._generateHeader(projectName, projectType, timestamp);

      // Executive Summary
      report += this._generateExecutiveSummary(legalAnalysis, marketingStrategy, requestAnalysis);

      // Legal & Compliance Section
      if (legalAnalysis) {
        report += this._generateLegalSection(legalAnalysis);
      }

      // Marketing & Go-to-Market Section
      if (marketingStrategy) {
        report += this._generateMarketingSection(marketingStrategy);
      }

      // Risk Assessment
      if (legalAnalysis) {
        report += this._generateRiskAssessment(legalAnalysis, marketingStrategy);
      }

      // Action Items
      report += this._generateActionItems(legalAnalysis, marketingStrategy);

      // Appendix
      report += this._generateAppendix(requestAnalysis);

      return report;
    } catch (err) {
      this.logger?.error({ error: err.message }, "Report generation failed");
      throw err;
    }
  }

  /**
   * Generate and save report to file
   */
  saveReport(config, filename = null) {
    try {
      const report = this.generateComplianceReport(config);
      const fname = filename || `${config.projectName}-report-${Date.now()}.md`;
      const filepath = path.join(this.reportsPath, fname);

      fs.writeFileSync(filepath, report, "utf8");
      this.logger?.info({ filepath }, "Report saved");

      return { filepath, report };
    } catch (err) {
      this.logger?.error({ error: err.message }, "Failed to save report");
      throw err;
    }
  }

  /**
   * Print report to console
   */
  printReport(config) {
    const report = this.generateComplianceReport(config);
    console.log(report);
    return report;
  }

  /**
   * Generate header
   */
  _generateHeader(projectName, projectType, timestamp) {
    return `# COMPLIANCE & STRATEGY REPORT

**Project:** ${projectName}
**Type:** ${projectType}
**Generated:** ${timestamp.toLocaleString()}
**Status:** ${timestamp > new Date(Date.now() - 3600000) ? "CURRENT" : "ARCHIVED"}

---

## Table of Contents
1. Executive Summary
2. Legal & Compliance Requirements
3. Marketing & Go-to-Market Strategy
4. Risk Assessment
5. Action Items & Next Steps
6. Appendix

---
`;
  }

  /**
   * Generate executive summary
   */
  _generateExecutiveSummary(legal, marketing, request) {
    let summary = `## 1. EXECUTIVE SUMMARY

`;

    if (request && request.request_type) {
      summary += `**Request Type:** ${request.request_type}
`;
    }

    if (legal) {
      const concernCount = legal.compliance_concerns?.length || 0;
      const criticalCount = legal.compliance_concerns?.filter(c => c.severity === "critical").length || 0;
      summary += `
### Legal Status
- **Total Concerns:** ${concernCount}
- **Critical Issues:** ${criticalCount}
- **Status:** ${criticalCount > 0 ? "⚠️ REQUIRES ACTION" : "✓ COMPLIANT"}
`;
    }

    if (marketing) {
      summary += `
### Marketing Status
- **Target Market:** ${marketing.target_market}
- **Channels:** ${marketing.primary_channels?.join(", ") || "Not specified"}
- **Launch Timeline:** ${marketing.launch_timeline}
`;
    }

    summary += `
---

`;
    return summary;
  }

  /**
   * Generate legal section
   */
  _generateLegalSection(legal) {
    let section = `## 2. LEGAL & COMPLIANCE REQUIREMENTS

`;

    if (legal.affected_jurisdictions && legal.affected_jurisdictions.length > 0) {
      section += `### Affected Jurisdictions
${legal.affected_jurisdictions.map(j => `- ${j}`).join("\n")}

`;
    }

    if (legal.compliance_concerns && legal.compliance_concerns.length > 0) {
      section += `### Compliance Concerns

`;
      legal.compliance_concerns.forEach((concern, idx) => {
        const emoji = {
          critical: "🔴",
          high: "🟠",
          medium: "🟡",
          low: "🟢"
        }[concern.severity] || "•";

        section += `#### ${emoji} ${concern.title} (${concern.severity.toUpperCase()})

**Description:** ${concern.description}

**Recommendations:**
${concern.recommendations?.map(r => `- ${r}`).join("\n") || "- Consult legal counsel"}

`;
      });
    }

    if (legal.recommended_actions && legal.recommended_actions.length > 0) {
      section += `### Recommended Actions
${legal.recommended_actions.map(a => `- [ ] ${a}`).join("\n")}

`;
    }

    section += `---

`;
    return section;
  }

  /**
   * Generate marketing section
   */
  _generateMarketingSection(marketing) {
    let section = `## 3. MARKETING & GO-TO-MARKET STRATEGY

`;

    section += `### Target Market
${marketing.target_market}

### Value Proposition
${marketing.value_proposition}

`;

    if (marketing.key_messaging) {
      section += `### Key Messaging
${marketing.key_messaging}

`;
    }

    if (marketing.primary_channels && marketing.primary_channels.length > 0) {
      section += `### Primary Marketing Channels
${marketing.primary_channels.map(c => `- ${c}`).join("\n")}

`;
    }

    if (marketing.secondary_channels && marketing.secondary_channels.length > 0) {
      section += `### Secondary Marketing Channels
${marketing.secondary_channels.map(c => `- ${c}`).join("\n")}

`;
    }

    section += `### Launch Timeline
${marketing.launch_timeline}

`;

    if (marketing.competitive_advantages && marketing.competitive_advantages.length > 0) {
      section += `### Competitive Advantages
${marketing.competitive_advantages.map(a => `- ${a}`).join("\n")}

`;
    }

    section += `---

`;
    return section;
  }

  /**
   * Generate risk assessment
   */
  _generateRiskAssessment(legal, marketing) {
    let section = `## 4. RISK ASSESSMENT

### Legal/Compliance Risks
`;

    if (legal && legal.compliance_concerns) {
      const criticalRisks = legal.compliance_concerns.filter(c => c.severity === "critical");
      const highRisks = legal.compliance_concerns.filter(c => c.severity === "high");

      if (criticalRisks.length > 0) {
        section += `
**Critical Risks (Must Address):**
${criticalRisks.map(r => `- ${r.title}`).join("\n")}
`;
      }

      if (highRisks.length > 0) {
        section += `
**High Risks (Strongly Recommended):**
${highRisks.map(r => `- ${r.title}`).join("\n")}
`;
      }
    }

    if (marketing && marketing.market_risks && marketing.market_risks.length > 0) {
      section += `

### Market Risks
${marketing.market_risks.map(r => `- ${r}`).join("\n")}
`;
    }

    section += `

---

`;
    return section;
  }

  /**
   * Generate action items
   */
  _generateActionItems(legal, marketing) {
    let section = `## 5. ACTION ITEMS & NEXT STEPS

### Immediate (Must Do Before Launch)
`;

    let immediateItems = [];

    if (legal) {
      const critical = legal.compliance_concerns?.filter(c => c.severity === "critical") || [];
      if (critical.length > 0) {
        immediateItems.push(...critical.map((c, i) => `- [ ] Address critical legal issue: ${c.title}`));
      }
    }

    if (marketing) {
      if (marketing.launch_timeline && marketing.launch_timeline.includes("week")) {
        immediateItems.push("- [ ] Finalize marketing messaging");
        immediateItems.push("- [ ] Set up primary marketing channels");
      }
    }

    section += immediateItems.length > 0
      ? immediateItems.join("\n")
      : "- [ ] No immediate critical items (review legal & marketing sections)";

    section += `

### Short-term (First 30 Days Post-Launch)
- [ ] Monitor legal compliance
- [ ] Track marketing metrics and ROI
- [ ] Respond to customer feedback
- [ ] Adjust strategy based on early data

### Long-term (Ongoing)
- [ ] Quarterly legal compliance audit
- [ ] Monthly marketing performance review
- [ ] Annual strategy review

---

`;
    return section;
  }

  /**
   * Generate appendix
   */
  _generateAppendix(request) {
    let appendix = `## 6. APPENDIX

### Request Classification
`;

    if (request) {
      appendix += `- **Type:** ${request.request_type}
- **Priority:** ${request.priority_level}
- **Reasoning:** ${request.reasoning}
`;
    }

    appendix += `

### Report Metadata
- **Generated:** ${new Date().toISOString()}
- **System:** Genie Multi-LLM AI System
- **Version:** 1.0

### Disclaimer
This report is generated by AI and should be reviewed by qualified legal, marketing, and business professionals before acting on recommendations. Always consult with appropriate specialists for critical decisions.

---

*End of Report*
`;

    return appendix;
  }

  /**
   * Generate summary for console output
   */
  generateSummary(config) {
    const { projectName, legalAnalysis, marketingStrategy } = config;

    let summary = `
╔════════════════════════════════════════════════╗
║  COMPLIANCE & STRATEGY SUMMARY                 ║
║  ${projectName.padEnd(41)}║
╚════════════════════════════════════════════════╝

`;

    // Legal summary
    if (legalAnalysis) {
      const concerns = legalAnalysis.compliance_concerns || [];
      const critical = concerns.filter(c => c.severity === "critical").length;
      const high = concerns.filter(c => c.severity === "high").length;

      summary += `📋 LEGAL & COMPLIANCE
   Total Issues: ${concerns.length}
   • Critical: ${critical} ⚠️
   • High: ${high}
   Status: ${critical > 0 ? "ACTION REQUIRED 🔴" : "COMPLIANT ✅"}

`;
    }

    // Marketing summary
    if (marketingStrategy) {
      summary += `📢 MARKETING STRATEGY
   Target Market: ${marketingStrategy.target_market}
   Channels: ${marketingStrategy.primary_channels?.join(", ") || "TBD"}
   Timeline: ${marketingStrategy.launch_timeline}

`;
    }

    summary += `💡 For full details, see generated report.

`;

    return summary;
  }
}

export default ReportGenerator;
