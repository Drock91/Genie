export const ManagerPlanSchema = {
  name: "manager_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["kind", "workItems", "acceptanceCriteria", "requiredAgents", "consensusLevel"],
    properties: {
      kind: { type: "string", enum: ["text", "code"] },
      workItems: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "owner", "task"],
          properties: {
            id: { type: "string" },
            owner: { type: "string", enum: ["writer", "backend", "frontend"] },
            task: { type: "string" }
          }
        }
      },
      acceptanceCriteria: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      },
      requiredAgents: {
        type: "object",
        additionalProperties: false,
        required: ["security", "qa", "legal"],
        properties: {
          security: { type: "boolean" },
          qa: { type: "boolean" },
          legal: { type: "boolean" }
        }
      },
      consensusLevel: {
        type: "string",
        enum: ["single", "consensus"]
      }
    }
  }
};
export const WriterOutputSchema = {
  name: "writer_output",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "final"],
    properties: {
      summary: { type: "string" },
      final: { type: "string" }
    }
  }
};
