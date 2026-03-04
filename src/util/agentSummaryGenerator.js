/**
 * Agent Summary Report Generator
 * Generates clean summaries of agent execution for each GENIE request
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate a random serial number for request tracking
 */
export function generateRequestSerial() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 8; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

/**
 * Generate a clean agent execution summary report
 * @param {string} traceId - The workflow trace ID
 * @param {string} serial - The unique request serial number
 * @param {string} originalInput - The original user input
 * @param {string} refinedInput - The refined/cleaned input from GENIE
 * @returns {Promise<string>} - Path to the generated report file
 */
export async function generateAgentSummaryReport(traceId, serial, originalInput, refinedInput) {
  try {
    const logDir = path.join(__dirname, '../../logs');
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `agent-${today}.log`);

    // Read log file
    if (!await fileExists(logFile)) {
      throw new Error(`Log file not found: ${logFile}`);
    }

    const logContent = await fs.readFile(logFile, 'utf8');
    const logLines = logContent.split('\n').filter(l => l.trim());

    // Extract events for this traceId
    const events = [];
    const agents = {};

    logLines.forEach(line => {
      try {
        const obj = JSON.parse(line);
        if (obj.traceId === traceId && obj.agent) {
          events.push(obj);
          
          if (!agents[obj.agent]) {
            agents[obj.agent] = {
              calls: [],
              status: '✅'
            };
          }
          agents[obj.agent].calls.push(obj);
          
          if (obj.level === 'ERROR') {
            agents[obj.agent].status = '⚠️';
          }
        }
      } catch(e) {}
    });

    // Build summary
    const summary = buildSummary(agents, traceId, serial, originalInput, refinedInput, events);

    // Save report with serial number
    const reportFile = path.join(logDir, `agent-summary-${today}-${serial}.txt`);
    await fs.writeFile(reportFile, summary);

    return { path: reportFile, serial };
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to generate summary report');
    throw err;
  }
}

/**
 * Build clean summary from agent data
 */
function buildSummary(agents, traceId, serial, originalInput, refinedInput, allEvents = []) {
  let output = '';

  output += '╔' + '═'.repeat(106) + '╗\n';
  output += '║' + ' '.repeat(30) + 'GENIE AGENT EXECUTION SUMMARY' + ' '.repeat(48) + '║\n';
  output += '╚' + '═'.repeat(106) + '╝\n\n';

  output += `📋 REQUEST SERIAL: ${serial}\n`;
  output += `🔗 Trace ID: ${traceId}\n`;
  output += `⏰ Generated: ${new Date().toISOString()}\n\n`;

  output += '┌' + '─'.repeat(104) + '┐\n';
  output += '│ INPUT ANALYSIS\n';
  output += '└' + '─'.repeat(104) + '┘\n\n';

  output += `📝 ORIGINAL USER INPUT:\n`;
  output += `   "${originalInput}"\n\n`;

  output += `✨ REFINED BY GENIE:\n`;
  output += `   "${refinedInput}"\n\n`;

  if (originalInput !== refinedInput) {
    const diff = refinedInput.length - originalInput.length;
    const diffPercent = ((diff / originalInput.length) * 100).toFixed(1);
    output += `📊 IMPROVEMENT: +${diff} characters (${diffPercent}% more detailed)\n\n`;
  }

  output += '┌' + '─'.repeat(104) + '┐\n';
  output += '│ AGENT EXECUTION FLOW\n';
  output += '└' + '─'.repeat(104) + '┘\n\n';

  // Map agent names to workflow event markers
  const agentEventMarkers = {
    'FrontendCoder': { start: 'Building frontend', end: 'Merging coder outputs' },
    'BackendCoder': { start: 'Producing backend', end: 'Merging coder outputs' },
    'TestRunner': { start: 'Running tests', end: 'Gate evaluation' },
    'QAManager': { start: 'QA review', end: 'Gate evaluation' },
    'SecurityManager': { start: 'Security review', end: 'Gate evaluation' },
    'Manager': { start: 'Planning work items', end: 'Plan created' },
    'DeliveryManager': { start: 'Verifying project', end: 'Delivery verification complete' }
  };

  const agentList = Object.entries(agents).sort((a, b) => {
    const minTimeA = Math.min(...a[1].calls.map(c => new Date(c.timestamp).getTime()));
    const minTimeB = Math.min(...b[1].calls.map(c => new Date(c.timestamp).getTime()));
    return minTimeA - minTimeB;
  });

  let summaryOutput = 'Execution completed successfully';  // Default summary

  agentList.forEach(([agentName, data], idx) => {
    const calls = data.calls;
    const status = data.status;
    
    // Calculate duration using workflow events
    let duration = 0;
    const markers = agentEventMarkers[agentName] || {};
    
    if (markers.start && markers.end && allEvents.length > 0) {
      const startEvent = allEvents.find(e => e.message?.includes(markers.start) && e.traceId === traceId);
      const endEvent = allEvents.find(e => e.message?.includes(markers.end) && e.traceId === traceId);
      
      if (startEvent && endEvent) {
        duration = (new Date(endEvent.timestamp).getTime() - new Date(startEvent.timestamp).getTime()) / 1000;
      }
    }
    
    // Fallback to call-based duration if no workflow events found
    if (duration === 0 && calls.length > 0) {
      const timestamps = calls.map(c => new Date(c.timestamp).getTime());
      if (timestamps.length > 1) {
        duration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
      }
    }

    // Extract input/output
    let input = 'Processing';
    let output_text = 'Generated output';

    calls.forEach(call => {
      if (call.message.includes('Refining user request')) {
        input = call.rawInput?.substring(0, 100) + '...' || input;
      }
      if (call.message.includes('refined successfully')) {
        input = `Refined: +${call.refinedLength - call.originalLength} chars (${call.confidence}% confidence)`;
      }
      if (call.message.includes('Plan generated')) {
        output_text = `Plan: ${call.agreement}% consensus`;
        summaryOutput = output_text;
      }
      if (call.message.includes('Application code generated')) {
        output_text = `Code: HTML(${call.htmlSize}B) CSS(${call.cssSize}B) JS(${call.jsSize}B)`;
        summaryOutput = output_text;
      }
      if (call.message.includes('Writing completed')) {
        output_text = `Content: ${call.final_length} chars`;
        summaryOutput = output_text;
      }
      if (call.message.includes('Running tests')) {
        output_text = 'Tests verified';
        summaryOutput = output_text;
      }
      if (call.message.includes('Building') || call.message.includes('code generated')) {
        input = call.receivedUserInput?.substring(0, 80) + '...' || input;
      }
    });

    output += `${idx + 1}. ${status} ${agentName.toUpperCase()}\n`;
    output += `   ├─ Duration:  ${typeof duration === 'number' ? duration > 0 ? duration.toFixed(1) + 's' : '<0.1s' : duration}\n`;
    output += `   ├─ Input:     ${input}\n`;
    output += `   └─ Output:    ${output_text}\n\n`;
  });

  output += '┌' + '─'.repeat(104) + '┐\n';
  output += '│ EXECUTION SUMMARY\n';
  output += '└' + '─'.repeat(104) + '┘\n\n';
  output += `Total Agents: ${agentList.length}\n`;
  output += `Successful: ${agentList.filter(a => a[1].status === '✅').length}\n`;
  output += `With Warnings: ${agentList.filter(a => a[1].status === '⚠️').length}\n`;
  output += `Result: ${summaryOutput}\n`;
  output += '═'.repeat(106) + '\n';

  return output;
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export default generateAgentSummaryReport;
