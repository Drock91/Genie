# Data Flow: How the Planner Now Ensures Complete Projects

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT                                   │
│      "Build a complete pizza delivery web app"                  │
└──────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            MANAGER AGENT (Enhanced)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. DETECT PROJECT TYPE                                  │   │
│  │    - Keyword matching: "pizza" + "delivery"             │   │
│  │    - Result: "pizza-delivery"                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. LOOKUP TEMPLATE DATABASE                             │   │
│  │    - Query PROJECT_TEMPLATES["pizza-delivery"]          │   │
│  │    - Get all required files (13 total)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 3. EXTRACT FILES FROM LLM PLAN                          │   │
│  │    - Parse work items from multi-LLM consensus          │   │
│  │    - Build Set of planned files                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 4. COMPARE TEMPLATE vs PLAN                             │   │
│  │    - server.js ✓ (in plan)                              │   │
│  │    - index.html ✓ (in plan)                             │   │
│  │    - schema.sql ✓ (in plan)                             │   │
│  │    - .env.example ✗ (MISSING)                           │   │
│  │    - README.md ✗ (MISSING)                              │   │
│  │    - SETUP_GUIDE.md ✗ (MISSING)                         │   │
│  │    - API_REFERENCE.md ✗ (MISSING)                       │   │
│  │    - USER_MANUAL.md ✗ (MISSING)                         │   │
│  │    - DEPLOYMENT_GUIDE.md ✗ (MISSING)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 5. ADD MISSING FILES TO PLAN                            │   │
│  │    - For each missing file:                             │   │
│  │      { id: "file-X", owner: "backend|writer|frontend"  │   │
│  │        task: "Create X: [description]" }                │   │
│  │    - Add all 6 missing files to workItems[]             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 6. UPDATE AGENTS FROM TEMPLATE                          │   │
│  │    - Template specifies required agents                 │   │
│  │    - security: true (payments, auth)                    │   │
│  │    - qa: true (critical for complete apps)             │   │
│  │    - legal: true (user data, payments)                 │   │
│  │    - consensusLevel: "consensus"                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
└──────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│           ENHANCED PLAN (19 work items total)                    │
│                                                                  │
│  FRONTEND:  { owner: "frontend", task: "Create index.html..." } │
│             { owner: "frontend", task: "Create style.css..." }  │
│             { owner: "frontend", task: "Create app.js..." }     │
│                                                                  │
│  BACKEND:   { owner: "backend", task: "Create server.js..." }   │
│             { owner: "backend", task: "Create package.json..." }│
│             { owner: "backend", task: "Create .env.example..." }│
│                                                                  │
│  DATABASE:  { owner: "backend", task: "Create schema.sql..." }  │
│                                                                  │
│  DOCS:      { owner: "writer", task: "Create README.md..." }    │
│             { owner: "writer", task: "Create SETUP_GUIDE..." }  │
│             { owner: "writer", task: "Create API_REF..." }      │
│             { owner: "writer", task: "Create USER_MANUAL..." }  │
│             { owner: "writer", task: "Create HOW_TO_SETUP..." } │
│             { owner: "writer", task: "Create DEPLOY_GUIDE..." } │
│                                                                  │
│  requiredAgents: { security: true, qa: true, legal: true }      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│               AGENT EXECUTION (Parallel)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │Frontend  │  │Backend   │  │Writer    │  │Database  │        │
│  │ Coder    │  │ Coder    │  │Agent     │  │Expert    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│       │              │              │              │            │
│  Creates:       Creates:       Creates:       Creates:         │
│  - index.html   - server.js    - README.md    - schema.sql     │
│  - style.css    - package.json - SETUP_GUIDE  - .env.example   │
│  - app.js       - .env.example - API_REF                        │
│                                - USER_MANUAL                    │
│                                - HOW_TO_SETUP                   │
│                                - DEPLOY_GUIDE                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  SECURITY AGENT (Reviews all files)                             │
│  QA AGENT (Tests all components)                                │
│  LEGAL AGENT (Reviews user data handling)                       │
│                                                                  │
│  Result: ✅ ALL CHECKS PASSED                                   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE OUTPUT FOLDER                              │
│                                                                  │
│  output/Orlando/                                                 │
│  ├── frontend/                                                   │
│  │   ├── index.html ✓                                            │
│  │   ├── style.css ✓                                             │
│  │   └── app.js ✓                                                │
│  ├── backend/                                                    │
│  │   ├── server.js ✓                                             │
│  │   ├── package.json ✓                                          │
│  │   └── .env.example ✓                                          │
│  ├── database/                                                   │
│  │   └── schema.sql ✓                                            │
│  └── docs/                                                       │
│      ├── README.md ✓                                             │
│      ├── SETUP_GUIDE.md ✓                                        │
│      ├── API_REFERENCE.md ✓                                      │
│      ├── USER_MANUAL.md ✓                                        │
│      ├── HOW_TO_SETUP.md ✓                                       │
│      └── DEPLOYMENT_GUIDE.md ✓                                   │
│                                                                  │
│  ALL 13 FILES COMPLETE ✅                                        │
│  NO EMPTY DIRECTORIES ✅                                         │
│  PRODUCTION READY ✅                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Data Structures

### 1. PROJECT_TEMPLATES Database

```javascript
PROJECT_TEMPLATES = {
  "pizza-delivery": {
    requiredFiles: {
      frontend: [ { name, required, description }, ... ],
      backend: [ { name, required, description }, ... ],
      database: [ { name, required, description }, ... ],
      docs: [ { name, required, description }, ... ]
    },
    agentsNeeded: {
      security: true/false,
      qa: true/false,
      legal: true/false,
      consensusLevel: "single" | "consensus"
    }
  }
}
```

### 2. Detection Logic

```javascript
function detectProjectType(userInput) {
  // "pizza" + "delivery" → "pizza-delivery"
  // "web app" + "database" → "web-app"
  // "game" → "game"
  // etc.
}
```

### 3. File Mapping

```javascript
function getFileOwner(category, fileName) {
  // frontend files → "frontend" agent
  // backend files → "backend" agent
  // docs files → "writer" agent
  // database files → "backend" agent
}
```

### 4. Validation

```javascript
function validateProjectFiles(projectType, filesCreated) {
  // Check all required files exist
  // Return: { valid, missing, total, completed }
}
```

---

## Example: How Files Are Added

### Before (Incomplete)

```javascript
const planJson = {
  workItems: [
    { id: "backend-1", owner: "backend", task: "Create Express server" },
    { id: "frontend-1", owner: "frontend", task: "Create HTML page" },
    { id: "database-1", owner: "backend", task: "Create database schema" }
  ]
};
```

### During (Check Template)

```javascript
const requirements = getProjectRequirements("pizza-delivery");
const requiredFiles = extractAllFilesFromTemplate(requirements);
// Result: [server.js, package.json, .env.example, schema.sql, 
//          index.html, style.css, app.js, README.md, SETUP_GUIDE.md, ...]

const filesInPlan = extractFilesFromWorkItems(planJson.workItems);
// Result: [server.js, index.html, schema.sql]

const missing = requiredFiles.filter(f => !filesInPlan.includes(f));
// Result: [package.json, .env.example, style.css, app.js, 
//          README.md, SETUP_GUIDE.md, API_REFERENCE.md, ...]
```

### After (Add Missing)

```javascript
missing.forEach(file => {
  planJson.workItems.push({
    id: `file-${file.name}`,
    owner: getFileOwner(file.category, file.name),
    task: `Create ${file.name}: ${file.description}`
  });
});

// Now planJson has ALL required work items!
```

---

## Cost Efficiency Improvements

### Before (Inefficient)
- User complains → Manual creation → Many back-and-forths
- Wasted agent time → Incomplete plans → Re-runs needed
- **Total cost:** High (multiple iterations)

### After (Efficient)
- Template checked automatically → All files planned upfront
- Agents execute complete plan once → No re-runs needed
- **Total cost:** Low (single efficient execution)

**Result: ✅ Faster, cheaper, more complete projects**

---

## Integration Points

### ManagerAgent
```javascript
async plan({ userInput, iteration, traceId }) {
  // 1. Detect project type
  const projectType = this.detectProjectType(userInput);
  
  // 2. Get requirements
  const requirements = getProjectRequirements(projectType);
  
  // 3. Plan and add missing files
  const planJson = await this.callLLMForInitialPlan(userInput);
  const enhancedPlan = this.ensureAllRequiredFilesInPlan(
    planJson, 
    requirements
  );
  
  // 4. Return complete plan
  return enhancedPlan;
}
```

### Agents (No Changes Needed)
- Receive complete work items from manager
- Execute without worrying about missing files
- Quality improves automatically

### Orchestrator (No Changes Needed)
- Receives complete task list
- Distributes to agents
- All files get created

---

## Summary

**The Planner Now:**
1. ✅ Knows what "complete" means for each project type
2. ✅ Detects project type from user input
3. ✅ Checks template requirements automatically
4. ✅ Adds any missing files to the plan
5. ✅ Assigns correct agents for each file
6. ✅ Sets proper review agents
7. ✅ Ensures nothing is forgotten

**Result: Complete, production-ready projects every time! 🎉**
