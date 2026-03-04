/**
 * Regulatory Knowledge Base
 * 
 * Centralized system for storing, querying, and applying regulatory rules
 * for any domain (tax, healthcare, finance, legal, etc.) and jurisdiction.
 * 
 * Extensible architecture allows loading regulations from multiple sources:
 * - JSON/YAML configuration files
 * - API endpoints (government databases)
 * - Expert input
 * - Machine learning from regulations
 */

export class RegulatoryKnowledgeBase {
  constructor() {
    // Store regulations organized by: domain > jurisdiction > rule
    this.regulations = new Map();
    
    // Store validated compliance mappings
    this.complianceMaps = new Map();
    
    // Store rule dependencies (rule A depends on rule B)
    this.dependencies = new Map();
    
    // Store exceptions and special cases
    this.exceptions = new Map();
    
    // Store changelog for regulation updates
    this.regulationUpdates = [];
  }

  /**
   * Load regulations from configuration
   */
  loadRegulations(domain, jurisdiction, rules) {
    const key = `${domain}:${jurisdiction}`;
    
    if (!this.regulations.has(domain)) {
      this.regulations.set(domain, new Map());
    }
    
    const domainRegs = this.regulations.get(domain);
    domainRegs.set(jurisdiction, new Map());
    
    const jurisdictionRegs = domainRegs.get(jurisdiction);
    
    // Store each rule with metadata
    rules.forEach((rule) => {
      jurisdictionRegs.set(rule.id, {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        applicability: rule.applicability, // Who does this apply to?
        requirements: rule.requirements || [],
        validations: rule.validations || [],
        penalties: rule.penalties,
        effectiveDate: rule.effectiveDate,
        expiryDate: rule.expiryDate,
        references: rule.references, // Links to official documentation
        dependsOn: rule.dependsOn || [], // Other rules this depends on
        relatedRules: rule.relatedRules || [],
        examples: rule.examples || [],
      });
      
      // Track dependencies
      if (rule.dependsOn) {
        this.dependencies.set(rule.id, rule.dependsOn);
      }
    });
    
    return this;
  }

  /**
   * Get all applicable rules for a specific scenario
   */
  getApplicableRules(domain, jurisdiction, context = {}) {
    const domainRegs = this.regulations.get(domain);
    if (!domainRegs) return [];
    
    const jurisdictionRegs = domainRegs.get(jurisdiction);
    if (!jurisdictionRegs) return [];
    
    const rules = Array.from(jurisdictionRegs.values());
    
    // Filter by applicability context (if provided)
    if (Object.keys(context).length === 0) {
      return rules;
    }
    
    return rules.filter((rule) => {
      if (!rule.applicability) return true;
      
      // Check if rule applies to given context
      return this.ruleAppliesToContext(rule, context);
    });
  }

  /**
   * Check if a rule applies to a given context
   */
  ruleAppliesToContext(rule, context) {
    const applicability = rule.applicability;
    
    // Check entity type (individual, business, organization)
    if (applicability.entityTypes && !applicability.entityTypes.includes(context.entityType)) {
      return false;
    }
    
    // Check income range
    if (applicability.incomeRange) {
      const { min, max } = applicability.incomeRange;
      if (context.income < min || context.income > max) {
        return false;
      }
    }
    
    // Check filing status
    if (applicability.filingStatuses && !applicability.filingStatuses.includes(context.filingStatus)) {
      return false;
    }
    
    // Check business type
    if (applicability.businessTypes && !applicability.businessTypes.includes(context.businessType)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get rule hierarchy (dependencies)
   */
  getRuleHierarchy(ruleId) {
    const hierarchy = {
      rule: ruleId,
      dependsOn: [],
      requiredBy: [],
    };
    
    // Find dependencies
    if (this.dependencies.has(ruleId)) {
      hierarchy.dependsOn = this.dependencies.get(ruleId);
    }
    
    // Find rules that depend on this one
    this.dependencies.forEach((deps, dependent) => {
      if (deps.includes(ruleId)) {
        hierarchy.requiredBy.push(dependent);
      }
    });
    
    return hierarchy;
  }

  /**
   * Get validation rules for code generation
   */
  getValidationRules(domain, jurisdiction, feature) {
    const rules = this.getApplicableRules(domain, jurisdiction);
    const validations = [];
    
    rules.forEach((rule) => {
      if (rule.requirements) {
        rule.requirements.forEach((req) => {
          if (req.appliesTo && req.appliesTo.includes(feature)) {
            validations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              validation: req.validation,
              errorMessage: req.errorMessage,
              severity: req.severity || 'error', // error, warning, info
            });
          }
        });
      }
    });
    
    return validations;
  }

  /**
   * Generate compliance documentation
   */
  generateComplianceDoc(domain, jurisdiction, context = {}) {
    const rules = this.getApplicableRules(domain, jurisdiction, context);
    
    const doc = {
      domain,
      jurisdiction,
      generatedAt: new Date(),
      applicableRules: [],
      requirements: [],
      validations: [],
      penalties: [],
      references: [],
    };
    
    rules.forEach((rule) => {
      // Check if active (effective date passed, expiry not reached)
      if (!this.isRuleActive(rule)) return;
      
      doc.applicableRules.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
      });
      
      if (rule.requirements) {
        doc.requirements.push(...rule.requirements);
      }
      
      if (rule.validations) {
        doc.validations.push(...rule.validations);
      }
      
      if (rule.penalties) {
        doc.penalties.push(...rule.penalties);
      }
      
      if (rule.references) {
        doc.references.push(...rule.references);
      }
    });
    
    return doc;
  }

  /**
   * Check if a rule is currently active
   */
  isRuleActive(rule) {
    const now = new Date();
    
    if (rule.effectiveDate && new Date(rule.effectiveDate) > now) {
      return false;
    }
    
    if (rule.expiryDate && new Date(rule.expiryDate) < now) {
      return false;
    }
    
    return true;
  }

  /**
   * Get jurisdiction hierarchy (e.g., federal > state > county > city)
   */
  getJurisdictionHierarchy(jurisdiction) {
    // Example: "US:CA:SanFrancisco" would return ["US", "US:CA", "US:CA:SanFrancisco"]
    const parts = jurisdiction.split(':');
    const hierarchy = [];
    
    for (let i = 1; i <= parts.length; i++) {
      hierarchy.push(parts.slice(0, i).join(':'));
    }
    
    return hierarchy;
  }

  /**
   * Get all applicable rules across jurisdiction hierarchy
   */
  getHierarchicalRules(domain, jurisdiction, context = {}) {
    const hierarchy = this.getJurisdictionHierarchy(jurisdiction);
    const allRules = [];
    const seen = new Set();
    
    // Collect rules from most specific to most general jurisdiction
    for (const j of hierarchy.reverse()) {
      const rules = this.getApplicableRules(domain, j, context);
      
      rules.forEach((rule) => {
        if (!seen.has(rule.id)) {
          allRules.push({
            ...rule,
            jurisdiction: j,
            specificity: hierarchy.indexOf(j), // 0 = most general, n = most specific
          });
          seen.add(rule.id);
        }
      });
    }
    
    // Sort by specificity (most specific first)
    return allRules.sort((a, b) => b.specificity - a.specificity);
  }

  /**
   * Find conflicting rules
   */
  findConflicts(domain, jurisdiction, context = {}) {
    const rules = this.getApplicableRules(domain, jurisdiction, context);
    const conflicts = [];
    
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];
        
        // Check if rules have conflicting requirements
        if (this.rulesConflict(rule1, rule2)) {
          conflicts.push({
            rules: [rule1.id, rule2.id],
            conflict: `Rule ${rule1.id} and ${rule2.id} have conflicting requirements`,
            resolution: this.resolveConflict(rule1, rule2),
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Check if two rules conflict
   */
  rulesConflict(rule1, rule2) {
    // Simple conflict detection - can be extended
    // Check if both require contradictory things
    if (rule1.requirements && rule2.requirements) {
      for (const req1 of rule1.requirements) {
        for (const req2 of rule2.requirements) {
          if (req1.appliesTo === req2.appliesTo && req1.validation !== req2.validation) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Resolve conflicts between rules
   */
  resolveConflict(rule1, rule2) {
    // Precedence: more specific jurisdiction > more recent rule > explicit conflict resolution
    return {
      strategy: 'apply_both_with_priority',
      priority: rule1.effectiveDate > rule2.effectiveDate ? rule1.id : rule2.id,
    };
  }

  /**
   * Record regulatory update
   */
  recordUpdate(domain, jurisdiction, ruleId, change) {
    this.regulationUpdates.push({
      timestamp: new Date(),
      domain,
      jurisdiction,
      ruleId,
      change,
    });
  }

  /**
   * Get regulations updated since date
   */
  getUpdatedRulesSince(domain, jurisdiction, since) {
    return this.regulationUpdates.filter(
      (update) =>
        update.domain === domain &&
        update.jurisdiction === jurisdiction &&
        update.timestamp > new Date(since)
    );
  }

  /**
   * Export all regulations as compliance matrix
   */
  exportComplianceMatrix(domain, jurisdiction) {
    const rules = this.getApplicableRules(domain, jurisdiction);
    const matrix = {
      domain,
      jurisdiction,
      generatedAt: new Date(),
      ruleCount: rules.length,
      rules: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        requirements: rule.requirements?.length || 0,
        validations: rule.validations?.length || 0,
        penalties: rule.penalties,
        references: rule.references,
      })),
    };
    
    return matrix;
  }
}

export default RegulatoryKnowledgeBase;
