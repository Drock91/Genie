import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class WriterAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "Writer", ...opts });
  }

  async build({ plan, traceId, iteration, userInput = "" }) {
    this.info({ traceId, iteration }, "Producing textual response with multi-LLM consensus");

    try {
      const outputPath = this._resolveOutputPath(plan, userInput);
      const explicitContent = this._extractExplicitContent(userInput);

      if (outputPath && explicitContent) {
        this.info({ outputPath }, "Using explicit content for file output");
        return makeAgentOutput({
          summary: `Created ${outputPath}`,
          patches: [
            {
              diff: `*** Add File: ${outputPath}\n${explicitContent}`,
              file: outputPath
            }
          ],
          notes: [explicitContent]
        });
      }

      // Find the writer work item to get specific instructions
      const writerWork = plan.workItems?.find(w => w.owner === 'writer');
      const taskDesc = writerWork ? writerWork.task : plan.goal;
      
      // For text files (.txt, .md), generate plain text without schema
      if (outputPath && (outputPath.endsWith('.txt') || outputPath.endsWith('.md'))) {
        const result = await consensusCall({
          profile: "balanced",
          consensusLevel: "single",
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
          patches: [
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

      if (outputPath && final) {
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
