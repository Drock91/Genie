import fs from "fs/promises";
import path from "path";

/**
 * HTML Image Embedder
 * Replaces image placeholders in HTML with actual image references
 */

export class HtmlImageEmbedder {
  constructor(logger = null) {
    this.logger = logger;
  }

  /**
   * Detect missing images referenced in HTML and generate them
   * 
   * @param {string} htmlFilePath - Path to HTML file
   * @param {string} outputImageDir - Directory where images should be saved
   * @returns {Array} Array of image specs to generate
   */
  async detectMissingImages(htmlFilePath, outputImageDir) {
    try {
      const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
      const imageSrcs = [];
      
      // Match all img src attributes - improved regex
      const srcMatches = htmlContent.match(/src=['"]([\w\-\.\/]+\.(?:jpg|jpeg|png|gif|webp))['"]/gi) || [];
      
      for (const match of srcMatches) {
        const src = match.replace(/src=['"]/i, '').replace(/['"]$/, '');
        imageSrcs.push(src);
      }
      
      // Remove duplicates
      const uniqueSrcs = [...new Set(imageSrcs)];

      this.logger?.info({ totalRefs: uniqueSrcs.length }, "Found image references in HTML");
      
      // Check which images are missing
      const missingImages = [];
      for (const imageFile of uniqueSrcs) {
        const filename = path.basename(imageFile);
        const fullPath = path.join(outputImageDir, filename);
        
        try {
          await fs.access(fullPath);
          // File exists, skip it
          this.logger?.debug({ file: filename }, "Image file exists, skipping");
        } catch {
          // File doesn't exist, add to missing list
          this.logger?.info({ file: filename }, "Image file missing, will generate");
          missingImages.push({
            filename: filename,
            src: imageFile,
            prompt: this._generateImagePrompt(imageFile)
          });
        }
      }
      
      this.logger?.info({ missingCount: missingImages.length }, `Detected ${missingImages.length} missing images`);
      return missingImages;
    } catch (err) {
      this.logger?.error({ file: htmlFilePath, error: err.message }, "Failed to detect missing images");
      return [];
    }
  }

  /**
   * Generate appropriate prompt based on image filename
   */
  _generateImagePrompt(filename) {
    const name = filename.toLowerCase().replace(/\.(jpg|png|gif|webp)$/i, '');
    
    // Hero images
    if (name.includes('hero')) {
      return `An inviting, upscale Italian gelato shop storefront, warm ambient lighting, 
        beautiful gelato display, professional photography, welcoming atmosphere, 
        terracotta and cream color palette, premium quality`;
    }
    
    // Flavor/product images
    const flavorMap = {
      'chocolate': 'Rich, dark chocolate',
      'hazelnut': 'with roasted hazelnuts',
      'strawberry': 'Fresh strawberry',
      'basil': 'with fresh basil',
      'mango': 'Exotic mango',
      'passion': 'with passion fruit',
      'sicilian': 'Sicilian lemon',
      'lemon': 'Fresh lemon sorbetto',
      'madagascar': 'Madagascar vanilla',
      'vanilla': 'Premium vanilla',
      'espresso': 'Italian espresso',
      'coffee': 'Coffee gelato',
      'coconut': 'Creamy coconut',
      'lime': 'with lime',
      'georgia': 'Georgia peach',
      'peach': 'Fresh peach',
      'cream': 'Creamy gelato'
    };
    
    let flavorDesc = 'specialty gelato';
    for (const [key, desc] of Object.entries(flavorMap)) {
      if (name.includes(key)) {
        flavorDesc = desc;
        break;
      }
    }
    
    return `A beautifully plated scoop of ${flavorDesc} gelato, 
      artisanal Italian style, professional food photography, 
      studio lighting, appetizing creamy texture, premium quality, 
      on white porcelain background, shallow depth of field`;
  }

  /**
   * Embed generated images into HTML file
   * Replaces image placeholders in HTML with actual image references
   * 
   * @param {string} htmlFilePath - Path to HTML file with placeholders
   * @param {Array} generatedImages - Array of { filename, path } from image generator
   * @param {string} imageBaseDir - Base directory for image references (e.g., "img/")
   * @returns {string} Updated HTML content
   */
  async embedImages(htmlFilePath, generatedImages, imageBaseDir = "") {
    try {
      let htmlContent = await fs.readFile(htmlFilePath, "utf-8");

      for (const image of generatedImages) {
        // Find and replace src references to this image
        const patterns = [
          new RegExp(`src=["']${image.filename}["']`, 'gi'),
          new RegExp(`src=["'][^"']*\\/${image.filename}["']`, 'gi'),
          new RegExp(`href=["']${image.filename}["']`, 'gi')
        ];

        for (const pattern of patterns) {
          const imagePath = `${imageBaseDir}${image.filename}`;
          htmlContent = htmlContent.replace(pattern, `src="${imagePath}"`);
        }

        this.logger?.info({ filename: image.filename }, "Embedded image into HTML");
      }

      return htmlContent;
    } catch (err) {
      this.logger?.error({ file: htmlFilePath, error: err.message }, "Failed to embed images");
      throw err;
    }
  }

  /**
   * Save updated HTML to file
   */
  async saveEmbeddedHtml(htmlFilePath, updatedContent) {
    try {
      await fs.writeFile(htmlFilePath, updatedContent, "utf-8");
      this.logger?.info({ file: htmlFilePath }, "Updated HTML file with embedded images");
    } catch (err) {
      this.logger?.error({ file: htmlFilePath, error: err.message }, "Failed to save updated HTML");
      throw err;
    }
  }

  /**
   * Full workflow: Detect missing images, generate them, and embed into HTML
   */
  async generateMissingImagesAndEmbed(htmlFilePath, outputImageDir, imageBaseDir = "") {
    try {
      const { generateImages } = await import("../llm/multiLlmSystem.js");

      // Detect missing images
      const missingImages = await this.detectMissingImages(htmlFilePath, outputImageDir);
      
      if (missingImages.length === 0) {
        this.logger?.info({ htmlFile: htmlFilePath }, "No missing images detected");
        return {
          success: true,
          generated: 0,
          embedded: 0,
          htmlFile: htmlFilePath,
          images: []
        };
      }

      this.logger?.info({ count: missingImages.length }, "Detected missing images, generating...");

      // Convert to image specs for generation
      const imageSpecs = missingImages.map(img => ({
        filename: img.filename,
        prompt: img.prompt,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      }));

      // Generate images
      const generationResult = await generateImages(imageSpecs, outputImageDir);

      // Check if generation was successful - look in data.success
      const wasSuccessful = generationResult.data?.success === true || generationResult.data?.stats?.successful > 0;
      
      if (wasSuccessful) {
        const generatedImages = generationResult.data?.images || [];

        // Read HTML
        const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');

        // Embed images
        const updatedContent = await this.embedImages(htmlFilePath, generatedImages, imageBaseDir);

        // Save updated HTML
        await this.saveEmbeddedHtml(htmlFilePath, updatedContent);

        this.logger?.info(
          { embedded: generatedImages.length },
          "Successfully embedded images into HTML"
        );

        return {
          success: true,
          generated: generationResult.data?.stats?.successful || generatedImages.length || 0,
          embedded: generatedImages.length,
          htmlFile: htmlFilePath,
          images: generatedImages
        };
      }

      return {
        success: false,
        generated: generationResult.data?.stats?.successful || 0,
        embedded: 0,
        error: "Image generation did not complete successfully"
      };
    } catch (err) {
      this.logger?.error({ error: err.message }, "Image generation and embedding failed");
      // Don't throw - let workflow continue even if image generation fails
      return {
        success: false,
        error: err.message,
        generated: 0,
        embedded: 0
      };
    }
  }
}

export default HtmlImageEmbedder;
