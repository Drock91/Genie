import fs from "fs";
import path from "path";

/**
 * Persistent store for requests and results.
 * Enables request history, replay, and audit trail.
 */
export class RequestStore {
  constructor({ storageDir = "./requests", logger }) {
    this.storageDir = storageDir;
    this.logger = logger;
    this.ensureDir(storageDir);
  }

  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Save a complete workflow request and result
   */
  save(request) {
    const timestamp = new Date().toISOString();
    const id = request.traceId || `req-${Date.now()}`;
    const filename = `${id}.json`;
    const filePath = path.join(this.storageDir, filename);

    const data = {
      id,
      timestamp,
      userInput: request.userInput,
      traceId: request.traceId,
      iteration: request.iteration,
      success: request.success,
      plan: request.plan,
      results: request.results,
      errors: request.errors,
      executedFiles: request.executedFiles,
      duration: request.duration
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    this.logger?.info({ id, path: filename }, "Request saved");

    return { id, path: filePath };
  }

  /**
   * Load a previous request
   */
  load(id) {
    const filePath = path.join(this.storageDir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Request not found: ${id}`);
    }

    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  }

  /**
   * List all saved requests
   */
  list() {
    if (!fs.existsSync(this.storageDir)) {
      return [];
    }

    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith(".json"));
    const requests = [];

    for (const file of files) {
      const filePath = path.join(this.storageDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      requests.push({
        id: data.id,
        timestamp: data.timestamp,
        userInput: data.userInput,
        success: data.success,
        iteration: data.iteration
      });
    }

    return requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get metadata about stored requests
   */
  stats() {
    const requests = this.list();
    const successful = requests.filter(r => r.success).length;

    return {
      total: requests.length,
      successful,
      failed: requests.length - successful,
      successRate: requests.length > 0 ? (successful / requests.length * 100).toFixed(1) + "%" : "N/A"
    };
  }
}
