/**
 * JSON data transformer
 */

import type { DataTransformer, TransformContext, TransformResult } from '../types';
import { TransformationError } from '../types';

export interface JsonTransformerConfig {
  /** JSONPath for extracting specific data (e.g., '$.data.items') */
  dataPath?: string;

  /** Field mappings for renaming */
  fieldMappings?: Record<string, string>;

  /** Fields to exclude */
  excludeFields?: string[];

  /** Whether to flatten nested objects */
  flatten?: boolean;

  /** Flatten separator (default: '.') */
  flattenSeparator?: string;

  /** Filter function for array items */
  filterItem?: (item: any, index: number) => boolean;

  /** Transform function for each item */
  transformItem?: (item: any) => any;

  /** Whether input is an array or single object */
  isArray?: boolean;
}

/**
 * JSON data transformer
 *
 * Transforms JSON data with field mapping, filtering, and flattening support.
 */
export class JsonTransformer implements DataTransformer<string | Buffer | object, any> {
  constructor(private readonly config: JsonTransformerConfig = {}) {}

  async transform(input: string | Buffer | object, context: TransformContext): Promise<TransformResult[]> {
    try {
      // Parse JSON if string/buffer
      let data: any;
      if (typeof input === 'string') {
        data = JSON.parse(input);
      } else if (Buffer.isBuffer(input)) {
        data = JSON.parse(input.toString('utf-8'));
      } else {
        data = input;
      }

      // Extract data from path if specified
      if (this.config.dataPath) {
        data = this.extractByPath(data, this.config.dataPath);
      }

      // Ensure data is an array
      const items = Array.isArray(data) ? data : [data];

      // Filter items if filter function is provided
      let filteredItems = items;
      if (this.config.filterItem) {
        filteredItems = items.filter(this.config.filterItem);
      }

      // Transform each item
      const transformedItems = filteredItems.map((item) => {
        let transformed = item;

        // Apply item transformer
        if (this.config.transformItem) {
          transformed = this.config.transformItem(transformed);
        }

        // Apply field mappings
        if (this.config.fieldMappings) {
          transformed = this.applyFieldMappings(transformed);
        }

        // Exclude fields
        if (this.config.excludeFields) {
          transformed = this.excludeFields(transformed);
        }

        // Flatten if requested
        if (this.config.flatten) {
          transformed = this.flattenObject(transformed, this.config.flattenSeparator);
        }

        return transformed;
      });

      // Create result
      const resultData = {
        source: context.source,
        receivedAt: context.receivedAt.toISOString(),
        totalItems: transformedItems.length,
        data: transformedItems,
      };

      return [
        {
          data: JSON.stringify(resultData, null, 2),
          metadata: {
            ...context.metadata,
            source: context.source,
            format: 'json',
            itemCount: transformedItems.length,
          },
          filename: `${context.source}-${Date.now()}.json`,
          contentType: 'application/json',
        },
      ];
    } catch (error: any) {
      throw new TransformationError(`JSON transformation failed: ${error.message}`, {
        source: context.source,
        error: error.message,
      });
    }
  }

  async validate(input: string | Buffer | object): Promise<boolean> {
    try {
      if (typeof input === 'string') {
        JSON.parse(input);
      } else if (Buffer.isBuffer(input)) {
        JSON.parse(input.toString('utf-8'));
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract data from object using path notation
   */
  private extractByPath(obj: any, path: string): any {
    // Simple JSONPath implementation
    // Supports: $.field, $.field.nested, $.array[0], $.field.array[*]

    if (path === '$') return obj;

    const parts = path.replace(/^\$\.?/, '').split('.');
    let current = obj;

    for (const part of parts) {
      if (current == null) return undefined;

      // Handle array access: field[0] or [*]
      const arrayMatch = part.match(/^(.+)?\[(\d+|\*)\]$/);
      if (arrayMatch) {
        const fieldName = arrayMatch[1];
        const index = arrayMatch[2];

        if (fieldName) {
          current = current[fieldName];
        }

        if (current == null) return undefined;

        if (!Array.isArray(current)) {
          throw new TransformationError(`Expected array at path: ${part}`);
        }

        if (index === '*') {
          return current; // Return whole array
        } else {
          current = current[parseInt(index, 10)];
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Apply field mappings to rename fields
   */
  private applyFieldMappings(obj: any): any {
    if (!this.config.fieldMappings || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = this.config.fieldMappings[key] || key;
      result[newKey] = typeof value === 'object' && value !== null ? this.applyFieldMappings(value) : value;
    }

    return result;
  }

  /**
   * Exclude specified fields from object
   */
  private excludeFields(obj: any): any {
    if (!this.config.excludeFields || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const excludeSet = new Set(this.config.excludeFields);
    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (!excludeSet.has(key)) {
        result[key] = typeof value === 'object' && value !== null ? this.excludeFields(value) : value;
      }
    }

    return result;
  }

  /**
   * Flatten nested object
   */
  private flattenObject(obj: any, separator: string = '.'): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const result: any = {};

    const flatten = (current: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(current)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          result[newKey] = value;
        }
      }
    };

    flatten(obj);
    return result;
  }
}

/**
 * Create a JSON transformer instance
 */
export function createJsonTransformer(config?: JsonTransformerConfig): JsonTransformer {
  return new JsonTransformer(config);
}
