/**
 * Core types for the Tribble SDK integrations layer.
 *
 * This module defines the fundamental interfaces and types for building
 * integrations with enterprise systems.
 */

import type { IngestClient } from '@tribble/sdk-ingest';

/**
 * Authentication credentials for various auth mechanisms
 */
export type AuthCredentials =
  | { type: 'oauth2'; accessToken: string; refreshToken?: string; expiresAt?: number }
  | { type: 'apiKey'; key: string; headerName?: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }
  | { type: 'custom'; headers: Record<string, string> }
  | { type: 'none' };

/**
 * Authentication provider interface - handles credential lifecycle
 */
export interface AuthProvider {
  /** Get current valid credentials */
  getCredentials(): Promise<AuthCredentials>;

  /** Refresh credentials if needed */
  refresh?(): Promise<AuthCredentials>;

  /** Validate credentials are still valid */
  validate?(): Promise<boolean>;

  /** Apply credentials to request headers */
  applyToHeaders(headers: Record<string, string>): Promise<Record<string, string>>;
}

/**
 * Transport layer interface - abstracts different data transfer mechanisms
 */
export interface Transport {
  /** Unique identifier for this transport type */
  readonly type: 'rest' | 'ftp' | 'sftp' | 'file' | 'webhook' | 'custom';

  /** Connect/initialize the transport */
  connect(): Promise<void>;

  /** Disconnect/cleanup the transport */
  disconnect(): Promise<void>;

  /** Check if transport is connected */
  isConnected(): boolean;
}

/**
 * REST transport configuration
 */
export interface RestTransportConfig {
  baseUrl: string;
  auth: AuthProvider;
  defaultHeaders?: Record<string, string>;
  retryConfig?: {
    maxRetries?: number;
    backoffMs?: number;
    maxBackoffMs?: number;
  };
  timeoutMs?: number;
}

/**
 * FTP/SFTP transport configuration
 */
export interface FtpTransportConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  secure?: boolean; // true for SFTP, false for FTP
  rootPath?: string;
}

/**
 * File watcher transport configuration
 */
export interface FileWatcherConfig {
  watchPath: string;
  pattern?: string | RegExp;
  pollInterval?: number; // ms
  recursive?: boolean;
}

/**
 * Webhook transport configuration
 */
export interface WebhookConfig {
  endpoint: string;
  secret?: string; // for signature verification
  signatureHeader?: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
}

/**
 * Data format types supported by transformers
 */
export type DataFormat = 'json' | 'csv' | 'xml' | 'flat-file' | 'binary' | 'custom';

/**
 * Transformation context provided to transformers
 */
export interface TransformContext {
  /** Source system identifier */
  source: string;

  /** Original data format */
  format: DataFormat;

  /** Metadata about the source data */
  metadata: Record<string, any>;

  /** Timestamp of when data was received */
  receivedAt: Date;

  /** Optional trace ID for debugging */
  traceId?: string;
}

/**
 * Result of a data transformation
 */
export interface TransformResult {
  /** Transformed data ready for upload */
  data: any;

  /** Document metadata to attach */
  metadata: Record<string, any>;

  /** Optional filename for the document */
  filename?: string;

  /** Content type of the data */
  contentType?: string;
}

/**
 * Data transformer interface
 */
export interface DataTransformer<TInput = any, TOutput = any> {
  /** Transform raw data into Tribble-compatible format */
  transform(input: TInput, context: TransformContext): Promise<TransformResult[]>;

  /** Validate input data before transformation */
  validate?(input: TInput): Promise<boolean>;
}

/**
 * Integration connector configuration
 */
export interface ConnectorConfig {
  /** Unique connector name */
  name: string;

  /** Connector version */
  version: string;

  /** Source system identifier */
  source: string;

  /** Transport configuration */
  transport: Transport;

  /** Data transformer */
  transformer: DataTransformer;

  /** Schedule configuration (cron expression) */
  schedule?: string;

  /** Custom configuration options */
  options?: Record<string, any>;
}

/**
 * Integration context provided to connectors
 */
export interface IntegrationContext {
  /** Account/tenant identifier */
  accountId?: string;

  /** Tribble ingest client for uploading data */
  tribble: {
    ingest: IngestClient;
  };

  /** Optional helper tools */
  tools?: {
    pdf?: {
      fromMarkdown: (md: string) => Promise<Uint8Array | Blob>;
      fromHtml: (html: string) => Promise<Uint8Array | Blob>;
    };
  };

  /** Connector-specific configuration */
  config: Record<string, any>;

  /** Logger for debugging */
  logger?: Logger;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}

/**
 * Sync operation parameters
 */
export interface SyncParams {
  /** Start date for incremental sync */
  since?: string | Date;

  /** End date for sync window */
  until?: string | Date;

  /** Additional query parameters */
  params?: Record<string, any>;

  /** Force full sync instead of incremental */
  fullSync?: boolean;

  /** Batch size for processing */
  batchSize?: number;

  /** Trace ID for debugging */
  traceId?: string;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  /** Number of documents processed */
  documentsProcessed: number;

  /** Number of documents uploaded */
  documentsUploaded: number;

  /** Number of errors encountered */
  errors: number;

  /** Error details if any */
  errorDetails?: Array<{ message: string; context?: any }>;

  /** Checkpoint for next sync */
  checkpoint?: string | Date;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Integration connector interface - the main abstraction for custom apps
 */
export interface IntegrationConnector {
  /** Connector configuration */
  readonly config: ConnectorConfig;

  /** Initialize the connector */
  initialize(context: IntegrationContext): Promise<void>;

  /** Pull data from source system */
  pull(params: SyncParams): Promise<SyncResult>;

  /** Handle real-time webhook events (optional) */
  handleWebhook?(payload: any, headers: Record<string, string>): Promise<void>;

  /** Validate connector configuration */
  validate?(): Promise<boolean>;

  /** Cleanup/disconnect */
  disconnect(): Promise<void>;
}

/**
 * Webhook event payload
 */
export interface WebhookPayload {
  /** Event type/name */
  event: string;

  /** Event data */
  data: any;

  /** Timestamp of the event */
  timestamp: Date;

  /** Source system identifier */
  source: string;

  /** Event ID for idempotency */
  eventId?: string;
}

/**
 * Integration error types
 */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class TransportError extends IntegrationError {
  constructor(message: string, retryable: boolean = true, context?: Record<string, any>) {
    super(message, 'TRANSPORT_ERROR', retryable, context);
    this.name = 'TransportError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', false, context);
    this.name = 'AuthenticationError';
  }
}

export class TransformationError extends IntegrationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TRANSFORM_ERROR', false, context);
    this.name = 'TransformationError';
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', false, context);
    this.name = 'ValidationError';
  }
}
