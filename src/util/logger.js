import fs from "fs";
import path from "path";

const logsDir = "./logs";
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logFile = path.join(logsDir, `agent-${new Date().toISOString().split('T')[0]}.log`);

function formatLog(level, meta, msg) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...meta
  });
}

function writeLog(level, meta, msg) {
  const line = formatLog(level, meta, msg);
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (err) {
    console.error("Failed to write log:", err.message);
  }
}

export const logger = {
  info(meta = {}, msg = "") {
    writeLog("INFO", meta, msg);
  },
  warn(meta = {}, msg = "") {
    writeLog("WARN", meta, msg);
  },
  error(meta = {}, msg = "") {
    writeLog("ERROR", meta, msg);
  }
};
