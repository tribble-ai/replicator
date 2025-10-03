/**
 * Base authentication provider implementations
 */

import type { AuthProvider, AuthCredentials } from '../types';
import { AuthenticationError } from '../types';

/**
 * No authentication provider
 */
export class NoAuthProvider implements AuthProvider {
  async getCredentials(): Promise<AuthCredentials> {
    return { type: 'none' };
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    return headers;
  }
}

/**
 * API Key authentication provider
 */
export class ApiKeyAuthProvider implements AuthProvider {
  constructor(
    private readonly apiKey: string,
    private readonly headerName: string = 'X-API-Key'
  ) {}

  async getCredentials(): Promise<AuthCredentials> {
    return { type: 'apiKey', key: this.apiKey, headerName: this.headerName };
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    return {
      ...headers,
      [this.headerName]: this.apiKey,
    };
  }

  async validate(): Promise<boolean> {
    return this.apiKey.length > 0;
  }
}

/**
 * Bearer token authentication provider
 */
export class BearerAuthProvider implements AuthProvider {
  constructor(private readonly token: string) {}

  async getCredentials(): Promise<AuthCredentials> {
    return { type: 'bearer', token: this.token };
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    return {
      ...headers,
      Authorization: `Bearer ${this.token}`,
    };
  }

  async validate(): Promise<boolean> {
    return this.token.length > 0;
  }
}

/**
 * Basic authentication provider
 */
export class BasicAuthProvider implements AuthProvider {
  constructor(
    private readonly username: string,
    private readonly password: string
  ) {}

  async getCredentials(): Promise<AuthCredentials> {
    return { type: 'basic', username: this.username, password: this.password };
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    const credentials = btoa(`${this.username}:${this.password}`);
    return {
      ...headers,
      Authorization: `Basic ${credentials}`,
    };
  }

  async validate(): Promise<boolean> {
    return this.username.length > 0 && this.password.length > 0;
  }
}

/**
 * Custom headers authentication provider
 */
export class CustomAuthProvider implements AuthProvider {
  constructor(private readonly customHeaders: Record<string, string>) {}

  async getCredentials(): Promise<AuthCredentials> {
    return { type: 'custom', headers: this.customHeaders };
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    return {
      ...headers,
      ...this.customHeaders,
    };
  }

  async validate(): Promise<boolean> {
    return Object.keys(this.customHeaders).length > 0;
  }
}
