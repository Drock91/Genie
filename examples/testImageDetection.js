import HtmlImageEmbedder from "./src/util/htmlImageEmbedder.js";
import { initializeMultiLlm } from "./src/llm/multiLlmSystem.js";

async function testImageDetectionAndGeneration() {
  try {
    // Initialize the MultiLLM system first
    console.log("Initializing MultiLLM system...");
    await initializeMultiLlm();
    
    const embedder = new HtmlImageEmbedder(null); // No logger for simplicity
    
    const htmlFile = "output/TallahasseeGelato_Build/index.html";
    const imgDir = "output/TallahasseeGelato_Build/img";
    
    console.log(`\nTesting image detection for: ${htmlFile}`);
    console.log(`Output directory: ${imgDir}\n`);
    
    // Detect missing images
    const missingImages = await embedder.detectMissingImages(htmlFile, imgDir);
    
    console.log(`Found ${missingImages.length} missing images:`);
    missingImages.forEach(img => {
      console.log(`  - ${img.filename}`);
      console.log(`    Prompt: ${img.prompt.substring(0, 60)}...`);
    });
    
    if (missingImages.length > 0) {
      console.log("\n✨ Generating and embedding images...");
      const result = await embedder.generateMissingImagesAndEmbed(
        htmlFile,
        imgDir,
        'img/'
      );
      
      console.log("\nGeneration Result:");
      console.log(`  Success: ${result.success}`);
      console.log(`  Generated: ${result.generated}`);
      console.log(`  Embedded: ${result.embedded}`);
      
      if (result.generated > 0) {
        console.log("\n✅ Images generated and embedded successfully!");
      }
    } else {
      console.log("\n✅ All images already exist");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testImageDetectionAndGeneration();
