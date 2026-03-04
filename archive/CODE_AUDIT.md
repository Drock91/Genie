# GENIE Codebase Audit & Improvement Plan

## Executive Summary

Audit completed: **19 February 2026**  
Files analyzed: **40+ source files**  
Overall Code Health: **7.2/10** (Good, but room for improvement)

### Key Findings

✅ **Strengths:**
- Clean agent-based architecture
- Good separation of concerns (agents, LLM, utilities)
- Multi-LLM system well-organized
- Consistent output contracts
- Cost optimization built-in

❌ **Areas for Improvement (Priority Order):**

1. **CRITICAL** - Code Duplication (High impact, low effort)
   - Project name extraction logic repeated 3+ times
   - Folder extraction pattern repeated
   - Can consolidate to shared utility

2. **CRITICAL** - Error Handling (High impact, medium effort)
   - Missing try-catch blocks in key workflow paths
   - Insufficient error recovery mechanisms
   - Errors not always propagated properly

3. **HIGH** - Global State Management (High impact, high effort)
   - `global.currentAgent`, `global.llmUsageTracker` are anti-patterns
   - Should use dependency injection or context managers
   - Makes testing difficult

4. **HIGH** - Configuration Validation (Medium impact, low effort)
   - Config doesn't validate all required values
   - No default values for optional settings
   - No configuration schema

5. **HIGH** - File Organization (Low impact, medium effort)
   - workflow.js is 608 lines (should be <300)
   - index.js is 282 lines (should be <150)
   - Need to extract helper functions

6. **MEDIUM** - Logging & Debugging (Medium impact, medium effort)
   - Logger could track performance metrics
   - No structured error logging format
   - Missing debug logging in critical paths

7. **MEDIUM** - Type Safety (Low impact, high effort)
   - No JSDoc annotations on most functions
   - Parameter types not documented
   - Return types not specified

8. **MEDIUM** - Resource Management (Medium impact, low effort)
   - No cleanup/shutdown handlers
   - Potential file handle leaks
   - Process doesn't gracefully exit

9. **LOW** - Testing (Low impact, medium effort)
   - No unit tests visible
   - No integration tests
   - test scripts in package.json but no test files

10. **LOW** - Documentation (Low impact, low effort)
    - Missing function documentation
    - No architecture diagrams
    - Limited inline comments

---

## Detailed Improvements

### 1. ELIMINATE CODE DUPLICATION - Project Name Extraction

**Current State:** Logic repeated in `index.js` and `workflow.js`
```javascript
// index.js (lines 79-91)
function extractProjectName(userInput) {
  const patterns = [
    /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|called\s+)?["`']?(\w+)["`']?/i,
    ...
  ];
  ...
}

// workflow.js (lines 25-36) - DUPLICATE
function extractProjectName(userInput) {
  const patterns = [
    /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|called\s+)?["`']?(\w+)["`']?/i,
    ...
  ];
  ...
}
```

**Solution:** Create `src/util/inputParser.js`

---

### 2. IMPROVE ERROR HANDLING

**Issue:** workflow.js refinement path has no error recovery
```javascript
// Line 66 - should catch specific errors
const refinementResult = await agents.codeRefiner.refineExistingCode({
  userInput,
  projectPath,
  filePaths: []
});
// What if this fails mid-execution?
```

**Solution:** Add error recovery and validation

---

### 3. ELIMINATE GLOBAL STATE

**Current (Anti-pattern):**
```javascript
// index.js line 27
if (typeof global !== 'undefined') {
  global.currentAgent = this.name;  // Global state!
}

// workflow.js line 17
if (llmUsageTracker) {
  global.llmUsageTracker = llmUsageTracker;  // Global state!
}
```

**Solution:** Use agent context or state manager

---

### 4. CONSOLIDATE DUPLICATE PATTERNS

**Pattern 1 - Output folder extraction:** Appears in `index.js` and `workflow.js`
**Pattern 2 - Config requirements check:** Appears in `config.js` with minimal validation
**Pattern 3 - Provider registration:** All three providers use identical try-catch pattern

**Solutions:** Extract to shared utilities, reduce boilerplate

---

### 5. IMPROVE FILE ORGANIZATION

**workflow.js (608 lines)** needs splitting:
- Extract refinement logic → `workflow/refinementWorkflow.js`
- Extract iteration logic → `workflow/iterationManager.js`
- Extract reporting → `workflow/reportingEngine.js`

**index.js (282 lines)** needs cleaning:
- Extract argument parsing → `util/argumentParser.js`
- Extract system initialization → `util/systemInitializer.js`

---

### 6. ADD CONFIGURATION VALIDATION

**Current:** Only checks required keys, no type validation
```javascript
// config.js - minimal validation
export function getConfig() {
  const required = ["OPENAI_API_KEY"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  // No validation of values!
  return {
    env,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4-turbo",
    openaiTemp: Number(process.env.OPENAI_TEMPERATURE ?? "0.2"),  // Should validate range
    maxIterations: Number(process.env.MAX_ITERATIONS ?? "5"),
    ...
  };
}
```

**Solution:** Add schema validation with defaults and ranges

---

### 7. IMPROVE LOGGING

**Current:** Basic info/warn/error, no metrics
```javascript
export const logger = {
  info(meta = {}, msg = "") {
    writeLog("INFO", meta, msg);
  },
  // ... no performance tracking, no structured logging
};
```

**Solution:** Add performance tracking, structured logging format

---

### 8. ADD PERFORMANCE METRICS

**Missing:** No tracking of:
- Agent execution time per agent
- LLM call metrics (tokens, latency)
- File generation performance
- Memory usage
- Workflow total time

---

## Priority Implementation Order

### Phase 1 (High Impact, Low Effort) - 2-3 hours

1. ✅ Create `src/util/inputParser.js` - Consolidate text parsing logic
2. ✅ Create `src/util/configValidator.js` - Validate config with schema
3. ✅ Refactor `config.js` to use validator
4. ✅ Create `src/util/argumentParser.js` - Extract CLI arg parsing

### Phase 2 (High Impact, Medium Effort) - 4-6 hours

5. ✅ Eliminate global state - implement state manager
6. ✅ Split `workflow.js` into smaller modules
7. ✅ Improve error handling with recovery
8. ✅ Add cleanup/shutdown handlers

### Phase 3 (Medium Impact, Medium Effort) - 6-8 hours

9. ✅ Add comprehensive JSDoc annotations
10. ✅ Add performance metrics tracking
11. ✅ Improve logger with structured logging
12. ✅ Consolidate provider registration pattern

### Phase 4 (Low Impact, Can defer)

13. Migrate to TypeScript (low priority)
14. Add unit tests (important but time-consuming)
15. Add integration tests
16. Generate architecture documentation

---

## Quick Wins (Can Do Now)

| Task | Time | Impact |
|------|------|--------|
| Extract project name parser to util | 10min | High |
| Extract argument parser | 15min | High |
| Add config validation schema | 20min | High |
| Add missing JSDoc to 20 functions | 20min | Low |
| Improve logger error messages | 15min | Medium |
| **Total** | **80 min** | **High** |

---

## Code Quality Scores

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 8/10 | Well-structured agent system |
| Error Handling | 5/10 | Missing recovery in key paths |
| Code Organization | 6/10 | Some files too large, duplication |
| Logging | 6/10 | Basic but lacks structure |
| Configuration | 5/10 | Minimal validation |
| Performance | 7/10 | Cost optimization present |
| Documentation | 5/10 | Missing JSDoc, inline comments |
| Testing | 3/10 | No test files found |
| Security | 7/10 | No sensitive data logging |
| **Overall** | **6.2/10** | **Solid foundation, needs polish** |

---

## Recommendation

Start with **Phase 1** improvements (Quick Wins) - high impact, low effort:

1. **First**: Extract common parsing utilities (20 min)
2. **Second**: Improve config validation (15 min)
3. **Third**: Add error recovery (30 min)

These changes will immediately improve:
- Code maintainability
- Bug prevention
- Configuration reliability
- Error debugging

Ready to implement? Let me know which phase to start with!
