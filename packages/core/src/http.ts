import { sleep } from './util';
import { AuthError, NetworkError, RateLimitError, ServerError, TimeoutError, ValidationError } from './errors';

export interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number; // for 429/5xx
  timeoutMs?: number;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retry?: {
    retries?: number;
    backoffMs?: number;
    maxBackoffMs?: number;
  };
}

export class HttpClient {
  private readonly baseUrl?: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly maxRetries: number;
  private readonly timeoutMs?: number;

  constructor(opts: HttpClientOptions = {}) {
    this.baseUrl = opts.baseUrl;
    this.defaultHeaders = opts.defaultHeaders ?? {};
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs;
  }

  private withBase(url: string): string {
    if (!this.baseUrl) return url;
    if (url.startsWith('http')) return url;
    const slash = this.baseUrl.endsWith('/') || url.startsWith('/') ? '' : '/';
    return `${this.baseUrl}${slash}${url}`;
  }

  async request<T = unknown>(url: string, options: RequestOptions = {}): Promise<{ data: T; response: Response }> {
    const target = this.withBase(url);
    const headers = { ...this.defaultHeaders, ...(options.headers || {}) } as Record<string, string>;
    const timeoutMs = options.timeoutMs ?? this.timeoutMs ?? 30000;
    const retry = { retries: this.maxRetries, backoffMs: 300, maxBackoffMs: 3000, ...(options.retry || {}) };

    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= (retry.retries ?? 0)) {
      const ac = new AbortController();
      const id = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(target, { ...options, headers, signal: options.signal ?? ac.signal });
        clearTimeout(id);
        if (!res.ok) {
          const text = await safeText(res);
          const err = this.toError(res.status, text, res.headers.get('x-tribble-request-id') || undefined);
          if (shouldRetry(res.status) && attempt < (retry.retries ?? 0)) {
            const delay = Math.min((retry.backoffMs ?? 300) * Math.pow(2, attempt) + jitter(), retry.maxBackoffMs ?? 3000);
            await sleep(delay);
            attempt++;
            continue;
          }
          throw err;
        }
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : ((await res.text()) as any);
        return { data: data as T, response: res };
      } catch (e: any) {
        clearTimeout(id);
        if (e?.name === 'AbortError') throw new TimeoutError('Request timed out');
        lastErr = e;
        if (attempt < (retry.retries ?? 0)) {
          const delay = Math.min((retry.backoffMs ?? 300) * Math.pow(2, attempt) + jitter(), retry.maxBackoffMs ?? 3000);
          await sleep(delay);
          attempt++;
          continue;
        }
        throw new NetworkError('Network error', { cause: e });
      }
    }
    throw lastErr;
  }

  async *sse(url: string, options: RequestOptions = {}): AsyncGenerator<{ event?: string; id?: string; data: string }, void, void> {
    const target = this.withBase(url);
    const headers = { Accept: 'text/event-stream', ...this.defaultHeaders, ...(options.headers || {}) } as Record<string, string>;
    const res = await fetch(target, { ...options, headers });
    if (!res.ok || !res.body) {
      const text = await safeText(res);
      throw this.toError(res.status, text, res.headers.get('x-tribble-request-id') || undefined);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evt = parseSSE(raw);
        if (evt) yield evt;
      }
    }
  }

  private toError(status: number, text: string, requestId?: string) {
    if (status === 400) return new ValidationError(text || 'Bad request', { status, requestId });
    if (status === 401 || status === 403) return new AuthError(text || 'Unauthorized', { status, requestId });
    if (status === 429) return new RateLimitError(text || 'Too many requests', { status, requestId });
    if (status >= 500) return new ServerError(text || 'Server error', { status, requestId });
    return new ServerError(text || `HTTP ${status}`, { status, requestId });
  }
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

function jitter() {
  return Math.floor(Math.random() * 50);
}

async function safeText(res: Response | undefined) {
  try {
    return res ? await res.text() : '';
  } catch {
    return '';
  }
}

function parseSSE(chunk: string): { event?: string; id?: string; data: string } | null {
  const lines = chunk.split(/\r?\n/);
  let event: string | undefined;
  let id: string | undefined;
  const data: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('id:')) id = line.slice(3).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0 && !event && !id) return null;
  return { event, id, data: data.join('\n') };
}

// types exported by interface declaration above
