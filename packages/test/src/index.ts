import { z } from 'zod';
import type {
  BuiltTool,
  BuiltIntegration,
  BuiltCartridge,
  BuiltIngestAdapter,
  BuiltExtension,
  ToolContext,
  ToolResult,
  IntegrationContext,
  IntegrationHealth,
  CartridgeContext,
  CartridgeInit,
  IngestContext,
  IngestResult,
  SearchResult,
  Citation,
  LoggerService,
  MetricsService,
  IntegrationClientFactory,
  BrainSearchService,
  IntegrationCredentials,
} from '@tribble/sdk-extensions';

// ==================== Test Context Builders ====================

/**
 * Mock logger that captures all log calls.
 */
export class MockLogger implements LoggerService {
  readonly logs: Array<{ level: string; message: string; data?: Record<string, unknown> }> = [];

  debug(message: string, data?: Record<string, unknown>): void {
    this.logs.push({ level: 'debug', message, data });
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logs.push({ level: 'info', message, data });
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logs.push({ level: 'warn', message, data });
  }

  error(message: string, _error?: Error, data?: Record<string, unknown>): void {
    this.logs.push({ level: 'error', message, data });
  }

  clear(): void {
    this.logs.length = 0;
  }

  hasLog(level: string, messagePattern: string | RegExp): boolean {
    return this.logs.some(log => {
      if (log.level !== level) return false;
      if (typeof messagePattern === 'string') {
        return log.message.includes(messagePattern);
      }
      return messagePattern.test(log.message);
    });
  }
}

/**
 * Mock metrics collector.
 */
export class MockMetrics implements MetricsService {
  readonly metrics: Array<{
    type: 'increment' | 'gauge' | 'histogram' | 'timing';
    name: string;
    value: number;
    tags?: Record<string, string>;
  }> = [];

  increment(metric: string, value: number = 1, tags?: Record<string, string>): void {
    this.metrics.push({ type: 'increment', name: metric, value, tags });
  }

  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({ type: 'gauge', name: metric, value, tags });
  }

  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({ type: 'histogram', name: metric, value, tags });
  }

  timing(metric: string, durationMs: number, tags?: Record<string, string>): void {
    this.metrics.push({ type: 'timing', name: metric, value: durationMs, tags });
  }

  clear(): void {
    this.metrics.length = 0;
  }

  getMetric(name: string): number | undefined {
    const metric = this.metrics.find(m => m.name === name);
    return metric?.value;
  }
}

/**
 * Mock brain search service.
 */
export class MockBrainSearch implements BrainSearchService {
  private _results: SearchResult[] = [];

  setResults(results: SearchResult[]): void {
    this._results = results;
  }

  async search(_query: string, _options?: { limit?: number }): Promise<SearchResult[]> {
    return this._results;
  }
}

/**
 * Mock integration client factory.
 */
export class MockIntegrationFactory implements IntegrationClientFactory {
  private _clients: Map<string, unknown> = new Map();

  register<T>(name: string, client: T): void {
    this._clients.set(name, client);
  }

  async get<T>(integrationName: string): Promise<T> {
    const client = this._clients.get(integrationName);
    if (!client) {
      throw new Error(`Integration "${integrationName}" not found in mock factory`);
    }
    return client as T;
  }
}

/**
 * Builder for creating mock ToolContext.
 */
export class ToolContextBuilder {
  private _schema: string = 'test_schema';
  private _clientId: number = 1;
  private _userId?: number;
  private _conversationId?: string;
  private _logger: LoggerService = new MockLogger();
  private _metrics: MetricsService = new MockMetrics();
  private _brain: BrainSearchService = new MockBrainSearch();
  private _integrations: IntegrationClientFactory = new MockIntegrationFactory();
  private _signal?: AbortSignal;

  schema(schema: string): this {
    this._schema = schema;
    return this;
  }

  clientId(id: number): this {
    this._clientId = id;
    return this;
  }

  userId(id: number): this {
    this._userId = id;
    return this;
  }

  conversationId(id: string): this {
    this._conversationId = id;
    return this;
  }

  logger(logger: LoggerService): this {
    this._logger = logger;
    return this;
  }

  metrics(metrics: MetricsService): this {
    this._metrics = metrics;
    return this;
  }

  brain(brain: BrainSearchService): this {
    this._brain = brain;
    return this;
  }

  integrations(factory: IntegrationClientFactory): this {
    this._integrations = factory;
    return this;
  }

  withAbortSignal(signal: AbortSignal): this {
    this._signal = signal;
    return this;
  }

  build(): ToolContext {
    return {
      schema: this._schema,
      clientId: this._clientId,
      userId: this._userId,
      conversationId: this._conversationId,
      services: {
        brain: this._brain,
        integrations: this._integrations,
        logger: this._logger,
        metrics: this._metrics,
      },
      signal: this._signal,
    };
  }
}

/**
 * Builder for creating mock IntegrationContext.
 */
export class IntegrationContextBuilder {
  private _schema: string = 'test_schema';
  private _clientId: number = 1;
  private _userId?: number;
  private _credentials: IntegrationCredentials = {};
  private _logger: LoggerService = new MockLogger();

  schema(schema: string): this {
    this._schema = schema;
    return this;
  }

  clientId(id: number): this {
    this._clientId = id;
    return this;
  }

  userId(id: number): this {
    this._userId = id;
    return this;
  }

  credentials(creds: IntegrationCredentials): this {
    this._credentials = creds;
    return this;
  }

  accessToken(token: string): this {
    this._credentials.accessToken = token;
    return this;
  }

  apiKey(key: string): this {
    this._credentials.apiKey = key;
    return this;
  }

  logger(logger: LoggerService): this {
    this._logger = logger;
    return this;
  }

  build(): IntegrationContext {
    return {
      schema: this._schema,
      clientId: this._clientId,
      userId: this._userId,
      credentials: this._credentials,
      logger: this._logger,
    };
  }
}

/**
 * Builder for creating mock CartridgeContext.
 */
export class CartridgeContextBuilder {
  private _schema: string = 'test_schema';
  private _clientId: number = 1;
  private _user?: { id: number; email: string; name?: string };
  private _conversationId?: string;
  private _config?: Record<string, unknown>;
  private _templateVars?: Record<string, unknown>;

  schema(schema: string): this {
    this._schema = schema;
    return this;
  }

  clientId(id: number): this {
    this._clientId = id;
    return this;
  }

  user(user: { id: number; email: string; name?: string }): this {
    this._user = user;
    return this;
  }

  conversationId(id: string): this {
    this._conversationId = id;
    return this;
  }

  config(config: Record<string, unknown>): this {
    this._config = config;
    return this;
  }

  templateVars(vars: Record<string, unknown>): this {
    this._templateVars = vars;
    return this;
  }

  build(): CartridgeContext {
    return {
      schema: this._schema,
      clientId: this._clientId,
      user: this._user,
      conversationId: this._conversationId,
      config: this._config,
      templateVars: this._templateVars,
    };
  }
}

/**
 * Builder for creating mock IngestContext.
 */
export class IngestContextBuilder {
  private _schema: string = 'test_schema';
  private _clientId: number = 1;
  private _fileName: string = 'test.txt';
  private _extension: string = '.txt';
  private _mimeType: string = 'text/plain';
  private _sizeBytes: number = 1024;
  private _metadata: Record<string, unknown> = {};
  private _logger: LoggerService = new MockLogger();
  private _signal?: AbortSignal;

  schema(schema: string): this {
    this._schema = schema;
    return this;
  }

  clientId(id: number): this {
    this._clientId = id;
    return this;
  }

  file(name: string, extension: string, mimeType: string, sizeBytes: number): this {
    this._fileName = name;
    this._extension = extension;
    this._mimeType = mimeType;
    this._sizeBytes = sizeBytes;
    return this;
  }

  metadata(meta: Record<string, unknown>): this {
    this._metadata = meta;
    return this;
  }

  logger(logger: LoggerService): this {
    this._logger = logger;
    return this;
  }

  withAbortSignal(signal: AbortSignal): this {
    this._signal = signal;
    return this;
  }

  build(): IngestContext {
    return {
      schema: this._schema,
      clientId: this._clientId,
      file: {
        name: this._fileName,
        extension: this._extension,
        mimeType: this._mimeType,
        sizeBytes: this._sizeBytes,
      },
      metadata: this._metadata,
      logger: this._logger,
      signal: this._signal,
    };
  }
}

// ==================== Test Harnesses ====================

/**
 * ToolTestHarness - Test runner for tool extensions.
 *
 * @example
 * ```typescript
 * const harness = new ToolTestHarness(crmSearchTool);
 *
 * // Run a test
 * const result = await harness
 *   .withContext(ctx => ctx.userId(123))
 *   .invoke({ query: 'test', limit: 10 });
 *
 * // Assert results
 * harness.assertSuccess(result);
 * harness.assertContentContains(result, 'expected');
 * ```
 */
export class ToolTestHarness<TArgs> {
  private tool: BuiltTool<TArgs>;
  private contextBuilder: ToolContextBuilder;
  private invocations: Array<{ args: TArgs; result: ToolResult; durationMs: number }> = [];

  constructor(tool: BuiltTool<TArgs>) {
    this.tool = tool;
    this.contextBuilder = new ToolContextBuilder();
  }

  /** Configure the test context */
  withContext(configurator: (builder: ToolContextBuilder) => ToolContextBuilder): this {
    this.contextBuilder = configurator(this.contextBuilder);
    return this;
  }

  /** Get mock logger from context */
  get logger(): MockLogger {
    const ctx = this.contextBuilder.build();
    return ctx.services.logger as MockLogger;
  }

  /** Get mock metrics from context */
  get metrics(): MockMetrics {
    const ctx = this.contextBuilder.build();
    return ctx.services.metrics as MockMetrics;
  }

  /** Invoke the tool with arguments */
  async invoke(args: TArgs): Promise<ToolResult> {
    // Validate arguments against schema
    const validatedArgs = this.tool.argsSchema.parse(args);

    const start = Date.now();
    const context = this.contextBuilder.build();
    const result = await this.tool.handler(validatedArgs, context);
    const durationMs = Date.now() - start;

    this.invocations.push({ args, result, durationMs });
    return result;
  }

  /** Get invocation history */
  getInvocations(): Array<{ args: TArgs; result: ToolResult; durationMs: number }> {
    return [...this.invocations];
  }

  /** Clear invocation history */
  clearHistory(): void {
    this.invocations.length = 0;
  }

  // ==================== Assertions ====================

  /** Assert the result has content */
  assertSuccess(result: ToolResult): void {
    if (!result.content) {
      throw new Error('Tool result has no content');
    }
  }

  /** Assert content contains substring */
  assertContentContains(result: ToolResult, substring: string): void {
    if (!result.content.includes(substring)) {
      throw new Error(`Expected content to contain "${substring}", got: ${result.content}`);
    }
  }

  /** Assert content matches pattern */
  assertContentMatches(result: ToolResult, pattern: RegExp): void {
    if (!pattern.test(result.content)) {
      throw new Error(`Expected content to match ${pattern}, got: ${result.content}`);
    }
  }

  /** Assert result has citations */
  assertHasCitations(result: ToolResult, minCount: number = 1): void {
    if (!result.citations || result.citations.length < minCount) {
      throw new Error(`Expected at least ${minCount} citations, got: ${result.citations?.length || 0}`);
    }
  }

  /** Assert result has data */
  assertHasData(result: ToolResult): void {
    if (result.data === undefined) {
      throw new Error('Expected result to have data');
    }
  }

  /** Assert content is valid JSON */
  assertValidJson(result: ToolResult): unknown {
    try {
      return JSON.parse(result.content);
    } catch {
      throw new Error(`Expected valid JSON content, got: ${result.content}`);
    }
  }

  /** Assert content matches Zod schema */
  assertMatchesSchema<T>(result: ToolResult, schema: z.ZodSchema<T>): T {
    const json = this.assertValidJson(result);
    return schema.parse(json);
  }
}

/**
 * IntegrationTestHarness - Test runner for integration extensions.
 */
export class IntegrationTestHarness<TClient> {
  private integration: BuiltIntegration<TClient>;
  private contextBuilder: IntegrationContextBuilder;

  constructor(integration: BuiltIntegration<TClient>) {
    this.integration = integration;
    this.contextBuilder = new IntegrationContextBuilder();
  }

  withContext(configurator: (builder: IntegrationContextBuilder) => IntegrationContextBuilder): this {
    this.contextBuilder = configurator(this.contextBuilder);
    return this;
  }

  /** Create the integration client */
  async createClient(): Promise<TClient> {
    if (!this.integration.clientFactory) {
      throw new Error('Integration has no client factory');
    }
    const context = this.contextBuilder.build();
    return this.integration.clientFactory(context);
  }

  /** Check integration health */
  async checkHealth(): Promise<IntegrationHealth> {
    if (!this.integration.healthChecker) {
      throw new Error('Integration has no health checker');
    }
    const client = await this.createClient();
    return this.integration.healthChecker(client);
  }

  /** Assert health is healthy */
  assertHealthy(health: IntegrationHealth): void {
    if (health.status !== 'healthy') {
      throw new Error(`Expected healthy status, got: ${health.status} - ${health.message}`);
    }
  }
}

/**
 * CartridgeTestHarness - Test runner for cartridge extensions.
 */
export class CartridgeTestHarness<TConfig> {
  private cartridge: BuiltCartridge<TConfig>;
  private contextBuilder: CartridgeContextBuilder;

  constructor(cartridge: BuiltCartridge<TConfig>) {
    this.cartridge = cartridge;
    this.contextBuilder = new CartridgeContextBuilder();
  }

  withContext(configurator: (builder: CartridgeContextBuilder) => CartridgeContextBuilder): this {
    this.contextBuilder = configurator(this.contextBuilder);
    return this;
  }

  /** Initialize the cartridge */
  async init(): Promise<Partial<CartridgeInit>> {
    if (!this.cartridge.initHandler) {
      return {};
    }
    const context = this.contextBuilder.build();
    return this.cartridge.initHandler(context);
  }

  /** Initialize for new conversation */
  async newConversation(): Promise<Partial<CartridgeInit>> {
    if (!this.cartridge.newConversationHandler) {
      return {};
    }
    const context = this.contextBuilder.build();
    return this.cartridge.newConversationHandler(context);
  }

  /** Compile the prompt template with variables */
  compilePrompt(vars: Record<string, unknown>): string {
    let prompt = this.cartridge.manifest.promptTemplate;

    // Simple Handlebars-like variable replacement
    for (const [key, value] of Object.entries(vars)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      prompt = prompt.replace(pattern, String(value));
    }

    return prompt;
  }

  /** Assert prompt contains text */
  assertPromptContains(text: string): void {
    if (!this.cartridge.manifest.promptTemplate.includes(text)) {
      throw new Error(`Expected prompt template to contain "${text}"`);
    }
  }

  /** Assert cartridge has tool */
  assertHasTool(toolName: string): void {
    if (!this.cartridge.manifest.availableTools.includes(toolName)) {
      throw new Error(`Expected cartridge to have tool "${toolName}"`);
    }
  }
}

/**
 * IngestAdapterTestHarness - Test runner for ingest adapter extensions.
 */
export class IngestAdapterTestHarness {
  private adapter: BuiltIngestAdapter;
  private contextBuilder: IngestContextBuilder;

  constructor(adapter: BuiltIngestAdapter) {
    this.adapter = adapter;
    this.contextBuilder = new IngestContextBuilder();
  }

  withContext(configurator: (builder: IngestContextBuilder) => IngestContextBuilder): this {
    this.contextBuilder = configurator(this.contextBuilder);
    return this;
  }

  /** Process file data */
  async process(data: ArrayBuffer | Buffer | Uint8Array): Promise<IngestResult> {
    const context = this.contextBuilder.build();
    return this.adapter.handler(data, context);
  }

  /** Process text content */
  async processText(content: string): Promise<IngestResult> {
    const encoder = new TextEncoder();
    return this.process(encoder.encode(content));
  }

  /** Assert result has chunks */
  assertHasChunks(result: IngestResult, minCount: number = 1): void {
    if (result.chunks.length < minCount) {
      throw new Error(`Expected at least ${minCount} chunks, got: ${result.chunks.length}`);
    }
  }

  /** Assert chunk content */
  assertChunkContains(result: IngestResult, chunkIndex: number, text: string): void {
    const chunk = result.chunks[chunkIndex];
    if (!chunk) {
      throw new Error(`Chunk ${chunkIndex} does not exist`);
    }
    if (!chunk.content.includes(text)) {
      throw new Error(`Expected chunk ${chunkIndex} to contain "${text}"`);
    }
  }

  /** Assert adapter supports extension */
  assertSupportsExtension(ext: string): void {
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    if (!this.adapter.manifest.extensions.includes(normalizedExt)) {
      throw new Error(`Expected adapter to support extension "${ext}"`);
    }
  }
}

// ==================== Extension Test Suite ====================

/**
 * TestResult for a single test case.
 */
export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

/**
 * TestSuiteResult for a complete test suite.
 */
export interface TestSuiteResult {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  totalDurationMs: number;
}

/**
 * ExtensionTestSuite - Comprehensive test runner for extension bundles.
 *
 * @example
 * ```typescript
 * const suite = new ExtensionTestSuite(extension);
 *
 * suite.test('CRM search returns results', async (ctx) => {
 *   const tool = ctx.getTool('crm_search');
 *   const result = await tool.invoke({ query: 'test' });
 *   tool.assertContentContains(result, 'customer');
 * });
 *
 * const results = await suite.run();
 * console.log(suite.formatResults(results));
 * ```
 */
export class ExtensionTestSuite {
  private extension: BuiltExtension;
  private tests: Array<{
    name: string;
    fn: (ctx: TestContext) => Promise<void>;
  }> = [];

  constructor(extension: BuiltExtension) {
    this.extension = extension;
  }

  /** Add a test case */
  test(name: string, fn: (ctx: TestContext) => Promise<void>): this {
    this.tests.push({ name, fn });
    return this;
  }

  /** Run all tests */
  async run(): Promise<TestSuiteResult> {
    const results: TestResult[] = [];
    const suiteStart = Date.now();

    for (const test of this.tests) {
      const testStart = Date.now();
      const ctx = new TestContext(this.extension);

      try {
        await test.fn(ctx);
        results.push({
          name: test.name,
          passed: true,
          durationMs: Date.now() - testStart,
        });
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error instanceof Error ? error : new Error(String(error)),
          durationMs: Date.now() - testStart,
        });
      }
    }

    return {
      name: this.extension.manifest.name,
      results,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      totalDurationMs: Date.now() - suiteStart,
    };
  }

  /** Format test results for console output */
  formatResults(results: TestSuiteResult): string {
    const lines: string[] = [
      `\n Extension Test Results: ${results.name}`,
      `${'='.repeat(50)}`,
    ];

    for (const result of results.results) {
      const status = result.passed ? '[PASS]' : '[FAIL]';
      const duration = `(${result.durationMs}ms)`;
      lines.push(`${status} ${result.name} ${duration}`);

      if (result.error) {
        lines.push(`       Error: ${result.error.message}`);
      }
    }

    lines.push(`${'='.repeat(50)}`);
    lines.push(`Total: ${results.passed} passed, ${results.failed} failed (${results.totalDurationMs}ms)`);
    lines.push('');

    return lines.join('\n');
  }
}

/**
 * Test context provided to each test case.
 */
export class TestContext {
  private extension: BuiltExtension;

  constructor(extension: BuiltExtension) {
    this.extension = extension;
  }

  /** Get tool harness by name */
  getTool<TArgs = unknown>(name: string): ToolTestHarness<TArgs> {
    const tool = this.extension.tools.find(t => t.manifest.name === name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in extension`);
    }
    return new ToolTestHarness(tool as BuiltTool<TArgs>);
  }

  /** Get integration harness by name */
  getIntegration<TClient = unknown>(name: string): IntegrationTestHarness<TClient> {
    const integration = this.extension.integrations.find(i => i.manifest.name === name);
    if (!integration) {
      throw new Error(`Integration "${name}" not found in extension`);
    }
    return new IntegrationTestHarness(integration as BuiltIntegration<TClient>);
  }

  /** Get cartridge harness by name */
  getCartridge<TConfig = unknown>(name: string): CartridgeTestHarness<TConfig> {
    const cartridge = this.extension.cartridges.find(c => c.manifest.name === name);
    if (!cartridge) {
      throw new Error(`Cartridge "${name}" not found in extension`);
    }
    return new CartridgeTestHarness(cartridge as BuiltCartridge<TConfig>);
  }

  /** Get ingest adapter harness by name */
  getIngestAdapter(name: string): IngestAdapterTestHarness {
    const adapter = this.extension.ingestAdapters.find(a => a.manifest.name === name);
    if (!adapter) {
      throw new Error(`Ingest adapter "${name}" not found in extension`);
    }
    return new IngestAdapterTestHarness(adapter);
  }

  /** Get the extension manifest */
  get manifest() {
    return this.extension.manifest;
  }
}

// ==================== Contract Testing ====================

/**
 * ContractValidator - Validates extension against platform contracts.
 */
export class ContractValidator {
  private extension: BuiltExtension;
  private errors: string[] = [];

  constructor(extension: BuiltExtension) {
    this.extension = extension;
  }

  /** Validate the entire extension */
  validate(): { valid: boolean; errors: string[] } {
    this.errors = [];

    this.validateManifest();
    this.validateTools();
    this.validateIntegrations();
    this.validateCartridges();
    this.validateIngestAdapters();

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  private validateManifest(): void {
    const m = this.extension.manifest;

    if (!m.name || !/^[a-z0-9-]+$/.test(m.name)) {
      this.errors.push('Extension name must be lowercase alphanumeric with hyphens');
    }

    if (!m.version || !/^\d+\.\d+\.\d+/.test(m.version)) {
      this.errors.push('Extension version must be semantic versioning (e.g., 1.0.0)');
    }

    if (!m.author) {
      this.errors.push('Extension must have an author');
    }

    if (!m.platformVersion) {
      this.errors.push('Extension must specify platformVersion');
    }
  }

  private validateTools(): void {
    for (const tool of this.extension.tools) {
      if (!tool.manifest.name || !/^[a-z_][a-z0-9_]*$/.test(tool.manifest.name)) {
        this.errors.push(`Tool "${tool.manifest.name}" name must be snake_case`);
      }

      if (!tool.manifest.description) {
        this.errors.push(`Tool "${tool.manifest.name}" must have a description`);
      }

      if (!tool.handler) {
        this.errors.push(`Tool "${tool.manifest.name}" must have a handler`);
      }
    }
  }

  private validateIntegrations(): void {
    for (const integration of this.extension.integrations) {
      if (!integration.manifest.name || !/^[a-z0-9-]+$/.test(integration.manifest.name)) {
        this.errors.push(`Integration "${integration.manifest.name}" name must be lowercase alphanumeric`);
      }

      if (integration.manifest.type === 'oauth2' && !integration.manifest.oauth2Config) {
        this.errors.push(`OAuth2 integration "${integration.manifest.name}" must have oauth2Config`);
      }

      if (integration.manifest.type === 'api_key' && !integration.manifest.apiKeyConfig) {
        this.errors.push(`API key integration "${integration.manifest.name}" must have apiKeyConfig`);
      }
    }
  }

  private validateCartridges(): void {
    for (const cartridge of this.extension.cartridges) {
      if (!cartridge.manifest.name || !/^[a-z0-9-]+$/.test(cartridge.manifest.name)) {
        this.errors.push(`Cartridge "${cartridge.manifest.name}" name must be lowercase alphanumeric`);
      }

      if (!cartridge.manifest.promptTemplate) {
        this.errors.push(`Cartridge "${cartridge.manifest.name}" must have a prompt template`);
      }

      if (cartridge.manifest.availableTools.length === 0) {
        this.errors.push(`Cartridge "${cartridge.manifest.name}" should have at least one tool`);
      }
    }
  }

  private validateIngestAdapters(): void {
    for (const adapter of this.extension.ingestAdapters) {
      if (!adapter.manifest.name) {
        this.errors.push('Ingest adapter must have a name');
      }

      if (adapter.manifest.extensions.length === 0 && adapter.manifest.mimeTypes.length === 0) {
        this.errors.push(`Ingest adapter "${adapter.manifest.name}" must support at least one extension or MIME type`);
      }

      if (!adapter.handler) {
        this.errors.push(`Ingest adapter "${adapter.manifest.name}" must have a handler`);
      }
    }
  }
}

// ==================== Exports ====================

export {
  BuiltTool,
  BuiltIntegration,
  BuiltCartridge,
  BuiltIngestAdapter,
  BuiltExtension,
  ToolContext,
  ToolResult,
  IntegrationContext,
  IntegrationHealth,
  CartridgeContext,
  CartridgeInit,
  IngestContext,
  IngestResult,
  SearchResult,
  Citation,
} from '@tribble/sdk-extensions';
