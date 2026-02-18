import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

export class ImageGeneratorAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "ImageGenerator", ...opts });
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateImages({ images, outputDir, traceId, iteration }) {
    this.info({ traceId, iteration, count: images.length }, "Generating DALL-E images");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured for image generation");
    }

    try {
      const results = [];
      const imagePaths = [];

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate images sequentially (DALL-E has rate limits)
      for (const imageSpec of images) {
        try {
          this.info({ filename: imageSpec.filename }, "Generating image");

          // Call DALL-E 3 API
          const response = await this.client.images.generate({
            model: "dall-e-3",
            prompt: imageSpec.prompt,
            n: 1,
            size: imageSpec.size || "1024x1024",
            quality: imageSpec.quality || "standard",
            style: imageSpec.style || "natural"
          });

          if (!response.data || response.data.length === 0) {
            throw new Error("No image returned from DALL-E");
          }

          const imageUrl = response.data[0].url;
          const filePath = path.join(outputDir, imageSpec.filename);

          // Download image from URL
          const imageBuffer = await this._downloadImage(imageUrl);
          
          // Save to file
          await fs.writeFile(filePath, imageBuffer);

          results.push({
            filename: imageSpec.filename,
            path: filePath,
            status: "success"
          });

          imagePaths.push({
            filename: imageSpec.filename,
            path: filePath.replace(/\\/g, "/") // Normalize path for URLs
          });

          this.info({ filename: imageSpec.filename }, "Image saved successfully");
        } catch (err) {
          this.error({ filename: imageSpec.filename, error: err.message }, "Failed to generate image");
          results.push({
            filename: imageSpec.filename,
            status: "failed",
            error: err.message
          });
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.status === "success").length;
      const failedCount = results.filter(r => r.status === "failed").length;

      this.info(
        { traceId, iteration, success: successCount, failed: failedCount },
        "DALL-E image generation complete"
      );

      return makeAgentOutput({
        summary: `Generated ${successCount} images${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        data: {
          success: true,  // Mark as successful in data object
          images: imagePaths,
          results: results,
          stats: {
            total: images.length,
            successful: successCount,
            failed: failedCount
          }
        },
        notes: [`Generated ${successCount} DALL-E images for embedding`]
      });
    } catch (err) {
      this.error({ traceId, error: err.message }, "Image generation failed");
      throw err;
    }
  }

  /**
   * Download image from URL and return as buffer
   */
  async _downloadImage(url) {
    // Use native fetch API (Node.js 18+)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate images and return HTML snippets for embedding
   */
  async generateAndEmbed({ images, outputDir, baseImagePath = "img/", traceId, iteration }) {
    const result = await this.generateImages({ images, outputDir, traceId, iteration });

    if (result.success && result.data?.images) {
      // Create embedded HTML for each image
      const embeddedImages = result.data.images.map(img => ({
        filename: img.filename,
        htmlId: img.filename.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
        src: `${baseImagePath}${img.filename}`,
        element: `<img src="${baseImagePath}${img.filename}" alt="${img.filename}" class="generated-image" />`
      }));

      return {
        ...result,
        data: {
          ...result.data,
          embedded: embeddedImages
        }
      };
    }

    return result;
  }
}
