/**
 * Base connector implementation
 */

import type {
  IntegrationConnector,
  IntegrationContext,
  ConnectorConfig,
  SyncParams,
  SyncResult,
  Transport,
  DataTransformer,
  Logger,
} from '../types';
import { IntegrationError } from '../types';

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly prefix: string = '[Connector]') {}

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`${this.prefix} ${message}`, meta || '');
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(`${this.prefix} ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`${this.prefix} ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    console.error(`${this.prefix} ${message}`, error, meta || '');
  }
}

/**
 * Base connector class with common functionality
 *
 * Custom connectors should extend this class and implement the abstract methods.
 */
export abstract class BaseConnector implements IntegrationConnector {
  protected context?: IntegrationContext;
  protected logger: Logger;

  constructor(public readonly config: ConnectorConfig) {
    this.logger = new ConsoleLogger(`[${config.name}]`);
  }

  async initialize(context: IntegrationContext): Promise<void> {
    this.context = context;
    this.logger = context.logger || this.logger;

    this.logger.info('Initializing connector', {
      name: this.config.name,
      version: this.config.version,
      source: this.config.source,
    });

    // Connect transport
    await this.config.transport.connect();

    // Validate configuration if implemented
    if (this.validate) {
      const valid = await this.validate();
      if (!valid) {
        throw new IntegrationError('Connector validation failed', 'VALIDATION_ERROR', false);
      }
    }

    this.logger.info('Connector initialized successfully');
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting connector');
    await this.config.transport.disconnect();
    this.logger.info('Connector disconnected');
  }

  /**
   * Pull data from source system
   * Must be implemented by subclasses
   */
  abstract pull(params: SyncParams): Promise<SyncResult>;

  /**
   * Validate connector configuration (optional)
   */
  validate?(): Promise<boolean>;

  /**
   * Handle webhook events (optional)
   */
  handleWebhook?(payload: any, headers: Record<string, string>): Promise<void>;

  /**
   * Helper method to upload transformed data to Tribble
   */
  protected async uploadToTribble(
    transformedData: Array<{
      data: any;
      metadata: Record<string, any>;
      filename?: string;
      contentType?: string;
    }>
  ): Promise<{ uploaded: number; errors: number }> {
    if (!this.context) {
      throw new IntegrationError('Connector not initialized', 'NOT_INITIALIZED', false);
    }

    let uploaded = 0;
    let errors = 0;

    for (const item of transformedData) {
      try {
        // Convert data to appropriate format for upload
        let fileData: Blob | Uint8Array;
        const contentType = item.contentType || 'application/json';

        if (typeof item.data === 'string') {
          fileData = new Blob([item.data], { type: contentType });
        } else if (item.data instanceof Uint8Array) {
          fileData = item.data;
        } else if (typeof item.data === 'object') {
          const jsonData = JSON.stringify(item.data, null, 2);
          fileData = new Blob([jsonData], { type: 'application/json' });
        } else {
          this.logger.warn('Unsupported data type for upload', { type: typeof item.data });
          errors++;
          continue;
        }

        const filename = item.filename || `${this.config.source}-${Date.now()}.json`;

        // Upload to Tribble
        const result = await this.context.tribble.ingest.uploadDocument({
          file: fileData as any,
          filename,
          metadata: {
            ...item.metadata,
            connector: this.config.name,
            connectorVersion: this.config.version,
            source: this.config.source,
          },
        });

        if (result.success) {
          uploaded++;
          this.logger.debug('Document uploaded successfully', {
            filename,
            documentIds: result.document_ids,
          });
        } else {
          errors++;
          this.logger.error('Document upload failed', undefined, {
            filename,
            error: result.error,
          });
        }
      } catch (error: any) {
        errors++;
        this.logger.error('Upload error', error, {
          filename: item.filename,
        });
      }
    }

    return { uploaded, errors };
  }

  /**
   * Helper method to create checkpoint for incremental sync
   */
  protected createCheckpoint(timestamp: Date | string): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toISOString();
  }

  /**
   * Helper method to parse checkpoint
   */
  protected parseCheckpoint(checkpoint: string | Date | undefined, defaultDate?: Date): Date {
    if (!checkpoint) {
      return defaultDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: 24 hours ago
    }

    return typeof checkpoint === 'string' ? new Date(checkpoint) : checkpoint;
  }
}
