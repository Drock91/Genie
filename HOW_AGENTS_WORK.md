# How GENIE Agents Work Like GitHub Copilot

## Overview

GENIE now has **two modes** of operation:

1. **Generation Mode** - Creates new code from scratch
2. **Refinement Mode** - Reads existing code and makes targeted improvements

## 🎯 Refinement Mode (Like Copilot)

When you use keywords like "refine", "improve", "fix", "update", "change", or "modify" in your request, GENIE automatically:

1. **Detects** it's a refinement request
2. **Reads** all existing code files in the project
3. **Analyzes** what needs to change
4. **Makes targeted edits** while preserving everything else
5. **Applies** the changes to the actual files

### Example Refinement Requests

```bash
# Improve existing game visuals
npm start -- "refine the Metal or Die game to make the hit boxes more visible"

# Fix specific issues
npm start -- "fix the scoring system in video/video/script.js"

# Enhance features
npm start -- "improve the workout plan PDF formatting to include page breaks"

# Update styling
npm start -- "change the game colors to blue theme instead of red"

# Add functionality
npm start -- "modify the game to add a difficulty selector"
```

## 🆕 Generation Mode (Default)

When you use keywords like "build", "create", or "make", GENIE generates new code:

```bash
npm start -- "build a calculator app"
npm start -- "create a todo list with React"
```

## 🔍 How It Works Behind the Scenes

### Refinement Workflow

```
1. User Request → "refine video/video index.html to show hit boxes clearly"
   ↓
2. RequestRefinerAgent → Clarifies intent
   ↓
3. CodeRefinerAgent → 
   - Reads existing files (index.html, style.css, script.js)
   - Analyzes what needs to change
   - Uses multi-LLM consensus to ensure accuracy
   ↓
4. Generates Precise Edits →
   - Only modifies necessary parts
   - Preserves existing functionality
   - Maintains code style
   ↓
5. PatchExecutor → Writes updated files
   ↓
6. Result → Files are refined, not regenerated
```

### Key Differences

| Aspect | Generation Mode | Refinement Mode |
|--------|----------------|-----------------|
| **Trigger Words** | build, create, make | refine, improve, fix, update, modify |
| **File Handling** | Creates new files | Reads and modifies existing |
| **Context** | User description only | Full existing codebase |
| **Output** | Complete new code | Targeted patches |
| **Preservation** | N/A | Keeps working code intact |

## 🛠️ The Agents Involved

### CodeRefinerAgent (NEW)

- **Purpose**: Makes targeted improvements to existing code
- **Capabilities**:
  - Reads all code files in a project
  - Analyzes what needs changing
  - Makes precise, surgical edits
  - Preserves working functionality

### RequestRefinerAgent

- **Purpose**: Clarifies vague user requests
- **Works with**: Both generation and refinement modes
- **Improves**: Request precision before processing

### Manager, Backend, Frontend Agents

- **Purpose**: Generate new code from scratch
- **Used in**: Generation mode

## 📝 Technical Details

### How CodeRefinerAgent Works

**1. File Discovery**
```javascript
// Auto-detects all code files (.js, .html, .css, .json, etc.)
const files = codeRefiner.findCodeFiles('./output/Video/Video');
// → ['index.html', 'style.css', 'script.js']
```

**2. Content Reading**
```javascript
// Reads actual file contents
const fileContents = {
  'index.html': '<html>...</html>',
  'style.css': 'body { ... }',
  'script.js': 'class MetalOrDie { ... }'
};
```

**3. Change Analysis (Multi-LLM Consensus)**
```javascript
// Uses 3 AI models to agree on what should change
const analysis = await analyzeChangesNeeded(request, fileContents);
// Result:
{
  files_to_modify: [
    {
      file: 'style.css',
      changes: [
        'Center target zones at 50% screen height',
        'Increase border thickness to 5px',
        'Add glow effects'
      ]
    }
  ],
  reasoning: 'User wants better visibility...'
}
```

**4. Precise File Refinement**
```javascript
// For each file, generate refined version
const refined = await refineFile({
  filePath: 'style.css',
  originalContent: existingCSS,
  userRequest: request,
  changes: ['Center target zones...']
});
// → Returns complete updated CSS with ONLY the requested changes
```

**5. Patch Application**
```javascript
// Write the refined files back to disk
executor.execute([
  { type: 'file', path: 'style.css', content: refinedContent }
]);
```

## 🎮 Real Example: Metal or Die Refinement

**Your Request:**
```bash
npm start -- "refine video/video index.html for metal or die to show hit boxes clearly in the middle"
```

**What Happened:**

1. **Detected** refinement keywords ("refine")
2. **Found** existing project at `output/Video/Video/`
3. **Read** 3 files: index.html, style.css, script.js
4. **Analyzed** what needed changing:
   - Move target zones from bottom to center
   - Increase border visibility
   - Add glow effects
   - Update hit detection logic
5. **Generated** refined versions of style.css and script.js
6. **Preserved** everything else (HTML structure, game logic, etc.)
7. **Wrote** updated files

## 🚀 Making Your Own Refinement Requests

### Pattern to Follow

```bash
npm start -- "[action verb] [target] to [desired outcome]"
```

**Examples:**

```bash
# Specific file targeting
npm start -- "improve output/Video/Video/style.css to use a dark blue theme"

# Feature enhancement
npm start -- "refine the game to add a pause button"

# Bug fixing
npm start -- "fix the scoring bug where combos don't reset"

# Visual improvements
npm start -- "enhance the workout PDF to include images and better formatting"

# Performance optimization
npm start -- "optimize the note generation to be smoother"
```

### Best Practices

1. **Be specific** about what file/feature to change
2. **Use refinement verbs** to trigger the right mode
3. **Describe the desired outcome** clearly
4. **Mention the project name** if you have multiple projects

## 🔧 Advanced: Manual CodeRefiner Usage

You can also use the CodeRefinerAgent directly in code:

```javascript
import { CodeRefinerAgent } from './src/agents/codeRefinerAgent.js';

const refiner = new CodeRefinerAgent({ logger });

// Refine existing code
const result = await refiner.refineExistingCode({
  userInput: "make hit boxes bigger and centered",
  projectPath: "./output/Video/Video",
  filePaths: [] // Auto-detect all files
});

// Quick refine a single file
const quickResult = await refiner.quickRefine({
  filePath: "./output/Video/Video/style.css",
  userRequest: "change colors to blue theme"
});
```

## 📊 Comparison: Before vs After

### Before (Without CodeRefinerAgent)
```bash
npm start -- "make the game better"
→ Regenerates entire project from scratch
→ Loses all custom modifications
→ May break working features
```

### After (With CodeRefinerAgent)
```bash
npm start -- "improve the game visuals"
→ Reads existing files
→ Makes targeted CSS/style changes
→ Preserves all working game logic
→ Only modifies what's needed
```

## 🎯 Summary

**YES! GENIE agents can now work like GitHub Copilot:**

✅ Read existing code
✅ Make targeted improvements
✅ Preserve working functionality
✅ Iterate and refine
✅ Use multi-LLM consensus for accuracy

**How to use it:**
- Use **refine/improve/fix/update** keywords in your requests
- Point to existing projects
- Let the agents read → analyze → edit → apply changes

**What it does:**
- Reads all code files
- Analyzes what needs changing
- Makes precise edits
- Writes updated files
- Just like I do when you ask me to modify code!
