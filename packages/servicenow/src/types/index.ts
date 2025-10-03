/**
 * ServiceNow Integration Types for Tribble SDK
 */

export interface ServiceNowConfig {
  /** ServiceNow instance URL (e.g., https://dev12345.service-now.com) */
  instanceUrl: string;
  /** Authentication credentials */
  auth: ServiceNowAuth;
  /** Tribble platform configuration */
  tribble: TribbleIntegrationConfig;
  /** Application scope prefix (e.g., x_tribble_app) */
  scopePrefix: string;
  /** API version to use (default: v1) */
  apiVersion?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface ServiceNowAuth {
  type: 'basic' | 'oauth2';
  /** For basic auth */
  username?: string;
  password?: string;
  /** For OAuth2 */
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
}

export interface TribbleIntegrationConfig {
  /** Tribble API base URL */
  baseUrl: string;
  /** API token for authentication */
  apiToken: string;
  /** Email for agent interactions */
  email: string;
  /** Default agent ID (optional) */
  defaultAgentId?: string;
  /** Ingest endpoint for document uploads */
  ingestUrl?: string;
}

export interface ServiceNowApp {
  /** Application name */
  name: string;
  /** Application scope (e.g., x_tribble_myapp) */
  scope: string;
  /** Version number */
  version: string;
  /** Description */
  description: string;
  /** Application logo URL */
  logo?: string;
  /** Application components */
  components: AppComponent[];
}

export interface AppComponent {
  type: ComponentType;
  name: string;
  displayName: string;
  description?: string;
  metadata: Record<string, any>;
}

export type ComponentType =
  | 'ui_page'
  | 'service_portal_widget'
  | 'scripted_rest_api'
  | 'business_rule'
  | 'rest_message'
  | 'sys_property'
  | 'script_include'
  | 'ui_action'
  | 'client_script'
  | 'ui_policy';

export interface UpdateSet {
  name: string;
  description: string;
  state: 'in_progress' | 'complete' | 'ignore';
  application: string;
  updates: UpdateRecord[];
}

export interface UpdateRecord {
  type: string;
  name: string;
  action: 'INSERT_OR_UPDATE' | 'DELETE';
  payload: string; // XML payload
}

// ServiceNow REST API Response Types
export interface SNowResponse<T = any> {
  result: T;
}

export interface SNowError {
  error: {
    message: string;
    detail: string;
  };
  status: string;
}

// Widget Types
export interface ServiceNowWidget {
  id: string;
  name: string;
  description: string;
  script: string; // Server script
  clientScript: string; // Client controller
  template: string; // HTML template
  css: string;
  optionSchema?: WidgetOption[];
  dataSources?: DataSource[];
}

export interface WidgetOption {
  name: string;
  label: string;
  type: 'string' | 'boolean' | 'integer' | 'reference';
  defaultValue?: any;
  mandatory?: boolean;
}

export interface DataSource {
  name: string;
  script: string;
}

// Scripted REST API Types
export interface ScriptedRestAPI {
  name: string;
  id: string;
  path: string;
  description: string;
  resources: RestResource[];
}

export interface RestResource {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  script: string;
  consumes?: string[];
  produces?: string[];
}

// Business Rule Types
export interface BusinessRule {
  name: string;
  table: string;
  when: 'before' | 'after' | 'async' | 'display';
  order: number;
  active: boolean;
  conditions?: string;
  script: string;
  advancedCondition?: string;
}

// REST Message Configuration
export interface RestMessage {
  name: string;
  endpoint: string;
  description: string;
  authType: 'basic' | 'oauth2' | 'inherit';
  methods: RestMethod[];
}

export interface RestMethod {
  name: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers: Record<string, string>;
  content?: string;
  useBasicAuth?: boolean;
}

// System Property Types
export interface SystemProperty {
  name: string;
  value: string;
  description: string;
  type: 'string' | 'boolean' | 'integer' | 'password';
  isPrivate?: boolean;
}

// Deployment Options
export interface DeploymentOptions {
  /** Update set name */
  updateSetName?: string;
  /** Whether to activate the update set after deployment */
  activate?: boolean;
  /** Whether to commit the update set */
  commit?: boolean;
  /** Environment-specific configuration overrides */
  envOverrides?: Record<string, any>;
  /** Dry run mode - generate files without deploying */
  dryRun?: boolean;
}

// Build Configuration
export interface BuildConfig {
  /** Source directory */
  sourceDir: string;
  /** Output directory for built artifacts */
  outputDir: string;
  /** Application metadata */
  app: ServiceNowApp;
  /** Templates to include */
  templates?: string[];
  /** Custom transformations */
  transformers?: Array<(component: AppComponent) => AppComponent>;
}

// CLI Command Options
export interface CLIOptions {
  config?: string;
  instanceUrl?: string;
  username?: string;
  password?: string;
  scope?: string;
  verbose?: boolean;
}

// Tribble-ServiceNow Integration Event Types
export interface TribbleChatEvent {
  sessionId: string;
  userId: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TribbleIngestEvent {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TribbleAgentEvent {
  agentId: string;
  action: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  timestamp: string;
}
