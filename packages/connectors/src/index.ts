import type { IngestClient } from '@tribble/sdk-ingest';

export interface ConnectorContext {
  accountId?: string;
  tribble: { ingest: IngestClient };
  tools?: { pdf?: { fromMarkdown: (md: string) => Promise<Uint8Array | Blob> } };
  config: Record<string, any>;
}

export interface ConnectorSchedule {
  /** crontab string */
  schedule?: string;
}

export interface ConnectorDefinition extends ConnectorSchedule {
  name: string;
  configSchema?: unknown; // e.g., zod schema provided by integrator
  pull: (ctx: ConnectorContext, args: { since: string; params: Record<string, any> }) => Promise<{ documents?: string[] } | void>;
}

export function defineConnector(def: ConnectorDefinition): ConnectorDefinition {
  return def;
}

