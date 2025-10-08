/**
 * SAP S/4HANA Integration Types
 *
 * Type definitions for Tribble SDK SAP integration including
 * OData, ABAP, Fiori, and SAP BTP deployment types.
 */

// ==================== Core Configuration Types ====================

/**
 * SAP deployment target (on-premise or cloud)
 */
export type SAPDeploymentTarget = 'on-premise' | 'btp' | 'hybrid';

/**
 * SAP system configuration
 */
export interface SAPSystemConfig {
  /** System ID (e.g., 'S4H', 'ERP') */
  systemId: string;
  /** Client number (e.g., '100', '800') */
  client: string;
  /** Deployment target */
  target: SAPDeploymentTarget;
  /** Base URL for the SAP system */
  baseUrl: string;
  /** Language (default: 'EN') */
  language?: string;
}

/**
 * Tribble API connection configuration for SAP
 */
export interface TribbleConnectionConfig {
  /** Tribble API endpoint */
  apiUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** OAuth2 configuration */
  oauth?: {
    tokenEndpoint: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
  };
  /** Custom headers */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable SSL verification */
  verifySsl?: boolean;
}

/**
 * RFC/HTTP destination configuration (SM59)
 */
export interface RFCDestinationConfig {
  /** Destination name (e.g., 'ZTRIBBLE_API') */
  name: string;
  /** Connection type (H = HTTP, G = HTTP to External Server) */
  connectionType: 'H' | 'G';
  /** Description */
  description: string;
  /** Target host */
  host: string;
  /** Port number */
  port: number;
  /** Path prefix */
  pathPrefix: string;
  /** Use SSL/TLS */
  ssl: boolean;
  /** Authentication method */
  authMethod: 'none' | 'basic' | 'oauth2' | 'api-key';
  /** SSL certificate (for HTTPS) */
  sslCertificate?: string;
}

// ==================== OData Service Types ====================

/**
 * OData entity type definition
 */
export interface ODataEntityType {
  /** Entity name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Properties */
  properties: ODataProperty[];
  /** Key properties */
  keys: string[];
  /** Navigation properties */
  navigationProperties?: ODataNavigationProperty[];
}

/**
 * OData property definition
 */
export interface ODataProperty {
  /** Property name */
  name: string;
  /** EDM type (e.g., 'Edm.String', 'Edm.DateTime') */
  type: string;
  /** Is nullable */
  nullable?: boolean;
  /** Max length (for strings) */
  maxLength?: number;
  /** Precision (for decimals) */
  precision?: number;
  /** Scale (for decimals) */
  scale?: number;
  /** Default value */
  defaultValue?: string;
}

/**
 * OData navigation property
 */
export interface ODataNavigationProperty {
  /** Property name */
  name: string;
  /** Target entity type */
  targetType: string;
  /** Relationship type */
  relationship: string;
  /** Multiplicity */
  multiplicity: '0..1' | '1' | '*';
}

/**
 * OData service metadata configuration
 */
export interface ODataServiceConfig {
  /** Service name */
  name: string;
  /** Service namespace */
  namespace: string;
  /** Version */
  version: string;
  /** Entity types */
  entities: ODataEntityType[];
  /** Entity sets */
  entitySets: ODataEntitySet[];
  /** Annotations */
  annotations?: ODataAnnotation[];
}

/**
 * OData entity set definition
 */
export interface ODataEntitySet {
  /** Entity set name */
  name: string;
  /** Entity type */
  entityType: string;
  /** Is updatable */
  updatable?: boolean;
  /** Is deletable */
  deletable?: boolean;
  /** Is insertable */
  insertable?: boolean;
}

/**
 * OData annotation
 */
export interface ODataAnnotation {
  /** Target */
  target: string;
  /** Term */
  term: string;
  /** Value */
  value: any;
}

// ==================== ABAP Integration Types ====================

/**
 * ABAP class method definition
 */
export interface ABAPMethod {
  /** Method name */
  name: string;
  /** Description */
  description: string;
  /** Parameters */
  parameters: ABAPParameter[];
  /** Return type */
  returning?: ABAPParameter;
  /** Exceptions */
  exceptions?: string[];
}

/**
 * ABAP method parameter
 */
export interface ABAPParameter {
  /** Parameter name */
  name: string;
  /** Type */
  type: string;
  /** Is optional */
  optional?: boolean;
  /** Default value */
  default?: string;
  /** Parameter kind */
  kind: 'importing' | 'exporting' | 'changing' | 'returning';
}

/**
 * ABAP HTTP request
 */
export interface ABAPHttpRequest {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Endpoint path */
  path: string;
  /** Query parameters */
  query?: Record<string, string>;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: string | object;
}

/**
 * ABAP HTTP response
 */
export interface ABAPHttpResponse {
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: string;
  /** Is success */
  success: boolean;
}

// ==================== Fiori Application Types ====================

/**
 * Fiori application type
 */
export type FioriAppType =
  | 'overview-page'
  | 'list-report'
  | 'worklist'
  | 'analytical-list-page'
  | 'freestyle'
  | 'chat'
  | 'upload';

/**
 * Fiori application manifest configuration
 */
export interface FioriManifest {
  _version?: string;
  /** Application ID */
  'sap.app': {
    id: string;
    type: 'application';
    i18n: string;
    applicationVersion: {
      version: string;
    };
    title: string;
    description: string;
    dataSources?: Record<string, FioriDataSource>;
    crossNavigation?: {
      inbounds?: Record<string, FioriInbound>;
      outbounds?: Record<string, FioriOutbound>;
    };
  };
  /** UI5 configuration */
  'sap.ui5': {
    rootView?: {
      viewName: string;
      type: string;
      id: string;
    };
    dependencies: {
      minUI5Version: string;
      libs: Record<string, {}>;
    };
    models?: Record<string, FioriModel>;
    routing?: FioriRouting;
  };
  /** Fiori configuration */
  'sap.fiori': {
    registrationIds?: string[];
    archeType?: FioriAppType;
  };
}

/**
 * Fiori data source configuration
 */
export interface FioriDataSource {
  uri: string;
  type: 'OData' | 'JSON' | 'XML';
  settings?: {
    odataVersion?: '2.0' | '4.0';
    localUri?: string;
    annotations?: string[];
  };
}

/**
 * Fiori model configuration
 */
export interface FioriModel {
  type?: string;
  dataSource?: string;
  preload?: boolean;
  settings?: Record<string, any>;
}

/**
 * Fiori routing configuration
 */
export interface FioriRouting {
  config: {
    routerClass: string;
    viewType: string;
    viewPath: string;
    controlId: string;
    controlAggregation: string;
    async: boolean;
  };
  routes: FioriRoute[];
  targets: Record<string, FioriTarget>;
}

/**
 * Fiori route definition
 */
export interface FioriRoute {
  pattern: string;
  name: string;
  target: string | string[];
}

/**
 * Fiori target definition
 */
export interface FioriTarget {
  viewType: string;
  viewName: string;
  viewId?: string;
  viewLevel?: number;
}

/**
 * Fiori inbound navigation
 */
export interface FioriInbound {
  semanticObject: string;
  action: string;
  title: string;
  signature?: {
    parameters?: Record<string, any>;
    additionalParameters?: 'allowed' | 'notallowed' | 'ignored';
  };
}

/**
 * Fiori outbound navigation
 */
export interface FioriOutbound {
  semanticObject: string;
  action: string;
  parameters?: Record<string, any>;
}

// ==================== SAP BTP Types ====================

/**
 * SAP BTP deployment configuration
 */
export interface BTPDeploymentConfig {
  /** Application name */
  appName: string;
  /** Organization */
  org: string;
  /** Space */
  space: string;
  /** Cloud Foundry API endpoint */
  apiEndpoint: string;
  /** Build pack */
  buildpack?: string;
  /** Memory allocation */
  memory?: string;
  /** Disk quota */
  diskQuota?: string;
  /** Number of instances */
  instances?: number;
  /** Environment variables */
  env?: Record<string, string>;
  /** Services to bind */
  services?: string[];
  /** Routes */
  routes?: string[];
}

/**
 * xs-app.json configuration for BTP
 */
export interface XSAppConfig {
  /** Welcome file */
  welcomeFile?: string;
  /** Authentication method */
  authenticationMethod?: 'route' | 'none';
  /** Session timeout */
  sessionTimeout?: number;
  /** Routes configuration */
  routes: XSAppRoute[];
  /** Logout configuration */
  logout?: {
    logoutEndpoint: string;
    logoutPage?: string;
  };
}

/**
 * xs-app.json route configuration
 */
export interface XSAppRoute {
  /** Source pattern */
  source: string;
  /** Target destination */
  target?: string;
  /** Destination name */
  destination?: string;
  /** Authentication required */
  authenticationType?: 'xsuaa' | 'basic' | 'none';
  /** CSRF protection */
  csrfProtection?: boolean;
  /** Local directory */
  localDir?: string;
  /** Replace path */
  replace?: {
    pathSuffixes: string[];
    vars: string[];
  };
}

// ==================== Tribble-SAP Bridge Types ====================

/**
 * Tribble agent configuration for SAP
 */
export interface TribbleAgentSAPConfig {
  /** Agent ID */
  agentId: string;
  /** Agent name */
  name: string;
  /** Model configuration */
  model?: string;
  /** System prompt */
  systemPrompt?: string;
  /** SAP context enrichment */
  sapContext?: {
    includeUserInfo?: boolean;
    includeSystemInfo?: boolean;
    includeBusinessContext?: boolean;
  };
  /** Tools available to agent */
  tools?: string[];
}

/**
 * Tribble document ingestion for SAP
 */
export interface TribbleIngestSAPConfig {
  /** Collection ID */
  collectionId: string;
  /** Batch size */
  batchSize?: number;
  /** SAP-specific metadata to include */
  sapMetadata?: {
    client?: boolean;
    systemId?: boolean;
    userId?: boolean;
    timestamp?: boolean;
  };
  /** File size limit (MB) */
  fileSizeLimit?: number;
}

/**
 * SAP user context
 */
export interface SAPUserContext {
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
  /** Email */
  email?: string;
  /** Language */
  language: string;
  /** Client */
  client: string;
  /** Roles */
  roles?: string[];
  /** Authorization profile */
  authProfile?: string[];
}

/**
 * SAP business context
 */
export interface SAPBusinessContext {
  /** Company code */
  companyCode?: string;
  /** Plant */
  plant?: string;
  /** Sales organization */
  salesOrg?: string;
  /** Distribution channel */
  distributionChannel?: string;
  /** Division */
  division?: string;
  /** Profit center */
  profitCenter?: string;
  /** Cost center */
  costCenter?: string;
}

// ==================== CLI Types ====================

/**
 * CLI command configuration
 */
export interface CLICommand {
  /** Command name */
  name: string;
  /** Description */
  description: string;
  /** Options */
  options?: CLIOption[];
  /** Action handler */
  action: (...args: any[]) => Promise<void> | void;
}

/**
 * CLI option
 */
export interface CLIOption {
  /** Option flags */
  flags: string;
  /** Description */
  description: string;
  /** Default value */
  defaultValue?: any;
}

/**
 * Scaffold options
 */
export interface ScaffoldOptions {
  /** Application name */
  name: string;
  /** Application type */
  type: FioriAppType;
  /** Output directory */
  output: string;
  /** Namespace */
  namespace: string;
  /** Include sample data */
  sampleData?: boolean;
  /** OData version */
  odataVersion?: '2.0' | '4.0';
}

/**
 * Build options
 */
export interface BuildOptions {
  /** Source directory */
  source: string;
  /** Output directory */
  output: string;
  /** Minify */
  minify?: boolean;
  /** Source maps */
  sourceMaps?: boolean;
  /** Target environment */
  target?: 'on-premise' | 'btp';
}

/**
 * Deploy options
 */
export interface DeployOptions {
  /** Target system */
  target: SAPDeploymentTarget;
  /** Package path */
  package: string;
  /** System configuration */
  system?: SAPSystemConfig;
  /** BTP configuration */
  btp?: BTPDeploymentConfig;
  /** Force deployment */
  force?: boolean;
}

// ==================== Error Types ====================

/**
 * SAP integration error
 */
export class SAPIntegrationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SAPIntegrationError';
  }
}

/**
 * OData service error
 */
export class ODataServiceError extends SAPIntegrationError {
  constructor(message: string, code?: string, details?: any) {
    super(message, code, details);
    this.name = 'ODataServiceError';
  }
}

/**
 * ABAP execution error
 */
export class ABAPExecutionError extends SAPIntegrationError {
  constructor(message: string, code?: string, details?: any) {
    super(message, code, details);
    this.name = 'ABAPExecutionError';
  }
}

/**
 * Fiori deployment error
 */
export class FioriDeploymentError extends SAPIntegrationError {
  constructor(message: string, code?: string, details?: any) {
    super(message, code, details);
    this.name = 'FioriDeploymentError';
  }
}

// ==================== Utility Types ====================

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required fields helper
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
