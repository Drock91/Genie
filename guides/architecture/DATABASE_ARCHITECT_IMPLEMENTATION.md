# Database Architect Agent - Implementation Guide

## 🎯 Purpose
Generate production-ready database schemas, migrations, ORM configurations, and seed data based on application requirements. This is the **critical path blocker** - everything depends on the database design.

---

## 📋 Architecture

### Interface
```javascript
export class DatabaseArchitectAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "DatabaseArchitect", ...opts });
  }

  // Main entry point
  async designSchema(requirements, preferences = {}) {
    // Returns: schema, migrations, ORM config, documentation
  }

  // Support methods
  async analyzeRequirements(userInput) {}
  async chooseDatabase(requirements) {}
  async generateSchema(dbType, tables) {}
  async generateMigrations(currentState, desiredState) {}
  async generateOrmConfig(dbType, tables) {}
  async optimizeSchema(schema) {}
  async generateSeedData(schema) {}
}
```

---

## 🔧 Implementation Details

### 1. Requirements Analysis

```javascript
async analyzeRequirements(userInput) {
  const prompt = `
Analyze these requirements for database design needs:

Input: "${userInput}"

Determine:
1. What entities/tables are needed?
2. What relationships exist (1:1, 1:N, N:N)?
3. What fields for each entity?
4. Should be normalized or denormalized?
5. What indexes are needed?
6. Should consider: scalability, query patterns, read/write ratio

Return JSON:
{
  "entities": [
    {
      "name": "User",
      "fields": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "email", "type": "string", "unique": true },
        { "name": "password", "type": "string" },
        { "name": "createdAt", "type": "timestamp" }
      ],
      "relationships": [
        { "field": "teamId", "target": "Team", "type": "many-to-one" }
      ],
      "indexes": ["email"]
    }
  ],
  "recommendations": {
    "normalization": "3NF",
    "denormalization": ["user_team_count for performance"],
    "caching": "Redis for frequently accessed data"
  }
}`;
  
  return await this.consensusCall(prompt);
}
```

### 2. Database Type Selection

```javascript
async chooseDatabase(requirements) {
  const prompt = `
Choose the best database for these requirements:

Requirements: ${JSON.stringify(requirements)}

Analyze:
1. PostgreSQL: For relational, ACID, complex queries
2. MongoDB: For flexible schema, document-based
3. MySQL: Cost-effective, widely supported
4. Firebase: Serverless, real-time
5. DynamoDB: Key-value, serverless scale

Recommend one with justification:
{
  "recommended": "postgresql",
  "reasoning": "...",
  "alternatives": [{ "name": "mysql", "tradeoff": "..." }],
  "ormChoice": "prisma"  // or typeorm, sequelize, mongoose
}`;
  
  return await this.consensusCall(prompt);
}
```

### 3. Schema Generation - SQL Format

```javascript
async generateSqlSchema(entities) {
  // Generate CREATE TABLE statements
  const tables = entities.map(entity => {
    const fields = entity.fields
      .map(field => `${field.name} ${this._sqlType(field)} ${field.constraints || ''}`)
      .join(',\n  ');
    
    return `CREATE TABLE "${entity.name.toLowerCase()}" (
  ${fields},
  CONSTRAINT ${entity.name}_pk PRIMARY KEY (${entity.primaryKey})
);`;
  });
  
  // Generate indexes
  const indexes = entities.flatMap(entity => 
    entity.indexes?.map(idx => 
      `CREATE INDEX idx_${entity.name.toLowerCase()}_${idx} ON ${entity.name.toLowerCase()}(${idx});`
    ) || []
  );
  
  // Generate foreign keys
  const fks = entities.flatMap(entity =>
    entity.relationships?.filter(r => r.type === 'many-to-one')
      .map(r => `ALTER TABLE ${entity.name.toLowerCase()} 
        ADD CONSTRAINT fk_${r.field} 
        FOREIGN KEY (${r.field}) 
        REFERENCES ${r.target.toLowerCase()}(id);`)
  );
  
  return [...tables, ...indexes, ...fks].join('\n\n');
}

_sqlType(field) {
  const typeMap = {
    'string': 'VARCHAR(255)',
    'text': 'TEXT',
    'uuid': 'UUID',
    'timestamp': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'boolean': 'BOOLEAN',
    'integer': 'INTEGER',
    'decimal': 'DECIMAL(10,2)',
    'json': 'JSONB'
  };
  return typeMap[field.type] || 'VARCHAR(255)';
}
```

### 4. Prisma Schema Generation

```javascript
async generatePrismaSchema(entities, dbType = 'postgresql') {
  let schema = `// prisma/schema.prisma
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
    
    // Add fields
    for (const field of entity.fields) {
      const isId = field.primaryKey ? ' @id @default(cuid())' : '';
      const isUnique = field.unique ? ' @unique' : '';
      const isDefault = field.default ? ` @default(${field.default})` : '';
      
      schema += `  ${field.name}      ${this._prismaType(field.type)}${isId}${isUnique}${isDefault}\n`;
    }
    
    // Add relationships
    if (entity.relationships) {
      for (const rel of entity.relationships) {
        if (rel.type === 'many-to-one') {
          schema += `  ${rel.target.toLowerCase()}   ${rel.target}    @relation(fields: [${rel.field}], references: [id])\n`;
          schema += `  ${rel.field}         String\n`;
        } else if (rel.type === 'one-to-many') {
          schema += `  ${rel.related}       ${rel.relatedModel}[]\n`;
        }
      }
    }
    
    // Add timestamps
    schema += `  createdAt   DateTime @default(now())\n`;
    schema += `  updatedAt   DateTime @updatedAt\n`;
    
    schema += `}\n\n`;
  }
  
  return schema;
}

_prismaType(type) {
  const map = {
    'string': 'String',
    'text': 'String', // Use String with @db.Text
    'uuid': 'String',
    'timestamp': 'DateTime',
    'boolean': 'Boolean',
    'integer': 'Int',
    'decimal': 'Float',
    'json': 'Json'
  };
  return map[type] || 'String';
}
```

### 5. Migration Generation

```javascript
async generateMigrations(currentSchema, desiredSchema) {
  // Detect changes using Prisma or by comparison
  const migrations = [];
  
  // Create initial migration
  const initialMigration = `
-- CreateSchema
${desiredSchema}
  `.trim();
  
  // Timestamp-based naming
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  const migrationFile = `${timestamp}_init.sql`;
  
  migrations.push({
    filename: migrationFile,
    content: initialMigration
  });
  
  return migrations;
}
```

### 6. TypeScript Types Generation

```javascript
async generateTypes(entities) {
  let types = `// Generated types from schema\n\n`;
  
  for (const entity of entities) {
    types += `export interface ${entity.name} {\n`;
    
    for (const field of entity.fields) {
      const tsType = this._tsType(field);
      types += `  ${field.name}${field.nullable ? '?' : ''}: ${tsType};\n`;
    }
    
    types += `}\n\n`;
    
    types += `export interface Create${entity.name}Input {\n`;
    for (const field of entity.fields) {
      if (!field.primaryKey && field.name !== 'createdAt' && field.name !== 'updatedAt') {
        const tsType = this._tsType(field);
        types += `  ${field.name}${field.nullable ? '?' : ''}: ${tsType};\n`;
      }
    }
    types += `}\n\n`;
  }
  
  return types;
}

_tsType(field) {
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
```

### 7. Seed Data Generator

```javascript
async generateSeedData(entities) {
  let seedContent = `// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
`;

  for (const entity of entities) {
    seedContent += `
  // Create ${entity.name}
  const ${entity.name.toLowerCase()}1 = await prisma.${entity.name.toLowerCase()}.create({
    data: {
${this._generateSampleData(entity).join(',\n')}
    }
  });
`;
  }

  seedContent += `
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

  return seedContent;
}

_generateSampleData(entity) {
  return entity.fields
    .filter(f => !f.primaryKey && f.name !== 'createdAt' && f.name !== 'updatedAt')
    .map(f => {
      const value = this._sampleValue(f);
      return `      ${f.name}: ${value}`;
    });
}

_sampleValue(field) {
  const valueMap = {
    'string': `"Sample ${field.name}"`,
    'email': `"user@example.com"`,
    'uuid': `"550e8400-e29b-41d4-a716-446655440000"`,
    'timestamp': 'new Date()',
    'boolean': 'true',
    'integer': '1',
    'decimal': '99.99',
    'json': '{}'
  };
  return valueMap[field.type] || `"sample"`;
}
```

### 8. Main Design Entry Point

```javascript
async designSchema(requirements, preferences = {}) {
  this.info({ traceId: preferences.traceId }, "Analyzing requirements");
  
  // Step 1: Analyze requirements
  const analysis = await this.analyzeRequirements(requirements.description);
  
  // Step 2: Choose database
  this.info({}, "Selecting database type");
  const dbChoice = await this.chooseDatabase(analysis);
  
  // Step 3: Generate schemas in multiple formats
  this.info({}, "Generating schemas");
  
  const sqlSchema = this.generateSqlSchema(analysis.entities);
  const prismaSchema = await this.generatePrismaSchema(analysis.entities, dbChoice.recommended);
  const typescriptTypes = await this.generateTypes(analysis.entities);
  const seedData = await this.generateSeedData(analysis.entities);
  const migrations = await this.generateMigrations(null, sqlSchema);
  
  // Step 4: Optimize
  this.info({}, "Optimizing schema");
  const optimizations = await this.optimizeSchema(sqlSchema);
  
  // Step 5: Generate documentation
  const documentation = this._generateDocumentation(analysis, dbChoice);
  
  return makeAgentOutput({
    summary: `Database schema designed for ${dbChoice.recommended}`,
    patches: [
      { type: 'file', path: 'schema.sql', content: sqlSchema },
      { type: 'file', path: 'prisma/schema.prisma', content: prismaSchema },
      { type: 'file', path: 'types/schema.ts', content: typescriptTypes },
      { type: 'file', path: 'prisma/seed.ts', content: seedData },
      { type: 'file', path: 'migrations/001_init.sql', content: migrations[0].content }
    ],
    notes: [
      `✓ Schema generated for ${dbChoice.recommended}`,
      `✓ ${analysis.entities.length} entities created`,
      `✓ Prisma ORM configured`,
      `✓ TypeScript types included`,
      `✓ Seed data template included`,
      ...optimizations.recommendations
    ],
    data: {
      schema: sqlSchema,
      prismaSchema,
      entities: analysis.entities,
      dbChoice,
      optimizations
    }
  });
}

_generateDocumentation(analysis, dbChoice) {
  return `
# Database Schema Documentation

## Overview
${dbChoice.reasoning}

## Entities
${analysis.entities.map(e => `### ${e.name}\n${e.fields.map(f => `- ${f.name} (${f.type})`).join('\n')}`).join('\n\n')}

## Relationships
${this._drawErDiagram(analysis.entities)}

## Recommendations
${analysis.recommendations.denormalization?.map(d => `- Consider: ${d}`).join('\n') || ''}
  `.trim();
}

_drawErDiagram(entities) {
  // Simple ASCII ERD or reference to actual ERD generation
  return entities.map(e => {
    const rels = e.relationships?.map(r => `  → ${r.target} (${r.type})`).join('\n') || '';
    return `${e.name}\n${rels}`;
  }).join('\n\n');
}
```

---

## 🔌 Integration with Backend Coder Agent

Once Database Architect creates schema, Backend Coder can:
1. Read the Prisma schema
2. Auto-generate CRUD endpoints
3. Use TypeScript types from schema
4. Create database query layer
5. Add migrations to deployment

```javascript
// In BackendCoderAgent
async buildWithDatabase(plan, schemaPath) {
  // Read database schema
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Parse to understand entities
  const entities = this.parsePrismaSchema(schema);
  
  // Generate CRUD for each entity
  const crud = entities.map(e => this.generateCrudOperations(e));
  
  // Glue together into API layer
  return this.generateApiLayer(crud);
}
```

---

## 📊 Output Examples

### Input
```
"Build a project management app where users can create teams, 
invite members, create projects within teams, and assign tasks 
to team members with comments and attachments"
```

### Output - Prisma Schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  
  teamMemberships TeamMember[]
  tasks      Task[]
  comments   Comment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Team {
  id        String   @id @default(cuid())
  name      String
  
  members   TeamMember[]
  projects  Project[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TeamMember {
  id        String   @id @default(cuid())
  userId    String
  teamId    String
  role      String   // admin, member, viewer
  
  user      User     @relation(fields: [userId], references: [id])
  team      Team     @relation(fields: [teamId], references: [id])
  
  @@unique([userId, teamId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id        String   @id @default(cuid())
  teamId    String
  name      String
  description String?
  
  team      Team     @relation(fields: [teamId], references: [id])
  tasks     Task[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id        String   @id @default(cuid())
  projectId String
  assigneeId String?
  title     String
  description String?
  status    String   // todo, in-progress, done
  
  project   Project  @relation(fields: [projectId], references: [id])
  assignee  User?    @relation(fields: [assigneeId], references: [id])
  comments  Comment[]
  attachments Attachment[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  content   String
  
  task      Task     @relation(fields: [taskId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Attachment {
  id        String   @id @default(cuid())
  taskId    String
  filename  String
  url       String
  
  task      Task     @relation(fields: [taskId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Output - Generated SQL
```sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "team" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "team_member" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_member_user FOREIGN KEY (user_id) REFERENCES "user"(id),
  CONSTRAINT fk_team_member_team FOREIGN KEY (team_id) REFERENCES "team"(id),
  CONSTRAINT unique_user_team UNIQUE(user_id, team_id)
);

-- ... more tables ...

CREATE INDEX idx_team_member_user_id ON "team_member"(user_id);
CREATE INDEX idx_team_member_team_id ON "team_member"(team_id);
CREATE INDEX idx_task_project_id ON "task"(project_id);
CREATE INDEX idx_task_assignee_id ON "task"(assignee_id);
```

---

## 🎯 Next Steps

1. Create DatabaseArchitectAgent class in `src/agents/databaseArchitectAgent.js`
2. Add to agent registry
3. Test with example requirements
4. Integrate into workflow
5. Connect to BackendCoderAgent for API generation
6. Add to template system for pre-configured stacks

---

This agent becomes the **foundation** for building complete data-driven applications.
