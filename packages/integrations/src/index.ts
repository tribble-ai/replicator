/**
 * Tribble SDK Integrations Package
 *
 * Comprehensive integration primitives for connecting enterprise systems to Tribble.
 *
 * @example Basic REST API Integration
 * ```typescript
 * import {
 *   RestTransport,
 *   OAuth2Provider,
 *   JsonTransformer,
 *   RestApiConnector,
 *   createScheduler,
 * } from '@tribble/sdk-integrations';
 *
 * // Create transport with OAuth2 auth
 * const transport = new RestTransport({
 *   baseUrl: 'https://api.example.com',
 *   auth: new OAuth2Provider({
 *     tokenEndpoint: 'https://auth.example.com/token',
 *     clientId: 'your-client-id',
 *     clientSecret: 'your-client-secret',
 *   }),
 * });
 *
 * // Create connector
 * const connector = new RestApiConnector(
 *   {
 *     name: 'example-api',
 *     version: '1.0.0',
 *     source: 'example',
 *     transport,
 *     transformer: new JsonTransformer({ dataPath: 'items' }),
 *     schedule: '0 * * * *', // hourly
 *   },
 *   {
 *     endpoint: '/api/v1/data',
 *     pagination: {
 *       style: 'cursor',
 *       cursorPath: 'meta.next_cursor',
 *       itemsPath: 'data',
 *     },
 *   }
 * );
 *
 * // Initialize and run
 * await connector.initialize(context);
 * const result = await connector.pull({ since: '2024-01-01' });
 * ```
 *
 * @example FTP Integration
 * ```typescript
 * import { FtpTransport, CsvTransformer, createScheduler } from '@tribble/sdk-integrations';
 *
 * const transport = new FtpTransport({
 *   host: 'ftp.example.com',
 *   username: 'user',
 *   password: 'pass',
 *   secure: true, // SFTP
 * });
 *
 * const transformer = new CsvTransformer({
 *   hasHeader: true,
 *   columnMappings: { old_name: 'new_name' },
 * });
 * ```
 *
 * @example File Watcher Integration
 * ```typescript
 * import { FileWatcherTransport, FlatFileTransformer } from '@tribble/sdk-integrations';
 *
 * const transport = new FileWatcherTransport({
 *   watchPath: '/data/imports',
 *   pattern: '*.dat',
 *   pollInterval: 5000,
 * });
 *
 * const transformer = new FlatFileTransformer({
 *   fields: [
 *     { name: 'id', start: 1, length: 10, type: 'number' },
 *     { name: 'name', start: 11, length: 50, type: 'string' },
 *     { name: 'date', start: 61, length: 8, type: 'date' },
 *   ],
 * });
 * ```
 */

// ==================== Core Types ====================
export type {
  AuthCredentials,
  AuthProvider,
  Transport,
  RestTransportConfig,
  FtpTransportConfig,
  FileWatcherConfig,
  WebhookConfig,
  DataFormat,
  TransformContext,
  TransformResult,
  DataTransformer,
  ConnectorConfig,
  IntegrationContext,
  IntegrationConnector,
  SyncParams,
  SyncResult,
  WebhookPayload,
  Logger,
} from './types';

// ==================== Errors ====================
export {
  IntegrationError,
  TransportError,
  AuthenticationError,
  TransformationError,
  ValidationError,
} from './types';

// ==================== Authentication ====================
export {
  NoAuthProvider,
  ApiKeyAuthProvider,
  BearerAuthProvider,
  BasicAuthProvider,
  CustomAuthProvider,
  OAuth2Provider,
  type OAuth2Config,
} from './auth';

// ==================== Transports ====================
export {
  RestTransport,
  type RestRequestOptions,
  type PaginationConfig,
  FtpTransport,
  createFtpTransport,
  type FtpFile,
  type FtpListOptions,
  type FtpDownloadOptions,
  FileWatcherTransport,
  createFileWatcher,
  type FileEvent,
  type FileEventHandler,
  WebhookTransport,
  createWebhookTransport,
  createWebhookMiddleware,
  type WebhookHandler,
  type WebhookRequest,
} from './transport';

// ==================== Transformers ====================
export {
  CsvTransformer,
  createCsvTransformer,
  type CsvTransformerConfig,
  JsonTransformer,
  createJsonTransformer,
  type JsonTransformerConfig,
  FlatFileTransformer,
  createFlatFileTransformer,
  type FlatFileTransformerConfig,
  type FlatFileFieldSpec,
} from './transformers';

// ==================== Connectors ====================
export {
  BaseConnector,
  ConsoleLogger,
  RestApiConnector,
  createRestApiConnector,
  type RestApiConnectorConfig,
} from './connector';

// ==================== Utilities ====================
export {
  retry,
  isRetryableError,
  type RetryOptions,
  Scheduler,
  createScheduler,
  describeCronSchedule,
  type SchedulerOptions,
} from './utils';
