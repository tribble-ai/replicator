/**
 * Generic REST API connector
 *
 * This is a flexible connector for REST APIs with pagination support.
 * Can be used as-is or extended for specific API integrations.
 */

import type { SyncParams, SyncResult, ConnectorConfig } from '../types';
import { BaseConnector } from './base';
import { RestTransport, type PaginationConfig } from '../transport/rest';
import { IntegrationError } from '../types';

export interface RestApiConnectorConfig {
  /** API endpoint path for data retrieval */
  endpoint: string;

  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST';

  /** Query parameters for the request */
  queryParams?: Record<string, string | number | boolean>;

  /** Request body (for POST requests) */
  requestBody?: any;

  /** Path to extract data from response (e.g., 'data.items') */
  dataPath?: string;

  /** Path to extract updated timestamp from items */
  timestampPath?: string;

  /** Pagination configuration */
  pagination?: PaginationConfig;

  /** Batch size for processing */
  batchSize?: number;

  /** Whether to use incremental sync */
  incremental?: boolean;

  /** Query parameter name for 'since' date */
  sinceParam?: string;

  /** Query parameter name for 'until' date */
  untilParam?: string;
}

/**
 * Generic REST API connector
 *
 * @example
 * ```typescript
 * const connector = new RestApiConnector(
 *   {
 *     name: 'exceedra-api',
 *     version: '1.0.0',
 *     source: 'exceedra',
 *     transport: new RestTransport({
 *       baseUrl: 'https://api.exceedra.com',
 *       auth: new OAuth2Provider({ ... }),
 *     }),
 *     transformer: new JsonTransformer({ ... }),
 *     schedule: '0 * * * *', // hourly
 *   },
 *   {
 *     endpoint: '/v1/documents',
 *     dataPath: 'data',
 *     timestampPath: 'updated_at',
 *     pagination: {
 *       style: 'cursor',
 *       cursorPath: 'meta.next_cursor',
 *       itemsPath: 'data',
 *       limitParam: 'limit',
 *       defaultLimit: 100,
 *     },
 *     incremental: true,
 *     sinceParam: 'updated_since',
 *   }
 * );
 * ```
 */
export class RestApiConnector extends BaseConnector {
  private readonly restConfig: RestApiConnectorConfig;
  private readonly transport: RestTransport;

  constructor(config: ConnectorConfig, restConfig: RestApiConnectorConfig) {
    super(config);

    if (!(config.transport instanceof RestTransport)) {
      throw new IntegrationError('RestApiConnector requires RestTransport', 'INVALID_CONFIG', false);
    }

    this.transport = config.transport;
    this.restConfig = restConfig;
  }

  async pull(params: SyncParams): Promise<SyncResult> {
    this.logger.info('Starting data pull', {
      since: params.since,
      until: params.until,
      fullSync: params.fullSync,
    });

    let documentsProcessed = 0;
    let documentsUploaded = 0;
    let errors = 0;
    const errorDetails: Array<{ message: string; context?: any }> = [];
    let latestTimestamp: Date | undefined;

    try {
      // Build query parameters
      const queryParams = { ...this.restConfig.queryParams };

      // Add date filters for incremental sync
      if (this.restConfig.incremental && !params.fullSync) {
        const since = this.parseCheckpoint(params.since);
        queryParams[this.restConfig.sinceParam || 'updated_since'] = since.toISOString();

        if (params.until) {
          const until = typeof params.until === 'string' ? new Date(params.until) : params.until;
          queryParams[this.restConfig.untilParam || 'updated_until'] = until.toISOString();
        }
      }

      // Fetch data with pagination if configured
      if (this.restConfig.pagination) {
        await this.pullPaginated(queryParams, (items, batchErrors) => {
          documentsProcessed += items.length;
          documentsUploaded += items.length - batchErrors.length;
          errors += batchErrors.length;
          errorDetails.push(...batchErrors);

          // Track latest timestamp
          const timestamps = this.extractTimestamps(items);
          if (timestamps.length > 0) {
            const maxTimestamp = new Date(Math.max(...timestamps.map((t) => t.getTime())));
            if (!latestTimestamp || maxTimestamp > latestTimestamp) {
              latestTimestamp = maxTimestamp;
            }
          }
        });
      } else {
        // Single request without pagination
        const items = await this.pullSingle(queryParams);
        documentsProcessed = items.length;

        const { uploaded, errors: uploadErrors } = await this.transformAndUpload(items);
        documentsUploaded = uploaded;
        errors = uploadErrors;

        // Track latest timestamp
        const timestamps = this.extractTimestamps(items);
        if (timestamps.length > 0) {
          latestTimestamp = new Date(Math.max(...timestamps.map((t) => t.getTime())));
        }
      }

      this.logger.info('Data pull completed', {
        documentsProcessed,
        documentsUploaded,
        errors,
      });

      return {
        documentsProcessed,
        documentsUploaded,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        checkpoint: latestTimestamp || params.since,
      };
    } catch (error: any) {
      this.logger.error('Data pull failed', error);

      return {
        documentsProcessed,
        documentsUploaded,
        errors: errors + 1,
        errorDetails: [
          ...errorDetails,
          {
            message: error.message,
            context: { error: error.stack },
          },
        ],
      };
    }
  }

  async validate(): Promise<boolean> {
    try {
      // Test API connectivity
      await this.transport.request(this.restConfig.endpoint, {
        method: 'GET',
        query: { limit: 1 },
      });
      return true;
    } catch (error) {
      this.logger.error('Validation failed', error as Error);
      return false;
    }
  }

  // ==================== Private Methods ====================

  private async pullSingle(queryParams: Record<string, any>): Promise<any[]> {
    const response = await this.transport.request<any>(this.restConfig.endpoint, {
      method: this.restConfig.method || 'GET',
      query: queryParams,
      body: this.restConfig.requestBody,
    });

    return this.extractData(response);
  }

  private async pullPaginated(
    queryParams: Record<string, any>,
    onBatch: (items: any[], errors: Array<{ message: string; context?: any }>) => void
  ): Promise<void> {
    const batchSize = this.restConfig.batchSize || this.restConfig.pagination!.defaultLimit || 100;

    for await (const items of this.transport.paginate(this.restConfig.endpoint, this.restConfig.pagination!, {
      method: this.restConfig.method || 'GET',
      query: queryParams,
      body: this.restConfig.requestBody,
    })) {
      // Process batch
      const { uploaded, errors: uploadErrors } = await this.transformAndUpload(items);

      const batchErrors: Array<{ message: string; context?: any }> = [];
      if (uploadErrors > 0) {
        batchErrors.push({
          message: `${uploadErrors} upload errors in batch`,
          context: { batchSize: items.length },
        });
      }

      onBatch(items, batchErrors);
    }
  }

  private async transformAndUpload(items: any[]): Promise<{ uploaded: number; errors: number }> {
    if (!this.context) {
      throw new IntegrationError('Connector not initialized', 'NOT_INITIALIZED', false);
    }

    // Transform data
    const transformResults = await this.config.transformer.transform(items, {
      source: this.config.source,
      format: 'json',
      metadata: {},
      receivedAt: new Date(),
      traceId: undefined,
    });

    // Upload to Tribble
    return this.uploadToTribble(transformResults);
  }

  private extractData(response: any): any[] {
    if (!this.restConfig.dataPath) {
      return Array.isArray(response) ? response : [response];
    }

    const data = this.extractByPath(response, this.restConfig.dataPath);
    return Array.isArray(data) ? data : [data];
  }

  private extractTimestamps(items: any[]): Date[] {
    if (!this.restConfig.timestampPath) {
      return [];
    }

    const timestamps: Date[] = [];

    for (const item of items) {
      const timestamp = this.extractByPath(item, this.restConfig.timestampPath);
      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          timestamps.push(date);
        }
      }
    }

    return timestamps;
  }

  private extractByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }
}

/**
 * Create a REST API connector instance
 */
export function createRestApiConnector(
  config: ConnectorConfig,
  restConfig: RestApiConnectorConfig
): RestApiConnector {
  return new RestApiConnector(config, restConfig);
}
