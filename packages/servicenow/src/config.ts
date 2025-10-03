/**
 * Configuration management for ServiceNow-Tribble integration
 */

import type {
  ServiceNowConfig,
  ServiceNowAuth,
  TribbleIntegrationConfig,
} from './types/index';

export class ConfigManager {
  private config: ServiceNowConfig;

  constructor(config: ServiceNowConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  getConfig(): ServiceNowConfig {
    return { ...this.config };
  }

  getTribbleConfig(): TribbleIntegrationConfig {
    return { ...this.config.tribble };
  }

  getInstanceUrl(): string {
    return this.config.instanceUrl;
  }

  getAuth(): ServiceNowAuth {
    return { ...this.config.auth };
  }

  getScopePrefix(): string {
    return this.config.scopePrefix;
  }

  getApiVersion(): string {
    return this.config.apiVersion || 'v1';
  }

  getTimeout(): number {
    return this.config.timeout || 30000;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<ServiceNowConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig(this.config);
  }

  /**
   * Validate configuration completeness
   */
  private validateConfig(config: ServiceNowConfig): void {
    if (!config.instanceUrl) {
      throw new Error('ServiceNow instance URL is required');
    }

    if (!config.instanceUrl.startsWith('https://')) {
      throw new Error('ServiceNow instance URL must start with https://');
    }

    if (!config.auth) {
      throw new Error('ServiceNow authentication configuration is required');
    }

    if (config.auth.type === 'basic') {
      if (!config.auth.username || !config.auth.password) {
        throw new Error('Username and password required for basic auth');
      }
    } else if (config.auth.type === 'oauth2') {
      if (!config.auth.clientId || !config.auth.clientSecret) {
        throw new Error('Client ID and secret required for OAuth2');
      }
    }

    if (!config.tribble) {
      throw new Error('Tribble integration configuration is required');
    }

    if (!config.tribble.baseUrl) {
      throw new Error('Tribble base URL is required');
    }

    if (!config.tribble.apiToken) {
      throw new Error('Tribble API token is required');
    }

    if (!config.tribble.email) {
      throw new Error('Tribble email is required');
    }

    if (!config.scopePrefix) {
      throw new Error('ServiceNow scope prefix is required');
    }

    // Validate scope prefix format
    if (!/^x_[a-z0-9_]+$/.test(config.scopePrefix)) {
      throw new Error(
        'Scope prefix must start with x_ and contain only lowercase letters, numbers, and underscores'
      );
    }
  }

  /**
   * Load configuration from environment variables
   */
  static fromEnv(): ConfigManager {
    const config: ServiceNowConfig = {
      instanceUrl: process.env.SNOW_INSTANCE_URL || '',
      auth: {
        type: (process.env.SNOW_AUTH_TYPE as 'basic' | 'oauth2') || 'basic',
        username: process.env.SNOW_USERNAME,
        password: process.env.SNOW_PASSWORD,
        clientId: process.env.SNOW_CLIENT_ID,
        clientSecret: process.env.SNOW_CLIENT_SECRET,
        tokenUrl: process.env.SNOW_TOKEN_URL,
      },
      tribble: {
        baseUrl: process.env.TRIBBLE_BASE_URL || '',
        apiToken: process.env.TRIBBLE_API_TOKEN || '',
        email: process.env.TRIBBLE_EMAIL || '',
        defaultAgentId: process.env.TRIBBLE_DEFAULT_AGENT_ID,
        ingestUrl: process.env.TRIBBLE_INGEST_URL,
      },
      scopePrefix: process.env.SNOW_SCOPE_PREFIX || '',
      apiVersion: process.env.SNOW_API_VERSION,
      timeout: process.env.SNOW_TIMEOUT
        ? parseInt(process.env.SNOW_TIMEOUT, 10)
        : undefined,
    };

    return new ConfigManager(config);
  }

  /**
   * Export configuration as ServiceNow system properties
   */
  toSystemProperties(): Array<{
    name: string;
    value: string;
    description: string;
    type: string;
  }> {
    const prefix = this.config.scopePrefix;
    return [
      {
        name: `${prefix}.tribble.base_url`,
        value: this.config.tribble.baseUrl,
        description: 'Tribble API base URL',
        type: 'string',
      },
      {
        name: `${prefix}.tribble.api_token`,
        value: this.config.tribble.apiToken,
        description: 'Tribble API authentication token',
        type: 'password',
      },
      {
        name: `${prefix}.tribble.email`,
        value: this.config.tribble.email,
        description: 'Tribble user email for agent interactions',
        type: 'string',
      },
      {
        name: `${prefix}.tribble.default_agent_id`,
        value: this.config.tribble.defaultAgentId || '',
        description: 'Default Tribble agent ID',
        type: 'string',
      },
      {
        name: `${prefix}.tribble.ingest_url`,
        value: this.config.tribble.ingestUrl || '',
        description: 'Tribble ingest endpoint for document uploads',
        type: 'string',
      },
      {
        name: `${prefix}.api.timeout`,
        value: this.getTimeout().toString(),
        description: 'API request timeout in milliseconds',
        type: 'integer',
      },
    ];
  }
}

/**
 * Default configuration template
 */
export const DEFAULT_CONFIG: Partial<ServiceNowConfig> = {
  apiVersion: 'v1',
  timeout: 30000,
};

/**
 * Configuration validation utilities
 */
export class ConfigValidator {
  static isValidInstanceUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === 'https:' &&
        parsed.hostname.includes('service-now.com')
      );
    } catch {
      return false;
    }
  }

  static isValidScopePrefix(prefix: string): boolean {
    return /^x_[a-z0-9_]+$/.test(prefix);
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
