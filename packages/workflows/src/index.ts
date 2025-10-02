import type { TribbleConfig } from '@tribble/sdk-core';
import { HttpClient, nowSeconds, subtleCrypto } from '@tribble/sdk-core';

export interface TriggerOptions {
  slug: string;
  input?: unknown;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class WorkflowsClient {
  private readonly cfg: NonNullable<TribbleConfig['workflows']>;
  private readonly http: HttpClient;

  constructor(cfg: NonNullable<TribbleConfig['workflows']>) {
    this.cfg = cfg;
    this.http = new HttpClient();
  }

  async trigger(opts: TriggerOptions): Promise<{ runId?: string }> {
    const ts = nowSeconds();
    const payload = JSON.stringify({ slug: opts.slug, input: opts.input ?? {} });
    const sig = await hmacSignature(this.cfg.signingSecret, payload, ts);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tribble-Signature': `t=${ts},v1=${sig}`,
      ...(this.cfg.defaultHeaders || {}),
      ...(opts.headers || {}),
    };
    if (opts.idempotencyKey) {
      headers['X-Idempotency-Key'] = String(opts.idempotencyKey);
      headers['Idempotency-Key'] = String(opts.idempotencyKey);
    }

    const endpoint = this.cfg.endpoint.replace(/\/$/, '');
    // Support both: POST /invoke with {slug,input} OR POST /<slug>
    const url = /\/invoke$/.test(endpoint) ? endpoint : `${endpoint}/${encodeURIComponent(opts.slug)}`;
    const { data } = await this.http.request<{ runId?: string }>(url, { method: 'POST', body: payload, headers, signal: opts.signal });
    return data;
  }
}

export async function hmacSignature(secret: string, payload: string, ts: number): Promise<string> {
  const data = new TextEncoder().encode(`${ts}.${payload}`);
  const sec = new TextEncoder().encode(secret);
  const subtle = subtleCrypto();
  if (subtle) {
    const key = await subtle.importKey('raw', sec, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await subtle.sign('HMAC', key, data);
    return bufferToHex(new Uint8Array(sig));
  }
  // Node.js fallback (avoid direct Buffer reference for type-agnostic build)
  // @ts-ignore - avoid requiring Node types for dts
  const { createHmac } = await import('node:crypto');
  return createHmac('sha256', sec).update(data).digest('hex');
}

function bufferToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export type { TribbleConfig };
