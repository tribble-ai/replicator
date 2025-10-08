import { HttpClient } from '@tribble/sdk-core';
import type { TribbleConfig } from '@tribble/sdk-core';

export interface ControlClientOptions {
  baseUrl: string;
  tokenProvider: () => Promise<string>;
  defaultHeaders?: Record<string, string>;
}

export class ControlClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: () => Promise<string>;
  private readonly http: HttpClient;
  private readonly defaults: Record<string, string>;
  constructor(opts: ControlClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.tokenProvider = opts.tokenProvider;
    this.defaults = opts.defaultHeaders || {};
    this.http = new HttpClient();
  }

  private async authHeaders(extra?: Record<string, string>) {
    const token = await this.tokenProvider();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(this.defaults || {}), ...(extra || {}) };
  }

  async createTag(p: { name: string; color?: string }) {
    const url = `${this.baseUrl}/api/tags`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ tagId: string }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }

  async createUser(p: { externalId: string; attributes?: Record<string, any> }) {
    const url = `${this.baseUrl}/api/users`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ userId: string }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }

  async createWorkflow(p: { name: string; trigger: any; actions: any[] }) {
    const url = `${this.baseUrl}/api/workflows`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ workflowId: string }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }

  async executeCapability(p: { name: string; version: number; params: Record<string, any> }) {
    const url = `${this.baseUrl}/api/capabilities/execute`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ result: any }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }

  async query(p: { q: string; limit?: number }) {
    const url = `${this.baseUrl}/api/query?q=${encodeURIComponent(p.q)}${p.limit ? `&limit=${p.limit}` : ''}`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ rows: any[] }>(url, { method: 'GET', headers });
    return data;
  }

  async subscribe(p: { events: string[]; webhookUrl: string; signingSecret?: string }) {
    const url = `${this.baseUrl}/api/subscriptions`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ subscriptionId: string }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }

  // Extensions lifecycle (remote)
  async publishExtension(p: { manifest: any; channel: string }) {
    const url = `${this.baseUrl}/api/extensions/publish`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ ok: boolean }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }
  async promoteExtension(p: { name: string; version: string; from: string; to: string }) {
    const url = `${this.baseUrl}/api/extensions/promote`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ ok: boolean }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }
  async freezeChannel(p: { name: string; channel: string }) {
    const url = `${this.baseUrl}/api/extensions/freeze`;
    const headers = await this.authHeaders();
    const { data } = await this.http.request<{ ok: boolean }>(url, { method: 'POST', headers, body: JSON.stringify(p) });
    return data;
  }
}

export type { TribbleConfig };

