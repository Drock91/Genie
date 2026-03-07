/**
 * Web Browser Agent - LLM-powered autonomous web browsing for GENIE
 * 
 * Uses tool calling to let the LLM decide what web actions to take.
 * The LLM reasons about what to do, calls browser tools, and processes results.
 * 
 * @module agents/webBrowserAgent
 */

import { BaseAgent } from './baseAgent.js';
import { WebBrowserTool } from '../tools/webBrowserTool.js';
import { makeAgentOutput } from '../models.js';

export class WebBrowserAgent extends BaseAgent {
  constructor({ logger, multiLlmSystem, options = {} }) {
    super({ name: 'WebBrowser', logger });
    this.multiLlmSystem = multiLlmSystem;
    this.browser = new WebBrowserTool({ logger, ...options });
    this.maxIterations = options.maxIterations || 10;
    this.profile = 'balanced';
  }

  /**
   * Execute a web browsing task using LLM-guided tool use
   * @param {Object} input - Task input
   * @param {string} input.task - Description of what to accomplish
   * @param {string} input.startUrl - Optional starting URL
   * @param {Object} input.context - Additional context for the LLM
   * @returns {Promise<Object>} Results of the browsing session
   */
  async run(input) {
    const startTime = Date.now();
    this.setCurrentAgent();
    
    const { task, startUrl, context = {} } = typeof input === 'string' 
      ? { task: input } 
      : input;
    
    this.info({ task }, 'Starting web browsing task');
    
    const toolDefs = WebBrowserTool.getToolDefinitions();
    const results = [];
    const actions = [];
    let iteration = 0;
    let done = false;
    
    // System prompt for the browser agent
    const systemPrompt = `You are a web browsing agent. You can navigate websites, search, fill forms, and extract information.

Available tools:
${toolDefs.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Instructions:
1. Think step-by-step about how to accomplish the task
2. Use tools to navigate and interact with websites
3. Extract and compile the information needed
4. When done, respond with TASK_COMPLETE and a summary of findings

Current context:
- Task: ${task}
${startUrl ? `- Starting URL: ${startUrl}` : ''}
${Object.keys(context).length > 0 ? `- Additional context: ${JSON.stringify(context)}` : ''}

Respond with either:
1. A tool call in JSON format: {"tool": "tool_name", "params": {...}}
2. TASK_COMPLETE: followed by your findings

Be efficient - don't navigate unnecessarily. Extract what you need and complete the task.`;

    // Navigate to starting URL if provided
    if (startUrl) {
      const navResult = await this.browser.navigate(startUrl);
      results.push({ action: 'navigate', url: startUrl, result: navResult });
      actions.push({ tool: 'web_navigate', params: { url: startUrl }, success: navResult.success });
    }

    // Main agent loop
    while (!done && iteration < this.maxIterations) {
      iteration++;
      
      // Build context from recent results
      const recentResults = results.slice(-3).map(r => ({
        action: r.action,
        success: r.result?.success,
        summary: this.summarizeResult(r.result)
      }));
      
      const currentPage = await this.browser.getCurrentPage();
      
      const userPrompt = `Iteration ${iteration}/${this.maxIterations}
Current page: ${currentPage.url || 'Not navigated yet'}
Recent actions: ${JSON.stringify(recentResults, null, 2)}

What's the next step to accomplish: "${task}"?`;

      try {
        // Get LLM decision
        const llmResponse = await this.multiLlmSystem.consensusCall({
          system: systemPrompt,
          user: userPrompt,
          profile: this.profile,
          temperature: 0.3,
          metadata: { agent: 'WebBrowser', iteration }
        });
        
        const responseText = llmResponse.response || llmResponse.text || '';
        
        // Check if task is complete
        if (responseText.includes('TASK_COMPLETE')) {
          done = true;
          const findings = responseText.split('TASK_COMPLETE')[1]?.trim() || responseText;
          results.push({ action: 'complete', findings });
          this.info({ iteration }, 'Task completed');
          break;
        }
        
        // Try to parse tool call
        const toolCall = this.parseToolCall(responseText);
        
        if (toolCall) {
          const toolResult = await this.executeTool(toolCall.tool, toolCall.params);
          results.push({ 
            action: toolCall.tool, 
            params: toolCall.params, 
            result: toolResult 
          });
          actions.push({ 
            tool: toolCall.tool, 
            params: toolCall.params, 
            success: toolResult?.success 
          });
          
          this.info({ tool: toolCall.tool, success: toolResult?.success }, 'Executed tool');
        } else {
          // LLM responded with text but no tool call - might be thinking
          this.warn({ response: responseText.substring(0, 200) }, 'No tool call parsed');
          
          // If we can't parse a tool call, maybe the LLM is done
          if (responseText.toLowerCase().includes('complete') || 
              responseText.toLowerCase().includes('finished') ||
              responseText.toLowerCase().includes('found')) {
            done = true;
            results.push({ action: 'complete', findings: responseText });
          }
        }
        
      } catch (error) {
        this.error({ error: error.message, iteration }, 'LLM call failed');
        results.push({ action: 'error', error: error.message });
      }
    }
    
    // Clean up browser
    await this.browser.close();
    
    const duration = Date.now() - startTime;
    
    // Compile final output
    const output = {
      task,
      success: done,
      iterations: iteration,
      duration,
      actions,
      findings: results.find(r => r.action === 'complete')?.findings || null,
      pagesVisited: this.browser.history || [],
      rawResults: results
    };
    
    this.info({ success: done, iterations: iteration, duration }, 'Web browsing task finished');
    
    return makeAgentOutput({
      summary: `Web browsing ${done ? 'completed' : 'incomplete'}: ${task}`,
      notes: [
        `Iterations: ${iteration}`,
        `Actions: ${actions.length}`,
        `Duration: ${duration}ms`
      ],
      metrics: { iterations: iteration, duration, actionsCount: actions.length },
      data: output
    });
  }

  /**
   * Parse tool call from LLM response
   */
  parseToolCall(response) {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*"tool"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool) {
          return { tool: parsed.tool, params: parsed.params || {} };
        }
      }
      
      // Try alternative formats
      const toolMatch = response.match(/tool[:\s]+["']?(\w+)["']?/i);
      const paramsMatch = response.match(/params[:\s]+(\{[^}]+\})/i);
      
      if (toolMatch) {
        let params = {};
        if (paramsMatch) {
          try { params = JSON.parse(paramsMatch[1]); } catch {}
        }
        return { tool: toolMatch[1], params };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Execute a browser tool
   */
  async executeTool(toolName, params) {
    switch (toolName) {
      case 'web_navigate':
        return await this.browser.navigate(params.url, params);
      case 'web_search':
        return await this.browser.search(params.query, params.engine);
      case 'web_type':
        return await this.browser.type(params.selector, params.value, params);
      case 'web_click':
        return await this.browser.click(params.selector, params);
      case 'web_select':
        return await this.browser.select(params.selector, params.value);
      case 'web_scroll':
        return await this.browser.scroll(params.direction, params.amount);
      case 'web_screenshot':
        return await this.browser.screenshot(params.filename, params);
      case 'web_wait':
        return await this.browser.waitFor(params.selector, params);
      case 'web_evaluate':
        return await this.browser.evaluate(params.script);
      case 'web_extract':
        return await this.browser.extractContent({ selectors: params.selectors });
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  /**
   * Summarize a tool result for context
   */
  summarizeResult(result) {
    if (!result) return 'No result';
    if (!result.success) return `Failed: ${result.error || 'unknown error'}`;
    
    const summary = [];
    if (result.url) summary.push(`URL: ${result.url}`);
    if (result.title) summary.push(`Title: ${result.title}`);
    if (result.content?.wordCount) summary.push(`Words: ${result.content.wordCount}`);
    if (result.content?.linkCount) summary.push(`Links: ${result.content.linkCount}`);
    if (result.content?.tables?.length) summary.push(`Tables: ${result.content.tables.length}`);
    
    return summary.length > 0 ? summary.join(', ') : 'Success';
  }

  /**
   * Quick search helper - search and return results without full agent loop
   * @param {string} query - Search query
   * @param {string} engine - Search engine (default: duckduckgo)
   */
  async quickSearch(query, engine = 'duckduckgo') {
    await this.browser.initialize();
    const result = await this.browser.search(query, engine);
    await this.browser.close();
    return result;
  }

  /**
   * Quick fetch helper - navigate to URL and extract content
   * @param {string} url - URL to fetch
   * @param {Object} options - Extraction options
   */
  async quickFetch(url, options = {}) {
    await this.browser.initialize();
    const result = await this.browser.navigate(url, options);
    await this.browser.close();
    return result;
  }
}

export default WebBrowserAgent;
