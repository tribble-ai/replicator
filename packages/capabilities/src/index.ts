export interface CapabilitySpec {
  name: string; // e.g., "email.send"
  version: number; // major version
  idempotent?: boolean;
  summary?: string;
  inputs?: Record<string, any>; // shape prototype
  outputs?: Record<string, any>;
  errors?: string[]; // symbolic error names
}

export class CapabilityRegistry {
  private readonly map = new Map<string, CapabilitySpec>();
  constructor(specs: CapabilitySpec[]) {
    for (const s of specs) this.map.set(key(s.name, s.version), s);
  }
  has(name: string, version: number): boolean { return this.map.has(key(name, version)); }
  get(name: string, version: number): CapabilitySpec | undefined { return this.map.get(key(name, version)); }
  list(): CapabilitySpec[] { return [...this.map.values()]; }
}

function key(name: string, version: number) { return `${name}:v${version}`; }

export function parseCapabilityRef(ref: string): { name: string; version: number } | null {
  const m = ref.match(/^([a-z0-9_.-]+):v(\d+)$/i);
  return m ? { name: m[1], version: Number(m[2]) } : null;
}

export const DefaultCapabilityRegistry = new CapabilityRegistry([
  { name: 'contact.lookup', version: 1, idempotent: true, summary: 'Lookup a contact by key' },
  { name: 'email.send', version: 2, summary: 'Send an email using configured provider' },
  { name: 'crm.upsert', version: 1, idempotent: true, summary: 'Create or update CRM records' },
]);

