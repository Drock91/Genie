import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";
import { generateImage } from "../llm/openaiClient.js";
import { consensusCall } from "../llm/multiLlmSystem.js";

export class BackendCoderAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "BackendCoder", ...opts });
  }

  async build({ plan, traceId, iteration, userInput }) {
    this.info({ traceId, iteration }, "Producing backend changes");

    const backendItems = plan.workItems.filter(w => w.owner === "backend");
    if (backendItems.length === 0) {
      return makeAgentOutput({
        summary: "No backend work items",
        notes: [],
      });
    }

    const patches = [];
    const notes = [];

    const hasImageTasks = backendItems.some(item => {
      const task = item.task?.toLowerCase() || "";
      return task.includes("image") || task.includes("picture") || task.includes("generate");
    });

    const wantsSchema = backendItems.some(item => {
      const task = item.task?.toLowerCase() || "";
      const file = item.file?.toLowerCase() || "";
      return task.includes("schema.sql") || task.includes("database") || file.includes("schema.sql");
    });

    const hasStandardBackendWork = backendItems.some(item => {
      const task = item.task?.toLowerCase() || "";
      const file = item.file?.toLowerCase() || "";
      return task.includes("server.js") || task.includes("package.json") || task.includes(".env") ||
        file.includes("server.js") || file.includes("package.json") || file.includes(".env");
    });

    if (hasStandardBackendWork || wantsSchema) {
      try {
        const generated = await this.generateBackendFiles({
          userInput,
          workItems: backendItems,
          includeSchema: wantsSchema,
          consensusLevel: plan.consensusLevel || "single"
        });

        if (generated.server_js) {
          patches.push({
            type: "file",
            path: "backend/server.js",
            content: generated.server_js
          });
        }

        if (generated.package_json) {
          patches.push({
            type: "file",
            path: "backend/package.json",
            content: generated.package_json
          });
        }

        if (generated.env_example) {
          patches.push({
            type: "file",
            path: "backend/.env.example",
            content: generated.env_example
          });
        }

        if (generated.schema_sql) {
          patches.push({
            type: "file",
            path: "database/schema.sql",
            content: generated.schema_sql
          });
        }

        notes.push("✓ Generated backend files");
      } catch (err) {
        this.logger?.error({ error: err.message }, "Backend generation failed");
        notes.push(`✗ Backend generation failed: ${err.message}`);

        const fallback = this._getFallbackBackendFiles({ includeSchema: wantsSchema });
        patches.push(
          { type: "file", path: "backend/server.js", content: fallback.server_js },
          { type: "file", path: "backend/package.json", content: fallback.package_json },
          { type: "file", path: "backend/.env.example", content: fallback.env_example }
        );
        if (fallback.schema_sql) {
          patches.push({ type: "file", path: "database/schema.sql", content: fallback.schema_sql });
        }
      }
    }

    // Check if any work item is related to image generation
    for (const item of backendItems) {
      const task = (item.task || "").toLowerCase();
      if (task.includes("image") || task.includes("picture") || task.includes("generate")) {
        try {
          this.info({ traceId, iteration, taskId: item.id }, "Generating image");

          // Extract description and filename from task and userInput
          const imagePrompt = this._extractImagePrompt(item.task, userInput);
          let outputPath = item.file || this._extractOutputPath(item.task, userInput);
          // Remove any leading 'output/' or './output/' from path
          outputPath = outputPath.replace(/^\.?\/?output\//, "");

          const imageData = await generateImage({
            prompt: imagePrompt,
            logger: this.logger
          });

          // Create patch with base64 image
          patches.push({
            type: "file",
            path: outputPath,
            content: imageData.b64,
            encoding: "base64",
            description: `Generated image: ${imagePrompt}`
          });

          notes.push(`✓ Generated image: ${outputPath}`);
        } catch (err) {
          this.logger?.error({ error: err.message, taskId: item.id }, "Image generation failed");
          notes.push(`✗ Image generation failed: ${err.message}`);
        }
      }
    }

    return makeAgentOutput({
      summary: `Backend processed ${backendItems.length} work item(s)`,
      patches,
      notes
    });
  }

  async generateBackendFiles({ userInput, workItems, includeSchema, consensusLevel = "single" }) {
    const requested = workItems.map(w => w.task || w.file || "").join("\n");

    const schema = {
      name: "backend_files",
      schema: {
        type: "object",
        additionalProperties: false,
        required: includeSchema
          ? ["server_js", "package_json", "env_example", "schema_sql"]
          : ["server_js", "package_json", "env_example"],
        properties: {
          server_js: { type: "string" },
          package_json: { type: "string" },
          env_example: { type: "string" },
          schema_sql: { type: "string" }
        }
      }
    };

    const result = await consensusCall({
      profile: "balanced",
      consensusLevel,
      system: "You are an expert backend engineer. Produce production-ready Node.js/Express files and a PostgreSQL schema when requested. Return ONLY valid JSON.",
      user: `User request:\n${userInput}\n\nWork items:\n${requested}\n\nCreate:\n- server.js (Express API, modular routes, error handling)\n- package.json with scripts and dependencies\n- .env.example with required config\n${includeSchema ? "- schema.sql with tables, indexes, sample data\n" : ""}\nReturn JSON matching the schema.`,
      schema,
      temperature: 0.2
    });

    const payload = result.consensus || result;

    const fallbackServer = `import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
`;

    const fallbackPackage = `{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.4",
    "express": "^4.18.2"
  }
}
`;

    const fallbackEnv = `PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/app_db
JWT_SECRET=change_me
`;

    const fallbackSchema = `-- Database schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

    return {
      server_js: payload.server_js || fallbackServer,
      package_json: payload.package_json || fallbackPackage,
      env_example: payload.env_example || fallbackEnv,
      schema_sql: payload.schema_sql || (includeSchema ? fallbackSchema : "")
    };
  }

  _getFallbackBackendFiles({ includeSchema }) {
    const server_js = `import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
`;

    const package_json = `{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.4",
    "express": "^4.18.2"
  }
}
`;

    const env_example = `PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/app_db
JWT_SECRET=change_me
`;

    const schema_sql = `-- Database schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

    return {
      server_js,
      package_json,
      env_example,
      schema_sql: includeSchema ? schema_sql : ""
    };
  }

  _extractImagePrompt(task, userInput = "") {
    // First try to extract from userInput which has more context
    if (userInput) {
      const contextMatch = userInput.match(/(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i);
      if (contextMatch && contextMatch[1]) {
        const subject = contextMatch[1];
        // Make it more descriptive for DALL-E
        return `a detailed, high-quality image of ${subject}`;
      }
    }

    // Fallback to extracting from task
    const match = task.match(/(?:image|picture|generate)\s+(?:of\s+)?(?:a\s+)?(.+?)(?:\s+(?:and|in|to|as|file)|$)/i);
    return match ? match[1].trim() : "a beautiful scene";
  }

  _extractOutputPath(task, userInput = "") {
    // Try to extract filename from task (e.g., "whale.png", "myImage.jpg")
    const filenameMatch = task.match(/([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif))/i);
    if (filenameMatch) {
      return filenameMatch[1];
    }

    // Try to extract subject/theme from userInput first for more context
    if (userInput) {
      const subjectPatterns = [
        /(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i,
        /(\w+)\s+(?:PNG|image|picture|photo)/i,
        /(\w+)\.(?:txt|json|md)/i  // Also extract from file references
      ];

      for (const pattern of subjectPatterns) {
        const match = userInput.match(pattern);
        if (match && match[1]) {
          const subject = match[1].toLowerCase();
          // Skip generic words
          if (!['output', 'image', 'picture', 'photo', 'file', 'a', 'an', 'the'].includes(subject)) {
            this.info({ subject, source: 'userInput' }, "Extracted filename from context");
            return `${subject}.png`;
          }
        }
      }
    }

    // Fallback: try to extract from task
    const subjectPatterns = [
      /(?:create|generate|make)\s+(?:a\s+)?(\w+)\s+(?:PNG|image|picture|photo)/i,
      /(\w+)\s+(?:PNG|image|picture|photo)/i,
      /(?:about|themed|related to)\s+(\w+)/i
    ];

    for (const pattern of subjectPatterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        const subject = match[1].toLowerCase();
        // Skip generic words
        if (!['output', 'image', 'picture', 'photo', 'file', 'a', 'an', 'the'].includes(subject)) {
          return `${subject}.png`;
        }
      }
    }

    // Last resort: use "image.png" instead of "output.png"
    this.warn({ task, userInput }, "Could not extract meaningful filename, using 'image.png'");
    return "image.png";
  }

  /**
   * Analyze backend requirements using multi-LLM consensus
   */
  async analyzeRequirements(requirements, context = {}, consensusLevel = "single") {
    this.info({ requirements }, "Analyzing requirements with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        consensusLevel,
        system: "You are an expert backend architect analyzing requirements.",
        user: `Analyze these backend requirements and break them down:\n${requirements}`,
        schema: {
          name: "requirement_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["components", "technologies", "architecture"],
            properties: {
              components: {
                type: "array",
                items: { type: "string" }
              },
              technologies: {
                type: "array",
                items: { type: "string" }
              },
              architecture: { type: "string" }
            }
          }
        },
        temperature: 0.1
      });

      this.info({
        agreement: result.metadata.totalSuccessful / result.metadata.totalRequested,
        reasoning: result.reasoning
      }, "Requirements analysis complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Requirements analysis failed");
      throw err;
    }
  }

  /**
   * Generate backend code using multi-LLM consensus
   */
  async generateCode(requirements, context = {}) {
    this.info({ requirements }, "Generating backend code with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert backend developer writing production-quality code.",
        user: `Generate backend code for:\n${requirements}`,
        schema: {
          name: "backend_code",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["code", "language", "explanation"],
            properties: {
              code: { type: "string" },
              language: { type: "string" },
              explanation: { type: "string" }
            }
          }
        },
        temperature: 0.2
      });

      this.info({
        agreement: (result.metadata.totalSuccessful / result.metadata.totalRequested * 100).toFixed(1) + "%",
        models: result.metadata.totalSuccessful
      }, "Code generation complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code generation failed");
      throw err;
    }
  }

  /**
   * Review generated code using multi-LLM consensus
   */
  async reviewCode(code, context = {}) {
    this.info({ codeLength: code.length }, "Reviewing code with multi-LLM consensus");

    try {
      const result = await consensusCall({
        profile: "balanced",
        system: "You are an expert code reviewer checking for bugs, performance, and best practices.",
        user: `Review this backend code for issues, performance, and improvements:\n\n${code}`,
        schema: {
          name: "code_review",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["issues", "suggestions", "score"],
            properties: {
              issues: {
                type: "array",
                items: { type: "string" }
              },
              suggestions: {
                type: "array",
                items: { type: "string" }
              },
              score: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        temperature: 0.15
      });

      this.info({
        quality_score: result.consensus.score,
        reviewers: result.metadata.totalSuccessful
      }, "Code review complete");

      return result.consensus;
    } catch (err) {
      this.error({ error: err.message }, "Code review failed");
      throw err;
    }
  }
}

export default BackendCoderAgent;
