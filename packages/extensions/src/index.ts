import type { HeadersInitRecord } from '@tribble/sdk-core';
import { DefaultCapabilityRegistry, parseCapabilityRef as parseCapRef } from '@tribble/sdk-capabilities';
import { validatePolicies as validatePoliciesSpec } from '@tribble/sdk-policy';

// Extension Manifest v0 (MVP)
// A minimal, declarative manifest to define intents, policies, and required capabilities

export interface ExtensionManifest {
  name: string;
  version: string; // semver of the extension itself
  sdk: string; // e.g., "@tribble/sdk@0.x" or "tribble-sdk@2.x"
  capabilities: string[]; // e.g., ["email.send:v2", "crm.upsert:v1"]
  intents: IntentSpec[];
  policies?: PoliciesSpec;
  permissions?: string[];
  tests?: ContractTestSpec[];
}

export interface IntentSpec {
  when: string; // event name e.g., "lead_created"
  steps: StepSpec[];
}

export type StepSpec =
  | { type: 'call'; capability: string; params?: Record<string, any> }
  | { type: 'dedupe'; strategy: 'exact' | 'semantic' | 'semantic+exact'; threshold?: number }
  | { type: 'enrich'; source: string }
  | { type: 'route'; rule: string; owners: string[] };

export interface PoliciesSpec {
  pii?: 'allow' | 'redact' | 'deny';
  data_scope?: 'tenant' | 'global';
  cost_limit_usd?: number; // per-day ceiling (advisory; enforced server-side)
}

export interface ContractTestSpec {
  name: string;
  given_event: string; // path to fixture (JSON)
  expect: string[]; // sequence or set of capabilities expected, e.g., ["crm.upsert", "email.send"]
}

// Capability registry (MVP). In practice this would be hydrated from the control plane.
export interface Capability {
  name: string; // e.g., "email.send"
  version: number; // semantic major (v1 => 1)
  idempotent?: boolean;
}

export interface CapabilityRegistry {
  has(cap: { name: string; version: number }): boolean;
  list(): Capability[];
}

export class StaticCapabilityRegistry implements CapabilityRegistry {
  private readonly caps: Map<string, Capability>;
  constructor(list: Capability[]) {
    this.caps = new Map(list.map((c) => [`${c.name}:v${c.version}`, c]));
  }
  has(cap: { name: string; version: number }): boolean {
    return this.caps.has(`${cap.name}:v${cap.version}`);
  }
  list(): Capability[] {
    return Array.from(this.caps.values());
  }
}

// Seed registry with a few core capabilities mentioned in the strategy doc
export const DefaultCapabilities = new StaticCapabilityRegistry([
  { name: 'contact.lookup', version: 1, idempotent: true },
  { name: 'email.send', version: 2 },
  { name: 'crm.upsert', version: 1, idempotent: true },
]);

export interface ValidateOptions {
  capabilityRegistry?: CapabilityRegistry;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateManifest(manifest: unknown, opts: ValidateOptions = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const caps = opts.capabilityRegistry || DefaultCapabilities;

  if (!isObject(manifest)) return { ok: false, errors: ['Manifest must be an object'], warnings };

  const m = manifest as ExtensionManifest;
  // name
  if (!m.name || typeof m.name !== 'string') errors.push('name: required string');
  // version
  if (!m.version || typeof m.version !== 'string') errors.push('version: required semver string');
  // sdk
  if (!m.sdk || typeof m.sdk !== 'string') errors.push('sdk: required string (e.g., "@tribble/sdk@0.x")');
  // capabilities
  if (!Array.isArray(m.capabilities)) errors.push('capabilities: required string[]');
  else {
    for (const c of m.capabilities) {
      if (typeof c !== 'string') {
        errors.push(`capabilities: expected string, got ${typeof c}`);
        continue;
      }
      const parsed = parseCapabilityRef(c);
      if (!parsed) {
        errors.push(`capabilities: invalid ref "${c}" (expected name: vN like email.send:v2)`);
        continue;
      }
      if (!caps.has(parsed)) warnings.push(`capability not in registry: ${parsed.name}:v${parsed.version}`);
    }
  }
  // intents
  if (!Array.isArray(m.intents) || m.intents.length === 0) errors.push('intents: at least one intent is required');
  else {
    for (const [i, intent] of m.intents.entries()) {
      if (!isObject(intent)) {
        errors.push(`intents[${i}]: must be object`);
        continue;
      }
      if (!intent.when || typeof intent.when !== 'string') errors.push(`intents[${i}].when: required string`);
      if (!Array.isArray(intent.steps) || intent.steps.length === 0) errors.push(`intents[${i}].steps: must be non-empty array`);
      else {
        for (const [j, step] of intent.steps.entries()) {
          const e = validateStep(step as StepSpec);
          if (e) errors.push(`intents[${i}].steps[${j}]: ${e}`);
        }
      }
    }
  }
  // policies
  const pol = validatePoliciesSpec(m.policies, { strict: true });
  errors.push(...pol.errors);
  warnings.push(...pol.warnings);
  // permissions
  if (m.permissions && !Array.isArray(m.permissions)) errors.push('permissions: must be string[]');
  // tests
  if (m.tests) {
    if (!Array.isArray(m.tests)) errors.push('tests: must be array');
    else {
      for (const [k, t] of m.tests.entries()) {
        if (!isObject(t)) { errors.push(`tests[${k}]: must be object`); continue; }
        if (!t.name || typeof t.name !== 'string') errors.push(`tests[${k}].name: required string`);
        if (!t.given_event || typeof t.given_event !== 'string') errors.push(`tests[${k}].given_event: required path string`);
        if (!Array.isArray(t.expect)) errors.push(`tests[${k}].expect: required string[]`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function parseCapabilityRef(ref: string): { name: string; version: number } | null {
  // format: namespace.name:vN
  return parseCapRef(ref);
}

function validateStep(step: StepSpec): string | null {
  if (!isObject(step)) return 'step must be object';
  const t = (step as any).type;
  if (!t || typeof t !== 'string') return 'missing step.type';
  switch (t) {
    case 'call': {
      if (typeof (step as any).capability !== 'string') return 'call.capability must be string';
      if (parseCapabilityRef((step as any).capability) == null) return 'call.capability invalid (expected name:vN)';
      return null;
    }
    case 'dedupe': {
      const strat = (step as any).strategy;
      if (!['exact', 'semantic', 'semantic+exact'].includes(strat)) return 'dedupe.strategy must be exact|semantic|semantic+exact';
      if ((step as any).threshold !== undefined && typeof (step as any).threshold !== 'number') return 'dedupe.threshold must be number';
      return null;
    }
    case 'enrich': {
      if (typeof (step as any).source !== 'string') return 'enrich.source must be string';
      return null;
    }
    case 'route': {
      if (typeof (step as any).rule !== 'string') return 'route.rule must be string';
      if (!Array.isArray((step as any).owners)) return 'route.owners must be string[]';
      return null;
    }
    default:
      return `unknown step.type: ${t}`;
  }
}

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

// Packaging helpers (MVP)
export interface PackOptions {
  manifest: ExtensionManifest;
  headers?: HeadersInitRecord;
}

export function planFromManifest(manifest: ExtensionManifest) {
  // Provide a normalized execution plan derived from intents for preview/testing
  return manifest.intents.map((i) => ({ when: i.when, steps: i.steps.map((s) => ({ ...s })) }));
}
