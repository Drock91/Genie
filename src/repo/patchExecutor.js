import fs from "fs";
import path from "path";

/**
 * Executes patches and actions from agents.
 * Converts agent outputs into actual file changes on disk.
 */
export class PatchExecutor {
  constructor({ workspaceDir = "./output", logger }) {
    this.workspaceDir = workspaceDir;
    this.logger = logger;
    this.ensureDir(workspaceDir);
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
    // For now, return a placeholder
    // In production, use git apply or patch-utils
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
