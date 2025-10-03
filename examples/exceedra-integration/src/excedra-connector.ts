/**
 * exceedra API Connector
 *
 * Production-ready connector for the exceedra pharmaceutical/CPG REST API.
 * Demonstrates best practices for integrating third-party systems with Tribble.
 */

import {
  BaseConnector,
  RestTransport,
  OAuth2Provider,
  retry,
  isRetryableError,
  type ConnectorConfig,
  type IntegrationContext,
  type SyncParams,
  type SyncResult,
  type TransformContext,
  type TransformResult,
  type DataTransformer,
} from '@tribble/sdk-integrations';
import { IntegrationError } from '@tribble/sdk-integrations';
import { transformexceedraData } from './transformers.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * exceedra API endpoint configuration
 */
export const exceedra_ENDPOINTS = {
  documents: '/api/v1/documents',
  products: '/api/v1/products',
  retailers: '/api/v1/retailers',
} as const;

export type exceedraDataSource = keyof typeof exceedra_ENDPOINTS;

/**
 * Checkpoint data for incremental syncs
 */
export interface exceedraCheckpoint {
  documents?: string;
  products?: string;
  retailers?: string;
  lastSyncAt: string;
}

/**
 * Configuration for exceedra connector
 */
export interface exceedraConnectorConfig {
  /** Data sources to sync */
  sources: exceedraDataSource[];

  /** Batch size for processing */
  batchSize?: number;

  /** Maximum retries for failed requests */
  maxRetries?: number;

  /** Checkpoint file path for persistence */
  checkpointFile?: string;

  /** Enable checkpoint persistence */
  enableCheckpointPersistence?: boolean;

  /** Rate limit (requests per second) */
  rateLimit?: number;
}

/**
 * Custom transformer for exceedra data
 */
class exceedraTransformer implements DataTransformer {
  constructor(private readonly dataType: exceedraDataSource) {}

  async transform(input: any, context: TransformContext): Promise<TransformResult[]> {
    // Handle both single objects and arrays
    const data = Array.isArray(input) ? input : [input];
    return transformexceedraData(data, this.dataType, context);
  }

  async validate(input: any): Promise<boolean> {
    // Basic validation
    if (!input) return false;
    const data = Array.isArray(input) ? input : [input];
    return data.length > 0 && data.every((item) => item.id && item.updated_at);
  }
}

/**
 * exceedra API Connector
 *
 * Handles:
 * - OAuth2 authentication with automatic token refresh
 * - Pagination with cursor-based navigation
 * - Rate limiting to respect API quotas
 * - Incremental sync with checkpointing
 * - Error handling and retry logic
 * - Data transformation to Tribble format
 */
export class exceedraConnector extends BaseConnector {
  private readonly exceedraConfig: exceedraConnectorConfig;
  private readonly transport: RestTransport;
  private checkpoints: exceedraCheckpoint | null = null;
  private lastRequestTime: number = 0;

  constructor(
    config: ConnectorConfig,
    exceedraConfig: exceedraConnectorConfig
  ) {
    super(config);

    if (!(config.transport instanceof RestTransport)) {
      throw new IntegrationError(
        'exceedraConnector requires RestTransport',
        'INVALID_CONFIG',
        false
      );
    }

    this.transport = config.transport;
    this.exceedraConfig = exceedraConfig;

    // Load checkpoints from file if enabled
    if (exceedraConfig.enableCheckpointPersistence) {
      this.loadCheckpoints();
    }
  }

  async initialize(context: IntegrationContext): Promise<void> {
    await super.initialize(context);

    this.logger.info('exceedra connector initialized', {
      sources: this.exceedraConfig.sources,
      batchSize: this.exceedraConfig.batchSize,
      checkpointFile: this.exceedraConfig.checkpointFile,
      rateLimit: this.exceedraConfig.rateLimit,
    });
  }

  async pull(params: SyncParams): Promise<SyncResult> {
    this.logger.info('Starting exceedra data sync', {
      sources: this.exceedraConfig.sources,
      fullSync: params.fullSync,
      since: params.since,
    });

    let totalProcessed = 0;
    let totalUploaded = 0;
    let totalErrors = 0;
    const errorDetails: Array<{ message: string; context?: any }> = [];

    try {
      // Sync each data source
      for (const source of this.exceedraConfig.sources) {
        this.logger.info(`Syncing ${source}...`);

        try {
          const result = await this.syncDataSource(source, params);

          totalProcessed += result.documentsProcessed;
          totalUploaded += result.documentsUploaded;
          totalErrors += result.errors;

          if (result.errorDetails) {
            errorDetails.push(...result.errorDetails);
          }

          // Update checkpoint for this source
          if (result.checkpoint) {
            this.updateCheckpoint(source, result.checkpoint);
          }

          this.logger.info(`Completed syncing ${source}`, {
            processed: result.documentsProcessed,
            uploaded: result.documentsUploaded,
            errors: result.errors,
          });
        } catch (error: any) {
          this.logger.error(`Failed to sync ${source}`, error);
          totalErrors++;
          errorDetails.push({
            message: `Failed to sync ${source}: ${error.message}`,
            context: { source, error: error.stack },
          });
        }
      }

      // Save checkpoints after successful sync
      if (this.exceedraConfig.enableCheckpointPersistence) {
        this.saveCheckpoints();
      }

      return {
        documentsProcessed: totalProcessed,
        documentsUploaded: totalUploaded,
        errors: totalErrors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        checkpoint: this.checkpoints?.lastSyncAt,
      };
    } catch (error: any) {
      this.logger.error('Sync operation failed', error);

      return {
        documentsProcessed: totalProcessed,
        documentsUploaded: totalUploaded,
        errors: totalErrors + 1,
        errorDetails: [
          ...errorDetails,
          {
            message: `Sync operation failed: ${error.message}`,
            context: { error: error.stack },
          },
        ],
      };
    }
  }

  async validate(): Promise<boolean> {
    try {
      this.logger.info('Validating exceedra API connection...');

      // Test connectivity to each endpoint
      for (const source of this.exceedraConfig.sources) {
        const endpoint = exceedra_ENDPOINTS[source];
        await this.rateLimitedRequest(endpoint, { limit: 1 });
      }

      this.logger.info('Validation successful');
      return true;
    } catch (error: any) {
      this.logger.error('Validation failed', error);
      return false;
    }
  }

  // ==================== Private Methods ====================

  /**
   * Sync a single data source
   */
  private async syncDataSource(
    source: exceedraDataSource,
    params: SyncParams
  ): Promise<SyncResult> {
    const endpoint = exceedra_ENDPOINTS[source];
    let documentsProcessed = 0;
    let documentsUploaded = 0;
    let errors = 0;
    const errorDetails: Array<{ message: string; context?: any }> = [];
    let latestTimestamp: string | undefined;

    // Determine sync window
    let since: string | undefined;
    if (!params.fullSync) {
      since = this.getCheckpoint(source) || params.since
        ? this.parseCheckpoint(params.since).toISOString()
        : undefined;
    }

    // Prepare query parameters for incremental sync
    const queryParams: Record<string, any> = {
      limit: this.exceedraConfig.batchSize || 100,
    };

    if (since) {
      queryParams.updated_since = since;
    }

    if (params.until) {
      const until = typeof params.until === 'string' ? params.until : params.until.toISOString();
      queryParams.updated_until = until;
    }

    try {
      // Fetch data with pagination
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        if (cursor) {
          queryParams.cursor = cursor;
        }

        // Make rate-limited request with retry
        const response = await retry(
          () => this.rateLimitedRequest<any>(endpoint, queryParams),
          {
            maxRetries: this.exceedraConfig.maxRetries || 3,
            backoffMs: 1000,
            maxBackoffMs: 30000,
            shouldRetry: (error) => isRetryableError(error),
            onRetry: (error, attempt, delayMs) => {
              this.logger.warn('Retrying request', {
                source,
                attempt,
                delayMs,
                error: error.message,
              });
            },
          }
        );

        const items = response.data || [];
        documentsProcessed += items.length;

        if (items.length > 0) {
          // Transform and upload items
          try {
            const transformer = new exceedraTransformer(source);
            const transformResults = await transformer.transform(items, {
              source: this.config.source,
              format: 'json',
              metadata: { dataType: source },
              receivedAt: new Date(),
              traceId: params.traceId,
            });

            const { uploaded, errors: uploadErrors } = await this.uploadToTribble(
              transformResults
            );

            documentsUploaded += uploaded;
            errors += uploadErrors;

            if (uploadErrors > 0) {
              errorDetails.push({
                message: `${uploadErrors} upload errors in batch`,
                context: { source, batchSize: items.length },
              });
            }

            // Track latest timestamp
            const timestamps = items
              .map((item: any) => item.updated_at)
              .filter(Boolean)
              .sort();

            if (timestamps.length > 0) {
              latestTimestamp = timestamps[timestamps.length - 1];
            }
          } catch (error: any) {
            this.logger.error('Transform/upload error', error, { source });
            errors += items.length;
            errorDetails.push({
              message: `Transform/upload failed: ${error.message}`,
              context: { source, error: error.stack },
            });
          }
        }

        // Check for next page
        cursor = response.meta?.next_cursor;
        hasMore = !!cursor && items.length > 0;

        // Respect batch size limit
        if (params.batchSize && documentsProcessed >= params.batchSize) {
          this.logger.info('Batch size limit reached', {
            source,
            processed: documentsProcessed,
            limit: params.batchSize,
          });
          break;
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to fetch ${source} data`, error);
      throw error;
    }

    return {
      documentsProcessed,
      documentsUploaded,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      checkpoint: latestTimestamp,
    };
  }

  /**
   * Make a rate-limited API request
   */
  private async rateLimitedRequest<T = any>(
    endpoint: string,
    queryParams?: Record<string, any>
  ): Promise<T> {
    // Apply rate limiting if configured
    if (this.exceedraConfig.rateLimit) {
      const minIntervalMs = 1000 / this.exceedraConfig.rateLimit;
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;

      if (timeSinceLastRequest < minIntervalMs) {
        const delayMs = minIntervalMs - timeSinceLastRequest;
        await this.sleep(delayMs);
      }
    }

    this.lastRequestTime = Date.now();

    return this.transport.request<T>(endpoint, {
      method: 'GET',
      query: queryParams,
    });
  }

  /**
   * Get checkpoint for a data source
   */
  private getCheckpoint(source: exceedraDataSource): string | undefined {
    return this.checkpoints?.[source];
  }

  /**
   * Update checkpoint for a data source
   */
  private updateCheckpoint(source: exceedraDataSource, checkpoint: string | Date): void {
    if (!this.checkpoints) {
      this.checkpoints = {
        lastSyncAt: new Date().toISOString(),
      };
    }

    const timestamp = typeof checkpoint === 'string' ? checkpoint : checkpoint.toISOString();
    this.checkpoints[source] = timestamp;
    this.checkpoints.lastSyncAt = new Date().toISOString();
  }

  /**
   * Load checkpoints from file
   */
  private loadCheckpoints(): void {
    const checkpointFile = this.exceedraConfig.checkpointFile || '.exceedra-checkpoint.json';

    try {
      if (existsSync(checkpointFile)) {
        const data = readFileSync(checkpointFile, 'utf-8');
        this.checkpoints = JSON.parse(data);
        this.logger.info('Loaded checkpoints from file', {
          file: checkpointFile,
          checkpoints: this.checkpoints,
        });
      }
    } catch (error: any) {
      this.logger.warn('Failed to load checkpoints', {
        file: checkpointFile,
        error: error.message,
      });
    }
  }

  /**
   * Save checkpoints to file
   */
  private saveCheckpoints(): void {
    if (!this.checkpoints) return;

    const checkpointFile = this.exceedraConfig.checkpointFile || '.exceedra-checkpoint.json';

    try {
      writeFileSync(checkpointFile, JSON.stringify(this.checkpoints, null, 2), 'utf-8');
      this.logger.debug('Saved checkpoints to file', {
        file: checkpointFile,
        checkpoints: this.checkpoints,
      });
    } catch (error: any) {
      this.logger.error('Failed to save checkpoints', error, {
        file: checkpointFile,
      });
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create an exceedra connector
 */
export function createexceedraConnector(
  config: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    tokenEndpoint: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  },
  options: exceedraConnectorConfig
): exceedraConnector {
  // Create OAuth2 provider
  const auth = new OAuth2Provider({
    tokenEndpoint: config.tokenEndpoint,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    accessToken: config.accessToken,
    refreshToken: config.refreshToken,
    expiresAt: config.expiresAt,
    grantType: 'client_credentials',
    scopes: ['read:documents', 'read:products', 'read:retailers'],
  });

  // Create REST transport
  const transport = new RestTransport({
    baseUrl: config.baseUrl,
    auth,
    defaultHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    retryConfig: {
      maxRetries: options.maxRetries || 3,
      backoffMs: 1000,
      maxBackoffMs: 30000,
    },
    timeoutMs: 60000, // 60 second timeout
  });

  // Create connector config
  const connectorConfig: ConnectorConfig = {
    name: 'exceedra-connector',
    version: '1.0.0',
    source: 'exceedra',
    transport,
    transformer: new exceedraTransformer('documents'), // Default, will be overridden per source
  };

  return new exceedraConnector(connectorConfig, options);
}
