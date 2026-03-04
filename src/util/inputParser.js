/**
 * Input Parser Utilities
 * Consolidates text parsing logic used across the system
 */

/**
 * Extract project name from user input
 * @param {string} userInput - Raw user input text
 * @returns {string} Extracted project name or 'Project' as default
 */
export function extractProjectName(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return 'Project';
  }

  const patterns = [
    /(?:build|create|make)\s+(?:a\s+)?(?:app|project|system|platform|application|called\s+)?["`]?(\w+)["`]?/i,
    /(?:product|company|service|app)\s+(?:called|named)\s+["`]?(\w+)["`]?/i,
    /folder called\s+["`]?(\w+)["`]?/i,
    /^\s*(\w+)\s*(?:app|project|system|application)/i,
  ];

  for (const pattern of patterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
  }

  return 'Project';
}

/**
 * Extract output folder path from user input
 * @param {string} userInput - Raw user input text
 * @returns {string|null} Output folder path or null if not found
 */
export function extractOutputFolder(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return null;
  }

  // Check for patterns like "output/foldername" or "output/path/to/folder"
  const slashMatch = userInput.match(/output\/?([\w\-\/]+)/i);
  if (slashMatch && slashMatch[1]) {
    return slashMatch[1].replace(/\/+$/, '').replace(/["']/g, '');
  }

  // Check for patterns like "output folder called 'name'"
  const namedMatch = userInput.match(/output(?:\s+folder)?\s+(?:called|named)\s+["']?([\w\-\/]+)["']?/i);
  if (namedMatch && namedMatch[1]) {
    return namedMatch[1].replace(/\/+$/, '').replace(/["']/g, '');
  }

  return null;
}

/**
 * Check if user requested PDF output
 * @param {string} userInput - Raw user input text
 * @returns {boolean} True if PDF output was requested
 */
export function isPdfRequested(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return false;
  }
  return /\bpdf\b/i.test(userInput);
}

/**
 * Check if input is a refinement/improvement request
 * @param {string} userInput - Raw user input text
 * @returns {boolean} True if this is a refinement request
 */
export function isRefinementRequest(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return false;
  }
  return /\b(refine|improve|fix|update|change|modify|enhance|adjust)\b/i.test(userInput);
}
