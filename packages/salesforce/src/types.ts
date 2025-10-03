/**
 * Type definitions for Salesforce-Tribble integration
 */

import type { TribbleConfig } from '@tribble/sdk-core';

// ==================== Configuration Types ====================

/**
 * Salesforce-specific configuration for Tribble SDK
 */
export interface SalesforceConfig {
  /** Tribble API base URL */
  apiBaseUrl: string;
  /** API authentication method */
  authMethod: 'api-key' | 'oauth' | 'named-credentials';
  /** API key (if using api-key auth) */
  apiKey?: string;
  /** OAuth client ID (if using oauth) */
  oauthClientId?: string;
  /** Named Credentials name (if using named-credentials) */
  namedCredential?: string;
  /** User email for Tribble agent */
  userEmail?: string;
  /** Enable debug logging */
  enableDebugLogs?: boolean;
  /** Custom Remote Site Settings */
  remoteSiteSettings?: RemoteSiteSetting[];
}

/**
 * Remote Site Setting configuration
 */
export interface RemoteSiteSetting {
  fullName: string;
  description: string;
  url: string;
  isActive: boolean;
  disableProtocolSecurity?: boolean;
}

/**
 * Custom Metadata Type for Tribble configuration
 */
export interface TribbleConfigMetadata {
  label: string;
  apiEndpoint: string;
  authMethod: string;
  apiKey?: string;
  oauthClientId?: string;
  namedCredential?: string;
  enableDebugLogs: boolean;
}

// ==================== Apex Response Types ====================

/**
 * Standard Apex response wrapper
 */
export interface ApexResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  stackTrace?: string;
}

/**
 * Chat response from Apex
 */
export interface ApexChatResponse {
  conversationId: string;
  message: string;
  timestamp: string;
}

/**
 * Upload response from Apex
 */
export interface ApexUploadResponse {
  documentIds: number[];
  uploadedCount: number;
  failedCount: number;
  errors?: string[];
}

/**
 * Agent interaction response from Apex
 */
export interface ApexAgentResponse {
  conversationId: string;
  message: string;
  actions?: ApexAgentAction[];
  metadata?: Record<string, any>;
}

/**
 * Agent action definition
 */
export interface ApexAgentAction {
  type: string;
  label: string;
  payload?: Record<string, any>;
}

// ==================== Lightning Web Component Types ====================

/**
 * LWC Chat component properties
 */
export interface LWCChatProps {
  /** Initial conversation ID (optional) */
  conversationId?: string;
  /** User email override */
  userEmail?: string;
  /** Enable streaming responses */
  enableStreaming?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Show typing indicator */
  showTypingIndicator?: boolean;
  /** Maximum message length */
  maxMessageLength?: number;
}

/**
 * LWC Upload component properties
 */
export interface LWCUploadProps {
  /** Accepted file types */
  acceptedFileTypes?: string[];
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
  /** Allow multiple file upload */
  allowMultiple?: boolean;
  /** Auto-upload on file selection */
  autoUpload?: boolean;
  /** Custom upload button label */
  uploadButtonLabel?: string;
}

/**
 * LWC Agent component properties
 */
export interface LWCAgentProps {
  /** Agent configuration */
  agentConfig?: {
    email: string;
    welcomeMessage?: string;
    suggestedActions?: string[];
  };
  /** Enable document upload */
  enableUpload?: boolean;
  /** Enable chat interface */
  enableChat?: boolean;
  /** Custom CSS class */
  cssClass?: string;
}

/**
 * Chat message structure for LWC
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Upload file metadata for LWC
 */
export interface UploadFileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  documentId?: number;
}

// ==================== Apex Callout Types ====================

/**
 * HTTP callout configuration
 */
export interface ApexHttpCalloutConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Map<string, string>;
  body?: string;
  timeout?: number;
  compress?: boolean;
}

/**
 * HTTP callout response
 */
export interface ApexHttpCalloutResponse {
  statusCode: number;
  status: string;
  headers: Map<string, string>;
  body: string;
}

// ==================== Package Deployment Types ====================

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
  /** Target Salesforce org */
  targetOrg: string;
  /** Deployment type */
  deploymentType: 'sandbox' | 'production';
  /** Run tests on deployment */
  runTests: boolean;
  /** Test level */
  testLevel?: 'NoTestRun' | 'RunSpecifiedTests' | 'RunLocalTests' | 'RunAllTestsInOrg';
  /** Specific tests to run */
  specifiedTests?: string[];
  /** Check only (validation) */
  checkOnly?: boolean;
  /** Rollback on error */
  rollbackOnError?: boolean;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  componentsDeployed: number;
  componentsFailed: number;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  errors?: DeploymentError[];
  warnings?: DeploymentWarning[];
}

/**
 * Deployment error
 */
export interface DeploymentError {
  type: string;
  file: string;
  line?: number;
  column?: number;
  message: string;
  problemType?: string;
}

/**
 * Deployment warning
 */
export interface DeploymentWarning {
  type: string;
  file: string;
  message: string;
}

// ==================== Metadata Types ====================

/**
 * Lightning Web Component metadata
 */
export interface LWCMetadata {
  apiVersion: string;
  isExposed: boolean;
  targets: {
    target: string[];
  };
  targetConfigs?: {
    targetConfig: LWCTargetConfig[];
  };
}

/**
 * LWC target configuration
 */
export interface LWCTargetConfig {
  targets: string;
  objects?: {
    object: string[];
  };
  supportedFormFactors?: string;
  hasStep?: boolean;
}

/**
 * Apex class metadata
 */
export interface ApexClassMetadata {
  apiVersion: string;
  status: 'Active' | 'Deleted';
}

/**
 * Custom Metadata Type definition
 */
export interface CustomMetadataType {
  fullName: string;
  label: string;
  pluralLabel: string;
  visibility?: 'Public' | 'Protected' | 'PackageProtected';
  customMetadataTypeFields?: CustomMetadataTypeField[];
}

/**
 * Custom Metadata Type field
 */
export interface CustomMetadataTypeField {
  fullName: string;
  label: string;
  type: 'Text' | 'Checkbox' | 'Number' | 'Url' | 'Email' | 'TextArea' | 'DateTime';
  required: boolean;
  defaultValue?: string;
}

// ==================== Builder Types ====================

/**
 * Package builder configuration
 */
export interface PackageBuilderConfig {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** API version */
  apiVersion: string;
  /** Components to include */
  components: PackageComponent[];
  /** Custom settings */
  customSettings?: Record<string, any>;
}

/**
 * Package component definition
 */
export interface PackageComponent {
  type: 'ApexClass' | 'ApexTrigger' | 'LightningComponentBundle' | 'CustomObject' | 'CustomMetadata' | 'RemoteSiteSetting' | 'NamedCredential';
  name: string;
  content?: string;
  metadata?: any;
  dependencies?: string[];
}

// ==================== Error Types ====================

/**
 * Salesforce-specific errors
 */
export class SalesforceDeploymentError extends Error {
  constructor(
    message: string,
    public readonly errors: DeploymentError[] = [],
    public readonly warnings: DeploymentWarning[] = []
  ) {
    super(message);
    this.name = 'SalesforceDeploymentError';
  }
}

export class ApexCalloutError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = 'ApexCalloutError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ==================== Utility Types ====================

/**
 * Salesforce user context
 */
export interface SalesforceUserContext {
  userId: string;
  userName: string;
  userEmail: string;
  orgId: string;
  orgName: string;
  profileId: string;
  roleId?: string;
  timeZone: string;
  locale: string;
}

/**
 * Platform event for real-time updates
 */
export interface TribblePlatformEvent {
  eventType: 'chat_response' | 'upload_complete' | 'agent_action' | 'error';
  payload: Record<string, any>;
  timestamp: Date;
  userId: string;
}

/**
 * Re-export core types
 */
export type { TribbleConfig };
