/**
 * Configuration Validator
 * Validates environment variables with schema and defaults
 */

/**
 * Configuration schema with validation rules
 */
const CONFIG_SCHEMA = {
  OPENAI_API_KEY: {
    required: true,
    type: 'string',
    validate: (val) => val && val.length > 0 && val.startsWith('sk-'),
    error: 'Must be a valid OpenAI API key (starts with sk-)'
  },
  ANTHROPIC_API_KEY: {
    required: false,
    type: 'string',
    validate: (val) => !val || val.length > 0,
    error: 'Must be a valid Anthropic API key'
  },
  GOOGLE_API_KEY: {
    required: false,
    type: 'string',
    validate: (val) => !val || val.length > 0,
    error: 'Must be a valid Google API key'
  },
  NODE_ENV: {
    required: false,
    type: 'string',
    default: 'development',
    validate: (val) => ['development', 'production', 'test'].includes(val),
    error: 'Must be one of: development, production, test'
  },
  OPENAI_MODEL: {
    required: false,
    type: 'string',
    default: 'gpt-4-turbo',
    validate: (val) => val && val.includes('gpt'),
    error: 'Must be a valid OpenAI model name'
  },
  OPENAI_TEMPERATURE: {
    required: false,
    type: 'number',
    default: 0.2,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 2;
    },
    error: 'Must be a number between 0 and 2'
  },
  MAX_ITERATIONS: {
    required: false,
    type: 'number',
    default: 5,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 20;
    },
    error: 'Must be a number between 1 and 20'
  },
  RETRY_ATTEMPTS: {
    required: false,
    type: 'number',
    default: 3,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 10;
    },
    error: 'Must be a number between 1 and 10'
  },
  REQUEST_TIMEOUT: {
    required: false,
    type: 'number',
    default: 60000,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 300000;
    },
    error: 'Must be a number between 1 and 300000 (milliseconds)'
  },
  PAID_BUDGET_USD: {
    required: false,
    type: 'number',
    default: 0,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    error: 'Must be a non-negative number'
  },
  PAID_SELECTION_MODE: {
    required: false,
    type: 'string',
    default: 'round_robin',
    validate: (val) => ['round_robin', 'cost_optimized', 'performance'].includes(val),
    error: 'Must be one of: round_robin, cost_optimized, performance'
  },
  CONSENSUS_COUNT: {
    required: false,
    type: 'number',
    default: 2,
    validate: (val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 5;
    },
    error: 'Must be a number between 1 and 5'
  }
};

/**
 * Validate configuration against schema
 * @param {Object} env - Environment variables object (process.env)
 * @returns {Object} Result with {valid: boolean, config: Object, errors: string[]}
 */
export function validateConfig(env = process.env) {
  const errors = [];
  const config = {};

  // Validate each schema entry
  for (const [key, rules] of Object.entries(CONFIG_SCHEMA)) {
    const value = env[key];

    // Check if required but missing
    if (rules.required && !value) {
      errors.push(`${key}: Required but not provided`);
      continue;
    }

    // Use default if not provided and optional
    if (!value) {
      if ('default' in rules) {
        config[key] = rules.default;
      }
      continue;
    }

    // Convert to correct type
    let typedValue = value;
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${key}: Expected number, got "${value}"`);
        continue;
      }
      typedValue = num;
    }

    // Validate value
    if (!rules.validate(typedValue)) {
      errors.push(`${key}: ${rules.error}`);
      continue;
    }

    config[key] = typedValue;
  }

  return {
    valid: errors.length === 0,
    config,
    errors
  };
}

/**
 * Get configuration with validation
 * @param {Object} env - Environment variables (defaults to process.env)
 * @returns {Object} Validated configuration
 * @throws {Error} If validation fails and throwOnError is true
 */
export function getValidatedConfig(env = process.env) {
  const result = validateConfig(env);

  if (!result.valid) {
    const errorMsg = `Configuration validation failed:\n${result.errors.join('\n')}`;
    throw new Error(errorMsg);
  }

  return {
    env: result.config.NODE_ENV,
    isProduction: result.config.NODE_ENV === 'production',
    openaiApiKey: result.config.OPENAI_API_KEY,
    anthropicApiKey: result.config.ANTHROPIC_API_KEY,
    googleApiKey: result.config.GOOGLE_API_KEY,
    openaiModel: result.config.OPENAI_MODEL,
    openaiTemp: result.config.OPENAI_TEMPERATURE,
    maxIterations: result.config.MAX_ITERATIONS,
    retryAttempts: result.config.RETRY_ATTEMPTS,
    requestTimeout: result.config.REQUEST_TIMEOUT,
    paidBudgetUsd: result.config.PAID_BUDGET_USD,
    paidSelectionMode: result.config.PAID_SELECTION_MODE,
    consensusCount: result.config.CONSENSUS_COUNT
  };
}

/**
 * Get configuration with soft validation (logs warnings, doesn't throw)
 * @param {Object} env - Environment variables (defaults to process.env)
 * @param {Object} logger - Logger instance
 * @returns {Object} Configuration (with defaults for missing optional values)
 */
export function getSoftValidatedConfig(env = process.env, logger = null) {
  const result = validateConfig(env);

  if (!result.valid) {
    result.errors.forEach(err => {
      logger?.warn?.({ error: err }, 'Config validation warning');
    });
  }

  return {
    env: result.config.NODE_ENV,
    isProduction: result.config.NODE_ENV === 'production',
    openaiApiKey: result.config.OPENAI_API_KEY,
    anthropicApiKey: result.config.ANTHROPIC_API_KEY,
    googleApiKey: result.config.GOOGLE_API_KEY,
    openaiModel: result.config.OPENAI_MODEL,
    openaiTemp: result.config.OPENAI_TEMPERATURE,
    maxIterations: result.config.MAX_ITERATIONS,
    retryAttempts: result.config.RETRY_ATTEMPTS,
    requestTimeout: result.config.REQUEST_TIMEOUT,
    paidBudgetUsd: result.config.PAID_BUDGET_USD,
    paidSelectionMode: result.config.PAID_SELECTION_MODE,
    consensusCount: result.config.CONSENSUS_COUNT
  };
}
