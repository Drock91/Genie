import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import path from "path";

export class WriterAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Writer", ...opts });
  }

  async build({ plan, traceId, iteration, userInput = "", researchOnly = false, suppressPatches = false }) {
    this.info({ traceId, iteration, researchOnly }, "Producing textual response with multi-LLM consensus");

    try {
      // In research mode, we DO want to create files (to reports folder)
      // Only suppress patches if explicitly requested via suppressPatches
      const shouldSuppressPatches = Boolean(suppressPatches);
      
      // For research mode, generate a timestamped report filename
      let outputPath;
      if (researchOnly) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        outputPath = `research-report-${timestamp}.md`;
      } else {
        outputPath = this._resolveOutputPath(plan, userInput);
      }
      
      const explicitContent = this._extractExplicitContent(userInput);

      if (outputPath && explicitContent) {
        this.info({ outputPath }, "Using explicit content for file output");
        return makeAgentOutput({
          summary: `Created ${outputPath}`,
          patches: shouldSuppressPatches
            ? []
            : [
                {
                  diff: `*** Add File: ${outputPath}\n${explicitContent}`,
                  file: outputPath
                }
              ],
          notes: [explicitContent]
        });
      }

      const writerItems = plan.workItems?.filter(w => w.owner === "writer") || [];
      const docTargets = this._getDocTargets(writerItems);
      if (docTargets.length > 0) {
        const patches = [];
        const notes = [];

        for (const target of docTargets) {
          const content = await this._generateDocContent({
            userInput,
            taskDesc: target.taskDesc,
            filePath: target.path
          });

          patches.push({
            diff: `*** Add File: ${target.path}\n${content}`,
            file: target.path
          });
          notes.push(`Generated ${target.path}`);
        }

        return makeAgentOutput({
          summary: `Created ${docTargets.length} documentation file(s)`,
          patches: shouldSuppressPatches ? [] : patches,
          notes
        });
      }

      // Find the writer work item to get specific instructions
      const writerWork = plan.workItems?.find(w => w.owner === 'writer');
      const taskDesc = writerWork ? writerWork.task : plan.goal;
      
      // For text files (.txt, .md), generate plain text without schema
      if (outputPath && (outputPath.endsWith('.txt') || outputPath.endsWith('.md'))) {
        const result = await consensusCall({
          profile: "balanced",
          consensusLevel: plan.consensusLevel || "single",
          system: "You are an expert writer. Generate clear, informative text content in plain text format.",
          user: `${taskDesc}\n\nOutput plain text only (not JSON). Write the actual content.`,
          temperature: 0.3
        });

        // Extract text content
        const content = typeof result.consensus === 'string' ? result.consensus : 
                       result.consensus?.final || result.consensus?.content || 
                       JSON.stringify(result.consensus, null, 2);

        this.info({ outputPath, contentLength: content.length }, "Generated plain text file");

        return makeAgentOutput({
          summary: `Created ${outputPath}`,
          patches: shouldSuppressPatches
            ? []
            : [
                {
                  diff: `*** Add File: ${outputPath}\n${content}`,
                  file: outputPath
                }
              ],
          notes: [content.substring(0, 100) + '...']
        });
      }

      // For other outputs, use structured schema
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel: plan.consensusLevel || "single",
        system: "You are an expert writer producing clear, concise, professional responses.",
        user: `Generate response for user request: ${taskDesc}`,
        schema: {
          name: "writer_output",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "final"],
            properties: {
              summary: { type: "string" },
              final: { type: "string" }
            }
          }
        },
        temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.3")
      });

      // Handle case where consensus might be undefined or malformed
      if (!result || !result.consensus) {
        this.error({ result: JSON.stringify(result, null, 2) }, "Invalid consensus result structure");
        throw new Error("Consensus result missing or invalid");
      }

      // Log what we got back to debug schema issues
      this.info({ 
        consensusKeys: Object.keys(result.consensus),
        hasSummary: !!result.consensus.summary,
        hasFinal: !!result.consensus.final
      }, "Consensus structure received");

      // Extract values with fallbacks
      const summary = result.consensus.summary || plan.goal || "Output generated";
      const final = result.consensus.final || JSON.stringify(result.consensus, null, 2);

      this.info({
        summary_length: summary?.length || 0,
        final_length: final?.length || 0,
        writers: result.metadata?.totalSuccessful || 0
      }, "Writing completed");
      const patches = [];

      if (!shouldSuppressPatches && outputPath && final) {
        patches.push({
          diff: `*** Add File: ${outputPath}\n${final}`,
          file: outputPath
        });
      }

      return makeAgentOutput({
        summary,
        patches,
        notes: [final]
      });
    } catch (err) {
      this.error({ error: err.message, stack: err.stack }, "Writing with consensus failed");
      throw err;
    }
  }

  _extractExplicitContent(userInput) {
    const quotedMatch = userInput.match(/contents?:\s*(["'])([\s\S]*?)\1\s*$/i);
    if (quotedMatch && quotedMatch[2]) {
      return quotedMatch[2].trim();
    }

    const match = userInput.match(/contents?:\s*([\s\S]+)$/i);
    return match && match[1] ? match[1].trim() : null;
  }

  _resolveOutputPath(plan, userInput) {
    // First check if work item specifies a file
    const workItemFile = plan.workItems?.find(w => w.file)?.file;
    if (workItemFile) {
      return workItemFile.replace(/^\.\/?output\//i, "");
    }

    // Look for filename pattern like "whale.txt" or "facts.txt"
    const fileMatch = userInput.match(/([\w\-]+\.txt)\b/i) || 
                      userInput.match(/named\s+['"]?([^\s'"]+\.(?:txt|md|json|csv|log))['"]?/i);
    
    // Look for output folder
    const outputMatch = userInput.match(/output\/([\w\-\/]+)/i);

    if (!fileMatch) {
      return null; // No file to create
    }

    const filename = fileMatch[1];
    
    // If we have output folder, file goes there (executor handles the full path)
    // Just return the filename since executor.workspaceDir is already set to output/ProjectName
    if (outputMatch && outputMatch[1]) {
      return filename;
    }

    return filename;
  }

  _getDocTargets(writerItems) {
    const targets = [];
    const seen = new Set();

    for (const item of writerItems) {
      const task = item.task || "";
      const fileMatch = task.match(/([\w./-]+\.(?:md|txt|json|csv|log))/i);
      const rawFile = fileMatch ? fileMatch[1] : item.file;
      if (!rawFile) continue;

      const path = this._normalizeDocPath(rawFile);
      if (seen.has(path)) continue;

      seen.add(path);
      targets.push({
        path,
        taskDesc: task || `Create ${path}`
      });
    }

    return targets;
  }

  _normalizeDocPath(rawFile) {
    const normalized = rawFile.replace(/^\.?\/?output\//i, "").replace(/^\//, "");
    if (normalized.includes("/")) {
      return normalized;
    }

    if (normalized.toLowerCase().endsWith(".md")) {
      return `docs/${normalized}`;
    }

    return normalized;
  }

  async _generateDocContent({ userInput, taskDesc, filePath }) {
    try {
      const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
      const fileName = path.basename(normalizedPath);

      if (fileName === "ui_checklist.md") {
        return this._buildUiChecklist(userInput);
      }

      if (fileName === "style_guide.md") {
        return this._buildStyleGuide(userInput);
      }

      if (fileName === "enterprise_checklist.md") {
        return this._buildEnterpriseChecklist(userInput);
      }

      const result = await consensusCall({
        profile: "balanced",
        consensusLevel: plan.consensusLevel || "single",
        system: "You are an expert technical writer. Produce clear, professional documentation in markdown.",
        user: `Project request:\n${userInput}\n\nDocument to write: ${filePath}\nTask: ${taskDesc}\n\nWrite the complete content for this file in markdown.`,
        temperature: 0.2
      });

      const content = typeof result.consensus === "string"
        ? result.consensus
        : result.consensus?.final || result.consensus?.content || JSON.stringify(result.consensus, null, 2);

      return content;
    } catch (err) {
      const title = path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ");
      const lines = [
        `# ${title}`,
        "",
        "## Overview",
        taskDesc || "Documentation for this project component.",
        "",
        "## Project Request",
        userInput,
        "",
        "## Setup",
        "- Copy .env.example to .env",
        "- Install dependencies",
        "- Run database migrations",
        "",
        "## Notes",
        "- This file was generated as a fallback due to documentation generation errors."
      ];

      return lines.join("\n");
    }
  }

  _buildUiChecklist(userInput) {
    return [
      "# UI Checklist",
      "",
      "## Scope",
      `Project request: ${userInput || "(not provided)"}`,
      "",
      "## Layout and Structure",
      "- [ ] Clear page hierarchy (header, main, footer)",
      "- [ ] Primary and secondary actions are visually distinct",
      "- [ ] Layout grid is consistent across sections",
      "- [ ] Content density is balanced (no cramped blocks)",
      "",
      "## Navigation and Flow",
      "- [ ] Navigation is obvious on desktop and mobile",
      "- [ ] Primary flow can be completed without dead ends",
      "- [ ] Forms have labels, hints, and error states",
      "",
      "## Visual Design",
      "- [ ] Typography scale is consistent (base, heading, display)",
      "- [ ] Color palette has accessible contrast",
      "- [ ] Icons and imagery match the brand tone",
      "",
      "## Responsiveness",
      "- [ ] Works from 320px to 1440px widths",
      "- [ ] Mobile layout keeps key actions above the fold",
      "- [ ] Touch targets are at least 44px",
      "",
      "## Accessibility",
      "- [ ] Semantic HTML landmarks are present",
      "- [ ] Focus states are visible",
      "- [ ] Images have meaningful alt text",
      "- [ ] Color is not the only indicator of state",
      "",
      "## Animations",
      "- [ ] Page-load reveal animation is subtle and consistent",
      "- [ ] Interactive elements have motion feedback",
      "- [ ] Animations respect prefers-reduced-motion",
      "",
      "## Content Quality",
      "- [ ] Headlines are specific and action-oriented",
      "- [ ] Empty states are informative and helpful",
      "- [ ] No placeholder text or TODOs remain",
      "",
      "## QA Sign-off",
      "- [ ] Visual parity between design intent and implementation",
      "- [ ] No obvious layout shifts or overflow issues",
      "- [ ] Core flows verified in latest browser versions"
    ].join("\n");
  }

  _buildStyleGuide(userInput) {
    return [
      "# Style Guide",
      "",
      "## Brand Intent",
      `Project request: ${userInput || "(not provided)"}`,
      "",
      "## Typography",
      "- Primary font: Display or editorial serif for headings",
      "- Secondary font: Clean sans for body text",
      "- Scale: 12 / 14 / 16 / 20 / 28 / 36 / 48",
      "- Line height: 1.4 for body, 1.1 for headings",
      "",
      "## Color System",
      "- Base: warm off-white and deep charcoal",
      "- Accent: one saturated highlight color for CTAs",
      "- Status: success, warning, error with WCAG contrast",
      "",
      "## Spacing",
      "- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64",
      "- Section padding: 64px desktop, 32px mobile",
      "",
      "## Components",
      "- Buttons: primary, secondary, ghost with hover/focus states",
      "- Cards: elevated with subtle shadow and border",
      "- Inputs: clear focus ring and inline validation",
      "",
      "## Imagery",
      "- Use high-contrast, real-world imagery",
      "- Avoid generic stock visuals",
      "",
      "## Motion",
      "- Ease: cubic-bezier(0.2, 0.8, 0.2, 1)",
      "- Duration: 180-320ms for UI interactions",
      "- Staggered reveal for section content",
      "",
      "## Accessibility",
      "- Minimum contrast ratio 4.5:1",
      "- Visible focus styles on all interactive elements",
      "- Respect prefers-reduced-motion"
    ].join("\n");
  }

  _buildEnterpriseChecklist(userInput) {
    return [
      "# Enterprise Readiness Checklist",
      "",
      "## Scope",
      `Project request: ${userInput || "(not provided)"}`,
      "",
      "## Security",
      "- [ ] Authentication and authorization defined",
      "- [ ] Secrets managed via env vars and vaults",
      "- [ ] Input validation and rate limiting in place",
      "- [ ] OWASP Top 10 risks reviewed",
      "",
      "## Compliance and Privacy",
      "- [ ] Data classification and retention defined",
      "- [ ] PII handling documented",
      "- [ ] Audit logging enabled",
      "",
      "## Reliability and Resilience",
      "- [ ] Health checks and readiness probes",
      "- [ ] Graceful shutdowns and retries",
      "- [ ] Backups and restore procedures documented",
      "",
      "## Observability",
      "- [ ] Structured logging with correlation IDs",
      "- [ ] Metrics dashboards and alerting",
      "- [ ] Error tracking for frontend and backend",
      "",
      "## Performance",
      "- [ ] Core web vitals target defined",
      "- [ ] API latency and throughput targets set",
      "- [ ] Caching strategy documented",
      "",
      "## DevOps and CI/CD",
      "- [ ] Automated build and test pipeline",
      "- [ ] Environment promotion strategy",
      "- [ ] Rollback plan verified",
      "",
      "## Documentation and Support",
      "- [ ] Runbook and incident response",
      "- [ ] SLA/SLO definitions",
      "- [ ] User support and escalation paths"
    ].join("\n");
  }

  /**
   * Generate technical documentation using multi-LLM consensus
   */
  async generateDocumentation(topic, content, format = "markdown") {
    this.info({ topic, format }, "Generating documentation with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert technical writer creating clear, well-structured documentation.",
        user: `Create ${format} documentation for:\nTopic: ${topic}\nContent:\n${content}`,
        schema: {
          name: "documentation",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "sections", "content"],
            properties: {
              title: { type: "string" },
              sections: {
                type: "array",
                items: { type: "string" }
              },
              content: { type: "string" }
            }
          }
        },
        temperature: 0.1 // Low temperature for consistency in technical docs
      });

      this.info({
        doc_length: result.consensus.content.length,
        sections: result.consensus.sections.length,
        documenters: result.metadata.totalSuccessful
      }, "Documentation generated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Documentation generation failed");
      throw err;
    }
  }

  /**
   * Evaluate writing quality using multi-LLM consensus
   */
  async evaluateQuality(text, criteria) {
    this.info({ textLength: text.length }, "Evaluating writing quality with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert editor evaluating writing quality across multiple dimensions.",
        user: `Evaluate this text for quality using these criteria: ${criteria}\n\nText:\n${text}`,
        schema: {
          name: "quality_eval",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["clarity_score", "coherence_score", "issues", "suggestions"],
            properties: {
              clarity_score: { type: "number", minimum: 0, maximum: 100 },
              coherence_score: { type: "number", minimum: 0, maximum: 100 },
              issues: {
                type: "array",
                items: { type: "string" }
              },
              suggestions: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        clarity: result.consensus.clarity_score,
        coherence: result.consensus.coherence_score,
        editors: result.metadata.totalSuccessful
      }, "Writing quality evaluated");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Quality evaluation failed");
      throw err;
    }
  }

  /**
   * Improve writing using multi-LLM consensus
   */
  async improveWriting(text, improvementAreas) {
    this.info({ textLength: text.length }, "Improving writing with multi-LLM");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert writing coach improving text clarity, style, and impact.",
        user: `Improve this text focusing on: ${improvementAreas}\n\nOriginal text:\n${text}`,
        schema: {
          name: "improved_writing",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["improved_text", "changes_made", "explanation"],
            properties: {
              improved_text: { type: "string" },
              changes_made: {
                type: "array",
                items: { type: "string" }
              },
              explanation: { type: "string" }
            }
          }
        },
        temperature: 0.3 // Higher for creative improvements
      });

      this.info({
        improvement_score: result.consensus.changes_made.length,
        coaches: result.metadata.totalSuccessful
      }, "Writing improved");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Writing improvement failed");
      throw err;
    }
  }
}
