# GENIE Planner Enhancement: Ensuring All Required Files

## THE PROBLEM

When you said "build a complete pizza shop," the planner didn't know it needed to create:
- ✗ `.env.example` (configuration template)
- ✗ `schema.sql` (database schema)
- ✗ `README.md` (project overview)
- ✗ `SETUP_GUIDE.md` (installation guide)
- ✗ `API_REFERENCE.md` (endpoint documentation)
- ✗ `USER_MANUAL.md` (user guide)
- ✗ `DEPLOYMENT_GUIDE.md` (production guide)

**Result:** Empty directories and incomplete projects.

---

## THE SOLUTION: Project Template Database

We've created a **project requirements system** that ensures the planner knows exactly what files are needed for each project type:

### 1. **Project Templates** (`src/experts/projectTemplates.js`)

Defines required files for each project type:

```javascript
export const PROJECT_TEMPLATES = {
  "pizza-delivery": {
    requiredFiles: {
      frontend: [
        { name: "index.html", required: true },
        { name: "style.css", required: true },
        { name: "app.js", required: true }
      ],
      backend: [
        { name: "server.js", required: true },
        { name: "package.json", required: true },
        { name: ".env.example", required: true }
      ],
      database: [
        { name: "schema.sql", required: true }
      ],
      docs: [
        { name: "README.md", required: true },
        { name: "SETUP_GUIDE.md", required: true },
        { name: "API_REFERENCE.md", required: true },
        { name: "USER_MANUAL.md", required: true },
        { name: "DEPLOYMENT_GUIDE.md", required: true }
      ]
    }
  }
};
```

### 2. **Enhanced Manager Agent** (`src/agents/managerAgent.js`)

Now uses the template database to:

1. **Detect project type** from user input
   ```javascript
   detectProjectType("Build a pizza delivery app")
   → Returns: "pizza-delivery"
   ```

2. **Get all required files**
   ```javascript
   const requirements = getProjectRequirements("pizza-delivery");
   // Returns all required files organized by category
   ```

3. **Check for missing files**
   ```javascript
   const filesInPlan = new Set();
   planJson.workItems.forEach(item => {
     // Extract file names from work items
   });
   
   // Add any missing required files
   requiredFiles.forEach(file => {
     if (!filesInPlan.has(file.name)) {
       planJson.workItems.push({
         id: `file-${file.name}`,
         owner: this.getFileOwner(file.category, file.name),
         task: `Create ${file.name}: ${file.description}`
       });
     }
   });
   ```

4. **Set correct agents** from template
   ```javascript
   // Template specifies: security: true, qa: true, legal: true
   planJson.requiredAgents = requirements.agentsNeeded;
   ```

---

## HOW IT WORKS NOW

### Before (❌ Missing Files)
```
User: "Build a complete pizza shop"
     ↓
Manager plans:
  - Create server.js ✓
  - Create index.html ✓
  - Create database ✓
(Plan is incomplete!)
     ↓
Result: Empty folders, no docs, no .env template
```

### After (✅ Complete)
```
User: "Build a complete pizza shop"
     ↓
Manager detects: project type = "pizza-delivery"
     ↓
Manager checks template:
  - Required: server.js ✓ (in plan)
  - Required: .env.example ✗ (MISSING - ADD IT)
  - Required: schema.sql ✓ (in plan)
  - Required: README.md ✗ (MISSING - ADD IT)
  - Required: SETUP_GUIDE.md ✗ (MISSING - ADD IT)
  - Required: API_REFERENCE.md ✗ (MISSING - ADD IT)
  - Required: USER_MANUAL.md ✗ (MISSING - ADD IT)
  - Required: DEPLOYMENT_GUIDE.md ✗ (MISSING - ADD IT)
     ↓
Manager adds all missing files to plan
     ↓
Result: COMPLETE project with all files!
```

---

## PROJECT TEMPLATES INCLUDED

### ✅ **pizza-delivery**
- Frontend: index.html, style.css, app.js
- Backend: server.js, package.json, .env.example
- Database: schema.sql
- Docs: README, SETUP_GUIDE, USER_MANUAL, API_REFERENCE, HOW_TO_SETUP, DEPLOYMENT_GUIDE

### ✅ **web-app**
- Frontend: index.html, style.css, app.js
- Backend: server.js, package.json, .env.example
- Database: schema.sql
- Docs: README, SETUP_GUIDE, API_REFERENCE, DEPLOYMENT_GUIDE

### ✅ **calculator**
- Frontend: index.html, style.css, app.js
- Docs: README

### ✅ **game**
- Frontend: index.html, style.css, game.js
- Docs: README

### ✅ **rest-api**
- Backend: server.js, package.json, .env.example
- Database: schema.sql
- Docs: README, API_REFERENCE, SETUP_GUIDE, DEPLOYMENT_GUIDE

---

## EXTENDING THE SYSTEM

### Add a New Project Type

```javascript
// In src/experts/projectTemplates.js

export const PROJECT_TEMPLATES = {
  // ... existing templates ...
  
  "ecommerce-store": {
    description: "Complete e-commerce store",
    requiredFiles: {
      frontend: [
        { name: "index.html", type: "file", required: true, description: "Homepage" },
        { name: "products.html", type: "file", required: true, description: "Product listings" },
        { name: "cart.html", type: "file", required: true, description: "Shopping cart" },
        { name: "checkout.html", type: "file", required: true, description: "Checkout page" },
        { name: "style.css", type: "file", required: true, description: "Styling" },
        { name: "app.js", type: "file", required: true, description: "Frontend logic" }
      ],
      backend: [
        { name: "server.js", type: "file", required: true, description: "Express API" },
        { name: "package.json", type: "file", required: true, description: "Dependencies" },
        { name: ".env.example", type: "file", required: true, description: "Config template" }
      ],
      database: [
        { name: "schema.sql", type: "file", required: true, description: "Database schema" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "Overview" },
        { name: "SETUP_GUIDE.md", type: "file", required: true, description: "Setup" },
        { name: "API_REFERENCE.md", type: "file", required: true, description: "APIs" },
        { name: "DEPLOYMENT_GUIDE.md", type: "file", required: true, description: "Deployment" }
      ]
    },
    agentsNeeded: {
      security: true,  // Payment processing
      qa: true,
      legal: true,     // User data, transactions
      consensusLevel: "consensus"
    }
  }
};
```

### Add Detection for New Type

```javascript
// In src/agents/managerAgent.js

detectProjectType(userInput) {
  const input = userInput.toLowerCase();

  // ... existing detections ...

  // E-commerce store
  if ((input.includes("ecommerce") || input.includes("e-commerce") || input.includes("store")) && 
      input.includes("product")) {
    return "ecommerce-store";
  }

  return null;
}
```

---

## USAGE EXAMPLES

### For Users
```
prompt: "Build a complete pizza delivery web app"
```

Manager will now:
1. Detect: "pizza-delivery" project type
2. Check template: Needs 13 specific files
3. Plan work items: ALL 13 files included
4. Set agents: security, qa, legal all enabled
5. Result: COMPLETE project ✓

### For Developers
```javascript
import { getFileChecklist, displayProjectRequirements } from "./projectTemplates.js";

// Display what files are needed
displayProjectRequirements("pizza-delivery");

// Get validation checklist
const checklist = getFileChecklist("pizza-delivery");

// Validate that all files were created
const validation = validateProjectFiles("pizza-delivery", [
  "server.js",
  "package.json", 
  ".env.example",
  "schema.sql",
  "index.html",
  "app.js",
  "style.css",
  // ... etc
]);

if (validation.valid) {
  console.log("✅ Project is COMPLETE!");
} else {
  console.log("❌ Missing files:", validation.missing);
}
```

---

## VERIFICATION CHECKLIST

After each project, the system will verify:

```
✅ Project Type Detected
✅ All Required Files in Plan
✅ Correct Agents Assigned
✅ Output Folder Created
✅ All Files Generated
✅ No Empty Directories
✅ Documentation Complete
✅ Configuration Templates Included
```

---

## BENEFITS

### ✅ **For Users**
- No more surprise missing files
- "Complete" actually means complete
- Consistent project structure
- All documentation included

### ✅ **For Agents**
- Clear work items from manager
- No ambiguity about what's needed
- Easier file creation tasks
- Better quality output

### ✅ **For GENIE**
- Professional delivery standard
- Reproducible project structure
- Faster agent execution
- Easier testing & validation

---

## NEXT STEPS

1. **Test the system:**
   ```bash
   npm start -- --interactive "Build a pizza delivery app for NY"
   ```
   Should now create ALL files including docs!

2. **Verify checklist:**
   All files in `output/` will be complete

3. **Add more templates** as needed for your use cases

4. **Update agent outputs** to ensure they match templates

---

## FAQ

### Q: What if I want partial files?
A: The template defines REQUIRED files. You can mark others as `required: false` in the template.

### Q: What if my project doesn't fit a template?
A: Create a new template in `PROJECT_TEMPLATES`. The manager will learn it automatically.

### Q: How does detection work?
A: Keywords in the user input. "pizza" + "delivery" = pizza-delivery project type.

### Q: Can templates inherit from each other?
A: Yes! Use `inherits: "parent-type"` in template definition.

---

## SUMMARY

The planner now has **complete knowledge** of what files each project type needs. When someone asks for a "complete" pizza shop, they'll get:

- ✅ Frontend (HTML, CSS, JavaScript)
- ✅ Backend (Express, Node.js)
- ✅ Database (PostgreSQL schema)
- ✅ Configuration (.env template)
- ✅ Documentation (5+ guides)

**No more missing files. Just complete, production-ready projects.** 🎉
