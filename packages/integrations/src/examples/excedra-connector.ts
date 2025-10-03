/**
 * Example: exceedra REST API Connector
 *
 * This demonstrates how to build a custom connector for a REST API system
 * like exceedra, with OAuth2 authentication and pagination.
 */

import {
  RestTransport,
  OAuth2Provider,
  JsonTransformer,
  RestApiConnector,
  createScheduler,
  type IntegrationContext,
  type SyncParams,
  type SyncResult,
} from '../index';

/**
 * exceedra API configuration
 */
export interface exceedraConfig {
  /** API base URL */
  baseUrl: string;

  /** OAuth2 client ID */
  clientId: string;

  /** OAuth2 client secret */
  clientSecret: string;

  /** OAuth2 token endpoint */
  tokenEndpoint: string;

  /** API scopes */
  scopes?: string[];

  /** Sync schedule (cron expression) */
  schedule?: string;
}

/**
 * Create an exceedra connector
 *
 * @example
 * ```typescript
 * const connector = createexceedraConnector({
 *   baseUrl: 'https://api.exceedra.com',
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   tokenEndpoint: 'https://auth.exceedra.com/oauth/token',
 *   scopes: ['read:documents'],
 *   schedule: '0 * * * *', // hourly
 * });
 *
 * // Initialize with Tribble context
 * await connector.initialize({
 *   tribble: { ingest: tribbleIngestClient },
 *   config: {},
 * });
 *
 * // Pull data
 * const result = await connector.pull({
 *   since: '2024-01-01T00:00:00Z',
 * });
 *
 * console.log(`Processed ${result.documentsProcessed} documents`);
 * console.log(`Uploaded ${result.documentsUploaded} documents`);
 * ```
 */
export function createexceedraConnector(config: exceedraConfig) {
  // Create OAuth2 authentication provider
  const auth = new OAuth2Provider({
    tokenEndpoint: config.tokenEndpoint,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    grantType: 'client_credentials',
    scopes: config.scopes || ['read:documents'],
  });

  // Create REST transport
  const transport = new RestTransport({
    baseUrl: config.baseUrl,
    auth,
    defaultHeaders: {
      'Accept': 'application/json',
      'User-Agent': 'Tribble-SDK/1.0',
    },
    retryConfig: {
      maxRetries: 3,
      backoffMs: 1000,
      maxBackoffMs: 10000,
    },
  });

  // Create JSON transformer
  const transformer = new JsonTransformer({
    dataPath: 'data', // exceedra returns data in { data: [...] }
    fieldMappings: {
      // Map exceedra fields to standard names
      document_id: 'id',
      created_date: 'createdAt',
      modified_date: 'updatedAt',
    },
    excludeFields: ['_internal', '_metadata'], // Exclude internal fields
  });

  // Create connector
  const connector = new RestApiConnector(
    {
      name: 'exceedra-connector',
      version: '1.0.0',
      source: 'exceedra',
      transport,
      transformer,
      schedule: config.schedule,
    },
    {
      endpoint: '/api/v1/documents',
      dataPath: 'data',
      timestampPath: 'updated_at',
      pagination: {
        style: 'cursor',
        cursorPath: 'meta.next_cursor',
        itemsPath: 'data',
        limitParam: 'limit',
        defaultLimit: 100,
        maxLimit: 500,
      },
      incremental: true,
      sinceParam: 'updated_since',
      untilParam: 'updated_until',
    }
  );

  return connector;
}

/**
 * Example: Setup scheduled sync for exceedra
 */
export async function setupexceedraSync(
  config: exceedraConfig,
  context: IntegrationContext
) {
  const connector = createexceedraConnector(config);

  // Initialize connector
  await connector.initialize(context);

  // Setup scheduler if schedule is provided
  if (config.schedule) {
    const scheduler = createScheduler({
      schedule: config.schedule,
      onTrigger: async () => {
        console.log('Starting scheduled exceedra sync...');
        const result = await connector.pull({});
        console.log('Sync completed:', result);
      },
      onError: (error) => {
        console.error('Sync failed:', error);
      },
    });

    scheduler.start();
    console.log(`exceedra sync scheduled: ${config.schedule}`);

    return { connector, scheduler };
  }

  return { connector };
}

/**
 * Example: Manual one-time sync
 */
export async function runexceedraSync(
  config: exceedraConfig,
  context: IntegrationContext,
  params?: SyncParams
): Promise<SyncResult> {
  const connector = createexceedraConnector(config);
  await connector.initialize(context);

  const result = await connector.pull(params || {});

  await connector.disconnect();

  return result;
}
