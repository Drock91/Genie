import { initializeMultiLlm, generateImages } from "./src/llm/multiLlmSystem.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testDalleGeneration() {
  try {
    console.log("Initializing MultiLLM system...");
    await initializeMultiLlm();
    
    const outputDir = path.join(__dirname, "output/DalleTest/img");
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log("Testing DALL-E image generation...");
    
    const imageSpecs = [
      {
        filename: "test-gelato-hero.png",
        prompt: "A beautiful upscale Italian gelato shop with warm lighting and creative flavors displayed",
        size: "1024x1024",
        quality: "standard"
      },
      {
        filename: "test-chocolate-hazelnut.png",
        prompt: "A beautifully plated scoop of chocolate hazelnut gelato, artisanal Italian style, professional food photography",
        size: "1024x1024",
        quality: "standard"
      }
    ];
    
    const result = await generateImages(imageSpecs, outputDir);
    
    console.log("\n=== Generation Result ===");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("\n✅ Image generation successful!");
      const files = await fs.readdir(outputDir);
      console.log(`Files created: ${files.join(", ")}`);
    } else {
      console.log("\n❌ Image generation failed");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

testDalleGeneration();
