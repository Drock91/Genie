/**
 * Delivery Manager Agent
 * Verifies that project deliverables match requirements exactly
 * Acts as final quality gate before delivery
 */

import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import { makeAgentOutput, makeIssue, Severity } from "../models.js";
import fs from "fs";
import path from "path";

export class DeliveryManagerAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "DeliveryManager", ...opts });
  }

  /**
   * Verify project deliverables against requirements
   */
  async verifyDelivery({ userInput, outputPath, executedFiles = [], traceId, iteration }) {
    this.info({ traceId, iteration, outputPath }, "Verifying project deliverables");

    const issues = [];
    
    try {
      // Step 1: Parse requirements to understand what should be delivered
      const requirements = await this.parseRequirements(userInput);
      
      this.info({ 
        traceId,
        expectedFiles: requirements.expected_files.length,
        expectedFolders: requirements.expected_folders.length
      }, "Requirements parsed");

      // Step 2: Scan actual output directory
      const actualDeliverables = this.scanOutput(outputPath);
      
      this.info({
        traceId,
        actualFiles: actualDeliverables.files.length,
        actualFolders: actualDeliverables.folders.length
      }, "Output scanned");

      // Step 3: Verify completeness
      const completeness = this.checkCompleteness(requirements, actualDeliverables);
      
      if (completeness.missing.length > 0) {
        issues.push(
          makeIssue({
            id: "delivery-001",
            title: "Missing deliverables",
            severity: Severity.CRITICAL,
            description: `Required files not found: ${completeness.missing.join(', ')}`,
            recommendation: ["Regenerate missing files"],
            area: "completeness"
          })
        );
      }

      // Step 4: Check for duplicates
      const duplicates = this.findDuplicates(actualDeliverables);
      if (duplicates.length > 0) {
        issues.push(
          makeIssue({
            id: "delivery-002",
            title: "Duplicate files detected",
            severity: Severity.MEDIUM,
            description: `Found duplicate files: ${duplicates.join(', ')}`,
            recommendation: ["Remove duplicate files, keep only the correct version"],
            area: "duplicates"
          })
        );
      }

      // Step 5: Verify naming conventions
      const namingIssues = this.checkNaming(requirements, actualDeliverables, userInput);
      if (namingIssues.length > 0) {
        namingIssues.forEach(issue => issues.push(issue));
      }

      // Step 6: Verify folder structure
      const structureIssues = this.checkStructure(requirements, actualDeliverables, userInput);
      if (structureIssues.length > 0) {
        structureIssues.forEach(issue => issues.push(issue));
      }

      // Step 7: Test deliverables (HTML files load, images exist, etc)
      const functionalIssues = await this.testDeliverables(actualDeliverables, outputPath);
      if (functionalIssues.length > 0) {
        functionalIssues.forEach(issue => issues.push(issue));
      }

      const ok = issues.length === 0;
      
      this.info({
        traceId,
        iteration,
        deliveryStatus: ok ? 'PASS' : 'FAIL',
        issuesFound: issues.length
      }, "Delivery verification complete");

      // Generate fix instructions for Manager agent if there are issues (using consensus)
      let fixInstructions = null;
      if (!ok) {
        fixInstructions = await this.generateFixInstructionsWithConsensus({
          issues,
          requirements,
          actualDeliverables,
          userInput,
          traceId
        });
      }

      return {
        ok,
        issues,
        completeness,
        duplicates,
        deliverables: actualDeliverables,
        fixInstructions,
        summary: ok 
          ? `✅ All deliverables verified successfully` 
          : `❌ Found ${issues.length} delivery issues`,
        output: makeAgentOutput({
          summary: ok ? "Delivery verification PASS" : "Delivery verification FAIL",
          notes: [
            `Expected: ${requirements.expected_files.length} files, ${requirements.expected_folders.length} folders`,
            `Actual: ${actualDeliverables.files.length} files, ${actualDeliverables.folders.length} folders`,
            `Missing: ${completeness.missing.length}`,
            `Duplicates: ${duplicates.length}`,
            `Issues: ${issues.length}`
          ],
          risks: issues.map(i => `${i.severity}:${i.id}:${i.title}`)
        })
      };

    } catch (err) {
      this.error({ traceId, error: err.message }, "Delivery verification failed");
      return {
        ok: false,
        issues: [
          makeIssue({
            id: "delivery-999",
            title: "Verification system error",
            severity: Severity.HIGH,
            description: err.message,
            recommendation: ["Check delivery manager logs"],
            area: "system"
          })
        ],
        summary: "Verification failed due to system error"
      };
    }
  }

  /**
   * Parse user requirements using LLM to understand expected deliverables
   */
  async parseRequirements(userInput) {
    this.info({ userInput }, "Parsing delivery requirements with consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel: "consensus",
        system: `You are a project manager parsing user requirements to create a deliverable checklist.

Extract:
1. Expected file types (png, txt, html, etc) with their names
2. Expected folder names/structure
3. Key features that must exist
4. Naming patterns (singular vs plural, specific names mentioned)

Be specific about names mentioned in the request.`,
        user: `Parse requirements from: "${userInput}"

What files should be delivered? What folders? What features must exist?
Extract specific names if mentioned (e.g., "whale.png" not "image.png").`,
        schema: {
          name: "delivery_requirements",
          schema: {
            type: "object",
            required: ["expected_files", "expected_folders", "key_features"],
            properties: {
              expected_files: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Expected filename or pattern" },
                    type: { type: "string", description: "File type (png, txt, html, etc)" },
                    required: { type: "boolean" }
                  }
                }
              },
              expected_folders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Expected folder name" },
                    purpose: { type: "string" }
                  }
                }
              },
              key_features: {
                type: "array",
                items: { type: "string" },
                description: "Features that must exist in deliverables"
              },
              naming_convention: {
                type: "string",
                description: "Expected naming pattern (e.g., singular whale, plural whales)"
              }
            }
          }
        },
        temperature: 0.1
      });

      return result.consensus;

    } catch (err) {
      this.error({ error: err.message }, "Requirements parsing failed");
      // Return minimal requirements if parsing fails
      return {
        expected_files: [],
        expected_folders: [],
        key_features: []
      };
    }
  }

  /**
   * Scan output directory to get actual deliverables
   */
  scanOutput(outputPath) {
    if (!outputPath || !fs.existsSync(outputPath)) {
      return { files: [], folders: [], tree: {} };
    }

    const files = [];
    const folders = [];

    const scanDir = (dir, relative = "") => {
      try {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const relativePath = path.join(relative, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            folders.push({
              name: item,
              path: relativePath,
              fullPath
            });
            scanDir(fullPath, relativePath);
          } else {
            files.push({
              name: item,
              path: relativePath,
              fullPath,
              extension: path.extname(item),
              size: stats.size
            });
          }
        });
      } catch (err) {
        this.warn({ dir, error: err.message }, "Failed to scan directory");
      }
    };

    scanDir(outputPath);

    return { files, folders };
  }

  /**
   * Check if all required deliverables exist
   */
  checkCompleteness(requirements, actualDeliverables) {
    const missing = [];
    const found = [];

    requirements.expected_files.forEach(expected => {
      const exists = actualDeliverables.files.some(actual => {
        // Check exact name match or type match
        return actual.name === expected.name || 
               actual.extension === `.${expected.type}` ||
               actual.name.includes(expected.name.replace(/\.\w+$/, ''));
      });

      if (expected.required && !exists) {
        missing.push(expected.name);
      } else if (exists) {
        found.push(expected.name);
      }
    });

    return { missing, found, coverage: found.length / (found.length + missing.length) };
  }

  /**
   * Find duplicate files (e.g., output.png AND whales.png)
   */
  findDuplicates(actualDeliverables) {
    const duplicates = [];
    const seenTypes = {};

    actualDeliverables.files.forEach(file => {
      const ext = file.extension;
      if (seenTypes[ext]) {
        duplicates.push(`${seenTypes[ext]} and ${file.name} (both ${ext})`);
      } else {
        seenTypes[ext] = file.name;
      }
    });

    return duplicates;
  }

  /**
   * Check naming conventions (singular vs plural, consistency)
   */
  checkNaming(requirements, actualDeliverables, userInput) {
    const issues = [];
    
    // Extract theme/subject from user input
    const themeMatch = userInput.match(/\b(whale|cat|dog|car|game|app|website)\b/i);
    const theme = themeMatch ? themeMatch[1].toLowerCase() : null;
    
    // Check for generic/lazy filenames
    const badFilenames = ['output.png', 'output.jpg', 'image.png', 'file.txt', 'output.txt', 'temp.png'];
    actualDeliverables.files.forEach(file => {
      if (badFilenames.includes(file.name.toLowerCase())) {
        issues.push(
          makeIssue({
            id: "delivery-010",
            title: "Generic filename used",
            severity: Severity.CRITICAL,
            description: `File "${file.name}" uses a generic name instead of a descriptive name related to "${theme || 'the project theme'}"`,
            recommendation: [`Rename to ${theme}.${file.extension.substring(1)} or similar descriptive name`],
            area: "naming"
          })
        );
      }
    });
    
    // Check if filenames match the theme
    if (theme) {
      const themeFiles = actualDeliverables.files.filter(f => 
        f.name.toLowerCase().includes(theme)
      );
      
      // If user mentioned a specific theme (like whale) but no files contain that theme
      if (actualDeliverables.files.length > 0 && themeFiles.length === 0) {
        issues.push(
          makeIssue({
            id: "delivery-011",
            title: "Filenames don't match project theme",
            severity: Severity.HIGH,
            description: `User requested ${theme}-related content but no files contain "${theme}" in their names`,
            recommendation: [`Rename files to include theme: ${theme}.png, ${theme}.txt, ${theme}_website, etc.`],
            area: "naming"
          })
        );
      }
    }
    
    // Check for inconsistent naming (whale.txt vs whales.png)
    const baseNames = {};
    actualDeliverables.files.forEach(file => {
      const baseName = file.name.replace(/\.\w+$/, '').toLowerCase();
      const singular = baseName.replace(/s$/, '');
      
      if (baseNames[singular]) {
        // Found potential inconsistency
        if (baseNames[singular] !== baseName) {
          issues.push(
            makeIssue({
              id: "delivery-003",
              title: "Inconsistent naming convention",
              severity: Severity.MEDIUM,
              description: `Files use both "${baseNames[singular]}" and "${baseName}" - should be consistent`,
              recommendation: [`Standardize all files to use singular form: ${singular}`],
              area: "naming"
            })
          );
        }
      } else {
        baseNames[singular] = baseName;
      }
    });

    return issues;
  }

  /**
   * Check folder structure and naming
   */
  checkStructure(requirements, actualDeliverables, userInput) {
    const issues = [];

    // Check for generic folder names when specific names were mentioned
    const genericNames = ['small', 'output', 'temp', 'new', 'project'];
    
    actualDeliverables.folders.forEach(folder => {
      if (genericNames.includes(folder.name.toLowerCase())) {
        // Check if user mentioned a specific name
        const userMentionedName = this.extractFolderName(userInput);
        if (userMentionedName && userMentionedName.toLowerCase() !== folder.name.toLowerCase()) {
          issues.push(
            makeIssue({
              id: "delivery-004",
              title: "Generic folder name used",
              severity: Severity.HIGH,
              description: `Folder "${folder.name}" should be named "${userMentionedName}" based on requirements`,
              recommendation: [`Rename folder to "${userMentionedName}"`],
              area: "structure"
            })
          );
        }
      }
    });

    return issues;
  }

  /**
   * Extract intended folder name from user input
   */
  extractFolderName(userInput) {
    // Look for patterns like "5-page website", "whale website", "company site"
    const patterns = [
      /(\w+)\s+website/i,
      /website\s+(?:about|for)\s+(\w+)/i,
      /(\w+)\s+site/i,
      /folder\s+(?:named|called)\s+(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = userInput.match(pattern);
      if (match && match[1]) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        return name === 'Small' ? 'Website' : name;
      }
    }

    return null;
  }

  /**
   * Test that deliverables actually work
   */
  async testDeliverables(actualDeliverables, outputPath) {
    const issues = [];

    // Test 1: HTML files should have valid structure
    const htmlFiles = actualDeliverables.files.filter(f => f.extension === '.html');
    for (const htmlFile of htmlFiles) {
      try {
        const content = fs.readFileSync(htmlFile.fullPath, 'utf8');
        if (!content.includes('<!DOCTYPE') && !content.includes('<html')) {
          issues.push(
            makeIssue({
              id: "delivery-005",
              title: "Invalid HTML structure",
              severity: Severity.HIGH,
              description: `${htmlFile.name} appears to be malformed HTML`,
              recommendation: ["Regenerate HTML with proper structure"],
              area: "functionality"
            })
          );
        }
      } catch (err) {
        this.warn({ file: htmlFile.name, error: err.message }, "Failed to test HTML file");
      }
    }

    // Test 2: Image files should have content
    const imageFiles = actualDeliverables.files.filter(f => 
      ['.png', '.jpg', '.jpeg', '.gif'].includes(f.extension)
    );
    for (const imageFile of imageFiles) {
      if (imageFile.size < 100) {
        issues.push(
          makeIssue({
            id: "delivery-006",
            title: "Image file too small",
            severity: Severity.MEDIUM,
            description: `${imageFile.name} is only ${imageFile.size} bytes - may be empty or corrupted`,
            recommendation: ["Verify image generation worked correctly"],
            area: "functionality"
          })
        );
      }
    }

    return issues;
  }

  /**
   * Generate detailed fix instructions for Manager agent
   */
  generateFixInstructions(issues, requirements, actualDeliverables, userInput) {
    const criticalIssues = issues.filter(i => i.severity === Severity.CRITICAL);
    const highIssues = issues.filter(i => i.severity === Severity.HIGH);
    const mediumIssues = issues.filter(i => i.severity === Severity.MEDIUM);

    let instructions = {
      priority: criticalIssues.length > 0 ? 'CRITICAL' : highIssues.length > 0 ? 'HIGH' : 'MEDIUM',
      summary: `Delivery Manager found ${issues.length} issue(s) that must be corrected`,
      specificCorrections: [],
      originalRequest: userInput,
      detailedFeedback: ''
    };

    // Build specific corrections array
    issues.forEach(issue => {
      const correction = {
        area: issue.area,
        problem: issue.description,
        fix: issue.recommendation.join('; '),
        severity: issue.severity
      };
      instructions.specificCorrections.push(correction);
    });

    // Build detailed feedback for Manager agent
    let feedback = `DELIVERY MANAGER FEEDBACK - PRECISION CORRECTIONS REQUIRED:\n\n`;
    feedback += `Original request: "${userInput}"\n\n`;

    if (criticalIssues.length > 0) {
      feedback += `🚨 CRITICAL ISSUES (must fix):\n`;
      criticalIssues.forEach((issue, idx) => {
        feedback += `${idx + 1}. ${issue.title}\n`;
        feedback += `   Problem: ${issue.description}\n`;
        feedback += `   Fix: ${issue.recommendation.join('; ')}\n\n`;
      });
    }

    if (highIssues.length > 0) {
      feedback += `⚠️  HIGH PRIORITY ISSUES:\n`;
      highIssues.forEach((issue, idx) => {
        feedback += `${idx + 1}. ${issue.title}\n`;
        feedback += `   Problem: ${issue.description}\n`;
        feedback += `   Fix: ${issue.recommendation.join('; ')}\n\n`;
      });
    }

    if (mediumIssues.length > 0) {
      feedback += `📋 MEDIUM PRIORITY ISSUES:\n`;
      mediumIssues.forEach((issue, idx) => {
        feedback += `${idx + 1}. ${issue.title}\n`;
        feedback += `   Problem: ${issue.description}\n`;
        feedback += `   Fix: ${issue.recommendation.join('; ')}\n\n`;
      });
    }

    // Add specific naming guidance
    const namingIssues = issues.filter(i => i.area === 'naming');
    if (namingIssues.length > 0) {
      feedback += `\n📝 NAMING INSTRUCTIONS:\n`;
      const themeMatch = userInput.match(/\b(whale|cat|dog|car|game|app|website|[\w]+)\b/i);
      const theme = themeMatch ? themeMatch[1].toLowerCase() : 'project';
      feedback += `All files MUST include descriptive names related to "${theme}".\n`;
      feedback += `DO NOT use generic names like "output.png", "image.png", "file.txt".\n`;
      feedback += `CORRECT examples: ${theme}.png, ${theme}.txt, ${theme}_website/\n`;
      feedback += `INCORRECT examples: output.png, file.txt, temp/\n\n`;
    }

    // Add expected vs actual summary
    feedback += `\n📊 EXPECTED vs ACTUAL:\n`;
    if (requirements.expected_files && requirements.expected_files.length > 0) {
      feedback += `Expected files: ${requirements.expected_files.map(f => f.name).join(', ')}\n`;
    }
    feedback += `Actual files: ${actualDeliverables.files.map(f => f.name).join(', ')}\n`;

    if (requirements.expected_folders && requirements.expected_folders.length > 0) {
      feedback += `Expected folders: ${requirements.expected_folders.map(f => f.name).join(', ')}\n`;
    }
    if (actualDeliverables.folders.length > 0) {
      feedback += `Actual folders: ${actualDeliverables.folders.map(f => f.name).join(', ')}\n`;
    }

    feedback += `\n🎯 CORRECTIVE ACTION REQUIRED:\n`;
    feedback += `Regenerate deliverables with EXACT specifications above.\n`;
    feedback += `Focus on PRECISION and ACCURACY - every filename must be meaningful and descriptive.\n`;

    instructions.detailedFeedback = feedback;

    return instructions;
  }

  /**
   * Generate fix instructions using consensus (HIGH PRIORITY)
   * Analyzes issues and creates targeted fix request for Manager agent
   */
  async generateFixInstructionsWithConsensus({ issues, requirements, actualDeliverables, userInput, traceId }) {
    this.info({ traceId, issueCount: issues.length }, "Generating fix instructions with LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel: "consensus",
        system: `You are a delivery quality expert generating precise fix instructions for a project manager.

Analyze the delivery issues and create targeted, actionable fix instructions that:
1. Identify EXACTLY what went wrong
2. Specify PRECISELY what needs to be corrected
3. Provide DETAILED requirements for regeneration
4. Focus on PRECISION and ACCURACY over speed

Be extremely specific about file names, folder structures, and content requirements.`,
        user: `Original Request: "${userInput}"

ISSUES FOUND:
${issues.map((issue, idx) => `
${idx + 1}. [${issue.severity}] ${issue.title}
   Problem: ${issue.description}
   Recommendation: ${issue.recommendation.join('; ')}
   Area: ${issue.area}
`).join('\n')}

EXPECTED DELIVERABLES:
${JSON.stringify(requirements, null, 2)}

ACTUAL DELIVERABLES:
Files: ${actualDeliverables.files.map(f => f.name).join(', ')}
Folders: ${actualDeliverables.folders.map(f => f.name).join(', ')}

Generate detailed fix instructions that the Manager agent can use to regenerate with precision.`,
        schema: {
          name: "fix_instructions",
          schema: {
            type: "object",
            required: ["priority", "specific_fixes", "naming_requirements", "structure_requirements", "regeneration_command"],
            properties: {
              priority: {
                type: "string",
                enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                description: "Overall priority level"
              },
              specific_fixes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    issue: { type: "string" },
                    current_state: { type: "string" },
                    required_state: { type: "string" },
                    action: { type: "string" }
                  }
                },
                description: "Specific fixes needed"
              },
              naming_requirements: {
                type: "object",
                properties: {
                  theme: { type: "string" },
                  required_files: {
                    type: "array",
                    items: { type: "string" }
                  },
                  forbidden_names: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                description: "Precise naming requirements"
              },
              structure_requirements: {
                type: "object",
                properties: {
                  folders: {
                    type: "array",
                    items: { type: "string" }
                  },
                  organization: { type: "string" }
                },
                description: "Required folder structure"
              },
              regeneration_command: {
                type: "string",
                description: "Precise command/instruction for regeneration"
              }
            }
          }
        },
        temperature: 0.0
      });

      const fixData = result.consensus;

      // Format into actionable instruction string
      let instruction = `\n${'='.repeat(80)}\nDELIVERY MANAGER PRECISION FIX REQUEST (Consensus-Based)\n${'='.repeat(80)}\n\n`;
      instruction += `Priority: ${fixData.priority}\n\n`;
      
      instruction += `SPECIFIC FIXES REQUIRED:\n`;
      fixData.specific_fixes.forEach((fix, idx) => {
        instruction += `${idx + 1}. ${fix.issue}\n`;
        instruction += `   Current: ${fix.current_state}\n`;
        instruction += `   Required: ${fix.required_state}\n`;
        instruction += `   Action: ${fix.action}\n\n`;
      });

      instruction += `NAMING REQUIREMENTS (STRICT):\n`;
      instruction += `Theme: ${fixData.naming_requirements.theme}\n`;
      instruction += `Required Files: ${fixData.naming_requirements.required_files.join(', ')}\n`;
      instruction += `Forbidden Names: ${fixData.naming_requirements.forbidden_names.join(', ')}\n\n`;

      instruction += `STRUCTURE REQUIREMENTS:\n`;
      instruction += `Folders: ${fixData.structure_requirements.folders.join(', ')}\n`;
      instruction += `Organization: ${fixData.structure_requirements.organization}\n\n`;

      instruction += `REGENERATION INSTRUCTION:\n`;
      instruction += `${fixData.regeneration_command}\n\n`;

      instruction += `PRECISION MANDATE:\n`;
      instruction += `- Every file MUST have a meaningful, descriptive name\n`;
      instruction += `- Every folder MUST reflect its purpose\n`;
      instruction += `- NO generic names allowed (output.png, file.txt, temp/, etc.)\n`;
      instruction += `- Focus on ACCURACY over SPEED\n`;
      instruction += `${'='.repeat(80)}\n`;

      this.info({
        traceId,
        priority: fixData.priority,
        fixCount: fixData.specific_fixes.length,
        consensusConfidence: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + '%'
      }, "Fix instructions generated with consensus");

      return {
        instruction,
        structured: fixData,
        consensusMetadata: {
          modelsUsed: result.metadata.totalSuccessful,
          confidence: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + '%'
        }
      };

    } catch (err) {
      this.error({ traceId, error: err.message }, "Consensus fix instruction generation failed, using fallback");
      // Fallback to simple instruction
      const fallbackInstructions = this.generateFixInstructions(issues, requirements, actualDeliverables, userInput);
      return {
        instruction: fallbackInstructions.detailedFeedback,
        structured: null,
        consensusMetadata: null
      };
    }
  }
}
