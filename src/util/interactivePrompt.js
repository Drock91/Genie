import readline from 'readline';

/**
 * Interactive prompt utilities for terminal user interaction
 */

export class InteractivePrompt {
  constructor() {
    this.rl = null;
  }

  createInterface() {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    return this.rl;
  }

  close() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Ask a yes/no question
   */
  async confirm(question, defaultYes = true) {
    const rl = this.createInterface();
    const suffix = defaultYes ? ' (Y/n): ' : ' (y/N): ';
    
    return new Promise((resolve) => {
      rl.question(question + suffix, (answer) => {
        const normalized = answer.trim().toLowerCase();
        
        if (normalized === '') {
          resolve(defaultYes);
        } else if (normalized === 'y' || normalized === 'yes') {
          resolve(true);
        } else if (normalized === 'n' || normalized === 'no') {
          resolve(false);
        } else {
          // Invalid input, use default
          resolve(defaultYes);
        }
      });
    });
  }

  /**
   * Ask for text input
   */
  async ask(question) {
    const rl = this.createInterface();
    
    return new Promise((resolve) => {
      rl.question(question + ' ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask for a choice from multiple options
   */
  async choice(question, options) {
    const rl = this.createInterface();
    
    console.log('\n' + question);
    options.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt}`);
    });
    
    return new Promise((resolve) => {
      rl.question('\nEnter your choice (1-' + options.length + '): ', (answer) => {
        const num = parseInt(answer.trim());
        if (num >= 1 && num <= options.length) {
          resolve(options[num - 1]);
        } else {
          resolve(options[0]); // Default to first option
        }
      });
    });
  }

  /**
   * Show a progress message
   */
  progress(message) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 ${message}`);
    console.log(`${'='.repeat(80)}\n`);
  }

  /**
   * Show a success message
   */
  success(message) {
    console.log(`\n✅ ${message}\n`);
  }

  /**
   * Show a warning message
   */
  warning(message) {
    console.log(`\n⚠️  ${message}\n`);
  }

  /**
   * Show an error message
   */
  error(message) {
    console.log(`\n❌ ${message}\n`);
  }

  /**
   * Show info message
   */
  info(message) {
    console.log(`\nℹ️  ${message}\n`);
  }
}

export default new InteractivePrompt();
