import fs from "fs";
import path from "path";

/**
 * Executes patches and actions from agents.
 * Converts agent outputs into actual file changes on disk.
 */
export class PatchExecutor {
  constructor({ workspaceDir = "./output", projectName = null, logger }) {
    // If projectName is provided, use output/<projectName> as workspaceDir
    if (projectName) {
      this.workspaceDir = path.join(workspaceDir, projectName);
    } else {
      this.workspaceDir = workspaceDir;
    }
    this.logger = logger;
    this.ensureDir(this.workspaceDir);
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Execute patches from agent outputs
   */
  async execute(patches, context = {}) {
    if (!patches || patches.length === 0) {
      this.logger?.info({}, "No patches to execute");
      return { executed: 0, files: [] };
    }

    const results = [];
    for (const patch of patches) {
      try {
        if (patch.type === "file" && patch.content) {
          const result = this.writeFile(patch);
          results.push(result);
        } else if (patch.diff) {
          // Handle unified diff format
          const result = this.applyDiff(patch.diff, context);
          results.push(result);
        }
      } catch (err) {
        this.logger?.error({ error: err.message, patch: patch.path }, "Patch execution failed");
        results.push({ path: patch.path, success: false, error: err.message });
      }
    }

    this.logger?.info({ count: results.length }, "Patches executed");
    return { executed: results.filter(r => r.success).length, files: results };
  }

  writeFile(patch) {
    const filePath = path.join(this.workspaceDir, patch.path);
    const fileDir = path.dirname(filePath);

    this.ensureDir(fileDir);

    // Handle base64 encoded content (e.g., images)
    if (patch.encoding === "base64") {
      const buffer = Buffer.from(patch.content, "base64");
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, patch.content, "utf-8");
    }

    this.logger?.info({ path: patch.path }, "File written");
    return { path: patch.path, success: true, fullPath: filePath };
  }

  /**
   * Simple unified diff parser (basic implementation)
   * Real implementation would use 'patch' command or library
   */
  applyDiff(diff, context = {}) {
    // Handle simple '*** Add File: <path>\n<content>' diffs
    const addFileMatch = diff.match(/^\*\*\* Add File: ([^\n]+)\n([\s\S]*)$/m);
    if (addFileMatch) {
      const relPath = addFileMatch[1].replace(/^output\//, "");
      const content = addFileMatch[2];
      const filePath = path.join(this.workspaceDir, relPath);
      try {
        this.ensureDir(path.dirname(filePath));
        fs.writeFileSync(filePath, content, "utf-8");
        this.logger?.info({ path: relPath, filePath, contentPreview: content.slice(0, 100) }, "File written (from diff, diagnostic)");
        return { path: relPath, success: true, fullPath: filePath };
      } catch (err) {
        this.logger?.error({ error: err.message, relPath, filePath }, "Error writing file in applyDiff");
        return { path: relPath, success: false, error: err.message };
      }
    }
    this.logger?.warn({ diffPreview: diff.slice(0, 200) }, "applyDiff: Diff did not match expected pattern");
    // For now, return a placeholder for other diff types
    return { success: false, message: "Diff application not yet implemented" };
  }

  /**
   * Get all files in output directory
   */
  listOutputs() {
    if (!fs.existsSync(this.workspaceDir)) {
      return [];
    }

    const walk = (dir) => {
      const files = [];
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          files.push({
            path: path.relative(this.workspaceDir, fullPath),
            fullPath,
            size: stat.size
          });
        } else if (stat.isDirectory()) {
          files.push(...walk(fullPath));
        }
      }

      return files;
    };

    return walk(this.workspaceDir);
  }
}
