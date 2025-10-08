import type { TribbleConfig } from '@tribble/sdk-core';
import { HttpClient } from '@tribble/sdk-core';
import { IngestClient } from '@tribble/sdk-ingest';
import { ControlClient } from '@tribble/sdk-control';

// CUDA-like primitive types
export type JSONSchema = Record<string, any>;

export interface UploadParams {
  content: string | Uint8Array | ArrayBuffer | Blob | URL;
  contentType: 'pdf' | 'html' | 'text' | 'markdown' | 'json' | 'csv' | 'xml' | 'binary';
  filename?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  schema?: JSONSchema;
  processingHints?: {
    extractTables?: boolean;
    ocrLanguage?: string;
    chunkingStrategy?: 'paragraph' | 'semantic' | 'fixed';
    deduplication?: 'exact' | 'fuzzy' | 'none';
  };
  traceId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface UploadResult {
  documentId?: string | number;
  chunks?: number;
  status?: 'processing' | 'indexed' | 'queued';
}

export interface UploadBatchParams {
  documents: UploadParams[];
  transactional?: boolean;
}

export interface UploadBatchResult {
  succeeded: Array<{ index: number; documentId?: string | number }>;
  failed: Array<{ index: number; error: string }>;
}

export class PrimitivesClient {
  private readonly cfg: TribbleConfig;
  private readonly ingest?: IngestClient;
  private readonly http: HttpClient;
  private readonly control?: ControlClient;

  constructor(cfg: TribbleConfig) {
    this.cfg = cfg;
    this.http = new HttpClient();
    this.ingest = cfg.ingest ? new IngestClient(cfg.ingest) : undefined;
    // Optional control plane for orchestration primitives
    const anyCfg: any = cfg as any;
    if (anyCfg.control?.baseUrl && anyCfg.control?.tokenProvider) {
      this.control = new ControlClient({ baseUrl: anyCfg.control.baseUrl, tokenProvider: anyCfg.control.tokenProvider, defaultHeaders: anyCfg.control.defaultHeaders });
    }
  }

  // Unified upload primitive backed by current IngestClient endpoints
  async upload(p: UploadParams): Promise<UploadResult> {
    if (!this.ingest) throw new Error('ingest config missing');

    const filename = p.filename || inferFilename(p.contentType);
    if (p.contentType === 'pdf' || p.contentType === 'html' || p.contentType === 'text' || p.contentType === 'markdown') {
      // treat as document upload
      const blob = await toBlob(p.content);
      const type: any = p.contentType === 'markdown' ? 'text' : p.contentType;
      const res = await this.ingest.uploadDocument({
        file: blob,
        filename,
        documentType: type,
        metadata: enrichMetadata(p),
        traceId: p.traceId,
        idempotencyKey: p.idempotencyKey,
        signal: p.signal,
      });
      return { documentId: res.document_ids?.[0], status: res.success ? 'queued' : undefined };
    }

    if (p.contentType === 'csv' || p.contentType === 'json') {
      const data = await normalizeStructured(p.content, p.contentType);
      const res = await this.ingest.uploadStructuredData({
        data,
        format: p.contentType,
        filename,
        // Current ingest expects StructuredMetadata.schema as DataSchema[]; attach JSONSchema under jsonSchema
        metadata: { ...(p.schema ? { jsonSchema: p.schema } : {}), ...(p.metadata || {}) },
        traceId: p.traceId,
        idempotencyKey: p.idempotencyKey,
        signal: p.signal,
      });
      return { documentId: res.document_ids?.[0], status: res.success ? 'queued' : undefined };
    }

    // Fallback: treat as binary document
    const blob = await toBlob(p.content);
    const res = await this.ingest.uploadDocument({
      file: blob,
      filename,
      documentType: 'auto',
      metadata: enrichMetadata(p),
      traceId: p.traceId,
      idempotencyKey: p.idempotencyKey,
      signal: p.signal,
    });
    return { documentId: res.document_ids?.[0], status: res.success ? 'queued' : undefined };
  }

  async uploadBatch(p: UploadBatchParams): Promise<UploadBatchResult> {
    const succeeded: Array<{ index: number; documentId?: string | number }> = [];
    const failed: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < p.documents.length; i++) {
      try {
        const r = await this.upload(p.documents[i]);
        succeeded.push({ index: i, documentId: r.documentId });
      } catch (e: any) {
        if (p.transactional) return { succeeded: [], failed: [{ index: i, error: String(e?.message || e) }] };
        failed.push({ index: i, error: String(e?.message || e) });
      }
    }
    return { succeeded, failed };
  }

  // Placeholders for future wiring (control plane endpoints)
  async createTag(p: { name: string; color?: string }): Promise<{ tagId: string }> {
    if (!this.control) throw new Error('control config missing');
    return this.control.createTag(p);
  }

  async createUser(p: { externalId: string; attributes?: Record<string, any> }): Promise<{ userId: string }> {
    if (!this.control) throw new Error('control config missing');
    return this.control.createUser(p);
  }

  async createWorkflow(p: { name: string; trigger: any; actions: any[] }): Promise<{ workflowId: string }> {
    if (!this.control) throw new Error('control config missing');
    return this.control.createWorkflow(p);
  }

  async executeAction(p: { name: string; version?: number; params: Record<string, any> }): Promise<{ result: any }> {
    if (!this.control) throw new Error('control config missing');
    const version = p.version ?? 1;
    return this.control.executeCapability({ name: p.name, version, params: p.params });
  }

  async query(p: { q: string; limit?: number }): Promise<{ rows: any[] }> {
    if (!this.control) throw new Error('control config missing');
    return this.control.query(p);
  }

  async subscribe(p: { events: string[]; webhookUrl: string; signingSecret?: string }): Promise<{ subscriptionId: string }> {
    if (!this.control) throw new Error('control config missing');
    return this.control.subscribe(p);
  }
}

function inferFilename(contentType: UploadParams['contentType']): string {
  const ext = contentType === 'markdown' ? 'md' : contentType === 'binary' ? 'bin' : contentType;
  return `upload-${Date.now()}.${ext}`;
}

async function toBlob(content: UploadParams['content']): Promise<Blob> {
  if (typeof Blob !== 'undefined' && content instanceof Blob) return content;
  if (content instanceof URL) {
    const res = await fetch(content);
    const buf = await res.arrayBuffer();
    return new Blob([buf]);
  }
  if (typeof content === 'string') {
    return new Blob([content]);
  }
  const arr = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
  return new Blob([arr as any]);
}

async function normalizeStructured(content: UploadParams['content'], kind: 'csv' | 'json'): Promise<any> {
  if (typeof content === 'string') return content;
  if (content instanceof URL) {
    const res = await fetch(content);
    return kind === 'json' ? res.json() : res.text();
  }
  if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
    if (kind === 'json') {
      const text = new TextDecoder().decode(content instanceof ArrayBuffer ? new Uint8Array(content) : content);
      try { return JSON.parse(text); } catch { return text; }
    }
    return new TextDecoder().decode(content instanceof ArrayBuffer ? new Uint8Array(content) : content);
  }
  // Blob
  const text = await (content as Blob).text();
  if (kind === 'json') { try { return JSON.parse(text); } catch { return text; } }
  return text;
}

function enrichMetadata(p: UploadParams): Record<string, any> {
  const base = p.metadata || {};
  if (p.tags?.length) base.tags = p.tags;
  if (p.processingHints) base.processingHints = p.processingHints;
  if (p.schema) base.schema = p.schema;
  return base;
}

export type { TribbleConfig };
