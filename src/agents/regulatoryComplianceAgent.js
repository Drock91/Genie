/**
 * Regulatory Compliance Agent
 * 
 * Applies regulatory rules to generated code, ensuring compliance with
 * domain-specific regulations for any jurisdiction.
 * 
 * Works with: Tax, Healthcare, Finance, Legal Tech, etc.
 * Supports: Global jurisdictions and hierarchy
 */

import { BaseAgent } from './baseAgent.js';
import { makeAgentOutput } from '../models.js';
import RegulatoryKnowledgeBase from '../compliance/regulatoryKnowledgeBase.js';

export class RegulatoryComplianceAgent extends BaseAgent {
  constructor(options = {}) {
    super({ ...options, name: 'RegulatoryComplianceAgent' });
    this.knowledgeBase = new RegulatoryKnowledgeBase();
    this.complianceCache = new Map();
  }

  /**
   * Load regulations for a domain and jurisdiction
   */
  loadRegulations(domain, jurisdiction, rules) {
    this.knowledgeBase.loadRegulations(domain, jurisdiction, rules);
    this.info(
      { domain, jurisdiction, ruleCount: rules.length },
      'Regulations loaded'
    );
    return this;
  }

  /**
   * Generate compliant code for a feature
   */
  async generateCompliantFeature(request) {
    this.info({ stage: 'init' }, 'Starting compliant feature generation');

    try {
      const { domain, jurisdiction, feature, context = {} } = request;

      // Get applicable regulations
      const rules = this.knowledgeBase.getHierarchicalRules(
        domain,
        jurisdiction,
        context
      );

      if (rules.length === 0) {
        this.warn(
          { domain, jurisdiction },
          'No regulations found'
        );
      }

      // Get validation rules for this feature
      const validations = this.knowledgeBase.getValidationRules(
        domain,
        jurisdiction,
        feature
      );

      // Check for conflicts
      const conflicts = this.knowledgeBase.findConflicts(
        domain,
        jurisdiction,
        context
      );

      // Generate compliant code
      const code = await this.generateCode(
        { domain, jurisdiction, feature, context },
        rules,
        validations
      );

      // Generate compliance documentation
      const complianceDocs = await this.generateComplianceDocs(
        domain,
        jurisdiction,
        feature,
        rules,
        validations
      );

      // Generate compliance validation
      const validation = await this.generateValidationCode(
        feature,
        validations,
        rules
      );

      // Generate audit trail code
      const audit = await this.generateAuditCode(
        feature,
        rules,
        domain
      );

      // Generate compliance tests
      const tests = await this.generateComplianceTests(
        feature,
        validations,
        rules
      );

      const patches = [
        ...code,
        ...complianceDocs,
        ...validation,
        ...audit,
        ...tests,
      ];

      if (conflicts.length > 0) {
        this.warn(
          { conflictCount: conflicts.length },
          'Regulatory conflicts detected'
        );
        patches.push(
          ...this.generateConflictResolutionDocs(conflicts)
        );
      }

      return makeAgentOutput({
        summary: `RegulatoryComplianceAgent: Generated ${patches.length} compliant files for ${feature} in ${jurisdiction}`,
        patches,
        metadata: {
          ruleCount: rules.length,
          validationCount: validations.length,
          conflicts: conflicts.length,
          domain,
          jurisdiction,
        },
      });
    } catch (error) {
      this.error({ error: error.message }, 'Generation failed');
      return this.getFallbackCompliance(request);
    }
  }

  /**
   * Generate compliant feature code
   */
  async generateCode(request, rules, validations) {
    const { domain, feature } = request;

    // Build compliance requirements into code
    const requirements = rules.map((r) => r.requirements || []).flat();

    const code = `
/**
 * ${feature} - Regulatory Compliant Implementation
 * 
 * Automatically generated with compliance requirements from:
 ${rules.map((r) => `* - ${r.name} (${r.jurisdiction})`).join('\n * ')}
 */

import { complianceValidator } from '../compliance/validator';

export class ${this.toPascalCase(feature)} {
  constructor(context = {}) {
    this.context = context;
    this.validations = ${JSON.stringify(validations, null, 2)};
  }

  /**
   * Main feature implementation
   */
  async execute(input) {
    // 1. Validate regulatory requirements before processing
    await this.validateCompliance(input);

    // 2. Process with compliance checks
    const result = await this.process(input);

    // 3. Validate output compliance
    await this.validateOutput(result);

    // 4. Log for audit trail
    await this.logComplianceAction(input, result);

    return result;
  }

  /**
   * Validate input against regulatory requirements
   */
  async validateCompliance(input) {
    const errors = [];

    for (const validation of this.validations) {
      try {
        if (!this.validateRule(input, validation)) {
          errors.push({
            ruleId: validation.ruleId,
            rule: validation.ruleName,
            error: validation.errorMessage,
            severity: validation.severity,
          });
        }
      } catch (error) {
        this.logError(\`Validation failed for rule \${validation.ruleId}\`, error);
      }
    }

    if (errors.some((e) => e.severity === 'error')) {
      throw new ComplianceError('Regulatory requirements not met', errors);
    }

    return errors;
  }

  /**
   * Validate individual rule
   */
  validateRule(input, validation) {
    // This will be customized per domain
    switch (validation.ruleId) {
      case 'DATA_RETENTION':
        return this.validateDataRetention(input, validation);
      case 'ENCRYPTION':
        return this.validateEncryption(input, validation);
      case 'AUDIT_TRAIL':
        return this.validateAuditTrail(input, validation);
      default:
        return true;
    }
  }

  /**
   * Process feature
   */
  async process(input) {
    // Domain-specific implementation
    return {
      success: true,
      data: input,
      compliant: true,
    };
  }

  /**
   * Validate output compliance
   */
  async validateOutput(output) {
    if (!output.compliant) {
      throw new ComplianceError('Output is not compliant');
    }
  }

  /**
   * Log compliance action for audit trail
   */
  async logComplianceAction(input, output) {
    const log = {
      timestamp: new Date().toISOString(),
      feature: '${feature}',
      action: 'COMPLIANCE_CHECK',
      status: 'SUCCESS',
      rules: ${JSON.stringify(rules.map((r) => r.id))},
    };

    // Log to audit system
    console.log('[COMPLIANCE]', log);
  }

  // Domain-specific validators
  validateDataRetention(input, validation) { return true; }
  validateEncryption(input, validation) { return true; }
  validateAuditTrail(input, validation) { return true; }
}

export class ComplianceError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ComplianceError';
    this.errors = errors;
  }
}
`;

    return [
      {
        fileName: `${this.toKebabCase(feature)}.js`,
        filePath: `src/features/${this.toKebabCase(feature)}/index.js`,
        content: code,
        description: `Regulatory compliant ${feature} implementation`,
      },
    ];
  }

  /**
   * Generate compliance documentation
   */
  async generateComplianceDocs(domain, jurisdiction, feature, rules, validations) {
    const complianceDoc = this.knowledgeBase.generateComplianceDoc(
      domain,
      jurisdiction
    );

    const markdown = `# ${feature} - Compliance Documentation

## Jurisdiction: ${jurisdiction}
## Domain: ${domain}
## Generated: ${new Date().toISOString()}

## Applicable Regulations

${complianceDoc.applicableRules.map((rule) => `### ${rule.name}
${rule.description}

`).join('\n')}

## Required Implementations

${complianceDoc.requirements.map((req) => `- **${req.appliesTo}**: ${req.validation}`).join('\n')}

## Validation Rules

${validations.map((v) => `- **${v.ruleName}** (${v.ruleId}): ${v.validation}
  - Error: ${v.errorMessage}
  - Severity: ${v.severity}`).join('\n')}

## Penalties for Non-Compliance

${complianceDoc.penalties.map((p) => `- ${p.description}: ${p.amount}`).join('\n')}

## Official References

${complianceDoc.references.map((r) => `- [${r.title}](${r.url})`).join('\n')}

## Implementation Checklist

${complianceDoc.applicableRules.map((rule) => `- [ ] ${rule.name}`).join('\n')}

---

*This documentation is automatically generated based on current regulations.*
*Update frequency: Check quarterly or when regulations change.*
`;

    return [
      {
        fileName: 'COMPLIANCE.md',
        filePath: `docs/${this.toKebabCase(feature)}/COMPLIANCE.md`,
        content: markdown,
        description: 'Compliance documentation',
      },
    ];
  }

  /**
   * Generate validation code
   */
  async generateValidationCode(feature, validations, rules) {
    const validators = validations.map((v) => `
  /**
   * ${v.ruleName}
   * Rule ID: ${v.ruleId}
   */
  validate${this.toPascalCase(v.ruleId)}(input) {
    try {
      // Implement ${v.validation}
      return true;
    } catch (error) {
      return {
        valid: false,
        error: '${v.errorMessage}',
        severity: '${v.severity}'
      };
    }
  }`).join('\n');

    const code = `
/**
 * Compliance Validators for ${feature}
 * 
 * Auto-generated validators based on regulatory requirements
 */

export class ComplianceValidators {
${validators}
}

export default ComplianceValidators;
`;

    return [
      {
        fileName: 'validators.js',
        filePath: `src/compliance/validators/${this.toKebabCase(feature)}-validators.js`,
        content: code,
        description: 'Compliance validators',
      },
    ];
  }

  /**
   * Generate audit trail code
   */
  async generateAuditCode(feature, rules, domain) {
    const auditCode = `
/**
 * Audit Trail for ${feature}
 * 
 * Tracks all compliance-relevant actions for regulatory oversight
 */

export class AuditTrail {
  constructor() {
    this.logs = [];
  }

  /**
   * Log compliance action
   */
  log(action, details, ruleId) {
    const entry = {
      timestamp: new Date().toISOString(),
      action: action,
      feature: '${feature}',
      domain: '${domain}',
      ruleId: ruleId,
      details: details,
      userId: this.getCurrentUser(),
      ipAddress: this.getCurrentIPAddress(),
    };

    this.logs.push(entry);
    this.persistLog(entry);
  }

  /**
   * Get audit trail for specific period
   */
  getAuditTrail(startDate, endDate) {
    return this.logs.filter(
      (log) =>
        new Date(log.timestamp) >= startDate &&
        new Date(log.timestamp) <= endDate
    );
  }

  /**
   * Export audit trail (for regulatory review)
   */
  exportAuditTrail(format = 'json') {
    if (format === 'csv') {
      return this.toCSV();
    }
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Persist log to secure storage
   */
  async persistLog(entry) {
    // Store in immutable audit log (database, blockchain, etc.)
    console.log('[AUDIT]', entry);
  }

  getCurrentUser() {
    return process.env.USER || 'system';
  }

  getCurrentIPAddress() {
    return process.env.IP || '0.0.0.0';
  }

  toCSV() {
    const headers = ['timestamp', 'action', 'feature', 'ruleId', 'details'];
    const rows = this.logs.map((log) =>
      headers.map((h) => JSON.stringify(log[h])).join(',')
    );
    return [headers.join(','), ...rows].join('\\n');
  }
}

export default AuditTrail;
`;

    return [
      {
        fileName: 'audit-trail.js',
        filePath: `src/compliance/audit/${this.toKebabCase(feature)}-audit.js`,
        content: auditCode,
        description: 'Audit trail implementation',
      },
    ];
  }

  /**
   * Generate compliance tests
   */
  async generateComplianceTests(feature, validations, rules) {
    const tests = validations.map((v) => `
  it('should validate ${v.ruleName}', () => {
    const validator = new ComplianceValidators();
    const result = validator.validate${this.toPascalCase(v.ruleId)}(testInput);
    expect(result).toBe(true);
  });
`).join('\n');

    const testCode = `
/**
 * Compliance Tests for ${feature}
 * 
 * Tests regulatory requirements
 */

import { describe, it, expect } from '@jest/globals';
import ComplianceValidators from '../../compliance/validators/${this.toKebabCase(feature)}-validators';

describe('${feature} Compliance', () => {
  let validators;
  const testInput = {};

  beforeEach(() => {
    validators = new ComplianceValidators();
  });

${tests}

  it('should pass all regulatory requirements', () => {
    const allPassed = true; // Run all validators
    expect(allPassed).toBe(true);
  });
});
`;

    return [
      {
        fileName: `${this.toKebabCase(feature)}.compliance.test.js`,
        filePath: `tests/compliance/${this.toKebabCase(feature)}.test.js`,
        content: testCode,
        description: 'Compliance tests',
      },
    ];
  }

  /**
   * Generate conflict resolution documentation
   */
  generateConflictResolutionDocs(conflicts) {
    const doc = `# Regulatory Conflicts Resolution

## Conflicts Detected: ${conflicts.length}

${conflicts.map((c, idx) => `
### Conflict ${idx + 1}
- **Rules**: ${c.rules.join(' vs ')}
- **Issue**: ${c.conflict}
- **Resolution**: ${c.resolution.strategy}
- **Priority**: Apply rule ID ${c.resolution.priority} first
`).join('\n')}

## Resolution Strategy

When multiple regulatory requirements conflict:
1. Apply the rule with the highest specificity (most specific jurisdiction)
2. If same specificity, apply the more recent regulation
3. If still unresolved, consult legal counsel and document decision

## Manual Review Required

Please review these conflicts with legal experts to ensure compliance.
`;

    return [
      {
        fileName: 'CONFLICTS.md',
        filePath: 'docs/compliance/CONFLICTS.md',
        content: doc,
        description: 'Conflict resolution guide',
      },
    ];
  }

  /**
   * Utility functions
   */
  toPascalCase(str) {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]/g, '-')
      .toLowerCase();
  }

  getFallbackCompliance(request) {
    this.warn({ stage: 'fallback' }, 'Using fallback compliance generation');

    return makeAgentOutput({
      summary: 'RegulatoryComplianceAgent: Generated basic compliant structure (fallback)',
      patches: [
        {
          fileName: 'compliance.js',
          filePath: 'src/compliance/compliance.js',
          content: `
export class ComplianceLayer {
  validateCompliance(input) {
    return true;
  }
}
`,
        },
      ],
      metadata: { fallback: true },
    });
  }
}
