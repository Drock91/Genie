/**
 * Argument Parser Utilities
 * Handles CLI argument parsing and validation
 */

/**
 * Parse command-line arguments
 * @param {string[]} argv - Raw process.argv array (should be process.argv.slice(2))
 * @returns {Object} Parsed arguments object
 */
export function parseArguments(argv) {
  const parsed = {
    interactive: false,
    researchOnly: false,
    power: null,
    input: '',
    file: null,
    unknownArgs: []
  };

  if (!Array.isArray(argv)) {
    return parsed;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Check for flags
    if (arg === '--interactive' || arg === '-i') {
      parsed.interactive = true;
    } else if (arg === '--research-only' || arg === '--research' || arg === '-r') {
      parsed.researchOnly = true;
    } else if (arg.startsWith('--power=')) {
      parsed.power = arg.split('=')[1]?.toLowerCase() ?? null;
    } else if (arg === '--power') {
      parsed.power = argv[i + 1]?.toLowerCase() ?? null;
      i++; // Skip next arg since we consumed it
    } else if (arg.startsWith('--file=')) {
      parsed.file = arg.split('=')[1] ?? null;
    } else if (arg === '--file' || arg === '-f') {
      parsed.file = argv[i + 1] ?? null;
      i++; // Skip next arg since we consumed it
    } else if (arg.startsWith('--') || arg.startsWith('-')) {
      // Unknown flag
      parsed.unknownArgs.push(arg);
    } else {
      // Regular argument (user input)
      parsed.input += (parsed.input ? ' ' : '') + arg;
    }
  }

  return parsed;
}

/**
 * Validate parsed arguments
 * @param {Object} parsed - Result from parseArguments()
 * @returns {Object} Validation result with {valid: boolean, error: string|null}
 */
export function validateArguments(parsed) {
  // Allow either file or direct input
  if ((!parsed.input || parsed.input.trim().length === 0) && !parsed.file) {
    return {
      valid: false,
      error: 'No user input provided. Usage: npm start -- "build me X" OR npm start -- --file request.json'
    };
  }

  if (parsed.power && !['low', 'medium', 'high', 'maximum'].includes(parsed.power)) {
    return {
      valid: false,
      error: `Invalid power level: ${parsed.power}. Choose from: low, medium, high, maximum`
    };
  }

  return { valid: true, error: null };
}

/**
 * Get usage instructions
 * @returns {string} Help text
 */
export function getUsageText() {
  return `
GENIE - AI Company Builder
Usage: npm start -- "build me X" [options]

Options:
  --interactive, -i     Enable interactive mode
  --research-only, -r   Research mode: consensus analysis only (no code/file generation)
  --power=LEVEL         Set builder power level (low, medium, high, maximum)
  --file, -f FILE       Read request from JSON file (for multi-line inputs)
  
Examples:
  npm start -- "build a calculator app"
  npm start -- --interactive "build a todo app in the output folder"
  npm start -- --research-only "research topic X and summarize findings"
  npm start -- --power=high "create a e-commerce platform"
  npm start -- --file request.json
  `;
}
