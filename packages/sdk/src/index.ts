import type { TribbleConfig } from '@tribble/sdk-core';
import { createRequestId } from '@tribble/sdk-core';
import { AgentClient } from '@tribble/sdk-agent';
import { IngestClient } from '@tribble/sdk-ingest';
import { WorkflowsClient } from '@tribble/sdk-workflows';
import { StructuredAgent } from '@tribble/sdk-structured';
import { CacheManager, SyncQueue, MemoryStorage as OfflineMemoryStorage } from '@tribble/sdk-offline';
import { ConversationManager } from '@tribble/sdk-conversations';
import { createTelemetry, type Telemetry, type TelemetryOptions } from '@tribble/sdk-telemetry';
import { PromptRegistry } from '@tribble/sdk-prompts';
import { RateLimiter, parseRateLimit } from '@tribble/sdk-batch';

// ==================== Extended Config ====================

export interface TribbleSDKConfig extends TribbleConfig {
  /** Offline and caching configuration */
  offline?: {
    enabled?: boolean;
    storage?: import('@tribble/sdk-offline').StorageAdapter;
    syncOnReconnect?: boolean;
  };
  /** Telemetry configuration */
  observability?: TelemetryOptions;
  /** Rate limiting configuration */
  rateLimit?: string; // e.g., "100/minute"
  /** Prompts endpoint for remote sync */
  promptsEndpoint?: string;
}

export interface TribbleSDK {
  /** Agent client for chat */
  agent: AgentClient;
  /** Structured output agent */
  structured: StructuredAgent;
  /** Document ingestion client */
  ingest: IngestClient;
  /** Workflow triggers */
  workflows: WorkflowsClient;
  /** Conversation manager */
  conversations: ConversationManager;
  /** Cache manager */
  cache: CacheManager;
  /** Sync queue for offline operations */
  sync: SyncQueue;
  /** Prompt registry */
  prompts: PromptRegistry;
  /** Telemetry (if configured) */
  telemetry?: Telemetry;
  /** Original config */
  config: TribbleSDKConfig;
}

/**
 * Create a fully-configured Tribble SDK instance with all capabilities.
 *
 * @example
 * ```typescript
 * const tribble = createTribble({
 *   agent: {
 *     baseUrl: 'https://api.tribble.com',
 *     token: 'your-token',
 *     email: 'user@example.com'
 *   },
 *   ingest: {
 *     baseUrl: 'https://ingest.tribble.com',
 *     tokenProvider: async () => 'your-token'
 *   },
 *   workflows: {
 *     endpoint: 'https://workflows.tribble.com/invoke',
 *     signingSecret: 'your-secret'
 *   },
 *   offline: { enabled: true },
 *   observability: { serviceName: 'my-app' },
 *   rateLimit: '100/minute'
 * });
 *
 * // Chat with structured output
 * const result = await tribble.structured.generate({
 *   prompt: 'List top 3 tasks',
 *   schema: TaskSchema,
 * });
 *
 * // Manage conversations
 * const conv = tribble.conversations.create({ id: 'user-123' });
 * await conv.send('Hello!');
 *
 * // Use cached data
 * const data = await tribble.cache.getOrFetch('key', fetcher, { ttl: '1h' });
 * ```
 */
export function createTribble(config: TribbleSDKConfig): TribbleSDK {
  const propagate = config.telemetry?.propagateTraceHeader || 'X-Tribble-Request-Id';
  const requestId = createRequestId();

  // Core clients
  const agent = new AgentClient({
    ...config.agent,
    defaultHeaders: { ...(config.agent.defaultHeaders || {}), [propagate]: requestId },
  });

  const ingest = config.ingest
    ? new IngestClient({ ...config.ingest, defaultHeaders: { ...(config.ingest.defaultHeaders || {}), [propagate]: requestId } })
    : undefined;

  const workflows = config.workflows
    ? new WorkflowsClient({ ...config.workflows, defaultHeaders: { ...(config.workflows.defaultHeaders || {}), [propagate]: requestId } })
    : undefined;

  // Structured output
  const structured = new StructuredAgent(agent);

  // Offline storage
  const storage = config.offline?.storage || new OfflineMemoryStorage();

  // Cache manager
  const cache = new CacheManager(storage);

  // Sync queue
  const sync = new SyncQueue(storage, {
    autoSync: config.offline?.syncOnReconnect ?? true,
  });

  // Conversation manager
  const conversations = new ConversationManager(agent, storage);

  // Prompt registry
  const prompts = new PromptRegistry({
    storage,
    remoteEndpoint: config.promptsEndpoint,
  });

  // Telemetry (if configured)
  let telemetry: Telemetry | undefined;
  if (config.observability) {
    telemetry = createTelemetry(config.observability);
  }

  // Rate limiting wrapper (optional)
  if (config.rateLimit) {
    const limiter = new RateLimiter(parseRateLimit(config.rateLimit));
    const originalChat = agent.chat.bind(agent);
    agent.chat = async (opts) => {
      await limiter.acquire();
      return originalChat(opts);
    };
  }

  return {
    agent,
    structured,
    ingest: ingest!,
    workflows: workflows!,
    conversations,
    cache,
    sync,
    prompts,
    telemetry,
    config,
  };
}

export type { TribbleConfig };

// ==================== Core Package Re-exports ====================
export { AgentClient } from '@tribble/sdk-agent';
export { IngestClient } from '@tribble/sdk-ingest';
export { WorkflowsClient } from '@tribble/sdk-workflows';
export { TribbleAuth, InMemoryStorage, FileStorage } from '@tribble/sdk-auth';
export { UploadQueue } from '@tribble/sdk-queue';
export { verifySignature, createWebhookApp } from '@tribble/sdk-events';

// ==================== Enhanced Package Re-exports ====================

// Structured output
export {
  StructuredAgent,
  createStructuredAgent,
  StructuredOutputError,
  CommonSchemas,
  z,
  type StructuredOptions,
  type StructuredResult,
} from '@tribble/sdk-structured';

// Offline & caching
export {
  CacheManager,
  SyncQueue,
  MemoryStorage as OfflineMemoryStorage,
  FileStorage as OfflineFileStorage,
  IndexedDBStorage,
  parseDuration,
  createStorage,
  withOffline,
  type StorageAdapter,
  type CacheOptions,
  type CacheEntry,
  type QueuedOperation,
  type SyncStatus,
} from '@tribble/sdk-offline';

// Conversations
export {
  Conversation,
  ConversationManager,
  createConversation,
  createConversationManager,
  type Message,
  type ConversationOptions,
  type ConversationSummary,
} from '@tribble/sdk-conversations';

// Telemetry
export {
  createTelemetry,
  Tracer,
  MetricsCollector,
  Logger,
  UsageTracker,
  ConsoleExporter,
  OTLPExporter,
  type Telemetry,
  type TelemetryOptions,
  type Span,
  type SpanHandle,
  type Metric,
  type LogLevel,
} from '@tribble/sdk-telemetry';

// Prompts
export {
  PromptRegistry,
  PromptBuilder,
  createPromptRegistry,
  createPromptBuilder,
  CommonPrompts,
  type PromptDefinition,
  type PromptVersion,
  type ExperimentConfig,
  type PromptGetOptions,
  type PromptResult,
} from '@tribble/sdk-prompts';

// Batch processing
export {
  BatchProcessor,
  RateLimiter,
  Semaphore,
  CircuitBreaker,
  Debouncer,
  Throttler,
  createBatchProcessor,
  createRateLimiter,
  createSemaphore,
  createCircuitBreaker,
  debounce,
  throttle,
  parseRateLimit,
  processWithLimit,
  CircuitOpenError,
  type BatchOptions,
  type BatchResult,
  type RateLimitConfig,
  type CircuitState,
} from '@tribble/sdk-batch';
