import { z } from 'zod';
import type { ExtensionManifest, ToolManifest, IntegrationManifest } from '@tribble/sdk-extensions';

// ==================== Policy Types ====================

/**
 * Extension policy defines what an extension is allowed to do.
 */
export interface ExtensionPolicy {
  /** Policy name */
  name: string;
  /** Policy version */
  version: string;
  /** Policy rules */
  rules: PolicyRule[];
  /** Default deny or allow */
  defaultAction: 'allow' | 'deny';
}

/**
 * Policy rule definition.
 */
export interface PolicyRule {
  /** Rule identifier */
  id: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: PolicyRuleType;
  /** Rule configuration */
  config: PolicyRuleConfig;
  /** Action to take when rule matches */
  action: 'allow' | 'deny' | 'warn';
  /** Severity for violations */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export type PolicyRuleType =
  | 'capability'
  | 'integration'
  | 'network'
  | 'data'
  | 'tool'
  | 'manifest';

export interface PolicyRuleConfig {
  /** Allowed capabilities */
  allowedCapabilities?: string[];
  /** Blocked capabilities */
  blockedCapabilities?: string[];
  /** Allowed integrations */
  allowedIntegrations?: string[];
  /** Blocked integrations */
  blockedIntegrations?: string[];
  /** Allowed network domains */
  allowedDomains?: string[];
  /** Blocked network domains */
  blockedDomains?: string[];
  /** Data handling rules */
  dataRules?: DataPolicyRule[];
  /** Tool-specific rules */
  toolRules?: ToolPolicyRule[];
  /** Manifest validation rules */
  manifestRules?: ManifestPolicyRule[];
}

export interface DataPolicyRule {
  /** Data type pattern */
  dataType: string;
  /** Allowed operations */
  operations: Array<'read' | 'write' | 'delete' | 'export'>;
  /** Requires encryption */
  requireEncryption?: boolean;
  /** Requires audit logging */
  requireAudit?: boolean;
}

export interface ToolPolicyRule {
  /** Tool name pattern */
  toolPattern: string;
  /** Max executions per minute */
  rateLimit?: number;
  /** Requires approval */
  requireApproval?: boolean;
  /** Allowed arguments */
  allowedArgs?: string[];
}

export interface ManifestPolicyRule {
  /** Field to validate */
  field: string;
  /** Validation pattern */
  pattern?: string;
  /** Required value */
  requiredValue?: unknown;
  /** Max length */
  maxLength?: number;
}

// ==================== Policy Violation ====================

export interface PolicyViolation {
  /** Rule that was violated */
  ruleId: string;
  /** Violation message */
  message: string;
  /** Severity */
  severity: PolicyRule['severity'];
  /** Path to violation in manifest */
  path?: string;
  /** Suggested fix */
  suggestion?: string;
}

// ==================== Default Policies ====================

/**
 * Enterprise security policy - strict controls.
 */
export const ENTERPRISE_POLICY: ExtensionPolicy = {
  name: 'enterprise-security',
  version: '1.0.0',
  defaultAction: 'deny',
  rules: [
    {
      id: 'require-https',
      description: 'All network requests must use HTTPS',
      type: 'network',
      config: {
        blockedDomains: ['http://*'],
      },
      action: 'deny',
      severity: 'critical',
    },
    {
      id: 'approved-integrations',
      description: 'Only approved integrations allowed',
      type: 'integration',
      config: {
        allowedIntegrations: [
          'salesforce',
          'dynamics365',
          'sap',
          'oracle',
          'snowflake',
          'databricks',
        ],
      },
      action: 'deny',
      severity: 'high',
    },
    {
      id: 'pii-handling',
      description: 'PII data requires encryption and audit',
      type: 'data',
      config: {
        dataRules: [
          {
            dataType: 'pii',
            operations: ['read', 'write'],
            requireEncryption: true,
            requireAudit: true,
          },
        ],
      },
      action: 'deny',
      severity: 'critical',
    },
    {
      id: 'tool-rate-limiting',
      description: 'Tools must have rate limits',
      type: 'tool',
      config: {
        toolRules: [
          {
            toolPattern: '*',
            rateLimit: 100,
          },
        ],
      },
      action: 'warn',
      severity: 'medium',
    },
    {
      id: 'manifest-author',
      description: 'Manifest must have valid author',
      type: 'manifest',
      config: {
        manifestRules: [
          {
            field: 'author',
            pattern: '^[a-zA-Z0-9-_.]+$',
          },
        ],
      },
      action: 'deny',
      severity: 'high',
    },
  ],
};

/**
 * Development policy - relaxed for testing.
 */
export const DEVELOPMENT_POLICY: ExtensionPolicy = {
  name: 'development',
  version: '1.0.0',
  defaultAction: 'allow',
  rules: [
    {
      id: 'warn-http',
      description: 'Warn on HTTP usage',
      type: 'network',
      config: {
        blockedDomains: ['http://*'],
      },
      action: 'warn',
      severity: 'low',
    },
  ],
};

/**
 * Sandbox policy - restricted execution.
 */
export const SANDBOX_POLICY: ExtensionPolicy = {
  name: 'sandbox',
  version: '1.0.0',
  defaultAction: 'deny',
  rules: [
    {
      id: 'no-external-network',
      description: 'No external network access',
      type: 'network',
      config: {
        allowedDomains: ['localhost', '127.0.0.1', '*.tribble.local'],
      },
      action: 'deny',
      severity: 'critical',
    },
    {
      id: 'no-integrations',
      description: 'No external integrations',
      type: 'integration',
      config: {
        blockedIntegrations: ['*'],
      },
      action: 'deny',
      severity: 'critical',
    },
    {
      id: 'read-only-data',
      description: 'Read-only data access',
      type: 'data',
      config: {
        dataRules: [
          {
            dataType: '*',
            operations: ['read'],
          },
        ],
      },
      action: 'deny',
      severity: 'high',
    },
  ],
};

// ==================== Policy Validator ====================

/**
 * PolicyValidator - Validate extensions against security policies.
 *
 * @example
 * ```typescript
 * const validator = new PolicyValidator(ENTERPRISE_POLICY);
 *
 * const result = validator.validate(extension.manifest);
 * if (!result.valid) {
 *   console.log('Policy violations:', result.violations);
 * }
 * ```
 */
export class PolicyValidator {
  private policy: ExtensionPolicy;

  constructor(policy: ExtensionPolicy) {
    this.policy = policy;
  }

  /** Validate an extension manifest */
  validate(manifest: ExtensionManifest): PolicyValidationResult {
    const violations: PolicyViolation[] = [];

    for (const rule of this.policy.rules) {
      const ruleViolations = this.evaluateRule(rule, manifest);
      violations.push(...ruleViolations);
    }

    const critical = violations.filter(v => v.severity === 'critical');
    const high = violations.filter(v => v.severity === 'high');

    return {
      valid: critical.length === 0 && (this.policy.defaultAction === 'allow' || high.length === 0),
      violations,
      summary: {
        critical: critical.length,
        high: high.length,
        medium: violations.filter(v => v.severity === 'medium').length,
        low: violations.filter(v => v.severity === 'low').length,
        info: violations.filter(v => v.severity === 'info').length,
      },
    };
  }

  private evaluateRule(rule: PolicyRule, manifest: ExtensionManifest): PolicyViolation[] {
    switch (rule.type) {
      case 'capability':
        return this.evaluateCapabilityRule(rule, manifest);
      case 'integration':
        return this.evaluateIntegrationRule(rule, manifest);
      case 'tool':
        return this.evaluateToolRule(rule, manifest);
      case 'manifest':
        return this.evaluateManifestRule(rule, manifest);
      default:
        return [];
    }
  }

  private evaluateCapabilityRule(rule: PolicyRule, manifest: ExtensionManifest): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const capabilities = manifest.capabilities || [];

    if (rule.config.blockedCapabilities) {
      for (const cap of capabilities) {
        if (this.matchesPattern(cap, rule.config.blockedCapabilities)) {
          violations.push({
            ruleId: rule.id,
            message: `Blocked capability: ${cap}`,
            severity: rule.severity,
            path: 'capabilities',
            suggestion: `Remove capability "${cap}" or use an alternative`,
          });
        }
      }
    }

    return violations;
  }

  private evaluateIntegrationRule(rule: PolicyRule, manifest: ExtensionManifest): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const integrations = manifest.components.integrations || [];

    for (const integration of integrations) {
      if (rule.config.blockedIntegrations) {
        if (this.matchesPattern(integration.name, rule.config.blockedIntegrations)) {
          violations.push({
            ruleId: rule.id,
            message: `Blocked integration: ${integration.name}`,
            severity: rule.severity,
            path: `components.integrations[${integration.name}]`,
          });
        }
      }

      if (rule.config.allowedIntegrations && rule.action === 'deny') {
        if (!this.matchesPattern(integration.name, rule.config.allowedIntegrations)) {
          violations.push({
            ruleId: rule.id,
            message: `Integration not in allowlist: ${integration.name}`,
            severity: rule.severity,
            path: `components.integrations[${integration.name}]`,
            suggestion: `Contact admin to add "${integration.name}" to approved integrations`,
          });
        }
      }
    }

    return violations;
  }

  private evaluateToolRule(rule: PolicyRule, manifest: ExtensionManifest): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const tools = manifest.components.tools || [];

    for (const tool of tools) {
      if (rule.config.toolRules) {
        for (const toolRule of rule.config.toolRules) {
          if (this.matchesPattern(tool.name, [toolRule.toolPattern])) {
            // Check rate limit requirement
            if (toolRule.rateLimit) {
              violations.push({
                ruleId: rule.id,
                message: `Tool "${tool.name}" should have rate limit of ${toolRule.rateLimit}/min`,
                severity: rule.severity,
                path: `components.tools[${tool.name}]`,
                suggestion: 'Add rate limiting to tool implementation',
              });
            }
          }
        }
      }
    }

    return violations;
  }

  private evaluateManifestRule(rule: PolicyRule, manifest: ExtensionManifest): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    if (rule.config.manifestRules) {
      for (const mRule of rule.config.manifestRules) {
        const value = this.getNestedValue(manifest, mRule.field);

        if (mRule.pattern && typeof value === 'string') {
          const regex = new RegExp(mRule.pattern);
          if (!regex.test(value)) {
            violations.push({
              ruleId: rule.id,
              message: `Field "${mRule.field}" does not match required pattern`,
              severity: rule.severity,
              path: mRule.field,
              suggestion: `Value must match pattern: ${mRule.pattern}`,
            });
          }
        }

        if (mRule.requiredValue !== undefined && value !== mRule.requiredValue) {
          violations.push({
            ruleId: rule.id,
            message: `Field "${mRule.field}" must equal ${mRule.requiredValue}`,
            severity: rule.severity,
            path: mRule.field,
          });
        }

        if (mRule.maxLength && typeof value === 'string' && value.length > mRule.maxLength) {
          violations.push({
            ruleId: rule.id,
            message: `Field "${mRule.field}" exceeds max length of ${mRule.maxLength}`,
            severity: rule.severity,
            path: mRule.field,
          });
        }
      }
    }

    return violations;
  }

  private matchesPattern(value: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(value);
      }
      return value === pattern;
    });
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}

export interface PolicyValidationResult {
  valid: boolean;
  violations: PolicyViolation[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

// ==================== Policy Builder ====================

/**
 * PolicyBuilder - Fluent API for building custom policies.
 *
 * @example
 * ```typescript
 * const policy = new PolicyBuilder('my-company-policy')
 *   .defaultDeny()
 *   .allowIntegrations(['salesforce', 'dynamics365'])
 *   .blockCapabilities(['extensions.ingestAdapters'])
 *   .requireManifestField('license', 'MIT')
 *   .build();
 * ```
 */
export class PolicyBuilder {
  private _name: string;
  private _version: string = '1.0.0';
  private _defaultAction: 'allow' | 'deny' = 'allow';
  private _rules: PolicyRule[] = [];

  constructor(name: string) {
    this._name = name;
  }

  version(v: string): this {
    this._version = v;
    return this;
  }

  defaultAllow(): this {
    this._defaultAction = 'allow';
    return this;
  }

  defaultDeny(): this {
    this._defaultAction = 'deny';
    return this;
  }

  addRule(rule: PolicyRule): this {
    this._rules.push(rule);
    return this;
  }

  allowCapabilities(capabilities: string[]): this {
    this._rules.push({
      id: `allow-capabilities-${Date.now()}`,
      description: 'Allowed capabilities',
      type: 'capability',
      config: { allowedCapabilities: capabilities },
      action: 'allow',
      severity: 'info',
    });
    return this;
  }

  blockCapabilities(capabilities: string[]): this {
    this._rules.push({
      id: `block-capabilities-${Date.now()}`,
      description: 'Blocked capabilities',
      type: 'capability',
      config: { blockedCapabilities: capabilities },
      action: 'deny',
      severity: 'high',
    });
    return this;
  }

  allowIntegrations(integrations: string[]): this {
    this._rules.push({
      id: `allow-integrations-${Date.now()}`,
      description: 'Allowed integrations',
      type: 'integration',
      config: { allowedIntegrations: integrations },
      action: 'deny',
      severity: 'high',
    });
    return this;
  }

  blockIntegrations(integrations: string[]): this {
    this._rules.push({
      id: `block-integrations-${Date.now()}`,
      description: 'Blocked integrations',
      type: 'integration',
      config: { blockedIntegrations: integrations },
      action: 'deny',
      severity: 'high',
    });
    return this;
  }

  requireManifestField(field: string, pattern?: string): this {
    this._rules.push({
      id: `require-${field}-${Date.now()}`,
      description: `Require manifest field: ${field}`,
      type: 'manifest',
      config: {
        manifestRules: [{ field, pattern }],
      },
      action: 'deny',
      severity: 'high',
    });
    return this;
  }

  build(): ExtensionPolicy {
    return {
      name: this._name,
      version: this._version,
      defaultAction: this._defaultAction,
      rules: this._rules,
    };
  }
}

// ==================== Exports ====================

export { z } from 'zod';
