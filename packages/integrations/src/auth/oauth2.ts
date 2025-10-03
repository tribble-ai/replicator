/**
 * OAuth2 authentication provider with automatic token refresh
 */

import type { AuthProvider, AuthCredentials } from '../types';
import { AuthenticationError } from '../types';
import { HttpClient } from '@tribble/sdk-core';

export interface OAuth2Config {
  /** OAuth2 token endpoint */
  tokenEndpoint: string;

  /** Client ID */
  clientId: string;

  /** Client secret */
  clientSecret: string;

  /** Initial access token (if available) */
  accessToken?: string;

  /** Initial refresh token (if available) */
  refreshToken?: string;

  /** Token expiration timestamp */
  expiresAt?: number;

  /** Grant type (default: client_credentials) */
  grantType?: 'client_credentials' | 'refresh_token' | 'authorization_code';

  /** OAuth2 scopes */
  scopes?: string[];

  /** Additional parameters for token request */
  additionalParams?: Record<string, string>;

  /** Buffer time in seconds before token expiry to refresh (default: 300) */
  refreshBufferSeconds?: number;
}

export class OAuth2Provider implements AuthProvider {
  private accessToken?: string;
  private refreshToken?: string;
  private expiresAt?: number;
  private readonly http: HttpClient;
  private refreshPromise?: Promise<AuthCredentials>;

  constructor(private readonly config: OAuth2Config) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.expiresAt = config.expiresAt;
    this.http = new HttpClient();
  }

  async getCredentials(): Promise<AuthCredentials> {
    // Check if token is valid
    if (await this.isTokenValid()) {
      return {
        type: 'oauth2',
        accessToken: this.accessToken!,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
      };
    }

    // If already refreshing, wait for that operation
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Refresh token
    return this.refresh();
  }

  async refresh(): Promise<AuthCredentials> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._doRefresh();

    try {
      const credentials = await this.refreshPromise;
      return credentials;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  private async _doRefresh(): Promise<AuthCredentials> {
    const grantType = this.config.grantType || 'client_credentials';

    let body: Record<string, string> = {
      grant_type: grantType,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      ...(this.config.additionalParams || {}),
    };

    if (grantType === 'refresh_token') {
      if (!this.refreshToken) {
        throw new AuthenticationError('No refresh token available');
      }
      body.refresh_token = this.refreshToken;
    }

    if (this.config.scopes && this.config.scopes.length > 0) {
      body.scope = this.config.scopes.join(' ');
    }

    try {
      const { data } = await this.http.request<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
      }>(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
      });

      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      if (data.expires_in) {
        this.expiresAt = Date.now() + data.expires_in * 1000;
      }

      return {
        type: 'oauth2',
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.expiresAt,
      };
    } catch (error: any) {
      throw new AuthenticationError(`OAuth2 token refresh failed: ${error.message}`, {
        endpoint: this.config.tokenEndpoint,
        grantType,
      });
    }
  }

  async validate(): Promise<boolean> {
    return this.isTokenValid();
  }

  async applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>> {
    const credentials = await this.getCredentials();
    // Type guard to ensure we have OAuth2 credentials
    if (credentials.type !== 'oauth2') {
      throw new AuthenticationError('Invalid credential type for OAuth2 provider');
    }
    return {
      ...headers,
      Authorization: `Bearer ${credentials.accessToken}`,
    };
  }

  private async isTokenValid(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    if (!this.expiresAt) {
      // If we don't know expiration, assume it's valid
      return true;
    }

    const bufferMs = (this.config.refreshBufferSeconds || 300) * 1000;
    return Date.now() < this.expiresAt - bufferMs;
  }

  /**
   * Get current token state (for persistence)
   */
  getTokenState(): { accessToken?: string; refreshToken?: string; expiresAt?: number } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
    };
  }

  /**
   * Update token state (e.g., after loading from storage)
   */
  setTokenState(state: { accessToken?: string; refreshToken?: string; expiresAt?: number }): void {
    this.accessToken = state.accessToken;
    this.refreshToken = state.refreshToken;
    this.expiresAt = state.expiresAt;
  }
}
