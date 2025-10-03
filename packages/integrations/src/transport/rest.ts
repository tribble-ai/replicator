/**
 * REST API transport layer
 */

import { HttpClient, type HttpClientOptions } from '@tribble/sdk-core';
import type { Transport, RestTransportConfig, AuthProvider } from '../types';
import { TransportError } from '../types';

export interface RestRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string | number | boolean>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface PaginationConfig {
  /** Pagination style */
  style: 'offset' | 'cursor' | 'page' | 'link-header';

  /** Parameter name for offset/page/cursor */
  paramName?: string;

  /** Parameter name for limit/page size */
  limitParam?: string;

  /** Default page size */
  defaultLimit?: number;

  /** Maximum page size */
  maxLimit?: number;

  /** Path to next cursor in response */
  cursorPath?: string;

  /** Path to items array in response */
  itemsPath?: string;

  /** Path to total count in response */
  totalPath?: string;
}

/**
 * REST API transport with automatic authentication and pagination support
 */
export class RestTransport implements Transport {
  readonly type = 'rest' as const;
  private readonly http: HttpClient;
  private readonly auth: AuthProvider;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private connected: boolean = false;

  constructor(private readonly config: RestTransportConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.auth = config.auth;
    this.defaultHeaders = config.defaultHeaders || {};

    const httpOptions: HttpClientOptions = {
      baseUrl: this.baseUrl,
      defaultHeaders: this.defaultHeaders,
      maxRetries: config.retryConfig?.maxRetries,
      timeoutMs: config.timeoutMs,
    };

    this.http = new HttpClient(httpOptions);
  }

  async connect(): Promise<void> {
    // Validate authentication
    if (this.auth.validate) {
      const valid = await this.auth.validate();
      if (!valid) {
        throw new TransportError('Authentication validation failed', false);
      }
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Make a REST API request
   */
  async request<T = any>(path: string, options: RestRequestOptions = {}): Promise<T> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    const url = this.buildUrl(path, options.query);
    const headers = await this.buildHeaders(options.headers);

    let body: any = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    try {
      const { data } = await this.http.request<T>(url, {
        method: options.method || 'GET',
        headers,
        body,
        timeoutMs: options.timeoutMs,
        signal: options.signal,
      });

      return data;
    } catch (error: any) {
      throw new TransportError(`REST request failed: ${error.message}`, error.retryable !== false, {
        path,
        method: options.method,
        error: error.message,
      });
    }
  }

  /**
   * Make a paginated request and iterate through all pages
   */
  async *paginate<T = any>(
    path: string,
    config: PaginationConfig,
    options: RestRequestOptions = {}
  ): AsyncGenerator<T[], void, void> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    const limit = Math.min(config.defaultLimit || 100, config.maxLimit || 1000);
    let hasMore = true;
    let cursor: string | number | undefined;
    let offset = 0;
    let page = 1;

    while (hasMore) {
      const query = { ...options.query };

      // Add pagination parameters based on style
      switch (config.style) {
        case 'offset':
          query[config.paramName || 'offset'] = offset;
          query[config.limitParam || 'limit'] = limit;
          break;
        case 'page':
          query[config.paramName || 'page'] = page;
          query[config.limitParam || 'per_page'] = limit;
          break;
        case 'cursor':
          if (cursor) {
            query[config.paramName || 'cursor'] = cursor;
          }
          query[config.limitParam || 'limit'] = limit;
          break;
        case 'link-header':
          query[config.limitParam || 'limit'] = limit;
          if (cursor) {
            query[config.paramName || 'page'] = cursor;
          }
          break;
      }

      const response = await this.request<any>(path, { ...options, query });

      // Extract items from response
      const items = this.extractByPath(response, config.itemsPath || 'data') as T[];

      if (!items || items.length === 0) {
        break;
      }

      yield items;

      // Determine if there are more pages
      switch (config.style) {
        case 'offset':
          offset += items.length;
          const total = this.extractByPath(response, config.totalPath || 'total') as number | undefined;
          hasMore = !total || offset < total;
          break;
        case 'page':
          page += 1;
          hasMore = items.length === limit;
          break;
        case 'cursor':
          const nextCursor = this.extractByPath(response, config.cursorPath || 'next_cursor') as string | undefined;
          cursor = nextCursor;
          hasMore = !!nextCursor;
          break;
        case 'link-header':
          // This would require parsing Link headers - simplified here
          hasMore = items.length === limit;
          break;
      }

      if (items.length < limit) {
        hasMore = false;
      }
    }
  }

  /**
   * Stream data using Server-Sent Events
   */
  async *stream(
    path: string,
    options: RestRequestOptions = {}
  ): AsyncGenerator<{ event?: string; data: any }, void, void> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    const url = this.buildUrl(path, options.query);
    const headers = await this.buildHeaders(options.headers);

    try {
      for await (const event of this.http.sse(url, { headers, signal: options.signal })) {
        let data = event.data;
        try {
          data = JSON.parse(event.data);
        } catch {
          // Keep as string if not valid JSON
        }
        yield { event: event.event, data };
      }
    } catch (error: any) {
      throw new TransportError(`SSE stream failed: ${error.message}`, true, {
        path,
        error: error.message,
      });
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean>): string {
    let url = path.startsWith('http') ? path : path;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        params.append(key, String(value));
      }
      url = `${url}?${params.toString()}`;
    }
    return url;
  }

  private async buildHeaders(custom?: Record<string, string>): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders, ...(custom || {}) };
    return this.auth.applyToHeaders(headers);
  }

  private extractByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }
}
