import type { ExtensionManifest, BuiltExtension } from '@tribble/sdk-extensions';

// ==================== Control Plane Types ====================

/**
 * Control plane client configuration.
 */
export interface ControlPlaneConfig {
  /** Platform API URL (e.g., https://app.tribble.ai/api) */
  apiUrl: string;
  /** Bearer token for authentication (from Auth0) */
  token: string;
  /** Client schema identifier */
  schema?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Retry configuration */
  retry?: RetryConfig;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Extension registration result from platform.
 */
export interface ExtensionRegistration {
  /** Extension ID (database primary key) */
  id: number;
  /** Extension name */
  name: string;
  /** Extension version */
  version: string;
  /** Registration status */
  status: 'active' | 'disabled' | 'deprecated';
  /** Platform version requirement */
  platformVersion: string;
  /** Handler URL for tool invocation */
  handlerUrl?: string;
  /** Handler type (http, lambda, azure_function) */
  handlerType?: string;
  /** Registration timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Registered by user ID */
  createdBy: number;
}

/**
 * Extension tool from platform.
 */
export interface ExtensionToolInfo {
  id: number;
  extensionId: number;
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
  rateLimitPerMinute: number;
  timeoutMs: number;
  handlerFunction?: string;
}

/**
 * Platform capabilities response.
 */
export interface PlatformCapabilities {
  platformVersion: string;
  capabilities: string[];
  supportedHandlerTypes: string[];
  supportedModels: string[];
}

/**
 * Manifest validation result.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * API response wrapper.
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== Control Plane Client ====================

/**
 * ControlPlaneClient - Connect to Tribble platform for extension management.
 *
 * @example
 * ```typescript
 * const client = new ControlPlaneClient({
 *   apiUrl: 'https://app.tribble.ai/api',
 *   token: await getAccessToken(),
 * });
 *
 * // Validate manifest first
 * const validation = await client.validateManifest(manifest);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 *   return;
 * }
 *
 * // Register extension
 * const reg = await client.registerExtension(manifest);
 * console.log(`Registered: ${reg.name}@${reg.version} (ID: ${reg.id})`);
 *
 * // Get platform capabilities
 * const caps = await client.getCapabilities();
 * console.log(`Platform version: ${caps.platformVersion}`);
 * ```
 */
export class ControlPlaneClient {
  private config: ControlPlaneConfig;
  private defaultRetry: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  };

  constructor(config: ControlPlaneConfig) {
    this.config = {
      ...config,
      retry: config.retry || this.defaultRetry,
    };
  }

  // ==================== Platform Discovery ====================

  /** Get platform capabilities and version info */
  async getCapabilities(): Promise<PlatformCapabilities> {
    const response = await this.request<ApiResponse<PlatformCapabilities>>('/extensions/capabilities');
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Failed to get capabilities', 500);
    }
    return response.data;
  }

  /** Validate a manifest without registering */
  async validateManifest(manifest: ExtensionManifest): Promise<ValidationResult> {
    const response = await this.request<ApiResponse<ValidationResult>>('/extensions/validate', {
      method: 'POST',
      body: JSON.stringify(manifest),
    });
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Failed to validate manifest', 500);
    }
    return response.data;
  }

  // ==================== Extension Registration ====================

  /** Register a new extension from manifest */
  async registerExtension(manifest: ExtensionManifest): Promise<ExtensionRegistration> {
    const response = await this.request<ApiResponse<ExtensionRegistration>>('/extensions/register', {
      method: 'POST',
      body: JSON.stringify(manifest),
    });
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Failed to register extension', 500);
    }
    return this.parseExtensionDates(response.data);
  }

  /** Register a built extension (manifest + handlers) */
  async registerBuiltExtension(extension: BuiltExtension): Promise<ExtensionRegistration> {
    return this.registerExtension(extension.manifest);
  }

  /** Get extension by ID */
  async getExtension(extensionId: number): Promise<ExtensionRegistration & { tools: ExtensionToolInfo[] }> {
    const response = await this.request<ApiResponse<ExtensionRegistration & { tools: ExtensionToolInfo[] }>>(
      `/extensions/${extensionId}`
    );
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Extension not found', 404);
    }
    return {
      ...this.parseExtensionDates(response.data),
      tools: response.data.tools,
    };
  }

  /** List all registered extensions */
  async listExtensions(options?: { status?: 'active' | 'disabled' | 'deprecated' }): Promise<ExtensionRegistration[]> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);

    const queryString = params.toString();
    const path = queryString ? `/extensions?${queryString}` : '/extensions';

    const response = await this.request<ApiResponse<ExtensionRegistration[]>>(path);
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Failed to list extensions', 500);
    }
    return response.data.map(ext => this.parseExtensionDates(ext));
  }

  /** Update extension status */
  async updateExtensionStatus(
    extensionId: number,
    status: 'active' | 'disabled' | 'deprecated'
  ): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`/extensions/${extensionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.success) {
      throw new ControlPlaneError(response.error || 'Failed to update status', 500);
    }
  }

  /** Delete an extension */
  async deleteExtension(extensionId: number): Promise<void> {
    const response = await this.request<ApiResponse<void>>(`/extensions/${extensionId}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new ControlPlaneError(response.error || 'Failed to delete extension', 500);
    }
  }

  // ==================== Extension Tools ====================

  /** List all active extension tools */
  async listExtensionTools(): Promise<ExtensionToolInfo[]> {
    const response = await this.request<ApiResponse<ExtensionToolInfo[]>>('/extensions/tools');
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Failed to list tools', 500);
    }
    return response.data;
  }

  /** Get a specific tool by name */
  async getExtensionTool(toolName: string): Promise<ExtensionToolInfo & { extension: ExtensionRegistration }> {
    const response = await this.request<ApiResponse<ExtensionToolInfo & { extension: ExtensionRegistration }>>(
      `/extensions/tools/${encodeURIComponent(toolName)}`
    );
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Tool not found', 404);
    }
    return response.data;
  }

  /** Invoke a tool directly (for testing) */
  async invokeTool(
    toolName: string,
    args: Record<string, unknown>,
    conversationId?: string
  ): Promise<ToolInvocationResult> {
    const response = await this.request<ApiResponse<ToolInvocationResult>>(
      `/extensions/tools/${encodeURIComponent(toolName)}/invoke`,
      {
        method: 'POST',
        body: JSON.stringify({ args, conversationId }),
      }
    );
    if (!response.success || !response.data) {
      throw new ControlPlaneError(response.error || 'Tool invocation failed', 500);
    }
    return response.data;
  }

  // ==================== Internal Methods ====================

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.token}`,
    };
    return headers;
  }

  private parseExtensionDates(ext: ExtensionRegistration): ExtensionRegistration {
    return {
      ...ext,
      createdAt: ext.createdAt ? new Date(ext.createdAt) : new Date(),
      updatedAt: ext.updatedAt ? new Date(ext.updatedAt) : new Date(),
    };
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const timeout = this.config.timeoutMs || 30000;
    const retry = this.config.retry || this.defaultRetry;

    let lastError: Error | null = null;
    let delay = retry.initialDelayMs;

    for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...(options?.headers as Record<string, string>),
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = response.statusText;
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorBody || errorMessage;
          }
          throw new ControlPlaneError(errorMessage, response.status);
        }

        if (response.status === 204) {
          return { success: true } as T;
        }

        return await response.json();
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));

        if (e instanceof ControlPlaneError && e.status >= 400 && e.status < 500) {
          // Don't retry client errors
          throw e;
        }

        if (attempt < retry.maxRetries) {
          await this.sleep(delay);
          delay = Math.min(delay * retry.backoffMultiplier, retry.maxDelayMs);
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Types ====================

export interface ToolInvocationResult {
  content: string;
  citations?: Array<{
    title: string;
    url?: string;
    snippet: string;
  }>;
  data?: Record<string, unknown>;
  stopRecursion?: boolean;
}

export class ControlPlaneError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ControlPlaneError';
    this.status = status;
  }
}

// ==================== Convenience Functions ====================

/**
 * Create a control plane client from environment variables.
 *
 * Required env vars:
 * - TRIBBLE_API_URL: Platform API URL (defaults to https://app.tribble.ai/api)
 * - TRIBBLE_API_TOKEN: Bearer token for authentication
 */
export function createControlPlaneClient(overrides?: Partial<ControlPlaneConfig>): ControlPlaneClient {
  const config: ControlPlaneConfig = {
    apiUrl: process.env.TRIBBLE_API_URL || 'https://app.tribble.ai/api',
    token: process.env.TRIBBLE_API_TOKEN || '',
    ...overrides,
  };

  if (!config.token) {
    throw new Error('TRIBBLE_API_TOKEN environment variable is required');
  }

  return new ControlPlaneClient(config);
}

// ==================== Exports ====================

export type {
  ExtensionManifest,
  BuiltExtension,
} from '@tribble/sdk-extensions';
