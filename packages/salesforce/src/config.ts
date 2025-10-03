/**
 * Configuration utilities for Salesforce-Tribble integration
 */

import type { SalesforceConfig, TribbleConfigMetadata, RemoteSiteSetting } from './types';

/**
 * Default Salesforce configuration
 */
export const DEFAULT_SALESFORCE_CONFIG: Partial<SalesforceConfig> = {
  authMethod: 'api-key',
  enableDebugLogs: false,
};

/**
 * Default Remote Site Settings for Tribble API
 */
export const DEFAULT_REMOTE_SITE_SETTINGS: RemoteSiteSetting[] = [
  {
    fullName: 'Tribble_API_Production',
    description: 'Tribble AI Platform Production API',
    url: 'https://api.tribble.ai',
    isActive: true,
    disableProtocolSecurity: false,
  },
  {
    fullName: 'Tribble_API_Staging',
    description: 'Tribble AI Platform Staging API',
    url: 'https://api-staging.tribble.ai',
    isActive: false,
    disableProtocolSecurity: false,
  },
];

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validate Salesforce configuration
   */
  static validateConfig(config: SalesforceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiBaseUrl) {
      errors.push('apiBaseUrl is required');
    } else if (!this.isValidUrl(config.apiBaseUrl)) {
      errors.push('apiBaseUrl must be a valid URL');
    }

    if (!config.authMethod) {
      errors.push('authMethod is required');
    }

    if (config.authMethod === 'api-key' && !config.apiKey) {
      errors.push('apiKey is required when using api-key authentication');
    }

    if (config.authMethod === 'oauth' && !config.oauthClientId) {
      errors.push('oauthClientId is required when using oauth authentication');
    }

    if (config.authMethod === 'named-credentials' && !config.namedCredential) {
      errors.push('namedCredential is required when using named-credentials authentication');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate Remote Site Setting
   */
  static validateRemoteSiteSetting(setting: RemoteSiteSetting): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!setting.fullName) {
      errors.push('fullName is required');
    } else if (!this.isValidApiName(setting.fullName)) {
      errors.push('fullName must be a valid Salesforce API name (alphanumeric and underscores only)');
    }

    if (!setting.url) {
      errors.push('url is required');
    } else if (!this.isValidUrl(setting.url)) {
      errors.push('url must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Salesforce API name
   */
  private static isValidApiName(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  }
}

/**
 * Configuration builder
 */
export class ConfigBuilder {
  private config: Partial<SalesforceConfig> = { ...DEFAULT_SALESFORCE_CONFIG };

  /**
   * Set API base URL
   */
  setApiBaseUrl(url: string): this {
    this.config.apiBaseUrl = url;
    return this;
  }

  /**
   * Set authentication method
   */
  setAuthMethod(method: 'api-key' | 'oauth' | 'named-credentials'): this {
    this.config.authMethod = method;
    return this;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): this {
    this.config.apiKey = apiKey;
    this.config.authMethod = 'api-key';
    return this;
  }

  /**
   * Set OAuth configuration
   */
  setOAuth(clientId: string): this {
    this.config.oauthClientId = clientId;
    this.config.authMethod = 'oauth';
    return this;
  }

  /**
   * Set Named Credential
   */
  setNamedCredential(name: string): this {
    this.config.namedCredential = name;
    this.config.authMethod = 'named-credentials';
    return this;
  }

  /**
   * Set user email
   */
  setUserEmail(email: string): this {
    this.config.userEmail = email;
    return this;
  }

  /**
   * Enable debug logging
   */
  enableDebugLogs(enabled: boolean = true): this {
    this.config.enableDebugLogs = enabled;
    return this;
  }

  /**
   * Add remote site setting
   */
  addRemoteSiteSetting(setting: RemoteSiteSetting): this {
    if (!this.config.remoteSiteSettings) {
      this.config.remoteSiteSettings = [];
    }
    this.config.remoteSiteSettings.push(setting);
    return this;
  }

  /**
   * Build and validate configuration
   */
  build(): SalesforceConfig {
    const validation = ConfigValidator.validateConfig(this.config as SalesforceConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    return this.config as SalesforceConfig;
  }
}

/**
 * Configuration converter for Custom Metadata
 */
export class MetadataConverter {
  /**
   * Convert SalesforceConfig to Custom Metadata Type format
   */
  static toCustomMetadata(config: SalesforceConfig, label: string): TribbleConfigMetadata {
    return {
      label,
      apiEndpoint: config.apiBaseUrl,
      authMethod: config.authMethod,
      apiKey: config.apiKey,
      oauthClientId: config.oauthClientId,
      namedCredential: config.namedCredential,
      enableDebugLogs: config.enableDebugLogs ?? false,
    };
  }

  /**
   * Convert Custom Metadata to SalesforceConfig
   */
  static fromCustomMetadata(metadata: TribbleConfigMetadata): SalesforceConfig {
    const config: SalesforceConfig = {
      apiBaseUrl: metadata.apiEndpoint,
      authMethod: metadata.authMethod as any,
      enableDebugLogs: metadata.enableDebugLogs,
    };

    if (metadata.apiKey) {
      config.apiKey = metadata.apiKey;
    }

    if (metadata.oauthClientId) {
      config.oauthClientId = metadata.oauthClientId;
    }

    if (metadata.namedCredential) {
      config.namedCredential = metadata.namedCredential;
    }

    return config;
  }
}

/**
 * Export configuration presets
 */
export const SALESFORCE_PRESETS = {
  /**
   * Production preset with API key authentication
   */
  production: (apiKey: string): SalesforceConfig => ({
    apiBaseUrl: 'https://api.tribble.ai',
    authMethod: 'api-key',
    apiKey,
    enableDebugLogs: false,
    remoteSiteSettings: [DEFAULT_REMOTE_SITE_SETTINGS[0]],
  }),

  /**
   * Staging preset with API key authentication
   */
  staging: (apiKey: string): SalesforceConfig => ({
    apiBaseUrl: 'https://api-staging.tribble.ai',
    authMethod: 'api-key',
    apiKey,
    enableDebugLogs: true,
    remoteSiteSettings: [DEFAULT_REMOTE_SITE_SETTINGS[1]],
  }),

  /**
   * Development preset with Named Credentials
   */
  development: (namedCredential: string): SalesforceConfig => ({
    apiBaseUrl: 'https://api-dev.tribble.ai',
    authMethod: 'named-credentials',
    namedCredential,
    enableDebugLogs: true,
  }),

  /**
   * OAuth preset
   */
  oauth: (clientId: string, baseUrl: string = 'https://api.tribble.ai'): SalesforceConfig => ({
    apiBaseUrl: baseUrl,
    authMethod: 'oauth',
    oauthClientId: clientId,
    enableDebugLogs: false,
  }),
};
