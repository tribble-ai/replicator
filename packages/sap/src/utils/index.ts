/**
 * SAP Integration Utilities
 *
 * Helper functions for SAP integration tasks.
 */

import type {
  SAPUserContext,
  SAPBusinessContext,
  TribbleConnectionConfig,
  ABAPHttpRequest,
  ABAPHttpResponse,
} from '../types';

/**
 * Parse SAP user context from request headers
 */
export function parseSAPUserContext(headers: Record<string, string>): SAPUserContext {
  return {
    userId: headers['sap-user'] || headers['x-sap-user'] || '',
    userName: headers['sap-username'] || '',
    email: headers['sap-email'] || '',
    language: headers['sap-language'] || 'EN',
    client: headers['sap-client'] || '100',
    roles: headers['sap-roles'] ? headers['sap-roles'].split(',') : [],
    authProfile: headers['sap-auth-profile'] ? headers['sap-auth-profile'].split(',') : [],
  };
}

/**
 * Parse SAP business context from request parameters
 */
export function parseSAPBusinessContext(params: Record<string, string>): SAPBusinessContext {
  return {
    companyCode: params.companyCode,
    plant: params.plant,
    salesOrg: params.salesOrg,
    distributionChannel: params.distributionChannel,
    division: params.division,
    profitCenter: params.profitCenter,
    costCenter: params.costCenter,
  };
}

/**
 * Format SAP date (YYYYMMDD) to ISO format
 */
export function formatSAPDate(sapDate: string): string {
  if (!sapDate || sapDate.length !== 8) {
    return '';
  }

  const year = sapDate.substring(0, 4);
  const month = sapDate.substring(4, 6);
  const day = sapDate.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Format ISO date to SAP date (YYYYMMDD)
 */
export function toSAPDate(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Format SAP time (HHMMSS) to ISO format
 */
export function formatSAPTime(sapTime: string): string {
  if (!sapTime || sapTime.length !== 6) {
    return '';
  }

  const hours = sapTime.substring(0, 2);
  const minutes = sapTime.substring(2, 4);
  const seconds = sapTime.substring(4, 6);

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format ISO time to SAP time (HHMMSS)
 */
export function toSAPTime(isoTime: string): string {
  const [hours, minutes, seconds] = isoTime.split(':');
  return `${hours}${minutes}${seconds || '00'}`;
}

/**
 * Convert SAP amount to decimal
 */
export function formatSAPAmount(amount: string, decimals: number = 2): number {
  const divisor = Math.pow(10, decimals);
  return parseFloat(amount) / divisor;
}

/**
 * Convert decimal to SAP amount
 */
export function toSAPAmount(amount: number, decimals: number = 2): string {
  const multiplier = Math.pow(10, decimals);
  return String(Math.round(amount * multiplier));
}

/**
 * Create ABAP HTTP request for Tribble API
 */
export function createTribbleRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: {
    body?: any;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): ABAPHttpRequest {
  const request: ABAPHttpRequest = {
    method,
    path,
    query: options.query,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body) {
    request.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  return request;
}

/**
 * Parse ABAP HTTP response
 */
export function parseABAPResponse<T = any>(response: ABAPHttpResponse): T {
  if (!response.success) {
    throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
  }

  try {
    return JSON.parse(response.body);
  } catch (error) {
    return response.body as any;
  }
}

/**
 * Validate SAP system configuration
 */
export function validateSAPConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.systemId) {
    errors.push('System ID is required');
  }

  if (!config.client) {
    errors.push('Client is required');
  }

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  }

  if (config.target && !['on-premise', 'btp', 'hybrid'].includes(config.target)) {
    errors.push('Invalid target. Must be on-premise, btp, or hybrid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Tribble connection configuration
 */
export function validateTribbleConfig(config: TribbleConnectionConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API URL is required');
  }

  if (!config.apiKey && !config.oauth) {
    errors.push('Either API key or OAuth configuration is required');
  }

  if (config.oauth) {
    if (!config.oauth.tokenEndpoint) {
      errors.push('OAuth token endpoint is required');
    }
    if (!config.oauth.clientId) {
      errors.push('OAuth client ID is required');
    }
    if (!config.oauth.clientSecret) {
      errors.push('OAuth client secret is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate GUID for SAP (32 characters, uppercase hex)
 */
export function generateSAPGUID(): string {
  const hex = '0123456789ABCDEF';
  let guid = '';

  for (let i = 0; i < 32; i++) {
    guid += hex.charAt(Math.floor(Math.random() * 16));
  }

  return guid;
}

/**
 * Escape special characters for ABAP strings
 */
export function escapeABAPString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Create OData filter string
 */
export function createODataFilter(filters: Record<string, any>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      parts.push(`${key} eq '${value}'`);
    } else if (typeof value === 'number') {
      parts.push(`${key} eq ${value}`);
    } else if (typeof value === 'boolean') {
      parts.push(`${key} eq ${value}`);
    } else if (Array.isArray(value)) {
      const orParts = value.map((v) => `${key} eq '${v}'`).join(' or ');
      parts.push(`(${orParts})`);
    }
  }

  return parts.join(' and ');
}

/**
 * Create OData orderby string
 */
export function createODataOrderBy(orderBy: Record<string, 'asc' | 'desc'>): string {
  return Object.entries(orderBy)
    .map(([key, direction]) => `${key} ${direction}`)
    .join(',');
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Convert SAP internal table to JSON
 */
export function sapTableToJSON<T = any>(table: string): T[] {
  // Parse SAP internal table format (simplified)
  const lines = table.split('\n').filter((line) => line.trim());
  const result: T[] = [];

  for (const line of lines) {
    try {
      result.push(JSON.parse(line));
    } catch {
      // Skip invalid lines
    }
  }

  return result;
}

/**
 * Convert JSON to SAP internal table format
 */
export function jsonToSAPTable(data: any[]): string {
  return data.map((item) => JSON.stringify(item)).join('\n');
}

/**
 * Generate SAP transaction code format
 */
export function formatTransactionCode(tcode: string): string {
  return tcode.toUpperCase().replace(/[^A-Z0-9_]/g, '');
}

/**
 * Check if SAP system is available
 */
export async function checkSAPAvailability(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/sap/public/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get SAP system info
 */
export async function getSAPSystemInfo(baseUrl: string): Promise<{
  systemId: string;
  release: string;
  version: string;
}> {
  const response = await fetch(`${baseUrl}/sap/public/info`);
  return response.json();
}

/**
 * Export all utilities
 */
export * from '../types';
