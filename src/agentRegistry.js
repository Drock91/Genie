/**
 * GENIE Agent Registry
 * 
 * Complete documentation of all 35 agents in the GENIE system.
 * 20 core orchestration agents + 15 enterprise/business agents available.
 */

export const AGENT_REGISTRY = {
  // ============================================================================
  // CORE ORCHESTRATION & REFINEMENT (4 agents)
  // ============================================================================
  
  manager: {
    name: 'ManagerAgent',
    file: 'managerAgent.js',
    role: 'Chief Orchestrator',
    purpose: 'Coordinates workflow execution, manages agent sequencing, handles iteration logic',
    responsibilities: [
      'Orchestrate multi-agent execution',
      'Manage workflow iterations',
      'Coordinate agent dependencies',
      'Track execution metrics'
    ],
    criticality: 'CRITICAL - Core orchestration engine'
  },

  refiner: {
    name: 'RequestRefinerAgent',
    file: 'requestRefinerAgent.js',
    role: 'Input Refinement',
    purpose: 'Analyzes and refines user input for precision and clarity',
    responsibilities: [
      'Parse user requests',
      'Identify intent and requirements',
      'Suggest improvements',
      'Generate refined prompts'
    ],
    criticality: 'CRITICAL - Improves request accuracy'
  },

  codeRefiner: {
    name: 'CodeRefinerAgent',
    file: 'codeRefinerAgent.js',
    role: 'Code Quality Refinement',
    purpose: 'Improves generated code quality, applies best practices, optimizes',
    responsibilities: [
      'Review generated code',
      'Apply design patterns',
      'Optimize performance',
      'Ensure code standards'
    ],
    criticality: 'HIGH - Ensures code quality'
  },

  delivery: {
    name: 'DeliveryManagerAgent',
    file: 'deliveryManagerAgent.js',
    role: 'Project Delivery',
    purpose: 'Manages project delivery, monitors progress, handles final assembly',
    responsibilities: [
      'Coordinate project assembly',
      'Manage deliverables',
      'Handle file organization',
      'Generate project reports'
    ],
    criticality: 'HIGH - Ensures complete delivery'
  },

  // ============================================================================
  // BACKEND DEVELOPMENT (3 agents)
  // ============================================================================

  backend: {
    name: 'BackendCoderAgent',
    file: 'backendCoderAgent.js',
    role: 'Backend Development',
    purpose: 'Designs and implements backend logic, APIs, and business logic',
    responsibilities: [
      'Design backend architecture',
      'Implement APIs',
      'Create business logic',
      'Handle data processing'
    ],
    criticality: 'CRITICAL - Core backend development'
  },

  databaseArchitect: {
    name: 'DatabaseArchitectAgent',
    file: 'databaseArchitectAgent.js',
    role: 'Database Architecture',
    purpose: 'Designs database schemas, queries, and data models',
    responsibilities: [
      'Design database schemas',
      'Optimize queries',
      'Plan data models',
      'Ensure data integrity'
    ],
    criticality: 'HIGH - Critical for data layer'
  },

  userAuth: {
    name: 'UserAuthAgent',
    file: 'userAuthAgent.js',
    role: 'Authentication & Authorization',
    purpose: 'Implements auth systems, user management, security protocols',
    responsibilities: [
      'Design auth systems',
      'Implement user management',
      'Handle security protocols',
      'Manage permissions'
    ],
    criticality: 'CRITICAL - Essential for security'
  },

  // ============================================================================
  // FRONTEND DEVELOPMENT (1 agent)
  // ============================================================================

  frontend: {
    name: 'FrontendCoderAgent',
    file: 'frontendCoderAgent.js',
    role: 'Frontend Development',
    purpose: 'Designs and implements UI components, styling, and user interaction',
    responsibilities: [
      'Design UI layouts',
      'Implement components',
      'Style interfaces',
      'Handle user interactions'
    ],
    criticality: 'CRITICAL - User-facing development'
  },

  // ============================================================================
  // API INTEGRATION & INFRASTRUCTURE (2 agents)
  // ============================================================================

  apiIntegration: {
    name: 'ApiIntegrationAgent',
    file: 'apiIntegrationAgent.js',
    role: 'API Integration',
    purpose: 'Designs and implements API integrations, third-party connections',
    responsibilities: [
      'Design API contracts',
      'Integrate external APIs',
      'Handle API middleware',
      'Manage API versioning'
    ],
    criticality: 'HIGH - External system connectivity'
  },

  deployment: {
    name: 'DeploymentAgent',
    file: 'deploymentAgent.js',
    role: 'Deployment & DevOps',
    purpose: 'Handles deployment, infrastructure setup, CI/CD pipelines',
    responsibilities: [
      'Plan deployments',
      'Setup infrastructure',
      'Configure CI/CD',
      'Manage environments'
    ],
    criticality: 'CRITICAL - Production deployment'
  },

  // ============================================================================
  // QUALITY ASSURANCE & TESTING (4 agents)
  // ============================================================================

  qa: {
    name: 'QAManagerAgent',
    file: 'qaManagerAgent.js',
    role: 'Quality Assurance Manager',
    purpose: 'Plans testing strategies, identifies test scenarios, manages QA',
    responsibilities: [
      'Define test strategies',
      'Identify test scenarios',
      'Plan test coverage',
      'Manage QA process'
    ],
    criticality: 'HIGH - Ensures quality standards'
  },

  tests: {
    name: 'TestRunnerAgent',
    file: 'testRunnerAgent.js',
    role: 'Test Execution',
    purpose: 'Executes tests, validates functionality, reports results',
    responsibilities: [
      'Execute test suites',
      'Validate functionality',
      'Report test results',
      'Identify failures'
    ],
    criticality: 'HIGH - Continuous validation'
  },

  testGeneration: {
    name: 'TestGenerationAgent',
    file: 'testGenerationAgent.js',
    role: 'Test Code Generation',
    purpose: 'Automatically generates test cases and test suites',
    responsibilities: [
      'Generate unit tests',
      'Create integration tests',
      'Build test fixtures',
      'Coverage analysis'
    ],
    criticality: 'HIGH - Automated test creation'
  },

  fixer: {
    name: 'FixerAgent',
    file: 'fixerAgent.js',
    role: 'Bug Fixing & Optimization',
    purpose: 'Identifies and fixes bugs, optimizes code performance',
    responsibilities: [
      'Identify bugs',
      'Apply fixes',
      'Optimize performance',
      'Refactor problematic code'
    ],
    criticality: 'HIGH - Code quality maintenance'
  },

  // ============================================================================
  // SECURITY & MONITORING (2 agents)
  // ============================================================================

  security: {
    name: 'SecurityManagerAgent',
    file: 'securityManagerAgent.js',
    role: 'Security Management',
    purpose: 'Plans security measures, identifies vulnerabilities, manages policies',
    responsibilities: [
      'Plan security measures',
      'Identify vulnerabilities',
      'Define policies',
      'Manage compliance'
    ],
    criticality: 'CRITICAL - Security oversight'
  },

  securityHardening: {
    name: 'SecurityHardeningAgent',
    file: 'securityHardeningAgent.js',
    role: 'Security Hardening',
    purpose: 'Implements security hardening, applies best practices, secures code',
    responsibilities: [
      'Implement hardening',
      'Apply security best practices',
      'Secure code patterns',
      'Validate security measures'
    ],
    criticality: 'CRITICAL - Active security implementation'
  },

  monitoring: {
    name: 'MonitoringAgent',
    file: 'monitoringAgent.js',
    role: 'Monitoring & Observability',
    purpose: 'Sets up monitoring, logging, alerting, and observability systems',
    responsibilities: [
      'Setup monitoring',
      'Configure logging',
      'Define alerts',
      'Ensure observability'
    ],
    criticality: 'HIGH - Production visibility'
  },

  // ============================================================================
  // DOCUMENTATION & COMMUNICATION (2 agents)
  // ============================================================================

  apiDocumentation: {
    name: 'APIDocumentationAgent',
    file: 'apiDocumentationAgent.js',
    role: 'API Documentation',
    purpose: 'Generates comprehensive API documentation and specifications',
    responsibilities: [
      'Generate API docs',
      'Create specifications',
      'Document endpoints',
      'Provide usage examples'
    ],
    criticality: 'MEDIUM - Developer experience'
  },

  writer: {
    name: 'WriterAgent',
    file: 'writerAgent.js',
    role: 'Technical Writing',
    purpose: 'Creates documentation, README files, technical content',
    responsibilities: [
      'Write documentation',
      'Create README files',
      'Produce guides',
      'Document architecture'
    ],
    criticality: 'MEDIUM - Documentation'
  },

  // ============================================================================
  // PERFORMANCE & OPTIMIZATION (1 agent)
  // ============================================================================

  performanceOptimization: {
    name: 'PerformanceOptimizationAgent',
    file: 'performanceOptimizationAgent.js',
    role: 'Performance Optimization',
    purpose: 'Analyzes performance, optimizes bottlenecks, improves efficiency',
    responsibilities: [
      'Performance analysis',
      'Identify bottlenecks',
      'Recommend optimizations',
      'Implement improvements'
    ],
    criticality: 'MEDIUM - Performance tuning'
  },

  // ============================================================================
  // AUTONOMOUS OPERATIONS & WEB INTERACTION (4 agents)
  // ============================================================================

  webBrowser: {
    name: 'WebBrowserAgent',
    file: 'webBrowserAgent.js',
    role: 'Autonomous Web Browsing',
    purpose: 'LLM-guided web browsing, searching, scraping, and form interaction',
    responsibilities: [
      'Navigate any website',
      'Search using any search engine',
      'Extract structured data from pages',
      'Fill forms and interact with web apps',
      'Take screenshots for documentation'
    ],
    criticality: 'HIGH - Real-time web access'
  },

  taskAnalyzer: {
    name: 'TaskAnalyzerAgent',
    file: 'taskAnalyzerAgent.js',
    role: 'Task Classification',
    purpose: 'Analyzes user tasks to determine optimal agent routing',
    responsibilities: [
      'Classify task types',
      'Identify required agents',
      'Route to optimal handlers',
      'Estimate complexity'
    ],
    criticality: 'HIGH - Intelligent routing'
  },

  incomeGeneration: {
    name: 'IncomeGenerationAgent',
    file: 'incomeGenerationAgent.js',
    role: 'Income Opportunity Research',
    purpose: 'Researches and identifies income opportunities, grants, contracts',
    responsibilities: [
      'Research funding opportunities',
      'Identify contract opportunities',
      'Find job listings',
      'Analyze income potential'
    ],
    criticality: 'MEDIUM - Business development'
  },

  taskCompletionVerifier: {
    name: 'TaskCompletionVerifierAgent',
    file: 'taskCompletionVerifierAgent.js',
    role: 'Task Verification',
    purpose: 'Verifies task completion and validates output quality',
    responsibilities: [
      'Verify task completion',
      'Validate output quality',
      'Check acceptance criteria',
      'Report completion status'
    ],
    criticality: 'MEDIUM - Quality assurance'
  }
};

// ============================================================================
// DEPRECATED/ARCHIVED AGENTS (Not currently active in orchestration)
// ============================================================================
// These agents are available but not integrated into the core workflow:
// 
// - accountingAgent.js - Financial operations
// - architectureAgent.js - System architecture consulting  
// - complianceOfficerAgent.js - Compliance management
// - customerSuccessAgent.js - Customer operations
// - dataAnalystAgent.js - Data analysis
// - devopsAgent.js - DevOps infrastructure (superseded by deploymentAgent)
// - hrAgent.js - Human resources
// - imageGeneratorAgent.js - Image generation
// - legalSpecialistAgent.js - Legal consulting
// - marketingStrategistAgent.js - Marketing strategy
// - payrollAgent.js - Payroll processing
// - productManagerAgent.js - Product management
// - regulatoryComplianceAgent.js - Regulatory compliance (superseded by regulatoryKnowledgeBase)
// - researchAgent.js - Research and analysis
// - socialMediaAgent.js - Social media management
//
// These can be reactivated by adding to the agents object in src/index.js
// ============================================================================

/**
 * Get all active agents
 */
export function getActiveAgents() {
  return AGENT_REGISTRY;
}

/**
 * Get critical agents (production must-haves)
 */
export function getCriticalAgents() {
  return Object.entries(AGENT_REGISTRY)
    .filter(([_, agent]) => agent.criticality === 'CRITICAL')
    .reduce((acc, [key, agent]) => {
      acc[key] = agent;
      return acc;
    }, {});
}

/**
 * Get all agents by category
 */
export function getAgentsByCategory(category) {
  const categoryMap = {
    orchestration: ['manager', 'refiner', 'codeRefiner', 'delivery'],
    backend: ['backend', 'databaseArchitect', 'userAuth'],
    frontend: ['frontend'],
    integration: ['apiIntegration', 'deployment'],
    qa: ['qa', 'tests', 'testGeneration', 'fixer'],
    security: ['security', 'securityHardening', 'monitoring'],
    documentation: ['apiDocumentation', 'writer'],
    optimization: ['performanceOptimization'],
    autonomous: ['webBrowser', 'taskAnalyzer', 'incomeGeneration', 'taskCompletionVerifier']
  };
  
  return categoryMap[category] || [];
}

/**
 * Validate agent registry
 */
export function validateAgentRegistry() {
  const issues = [];
  
  Object.entries(AGENT_REGISTRY).forEach(([key, agent]) => {
    if (!agent.name) issues.push(`Agent ${key} missing name`);
    if (!agent.role) issues.push(`Agent ${key} missing role`);
    if (!agent.purpose) issues.push(`Agent ${key} missing purpose`);
    if (!agent.criticality) issues.push(`Agent ${key} missing criticality`);
    if (!['CRITICAL', 'HIGH', 'MEDIUM'].includes(agent.criticality)) {
      issues.push(`Agent ${key} has invalid criticality: ${agent.criticality}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    totalAgents: Object.keys(AGENT_REGISTRY).length,
    issues
  };
}

export default AGENT_REGISTRY;
