/**
 * Project Generator
 * Orchestrates the creation of complete, runnable projects
 */

import { ProjectWriter } from "./projectWriter.js";
import { getTemplate } from "./templateRegistry.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class ProjectGenerator {
  constructor(logger = null) {
    this.logger = logger;
    this.writer = new ProjectWriter(logger);
  }

  /**
   * Generate a complete project from an idea
   */
  async generateFromIdea(config) {
    const {
      idea,
      projectName,
      templateType = "node-api",
      includeDemo = false,
      useConsensus = true,
      temperature = 0.2
    } = config;

    try {
      this.logger?.info({ projectName, templateType, idea, includeDemo }, "Starting project generation");

      // Get template
      const template = getTemplate(templateType);
      if (!template) {
        throw new Error(`Unknown template type: ${templateType}`);
      }

      // Initialize projects directory
      this.writer.initializeProjectsDir();

      // Create project directory
      const projectPath = this.writer.createProjectDirectory(projectName);

      // If using consensus, have LLMs enhance the project plan
      let enhancements = {};
      if (useConsensus) {
        enhancements = await this._getConsensusEnhancements(idea, template, temperature, includeDemo);
      }

      // Merge template with enhancements
      const finalConfig = { ...template, ...enhancements };

      // Create package.json
      this.writer.createPackageJson(projectPath, {
        name: projectName,
        version: finalConfig.version || "1.0.0",
        description: finalConfig.description || idea,
        main: finalConfig.main || "src/index.js",
        dependencies: finalConfig.dependencies || {},
        devDependencies: finalConfig.devDependencies || {},
        scripts: finalConfig.scripts || {},
        startScript: finalConfig.startScript,
        devScript: finalConfig.devScript,
        testScript: finalConfig.testScript,
        buildScript: finalConfig.buildScript
      });

      // Create README with demo instructions
      this.writer.createReadme(projectPath, {
        name: projectName,
        description: idea,
        structure: finalConfig.structure || "",
        demoMode: includeDemo
      });

      // Create .gitignore
      this.writer.createGitignore(projectPath);

      // Write template files
      if (finalConfig.template) {
        this.writer.writeFiles(projectPath, finalConfig.template);
      }

      // Write enhanced files from LLM if available
      if (enhancements.generatedFiles) {
        this.writer.writeFiles(projectPath, enhancements.generatedFiles);
      }

      this.logger?.info({ projectPath, templateType, includeDemo }, "Project generation complete");

      return {
        success: true,
        projectName,
        projectPath,
        template: templateType,
        demoMode: includeDemo,
        nextSteps: includeDemo ? [
          `cd ${projectPath}`,
          "npm install",
          "npm start",
          "# Demo will be running - check console for instructions"
        ] : [
          `cd ${projectPath}`,
          "npm install",
          "npm start"
        ]
      };
    } catch (err) {
      this.logger?.error({ error: err.message, projectName }, "Project generation failed");
      throw err;
    }
  }

  /**
   * Get consensus enhancements using multi-LLM
   */
  async _getConsensusEnhancements(idea, template, temperature, includeDemo = false) {
    try {
      const demoInstructions = includeDemo 
        ? "\n\nIMPORTANT: Generate WORKING, FUNCTIONAL DEMO CODE that can run immediately after npm install. Include example features, working endpoints, or interactive elements that showcase the project."
        : "";

      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert software architect reviewing a project template and enhancing it based on requirements.",
        user: `Enhance this ${template.type} project template for: ${idea}\n\nTemplate: ${template.name}\n\nProvide additional dependencies, configuration options, or file suggestions.${demoInstructions}`,
        schema: {
          name: "project_enhancements",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["additional_dependencies", "recommended_scripts", "enhancements"],
            properties: {
              additional_dependencies: {
                type: "array",
                items: { type: "string" }
              },
              recommended_scripts: {
                type: "object",
                additionalProperties: { type: "string" }
              },
              enhancements: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        temperature
      });

      this.logger?.info({
        dependencies: result.consensus.additional_dependencies.length,
        scripts: Object.keys(result.consensus.recommended_scripts).length,
        demoMode: includeDemo
      }, "Consensus enhancements received");

      // Merge additional dependencies
      const additionalDeps = result.consensus.additional_dependencies.reduce((acc, dep) => {
        const [name, version] = dep.includes("@") ? dep.split("@").slice(-2) : dep.split("@");
        acc[name] = version || "latest";
        return acc;
      }, {});

      return {
        additionalDependencies: additionalDeps,
        scripts: result.consensus.recommended_scripts,
        enhancements: result.consensus.enhancements,
        demoMode: includeDemo
      };
    } catch (err) {
      this.logger?.warn({ error: err.message }, "Failed to get consensus enhancements, using defaults");
      return {};
    }
  }

  /**
   * Generate with code from agents
   */
  async generateWithCode(config) {
    const {
      idea,
      projectName,
      templateType = "node-api",
      includeDemo = false,
      backendCode,
      frontendCode,
      otherFiles = {}
    } = config;

    try {
      // Create base project with demo mode
      const result = await this.generateFromIdea({
        idea,
        projectName,
        templateType,
        includeDemo,
        useConsensus: true
      });

      // Overlay provided code
      const projectPath = result.projectPath;

      // Write backend code if provided
      if (backendCode) {
        if (typeof backendCode === "string") {
          this.writer.writeFile(projectPath, "src/index.js", backendCode);
        } else {
          this.writer.writeFiles(projectPath, backendCode);
        }
      }

      // Write frontend code if provided
      if (frontendCode) {
        if (typeof frontendCode === "string") {
          this.writer.writeFile(projectPath, "src/app.jsx", frontendCode);
        } else {
          this.writer.writeFiles(projectPath, frontendCode);
        }
      }

      // Write any other files
      if (Object.keys(otherFiles).length > 0) {
        this.writer.writeFiles(projectPath, otherFiles);
      }

      this.logger?.info({ projectPath, includeDemo }, "Code overlayed successfully");

      return {
        ...result,
        filesWritten: {
          backend: !!backendCode,
          frontend: !!frontendCode,
          other: Object.keys(otherFiles).length
        }
      };
    } catch (err) {
      this.logger?.error({ error: err.message }, "Failed to generate with code");
      throw err;
    }
  }

  /**
   * List available templates
   */
  listTemplates() {
    const { listTemplates } = await import("./templateRegistry.js");
    return listTemplates();
  }

  /**
   * Get projects directory
   */
  getProjectsPath() {
    return this.writer.projectsPath;
  }

  /**
   * List generated projects
   */
  listProjects() {
    return this.writer.listProjects();
  }

  /**
   * Get project info
   */
  getProjectInfo(projectName) {
    return this.writer.getProjectInfo(projectName);
  }
}

export default ProjectGenerator;
