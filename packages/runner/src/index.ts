import type {
  BuiltExtension,
  BuiltTool,
  BuiltIntegration,
  BuiltCartridge,
  BuiltIngestAdapter,
  ToolContext,
  ToolResult,
  IntegrationContext,
  IntegrationHealth,
  CartridgeContext,
  CartridgeInit,
  IngestContext,
  IngestResult,
} from '@tribble/sdk-extensions';
import {
  ToolContextBuilder,
  IntegrationContextBuilder,
  CartridgeContextBuilder,
  IngestContextBuilder,
  MockLogger,
  MockMetrics,
  MockBrainSearch,
  MockIntegrationFactory,
  ContractValidator,
} from '@tribble/sdk-test';

// ==================== Runner Types ====================

/**
 * Runner configuration.
 */
export interface RunnerConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Mock external services */
  mockExternals?: boolean;
  /** Timeout for operations in milliseconds */
  timeoutMs?: number;
  /** Enable hot reload */
  hotReload?: boolean;
}

/**
 * Runner execution context.
 */
export interface RunnerContext {
  /** Extension being run */
  extension: BuiltExtension;
  /** Configuration */
  config: RunnerConfig;
  /** Logger */
  logger: MockLogger;
  /** Metrics */
  metrics: MockMetrics;
  /** Brain search mock */
  brain: MockBrainSearch;
  /** Integration factory */
  integrations: MockIntegrationFactory;
}

/**
 * Tool invocation request.
 */
export interface ToolInvocation {
  /** Tool name */
  tool: string;
  /** Arguments */
  args: unknown;
  /** Context overrides */
  context?: Partial<ToolContext>;
}

/**
 * Tool invocation response.
 */
export interface ToolResponse {
  /** Success flag */
  success: boolean;
  /** Result if successful */
  result?: ToolResult;
  /** Error if failed */
  error?: string;
  /** Execution time in milliseconds */
  durationMs: number;
}

// ==================== Extension Runner ====================

/**
 * ExtensionRunner - Execute extensions locally in isolation.
 *
 * @example
 * ```typescript
 * const runner = new ExtensionRunner(extension);
 *
 * // Invoke a tool
 * const response = await runner.invokeTool({
 *   tool: 'crm_search',
 *   args: { query: 'test customer' },
 * });
 *
 * // Run interactive session
 * await runner.interactive();
 * ```
 */
export class ExtensionRunner {
  private extension: BuiltExtension;
  private config: RunnerConfig;
  private context: RunnerContext;

  constructor(extension: BuiltExtension, config?: RunnerConfig) {
    this.extension = extension;
    this.config = config || {};

    // Initialize runner context
    this.context = {
      extension,
      config: this.config,
      logger: new MockLogger(),
      metrics: new MockMetrics(),
      brain: new MockBrainSearch(),
      integrations: new MockIntegrationFactory(),
    };
  }

  // ==================== Tool Execution ====================

  /** Invoke a tool by name */
  async invokeTool(invocation: ToolInvocation): Promise<ToolResponse> {
    const start = Date.now();

    const tool = this.extension.tools.find(t => t.manifest.name === invocation.tool);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${invocation.tool}" not found`,
        durationMs: Date.now() - start,
      };
    }

    try {
      // Build context
      const contextBuilder = new ToolContextBuilder()
        .logger(this.context.logger)
        .metrics(this.context.metrics)
        .brain(this.context.brain)
        .integrations(this.context.integrations);

      const ctx = contextBuilder.build();
      const mergedContext: ToolContext = { ...ctx, ...invocation.context };

      // Validate args
      const validatedArgs = tool.argsSchema.parse(invocation.args);

      // Execute with timeout
      const result = await this.withTimeout(
        tool.handler(validatedArgs, mergedContext),
        this.config.timeoutMs || 30000
      );

      return {
        success: true,
        result,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      };
    }
  }

  /** Invoke multiple tools in sequence */
  async invokeToolChain(invocations: ToolInvocation[]): Promise<ToolResponse[]> {
    const responses: ToolResponse[] = [];

    for (const invocation of invocations) {
      const response = await this.invokeTool(invocation);
      responses.push(response);

      if (!response.success) {
        break;
      }
    }

    return responses;
  }

  // ==================== Integration Testing ====================

  /** Test an integration */
  async testIntegration<TClient>(
    integrationName: string,
    credentials: { accessToken?: string; apiKey?: string }
  ): Promise<{ success: boolean; health?: IntegrationHealth; error?: string }> {
    const integration = this.extension.integrations.find(i => i.manifest.name === integrationName);
    if (!integration) {
      return { success: false, error: `Integration "${integrationName}" not found` };
    }

    if (!integration.clientFactory || !integration.healthChecker) {
      return { success: false, error: 'Integration missing client factory or health checker' };
    }

    try {
      const ctx: IntegrationContext = new IntegrationContextBuilder()
        .credentials(credentials)
        .logger(this.context.logger)
        .build();

      const client = await integration.clientFactory(ctx);
      const health = await integration.healthChecker(client as TClient);

      return { success: health.status === 'healthy', health };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==================== Cartridge Testing ====================

  /** Initialize a cartridge */
  async initCartridge<TConfig>(
    cartridgeName: string,
    config?: TConfig
  ): Promise<{ success: boolean; init?: Partial<CartridgeInit>; error?: string }> {
    const cartridge = this.extension.cartridges.find(c => c.manifest.name === cartridgeName);
    if (!cartridge) {
      return { success: false, error: `Cartridge "${cartridgeName}" not found` };
    }

    try {
      const ctx: CartridgeContext = new CartridgeContextBuilder()
        .config(config as Record<string, unknown>)
        .build();

      if (cartridge.initHandler) {
        const init = await cartridge.initHandler(ctx);
        return { success: true, init };
      }

      return { success: true, init: {} };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Compile cartridge prompt with variables */
  compilePrompt(cartridgeName: string, vars: Record<string, unknown>): string {
    const cartridge = this.extension.cartridges.find(c => c.manifest.name === cartridgeName);
    if (!cartridge) {
      throw new Error(`Cartridge "${cartridgeName}" not found`);
    }

    let prompt = cartridge.manifest.promptTemplate;
    for (const [key, value] of Object.entries(vars)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      prompt = prompt.replace(pattern, String(value));
    }

    return prompt;
  }

  // ==================== Ingest Testing ====================

  /** Test an ingest adapter */
  async testIngestAdapter(
    adapterName: string,
    data: ArrayBuffer | Buffer | Uint8Array,
    filename: string
  ): Promise<{ success: boolean; result?: IngestResult; error?: string }> {
    const adapter = this.extension.ingestAdapters.find(a => a.manifest.name === adapterName);
    if (!adapter) {
      return { success: false, error: `Ingest adapter "${adapterName}" not found` };
    }

    try {
      const extension = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
      const ctx: IngestContext = new IngestContextBuilder()
        .file(filename, extension, 'application/octet-stream', data.byteLength)
        .logger(this.context.logger)
        .build();

      const result = await adapter.handler(data, ctx);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==================== Validation ====================

  /** Validate extension against platform contracts */
  validate(): { valid: boolean; errors: string[] } {
    const validator = new ContractValidator(this.extension);
    return validator.validate();
  }

  // ==================== Mock Configuration ====================

  /** Configure brain search mock responses */
  mockBrainSearch(results: Array<{ content: string; score: number; metadata?: Record<string, unknown> }>): this {
    this.context.brain.setResults(
      results.map(r => ({
        ...r,
        metadata: r.metadata || {},
      }))
    );
    return this;
  }

  /** Register a mock integration client */
  mockIntegration<T>(name: string, client: T): this {
    this.context.integrations.register(name, client);
    return this;
  }

  /** Get captured logs */
  getLogs(): Array<{ level: string; message: string; data?: Record<string, unknown> }> {
    return this.context.logger.logs;
  }

  /** Get captured metrics */
  getMetrics(): Array<{ type: string; name: string; value: number; tags?: Record<string, string> }> {
    return this.context.metrics.metrics;
  }

  /** Clear all captured data */
  reset(): this {
    this.context.logger.clear();
    this.context.metrics.clear();
    return this;
  }

  // ==================== Interactive Mode ====================

  /** Start interactive REPL mode */
  async interactive(): Promise<void> {
    console.log(`\n Tribble Extension Runner`);
    console.log(`Extension: ${this.extension.manifest.name} v${this.extension.manifest.version}`);
    console.log(`${'='.repeat(50)}\n`);

    console.log('Available tools:');
    for (const tool of this.extension.tools) {
      console.log(`  - ${tool.manifest.name}: ${tool.manifest.description}`);
    }

    console.log('\nAvailable integrations:');
    for (const integration of this.extension.integrations) {
      console.log(`  - ${integration.manifest.name}: ${integration.manifest.displayName}`);
    }

    console.log('\nAvailable cartridges:');
    for (const cartridge of this.extension.cartridges) {
      console.log(`  - ${cartridge.manifest.name}: ${cartridge.manifest.displayName}`);
    }

    console.log('\nAvailable ingest adapters:');
    for (const adapter of this.extension.ingestAdapters) {
      console.log(`  - ${adapter.manifest.name}: ${adapter.manifest.displayName}`);
    }

    console.log('\nCommands:');
    console.log('  tool <name> <json-args>  - Invoke a tool');
    console.log('  validate                 - Validate extension');
    console.log('  logs                     - Show captured logs');
    console.log('  metrics                  - Show captured metrics');
    console.log('  exit                     - Exit runner\n');

    // In a real implementation, this would use readline or similar
    console.log('(Interactive mode not fully implemented - use programmatic API)');
  }

  // ==================== Helpers ====================

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

// ==================== Factory Functions ====================

/**
 * Create runner for an extension.
 */
export function createRunner(extension: BuiltExtension, config?: RunnerConfig): ExtensionRunner {
  return new ExtensionRunner(extension, config);
}

/**
 * Load and run extension from file.
 */
export async function runExtensionFile(filePath: string, config?: RunnerConfig): Promise<ExtensionRunner> {
  const module = await import(filePath);
  const extension = module.default as BuiltExtension;

  if (!extension || !extension.manifest) {
    throw new Error(`File "${filePath}" does not export a valid extension`);
  }

  return createRunner(extension, config);
}

// ==================== Exports ====================

export {
  ToolContextBuilder,
  IntegrationContextBuilder,
  CartridgeContextBuilder,
  IngestContextBuilder,
  MockLogger,
  MockMetrics,
  MockBrainSearch,
  MockIntegrationFactory,
  ContractValidator,
} from '@tribble/sdk-test';

export type {
  BuiltExtension,
  BuiltTool,
  BuiltIntegration,
  BuiltCartridge,
  BuiltIngestAdapter,
  ToolContext,
  ToolResult,
  IntegrationContext,
  IntegrationHealth,
  CartridgeContext,
  CartridgeInit,
  IngestContext,
  IngestResult,
} from '@tribble/sdk-extensions';
