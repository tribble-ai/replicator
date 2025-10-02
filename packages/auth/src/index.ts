import { HttpClient } from '@tribble/sdk-core';

export type EnvName = 'dev' | 'staging' | 'prod' | 'custom';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number; // seconds
  expires_at?: number; // epoch seconds
}

export interface AuthOptions {
  env: EnvName;
  issuer?: string; // required for custom
  authorizeUrl?: string; // custom override
  tokenUrl?: string; // custom override
  clientId: string;
  redirectUri?: string; // for PKCE
  scopes?: string[];
  audience?: string;
  storage?: StorageAdapter;
  storageKey?: string; // default 'tribble_auth_tokens'
}

export class InMemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}

export class FileStorage implements StorageAdapter {
  constructor(private path: string) {}
  async getItem(key: string) {
    try {
      // @ts-ignore - avoid requiring Node types for dts
      const fs = await import('node:fs/promises');
      const txt = await fs.readFile(this.path, 'utf8').catch(() => '');
      const json = txt ? JSON.parse(txt) : {};
      return json[key] ?? null;
    } catch { return null; }
  }
  async setItem(key: string, value: string) {
    // @ts-ignore - avoid requiring Node types for dts
    const fs = await import('node:fs/promises');
    const txt = await fs.readFile(this.path, 'utf8').catch(() => '');
    const json = txt ? JSON.parse(txt) : {};
    json[key] = value;
    await fs.writeFile(this.path, JSON.stringify(json, null, 2));
  }
  async removeItem(key: string) {
    // @ts-ignore - avoid requiring Node types for dts
    const fs = await import('node:fs/promises');
    const txt = await fs.readFile(this.path, 'utf8').catch(() => '');
    const json = txt ? JSON.parse(txt) : {};
    delete json[key];
    await fs.writeFile(this.path, JSON.stringify(json, null, 2));
  }
}

export class TribbleAuth {
  private readonly opts: AuthOptions;
  private readonly http: HttpClient;
  private readonly storage: StorageAdapter;
  private readonly storageKey: string;
  private tokens: TokenSet | null = null;

  constructor(opts: AuthOptions) {
    this.opts = opts;
    this.http = new HttpClient();
    this.storage = opts.storage ?? new InMemoryStorage();
    this.storageKey = opts.storageKey ?? 'tribble_auth_tokens';
  }

  async load(): Promise<void> {
    const raw = await this.storage.getItem(this.storageKey);
    this.tokens = raw ? JSON.parse(raw) : null;
  }

  async save(): Promise<void> {
    await this.storage.setItem(this.storageKey, JSON.stringify(this.tokens ?? {}));
  }

  get authorizeUrl(): string {
    if (this.opts.authorizeUrl) return this.opts.authorizeUrl;
    const issuer = this.issuer;
    return `${issuer}/authorize`;
  }

  get tokenUrl(): string {
    if (this.opts.tokenUrl) return this.opts.tokenUrl;
    const issuer = this.issuer;
    return `${issuer}/oauth/token`;
  }

  get issuer(): string {
    if (this.opts.env === 'custom') return this.opts.issuer || '';
    // placeholders; override per-environment in your app or pass custom
    if (this.opts.env === 'prod') return 'https://auth.tribble.ai';
    if (this.opts.env === 'staging') return 'https://auth.staging.tribble.ai';
    return 'https://auth.dev.tribble.ai';
  }

  async loginPkce(): Promise<{ url: string; codeVerifier: string; codeChallenge: string; state: string }> {
    const { codeVerifier, codeChallenge } = await pkcePair();
    const state = randomString();
    const url = new URL(this.authorizeUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.opts.clientId);
    if (this.opts.redirectUri) url.searchParams.set('redirect_uri', this.opts.redirectUri);
    if (this.opts.scopes?.length) url.searchParams.set('scope', this.opts.scopes.join(' '));
    if (this.opts.audience) url.searchParams.set('audience', this.opts.audience);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    return { url: url.toString(), codeVerifier, codeChallenge, state };
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', this.opts.clientId);
    if (this.opts.redirectUri) body.set('redirect_uri', this.opts.redirectUri);
    body.set('code', code);
    body.set('code_verifier', codeVerifier);
    if (this.opts.audience) body.set('audience', this.opts.audience);
    const { data } = await this.http.request<TokenSet>(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    this.setTokenSetWithExpiry(data);
    await this.save();
    return this.tokens!;
  }

  async refresh(): Promise<TokenSet> {
    if (!this.tokens?.refresh_token) throw new Error('No refresh token');
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.opts.clientId);
    body.set('refresh_token', this.tokens.refresh_token);
    if (this.opts.audience) body.set('audience', this.opts.audience);
    const { data } = await this.http.request<TokenSet>(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    // Preserve existing refresh token if not returned
    if (!data.refresh_token && this.tokens.refresh_token) data.refresh_token = this.tokens.refresh_token;
    this.setTokenSetWithExpiry(data);
    await this.save();
    return this.tokens!;
  }

  async getAccessToken(opts: { ensureFresh?: boolean } = {}): Promise<string | null> {
    if (!this.tokens) await this.load();
    if (!this.tokens?.access_token) return null;
    if (opts.ensureFresh && this.isExpiringSoon()) {
      try { await this.refresh(); } catch { /* ignore; return existing */ }
    }
    return this.tokens.access_token;
  }

  setTokenSet(tokens: TokenSet): void {
    this.setTokenSetWithExpiry(tokens);
  }

  private setTokenSetWithExpiry(tokens: TokenSet) {
    if (tokens.expires_in && !tokens.expires_at) {
      tokens.expires_at = Math.floor(Date.now() / 1000) + Math.max(1, tokens.expires_in - 30);
    }
    this.tokens = tokens;
  }

  private isExpiringSoon(): boolean {
    const now = Math.floor(Date.now() / 1000);
    const exp = this.tokens?.expires_at ?? 0;
    return exp > 0 && exp - now < 60; // under 60s
  }
}

async function pkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const arr = new Uint8Array(32);
  const wc = await getWebCrypto();
  wc.getRandomValues(arr);
  const verifier = toBase64Url(arr);
  const digest = await sha256(new TextEncoder().encode(verifier));
  const challenge = toBase64Url(digest);
  return { codeVerifier: verifier, codeChallenge: challenge };
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const wc = await getWebCrypto();
  if (wc.subtle) {
    const buf = await wc.subtle.digest('SHA-256', (data as any).buffer as ArrayBuffer);
    return new Uint8Array(buf);
  }
  // @ts-ignore - avoid requiring Node types for dts
  const { createHash } = await import('node:crypto');
  return new Uint8Array(createHash('sha256').update(data).digest());
}

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  // @ts-ignore
  const Buf: any = (globalThis as any).Buffer;
  const b64 = typeof btoa === 'function' ? btoa(s) : (Buf ? Buf.from(s, 'binary').toString('base64') : s);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(len = 16): string {
  const arr = new Uint8Array(len);
  const g = (globalThis as any).crypto;
  if (g?.getRandomValues) g.getRandomValues(arr);
  else for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getWebCrypto(): Promise<Crypto> {
  const g = (globalThis as any).crypto;
  if (g && (g.getRandomValues || g.subtle)) return g as Crypto;
  // @ts-ignore - avoid requiring Node types for dts
  const cryptoMod: any = await import('node:crypto');
  return (cryptoMod.webcrypto || g) as Crypto;
}

// types exported by declarations above
