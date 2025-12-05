import { z, ZodSchema, ZodObject, ZodRawShape } from 'zod';

// ==================== Extension Manifest Types ====================

/**
 * Extension manifest - the contract between SDK extensions and the Tribble platform.
 * This matches the platform's extension registration system.
 */
export interface ExtensionManifest {
  /** Unique identifier for the extension (e.g., "excedra-integration") */
  name: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Human-readable description */
  description: string;
  /** Extension author/organization */
  author: string;
  /** Platform compatibility version (e.g., ">=2.0.0") */
  platformVersion: string;
  /** Required platform capabilities */
  capabilities?: string[];
  /** Extension components */
  components: {
    tools?: ToolManifest[];
    integrations?: IntegrationManifest[];
    cartridges?: CartridgeManifest[];
    ingestAdapters?: IngestAdapterManifest[];
  };
  /** Extension-level configuration schema */
  configSchema?: ZodSchema;
  /** License identifier */
  license?: string;
  /** Repository URL */
  repository?: string;
  /** Keywords for discoverability */
  keywords?: string[];
}

// ==================== Tool System ====================

/**
 * Tool manifest matching platform's ToolCall interface.
 * See: ds9/apps/exocomp/src/tools/tool_call.ts
 */
export interface ToolManifest {
  /** Tool name used in function calls (e.g., "brain_search") */
  name: string;
  /** Human-readable description for LLM */
  description: string;
  /** JSON Schema for parameters */
  parameters: ToolParameters;
  /** Whether this tool can trigger recursive calls */
  doNotRecurse?: boolean;
  /** Whether this tool is a handoff point */
  isHandoff?: boolean;
  /** Tool category for organization */
  category?: 'search' | 'action' | 'query' | 'compute' | 'custom';
  /** Required integrations */
  requiredIntegrations?: string[];
  /** Required platform capabilities */
  requiredCapabilities?: string[];
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
  default?: unknown;
}

/**
 * Tool execution context provided by the platform at runtime.
 */
export interface ToolContext {
  /** Client schema/tenant ID */
  schema: string;
  /** Client ID */
  clientId: number;
  /** Current user ID */
  userId?: number;
  /** Conversation ID */
  conversationId?: string;
  /** Platform-provided services */
  services: {
    /** Brain search service */
    brain: BrainSearchService;
    /** Integration client factory */
    integrations: IntegrationClientFactory;
    /** Logging service */
    logger: LoggerService;
    /** Metrics service */
    metrics: MetricsService;
  };
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export interface BrainSearchService {
  search(query: string, options?: { limit?: number; filters?: Record<string, unknown> }): Promise<SearchResult[]>;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  citations?: Citation[];
}

export interface Citation {
  title: string;
  url?: string;
  snippet: string;
}

export interface IntegrationClientFactory {
  get<T>(integrationName: string): Promise<T>;
}

export interface LoggerService {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
}

export interface MetricsService {
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, durationMs: number, tags?: Record<string, string>): void;
}

/**
 * Tool execution result.
 */
export interface ToolResult {
  /** String content to return to the LLM */
  content: string;
  /** Optional citations */
  citations?: Citation[];
  /** Optional structured data */
  data?: unknown;
  /** Whether to prevent recursive tool calls */
  stopRecursion?: boolean;
}

/**
 * Tool handler function signature.
 */
export type ToolHandler<TArgs = unknown> = (
  args: TArgs,
  context: ToolContext
) => Promise<ToolResult>;

/**
 * ToolBuilder - Fluent API for building platform-compatible tools.
 * Matches the platform's ToolCall abstract class pattern.
 *
 * @example
 * ```typescript
 * const crm = new ToolBuilder('crm_search')
 *   .description('Search CRM for customer data')
 *   .parameter('query', z.string(), 'Search query')
 *   .parameter('limit', z.number().optional(), 'Max results')
 *   .requiredIntegration('salesforce')
 *   .handler(async (args, ctx) => {
 *     const sf = await ctx.services.integrations.get<SalesforceClient>('salesforce');
 *     const results = await sf.query(args.query);
 *     return { content: JSON.stringify(results) };
 *   })
 *   .build();
 * ```
 */
export class ToolBuilder<TArgs extends ZodRawShape = ZodRawShape> {
  private _name: string;
  private _description: string = '';
  private _parameters: ZodRawShape = {};
  private _required: string[] = [];
  private _handler?: ToolHandler<z.infer<ZodObject<TArgs>>>;
  private _doNotRecurse: boolean = false;
  private _isHandoff: boolean = false;
  private _category: ToolManifest['category'] = 'custom';
  private _requiredIntegrations: string[] = [];
  private _requiredCapabilities: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  /** Set the tool description */
  description(desc: string): this {
    this._description = desc;
    return this;
  }

  /** Add a parameter with Zod validation */
  parameter<K extends string, S extends ZodSchema>(
    name: K,
    schema: S,
    description: string
  ): ToolBuilder<TArgs & { [P in K]: S }> {
    const annotatedSchema = schema.describe(description);
    this._parameters[name] = annotatedSchema;

    // Track required parameters (non-optional)
    if (!schema.isOptional()) {
      this._required.push(name);
    }

    return this as unknown as ToolBuilder<TArgs & { [P in K]: S }>;
  }

  /** Set the execution handler */
  handler(fn: ToolHandler<z.infer<ZodObject<TArgs>>>): this {
    this._handler = fn;
    return this;
  }

  /** Mark tool as non-recursive */
  doNotRecurse(value: boolean = true): this {
    this._doNotRecurse = value;
    return this;
  }

  /** Mark tool as a handoff point */
  isHandoff(value: boolean = true): this {
    this._isHandoff = value;
    return this;
  }

  /** Set tool category */
  category(cat: ToolManifest['category']): this {
    this._category = cat;
    return this;
  }

  /** Require an integration */
  requiredIntegration(integrationName: string): this {
    this._requiredIntegrations.push(integrationName);
    return this;
  }

  /** Require a platform capability */
  requiredCapability(capabilityName: string): this {
    this._requiredCapabilities.push(capabilityName);
    return this;
  }

  /** Build the tool definition */
  build(): BuiltTool<z.infer<ZodObject<TArgs>>> {
    if (!this._handler) {
      throw new Error(`Tool "${this._name}" must have a handler`);
    }

    const argsSchema = z.object(this._parameters as TArgs);

    return {
      manifest: {
        name: this._name,
        description: this._description,
        parameters: this.generateJsonSchema(),
        doNotRecurse: this._doNotRecurse,
        isHandoff: this._isHandoff,
        category: this._category,
        requiredIntegrations: this._requiredIntegrations.length > 0 ? this._requiredIntegrations : undefined,
        requiredCapabilities: this._requiredCapabilities.length > 0 ? this._requiredCapabilities : undefined,
      },
      argsSchema,
      handler: this._handler,
    };
  }

  private generateJsonSchema(): ToolParameters {
    const properties: Record<string, ToolParameterProperty> = {};

    for (const [key, schema] of Object.entries(this._parameters)) {
      properties[key] = this.zodToJsonSchema(schema as ZodSchema);
    }

    return {
      type: 'object',
      properties,
      required: this._required.length > 0 ? this._required : undefined,
    };
  }

  private zodToJsonSchema(schema: ZodSchema): ToolParameterProperty {
    const def = (schema as unknown as { _def: { typeName?: string; description?: string; values?: string[] } })._def;
    const typeName = def.typeName;
    const description = def.description || '';

    if (typeName === 'ZodString') {
      return { type: 'string', description };
    }
    if (typeName === 'ZodNumber') {
      return { type: 'number', description };
    }
    if (typeName === 'ZodBoolean') {
      return { type: 'boolean', description };
    }
    if (typeName === 'ZodEnum') {
      return { type: 'string', description, enum: def.values };
    }
    if (typeName === 'ZodArray') {
      const innerSchema = (schema as z.ZodArray<ZodSchema>).element;
      return { type: 'array', description, items: this.zodToJsonSchema(innerSchema) };
    }
    if (typeName === 'ZodOptional') {
      const inner = (schema as z.ZodOptional<ZodSchema>).unwrap();
      return this.zodToJsonSchema(inner);
    }
    if (typeName === 'ZodObject') {
      const shape = (schema as z.ZodObject<ZodRawShape>).shape;
      const props: Record<string, ToolParameterProperty> = {};
      for (const [k, v] of Object.entries(shape)) {
        props[k] = this.zodToJsonSchema(v as ZodSchema);
      }
      return { type: 'object', description, properties: props };
    }

    return { type: 'string', description };
  }
}

export interface BuiltTool<TArgs> {
  manifest: ToolManifest;
  argsSchema: ZodSchema<TArgs>;
  handler: ToolHandler<TArgs>;
}

// ==================== Integration System ====================

/**
 * Integration manifest matching platform's BaseIntegration/OAuthIntegration.
 * See: ds9/packages/integration-core/src/base/
 */
export interface IntegrationManifest {
  /** Integration name (e.g., "salesforce") */
  name: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Integration type */
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'custom';
  /** OAuth2 configuration (if type is oauth2) */
  oauth2Config?: OAuth2Config;
  /** API key configuration (if type is api_key) */
  apiKeyConfig?: ApiKeyConfig;
  /** Health check configuration */
  healthCheck?: HealthCheckConfig;
  /** Required scopes/permissions */
  requiredScopes?: string[];
  /** Provider logo URL */
  logoUrl?: string;
  /** Documentation URL */
  docsUrl?: string;
}

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  pkceEnabled?: boolean;
  clientIdEnvVar?: string;
  clientSecretEnvVar?: string;
}

export interface ApiKeyConfig {
  headerName?: string;
  queryParamName?: string;
  envVar?: string;
}

export interface HealthCheckConfig {
  /** Endpoint to check */
  endpoint: string;
  /** HTTP method */
  method?: 'GET' | 'POST';
  /** Expected status codes */
  expectedStatus?: number[];
  /** Check interval in seconds */
  intervalSeconds?: number;
}

/**
 * Integration health status.
 */
export interface IntegrationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: Date;
  details?: Record<string, unknown>;
}

/**
 * Integration context provided at runtime.
 */
export interface IntegrationContext {
  /** Client schema */
  schema: string;
  /** Client ID */
  clientId: number;
  /** User ID (for user-level integrations) */
  userId?: number;
  /** Stored credentials */
  credentials: IntegrationCredentials;
  /** Logger */
  logger: LoggerService;
}

export interface IntegrationCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Integration client interface.
 */
export interface IntegrationClient {
  /** Check integration health */
  checkHealth(): Promise<IntegrationHealth>;
  /** Get credentials (may refresh if expired) */
  getCredentials(): Promise<IntegrationCredentials>;
}

/**
 * IntegrationBuilder - Fluent API for building platform-compatible integrations.
 *
 * @example
 * ```typescript
 * const salesforce = new IntegrationBuilder('salesforce')
 *   .displayName('Salesforce')
 *   .description('CRM integration')
 *   .oauth2({
 *     authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
 *     tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
 *     scopes: ['api', 'refresh_token'],
 *   })
 *   .healthCheck({ endpoint: '/services/data/v58.0/' })
 *   .clientFactory(async (ctx) => new SalesforceClient(ctx.credentials))
 *   .build();
 * ```
 */
export class IntegrationBuilder<TClient = unknown> {
  private _name: string;
  private _displayName: string = '';
  private _description: string = '';
  private _type: IntegrationManifest['type'] = 'custom';
  private _oauth2Config?: OAuth2Config;
  private _apiKeyConfig?: ApiKeyConfig;
  private _healthCheckConfig?: HealthCheckConfig;
  private _requiredScopes: string[] = [];
  private _logoUrl?: string;
  private _docsUrl?: string;
  private _clientFactory?: (ctx: IntegrationContext) => Promise<TClient>;
  private _healthChecker?: (client: TClient) => Promise<IntegrationHealth>;

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
    this._oauth2Config = config;
    return this;
  }

  apiKey(config: ApiKeyConfig): this {
    this._type = 'api_key';
    this._apiKeyConfig = config;
    return this;
  }

  basicAuth(): this {
    this._type = 'basic_auth';
    return this;
  }

  healthCheck(config: HealthCheckConfig): this {
    this._healthCheckConfig = config;
    return this;
  }

  requiredScope(scope: string): this {
    this._requiredScopes.push(scope);
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

  clientFactory(factory: (ctx: IntegrationContext) => Promise<TClient>): this {
    this._clientFactory = factory;
    return this;
  }

  healthChecker(checker: (client: TClient) => Promise<IntegrationHealth>): this {
    this._healthChecker = checker;
    return this;
  }

  build(): BuiltIntegration<TClient> {
    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        type: this._type,
        oauth2Config: this._oauth2Config,
        apiKeyConfig: this._apiKeyConfig,
        healthCheck: this._healthCheckConfig,
        requiredScopes: this._requiredScopes.length > 0 ? this._requiredScopes : undefined,
        logoUrl: this._logoUrl,
        docsUrl: this._docsUrl,
      },
      clientFactory: this._clientFactory,
      healthChecker: this._healthChecker,
    };
  }
}

export interface BuiltIntegration<TClient> {
  manifest: IntegrationManifest;
  clientFactory?: (ctx: IntegrationContext) => Promise<TClient>;
  healthChecker?: (client: TClient) => Promise<IntegrationHealth>;
}

// ==================== Cartridge System ====================

/**
 * Cartridge manifest matching platform's Cartridge class.
 * See: ds9/apps/exocomp/src/cartridges/cartridge.ts
 */
export interface CartridgeManifest {
  /** Cartridge name (e.g., "kam-precall") */
  name: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Model to use */
  model: ModelType;
  /** Tool choice strategy */
  toolChoice?: ToolChoice;
  /** Available tools (names from registered tools) */
  availableTools: string[];
  /** System prompt template (Handlebars) */
  promptTemplate: string;
  /** Configuration schema */
  configSchema?: ZodSchema;
  /** Use case category */
  category?: 'sales' | 'support' | 'analytics' | 'operations' | 'custom';
}

export type ModelType =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku';

export type ToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } };

/**
 * Cartridge context at runtime.
 */
export interface CartridgeContext {
  /** Client schema */
  schema: string;
  /** Client ID */
  clientId: number;
  /** User info */
  user?: { id: number; email: string; name?: string };
  /** Conversation ID */
  conversationId?: string;
  /** Custom configuration */
  config?: Record<string, unknown>;
  /** Template variables for prompt compilation */
  templateVars?: Record<string, unknown>;
}

/**
 * Cartridge initialization result.
 */
export interface CartridgeInit {
  /** Compiled system prompt */
  systemPrompt: string;
  /** Tools to make available */
  tools: ToolManifest[];
  /** Model to use */
  model: ModelType;
  /** Tool choice strategy */
  toolChoice?: ToolChoice;
  /** Additional messages to prepend */
  preambleMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * CartridgeBuilder - Fluent API for building platform-compatible cartridges.
 *
 * @example
 * ```typescript
 * const kamPrecall = new CartridgeBuilder('kam-precall')
 *   .displayName('KAM Pre-Call Intelligence')
 *   .description('Prepares field sales for customer visits')
 *   .model('gpt-4o')
 *   .tools(['brain_search', 'crm_search', 'pos_query'])
 *   .promptTemplate(`
 *     You are a KAM assistant preparing for a store visit.
 *     Store: {{storeName}}
 *     Account: {{accountName}}
 *
 *     Provide actionable insights for the visit.
 *   `)
 *   .configSchema(z.object({
 *     territory: z.string(),
 *     focusProducts: z.array(z.string()),
 *   }))
 *   .init(async (ctx) => {
 *     // Custom initialization logic
 *   })
 *   .build();
 * ```
 */
export class CartridgeBuilder<TConfig = unknown> {
  private _name: string;
  private _displayName: string = '';
  private _description: string = '';
  private _model: ModelType = 'gpt-4o';
  private _toolChoice?: ToolChoice;
  private _availableTools: string[] = [];
  private _promptTemplate: string = '';
  private _configSchema?: ZodSchema<TConfig>;
  private _category: CartridgeManifest['category'] = 'custom';
  private _initHandler?: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>;
  private _newConversationHandler?: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>;

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

  model(model: ModelType): this {
    this._model = model;
    return this;
  }

  toolChoice(choice: ToolChoice): this {
    this._toolChoice = choice;
    return this;
  }

  tools(toolNames: string[]): this {
    this._availableTools = toolNames;
    return this;
  }

  addTool(toolName: string): this {
    this._availableTools.push(toolName);
    return this;
  }

  promptTemplate(template: string): this {
    this._promptTemplate = template;
    return this;
  }

  configSchema<T extends ZodSchema>(schema: T): CartridgeBuilder<z.infer<T>> {
    this._configSchema = schema as unknown as ZodSchema<TConfig>;
    return this as unknown as CartridgeBuilder<z.infer<T>>;
  }

  category(cat: CartridgeManifest['category']): this {
    this._category = cat;
    return this;
  }

  init(handler: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>): this {
    this._initHandler = handler;
    return this;
  }

  onNewConversation(handler: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>): this {
    this._newConversationHandler = handler;
    return this;
  }

  build(): BuiltCartridge<TConfig> {
    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        model: this._model,
        toolChoice: this._toolChoice,
        availableTools: this._availableTools,
        promptTemplate: this._promptTemplate,
        configSchema: this._configSchema,
        category: this._category,
      },
      configSchema: this._configSchema,
      initHandler: this._initHandler,
      newConversationHandler: this._newConversationHandler,
    };
  }
}

export interface BuiltCartridge<TConfig> {
  manifest: CartridgeManifest;
  configSchema?: ZodSchema<TConfig>;
  initHandler?: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>;
  newConversationHandler?: (ctx: CartridgeContext) => Promise<Partial<CartridgeInit>>;
}

// ==================== Ingest Adapter System ====================

/**
 * Ingest adapter manifest for custom file type handlers.
 * See: ds9/apps/ingest/ for the ingestion pipeline.
 */
export interface IngestAdapterManifest {
  /** Adapter name */
  name: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string;
  /** Supported file extensions */
  extensions: string[];
  /** Supported MIME types */
  mimeTypes: string[];
  /** Maximum file size in bytes */
  maxSizeBytes?: number;
  /** Whether this adapter supports chunking */
  supportsChunking?: boolean;
  /** Default chunk size */
  defaultChunkSize?: number;
  /** Whether auto-tagging is supported */
  supportsAutoTagging?: boolean;
}

/**
 * Ingest context at runtime.
 */
export interface IngestContext {
  /** Client schema */
  schema: string;
  /** Client ID */
  clientId: number;
  /** File metadata */
  file: {
    name: string;
    extension: string;
    mimeType: string;
    sizeBytes: number;
  };
  /** Upload metadata */
  metadata: Record<string, unknown>;
  /** Logger */
  logger: LoggerService;
  /** Abort signal */
  signal?: AbortSignal;
}

/**
 * Parsed document chunk.
 */
export interface DocumentChunk {
  /** Chunk content */
  content: string;
  /** Chunk index */
  index: number;
  /** Optional title/heading */
  title?: string;
  /** Page number (for paginated docs) */
  pageNumber?: number;
  /** Chunk metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Ingest result.
 */
export interface IngestResult {
  /** Parsed chunks */
  chunks: DocumentChunk[];
  /** Document-level metadata */
  metadata: {
    title?: string;
    author?: string;
    createdAt?: Date;
    pageCount?: number;
    wordCount?: number;
    language?: string;
    [key: string]: unknown;
  };
  /** Auto-generated tags */
  autoTags?: string[];
  /** Warnings during parsing */
  warnings?: string[];
}

/**
 * Ingest handler function signature.
 */
export type IngestHandler = (
  data: ArrayBuffer | Buffer | Uint8Array,
  context: IngestContext
) => Promise<IngestResult>;

/**
 * IngestAdapterBuilder - Fluent API for building custom ingest adapters.
 *
 * @example
 * ```typescript
 * const excedraAdapter = new IngestAdapterBuilder('excedra-tpm')
 *   .displayName('Excedra TPM Export')
 *   .description('Parse Excedra trade promotion management exports')
 *   .extensions(['.xlsx', '.csv'])
 *   .mimeTypes(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'])
 *   .maxSize(50 * 1024 * 1024) // 50MB
 *   .handler(async (data, ctx) => {
 *     // Parse Excedra-specific format
 *     const workbook = XLSX.read(data);
 *     const promotions = parsePromotions(workbook);
 *     return {
 *       chunks: promotions.map((p, i) => ({
 *         content: JSON.stringify(p),
 *         index: i,
 *         title: p.promotionName,
 *       })),
 *       metadata: { promotionCount: promotions.length },
 *     };
 *   })
 *   .build();
 * ```
 */
export class IngestAdapterBuilder {
  private _name: string;
  private _displayName: string = '';
  private _description: string = '';
  private _extensions: string[] = [];
  private _mimeTypes: string[] = [];
  private _maxSizeBytes?: number;
  private _supportsChunking: boolean = true;
  private _defaultChunkSize: number = 1000;
  private _supportsAutoTagging: boolean = true;
  private _handler?: IngestHandler;

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

  extensions(exts: string[]): this {
    this._extensions = exts.map(e => e.startsWith('.') ? e : `.${e}`);
    return this;
  }

  mimeTypes(types: string[]): this {
    this._mimeTypes = types;
    return this;
  }

  maxSize(bytes: number): this {
    this._maxSizeBytes = bytes;
    return this;
  }

  chunking(enabled: boolean, defaultSize?: number): this {
    this._supportsChunking = enabled;
    if (defaultSize) this._defaultChunkSize = defaultSize;
    return this;
  }

  autoTagging(enabled: boolean): this {
    this._supportsAutoTagging = enabled;
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

    return {
      manifest: {
        name: this._name,
        displayName: this._displayName,
        description: this._description,
        extensions: this._extensions,
        mimeTypes: this._mimeTypes,
        maxSizeBytes: this._maxSizeBytes,
        supportsChunking: this._supportsChunking,
        defaultChunkSize: this._defaultChunkSize,
        supportsAutoTagging: this._supportsAutoTagging,
      },
      handler: this._handler,
    };
  }
}

export interface BuiltIngestAdapter {
  manifest: IngestAdapterManifest;
  handler: IngestHandler;
}

// ==================== Extension Bundle ====================

/**
 * ExtensionBundle - Container for a complete extension package.
 *
 * @example
 * ```typescript
 * const extension = new ExtensionBundle({
 *   name: 'cpg-sales-kit',
 *   version: '1.0.0',
 *   description: 'CPG field sales extension kit',
 *   author: 'Tribble',
 *   platformVersion: '>=2.0.0',
 * })
 *   .addTool(crmSearchTool)
 *   .addTool(posQueryTool)
 *   .addIntegration(salesforceIntegration)
 *   .addCartridge(kamPrecallCartridge)
 *   .addIngestAdapter(excedraAdapter);
 *
 * export default extension.build();
 * ```
 */
export class ExtensionBundle {
  private _manifest: Omit<ExtensionManifest, 'components'>;
  private _tools: BuiltTool<unknown>[] = [];
  private _integrations: BuiltIntegration<unknown>[] = [];
  private _cartridges: BuiltCartridge<unknown>[] = [];
  private _ingestAdapters: BuiltIngestAdapter[] = [];
  private _capabilities: string[] = [];

  constructor(manifest: Omit<ExtensionManifest, 'components' | 'capabilities'>) {
    this._manifest = manifest;
  }

  addTool<T>(tool: BuiltTool<T>): this {
    this._tools.push(tool as BuiltTool<unknown>);

    // Track required capabilities from tools
    if (tool.manifest.requiredCapabilities) {
      this._capabilities.push(...tool.manifest.requiredCapabilities);
    }

    return this;
  }

  addIntegration<T>(integration: BuiltIntegration<T>): this {
    this._integrations.push(integration as BuiltIntegration<unknown>);
    return this;
  }

  addCartridge<T>(cartridge: BuiltCartridge<T>): this {
    this._cartridges.push(cartridge as BuiltCartridge<unknown>);
    return this;
  }

  addIngestAdapter(adapter: BuiltIngestAdapter): this {
    this._ingestAdapters.push(adapter);
    return this;
  }

  requireCapability(capability: string): this {
    this._capabilities.push(capability);
    return this;
  }

  build(): BuiltExtension {
    const uniqueCapabilities = [...new Set(this._capabilities)];

    return {
      manifest: {
        ...this._manifest,
        capabilities: uniqueCapabilities.length > 0 ? uniqueCapabilities : undefined,
        components: {
          tools: this._tools.length > 0 ? this._tools.map(t => t.manifest) : undefined,
          integrations: this._integrations.length > 0 ? this._integrations.map(i => i.manifest) : undefined,
          cartridges: this._cartridges.length > 0 ? this._cartridges.map(c => c.manifest) : undefined,
          ingestAdapters: this._ingestAdapters.length > 0 ? this._ingestAdapters.map(a => a.manifest) : undefined,
        },
      },
      tools: this._tools,
      integrations: this._integrations,
      cartridges: this._cartridges,
      ingestAdapters: this._ingestAdapters,
    };
  }
}

export interface BuiltExtension {
  manifest: ExtensionManifest;
  tools: BuiltTool<unknown>[];
  integrations: BuiltIntegration<unknown>[];
  cartridges: BuiltCartridge<unknown>[];
  ingestAdapters: BuiltIngestAdapter[];
}

// ==================== Re-exports ====================

export { z, ZodSchema, ZodError } from 'zod';
