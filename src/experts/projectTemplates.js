/**
 * Project Template Requirements Database
 * Ensures the planner knows ALL required files for each project type
 * 
 * Usage: Manager agent checks this database before planning
 * Result: No missing files like .env, schemas, docs, etc.
 */

export const PROJECT_TEMPLATES = {
  "web-app": {
    description: "Complete web application (frontend + backend + database)",
    requiredFiles: {
      frontend: [
        { name: "index.html", type: "file", required: true, description: "Main HTML page" },
        { name: "style.css", type: "file", required: true, description: "Styling" },
        { name: "app.js", type: "file", required: true, description: "Frontend logic" }
      ],
      backend: [
        { name: "server.js", type: "file", required: true, description: "Express API server" },
        { name: "package.json", type: "file", required: true, description: "Dependencies" },
        { name: ".env.example", type: "file", required: true, description: "Configuration template" }
      ],
      database: [
        { name: "schema.sql", type: "file", required: true, description: "Database schema" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "Project overview" },
        { name: "SETUP_GUIDE.md", type: "file", required: true, description: "Installation guide" },
        { name: "API_REFERENCE.md", type: "file", required: true, description: "API endpoints" },
        { name: "USER_MANUAL.md", type: "file", required: true, description: "User guide" },
        { name: "DEPLOYMENT_GUIDE.md", type: "file", required: true, description: "Deployment instructions" },
        { name: "UI_CHECKLIST.md", type: "file", required: true, description: "UI completion checklist" },
        { name: "STYLE_GUIDE.md", type: "file", required: true, description: "Visual style guidelines" },
        { name: "ENTERPRISE_CHECKLIST.md", type: "file", required: true, description: "Enterprise readiness checklist" }
      ]
    },
    agentsNeeded: {
      security: true,
      qa: true,
      legal: false,
      consensusLevel: "consensus"
    }
  },

  "pizza-delivery": {
    description: "Pizza delivery web application (specialized web-app)",
    inherits: "web-app",
    requiredFiles: {
      frontend: [
        { name: "index.html", type: "file", required: true, description: "Menu, cart, orders" },
        { name: "style.css", type: "file", required: true, description: "Responsive design" },
        { name: "app.js", type: "file", required: true, description: "Order logic, cart management" }
      ],
      backend: [
        { name: "server.js", type: "file", required: true, description: "Express API with auth, menu, orders, rewards" },
        { name: "package.json", type: "file", required: true, description: "express, pg, jwt, stripe, nodemailer, etc." },
        { name: ".env.example", type: "file", required: true, description: "DB, JWT, Stripe, email config" }
      ],
      database: [
        { name: "schema.sql", type: "file", required: true, description: "users, orders, menu_items, rewards, promotions tables" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "Features, tech stack, quick start" },
        { name: "SETUP_GUIDE.md", type: "file", required: true, description: "Database setup, installation" },
        { name: "USER_MANUAL.md", type: "file", required: true, description: "Customer & admin guide" },
        { name: "API_REFERENCE.md", type: "file", required: true, description: "All endpoints documented" },
        { name: "HOW_TO_SETUP.md", type: "file", required: true, description: "5-minute quick setup" },
        { name: "DEPLOYMENT_GUIDE.md", type: "file", required: true, description: "Production deployment" }
      ]
    },
    agentsNeeded: {
      security: true,
      qa: true,
      legal: true,
      consensusLevel: "consensus"
    },
    moreFiles: [
      { name: "PROJECT_COMPLETE.md", type: "file", required: true, description: "Delivery summary" }
    ]
  },

  "calculator": {
    description: "Simple calculator web app",
    requiredFiles: {
      frontend: [
        { name: "index.html", type: "file", required: true, description: "Calculator UI" },
        { name: "style.css", type: "file", required: true, description: "Calculator styling" },
        { name: "app.js", type: "file", required: true, description: "Calculator logic" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "How to use" }
      ]
    },
    agentsNeeded: {
      security: false,
      qa: true,
      legal: false
    }
  },

  "game": {
    description: "Browser-based game",
    requiredFiles: {
      frontend: [
        { name: "index.html", type: "file", required: true, description: "Game canvas & UI" },
        { name: "style.css", type: "file", required: true, description: "Game styling" },
        { name: "game.js", type: "file", required: true, description: "Game logic" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "Game description & how to play" }
      ]
    },
    agentsNeeded: {
      security: false,
      qa: true,
      legal: false
    }
  },

  "rest-api": {
    description: "Backend REST API only",
    requiredFiles: {
      backend: [
        { name: "server.js", type: "file", required: true, description: "Express API" },
        { name: "package.json", type: "file", required: true, description: "Dependencies" },
        { name: ".env.example", type: "file", required: true, description: "Configuration" }
      ],
      database: [
        { name: "schema.sql", type: "file", required: true, description: "Database schema" }
      ],
      docs: [
        { name: "README.md", type: "file", required: true, description: "API overview" },
        { name: "API_REFERENCE.md", type: "file", required: true, description: "All endpoints" },
        { name: "SETUP_GUIDE.md", type: "file", required: true, description: "How to run" },
        { name: "DEPLOYMENT_GUIDE.md", type: "file", required: true, description: "Production setup" }
      ]
    },
    agentsNeeded: {
      security: true,
      qa: true,
      legal: false,
      consensusLevel: "consensus"
    }
  }
};

/**
 * Get all required files for a project type
 * @param projectType - Type of project (e.g., "pizza-delivery", "web-app")
 * @returns Object with all required files organized by category
 */
export function getProjectRequirements(projectType) {
  const template = PROJECT_TEMPLATES[projectType];
  
  if (!template) {
    console.warn(`Unknown project type: ${projectType}`);
    return null;
  }

  let allFiles = {};
  
  // If this template inherits from another, merge them
  if (template.inherits) {
    const parent = PROJECT_TEMPLATES[template.inherits];
    if (parent) {
      allFiles = JSON.parse(JSON.stringify(parent.requiredFiles));
    }
  }
  
  // Merge this template's files
  if (template.requiredFiles) {
    Object.keys(template.requiredFiles).forEach(category => {
      if (!allFiles[category]) {
        allFiles[category] = [];
      }
      // Merge, overwriting duplicates
      template.requiredFiles[category].forEach(file => {
        const existingIndex = allFiles[category].findIndex(f => f.name === file.name);
        if (existingIndex >= 0) {
          allFiles[category][existingIndex] = file;
        } else {
          allFiles[category].push(file);
        }
      });
    });
  }

  // Add any additional files
  if (template.moreFiles) {
    if (!allFiles.misc) allFiles.misc = [];
    allFiles.misc.push(...template.moreFiles);
  }

  return {
    description: template.description,
    requiredFiles: allFiles,
    agentsNeeded: template.agentsNeeded
  };
}

/**
 * Get a checklist of all required files
 */
export function getFileChecklist(projectType) {
  const reqs = getProjectRequirements(projectType);
  if (!reqs) return null;

  const checklist = [];
  Object.keys(reqs.requiredFiles).forEach(category => {
    reqs.requiredFiles[category].forEach(file => {
      checklist.push({
        category,
        name: file.name,
        required: file.required,
        description: file.description
      });
    });
  });

  return checklist;
}

/**
 * Validate that all required files exist
 */
export function validateProjectFiles(projectType, filesCreated) {
  const checklist = getFileChecklist(projectType);
  if (!checklist) return { valid: false, error: `Unknown project type: ${projectType}` };

  const missing = checklist.filter(item => !filesCreated.includes(item.name));
  
  return {
    valid: missing.length === 0,
    missing: missing,
    total: checklist.length,
    completed: checklist.length - missing.length
  };
}

/**
 * Display project requirements nicely
 */
export function displayProjectRequirements(projectType) {
  const reqs = getProjectRequirements(projectType);
  if (!reqs) {
    console.log(`❌ Unknown project type: ${projectType}`);
    return;
  }

  console.log(`\n📦 PROJECT TYPE: ${projectType}`);
  console.log(`📝 Description: ${reqs.description}`);
  console.log(`\n📋 REQUIRED FILES:\n`);

  Object.keys(reqs.requiredFiles).forEach(category => {
    console.log(`  📁 ${category.toUpperCase()}:`);
    reqs.requiredFiles[category].forEach(file => {
      const icon = file.required ? "✅" : "⭕";
      console.log(`    ${icon} ${file.name} - ${file.description}`);
    });
  });

  console.log(`\n🔒 AGENTS NEEDED:`);
  console.log(`   Security: ${reqs.agentsNeeded.security ? "YES" : "NO"}`);
  console.log(`   QA: ${reqs.agentsNeeded.qa ? "YES" : "NO"}`);
  console.log(`   Legal: ${reqs.agentsNeeded.legal ? "YES" : "NO"}`);
}
