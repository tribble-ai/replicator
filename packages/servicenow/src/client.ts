/**
 * ServiceNow API Client for Tribble SDK
 */

import type {
  ServiceNowConfig,
  SNowResponse,
  SNowError,
  UpdateSet,
} from './types/index';
import { ConfigManager } from './config';

export class ServiceNowClient {
  private config: ConfigManager;
  private authToken?: string;

  constructor(config: ServiceNowConfig) {
    this.config = new ConfigManager(config);
  }

  /**
   * Authenticate with ServiceNow instance
   */
  async authenticate(): Promise<void> {
    const auth = this.config.getAuth();

    if (auth.type === 'basic') {
      const credentials = `${auth.username}:${auth.password}`;
      this.authToken = `Basic ${Buffer.from(credentials).toString('base64')}`;
    } else if (auth.type === 'oauth2') {
      // OAuth2 flow
      const tokenUrl =
        auth.tokenUrl || `${this.config.getInstanceUrl()}/oauth_token.do`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: auth.clientId!,
          client_secret: auth.clientSecret!,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth2 authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.authToken = `Bearer ${data.access_token}`;
    }
  }

  /**
   * Make authenticated request to ServiceNow API
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.authToken) {
      await this.authenticate();
    }

    const url = `${this.config.getInstanceUrl()}${endpoint}`;
    const headers = {
      Authorization: this.authToken!,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.getTimeout()),
    });

    if (!response.ok) {
      const error: SNowError = await response.json();
      throw new Error(
        `ServiceNow API error: ${error.error?.message || response.statusText}`
      );
    }

    const data: SNowResponse<T> = await response.json();
    return data.result;
  }

  /**
   * Create a new update set
   */
  async createUpdateSet(
    name: string,
    description: string
  ): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_update_set', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        state: 'in_progress',
        application: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Set current update set
   */
  async setCurrentUpdateSet(sysId: string): Promise<void> {
    await this.request(`/api/now/table/sys_update_set/${sysId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: 'in_progress',
      }),
    });
  }

  /**
   * Complete and commit update set
   */
  async completeUpdateSet(sysId: string): Promise<void> {
    await this.request(`/api/now/table/sys_update_set/${sysId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: 'complete',
      }),
    });
  }

  /**
   * Upload application file
   */
  async uploadApplication(
    fileName: string,
    content: string
  ): Promise<{ sys_id: string }> {
    return this.request('/api/now/import/sys_remote_update_set', {
      method: 'POST',
      body: JSON.stringify({
        name: fileName,
        xml_content: content,
      }),
    });
  }

  /**
   * Create scripted REST API
   */
  async createScriptedRestAPI(data: {
    name: string;
    api_id: string;
    base_uri: string;
    description: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_ws_definition', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        namespace: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Create REST resource
   */
  async createRestResource(data: {
    name: string;
    web_service_definition: string;
    http_method: string;
    relative_path: string;
    script: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_ws_operation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create Service Portal widget
   */
  async createWidget(data: {
    name: string;
    id: string;
    description: string;
    script: string;
    client_script: string;
    template: string;
    css: string;
    option_schema?: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sp_widget', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create script include
   */
  async createScriptInclude(data: {
    name: string;
    api_name: string;
    script: string;
    description: string;
    access: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_script_include', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        sys_scope: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Create business rule
   */
  async createBusinessRule(data: {
    name: string;
    table: string;
    when: string;
    order: number;
    active: boolean;
    script: string;
    condition?: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_script', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        sys_scope: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Create system property
   */
  async createSystemProperty(data: {
    name: string;
    value: string;
    description: string;
    type: string;
    is_private?: boolean;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_properties', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        suffix: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Create REST message
   */
  async createRestMessage(data: {
    name: string;
    rest_endpoint: string;
    description: string;
    authentication_type: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_rest_message', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        sys_scope: this.config.getScopePrefix(),
      }),
    });
  }

  /**
   * Create REST message function (HTTP method)
   */
  async createRestMessageFunction(data: {
    rest_message: string;
    name: string;
    http_method: string;
    rest_endpoint: string;
    content?: string;
  }): Promise<{ sys_id: string }> {
    return this.request('/api/now/table/sys_rest_message_fn', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Query table records
   */
  async query<T = any>(
    table: string,
    query?: string,
    fields?: string[]
  ): Promise<T[]> {
    let endpoint = `/api/now/table/${table}`;
    const params = new URLSearchParams();

    if (query) {
      params.append('sysparm_query', query);
    }

    if (fields && fields.length > 0) {
      params.append('sysparm_fields', fields.join(','));
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const result = await this.request<T[]>(endpoint);
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Get single record
   */
  async getRecord<T = any>(table: string, sysId: string): Promise<T> {
    return this.request<T>(`/api/now/table/${table}/${sysId}`);
  }

  /**
   * Test connection to ServiceNow instance
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/api/now/table/sys_user?sysparm_limit=1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get instance information
   */
  async getInstanceInfo(): Promise<{
    version: string;
    build_date: string;
    build_tag: string;
  }> {
    return this.request('/api/now/ui/properties');
  }
}
