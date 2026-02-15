/**
 * Demo: Generate a Browser Game with Working Prototype
 * Shows how to use ProjectGenerator with includeDemo flag
 */

import dotenv from "dotenv";
dotenv.config();

import { ProjectGenerator } from "./src/repo/projectGenerator.js";
import { defaultLogger } from "./src/util/logger.js";

async function generateBrowserGameDemo() {
  console.log("\n=== Genie Project Generator Demo ===\n");
  console.log("Creating a fully functional browser game that you can run immediately...\n");

  const generator = new ProjectGenerator(defaultLogger);

  try {
    // Example 1: Generate with includeDemo = true (creates working prototype)
    const result = await generator.generateFromIdea({
      idea: "An interactive browser-based video game with player movement and enemies",
      projectName: "space-shooter-game",
      templateType: "browser-game",
      includeDemo: true,  // ← KEY FLAG: Creates working demo code
      useConsensus: true,
      temperature: 0.2
    });

    console.log("✓ Project generated successfully!\n");
    console.log("Project Information:");
    console.log(`  Name: ${result.projectName}`);
    console.log(`  Path: ${result.projectPath}`);
    console.log(`  Template: ${result.template}`);
    console.log(`  Demo Mode: ${result.demoMode ? "YES - Has working prototype" : "NO - Scaffold only"}\n`);

    console.log("Next Steps to Run the Game:");
    result.nextSteps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });

    console.log("\n✓ After running 'npm start', your game will be immediately playable in the browser!");
    console.log("   The demo includes:");
    console.log("   - Player character (green rectangle)");
    console.log("   - Enemy spawning (red rectangles)");
    console.log("   - Arrow key controls for movement");
    console.log("   - Score tracking");
    console.log("   - HUD with instructions\n");

    // Example 2: Show comparison with includeDemo = false
    console.log("Comparison:\n");
    console.log("📌 WITH includeDemo=true:");
    console.log("   - Generates working, runnable code");
    console.log("   - Immediate playable demo");
    console.log("   - Perfect for prototyping and showcasing ideas\n");

    console.log("📌 WITH includeDemo=false (default):");
    console.log("   - Generates scaffolding/boilerplate");
    console.log("   - You add your own code");
    console.log("   - Good for starting a project you'll customize\n");

    // Example 3: Generate a Node.js API scaffold
    console.log("Example 2: Generating Node.js REST API scaffold (without demo)...\n");
    
    const apiResult = await generator.generateFromIdea({
      idea: "A REST API for managing todo items with authentication",
      projectName: "todo-api",
      templateType: "node-api",
      includeDemo: false,  // ← No pre-built demo, just scaffold
      useConsensus: true
    });

    console.log("✓ Scaffold API generated!\n");
    console.log("  Name: " + apiResult.projectName);
    console.log("  Demo Mode: " + (apiResult.demoMode ? "YES" : "NO"));
    console.log("  This is a blank canvas for you to build on\n");

    // Example 3: List all available templates
    console.log("ℹ Available Project Templates:\n");
    const { listTemplates } = await import("./src/repo/templateRegistry.js");
    const templates = listTemplates();
    templates.forEach(t => {
      console.log(`  • ${t.name} (${t.id})`);
      console.log(`    ${t.description}`);
      console.log(`    Type: ${t.type}\n`);
    });

    console.log("✓ Demo complete!\n");
    console.log("Full Projects Path: " + generator.getProjectsPath() + "\n");

    // List all projects that were just created
    const projects = generator.listProjects();
    console.log("Generated Projects:");
    projects.forEach(p => {
      const info = generator.getProjectInfo(p);
      if (info) {
        console.log(`  • ${info.name}`);
        console.log(`    Created: ${new Date(info.created).toLocaleString()}`);
        console.log(`    Path: ${info.path}\n`);
      }
    });

  } catch (err) {
    console.error("✗ Error:", err.message);
    process.exit(1);
  }
}

generateBrowserGameDemo();
