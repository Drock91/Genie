import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { generateImage } from "../llm/openaiClient.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class BackendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "BackendCoder", ...opts });
  }

  async build({ plan, traceId, iteration, userInput }) {
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

          // Extract description and filename from task and userInput
          const imagePrompt = this._extractImagePrompt(item.task, userInput);
          let outputPath = this._extractOutputPath(item.task, userInput);
          // Remove any leading 'output/' or './output/' from path
          outputPath = outputPath.replace(/^\.?\/?output\//, "");

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

  _extractImagePrompt(task, userInput = "") {
    // First try to extract from userInput which has more context
    if (userInput) {
      const contextMatch = userInput.match(/(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i);
      if (contextMatch && contextMatch[1]) {
        const subject = contextMatch[1];
        // Make it more descriptive for DALL-E
        return `a detailed, high-quality image of ${subject}`;
      }
    }

    // Fallback to extracting from task
    const match = task.match(/(?:image|picture|generate)\s+(?:of\s+)?(?:a\s+)?(.+?)(?:\s+(?:and|in|to|as|file)|$)/i);
    return match ? match[1].trim() : "a beautiful scene";
  }

  _extractOutputPath(task, userInput = "") {
    // Try to extract filename from task (e.g., "whale.png", "myImage.jpg")
    const filenameMatch = task.match(/([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif))/i);
    if (filenameMatch) {
      return filenameMatch[1];
    }

    // Try to extract subject/theme from userInput first for more context
    if (userInput) {
      const subjectPatterns = [
        /(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i,
        /(\w+)\s+(?:PNG|image|picture|photo)/i,
        /(\w+)\.(?:txt|json|md)/i  // Also extract from file references
      ];

      for (const pattern of subjectPatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const subject = match[1].toLowerCase();
          // Skip generic words
          if (!['output', 'image', 'picture', 'photo', 'file', 'a', 'an', 'the'].includes(subject)) {
            this.info({ subject, source: 'userInput' }, "Extracted filename from context");
            return `${subject}.png`;
          }
        }
      }
    }

    // Fallback: try to extract from task
    const subjectPatterns = [
      /(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i,
      /(\w+)\s+(?:PNG|image|picture|photo)/i,
      /(?:about|themed|related to)\s+(\w+)/i
    ];

    for (const pattern of subjectPatterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        const subject = match[1].toLowerCase();
        // Skip generic words
        if (!['output', 'image', 'picture', 'photo', 'file', 'a', 'an', 'the'].includes(subject)) {
          return `${subject}.png`;
        }
      }
    }

    // Last resort: use "image.png" instead of "output.png"
    this.warn({ task, userInput }, "Could not extract meaningful filename, using 'image.png'");
    return "image.png";
  }

  /**
   * Analyze backend requirements using multi-LLM consensus
   */
  async analyzeRequirements(requirements, context = {}, consensusLevel = "single") {
    this.info({ requirements }, "Analyzing requirements with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
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
