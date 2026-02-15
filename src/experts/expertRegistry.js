/**
 * Expert System Architecture
 * 
 * Instead of fixed agents, we have:
 * 1. A pool of specialized expert agents (Marketing, Security, Scaling, etc.)
 * 2. Dynamic prompt generation that adapts to task complexity
 * 3. Task analyzer that determines which experts are needed
 * 4. Manager orchestrates the right experts for the job
 */

export const EXPERT_TYPES = {
  ARCHITECT: 'architect',           // System design, structure
  BACKEND: 'backend',               // Backend implementation
  FRONTEND: 'frontend',             // Frontend implementation
  SECURITY: 'security',             // Security & compliance
  MARKETING: 'marketing',           // Go-to-market, monetization
  SCALING: 'scaling',               // Infrastructure, performance
  DEVOPS: 'devops',                 // CI/CD, deployment, monitoring
  QA: 'qa',                         // Testing strategy
  DATABASE: 'database',             // Data modeling, optimization
  API: 'api',                       // API design & standards
  DOCUMENTATION: 'documentation',   // Technical documentation
  PRODUCT: 'product',               // Product strategy & UX
};

/**
 * Expert profiles with their specializations
 */
export const EXPERT_PROFILES = {
  [EXPERT_TYPES.ARCHITECT]: {
    role: 'Solution Architect',
    focus: 'System design, scalability, tech stack selection',
    outputs: ['architecture_doc', 'tech_stack_recommendation', 'scaling_plan'],
    expertise: ['microservices', 'monolith', 'cloud_architecture', 'design_patterns']
  },
  [EXPERT_TYPES.SECURITY]: {
    role: 'Security Specialist',
    focus: 'Security, compliance, vulnerability prevention',
    outputs: ['security_review', 'threat_model', 'compliance_checklist'],
    expertise: ['auth', 'encryption', 'compliance', 'vulnerability_assessment']
  },
  [EXPERT_TYPES.MARKETING]: {
    role: 'Marketing Specialist',
    focus: 'Market analysis, positioning, monetization strategy',
    outputs: ['market_analysis', 'pricing_strategy', 'go_to_market_plan'],
    expertise: ['market_research', 'pricing', 'positioning', 'customer_acquisition']
  },
  [EXPERT_TYPES.SCALING]: {
    role: 'Scaling Specialist',
    focus: 'Performance, infrastructure, scalability',
    outputs: ['scaling_strategy', 'performance_targets', 'infrastructure_plan'],
    expertise: ['caching', 'databases', 'cdn', 'load_balancing', 'monitoring']
  },
  [EXPERT_TYPES.DEVOPS]: {
    role: 'DevOps Engineer',
    focus: 'CI/CD, deployment, monitoring, infrastructure-as-code',
    outputs: ['deployment_strategy', 'monitoring_plan', 'ci_cd_pipeline'],
    expertise: ['kubernetes', 'docker', 'terraform', 'monitoring', 'logging']
  },
  [EXPERT_TYPES.DATABASE]: {
    role: 'Database Architect',
    focus: 'Data modeling, optimization, backup strategies',
    outputs: ['schema_design', 'optimization_plan', 'backup_strategy'],
    expertise: ['sql', 'nosql', 'indexing', 'replication', 'sharding']
  },
  [EXPERT_TYPES.API]: {
    role: 'API Designer',
    focus: 'RESTful design, GraphQL, API security',
    outputs: ['api_specification', 'api_versioning_strategy'],
    expertise: ['rest', 'graphql', 'api_security', 'rate_limiting', 'pagination']
  },
  [EXPERT_TYPES.PRODUCT]: {
    role: 'Product Manager',
    focus: 'Product strategy, roadmap, feature prioritization',
    outputs: ['product_roadmap', 'feature_prioritization', 'user_personas'],
    expertise: ['user_research', 'roadmap_planning', 'feature_prioritization']
  }
};

/**
 * Task complexity levels determine which experts are needed
 */
export const TASK_COMPLEXITY = {
  SIMPLE: 'simple',           // Single feature, single expert
  MEDIUM: 'medium',           // Multiple components, 3-4 experts
  COMPLEX: 'complex',         // Full system, 6+ experts
  ENTERPRISE: 'enterprise'    // Large-scale production system, all experts
};
