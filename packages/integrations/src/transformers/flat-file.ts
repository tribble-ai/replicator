/**
 * Fixed-width flat file transformer
 */

import type { DataTransformer, TransformContext, TransformResult } from '../types';
import { TransformationError } from '../types';

export interface FlatFileFieldSpec {
  /** Field name */
  name: string;

  /** Start position (1-based) */
  start: number;

  /** Field length */
  length: number;

  /** Field type */
  type?: 'string' | 'number' | 'date' | 'boolean';

  /** Trim whitespace */
  trim?: boolean;

  /** Date format (for date fields) */
  dateFormat?: string;

  /** Transform function */
  transform?: (value: string) => any;
}

export interface FlatFileTransformerConfig {
  /** Field specifications */
  fields: FlatFileFieldSpec[];

  /** Record delimiter (default: '\n') */
  recordDelimiter?: string;

  /** Skip header rows */
  skipRows?: number;

  /** Skip footer rows */
  skipFooter?: number;

  /** Filter function for records */
  filterRecord?: (record: Record<string, any>, index: number) => boolean;

  /** Character encoding */
  encoding?: BufferEncoding;
}

/**
 * Fixed-width flat file transformer
 *
 * Converts fixed-width flat files (common in legacy systems) to JSON.
 */
export class FlatFileTransformer implements DataTransformer<string | Buffer, any> {
  constructor(private readonly config: FlatFileTransformerConfig) {
    this.validateConfig();
  }

  async transform(input: string | Buffer, context: TransformContext): Promise<TransformResult[]> {
    try {
      const encoding = this.config.encoding || 'utf-8';
      const text = typeof input === 'string' ? input : input.toString(encoding);
      const records = this.parseFile(text);

      if (records.length === 0) {
        return [];
      }

      // Filter records if filter function is provided
      let filteredRecords = records;
      if (this.config.filterRecord) {
        filteredRecords = records.filter(this.config.filterRecord);
      }

      // Create result
      const resultData = {
        source: context.source,
        receivedAt: context.receivedAt.toISOString(),
        totalRecords: filteredRecords.length,
        data: filteredRecords,
      };

      return [
        {
          data: JSON.stringify(resultData, null, 2),
          metadata: {
            ...context.metadata,
            source: context.source,
            format: 'flat-file',
            recordCount: filteredRecords.length,
            fields: this.config.fields.map((f) => f.name),
          },
          filename: `${context.source}-${Date.now()}.json`,
          contentType: 'application/json',
        },
      ];
    } catch (error: any) {
      throw new TransformationError(`Flat file transformation failed: ${error.message}`, {
        source: context.source,
        error: error.message,
      });
    }
  }

  async validate(input: string | Buffer): Promise<boolean> {
    try {
      const encoding = this.config.encoding || 'utf-8';
      const text = typeof input === 'string' ? input : input.toString(encoding);
      const records = this.parseFile(text);
      return records.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Parse flat file into records
   */
  private parseFile(text: string): Record<string, any>[] {
    const recordDelimiter = this.config.recordDelimiter || '\n';
    const lines = text.split(recordDelimiter);
    const records: Record<string, any>[] = [];

    const skipRows = this.config.skipRows || 0;
    const skipFooter = this.config.skipFooter || 0;
    const endIndex = skipFooter > 0 ? lines.length - skipFooter : lines.length;

    for (let i = skipRows; i < endIndex; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      const record = this.parseLine(line);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Parse a single line using field specifications
   */
  private parseLine(line: string): Record<string, any> | null {
    const record: Record<string, any> = {};

    for (const field of this.config.fields) {
      // Extract field value (positions are 1-based in config)
      const start = field.start - 1;
      const end = start + field.length;
      let value = line.substring(start, end);

      // Trim if requested
      if (field.trim !== false) {
        value = value.trim();
      }

      // Apply custom transform
      if (field.transform) {
        record[field.name] = field.transform(value);
        continue;
      }

      // Auto-convert based on type
      switch (field.type) {
        case 'number':
          record[field.name] = value ? parseFloat(value) : null;
          break;
        case 'boolean':
          record[field.name] = this.parseBoolean(value);
          break;
        case 'date':
          record[field.name] = this.parseDate(value, field.dateFormat);
          break;
        case 'string':
        default:
          record[field.name] = value || null;
          break;
      }
    }

    return record;
  }

  /**
   * Parse boolean value
   */
  private parseBoolean(value: string): boolean | null {
    const normalized = value.toLowerCase().trim();

    if (['true', 'yes', 'y', '1', 't'].includes(normalized)) {
      return true;
    }

    if (['false', 'no', 'n', '0', 'f'].includes(normalized)) {
      return false;
    }

    return null;
  }

  /**
   * Parse date value
   */
  private parseDate(value: string, format?: string): string | null {
    if (!value.trim()) {
      return null;
    }

    // Simple date parsing - in production, use a library like date-fns
    // This supports common formats like YYYYMMDD, YYYY-MM-DD, etc.

    if (format) {
      // Custom format parsing would go here
      // For now, just try to parse as-is
    }

    // Try ISO format first
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try YYYYMMDD format
    if (/^\d{8}$/.test(value)) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      const isoDate = new Date(`${year}-${month}-${day}`);
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toISOString();
      }
    }

    // Try DDMMYYYY format
    if (/^\d{8}$/.test(value)) {
      const day = value.substring(0, 2);
      const month = value.substring(2, 4);
      const year = value.substring(4, 8);
      const isoDate = new Date(`${year}-${month}-${day}`);
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toISOString();
      }
    }

    return null;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.fields || this.config.fields.length === 0) {
      throw new TransformationError('Flat file transformer requires field specifications');
    }

    // Validate field positions
    for (const field of this.config.fields) {
      if (field.start < 1) {
        throw new TransformationError(`Invalid start position for field ${field.name}: ${field.start}`);
      }
      if (field.length < 1) {
        throw new TransformationError(`Invalid length for field ${field.name}: ${field.length}`);
      }
    }
  }
}

/**
 * Create a flat file transformer instance
 */
export function createFlatFileTransformer(config: FlatFileTransformerConfig): FlatFileTransformer {
  return new FlatFileTransformer(config);
}
