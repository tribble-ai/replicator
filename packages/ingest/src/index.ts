import type { TribbleConfig } from '@tribble/sdk-core';
import { HttpClient } from '@tribble/sdk-core';

export interface UploadPDFOptions {
  file: Uint8Array | ArrayBuffer | Blob;
  filename: string;
  metadata: Record<string, any>;
  traceId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface UploadBatchItem {
  file: Uint8Array | ArrayBuffer | Blob;
  filename: string;
  metadata: Record<string, any>;
}

export interface UploadBatchOptions {
  items: UploadBatchItem[];
  traceId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export class IngestClient {
  private readonly cfg: NonNullable<TribbleConfig['ingest']>;
  private readonly http: HttpClient;
  private readonly baseUrl: string;

  constructor(cfg: NonNullable<TribbleConfig['ingest']>) {
    this.cfg = cfg;
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.http = new HttpClient();
  }

  async uploadPDF(opts: UploadPDFOptions): Promise<{ success?: boolean; document_ids?: number[] }> {
    const res = await this.uploadBatch({ items: [{ file: opts.file, filename: opts.filename, metadata: opts.metadata }], traceId: opts.traceId, idempotencyKey: opts.idempotencyKey, signal: opts.signal });
    return res;
  }

  async uploadBatch(opts: UploadBatchOptions): Promise<{ success?: boolean; document_ids?: number[] }> {
    const token = await this.cfg.tokenProvider();
    const url = `${this.baseUrl}/api/upload`;
    const form = new FormData();
    opts.items.forEach((it, idx) => {
      const blob = toBlob(it.file, 'application/pdf');
      form.append('files', blob, it.filename);
      form.append(`metadata_${idx}`, JSON.stringify(it.metadata ?? {}));
    });

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(this.cfg.defaultHeaders || {}),
    };
    if (opts.traceId) headers['X-Tribble-Request-Id'] = String(opts.traceId);
    if (opts.idempotencyKey) headers['X-Idempotency-Key'] = String(opts.idempotencyKey);

    const { data } = await this.http.request<{ success?: boolean; document_ids?: number[] }>(url, {
      method: 'POST',
      body: form as any,
      headers,
      signal: opts.signal,
    });
    return data;
  }
}

function toBlob(data: Uint8Array | ArrayBuffer | Blob, type: string): Blob {
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
  const arr = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return new Blob([arr as any], { type });
}

export type { TribbleConfig };
