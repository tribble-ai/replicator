/**
 * CSV data transformer
 */

import type { DataTransformer, TransformContext, TransformResult } from '../types';
import { TransformationError } from '../types';

export interface CsvTransformerConfig {
  /** CSV delimiter (default: ',') */
  delimiter?: string;

  /** Quote character (default: '"') */
  quote?: string;

  /** Escape character (default: '"') */
  escape?: string;

  /** Whether first row is header */
  hasHeader?: boolean;

  /** Explicit column names if no header */
  columns?: string[];

  /** Skip empty rows */
  skipEmptyRows?: boolean;

  /** Trim whitespace from values */
  trim?: boolean;

  /** Column mappings for renaming */
  columnMappings?: Record<string, string>;

  /** Columns to exclude */
  excludeColumns?: string[];

  /** Row filter function */
  filterRow?: (row: Record<string, any>, index: number) => boolean;

  /** Value transformation functions per column */
  transformers?: Record<string, (value: string) => any>;
}

/**
 * CSV to JSON transformer
 *
 * Converts CSV data to JSON format suitable for upload to Tribble.
 */
export class CsvTransformer implements DataTransformer<string | Buffer, any> {
  constructor(private readonly config: CsvTransformerConfig = {}) {}

  async transform(input: string | Buffer, context: TransformContext): Promise<TransformResult[]> {
    try {
      const csvText = typeof input === 'string' ? input : input.toString('utf-8');
      const rows = this.parseCSV(csvText);

      if (rows.length === 0) {
        return [];
      }

      // Filter rows if filter function is provided
      let filteredRows = rows;
      if (this.config.filterRow) {
        filteredRows = rows.filter(this.config.filterRow);
      }

      // Create a single JSON document with all rows
      const jsonData = {
        source: context.source,
        receivedAt: context.receivedAt.toISOString(),
        totalRows: filteredRows.length,
        data: filteredRows,
      };

      return [
        {
          data: JSON.stringify(jsonData, null, 2),
          metadata: {
            ...context.metadata,
            source: context.source,
            format: 'csv',
            rowCount: filteredRows.length,
            columns: Object.keys(filteredRows[0] || {}),
          },
          filename: `${context.source}-${Date.now()}.json`,
          contentType: 'application/json',
        },
      ];
    } catch (error: any) {
      throw new TransformationError(`CSV transformation failed: ${error.message}`, {
        source: context.source,
        error: error.message,
      });
    }
  }

  async validate(input: string | Buffer): Promise<boolean> {
    try {
      const csvText = typeof input === 'string' ? input : input.toString('utf-8');
      const rows = this.parseCSV(csvText);
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Parse CSV string into array of objects
   */
  private parseCSV(csvText: string): Record<string, any>[] {
    const delimiter = this.config.delimiter || ',';
    const quote = this.config.quote || '"';
    const escape = this.config.escape || '"';
    const hasHeader = this.config.hasHeader !== false;
    const skipEmptyRows = this.config.skipEmptyRows !== false;
    const trim = this.config.trim !== false;

    const lines = csvText.split(/\r?\n/);
    const rows: Record<string, any>[] = [];

    // Determine column names
    let columns: string[];
    let startIndex = 0;

    if (hasHeader && lines.length > 0) {
      const headerLine = lines[0];
      columns = this.parseLine(headerLine, delimiter, quote, escape);
      if (trim) {
        columns = columns.map((col) => col.trim());
      }
      startIndex = 1;
    } else if (this.config.columns) {
      columns = this.config.columns;
      startIndex = 0;
    } else {
      throw new TransformationError('CSV must have header or explicit column names');
    }

    // Apply column mappings
    if (this.config.columnMappings) {
      columns = columns.map((col) => this.config.columnMappings![col] || col);
    }

    // Filter excluded columns
    const excludeSet = new Set(this.config.excludeColumns || []);
    const activeColumns = columns.filter((col) => !excludeSet.has(col));
    const columnIndices = columns.map((col, idx) => (excludeSet.has(col) ? -1 : idx)).filter((idx) => idx !== -1);

    // Parse data rows
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (skipEmptyRows && !line.trim()) {
        continue;
      }

      const values = this.parseLine(line, delimiter, quote, escape);

      // Skip if not enough values
      if (values.length === 0) {
        continue;
      }

      const row: Record<string, any> = {};

      for (let j = 0; j < activeColumns.length; j++) {
        const columnName = activeColumns[j];
        let value = values[j] || '';

        if (trim) {
          value = value.trim();
        }

        // Apply column transformer if available
        if (this.config.transformers && this.config.transformers[columnName]) {
          value = this.config.transformers[columnName](value);
        } else {
          // Auto-convert numbers and booleans
          value = this.autoConvert(value);
        }

        row[columnName] = value;
      }

      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseLine(line: string, delimiter: string, quote: string, escape: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === quote) {
        if (inQuotes && nextChar === quote) {
          // Escaped quote
          current += quote;
          i += 2;
          continue;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
        i++;
        continue;
      }

      current += char;
      i++;
    }

    // Add last value
    values.push(current);

    return values;
  }

  /**
   * Auto-convert string values to appropriate types
   */
  private autoConvert(value: string): any {
    if (value === '') {
      return null;
    }

    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^-?\d*\.?\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Date (ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return value;
  }
}

/**
 * Create a CSV transformer instance
 */
export function createCsvTransformer(config?: CsvTransformerConfig): CsvTransformer {
  return new CsvTransformer(config);
}
