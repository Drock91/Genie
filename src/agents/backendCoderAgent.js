import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { generateImage } from "../llm/openaiClient.js";

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
}
