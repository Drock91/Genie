import { EXPERT_TYPES, TASK_COMPLEXITY } from './expertRegistry.js';

/**
 * Task Analyzer
 * Determines which experts are needed based on task requirements
 */
export class TaskAnalyzer {
  constructor({ logger }) {
    this.logger = logger;
  }

  /**
   * Analyze a task and determine complexity and required experts
   */
  async analyzeTask(userInput) {
    const analysis = {
      input: userInput,
      complexity: this._determineComplexity(userInput),
      requiredExperts: [],
      reasoning: [],
      keywords: this._extractKeywords(userInput)
    };

    // Determine complexity
    switch (analysis.complexity) {
      case TASK_COMPLEXITY.SIMPLE:
        analysis.requiredExperts = [EXPERT_TYPES.BACKEND];
        break;

      case TASK_COMPLEXITY.MEDIUM:
        analysis.requiredExperts = [
          EXPERT_TYPES.ARCHITECT,
          EXPERT_TYPES.BACKEND,
          EXPERT_TYPES.FRONTEND,
          EXPERT_TYPES.QA
        ];
        break;

      case TASK_COMPLEXITY.COMPLEX:
        analysis.requiredExperts = [
          EXPERT_TYPES.ARCHITECT,
          EXPERT_TYPES.BACKEND,
          EXPERT_TYPES.FRONTEND,
          EXPERT_TYPES.SECURITY,
          EXPERT_TYPES.DATABASE,
          EXPERT_TYPES.API,
          EXPERT_TYPES.QA
        ];
        break;

      case TASK_COMPLEXITY.ENTERPRISE:
        analysis.requiredExperts = Object.values(EXPERT_TYPES);
        break;
    }

    // Add domain-specific experts based on keywords
    if (this._hasKeywords(userInput, ['security', 'auth', 'encryption', 'compliance'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.SECURITY)) {
        analysis.requiredExperts.push(EXPERT_TYPES.SECURITY);
      }
      analysis.reasoning.push('Security keywords detected - adding Security Specialist');
    }

    if (this._hasKeywords(userInput, ['scale', 'million', 'performance', 'cache', 'load'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.SCALING)) {
        analysis.requiredExperts.push(EXPERT_TYPES.SCALING);
      }
      analysis.reasoning.push('Scaling keywords detected - adding Scaling Specialist');
    }

    if (this._hasKeywords(userInput, ['market', 'monetize', 'pricing', 'revenue', 'saas'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.MARKETING)) {
        analysis.requiredExperts.push(EXPERT_TYPES.MARKETING);
      }
      analysis.reasoning.push('Business keywords detected - adding Marketing Specialist');
    }

    if (this._hasKeywords(userInput, ['deploy', 'devops', 'ci/cd', 'docker', 'kubernetes'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.DEVOPS)) {
        analysis.requiredExperts.push(EXPERT_TYPES.DEVOPS);
      }
      analysis.reasoning.push('DevOps keywords detected - adding DevOps Engineer');
    }

    if (this._hasKeywords(userInput, ['database', 'db', 'sql', 'nosql', 'schema'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.DATABASE)) {
        analysis.requiredExperts.push(EXPERT_TYPES.DATABASE);
      }
      analysis.reasoning.push('Database keywords detected - adding Database Architect');
    }

    if (this._hasKeywords(userInput, ['api', 'rest', 'graphql', 'endpoint'])) {
      if (!analysis.requiredExperts.includes(EXPERT_TYPES.API)) {
        analysis.requiredExperts.push(EXPERT_TYPES.API);
      }
      analysis.reasoning.push('API keywords detected - adding API Designer');
    }

    this.logger?.info(analysis, 'Task analysis complete');
    return analysis;
  }

  _determineComplexity(input) {
    const length = input.length;
    const wordCount = input.split(/\s+/).length;

    // Enterprise scale indicators
    if (this._hasKeywords(input, ['enterprise', 'million users', 'saas', 'global', 'scale to'])) {
      return TASK_COMPLEXITY.ENTERPRISE;
    }

    // Complex indicators
    if (this._hasKeywords(input, ['saas', 'platform', 'system', 'multiple', 'integration'])) {
      return TASK_COMPLEXITY.COMPLEX;
    }

    // Medium indicators
    if (wordCount > 20 || this._hasKeywords(input, ['build', 'create', 'develop'])) {
      return TASK_COMPLEXITY.MEDIUM;
    }

    return TASK_COMPLEXITY.SIMPLE;
  }

  _extractKeywords(input) {
    const keywords = new Set();
    const allKeywords = [
      // Tech keywords
      'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 'docker', 'kubernetes',
      'react', 'node', 'python', 'java', 'typescript', 'microservice', 'monolith',
      // Domain keywords
      'security', 'auth', 'encryption', 'compliance', 'scale', 'performance',
      'cache', 'cdn', 'load', 'deploy', 'devops', 'ci/cd', 'monitoring',
      // Business keywords
      'saas', 'market', 'monetize', 'pricing', 'revenue', 'customer', 'user',
      // Scale keywords
      'million', 'billion', 'million users', 'high traffic', 'production'
    ];

    const lowerInput = input.toLowerCase();
    for (const keyword of allKeywords) {
      if (lowerInput.includes(keyword)) {
        keywords.add(keyword);
      }
    }

    return Array.from(keywords);
  }

  _hasKeywords(input, keywords) {
    const lowerInput = input.toLowerCase();
    return keywords.some(kw => lowerInput.includes(kw));
  }
}
