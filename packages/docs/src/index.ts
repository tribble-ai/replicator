import { IngestClient, type UploadPDFOptions } from '@tribble/sdk-ingest';
import type { TribbleConfig } from '@tribble/sdk-core';

export interface UploadOptions extends Omit<UploadPDFOptions, 'metadata'> {
  label?: string;
  useForGeneration?: boolean;
  sourceUrl?: string;
  metadata?: Record<string, any>;
}

export interface UploadCallbacks {
  onProgress?: (progress: number) => void; // 0..1 best-effort
}

export class DocsClient {
  private readonly ingest: IngestClient;
  constructor(cfg: NonNullable<TribbleConfig['ingest']>) {
    this.ingest = new IngestClient(cfg);
  }

  async upload(opts: UploadOptions, cb: UploadCallbacks = {}): Promise<{ success?: boolean; document_ids?: number[] }> {
    cb.onProgress?.(0);
    const metadata = {
      ...(opts.metadata || {}),
      label: opts.label ?? opts.metadata?.label,
      useForGeneration: opts.useForGeneration ?? opts.metadata?.useForGeneration ?? true,
      source_url: opts.sourceUrl ?? opts.metadata?.source_url,
    };
    const res = await this.ingest.uploadBatch({
      items: [{ file: opts.file, filename: opts.filename, metadata }],
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
    cb.onProgress?.(1);
    return res;
  }
}

export type { TribbleConfig };
