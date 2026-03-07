/**
 * Task Completion Verifier Agent
 * 
 * Ensures that tasks are TRULY complete before GENIE finishes.
 * This is the "quality gate" that makes GENIE smart about knowing when it's done.
 * 
 * Responsibilities:
 * 1. Verify all requested outputs exist
 * 2. Check output quality meets requirements
 * 3. Identify any missing components
 * 4. Suggest remediation for incomplete work
 * 5. Determine if task is production-ready
 */

import { BaseAgent } from "./baseAgent.js";
import { consensusCall } from "../llm/multiLlmSystem.js";
import fs from "fs";
import path from "path";

export class TaskCompletionVerifierAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "TaskCompletionVerifier", ...opts });
  }

  /**
   * Verify that a task has been fully completed
   * @param {Object} params - Verification parameters
   * @returns {Object} Verification result with completeness assessment
   */
  async verifyCompletion({ 
    userInput, 
    taskAnalysis, 
    executedFiles, 
    outputPath,
    deliverables 
  }) {
    this.info({ 
      expectedOutputs: taskAnalysis?.expectedOutputs?.length,
      actualFiles: executedFiles?.length 
    }, "Verifying task completion");

    const checks = [];
    const issues = [];
    const suggestions = [];

    // 1. Check if expected file types were created
    const fileTypeCheck = this._checkFileTypes(taskAnalysis, executedFiles, outputPath);
    checks.push(fileTypeCheck);
    if (!fileTypeCheck.passed) {
      issues.push(...fileTypeCheck.issues);
      suggestions.push(...fileTypeCheck.suggestions);
    }

    // 2. Check if output content matches requirements
    const contentCheck = await this._checkContentRequirements(userInput, deliverables);
    checks.push(contentCheck);
    if (!contentCheck.passed) {
      issues.push(...contentCheck.issues);
      suggestions.push(...contentCheck.suggestions);
    }

    // 3. Check if special requirements were met (PDF, etc.)
    const specialCheck = this._checkSpecialRequirements(taskAnalysis, executedFiles);
    checks.push(specialCheck);
    if (!specialCheck.passed) {
      issues.push(...specialCheck.issues);
      suggestions.push(...specialCheck.suggestions);
    }

    // 4. Verify completeness via LLM assessment
    const llmCheck = await this._llmVerifyCompletion(userInput, taskAnalysis, deliverables);
    checks.push(llmCheck);
    if (!llmCheck.passed) {
      issues.push(...llmCheck.issues);
      suggestions.push(...llmCheck.suggestions);
    }

    // Calculate overall completion score
    const passedChecks = checks.filter(c => c.passed).length;
    const completionScore = Math.round((passedChecks / checks.length) * 100);
    const isComplete = completionScore >= 80 && issues.filter(i => i.severity === "CRITICAL").length === 0;

    const result = {
      isComplete,
      completionScore,
      checks,
      issues,
      suggestions,
      summary: this._generateSummary(isComplete, completionScore, issues)
    };

    this.info({ 
      isComplete, 
      completionScore, 
      issueCount: issues.length 
    }, "Completion verification finished");

    return result;
  }

  /**
   * Check if expected file types were created
   */
  _checkFileTypes(taskAnalysis, executedFiles, outputPath) {
    const issues = [];
    const suggestions = [];
    const expectedOutputs = taskAnalysis?.expectedOutputs || [];
    
    // Map expected outputs to file patterns
    const expectedPatterns = this._getExpectedFilePatterns(expectedOutputs);
    const actualFiles = executedFiles || [];

    // Also check filesystem if outputPath provided
    let filesOnDisk = [];
    if (outputPath && fs.existsSync(outputPath)) {
      filesOnDisk = this._getFilesRecursive(outputPath);
    }

    const allFiles = [...new Set([...actualFiles, ...filesOnDisk])];

    const missingTypes = [];
    for (const pattern of expectedPatterns) {
      const hasMatch = allFiles.some(f => this._matchesPattern(f, pattern));
      if (!hasMatch) {
        missingTypes.push(pattern.description);
        issues.push({
          severity: "WARNING",
          type: "missing_file_type",
          message: `Expected ${pattern.description} but none found`
        });
        suggestions.push(`Create ${pattern.description} to complete the task`);
      }
    }

    return {
      name: "file_types",
      passed: missingTypes.length === 0,
      issues,
      suggestions,
      details: {
        expected: expectedPatterns.map(p => p.description),
        found: allFiles.length,
        missing: missingTypes
      }
    };
  }

  /**
   * Get expected file patterns based on output types
   */
  _getExpectedFilePatterns(outputs) {
    const patterns = [];
    
    for (const output of outputs) {
      const outputLower = output.toLowerCase();
      
      if (outputLower.includes("code") || outputLower.includes("website")) {
        patterns.push({ pattern: /\.(html|js|css|ts|jsx|tsx)$/i, description: "code files" });
      }
      if (outputLower.includes("report") || outputLower.includes("document")) {
        patterns.push({ pattern: /\.(md|txt|pdf|doc)$/i, description: "report/document files" });
      }
      if (outputLower.includes("pdf")) {
        patterns.push({ pattern: /\.pdf$/i, description: "PDF file" });
      }
      if (outputLower.includes("image")) {
        patterns.push({ pattern: /\.(png|jpg|jpeg|gif|svg)$/i, description: "image files" });
      }
      if (outputLower.includes("data") || outputLower.includes("json")) {
        patterns.push({ pattern: /\.(json|csv|xml)$/i, description: "data files" });
      }
    }

    return patterns;
  }

  /**
   * Check if content meets requirements
   */
  async _checkContentRequirements(userInput, deliverables) {
    const issues = [];
    const suggestions = [];

    if (!deliverables || Object.keys(deliverables).length === 0) {
      issues.push({
        severity: "CRITICAL",
        type: "no_deliverables",
        message: "No deliverables found"
      });
      suggestions.push("Task produced no output - need to regenerate");
      return { name: "content_requirements", passed: false, issues, suggestions };
    }

    // Extract key requirements from user input
    const requirements = this._extractRequirements(userInput);
    
    // Check if deliverables mention these requirements
    const deliverableContent = JSON.stringify(deliverables).toLowerCase();
    const missingRequirements = [];

    for (const req of requirements) {
      if (!deliverableContent.includes(req.toLowerCase())) {
        missingRequirements.push(req);
      }
    }

    if (missingRequirements.length > 0) {
      issues.push({
        severity: "WARNING",
        type: "missing_requirements",
        message: `Some requirements may not be addressed: ${missingRequirements.join(", ")}`
      });
      suggestions.push(`Verify that these requirements are included: ${missingRequirements.join(", ")}`);
    }

    return {
      name: "content_requirements",
      passed: missingRequirements.length < requirements.length / 2,
      issues,
      suggestions,
      details: {
        totalRequirements: requirements.length,
        missingRequirements
      }
    };
  }

  /**
   * Extract requirements from user input
   */
  _extractRequirements(userInput) {
    const requirements = [];
    
    // Extract quoted strings
    const quotes = userInput.match(/"[^"]+"|'[^']+'/g) || [];
    requirements.push(...quotes.map(q => q.replace(/['"]/g, "")));

    // Extract key subjects
    const subjectPatterns = [
      /(?:about|for|regarding|on)\s+(\w+(?:\s+\w+){0,2})/gi,
      /(?:include|must have|should have|with)\s+(\w+(?:\s+\w+){0,3})/gi
    ];

    for (const pattern of subjectPatterns) {
      let match;
      while ((match = pattern.exec(userInput)) !== null) {
        requirements.push(match[1].trim());
      }
    }

    return [...new Set(requirements)];
  }

  /**
   * Check special requirements like PDF generation
   */
  _checkSpecialRequirements(taskAnalysis, executedFiles) {
    const issues = [];
    const suggestions = [];
    const specialReqs = taskAnalysis?.specialRequirements || {};

    if (specialReqs.wantsPdf) {
      const hasPdf = executedFiles?.some(f => f.endsWith(".pdf"));
      if (!hasPdf) {
        issues.push({
          severity: "CRITICAL",
          type: "missing_pdf",
          message: "PDF was requested but not generated"
        });
        suggestions.push("Generate PDF version of the output");
      }
    }

    if (specialReqs.isComprehensive) {
      // Check for multiple output files (comprehensive usually means detailed)
      if (!executedFiles || executedFiles.length < 2) {
        issues.push({
          severity: "WARNING",
          type: "not_comprehensive",
          message: "Comprehensive output requested but result seems minimal"
        });
        suggestions.push("Add more detail and supporting materials");
      }
    }

    return {
      name: "special_requirements",
      passed: issues.filter(i => i.severity === "CRITICAL").length === 0,
      issues,
      suggestions,
      details: specialReqs
    };
  }

  /**
   * LLM-based completion verification
   */
  async _llmVerifyCompletion(userInput, taskAnalysis, deliverables) {
    const issues = [];
    const suggestions = [];

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: `You are a task completion auditor. Determine if a task has been fully completed based on:
1. The original request
2. What was expected to be produced
3. What was actually produced

Be strict but fair. Consider:
- Were ALL requirements addressed?
- Is the output actionable and useful?
- Are there obvious gaps or omissions?
- Would a user consider this "done"?

Return JSON with:
- isComplete: boolean
- completionPercentage: number (0-100)
- missingElements: array of strings
- qualityIssues: array of strings
- suggestions: array of strings to improve`,
        user: `Verify completion:

ORIGINAL REQUEST:
${userInput}

EXPECTED OUTPUTS:
${JSON.stringify(taskAnalysis?.expectedOutputs || [])}

ACTUAL DELIVERABLES (summary):
${JSON.stringify(deliverables || {}, null, 2).substring(0, 2000)}

Is this task complete?`,
        temperature: 0.2
      });

      const assessment = result.consensus || {};
      
      if (assessment.missingElements?.length > 0) {
        issues.push({
          severity: "WARNING",
          type: "missing_elements",
          message: `Missing: ${assessment.missingElements.join(", ")}`
        });
      }

      if (assessment.suggestions?.length > 0) {
        suggestions.push(...assessment.suggestions);
      }

      return {
        name: "llm_verification",
        passed: assessment.isComplete !== false && (assessment.completionPercentage || 0) >= 80,
        issues,
        suggestions,
        details: assessment
      };

    } catch (err) {
      this.warn({ error: err.message }, "LLM verification failed");
      return {
        name: "llm_verification",
        passed: true, // Don't block on LLM failure
        issues: [],
        suggestions: [],
        details: { error: err.message }
      };
    }
  }

  /**
   * Generate verification summary
   */
  _generateSummary(isComplete, score, issues) {
    if (isComplete) {
      return `✅ Task is ${score}% complete. All critical requirements met.`;
    }
    
    const criticalCount = issues.filter(i => i.severity === "CRITICAL").length;
    const warningCount = issues.filter(i => i.severity === "WARNING").length;
    
    return `⚠️ Task is ${score}% complete. ${criticalCount} critical issue(s), ${warningCount} warning(s).`;
  }

  /**
   * Check if file matches pattern
   */
  _matchesPattern(filePath, pattern) {
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(filePath);
    }
    return filePath.includes(pattern.pattern);
  }

  /**
   * Get all files recursively from directory
   */
  _getFilesRecursive(dir) {
    const files = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...this._getFilesRecursive(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Directory doesn't exist or not readable
    }
    return files;
  }
}

export default TaskCompletionVerifierAgent;
