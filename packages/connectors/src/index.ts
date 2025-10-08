import type { IngestClient } from '@tribble/sdk-ingest';

export type JSONSchema = Record<string, any>;

export interface ConnectorContext {
  // Identity
  accountId: string;
  connectorId: string;

  // Tribble primitives for upload etc.
  tribble: { primitives?: { upload: (p: any) => Promise<any>; uploadBatch?: (p: any) => Promise<any> }; ingest: IngestClient };

  // Connector configuration (validated against configSchema)
  config: Record<string, any>;

  // State for incremental sync
  state: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };

  // Utilities (optional)
  tools?: { pdf?: { fromMarkdown: (md: string) => Promise<Uint8Array | Blob> } };
}

export interface PullParams {
  since?: string;
  params?: Record<string, any>;
}

export interface PullResult {
  processed?: number;
  total?: number;
}

export type SyncStrategy = 'pull' | 'push' | 'hybrid';

export interface ConnectorDefinition {
  // Identity & metadata
  name: string;
  version?: string;
  description?: string;
  vendor?: string;

  // Configuration schema
  configSchema?: JSONSchema;

  // Synchronization
  syncStrategy: SyncStrategy;
  pull?: (ctx: ConnectorContext, params: PullParams) => Promise<PullResult | void>;
  push?: (ctx: ConnectorContext, payload: any) => Promise<void>;

  // Scheduling (for pull connectors)
  schedule?: { cron?: string; interval?: number; timezone?: string };

  // Transformation/validation hooks
  transform?: (raw: any) => Promise<any>;
  validate?: (data: any) => Promise<{ ok: boolean; errors?: string[] }>;

  // Teardown
  teardown?: (ctx: ConnectorContext) => Promise<void>;
}

export function defineConnector(def: ConnectorDefinition): ConnectorDefinition { return def; }

// Lightweight in-memory state store; production should provide a durable store
export class MemoryStateStore {
  private m = new Map<string, any>();
  async get(key: string) { return this.m.get(key); }
  async set(key: string, value: any) { this.m.set(key, value); }
  async delete(key: string) { this.m.delete(key); }
}

export async function runConnectorOnce(def: ConnectorDefinition, ctx: ConnectorContext, params: PullParams = {}) {
  if (def.syncStrategy === 'pull' || def.syncStrategy === 'hybrid') {
    if (!def.pull) throw new Error('pull not implemented on connector');
    return def.pull(ctx, params);
  }
  throw new Error('runConnectorOnce only supports pull/hybrid connectors');
}
