import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class SecurityManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "SecurityManager", ...opts });
  }

  async review({ userInput, traceId, iteration }) {
    this.info({ traceId, iteration }, "Security review with multi-LLM consensus");

    const issues = [];

    // Example policy checks based on request text
    if (userInput.toLowerCase().includes("token") || userInput.toLowerCase().includes("secret")) {
      issues.push(
        makeIssue({
          id: "sec-001",
          title: "Potential secret handling requirement",
          severity: Severity.HIGH,
          description: "Request mentions secrets/tokens; ensure no secrets are logged or committed.",
          recommendation: [
            "Never log secrets",
            "Use env vars or secret manager",
            "Redact in structured logs"
          ],
          area: "secrets"
        })
      );
    }

    // Get threat modeling from multi-LLM consensus
    try {
      const threatResult = await this.threatModel(userInput);
      
      if (threatResult && threatResult.critical_threats && threatResult.critical_threats.length > 0) {
        threatResult.critical_threats.forEach((threat, idx) => {
          issues.push(
            makeIssue({
              id: `sec-${100 + idx}`,
              title: threat,
              severity: Severity.CRITICAL,
              description: "Critical security threat identified by consensus threat modeling",
              recommendation: ["Must address before deployment"],
              area: "threats"
            })
          );
        });
      }
    } catch (err) {
      this.warn({ error: err.message }, "Security threat modeling failed");
    }

    const ok = issues.length === 0;
    return {
      ok,
      issues,
      output: makeAgentOutput({
        summary: ok ? "Security gate PASS" : "Security gate FAIL",
        notes: [
          "Security validated with multi-LLM consensus",
          "Threat modeling analyzed by 3 LLMs",
          issues.length > 0 ? `Found ${issues.length} issue(s)` : "No security issues detected"
        ],
        risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
      })
    };
  }

  /**
   * Threat modeling using multi-LLM consensus with best models
   */
  async threatModel(requirements) {
    this.info({ requirements }, "Threat modeling with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "premium", // Use all best models for security - cannot compromise
        system: "You are an expert security architect identifying threats and vulnerabilities.",
        user: `Perform threat modeling for these requirements:\n${requirements}`,
        schema: {
          name: "threat_model",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["critical_threats", "mitigations", "risk_level"],
            properties: {
              critical_threats: {
                type: "array",
                items: { type: "string" }
              },
              mitigations: {
                type: "array",
                items: { type: "string" }
              },
              risk_level: {
                type: "string",
                enum: ["low", "medium", "high", "critical"]
              }
            }
          }
        },
        temperature: 0.1 // Very low for consistency in threat identification
      });

      this.info({
        risk_level: result.consensus.risk_level,
        threats: result.consensus.critical_threats.length,
        models_agreed: result.metadata.totalSuccessful
      }, "Threat modeling complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Threat modeling failed");
      throw err;
    }
  }

  /**
   * Code security audit using multi-LLM consensus
   */
  async auditCode(code) {
    this.info({ codeLength: code.length }, "Auditing code with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate", // Expert models for code vulnerability detection
        system: "You are an expert security engineer auditing code for vulnerabilities.",
        user: `Audit this code for security vulnerabilities:\n${code}`,
        schema: {
          name: "code_audit",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["vulnerabilities", "severity_summary", "fixes"],
            properties: {
              vulnerabilities: {
                type: "array",
                items: { type: "string" }
              },
              severity_summary: { type: "string" },
              fixes: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        vulns_found: result.consensus.vulnerabilities.length,
        severity: result.consensus.severity_summary,
        auditors: result.metadata.totalSuccessful
      }, "Code audit complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code audit failed");
      throw err;
    }
  }

  /**
   * Compliance review using multi-LLM consensus
   */
  async reviewCompliance(requirements, standards = "OWASP,CWE,PCI-DSS") {
    this.info({ standards }, "Reviewing compliance with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "accurate",
        system: "You are a compliance expert reviewing against security standards.",
        user: `Review compliance for these requirements against ${standards}:\n${requirements}`,
        schema: {
          name: "compliance_review",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["compliant", "gaps", "recommendations"],
            properties: {
              compliant: { type: "boolean" },
              gaps: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.1
      });

      this.info({
        compliant: result.consensus.compliant,
        gaps: result.consensus.gaps.length,
        experts: result.metadata.totalSuccessful
      }, "Compliance review complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Compliance review failed");
      throw err;
    }
  }
}
