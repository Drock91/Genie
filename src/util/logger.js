import fs from "fs";
import path from "path";

const logsDir = "./logs";
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logFile = path.join(logsDir, `agent-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Format log entry as JSON
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {Object} meta - Metadata object
 * @param {string} msg - Log message
 * @returns {string} Formatted JSON log line
 */
function formatLog(level, meta, msg) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...meta
  });
}

/**
 * Write log to console and file
 * @param {string} level - Log level
 * @param {Object} meta - Metadata object
 * @param {string} msg - Log message
 */
function writeLog(level, meta, msg) {
  const line = formatLog(level, meta, msg);
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (err) {
    console.error("Failed to write log:", err.message);
  }
}

/**
 * Logger instance with standard methods
 * @type {Object}
 */
export const logger = {
  /**
   * Log info level message
   * @param {Object} meta - Metadata
   * @param {string} msg - Message
   */
  info(meta = {}, msg = "") {
    writeLog("INFO", meta, msg);
  },

  /**
   * Log warning level message
   * @param {Object} meta - Metadata
   * @param {string} msg - Message
   */
  warn(meta = {}, msg = "") {
    writeLog("WARN", meta, msg);
  },

  /**
   * Log error level message
   * @param {Object} meta - Metadata
   * @param {string} msg - Message
   */
  error(meta = {}, msg = "") {
    writeLog("ERROR", meta, msg);
  },

  /**
   * Log debug level message (alias for info)
   * @param {Object} meta - Metadata
   * @param {string} msg - Message
   */
  debug(meta = {}, msg = "") {
    writeLog("DEBUG", meta, msg);
  }
};
