import type { TribbleConfig } from '@tribble/sdk-core';
import { HttpClient } from '@tribble/sdk-core';

// ==================== Type Definitions ====================

/**
 * Supported document types for ingestion
 */
export type DocumentType = 'pdf' | 'html' | 'text' | 'csv' | 'json' | 'spreadsheet' | 'auto';

/**
 * Supported structured data formats
 */
export type StructuredDataFormat = 'csv' | 'json' | 'spreadsheet';

/**
 * Schema definition for structured data validation
 */
export interface DataSchema {
  /** Column/field name */
  name: string;
  /** Data type (string, number, boolean, date, etc.) */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  /** Whether the field is required */
  required?: boolean;
  /** Field description */
  description?: string;
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Metadata for unstructured documents (PDFs, HTML, text)
 */
export interface UnstructuredMetadata {
  /** Document title */
  title?: string;
  /** Author name */
  author?: string;
  /** Document source/origin */
  source?: string;
  /** Document tags */
  tags?: string[];
  /** Document category */
  category?: string;
  /** Custom metadata fields */
  [key: string]: any;
}

/**
 * Metadata for structured data (CSV, JSON, spreadsheets)
 */
export interface StructuredMetadata extends UnstructuredMetadata {
  /** Schema definition for the structured data */
  schema?: DataSchema[];
  /** Primary key field name(s) */
  primaryKey?: string | string[];
  /** Timestamp field name */
  timestampField?: string;
  /** Whether to validate against schema */
  validateSchema?: boolean;
}

/**
 * Metadata for transactional data
 */
export interface TransactionalMetadata extends StructuredMetadata {
  /** Transaction ID or reference */
  transactionId?: string;
  /** Entity type (e.g., 'order', 'user', 'payment') */
  entityType?: string;
  /** Related entity IDs */
  relatedEntities?: Record<string, string | number>;
}

// ==================== Legacy PDF Options (Backward Compatible) ====================

export interface UploadPDFOptions {
  file: Uint8Array | ArrayBuffer | Blob;
  filename: string;
  metadata: Record<string, any>;
  traceId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface UploadBatchItem {
  file: Uint8Array | ArrayBuffer | Blob;
  filename: string;
  metadata: Record<string, any>;
}

export interface UploadBatchOptions {
  items: UploadBatchItem[];
  traceId?: string;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

// ==================== Enhanced Upload Options ====================

/**
 * Options for uploading HTML content
 */
export interface UploadHTMLOptions {
  /** HTML content as string or binary */
  content: string | Uint8Array | ArrayBuffer | Blob;
  /** Optional filename (will default to generated name) */
  filename?: string;
  /** Metadata for the HTML document */
  metadata?: UnstructuredMetadata;
  /** Optional trace ID for request tracking */
  traceId?: string;
  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for uploading structured data (CSV, JSON)
 */
export interface UploadStructuredDataOptions {
  /** Data as string, object, or binary */
  data: string | object | object[] | Uint8Array | ArrayBuffer | Blob;
  /** Data format */
  format: StructuredDataFormat;
  /** Optional filename */
  filename?: string;
  /** Metadata including optional schema */
  metadata?: StructuredMetadata;
  /** Optional trace ID for request tracking */
  traceId?: string;
  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for uploading spreadsheet files (Excel, Google Sheets exports)
 */
export interface UploadSpreadsheetOptions {
  /** Spreadsheet file as binary */
  file: Uint8Array | ArrayBuffer | Blob;
  /** Filename (should include extension like .xlsx, .xls, .ods) */
  filename: string;
  /** Sheet name to process (optional, defaults to first sheet) */
  sheetName?: string;
  /** Metadata including optional schema */
  metadata?: StructuredMetadata;
  /** Optional trace ID for request tracking */
  traceId?: string;
  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for uploading generic documents with auto-detection
 */
export interface UploadDocumentOptions {
  /** Document content as binary */
  file: Uint8Array | ArrayBuffer | Blob;
  /** Filename (used for type detection) */
  filename: string;
  /** Explicit document type (if known, otherwise will auto-detect) */
  documentType?: DocumentType;
  /** Metadata (type will depend on detected document type) */
  metadata?: UnstructuredMetadata | StructuredMetadata;
  /** Optional trace ID for request tracking */
  traceId?: string;
  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Options for uploading transactional data (DB records, API responses)
 */
export interface UploadTransactionalDataOptions {
  /** Transaction data as object or array of objects */
  data: object | object[];
  /** Entity type identifier */
  entityType: string;
  /** Metadata including transaction details */
  metadata?: TransactionalMetadata;
  /** Optional trace ID for request tracking */
  traceId?: string;
  /** Idempotency key to prevent duplicate processing */
  idempotencyKey?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Response from upload operations
 */
export interface UploadResponse {
  /** Whether the upload was successful */
  success?: boolean;
  /** Document IDs created from the upload */
  document_ids?: number[];
  /** Error message if upload failed */
  error?: string;
  /** Validation errors for structured data */
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// ==================== IngestClient Class ====================

/**
 * Client for ingesting various data types into Tribble
 * Supports PDFs, HTML, text documents, CSV, JSON, spreadsheets, and transactional data
 */
export class IngestClient {
  private readonly cfg: NonNullable<TribbleConfig['ingest']>;
  private readonly http: HttpClient;
  private readonly baseUrl: string;

  constructor(cfg: NonNullable<TribbleConfig['ingest']>) {
    this.cfg = cfg;
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.http = new HttpClient();
  }

  // ==================== Legacy Methods (Backward Compatible) ====================

  /**
   * Upload a single PDF document
   * @deprecated Use uploadDocument() with documentType: 'pdf' for new implementations
   * @param opts Upload options including file, filename, and metadata
   * @returns Upload response with document IDs
   */
  async uploadPDF(opts: UploadPDFOptions): Promise<UploadResponse> {
    const res = await this.uploadBatch({
      items: [{
        file: opts.file,
        filename: opts.filename,
        metadata: opts.metadata
      }],
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal
    });
    return res;
  }

  /**
   * Upload multiple PDF documents in a batch
   * @deprecated Use uploadDocument() with multiple calls or enhance for generic batching
   * @param opts Batch upload options with array of items
   * @returns Upload response with document IDs
   */
  async uploadBatch(opts: UploadBatchOptions): Promise<UploadResponse> {
    const token = await this.cfg.tokenProvider();
    const url = `${this.baseUrl}/api/upload`;
    const form = new FormData();

    opts.items.forEach((it, idx) => {
      const blob = toBlob(it.file, 'application/pdf');
      form.append('files', blob, it.filename);
      form.append(`metadata_${idx}`, JSON.stringify(it.metadata ?? {}));
    });

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(this.cfg.defaultHeaders || {}),
    };
    if (opts.traceId) headers['X-Tribble-Request-Id'] = String(opts.traceId);
    if (opts.idempotencyKey) headers['X-Idempotency-Key'] = String(opts.idempotencyKey);

    const { data } = await this.http.request<UploadResponse>(url, {
      method: 'POST',
      body: form as any,
      headers,
      signal: opts.signal,
    });
    return data;
  }

  // ==================== Enhanced Upload Methods ====================

  /**
   * Upload HTML content for processing
   * Converts HTML to text or preserves structure based on backend configuration
   *
   * @example
   * ```typescript
   * const result = await ingestClient.uploadHTML({
   *   content: '<html><body><h1>Title</h1><p>Content</p></body></html>',
   *   filename: 'page.html',
   *   metadata: {
   *     title: 'Web Page',
   *     source: 'https://example.com/page',
   *     tags: ['documentation', 'public']
   *   }
   * });
   * ```
   */
  async uploadHTML(opts: UploadHTMLOptions): Promise<UploadResponse> {
    const filename = opts.filename || `html-${Date.now()}.html`;

    // Convert content to Blob
    let blob: Blob;
    if (typeof opts.content === 'string') {
      blob = new Blob([opts.content], { type: 'text/html' });
    } else {
      blob = toBlob(opts.content, 'text/html');
    }

    return this.uploadWithType({
      file: blob,
      filename,
      documentType: 'html',
      metadata: opts.metadata,
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
  }

  /**
   * Upload structured data (CSV, JSON) with optional schema validation
   *
   * @example
   * ```typescript
   * // Upload CSV
   * const csvResult = await ingestClient.uploadStructuredData({
   *   data: 'name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com',
   *   format: 'csv',
   *   metadata: {
   *     title: 'User Data',
   *     schema: [
   *       { name: 'name', type: 'string', required: true },
   *       { name: 'age', type: 'number', required: true },
   *       { name: 'email', type: 'string', required: true }
   *     ],
   *     primaryKey: 'email',
   *     validateSchema: true
   *   }
   * });
   *
   * // Upload JSON
   * const jsonResult = await ingestClient.uploadStructuredData({
   *   data: [{ id: 1, name: 'Product A', price: 29.99 }],
   *   format: 'json',
   *   metadata: { title: 'Product Catalog' }
   * });
   * ```
   */
  async uploadStructuredData(opts: UploadStructuredDataOptions): Promise<UploadResponse> {
    // Validate schema if provided and validation is enabled
    if (opts.metadata?.schema && opts.metadata?.validateSchema !== false) {
      const validationErrors = this.validateStructuredData(opts.data, opts.metadata.schema, opts.format);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Schema validation failed',
          validationErrors,
        };
      }
    }

    const filename = opts.filename || `${opts.format}-${Date.now()}.${opts.format}`;

    // Convert data to appropriate format
    let blob: Blob;
    let mimeType: string;

    if (opts.format === 'csv') {
      mimeType = 'text/csv';
      if (typeof opts.data === 'string') {
        blob = new Blob([opts.data], { type: mimeType });
      } else if (Array.isArray(opts.data)) {
        // Convert array of objects to CSV
        const csv = this.objectsToCSV(opts.data);
        blob = new Blob([csv], { type: mimeType });
      } else {
        blob = toBlob(opts.data as any, mimeType);
      }
    } else if (opts.format === 'json') {
      mimeType = 'application/json';
      if (typeof opts.data === 'string') {
        blob = new Blob([opts.data], { type: mimeType });
      } else {
        const json = JSON.stringify(opts.data, null, 2);
        blob = new Blob([json], { type: mimeType });
      }
    } else {
      // Spreadsheet format
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      blob = toBlob(opts.data as any, mimeType);
    }

    return this.uploadWithType({
      file: blob,
      filename,
      documentType: opts.format,
      metadata: opts.metadata,
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
  }

  /**
   * Upload spreadsheet files (Excel, LibreOffice, Google Sheets exports)
   *
   * @example
   * ```typescript
   * const result = await ingestClient.uploadSpreadsheet({
   *   file: excelFileBuffer,
   *   filename: 'sales-data.xlsx',
   *   sheetName: 'Q4 Sales',
   *   metadata: {
   *     title: 'Q4 Sales Data',
   *     schema: [
   *       { name: 'date', type: 'date', required: true },
   *       { name: 'revenue', type: 'number', required: true },
   *       { name: 'region', type: 'string', required: true }
   *     ],
   *     timestampField: 'date'
   *   }
   * });
   * ```
   */
  async uploadSpreadsheet(opts: UploadSpreadsheetOptions): Promise<UploadResponse> {
    const mimeType = this.getSpreadsheetMimeType(opts.filename);
    const blob = toBlob(opts.file, mimeType);

    // Add sheet name to metadata if provided
    const metadata = {
      ...opts.metadata,
      sheetName: opts.sheetName,
    };

    return this.uploadWithType({
      file: blob,
      filename: opts.filename,
      documentType: 'spreadsheet',
      metadata,
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
  }

  /**
   * Upload a document with automatic type detection based on filename extension
   * Falls back to explicit documentType if provided
   *
   * @example
   * ```typescript
   * // Auto-detect from filename
   * const result = await ingestClient.uploadDocument({
   *   file: fileBuffer,
   *   filename: 'document.pdf',
   *   metadata: { title: 'Important Document' }
   * });
   *
   * // Explicit type
   * const result2 = await ingestClient.uploadDocument({
   *   file: fileBuffer,
   *   filename: 'document.txt',
   *   documentType: 'text',
   *   metadata: { title: 'Plain Text File' }
   * });
   * ```
   */
  async uploadDocument(opts: UploadDocumentOptions): Promise<UploadResponse> {
    const documentType = opts.documentType || this.detectDocumentType(opts.filename);
    const mimeType = this.getMimeType(documentType, opts.filename);
    const blob = toBlob(opts.file, mimeType);

    return this.uploadWithType({
      file: blob,
      filename: opts.filename,
      documentType,
      metadata: opts.metadata,
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
  }

  /**
   * Upload transactional data (database records, API responses)
   * Optimized for high-frequency updates and temporal queries
   *
   * @example
   * ```typescript
   * const result = await ingestClient.uploadTransactionalData({
   *   data: {
   *     orderId: 'ORD-12345',
   *     customerId: 'CUST-789',
   *     amount: 299.99,
   *     status: 'completed',
   *     timestamp: new Date().toISOString()
   *   },
   *   entityType: 'order',
   *   metadata: {
   *     transactionId: 'TXN-98765',
   *     entityType: 'order',
   *     relatedEntities: {
   *       customer: 'CUST-789',
   *       product: 'PROD-456'
   *     },
   *     schema: [
   *       { name: 'orderId', type: 'string', required: true },
   *       { name: 'amount', type: 'number', required: true },
   *       { name: 'status', type: 'string', required: true }
   *     ],
   *     timestampField: 'timestamp'
   *   }
   * });
   * ```
   */
  async uploadTransactionalData(opts: UploadTransactionalDataOptions): Promise<UploadResponse> {
    // Validate schema if provided
    if (opts.metadata?.schema && opts.metadata?.validateSchema !== false) {
      const validationErrors = this.validateStructuredData(opts.data, opts.metadata.schema, 'json');
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Schema validation failed',
          validationErrors,
        };
      }
    }

    const filename = `${opts.entityType}-${Date.now()}.json`;
    const json = JSON.stringify(opts.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // Enrich metadata with transactional context
    const metadata = {
      ...opts.metadata,
      entityType: opts.entityType,
      isTransactional: true,
    };

    return this.uploadWithType({
      file: blob,
      filename,
      documentType: 'json',
      metadata,
      traceId: opts.traceId,
      idempotencyKey: opts.idempotencyKey,
      signal: opts.signal,
    });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Core upload method that handles the HTTP request with type information
   */
  private async uploadWithType(opts: {
    file: Blob;
    filename: string;
    documentType: DocumentType;
    metadata?: any;
    traceId?: string;
    idempotencyKey?: string;
    signal?: AbortSignal;
  }): Promise<UploadResponse> {
    const token = await this.cfg.tokenProvider();
    const url = `${this.baseUrl}/api/upload`;
    const form = new FormData();

    // Add file
    form.append('files', opts.file, opts.filename);

    // Add metadata with document type
    const enrichedMetadata = {
      ...(opts.metadata || {}),
      documentType: opts.documentType,
      uploadedAt: new Date().toISOString(),
    };
    form.append('metadata_0', JSON.stringify(enrichedMetadata));

    // Build headers
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(this.cfg.defaultHeaders || {}),
    };
    if (opts.traceId) headers['X-Tribble-Request-Id'] = String(opts.traceId);
    if (opts.idempotencyKey) headers['X-Idempotency-Key'] = String(opts.idempotencyKey);

    // Add document type header for backend routing
    headers['X-Document-Type'] = opts.documentType;

    const { data } = await this.http.request<UploadResponse>(url, {
      method: 'POST',
      body: form as any,
      headers,
      signal: opts.signal,
    });
    return data;
  }

  /**
   * Detect document type from filename extension
   */
  private detectDocumentType(filename: string): DocumentType {
    const ext = filename.toLowerCase().split('.').pop();

    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'html':
      case 'htm':
        return 'html';
      case 'txt':
      case 'md':
      case 'markdown':
        return 'text';
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      case 'xlsx':
      case 'xls':
      case 'ods':
        return 'spreadsheet';
      default:
        return 'auto';
    }
  }

  /**
   * Get MIME type for document type and filename
   */
  private getMimeType(documentType: DocumentType, filename: string): string {
    switch (documentType) {
      case 'pdf':
        return 'application/pdf';
      case 'html':
        return 'text/html';
      case 'text':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'spreadsheet':
        return this.getSpreadsheetMimeType(filename);
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get MIME type for spreadsheet files
   */
  private getSpreadsheetMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();

    switch (ext) {
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'ods':
        return 'application/vnd.oasis.opendocument.spreadsheet';
      default:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
  }

  /**
   * Convert array of objects to CSV string
   */
  private objectsToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];

        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }

        // Escape values that contain commas, quotes, or newlines
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      });

      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Validate structured data against schema
   */
  private validateStructuredData(
    data: any,
    schema: DataSchema[],
    format: StructuredDataFormat
  ): Array<{ field: string; message: string; value?: any }> {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    // Parse data if it's a string
    let parsedData: any[];

    try {
      if (typeof data === 'string') {
        if (format === 'csv') {
          // Simple CSV parsing (for validation purposes)
          parsedData = this.parseCSVForValidation(data);
        } else {
          parsedData = JSON.parse(data);
        }
      } else {
        parsedData = Array.isArray(data) ? data : [data];
      }
    } catch (error) {
      errors.push({
        field: '_root',
        message: `Failed to parse ${format} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return errors;
    }

    // Validate each record
    for (let rowIdx = 0; rowIdx < parsedData.length; rowIdx++) {
      const row = parsedData[rowIdx];

      for (const field of schema) {
        const value = row[field.name];

        // Required field validation
        if (field.required && (value === null || value === undefined || value === '')) {
          errors.push({
            field: `${field.name} (row ${rowIdx + 1})`,
            message: `Required field is missing`,
            value,
          });
          continue;
        }

        // Skip further validation if value is not present
        if (value === null || value === undefined || value === '') {
          continue;
        }

        // Type validation
        const typeError = this.validateFieldType(value, field.type);
        if (typeError) {
          errors.push({
            field: `${field.name} (row ${rowIdx + 1})`,
            message: typeError,
            value,
          });
        }

        // Validation rules
        if (field.validation) {
          const validationError = this.validateFieldRules(value, field.validation);
          if (validationError) {
            errors.push({
              field: `${field.name} (row ${rowIdx + 1})`,
              message: validationError,
              value,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Parse CSV string for validation (simple implementation)
   */
  private parseCSVForValidation(csv: string): any[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Validate field type
   */
  private validateFieldType(value: any, type: DataSchema['type']): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `Expected string, got ${typeof value}`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          return `Expected number, got ${typeof value}`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(String(value).toLowerCase())) {
          return `Expected boolean, got ${typeof value}`;
        }
        break;
      case 'date':
        if (isNaN(Date.parse(String(value)))) {
          return `Expected valid date, got ${value}`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `Expected array, got ${typeof value}`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return `Expected object, got ${typeof value}`;
        }
        break;
    }

    return null;
  }

  /**
   * Validate field against validation rules
   */
  private validateFieldRules(value: any, rules: NonNullable<DataSchema['validation']>): string | null {
    // Min/max validation for numbers
    if (rules.min !== undefined) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue < rules.min) {
        return `Value must be at least ${rules.min}`;
      }
    }

    if (rules.max !== undefined) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > rules.max) {
        return `Value must be at most ${rules.max}`;
      }
    }

    // Pattern validation for strings
    if (rules.pattern) {
      const pattern = new RegExp(rules.pattern);
      if (!pattern.test(String(value))) {
        return `Value does not match pattern: ${rules.pattern}`;
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      return `Value must be one of: ${rules.enum.join(', ')}`;
    }

    return null;
  }
}

// ==================== Utility Functions ====================

/**
 * Convert various binary formats to Blob
 */
function toBlob(data: Uint8Array | ArrayBuffer | Blob, type: string): Blob {
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
  const arr = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return new Blob([arr as any], { type });
}

// ==================== Exports ====================

export type { TribbleConfig };
