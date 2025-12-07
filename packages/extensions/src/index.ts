/**
 * Tribble SDK Extensions
 *
 * Build tools, integrations, cartridges, and ingest adapters
 * that run on the Tribble platform.
 */

import { z, ZodSchema, ZodObject, ZodRawShape } from 'zod';

// ==================== Core Types ====================

/**
 * Citation returned by tools.
 */
export interface Citation {
  title: string;
  url?: string;
  snippet: string;
}

/**
 * Tool execution result.
 */
export interface ToolResult {
  content: string;
  citations?: Citation[];
  data?: Record<string, unknown>;
  stopRecursion?: boolean;
}

// ==================== Platform Request/Response ====================

/**
 * Request sent from platform to extension handler.
 */
export interface ExtensionRequest {
  tool: string;
  args: Record<string, unknown>;
  context: {
    schema: string;
    clientId: number;
    userId?: number;
    conversationId?: string;
  };
  services: {
    baseUrl: string;
    token: string;
  };
}

/**
 * Response returned from extension handler to platform.
 */
export interface ExtensionResponse {
  success: boolean;
  result?: ToolResult;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

// ==================== Tool Context (Runtime) ====================

/**
 * Context provided to tool handlers at runtime.
 * The SDK runtime creates this from the ExtensionRequest.
 */
export interface ToolContext {
  schema: string;
  clientId: number;
  userId?: number;
  conversationId?: string;
  /** Brain search service */
  brain: BrainClient;
  /** Integration credentials factory */
  integrations: IntegrationFactory;
  /** Logging service */
  logger: Logger;
}

/**
 * Brain search client - calls back to platform.
 */
export interface BrainClient {
  search(
    query: string,
    options?: { limit?: number; filters?: Record<string, unknown> }
  ): Promise<SearchResult[]>;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  citations?: Citation[];
}

/**
 * Integration factory - retrieves credentials from platform.
 */
export interface IntegrationFactory {
  get<T = IntegrationCredentials>(name: string): Promise<T>;
}

export interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Logger interface.
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
}

// ==================== Manifest Types ====================

/**
 * Complete extension manifest - sent to platform for registration.
 */
export interface ExtensionManifest {
  name: string;
  version: string;
  platformVersion: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  keywords?: string[];

  /** Handler deployment configuration */
  handler?: HandlerConfig;

  /** Extension components */
  tools?: ToolManifest[];
  integrations?: IntegrationManifest[];
  cartridges?: CartridgeManifest[];
  ingestAdapters?: IngestAdapterManifest[];
}

export interface HandlerConfig {
  type: 'http' | 'lambda' | 'azure_function';
  url?: string;
  functionArn?: string;
  functionUrl?: string;
  region?: string;
  auth?: {
    type: 'api_key' | 'bearer' | 'function_key';
    value: string;
    header?: string;
  };
}

export interface ToolManifest {
  name: string;
  description: string;
  parameters: ToolParameters;
  handlerFunction?: string;
  timeoutMs?: number;
  rateLimitPerMinute?: number;
  category?: 'search' | 'action' | 'query' | 'compute' | 'custom';
  requiredIntegrations?: string[];
  doNotRecurse?: boolean;
  isHandoff?: boolean;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
  default?: unknown;
}

export interface IntegrationManifest {
  name: string;
  displayName: string;
  description?: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'custom';
  oauth2?: OAuth2Config;
  apiKey?: ApiKeyConfig;
  healthCheck?: HealthCheckConfig;
  logoUrl?: string;
  docsUrl?: string;
}

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  pkceEnabled?: boolean;
}

export interface ApiKeyConfig {
  headerName: string;
  prefix?: string;
}

export interface HealthCheckConfig {
  endpoint: string;
  method?: 'GET' | 'HEAD';
  expectedStatus?: number[];
  intervalSeconds?: number;
}

export interface CartridgeManifest {
  name: string;
  displayName: string;
  description?: string;
  model: string;
  tools: string[];
  systemPrompt: string;
  toolChoice?: string;
  configSchema?: Record<string, unknown>;
  category?: 'sales' | 'support' | 'analytics' | 'operations' | 'custom';
}

export interface IngestAdapterManifest {
  name: string;
  displayName: string;
  description?: string;
  extensions: string[];
  mimeTypes: string[];
  handlerFunction: string;
  maxSizeBytes?: number;
  supportsChunking?: boolean;
  defaultChunkSize?: number;
}

// ==================== Tool Builder ====================

export type ToolHandler<TArgs = unknown> = (
  args: TArgs,
  ctx: ToolContext
) => Promise<ToolResult>;

export interface BuiltTool<TArgs = unknown> {
  manifest: ToolManifest;
  schema: ZodSchema<TArgs>;
  handler: ToolHandler<TArgs>;
}

/**
 * Build platform-compatible tools with type-safe parameters.
 *
 * @example
 * ```typescript
 * const search = new ToolBuilder('crm_search')
 *   .description('Search CRM for accounts')
 *   .parameters({
 *     query: z.string().describe('Search query'),
 *     limit: z.number().optional().describe('Max results'),
 *   })
 *   .timeout(60_000)
 *   .handler(async (args, ctx) => {
 *     const creds = await ctx.integrations.get('salesforce');
 *     // ... search logic
 *     return { content: JSON.stringify(results) };
 *   })
 *   .build();
 * ```
 */
export class ToolBuilder<TArgs extends ZodRawShape = ZodRawShape> {
  private _name: string;
  private _description: string = '';
  private _params: TArgs = {} as TArgs;
  private _handler?: ToolHandler<z.infer<ZodObject<TArgs>>>;
  private _handlerFunction?: string;
  private _timeoutMs: number = 30000;
  private _rateLimitPerMinute: number = 100;
  private _category: ToolManifest['category'] = 'custom';
  private _requiredIntegrations: string[] = [];
  private _doNotRecurse: boolean = false;
  private _isHandoff: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  parameters<T extends ZodRawShape>(params: T): ToolBuilder<T> {
    (this as unknown as ToolBuilder<T>)._params = params;
    return this as unknown as ToolBuilder<T>;
  }

  handler(fn: ToolHandler<z.infer<ZodObject<TArgs>>>): this {
    this._handler = fn;
    return this;
  }

  handlerFunction(name: string): this {
    this._handlerFunction = name;
    return this;
  }

  timeout(ms: number): this {
    this._timeoutMs = Math.min(Math.max(ms, 1000), 300000);
    return this;
  }

  rateLimit(perMinute: number): this {
    this._rateLimitPerMinute = Math.min(Math.max(perMinute, 1), 10000);
    return this;
  }

  category(cat: ToolManifest['category']): this {
    this._category = cat;
    return this;
  }

  requiresIntegration(name: string): this {
    this._requiredIntegrations.push(name);
    return this;
  }

  doNotRecurse(value: boolean = true): this {
    this._doNotRecurse = value;
    return this;
  }

  isHandoff(value: boolean = true): this {
    this._isHandoff = value;
    return this;
  }

  build(): BuiltTool<z.infer<ZodObject<TArgs>>> {
    if (!this._description) {
      throw new Error(`Tool "${this._name}" must have a description`);
    }
    if (!this._handler) {
      throw new Error(`Tool "${this._name}" must have a handler`);
    }

    const schema = z.object(this._params);

    return {
      manifest: {
        name: this._name,
        description: this._description,
        parameters: this.toJsonSchema(),
        handlerFunction: this._handlerFunction,
        timeoutMs: this._timeoutMs,
        rateLimitPerMinute: this._rateLimitPerMinute,
        category: this._category,
        requiredIntegrations:
          this._requiredIntegrations.length > 0
            ? this._requiredIntegrations
            : undefined,
        doNotRecurse: this._doNotRecurse || undefined,
        isHandoff: this._isHandoff || undefined,
      },
      schema,
      handler: this._handler,
    };
  }

  private toJsonSchema(): ToolParameters {
    const properties: Record<string, ToolParameterProperty> = {};
    const required: string[] = [];

    for (const [key, schema] of Object.entries(this._params)) {
      properties[key] = zodToProperty(schema as ZodSchema);
      if (!(schema as ZodSchema).isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
}

function zodToProperty(schema: ZodSchema): ToolParameterProperty {
  const def = (schema as any)._def;
  const desc = def.description;

  switch (def.typeName) {
    case 'ZodString':
      return { type: 'string', description: desc };
    case 'ZodNumber':
      return { type: 'number', description: desc };
    case 'ZodBoolean':
      return { type: 'boolean', description: desc };
    case 'ZodEnum':
      return { type: 'string', description: desc, enum: def.values };
    case 'ZodArray':
      return {
        type: 'array',
        description: desc,
        items: zodToProperty(def.type),
      };
    case 'ZodObject':
      const props: Record<string, ToolParameterProperty> = {};
      for (const [k, v] of Object.entries(def.shape())) {
        props[k] = zodToProperty(v as ZodSchema);
      }
      return { type: 'object', description: desc, properties: props };
    case 'ZodOptional':
    case 'ZodNullable':
      return zodToProperty(def.innerType);
    case 'ZodDefault':
      const inner = zodToProperty(def.innerType);
      inner.default = def.defaultValue();
      return inner;
    default:
      return { type: 'string', description: desc };
  }
}

// ==================== Integration Builder ====================

export interface BuiltIntegration {
  manifest: IntegrationManifest;
}

/**
 * Build platform-compatible integrations.
 *
 * @example
 * ```typescript
 * const salesforce = new IntegrationBuilder('salesforce')
 *   .displayName('Salesforce CRM')
 *   .oauth2({
 *     authorizationUrl: 'https://login.salesforce.com/...',
 *     tokenUrl: 'https://login.salesforce.com/...',
 *     scopes: ['api', 'refresh_token'],
 *   })
 *   .healthCheck({ endpoint: '/services/data/v59.0/' })
 *   .build();
 * ```
 */
export class IntegrationBuilder {
  private _name: string;
  private _displayName: string;
  private _description?: string;
  private _type: IntegrationManifest['type'] = 'custom';
  private _oauth2?: OAuth2Config;
  private _apiKey?: ApiKeyConfig;
  private _healthCheck?: HealthCheckConfig;
  private _logoUrl?: string;
  private _docsUrl?: string;

  constructor(name: string) {
    this._name = name;
    this._displayName = name;
  }

  displayName(name: string): this {
    this._displayName = name;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  oauth2(config: OAuth2Config): this {
    this._type = 'oauth2';
    this._oauth2 = config;
    return this;
  }

  apiKey(config: ApiKeyConfig): this {
    this._type = 'api_key';
    this._apiKey = config;
    return this;
  }

  basicAuth(): this {
    this._type = 'basic_auth';
    return this;
  }

  healthCheck(config: HealthCheckConfig): this {
    this._healthCheck = config;
    return this;
  }

  logo(url: string): this {
    this._logoUrl = url;
    return this;
  }

  docs(url: string): this {
    this._docsUrl = url;
    return this;
  }

  build(): BuiltIntegration {
    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        type: this._type,
        oauth2: this._oauth2,
        apiKey: this._apiKey,
        healthCheck: this._healthCheck,
        logoUrl: this._logoUrl,
        docsUrl: this._docsUrl,
      },
    };
  }
}

// ==================== Cartridge Builder ====================

export interface BuiltCartridge {
  manifest: CartridgeManifest;
}

/**
 * Build platform-compatible cartridges (AI personas).
 *
 * @example
 * ```typescript
 * const assistant = new CartridgeBuilder('sales-assistant')
 *   .displayName('Sales Intelligence')
 *   .model('gpt-4o')
 *   .tools(['brain_search', 'crm_search'])
 *   .systemPrompt(`You are a sales assistant...`)
 *   .build();
 * ```
 */
export class CartridgeBuilder {
  private _name: string;
  private _displayName: string;
  private _description?: string;
  private _model: string = 'gpt-4o';
  private _tools: string[] = [];
  private _systemPrompt: string = '';
  private _toolChoice?: string;
  private _configSchema?: Record<string, unknown>;
  private _category?: CartridgeManifest['category'];

  constructor(name: string) {
    this._name = name;
    this._displayName = name;
  }

  displayName(name: string): this {
    this._displayName = name;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  model(model: string): this {
    this._model = model;
    return this;
  }

  tools(names: string[]): this {
    this._tools = names;
    return this;
  }

  tool(name: string): this {
    this._tools.push(name);
    return this;
  }

  systemPrompt(prompt: string): this {
    this._systemPrompt = prompt;
    return this;
  }

  toolChoice(choice: string): this {
    this._toolChoice = choice;
    return this;
  }

  category(cat: CartridgeManifest['category']): this {
    this._category = cat;
    return this;
  }

  build(): BuiltCartridge {
    if (!this._systemPrompt) {
      throw new Error(`Cartridge "${this._name}" must have a systemPrompt`);
    }

    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        model: this._model,
        tools: this._tools,
        systemPrompt: this._systemPrompt,
        toolChoice: this._toolChoice,
        configSchema: this._configSchema,
        category: this._category,
      },
    };
  }
}

// ==================== Ingest Adapter Builder ====================

export interface IngestContext {
  schema: string;
  clientId: number;
  file: {
    name: string;
    extension: string;
    mimeType: string;
    sizeBytes: number;
  };
  metadata: Record<string, unknown>;
  logger: Logger;
}

export interface DocumentChunk {
  content: string;
  index: number;
  title?: string;
  pageNumber?: number;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  chunks: DocumentChunk[];
  metadata: Record<string, unknown>;
  autoTags?: string[];
}

export type IngestHandler = (
  data: ArrayBuffer | Buffer,
  ctx: IngestContext
) => Promise<IngestResult>;

export interface BuiltIngestAdapter {
  manifest: IngestAdapterManifest;
  handler: IngestHandler;
}

/**
 * Build custom file parsers for the knowledge base.
 *
 * @example
 * ```typescript
 * const excelAdapter = new IngestAdapterBuilder('excel-parser')
 *   .displayName('Excel Parser')
 *   .extensions(['.xlsx', '.xls'])
 *   .mimeTypes(['application/vnd.ms-excel'])
 *   .handler(async (data, ctx) => {
 *     // Parse Excel file
 *     return { chunks: [...], metadata: {} };
 *   })
 *   .build();
 * ```
 */
export class IngestAdapterBuilder {
  private _name: string;
  private _displayName: string;
  private _description?: string;
  private _extensions: string[] = [];
  private _mimeTypes: string[] = [];
  private _handlerFunction: string;
  private _handler?: IngestHandler;
  private _maxSizeBytes?: number;
  private _supportsChunking: boolean = true;
  private _defaultChunkSize: number = 1000;

  constructor(name: string) {
    this._name = name;
    this._displayName = name;
    this._handlerFunction = name;
  }

  displayName(name: string): this {
    this._displayName = name;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  extensions(exts: string[]): this {
    this._extensions = exts.map((e) => (e.startsWith('.') ? e : `.${e}`));
    return this;
  }

  mimeTypes(types: string[]): this {
    this._mimeTypes = types;
    return this;
  }

  handlerFunction(name: string): this {
    this._handlerFunction = name;
    return this;
  }

  maxSize(bytes: number): this {
    this._maxSizeBytes = bytes;
    return this;
  }

  chunking(defaultSize: number): this {
    this._supportsChunking = true;
    this._defaultChunkSize = defaultSize;
    return this;
  }

  handler(fn: IngestHandler): this {
    this._handler = fn;
    return this;
  }

  build(): BuiltIngestAdapter {
    if (!this._handler) {
      throw new Error(`Ingest adapter "${this._name}" must have a handler`);
    }
    if (this._extensions.length === 0 && this._mimeTypes.length === 0) {
      throw new Error(
        `Ingest adapter "${this._name}" must have extensions or mimeTypes`
      );
    }

    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        extensions: this._extensions,
        mimeTypes: this._mimeTypes,
        handlerFunction: this._handlerFunction,
        maxSizeBytes: this._maxSizeBytes,
        supportsChunking: this._supportsChunking,
        defaultChunkSize: this._defaultChunkSize,
      },
      handler: this._handler,
    };
  }
}

// ==================== Extension Bundle ====================

export interface BuiltExtension {
  manifest: ExtensionManifest;
  tools: Map<string, BuiltTool<unknown>>;
  ingestAdapters: Map<string, BuiltIngestAdapter>;
}

interface ExtensionConfig {
  name: string;
  version: string;
  platformVersion: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  keywords?: string[];
}

/**
 * Bundle extension components into a deployable package.
 *
 * @example
 * ```typescript
 * const extension = new ExtensionBundle({
 *   name: 'my-extension',
 *   version: '1.0.0',
 *   platformVersion: '>=2.0.0',
 * })
 *   .handler({ type: 'http', url: process.env.HANDLER_URL })
 *   .tool(searchTool)
 *   .integration(salesforce)
 *   .cartridge(assistant)
 *   .build();
 *
 * // Export for platform registration
 * export default extension;
 *
 * // Export HTTP handler for deployment
 * export const handler = createHandler(extension);
 * ```
 */
export class ExtensionBundle {
  private _config: ExtensionConfig;
  private _handler?: HandlerConfig;
  private _tools: BuiltTool<unknown>[] = [];
  private _integrations: BuiltIntegration[] = [];
  private _cartridges: BuiltCartridge[] = [];
  private _ingestAdapters: BuiltIngestAdapter[] = [];

  constructor(config: ExtensionConfig) {
    this._config = config;
  }

  handler(config: HandlerConfig): this {
    this._handler = config;
    return this;
  }

  tool<T>(tool: BuiltTool<T>): this {
    this._tools.push(tool as BuiltTool<unknown>);
    return this;
  }

  integration(integration: BuiltIntegration): this {
    this._integrations.push(integration);
    return this;
  }

  cartridge(cartridge: BuiltCartridge): this {
    this._cartridges.push(cartridge);
    return this;
  }

  ingestAdapter(adapter: BuiltIngestAdapter): this {
    this._ingestAdapters.push(adapter);
    return this;
  }

  build(): BuiltExtension {
    const tools = new Map<string, BuiltTool<unknown>>();
    const ingestAdapters = new Map<string, BuiltIngestAdapter>();

    for (const tool of this._tools) {
      tools.set(tool.manifest.name, tool);
    }

    for (const adapter of this._ingestAdapters) {
      ingestAdapters.set(adapter.manifest.name, adapter);
    }

    return {
      manifest: {
        ...this._config,
        handler: this._handler,
        tools:
          this._tools.length > 0
            ? this._tools.map((t) => t.manifest)
            : undefined,
        integrations:
          this._integrations.length > 0
            ? this._integrations.map((i) => i.manifest)
            : undefined,
        cartridges:
          this._cartridges.length > 0
            ? this._cartridges.map((c) => c.manifest)
            : undefined,
        ingestAdapters:
          this._ingestAdapters.length > 0
            ? this._ingestAdapters.map((a) => a.manifest)
            : undefined,
      },
      tools,
      ingestAdapters,
    };
  }
}

// ==================== Handler Runtime ====================

/**
 * Create an HTTP handler for the extension.
 * This wraps your tools so they can be invoked by the platform.
 *
 * @example
 * ```typescript
 * const extension = new ExtensionBundle({...}).tool(myTool).build();
 * export const handler = createHandler(extension);
 *
 * // Deploy to your preferred platform:
 * // - Express: app.post('/extension', handler)
 * // - AWS Lambda: exports.handler = handler
 * // - Azure Function: module.exports = handler
 * ```
 */
export function createHandler(
  extension: BuiltExtension
): (req: Request | { body: ExtensionRequest }) => Promise<Response> {
  return async (req): Promise<Response> => {
    let body: ExtensionRequest;

    // Handle different request formats
    if (req instanceof Request) {
      body = await req.json();
    } else {
      body = req.body;
    }

    const { tool: toolName, args, context, services } = body;

    // Find the tool
    const tool = extension.tools.get(toolName);
    if (!tool) {
      return jsonResponse(
        {
          success: false,
          error: { message: `Tool not found: ${toolName}`, code: 'TOOL_NOT_FOUND' },
        },
        404
      );
    }

    // Create context with service clients
    const ctx: ToolContext = {
      schema: context.schema,
      clientId: context.clientId,
      userId: context.userId,
      conversationId: context.conversationId,
      brain: createBrainClient(services.baseUrl, services.token),
      integrations: createIntegrationFactory(services.baseUrl, services.token),
      logger: createLogger(services.baseUrl, services.token, extension.manifest.name),
    };

    try {
      // Validate args
      const validatedArgs = tool.schema.parse(args);

      // Execute handler
      const result = await tool.handler(validatedArgs, ctx);

      return jsonResponse({ success: true, result });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Zod validation errors
      if (error.name === 'ZodError') {
        return jsonResponse(
          {
            success: false,
            error: {
              message: 'Invalid arguments',
              code: 'VALIDATION_ERROR',
              details: { errors: (error as any).errors },
            },
          },
          400
        );
      }

      return jsonResponse(
        {
          success: false,
          error: { message: error.message, code: 'HANDLER_ERROR' },
        },
        500
      );
    }
  };
}

function jsonResponse(data: ExtensionResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ==================== Service Clients ====================

function createBrainClient(baseUrl: string, token: string): BrainClient {
  return {
    async search(query, options = {}) {
      const res = await fetch(
        `${baseUrl}/internal/extension-callback/brain/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query, options }),
        }
      );

      if (!res.ok) {
        throw new Error(`Brain search failed: ${res.status}`);
      }

      const data = await res.json();
      return data.data || [];
    },
  };
}

function createIntegrationFactory(
  baseUrl: string,
  token: string
): IntegrationFactory {
  return {
    async get<T = IntegrationCredentials>(name: string): Promise<T> {
      const res = await fetch(
        `${baseUrl}/internal/extension-callback/integrations/${name}/credentials`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error(`Integration '${name}' not available: ${res.status}`);
      }

      const data = await res.json();
      return data.data?.credentials as T;
    },
  };
}

function createLogger(
  baseUrl: string,
  token: string,
  extensionName: string
): Logger {
  const log = (
    level: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    // Fire and forget - don't await
    fetch(`${baseUrl}/internal/extension-callback/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ level, message, data }),
    }).catch(() => {
      // Ignore logging failures
    });

    // Also log locally
    const prefix = `[${extensionName}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  };

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, err, data) =>
      log('error', msg, { ...data, error: err?.message, stack: err?.stack }),
  };
}

// ==================== Exports ====================

export { z, ZodSchema } from 'zod';
