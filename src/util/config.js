/**
 * Get validated configuration from environment variables
 * @returns {Object} Configuration object with all required and optional settings
 * @throws {Error} If required configuration is missing or invalid
 */
import { getValidatedConfig } from "./configValidator.js";

export function getConfig() {
  return getValidatedConfig(process.env);
}
