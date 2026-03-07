/**
 * Web Browser Tool - Universal web browsing and scraping for GENIE
 * 
 * Generic browser primitives that LLMs can compose to interact with ANY website:
 * - Navigate to any URL
 * - Search using any search engine
 * - Extract text, links, tables from pages
 * - Fill forms and click elements
 * - Take screenshots
 * - Execute JavaScript
 * 
 * @module tools/webBrowserTool
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class WebBrowserTool {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.history = [];
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };
    this.logger = options.logger || console;
  }

  /**
   * Initialize browser instance
   */
  async initialize() {
    if (this.browser) return;
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(this.options.userAgent);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    this.logger.info?.({ tool: 'WebBrowser' }, 'Browser initialized');
  }

  /**
   * Close browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.history = [];
      this.logger.info?.({ tool: 'WebBrowser' }, 'Browser closed');
    }
  }

  /**
   * Navigate to any URL and extract content
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @returns {Object} Page content and metadata
   */
  async navigate(url, options = {}) {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      await this.page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || this.options.timeout
      });
      
      // Wait for specific element if requested
      if (options.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector, { 
          timeout: options.selectorTimeout || 10000 
        });
      }
      
      // Optional delay for dynamic content
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      
      const content = await this.extractContent(options);
      const currentUrl = this.page.url();
      const title = await this.page.title();
      
      // Track history
      this.history.push({ url: currentUrl, title, timestamp: new Date().toISOString() });
      
      const duration = Date.now() - startTime;
      this.logger.info?.({ tool: 'WebBrowser', url: currentUrl, duration }, 'Page loaded');
      
      return {
        success: true,
        url: currentUrl,
        title,
        content,
        duration
      };
    } catch (error) {
      this.logger.error?.({ tool: 'WebBrowser', url, error: error.message }, 'Navigation failed');
      return {
        success: false,
        url,
        error: error.message
      };
    }
  }

  /**
   * Extract content from current page
   * @param {Object} options - Extraction options
   * @returns {Object} Extracted content
   */
  async extractContent(options = {}) {
    const html = await this.page.content();
    const $ = cheerio.load(html);
    
    // Remove clutter elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, [role="navigation"], [role="banner"]').remove();
    
    // Try to find main content area
    const mainContent = $('main, article, .content, #content, .main, [role="main"]').first();
    const textSource = mainContent.length ? mainContent : $('body');
    
    // Clean text extraction
    const text = textSource.text()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Extract all links
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const linkText = $(el).text().trim();
      if (href && linkText && !href.startsWith('#') && !href.startsWith('javascript:')) {
        // Resolve relative URLs
        let fullUrl = href;
        if (href.startsWith('/')) {
          const baseUrl = new URL(this.page.url());
          fullUrl = `${baseUrl.origin}${href}`;
        }
        links.push({ text: linkText.substring(0, 200), href: fullUrl });
      }
    });
    
    // Extract tables
    const tables = [];
    $('table').each((_, table) => {
      const rows = [];
      $(table).find('tr').each((_, tr) => {
        const cells = [];
        $(tr).find('th, td').each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    
    // Extract form fields (useful for understanding interactive pages)
    const forms = [];
    $('form').each((_, form) => {
      const formData = {
        action: $(form).attr('action'),
        method: $(form).attr('method') || 'get',
        fields: []
      };
      $(form).find('input, select, textarea').each((_, field) => {
        formData.fields.push({
          type: $(field).attr('type') || field.tagName.toLowerCase(),
          name: $(field).attr('name'),
          id: $(field).attr('id'),
          placeholder: $(field).attr('placeholder')
        });
      });
      if (formData.fields.length > 0) forms.push(formData);
    });
    
    // Extract buttons (for clickable actions)
    const buttons = [];
    $('button, input[type="submit"], [role="button"], .btn, a.button').each((_, el) => {
      const buttonText = $(el).text().trim() || $(el).attr('value') || $(el).attr('aria-label');
      const selector = $(el).attr('id') ? `#${$(el).attr('id')}` : 
                       $(el).attr('class') ? `.${$(el).attr('class').split(' ')[0]}` : null;
      if (buttonText) {
        buttons.push({ text: buttonText.substring(0, 100), selector });
      }
    });
    
    const result = {
      text: options.maxLength ? text.substring(0, options.maxLength) : text,
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      links: links.slice(0, options.maxLinks || 100),
      linkCount: links.length,
      tables: tables.slice(0, options.maxTables || 10),
      forms: forms.slice(0, 5),
      buttons: buttons.slice(0, 20)
    };
    
    // Extract specific CSS selectors if provided
    if (options.selectors) {
      result.extracted = {};
      for (const [key, selector] of Object.entries(options.selectors)) {
        const elements = [];
        $(selector).each((_, el) => {
          elements.push({
            text: $(el).text().trim(),
            html: $(el).html()?.substring(0, 500)
          });
        });
        result.extracted[key] = elements;
      }
    }
    
    return result;
  }

  /**
   * Search using any URL pattern (universal search)
   * @param {string} query - Search query
   * @param {string} searchUrl - URL pattern with {query} placeholder, or preset name
   * @returns {Object} Search results
   */
  async search(query, searchUrl = 'duckduckgo') {
    // Preset search engines
    const presets = {
      google: `https://www.google.com/search?q={query}`,
      bing: `https://www.bing.com/search?q={query}`,
      duckduckgo: `https://html.duckduckgo.com/html/?q={query}`,
      github: `https://github.com/search?q={query}&type=repositories`,
      stackoverflow: `https://stackoverflow.com/search?q={query}`,
      npm: `https://www.npmjs.com/search?q={query}`,
      youtube: `https://www.youtube.com/results?search_query={query}`,
    };
    
    // Use preset or custom URL
    const urlTemplate = presets[searchUrl.toLowerCase()] || searchUrl;
    const url = urlTemplate.replace('{query}', encodeURIComponent(query));
    
    const result = await this.navigate(url, { delay: 2000, maxLength: 50000 });
    
    if (result.success) {
      this.logger.info?.({ tool: 'WebBrowser', query, engine: searchUrl }, 'Search completed');
    }
    
    return {
      ...result,
      query,
      searchEngine: searchUrl
    };
  }

  /**
   * Fill a form field
   * @param {string} selector - CSS selector for the input
   * @param {string} value - Value to type
   * @param {Object} options - Typing options
   */
  async type(selector, value, options = {}) {
    await this.initialize();
    
    try {
      await this.page.waitForSelector(selector, { timeout: options.timeout || 5000 });
      
      // Clear existing content if requested
      if (options.clear) {
        await this.page.click(selector, { clickCount: 3 });
        await this.page.keyboard.press('Backspace');
      }
      
      await this.page.type(selector, value, { delay: options.delay || 50 });
      
      this.logger.info?.({ tool: 'WebBrowser', selector }, 'Typed into field');
      return { success: true, selector, value };
    } catch (error) {
      this.logger.error?.({ tool: 'WebBrowser', selector, error: error.message }, 'Type failed');
      return { success: false, selector, error: error.message };
    }
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector or text to find
   * @param {Object} options - Click options
   */
  async click(selector, options = {}) {
    await this.initialize();
    
    try {
      // Try direct selector first
      let element = await this.page.$(selector).catch(() => null);
      
      // If not found, try finding by text content
      if (!element && options.byText) {
        element = await this.page.evaluateHandle((text) => {
          const elements = [...document.querySelectorAll('a, button, [role="button"], input[type="submit"]')];
          return elements.find(el => el.textContent.toLowerCase().includes(text.toLowerCase()));
        }, selector);
      }
      
      if (element) {
        await element.click();
        
        // Wait for navigation or content change
        if (options.waitForNavigation) {
          await this.page.waitForNavigation({ timeout: options.timeout || 10000 }).catch(() => {});
        } else {
          await new Promise(resolve => setTimeout(resolve, options.delay || 1000));
        }
        
        this.logger.info?.({ tool: 'WebBrowser', selector }, 'Clicked element');
        return { success: true, selector, newUrl: this.page.url() };
      } else {
        throw new Error(`Element not found: ${selector}`);
      }
    } catch (error) {
      this.logger.error?.({ tool: 'WebBrowser', selector, error: error.message }, 'Click failed');
      return { success: false, selector, error: error.message };
    }
  }

  /**
   * Select from dropdown
   * @param {string} selector - CSS selector for select element
   * @param {string} value - Value to select
   */
  async select(selector, value) {
    await this.initialize();
    
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.select(selector, value);
      
      this.logger.info?.({ tool: 'WebBrowser', selector, value }, 'Selected option');
      return { success: true, selector, value };
    } catch (error) {
      this.logger.error?.({ tool: 'WebBrowser', selector, error: error.message }, 'Select failed');
      return { success: false, selector, error: error.message };
    }
  }

  /**
   * Scroll the page
   * @param {string} direction - 'up', 'down', 'top', 'bottom'
   * @param {number} amount - Pixels to scroll (for up/down)
   */
  async scroll(direction = 'down', amount = 500) {
    await this.initialize();
    
    try {
      switch (direction) {
        case 'top':
          await this.page.evaluate(() => window.scrollTo(0, 0));
          break;
        case 'bottom':
          await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          break;
        case 'up':
          await this.page.evaluate((px) => window.scrollBy(0, -px), amount);
          break;
        case 'down':
        default:
          await this.page.evaluate((px) => window.scrollBy(0, px), amount);
          break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, direction, amount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Wait for element or condition
   * @param {string} selector - CSS selector to wait for
   * @param {Object} options - Wait options
   */
  async waitFor(selector, options = {}) {
    await this.initialize();
    
    try {
      await this.page.waitForSelector(selector, { 
        timeout: options.timeout || 10000,
        visible: options.visible !== false
      });
      return { success: true, selector };
    } catch (error) {
      return { success: false, selector, error: error.message };
    }
  }

  /**
   * Take a screenshot
   * @param {string} path - File path to save screenshot
   * @param {Object} options - Screenshot options
   */
  async screenshot(path, options = {}) {
    await this.initialize();
    
    try {
      await this.page.screenshot({ 
        path, 
        fullPage: options.fullPage !== false,
        type: options.type || 'png'
      });
      this.logger.info?.({ tool: 'WebBrowser', path }, 'Screenshot saved');
      return { success: true, path };
    } catch (error) {
      this.logger.error?.({ tool: 'WebBrowser', error: error.message }, 'Screenshot failed');
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute JavaScript in page context
   * @param {string|Function} script - JavaScript to execute
   */
  async evaluate(script) {
    await this.initialize();
    
    try {
      const result = await this.page.evaluate(script);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current page info
   */
  async getCurrentPage() {
    if (!this.page) return { url: null, title: null };
    
    return {
      url: this.page.url(),
      title: await this.page.title().catch(() => null),
      history: this.history
    };
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.initialize();
    
    try {
      await this.page.goBack({ waitUntil: 'networkidle2' });
      return { success: true, url: this.page.url() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cookies
   */
  async getCookies() {
    await this.initialize();
    return await this.page.cookies();
  }

  /**
   * Set cookies
   * @param {Array} cookies - Cookies to set
   */
  async setCookies(cookies) {
    await this.initialize();
    await this.page.setCookie(...cookies);
    return { success: true };
  }

  /**
   * Get tool definitions for LLM function calling
   * @returns {Array} Tool definitions
   */
  static getToolDefinitions() {
    return [
      {
        name: 'web_navigate',
        description: 'Navigate to any URL and extract its content (text, links, tables, forms)',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to navigate to' },
            waitForSelector: { type: 'string', description: 'CSS selector to wait for before extracting content' },
            delay: { type: 'number', description: 'Milliseconds to wait for dynamic content' },
            maxLength: { type: 'number', description: 'Max characters of text to extract' }
          },
          required: ['url']
        }
      },
      {
        name: 'web_search',
        description: 'Search using any search engine. Presets: google, bing, duckduckgo, github, stackoverflow, npm, youtube. Or provide custom URL with {query} placeholder.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            engine: { type: 'string', description: 'Search engine preset name or custom URL pattern with {query}' }
          },
          required: ['query']
        }
      },
      {
        name: 'web_type',
        description: 'Type text into a form field',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the input field' },
            value: { type: 'string', description: 'Text to type' },
            clear: { type: 'boolean', description: 'Clear existing content first' }
          },
          required: ['selector', 'value']
        }
      },
      {
        name: 'web_click',
        description: 'Click an element on the page',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector or button text' },
            byText: { type: 'boolean', description: 'Find element by text content instead of selector' },
            waitForNavigation: { type: 'boolean', description: 'Wait for page navigation after click' }
          },
          required: ['selector']
        }
      },
      {
        name: 'web_select',
        description: 'Select an option from a dropdown',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for select element' },
            value: { type: 'string', description: 'Value to select' }
          },
          required: ['selector', 'value']
        }
      },
      {
        name: 'web_scroll',
        description: 'Scroll the page',
        parameters: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'], description: 'Scroll direction' },
            amount: { type: 'number', description: 'Pixels to scroll (for up/down)' }
          },
          required: []
        }
      },
      {
        name: 'web_screenshot',
        description: 'Take a screenshot of the current page',
        parameters: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Filename to save the screenshot' },
            fullPage: { type: 'boolean', description: 'Capture full scrollable page' }
          },
          required: ['filename']
        }
      },
      {
        name: 'web_extract',
        description: 'Extract specific elements from current page using CSS selectors',
        parameters: {
          type: 'object',
          properties: {
            selectors: { 
              type: 'object', 
              description: 'Object mapping names to CSS selectors, e.g., {"results": ".search-result", "prices": ".price"}' 
            }
          },
          required: ['selectors']
        }
      },
      {
        name: 'web_wait',
        description: 'Wait for an element to appear on the page',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector to wait for' },
            timeout: { type: 'number', description: 'Maximum wait time in milliseconds' }
          },
          required: ['selector']
        }
      },
      {
        name: 'web_evaluate',
        description: 'Execute JavaScript in the page context',
        parameters: {
          type: 'object',
          properties: {
            script: { type: 'string', description: 'JavaScript code to execute' }
          },
          required: ['script']
        }
      }
    ];
  }
}

export default WebBrowserTool;
