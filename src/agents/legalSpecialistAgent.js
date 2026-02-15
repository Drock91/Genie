/**
 * Legal Specialist Agent
 * Identifies legal, compliance, and regulatory requirements
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class LegalSpecialistAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "LegalSpecialist", ...opts });
  }

  async review({ userInput, projectType, traceId, iteration }) {
    this.info({ traceId, iteration, projectType }, "Legal and compliance review");

    const issues = [];
    const legalItems = [];

    try {
      // Analyze for legal implications
      const legalAnalysis = await this.analyzeLegalImplications(userInput, projectType);

      if (legalAnalysis && legalAnalysis.compliance_concerns.length > 0) {
        legalAnalysis.compliance_concerns.forEach((concern, idx) => {
          const severity = this._mapSeverity(concern.severity);
          issues.push(
            makeIssue({
              id: `legal-${100 + idx}`,
              title: concern.title,
              severity,
              description: concern.description,
              recommendation: concern.recommendations || ["Consult legal counsel"],
              area: "legal"
            })
          );
          legalItems.push(concern);
        });
      }

      // Identify required disclosures
      const disclosures = await this.identifyRequiredDisclosures(userInput, projectType);
      if (disclosures && disclosures.required_disclosures.length > 0) {
        legalItems.push({
          type: "disclosures",
          items: disclosures.required_disclosures
        });
      }

      // Check data privacy requirements
      if (this._needsPrivacyAnalysis(userInput)) {
        const privacyAnalysis = await this.analyzeDataPrivacy(userInput);
        if (privacyAnalysis && privacyAnalysis.privacy_requirements.length > 0) {
          legalItems.push({
            type: "privacy",
            items: privacyAnalysis.privacy_requirements
          });
        }
      }

    } catch (err) {
      this.warn({ error: err.message }, "Legal analysis failed");
      issues.push(
        makeIssue({
          id: "legal-check-failed",
          title: "Legal review incomplete",
          severity: Severity.MEDIUM,
          description: "Automatic legal analysis encountered an issue",
          recommendation: ["Manual legal review recommended"],
          area: "legal"
        })
      );
    }

    const ok = issues.filter(i => i.severity === Severity.CRITICAL).length === 0;

    return {
      ok,
      issues,
      legalItems,
      output: makeAgentOutput({
        summary: ok ? "Legal review: No critical issues" : "Legal review: Action required",
        notes: [
          `Legal concerns identified: ${issues.length}`,
          `Compliance items: ${legalItems.length}`,
          issues.length > 0 ? "⚠️ Review legal recommendations carefully" : "✓ Legal clearance approved"
        ],
        risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
      })
    };
  }

  /**
   * Analyze legal implications using multi-LLM consensus
   */
  async analyzeLegalImplications(requirements, projectType = "general") {
    this.info({ projectType }, "Analyzing legal implications with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate", // Use best models for legal analysis
        system: "You are an expert legal advisor identifying compliance, regulatory, and legal concerns.",
        user: `Analyze legal implications for a ${projectType} project with these requirements:\n${requirements}`,
        schema: {
          name: "legal_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["compliance_concerns", "affected_jurisdictions", "recommended_actions"],
            properties: {
              compliance_concerns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    recommendations: { type: "array", items: { type: "string" } }
                  }
                }
              },
              affected_jurisdictions: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } }
            }
          }
        },
        temperature: 0.1 // Very low - consistency critical for legal matters
      });

      this.info({
        concerns: result.consensus.compliance_concerns.length,
        jurisdictions: result.consensus.affected_jurisdictions.length,
        lawyers: result.metadata.totalSuccessful
      }, "Legal analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Legal implications analysis failed");
      throw err;
    }
  }

  /**
   * Identify required disclosures
   */
  async identifyRequiredDisclosures(requirements, projectType = "general") {
    this.info({ projectType }, "Identifying required disclosures");

    try {
      const result = await consensusCall({
        profile: "accurate",
        system: "You are a legal expert identifying required disclosures and policies.",
        user: `Identify required disclosures and policies for a ${projectType} project:\n${requirements}`,
        schema: {
          name: "disclosures",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["required_disclosures", "policies_needed"],
            properties: {
              required_disclosures: {
                type: "array",
                items: { type: "string" }
              },
              policies_needed: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Disclosure identification failed");
      throw err;
    }
  }

  /**
   * Analyze data privacy requirements
   */
  async analyzeDataPrivacy(requirements) {
    this.info({}, "Analyzing data privacy requirements");

    try {
      const result = await consensusCall({
        profile: "accurate",
        system: "You are a data privacy expert (GDPR, CCPA, etc) reviewing data handling requirements.",
        user: `Analyze data privacy requirements for:\n${requirements}`,
        schema: {
          name: "privacy_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["privacy_requirements", "data_types", "regulations_applicable"],
            properties: {
              privacy_requirements: {
                type: "array",
                items: { type: "string" }
              },
              data_types: {
                type: "array",
                items: { type: "string" }
              },
              regulations_applicable: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1
      });

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Privacy analysis failed");
      throw err;
    }
  }

  /**
   * Check if privacy analysis is needed
   */
  _needsPrivacyAnalysis(input) {
    const privacyKeywords = [
      "data", "user", "customer", "personal", "information",
      "database", "collect", "store", "privacy", "account",
      "authentication", "identity", "profile"
    ];
    return privacyKeywords.some(keyword => input.toLowerCase().includes(keyword));
  }

  /**
   * Map severity to our severity enum
   */
  _mapSeverity(severityStr) {
    const { Severity } = require("../models.js");
    const map = {
      "critical": Severity.CRITICAL,
      "high": Severity.HIGH,
      "medium": Severity.MEDIUM,
      "low": Severity.LOW
    };
    return map[severityStr] || Severity.MEDIUM;
  }
}

export default LegalSpecialistAgent;
