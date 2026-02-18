import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import fs from "fs";
import path from "path";

/**
 * Code Refiner Agent
 * Makes targeted improvements to existing code files
 * Works like GitHub Copilot - reads existing code and makes precise edits
 */
export class CodeRefinerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "CodeRefiner", ...opts });
  }

  /**
   * Refine existing code based on user request
   * @param {Object} params - { userInput, projectPath, filePaths }
   * @returns {Promise<Object>} - Patches to apply
   */
  async refineExistingCode({ userInput, projectPath, filePaths = [] }) {
    this.info({ userInput, projectPath, fileCount: filePaths.length }, "Refining existing code");

    try {
      // If no specific files given, find all code files in project
      if (filePaths.length === 0) {
        filePaths = this.findCodeFiles(projectPath);
      }

      // Read all existing files
      const fileContents = {};
      for (const filePath of filePaths) {
        const fullPath = path.join(projectPath, filePath);
        if (fs.existsSync(fullPath)) {
          fileContents[filePath] = fs.readFileSync(fullPath, 'utf-8');
        }
      }

      this.info({ filesRead: Object.keys(fileContents).length }, "Read existing files");

      // Analyze what needs to be changed
      const analysis = await this.analyzeChangesNeeded(userInput, fileContents);
      
      this.info({ changesNeeded: analysis.files_to_modify.length }, "Analysis complete");

      // Generate specific edits for each file
      const patches = [];
      for (const fileToModify of analysis.files_to_modify) {
        const filePath = fileToModify.file;
        const originalContent = fileContents[filePath];
        
        if (!originalContent) {
          this.warn({ filePath }, "File not found, skipping");
          continue;
        }

        const refinedContent = await this.refineFile({
          filePath,
          originalContent,
          userRequest: userInput,
          changes: fileToModify.changes
        });

        patches.push({
          type: "file",
          path: filePath,
          content: refinedContent,
          operation: "update"
        });
      }

      this.info({ patchCount: patches.length }, "Code refinement complete");

      return {
        summary: `Refined ${patches.length} files based on request`,
        patches,
        analysis
      };

    } catch (err) {
      this.error({ error: err.message }, "Code refinement failed");
      throw err;
    }
  }

  /**
   * Analyze what changes are needed
   */
  async analyzeChangesNeeded(userRequest, fileContents) {
    const fileList = Object.keys(fileContents).map(f => ({
      path: f,
      preview: fileContents[f].slice(0, 500)
    }));

    const result = await consensusCall({
      profile: "balanced",
      system: `You are an expert code analyst. Given existing code files and a user request, determine which files need to be modified and what specific changes are needed.

Be precise and targeted - only modify what's necessary to fulfill the request.`,
      user: `User request: "${userRequest}"

Existing files:
${fileList.map(f => `${f.path}:\n${f.preview}...\n`).join('\n')}

Analyze which files need changes and what specific modifications are required.`,
      schema: {
        name: "change_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["files_to_modify", "reasoning"],
          properties: {
            files_to_modify: {
              type: "array",
              items: {
                type: "object",
                required: ["file", "changes"],
                properties: {
                  file: { type: "string" },
                  changes: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            reasoning: { type: "string" }
          }
        }
      },
      temperature: 0.1
    });

    return result.consensus;
  }

  /**
   * Refine a specific file
   */
  async refineFile({ filePath, originalContent, userRequest, changes }) {
    this.info({ filePath, changeCount: changes.length }, "Refining file");

    const result = await consensusCall({
      profile: "balanced",
      system: `You are an expert code editor making precise, targeted improvements to existing code.

Rules:
1. ONLY modify what's necessary to fulfill the user's request
2. Preserve all existing functionality that isn't being changed
3. Maintain the original code style and structure
4. Don't add unnecessary comments or changes
5. Output the COMPLETE refined file content`,
      user: `User request: "${userRequest}"

Specific changes needed:
${changes.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Original file (${filePath}):
\`\`\`
${originalContent}
\`\`\`

Provide the complete refined version of this file with the requested changes applied.`,
      schema: {
        name: "refined_code",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["refined_code", "changes_made"],
          properties: {
            refined_code: { type: "string" },
            changes_made: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      temperature: 0.15
    });

    this.info({ 
      filePath, 
      changesMade: result.consensus.changes_made.length 
    }, "File refined");

    return result.consensus.refined_code;
  }

  /**
   * Find all code files in a directory
   */
  findCodeFiles(dir) {
    const codeFiles = [];
    const extensions = ['.js', '.html', '.css', '.json', '.ts', '.jsx', '.tsx', '.vue'];

    const walk = (currentPath) => {
      if (!fs.existsSync(currentPath)) return;

      const entries = fs.readdirSync(currentPath);
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
            walk(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(entry);
          if (extensions.includes(ext)) {
            codeFiles.push(path.relative(dir, fullPath));
          }
        }
      }
    };

    walk(dir);
    return codeFiles;
  }

  /**
   * Quick refine - for simple requests on known files
   */
  async quickRefine({ filePath, userRequest }) {
    this.info({ filePath, userRequest }, "Quick refine");

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const originalContent = fs.readFileSync(fullPath, 'utf-8');
    
    const result = await consensusCall({
      profile: "balanced",
      system: "You are an expert code editor. Make the requested changes to the code while preserving all other functionality.",
      user: `Request: ${userRequest}\n\nOriginal code:\n\`\`\`\n${originalContent}\n\`\`\`\n\nProvide the refined code.`,
      schema: {
        name: "quick_refine",
        schema: {
          type: "object",
          required: ["refined_code"],
          properties: {
            refined_code: { type: "string" },
            summary: { type: "string" }
          }
        }
      },
      temperature: 0.2
    });

    return {
      filePath,
      originalContent,
      refinedContent: result.consensus.refined_code,
      summary: result.consensus.summary,
      patch: {
        type: "file",
        path: filePath,
        content: result.consensus.refined_code,
        operation: "update"
      }
    };
  }
}
