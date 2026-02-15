import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { generateImage } from "../llm/openaiClient.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class BackendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "BackendCoder", ...opts });
  }

  async build({ plan, traceId, iteration }) {
    this.info({ traceId, iteration }, "Producing backend changes");

    const backendItems = plan.workItems.filter(w => w.owner === "backend");
    if (backendItems.length === 0) {
      return makeAgentOutput({
        summary: "No backend work items",
        notes: [],
      });
    }

    const patches = [];
    const notes = [];

    // Check if any work item is related to image generation
    for (const item of backendItems) {
      const task = item.task.toLowerCase();
      if (task.includes("image") || task.includes("picture") || task.includes("generate")) {
        try {
          this.info({ traceId, iteration, taskId: item.id }, "Generating image");

          // Extract description and filename from task
          const imagePrompt = this._extractImagePrompt(item.task);
          const outputPath = this._extractOutputPath(item.task);

          const imageData = await generateImage({
            prompt: imagePrompt,
            logger: this.logger
          });

          // Create patch with base64 image
          patches.push({
            type: "file",
            path: outputPath,
            content: imageData.b64,
            encoding: "base64",
            description: `Generated image: ${imagePrompt}`
          });

          notes.push(`✓ Generated image: ${outputPath}`);
        } catch (err) {
          this.logger?.error({ error: err.message, taskId: item.id }, "Image generation failed");
          notes.push(`✗ Image generation failed: ${err.message}`);
        }
      }
    }

    return makeAgentOutput({
      summary: `Backend processed ${backendItems.length} work item(s)`,
      patches,
      notes
    });
  }

  _extractImagePrompt(task) {
    // Try to extract image description from task
    const match = task.match(/(?:image|picture|generate)\s+(?:of\s+)?(?:a\s+)?(.+?)(?:\s+(?:and|in|to|as)|$)/i);
    return match ? match[1].trim() : "a beautiful scene";
  }

  _extractOutputPath(task) {
    // Try to extract filename from task (e.g., "weCanDoAnything.png")
    const match = task.match(/([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif))/i);
    if (match) {
      // Check if there's a folder mentioned
      const folderMatch = task.match(/(?:folder|directory|path)\s+(?:called|named)\s+([a-zA-Z0-9_-]+)/i);
      const folder = folderMatch ? folderMatch[1] : "";
      return folder ? `${folder}/${match[1]}` : match[1];
    }
    return "output.png";
  }

  /**
   * Analyze backend requirements using multi-LLM consensus
   */
  async analyzeRequirements(requirements, context = {}) {
    this.info({ requirements }, "Analyzing requirements with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert backend architect analyzing requirements.",
        user: `Analyze these backend requirements and break them down:\n${requirements}`,
        schema: {
          name: "requirement_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["components", "technologies", "architecture"],
            properties: {
              components: {
                type: "array",
                items: { type: "string" }
              },
              technologies: {
                type: "array",
                items: { type: "string" }
              },
              architecture: { type: "string" }
            }
          }
        },
        temperature: 0.1
      });

      this.info({
        agreement: result.metadata.totalSuccessful / result.metadata.totalRequested,
        reasoning: result.reasoning
      }, "Requirements analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Requirements analysis failed");
      throw err;
    }
  }

  /**
   * Generate backend code using multi-LLM consensus
   */
  async generateCode(requirements, context = {}) {
    this.info({ requirements }, "Generating backend code with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert backend developer writing production-quality code.",
        user: `Generate backend code for:\n${requirements}`,
        schema: {
          name: "backend_code",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["code", "language", "explanation"],
            properties: {
              code: { type: "string" },
              language: { type: "string" },
              explanation: { type: "string" }
            }
          }
        },
        temperature: 0.2
      });

      this.info({
        agreement: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + "%",
        models: result.metadata.totalSuccessful
      }, "Code generation complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code generation failed");
      throw err;
    }
  }

  /**
   * Review generated code using multi-LLM consensus
   */
  async reviewCode(code, context = {}) {
    this.info({ codeLength: code.length }, "Reviewing code with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert code reviewer checking for bugs, performance, and best practices.",
        user: `Review this backend code for issues, performance, and improvements:\n\n${code}`,
        schema: {
          name: "code_review",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["issues", "suggestions", "score"],
            properties: {
              issues: {
                type: "array",
                items: { type: "string" }
              },
              suggestions: {
                type: "array",
                items: { type: "string" }
              },
              score: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        quality_score: result.consensus.score,
        reviewers: result.metadata.totalSuccessful
      }, "Code review complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code review failed");
      throw err;
    }
  }
}

export default BackendCoderAgent;
