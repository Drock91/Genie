/**
 * Database Architect Agent
 * Designs and generates database schemas, migrations, ORM configurations
 * 
 * This is the CRITICAL PATH - everything depends on database design
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

export class DatabaseArchitectAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "DatabaseArchitect", ...opts });
    this.multiLlmSystem = opts.multiLlmSystem;
  }

  /**
   * Main entry point - design complete database schema
   */
  async designSchema(requirements, preferences = {}) {
    const { traceId = "", iteration = 1 } = preferences;
    
    this.info({ traceId, iteration }, "Analyzing database requirements");

    try {
      // Step 1: Analyze requirements to determine entities
      const analysis = await this.analyzeRequirements(requirements.description || requirements);
      
      this.info({ traceId }, "Selecting database type");
      
      // Step 2: Choose appropriate database
      const dbChoice = await this.chooseDatabase(analysis);
      
      this.info({ traceId }, "Generating schema in multiple formats");
      
      // Step 3: Generate schemas in different formats
      const sqlSchema = this.generateSqlSchema(analysis.entities);
      const prismaSchema = this.generatePrismaSchema(analysis.entities, dbChoice.recommended);
      const typescriptTypes = this.generateTypescriptTypes(analysis.entities);
      const seedData = this.generateSeedData(analysis.entities);
      const migrations = this.generateMigrations(sqlSchema);
      
      // Step 4: Generate documentation
      const documentation = this.generateDocumentation(analysis, dbChoice);
      
      this.info({ traceId }, "Database schema design complete");
      
      return makeAgentOutput({
        summary: `Database schema designed for ${dbChoice.recommended} with ${analysis.entities.length} entities`,
        patches: [
          { 
            type: 'file', 
            path: 'schema.sql', 
            content: sqlSchema,
            description: 'Raw SQL schema'
          },
          { 
            type: 'file', 
            path: 'prisma/schema.prisma', 
            content: prismaSchema,
            description: 'Prisma ORM schema'
          },
          { 
            type: 'file', 
            path: 'src/types/schema.ts', 
            content: typescriptTypes,
            description: 'TypeScript types'
          },
          { 
            type: 'file', 
            path: 'prisma/seed.ts', 
            content: seedData,
            description: 'Database seeding script'
          },
          { 
            type: 'file', 
            path: 'migrations/001_init.sql', 
            content: migrations,
            description: 'Initial migration'
          },
          { 
            type: 'file', 
            path: 'DATABASE.md', 
            content: documentation,
            description: 'Database documentation'
          }
        ],
        notes: [
          `✓ Schema designed for ${dbChoice.recommended}`,
          `✓ ${analysis.entities.length} entities defined`,
          `✓ Prisma ORM configured`,
          `✓ TypeScript types generated`,
          `✓ Migration files ready`,
          `✓ Relationships defined`,
          ...analysis.recommendations || []
        ],
        data: {
          entities: analysis.entities,
          dbType: dbChoice.recommended,
          ormChoice: dbChoice.ormChoice || 'prisma'
        }
      });
    } catch (error) {
      this.logger?.error({ error: error.message }, "Database design failed");
      throw error;
    }
  }

  /**
   * Step 1: Analyze requirements via LLM consensus
   */
  async analyzeRequirements(userInput) {
    if (!this.multiLlmSystem) {
      return this.mockAnalyzeRequirements(userInput);
    }

    const prompt = `You are a database architect. Analyze these requirements and design a database:

Requirements: "${userInput}"

Determine:
1. What entities/tables are needed?
2. What fields for each entity?
3. What relationships exist between entities?
4. What should be indexed?
5. Any special constraints?

Return ONLY valid JSON (no markdown, no extra text):
{
  "entities": [
    {
      "name": "Entity name (PascalCase)",
      "description": "What this entity represents",
      "fields": [
        {
          "name": "fieldName",
          "type": "string|uuid|timestamp|boolean|integer|decimal|json",
          "required": true,
          "unique": false,
          "primaryKey": false,
          "default": null
        }
      ],
      "relationships": [
        {
          "field": "fieldName",
          "type": "many-to-one|one-to-many|many-to-many",
          "target": "TargetEntity",
          "cascadeDelete": false
        }
      ],
      "indexes": ["fieldName1", "fieldName2"]
    }
  ],
  "recommendations": [
    "Consider using JSONB for flexible data",
    "Add index on frequently queried fields"
  ]
}`;

    try {
      const result = await this.multiLlmSystem.consensusCall({
        prompt,
        profile: "accurate",
        temperature: 0.1,
        metadata: { agent: "DatabaseArchitect", action: "analyze_requirements" }
      });

      // Parse the response - it should be JSON
      if (typeof result === 'string') {
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return result;
    } catch (error) {
      this.logger?.error({ error: error.message }, "LLM analysis failed, using mock");
      return this.mockAnalyzeRequirements(userInput);
    }
  }

  /**
   * Fallback mock analysis if LLM fails
   */
  mockAnalyzeRequirements(userInput) {
    const hasUsers = /user|account|auth|profile|person/i.test(userInput);
    const hasTeams = /team|group|organization|company|workspace/i.test(userInput);
    const hasProjects = /project|task|work|sprint|item/i.test(userInput);
    const hasComments = /comment|discussion|message|feedback/i.test(userInput);

    const entities = [];

    // Always add User
    if (hasUsers) {
      entities.push({
        name: 'User',
        description: 'Application users',
        fields: [
          { name: 'id', type: 'uuid', required: true, unique: true, primaryKey: true },
          { name: 'email', type: 'string', required: true, unique: true },
          { name: 'password', type: 'string', required: true },
          { name: 'firstName', type: 'string', required: false },
          { name: 'lastName', type: 'string', required: false },
          { name: 'createdAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' }
        ],
        relationships: [],
        indexes: ['email']
      });
    }

    if (hasTeams) {
      entities.push({
        name: 'Team',
        description: 'Team or organization',
        fields: [
          { name: 'id', type: 'uuid', required: true, unique: true, primaryKey: true },
          { name: 'name', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'createdAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' }
        ],
        relationships: [],
        indexes: ['name']
      });

      if (hasUsers) {
        entities.push({
          name: 'TeamMember',
          description: 'Join table for User-Team relationship',
          fields: [
            { name: 'id', type: 'uuid', required: true, unique: true, primaryKey: true },
            { name: 'userId', type: 'uuid', required: true },
            { name: 'teamId', type: 'uuid', required: true },
            { name: 'role', type: 'string', required: true, default: 'member' },
            { name: 'createdAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' }
          ],
          relationships: [
            { field: 'userId', type: 'many-to-one', target: 'User', cascadeDelete: true },
            { field: 'teamId', type: 'many-to-one', target: 'Team', cascadeDelete: true }
          ],
          indexes: ['userId', 'teamId']
        });
      }
    }

    if (hasProjects) {
      entities.push({
        name: 'Project',
        description: 'Project or task workspace',
        fields: [
          { name: 'id', type: 'uuid', required: true, unique: true, primaryKey: true },
          ...(hasTeams ? [{ name: 'teamId', type: 'uuid', required: true }] : []),
          { name: 'name', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'status', type: 'string', required: true, default: 'active' },
          { name: 'createdAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', required: true, default: 'CURRENT_TIMESTAMP' }
        ],
        relationships: hasTeams ? [{ field: 'teamId', type: 'many-to-one', target: 'Team' }] : [],
        indexes: ['name', ...(hasTeams ? ['teamId'] : [])]
      });
    }

    return {
      entities,
      recommendations: [
        'Consider pagination for list queries',
        'Add indexes on frequently filtered fields'
      ]
    };
  }

  /**
   * Step 2: Choose database type
   */
  async chooseDatabase(analysis) {
    if (!this.multiLlmSystem) {
      // Default to PostgreSQL for most cases
      return {
        recommended: 'postgresql',
        reasoning: 'PostgreSQL provides ACID compliance, relationships, and scalability',
        ormChoice: 'prisma'
      };
    }

    const prompt = `Choose the best database for this schema:

Entities: ${analysis.entities.map(e => e.name).join(', ')}
Entity count: ${analysis.entities.length}

Options:
1. PostgreSQL - relational, ACID, complex queries, scalable
2. MongoDB - document-based, flexible schema
3. MySQL - cost-effective, widely supported

Return ONLY valid JSON:
{
  "recommended": "postgresql",
  "reasoning": "Why this choice",
  "ormChoice": "prisma"
}`;

    try {
      const result = await this.multiLlmSystem.consensusCall({
        prompt,
        profile: "accurate",
        temperature: 0.1
      });

      if (typeof result === 'string') {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return result;
    } catch (error) {
      return {
        recommended: 'postgresql',
        reasoning: 'Default choice for relational data',
        ormChoice: 'prisma'
      };
    }
  }

  /**
   * Generate SQL CREATE statements
   */
  generateSqlSchema(entities) {
    let sql = '-- Generated Database Schema\n-- DO NOT EDIT MANUALLY\n\n';

    // Create tables
    for (const entity of entities) {
      sql += `CREATE TABLE "${entity.name.toLowerCase()}" (\n`;
      
      const fields = entity.fields.map(field => {
        let definition = `  ${field.name} ${this.sqlType(field)}`;
        
        if (field.primaryKey) {
          definition += ' PRIMARY KEY';
        } else if (field.unique) {
          definition += ' UNIQUE';
        }
        
        if (field.required) {
          definition += ' NOT NULL';
        }
        
        if (field.default) {
          definition += ` DEFAULT ${field.default}`;
        }
        
        return definition;
      });

      sql += fields.join(',\n');

      // Add foreign keys
      if (entity.relationships && entity.relationships.length > 0) {
        for (const rel of entity.relationships) {
          if (rel.type === 'many-to-one') {
            sql += `,\n  CONSTRAINT fk_${entity.name.toLowerCase()}_${rel.field} FOREIGN KEY (${rel.field}) REFERENCES "${rel.target.toLowerCase()}"(id)`;
            if (rel.cascadeDelete) {
              sql += ' ON DELETE CASCADE';
            }
          }
        }
      }

      sql += '\n);\n\n';
    }

    // Create indexes
    for (const entity of entities) {
      if (entity.indexes && entity.indexes.length > 0) {
        for (const idx of entity.indexes) {
          sql += `CREATE INDEX idx_${entity.name.toLowerCase()}_${idx} ON "${entity.name.toLowerCase()}"(${idx});\n`;
        }
      }
    }

    return sql;
  }

  /**
   * Generate Prisma schema
   */
  generatePrismaSchema(entities, dbType = 'postgresql') {
    let schema = `// This is your Prisma schema file.
// Learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${dbType === 'postgresql' ? 'postgresql' : dbType}"
  url      = env("DATABASE_URL")
}

`;

    for (const entity of entities) {
      schema += `model ${entity.name} {\n`;
      
      // Add all fields
      for (const field of entity.fields) {
        const isId = field.primaryKey ? ' @id @default(cuid())' : '';
        const isUnique = field.unique ? ' @unique' : '';
        const isDefault = field.default && !field.primaryKey ? ` @default(${field.default})` : '';
        const required = field.required ? '' : '?';
        
        schema += `  ${field.name}      ${this.prismaType(field.type)}${required}${isId}${isUnique}${isDefault}\n`;
      }
      
      // Add relationships
      if (entity.relationships) {
        for (const rel of entity.relationships) {
          if (rel.type === 'many-to-one') {
            const targetRelName = rel.target.toLowerCase();
            schema += `  ${targetRelName}     ${rel.target}     @relation(fields: [${rel.field}], references: [id]${rel.cascadeDelete ? ', onDelete: Cascade' : ''})\n`;
          }
        }
      }

      schema += `}\n\n`;
    }

    return schema;
  }

  /**
   * Generate TypeScript types
   */
  generateTypescriptTypes(entities) {
    let types = `// Generated from database schema
// DO NOT EDIT MANUALLY

`;

    for (const entity of entities) {
      types += `export interface ${entity.name} {\n`;
      
      for (const field of entity.fields) {
        const tsType = this.tsType(field);
        const optional = field.required ? '' : '?';
        types += `  ${field.name}${optional}: ${tsType};\n`;
      }
      
      types += `}\n\n`;
      
      // Create input type (for mutations)
      types += `export interface Create${entity.name}Input {\n`;
      for (const field of entity.fields) {
        if (!field.primaryKey && field.name !== 'createdAt' && field.name !== 'updatedAt') {
          const tsType = this.tsType(field);
          const optional = field.required ? '' : '?';
          types += `  ${field.name}${optional}: ${tsType};\n`;
        }
      }
      types += `}\n\n`;
    }

    return types;
  }

  /**
   * Generate seed data template
   */
  generateSeedData(entities) {
    let seed = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

`;

    for (const entity of entities) {
      const varName = entity.name.charAt(0).toLowerCase() + entity.name.slice(1);
      seed += `  // Create ${entity.name}\n`;
      seed += `  const ${varName} = await prisma.${varName.toLowerCase()}.create({\n`;
      seed += `    data: {\n`;
      
      for (const field of entity.fields) {
        if (!field.primaryKey && field.name !== 'createdAt' && field.name !== 'updatedAt') {
          const value = this.sampleValue(field);
          seed += `      ${field.name}: ${value},\n`;
        }
      }
      
      seed += `    }\n`;
      seed += `  });\n`;
      seed += `  console.log('${entity.name} created:', ${varName});\n\n`;
    }

    seed += `  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

    return seed;
  }

  /**
   * Generate migration SQL
   */
  generateMigrations(sqlSchema) {
    return sqlSchema;
  }

  /**
   * Generate documentation
   */
  generateDocumentation(analysis, dbChoice) {
    let doc = `# Database Schema Documentation

## Database Type
**${dbChoice.recommended}** - ${dbChoice.reasoning}

## Entities

`;

    for (const entity of analysis.entities) {
      doc += `### ${entity.name}
${entity.description || 'No description'}

**Fields:**
`;
      for (const field of entity.fields) {
        doc += `- \`${field.name}\` (\`${field.type}\`)${field.required ? ' - Required' : ' - Optional'}${field.unique ? ' - Unique' : ''}\n`;
      }

      if (entity.relationships && entity.relationships.length > 0) {
        doc += `\n**Relationships:**\n`;
        for (const rel of entity.relationships) {
          doc += `- ${rel.type} with \`${rel.target}\` via \`${rel.field}\`\n`;
        }
      }

      if (entity.indexes && entity.indexes.length > 0) {
        doc += `\n**Indexes:** ${entity.indexes.join(', ')}\n`;
      }

      doc += '\n';
    }

    if (analysis.recommendations) {
      doc += `## Recommendations\n`;
      for (const rec of analysis.recommendations) {
        doc += `- ${rec}\n`;
      }
    }

    return doc;
  }

  // Helper methods
  sqlType(field) {
    const map = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'uuid': 'UUID',
      'timestamp': 'TIMESTAMP',
      'boolean': 'BOOLEAN',
      'integer': 'INTEGER',
      'decimal': 'DECIMAL(10,2)',
      'json': 'JSONB'
    };
    return map[field.type] || 'VARCHAR(255)';
  }

  prismaType(fieldType) {
    const map = {
      'string': 'String',
      'text': 'String',
      'uuid': 'String',
      'timestamp': 'DateTime',
      'boolean': 'Boolean',
      'integer': 'Int',
      'decimal': 'Float',
      'json': 'Json'
    };
    return map[fieldType] || 'String';
  }

  tsType(field) {
    const map = {
      'string': 'string',
      'uuid': 'string',
      'timestamp': 'Date',
      'boolean': 'boolean',
      'integer': 'number',
      'decimal': 'number',
      'json': 'Record<string, any>'
    };
    return map[field.type] || 'any';
  }

  sampleValue(field) {
    const valueMap = {
      'string': `"Sample ${field.name}"`,
      'uuid': `"550e8400-e29b-41d4-a716-446655440000"`,
      'timestamp': 'new Date()',
      'boolean': 'true',
      'integer': '1',
      'decimal': '99.99',
      'json': '{}'
    };
    return valueMap[field.type] || `"sample"`;
  }
}

export default DatabaseArchitectAgent;
