export type PiiPolicy = 'allow' | 'redact' | 'deny';
export type DataScope = 'tenant' | 'global';

export interface PoliciesSpec {
  pii?: PiiPolicy;
  data_scope?: DataScope;
  cost_limit_usd?: number;
}

export interface PolicyValidation {
  errors: string[];
  warnings: string[];
}

export function validatePolicies(p: PoliciesSpec | undefined, opts: { strict?: boolean } = {}): PolicyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!p) {
    return opts.strict ? { errors: ['policies: missing (pii, data_scope required in strict mode)'], warnings } : { errors, warnings: ['policies: missing'] };
  }
  if (!['allow', 'redact', 'deny'].includes((p.pii as any) || '')) errors.push('policies.pii: must be allow|redact|deny');
  if (!['tenant', 'global'].includes((p.data_scope as any) || '')) errors.push('policies.data_scope: must be tenant|global');
  if (p.cost_limit_usd !== undefined && (typeof p.cost_limit_usd !== 'number' || p.cost_limit_usd < 0)) errors.push('policies.cost_limit_usd: must be non-negative number');
  // Opinionated warning: global scope increases risk
  if (p.data_scope === 'global') warnings.push('policies.data_scope: global increases risk; ensure approval');
  return { errors, warnings };
}

