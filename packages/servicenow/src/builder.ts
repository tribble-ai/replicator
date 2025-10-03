/**
 * ServiceNow Application Builder
 * Builds and packages Tribble apps for ServiceNow deployment
 */

import type {
  ServiceNowApp,
  AppComponent,
  BuildConfig,
  ServiceNowWidget,
  ScriptedRestAPI,
  BusinessRule,
  SystemProperty,
} from './types/index';
import {
  TRIBBLE_CHAT_WIDGET,
  TRIBBLE_UPLOAD_WIDGET,
  TRIBBLE_AGENT_WIDGET,
  TRIBBLE_KNOWLEDGE_WIDGET,
} from './ui/index';
import {
  TRIBBLE_API_CLIENT_SCRIPT,
  TRIBBLE_INGEST_SERVICE_SCRIPT,
  TRIBBLE_AGENT_SERVICE_SCRIPT,
  TRIBBLE_BUSINESS_RULE_SCRIPT,
} from './scripts/index';
import { UpdateSetGenerator } from './generator';

export class AppBuilder {
  private config: BuildConfig;
  private generator: UpdateSetGenerator;

  constructor(config: BuildConfig) {
    this.config = config;
    this.generator = new UpdateSetGenerator(config.app);
  }

  /**
   * Build complete ServiceNow application
   */
  async build(): Promise<{
    updateSetXml: string;
    files: Map<string, string>;
  }> {
    const files = new Map<string, string>();

    // Build script includes
    files.set(
      'TribbleAPIClient.js',
      this.buildScriptInclude('TribbleAPIClient', TRIBBLE_API_CLIENT_SCRIPT)
    );
    files.set(
      'TribbleIngestService.js',
      this.buildScriptInclude(
        'TribbleIngestService',
        TRIBBLE_INGEST_SERVICE_SCRIPT
      )
    );
    files.set(
      'TribbleAgentService.js',
      this.buildScriptInclude('TribbleAgentService', TRIBBLE_AGENT_SERVICE_SCRIPT)
    );

    // Build widgets
    files.set(
      'tribble_chat_widget.json',
      JSON.stringify(TRIBBLE_CHAT_WIDGET, null, 2)
    );
    files.set(
      'tribble_upload_widget.json',
      JSON.stringify(TRIBBLE_UPLOAD_WIDGET, null, 2)
    );
    files.set(
      'tribble_agent_widget.json',
      JSON.stringify(TRIBBLE_AGENT_WIDGET, null, 2)
    );
    files.set(
      'tribble_knowledge_widget.json',
      JSON.stringify(TRIBBLE_KNOWLEDGE_WIDGET, null, 2)
    );

    // Build Scripted REST API
    const restApi = this.buildRestAPI();
    files.set('tribble_rest_api.json', JSON.stringify(restApi, null, 2));

    // Build business rules
    files.set(
      'tribble_incident_rule.js',
      TRIBBLE_BUSINESS_RULE_SCRIPT
    );

    // Build system properties
    const sysProps = this.buildSystemProperties();
    files.set('system_properties.json', JSON.stringify(sysProps, null, 2));

    // Generate update set XML
    const updateSetXml = await this.generator.generate({
      scriptIncludes: [
        { name: 'TribbleAPIClient', script: TRIBBLE_API_CLIENT_SCRIPT },
        { name: 'TribbleIngestService', script: TRIBBLE_INGEST_SERVICE_SCRIPT },
        { name: 'TribbleAgentService', script: TRIBBLE_AGENT_SERVICE_SCRIPT },
      ],
      widgets: [
        TRIBBLE_CHAT_WIDGET,
        TRIBBLE_UPLOAD_WIDGET,
        TRIBBLE_AGENT_WIDGET,
        TRIBBLE_KNOWLEDGE_WIDGET,
      ],
      systemProperties: sysProps,
    });

    return {
      updateSetXml,
      files,
    };
  }

  /**
   * Build script include
   */
  private buildScriptInclude(name: string, script: string): string {
    return `// Script Include: ${name}
// Scope: ${this.config.app.scope}
// Description: ${this.config.app.description}

${script}
`;
  }

  /**
   * Build Scripted REST API
   */
  private buildRestAPI(): ScriptedRestAPI {
    return {
      name: 'Tribble API',
      id: 'tribble_api',
      path: '/api/x_tribble',
      description: 'Tribble AI platform integration API',
      resources: [
        {
          name: 'Chat Message',
          method: 'POST',
          path: '/chat/message',
          script: `/* Chat message endpoint */`,
          consumes: ['application/json'],
          produces: ['application/json'],
        },
        {
          name: 'Ingest Document',
          method: 'POST',
          path: '/ingest/document',
          script: `/* Document ingest endpoint */`,
          consumes: ['application/json'],
          produces: ['application/json'],
        },
        {
          name: 'Execute Agent',
          method: 'POST',
          path: '/agent/execute',
          script: `/* Agent execution endpoint */`,
          consumes: ['application/json'],
          produces: ['application/json'],
        },
        {
          name: 'Get Status',
          method: 'GET',
          path: '/status',
          script: `/* Status check endpoint */`,
          produces: ['application/json'],
        },
      ],
    };
  }

  /**
   * Build system properties
   */
  private buildSystemProperties(): SystemProperty[] {
    return [
      {
        name: `${this.config.app.scope}.tribble.base_url`,
        value: '',
        description: 'Tribble API base URL',
        type: 'string',
      },
      {
        name: `${this.config.app.scope}.tribble.api_token`,
        value: '',
        description: 'Tribble API authentication token',
        type: 'password',
        isPrivate: true,
      },
      {
        name: `${this.config.app.scope}.tribble.email`,
        value: '',
        description: 'Tribble user email',
        type: 'string',
      },
      {
        name: `${this.config.app.scope}.tribble.default_agent_id`,
        value: '',
        description: 'Default Tribble agent ID',
        type: 'string',
      },
      {
        name: `${this.config.app.scope}.tribble.ingest_url`,
        value: '',
        description: 'Tribble ingest endpoint',
        type: 'string',
      },
      {
        name: `${this.config.app.scope}.api.timeout`,
        value: '30000',
        description: 'API request timeout (ms)',
        type: 'integer',
      },
      {
        name: `${this.config.app.scope}.auto_process_incidents`,
        value: 'false',
        description: 'Enable automatic incident processing with AI',
        type: 'boolean',
      },
    ];
  }

  /**
   * Create deployment package
   */
  async package(): Promise<Buffer> {
    const { updateSetXml, files } = await this.build();

    // In a real implementation, this would create a zip file
    // For now, we'll just return the update set XML as a buffer
    return Buffer.from(updateSetXml, 'utf-8');
  }

  /**
   * Validate app configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.app.name) {
      errors.push('App name is required');
    }

    if (!this.config.app.scope) {
      errors.push('App scope is required');
    }

    if (!/^x_[a-z0-9_]+$/.test(this.config.app.scope)) {
      errors.push(
        'App scope must start with x_ and contain only lowercase letters, numbers, and underscores'
      );
    }

    if (!this.config.app.version) {
      errors.push('App version is required');
    }

    if (this.config.app.components.length === 0) {
      errors.push('App must have at least one component');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get app metadata
   */
  getMetadata(): ServiceNowApp {
    return { ...this.config.app };
  }
}

/**
 * Default app template
 */
export function createDefaultApp(
  name: string,
  scope: string,
  version: string = '1.0.0'
): ServiceNowApp {
  return {
    name,
    scope,
    version,
    description: `${name} - Powered by Tribble AI`,
    components: [
      {
        type: 'service_portal_widget',
        name: 'tribble_chat_widget',
        displayName: 'Tribble AI Chat',
        description: 'AI-powered chat widget',
        metadata: TRIBBLE_CHAT_WIDGET,
      },
      {
        type: 'service_portal_widget',
        name: 'tribble_upload_widget',
        displayName: 'Document Upload',
        description: 'Upload documents to Tribble',
        metadata: TRIBBLE_UPLOAD_WIDGET,
      },
      {
        type: 'script_include',
        name: 'TribbleAPIClient',
        displayName: 'Tribble API Client',
        description: 'Client for Tribble API communication',
        metadata: {
          script: TRIBBLE_API_CLIENT_SCRIPT,
          access: 'public',
        },
      },
      {
        type: 'script_include',
        name: 'TribbleIngestService',
        displayName: 'Tribble Ingest Service',
        description: 'Document ingestion service',
        metadata: {
          script: TRIBBLE_INGEST_SERVICE_SCRIPT,
          access: 'public',
        },
      },
    ],
  };
}
