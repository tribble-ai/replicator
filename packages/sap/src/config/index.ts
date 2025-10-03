/**
 * Configuration Management for SAP Integration
 *
 * Handles SAP system configuration, RFC destinations, and Tribble connection settings.
 */

import type {
  SAPSystemConfig,
  TribbleConnectionConfig,
  RFCDestinationConfig,
  BTPDeploymentConfig,
  XSAppConfig,
  SAPIntegrationError,
} from '../types';

/**
 * Default SAP system configuration
 */
export const DEFAULT_SAP_CONFIG: Partial<SAPSystemConfig> = {
  client: '100',
  language: 'EN',
  target: 'on-premise',
};

/**
 * Default Tribble connection configuration
 */
export const DEFAULT_TRIBBLE_CONFIG: Partial<TribbleConnectionConfig> = {
  timeout: 30000,
  verifySsl: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Configuration manager for SAP integration
 */
export class SAPConfigManager {
  private sapConfig: SAPSystemConfig | null = null;
  private tribbleConfig: TribbleConnectionConfig | null = null;
  private rfcDestinations: Map<string, RFCDestinationConfig> = new Map();

  /**
   * Load SAP system configuration
   */
  loadSAPConfig(config: SAPSystemConfig): void {
    this.validateSAPConfig(config);
    this.sapConfig = { ...DEFAULT_SAP_CONFIG, ...config } as SAPSystemConfig;
  }

  /**
   * Get SAP system configuration
   */
  getSAPConfig(): SAPSystemConfig {
    if (!this.sapConfig) {
      throw new Error('SAP configuration not loaded. Call loadSAPConfig() first.');
    }
    return this.sapConfig;
  }

  /**
   * Load Tribble connection configuration
   */
  loadTribbleConfig(config: TribbleConnectionConfig): void {
    this.validateTribbleConfig(config);
    this.tribbleConfig = {
      ...DEFAULT_TRIBBLE_CONFIG,
      ...config,
      headers: {
        ...DEFAULT_TRIBBLE_CONFIG.headers,
        ...config.headers,
      },
    } as TribbleConnectionConfig;
  }

  /**
   * Get Tribble connection configuration
   */
  getTribbleConfig(): TribbleConnectionConfig {
    if (!this.tribbleConfig) {
      throw new Error('Tribble configuration not loaded. Call loadTribbleConfig() first.');
    }
    return this.tribbleConfig;
  }

  /**
   * Register RFC destination
   */
  registerDestination(config: RFCDestinationConfig): void {
    this.validateRFCDestination(config);
    this.rfcDestinations.set(config.name, config);
  }

  /**
   * Get RFC destination by name
   */
  getDestination(name: string): RFCDestinationConfig {
    const destination = this.rfcDestinations.get(name);
    if (!destination) {
      throw new Error(`RFC destination '${name}' not found`);
    }
    return destination;
  }

  /**
   * Get all RFC destinations
   */
  getAllDestinations(): RFCDestinationConfig[] {
    return Array.from(this.rfcDestinations.values());
  }

  /**
   * Validate SAP configuration
   */
  private validateSAPConfig(config: SAPSystemConfig): void {
    if (!config.systemId) {
      throw new Error('SAP systemId is required');
    }
    if (!config.client) {
      throw new Error('SAP client is required');
    }
    if (!config.baseUrl) {
      throw new Error('SAP baseUrl is required');
    }
    if (!config.target) {
      throw new Error('SAP target is required');
    }
  }

  /**
   * Validate Tribble configuration
   */
  private validateTribbleConfig(config: TribbleConnectionConfig): void {
    if (!config.apiUrl) {
      throw new Error('Tribble apiUrl is required');
    }
    if (!config.apiKey && !config.oauth) {
      throw new Error('Either apiKey or oauth configuration is required');
    }
  }

  /**
   * Validate RFC destination configuration
   */
  private validateRFCDestination(config: RFCDestinationConfig): void {
    if (!config.name) {
      throw new Error('RFC destination name is required');
    }
    if (!config.host) {
      throw new Error('RFC destination host is required');
    }
    if (!config.port) {
      throw new Error('RFC destination port is required');
    }
  }

  /**
   * Export configuration to environment variables format
   */
  exportToEnv(): Record<string, string> {
    const env: Record<string, string> = {};

    if (this.sapConfig) {
      env.SAP_SYSTEM_ID = this.sapConfig.systemId;
      env.SAP_CLIENT = this.sapConfig.client;
      env.SAP_BASE_URL = this.sapConfig.baseUrl;
      env.SAP_TARGET = this.sapConfig.target;
      if (this.sapConfig.language) {
        env.SAP_LANGUAGE = this.sapConfig.language;
      }
    }

    if (this.tribbleConfig) {
      env.TRIBBLE_API_URL = this.tribbleConfig.apiUrl;
      if (this.tribbleConfig.apiKey) {
        env.TRIBBLE_API_KEY = this.tribbleConfig.apiKey;
      }
      if (this.tribbleConfig.oauth) {
        env.TRIBBLE_OAUTH_TOKEN_ENDPOINT = this.tribbleConfig.oauth.tokenEndpoint;
        env.TRIBBLE_OAUTH_CLIENT_ID = this.tribbleConfig.oauth.clientId;
        env.TRIBBLE_OAUTH_CLIENT_SECRET = this.tribbleConfig.oauth.clientSecret;
        if (this.tribbleConfig.oauth.scope) {
          env.TRIBBLE_OAUTH_SCOPE = this.tribbleConfig.oauth.scope;
        }
      }
    }

    return env;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnv(): void {
    const env = process.env;

    if (env.SAP_SYSTEM_ID && env.SAP_CLIENT && env.SAP_BASE_URL && env.SAP_TARGET) {
      this.loadSAPConfig({
        systemId: env.SAP_SYSTEM_ID,
        client: env.SAP_CLIENT,
        baseUrl: env.SAP_BASE_URL,
        target: env.SAP_TARGET as any,
        language: env.SAP_LANGUAGE,
      });
    }

    if (env.TRIBBLE_API_URL) {
      const config: TribbleConnectionConfig = {
        apiUrl: env.TRIBBLE_API_URL,
        apiKey: env.TRIBBLE_API_KEY,
      };

      if (
        env.TRIBBLE_OAUTH_TOKEN_ENDPOINT &&
        env.TRIBBLE_OAUTH_CLIENT_ID &&
        env.TRIBBLE_OAUTH_CLIENT_SECRET
      ) {
        config.oauth = {
          tokenEndpoint: env.TRIBBLE_OAUTH_TOKEN_ENDPOINT,
          clientId: env.TRIBBLE_OAUTH_CLIENT_ID,
          clientSecret: env.TRIBBLE_OAUTH_CLIENT_SECRET,
          scope: env.TRIBBLE_OAUTH_SCOPE,
        };
      }

      this.loadTribbleConfig(config);
    }
  }
}

/**
 * Create default RFC destination for Tribble API
 */
export function createTribbleDestination(
  config: TribbleConnectionConfig
): RFCDestinationConfig {
  const url = new URL(config.apiUrl);

  return {
    name: 'ZTRIBBLE_API',
    connectionType: 'G',
    description: 'Tribble AI Platform API',
    host: url.hostname,
    port: url.port ? parseInt(url.port) : url.protocol === 'https:' ? 443 : 80,
    pathPrefix: url.pathname === '/' ? '' : url.pathname,
    ssl: url.protocol === 'https:',
    authMethod: config.apiKey ? 'api-key' : config.oauth ? 'oauth2' : 'none',
  };
}

/**
 * Generate xs-app.json for SAP BTP deployment
 */
export function generateXSAppConfig(
  tribbleConfig: TribbleConnectionConfig,
  options: {
    welcomeFile?: string;
    authMethod?: 'route' | 'none';
    sessionTimeout?: number;
  } = {}
): XSAppConfig {
  return {
    welcomeFile: options.welcomeFile || 'index.html',
    authenticationMethod: options.authMethod || 'route',
    sessionTimeout: options.sessionTimeout || 30,
    routes: [
      {
        source: '^/tribble/(.*)$',
        target: '$1',
        destination: 'tribble-api',
        authenticationType: 'none',
        csrfProtection: false,
      },
      {
        source: '^/api/(.*)$',
        target: '/api/$1',
        destination: 'backend',
        authenticationType: 'xsuaa',
        csrfProtection: true,
      },
      {
        source: '^(.*)$',
        target: '$1',
        localDir: 'webapp',
        authenticationType: 'xsuaa',
      },
    ],
  };
}

/**
 * Generate manifest.json for SAP BTP deployment
 */
export function generateBTPManifest(config: BTPDeploymentConfig): any {
  return {
    version: '1.0.0',
    applications: [
      {
        name: config.appName,
        path: '.',
        memory: config.memory || '256M',
        'disk-quota': config.diskQuota || '512M',
        instances: config.instances || 1,
        buildpacks: [config.buildpack || 'https://github.com/cloudfoundry/staticfile-buildpack'],
        env: config.env || {},
        services: config.services || [],
        routes: config.routes || [
          {
            route: `${config.appName}.${config.apiEndpoint}`,
          },
        ],
      },
    ],
  };
}

/**
 * Singleton instance
 */
export const configManager = new SAPConfigManager();

/**
 * Export all configuration utilities
 */
export default configManager;
