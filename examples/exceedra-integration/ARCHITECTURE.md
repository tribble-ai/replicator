# exceedra Integration - Architecture Guide

This document explains the architectural patterns and design decisions in the exceedra integration example.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    exceedra Integration App                        │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    index.ts (CLI Entry)                     │  │
│  │  • Command routing (sync, schedule, validate)              │  │
│  │  • Configuration loading                                   │  │
│  │  • Tribble client creation                                 │  │
│  │  • Connector initialization                                │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                         │
│                         ▼                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              exceedraConnector (Core Logic)                  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ pull()                                                │  │  │
│  │  │  • Loop through data sources                         │  │  │
│  │  │  • Fetch with pagination                             │  │  │
│  │  │  • Rate limiting                                     │  │  │
│  │  │  • Transform data                                    │  │  │
│  │  │  • Upload to Tribble                                 │  │  │
│  │  │  • Update checkpoints                                │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ validate()                                            │  │  │
│  │  │  • Test API connectivity                             │  │  │
│  │  │  • Verify authentication                             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └──────────┬─────────────────────────┬───────────────────────┘  │
│             │                         │                           │
│             ▼                         ▼                           │
│  ┌─────────────────────┐   ┌────────────────────────┐           │
│  │   RestTransport     │   │   exceedraTransformer   │           │
│  │  • HTTP requests    │   │  • Data mapping        │           │
│  │  • Pagination       │   │  • Enrichment          │           │
│  │  • Auth injection   │   │  • Metadata extraction │           │
│  └─────────┬───────────┘   └────────────────────────┘           │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────┐                                         │
│  │   OAuth2Provider    │                                         │
│  │  • Token refresh    │                                         │
│  │  • Token caching    │                                         │
│  └─────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   exceedra REST API   │
              │  /api/v1/documents   │
              │  /api/v1/products    │
              │  /api/v1/retailers   │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Tribble Ingest API  │
              │  /api/upload         │
              └──────────────────────┘
```

## Component Responsibilities

### 1. index.ts (CLI Entry Point)

**Purpose**: Application entry point and CLI interface

**Responsibilities**:
- Parse command-line arguments
- Load and validate configuration
- Create Tribble client
- Instantiate and initialize connector
- Handle graceful shutdown
- Display results and errors

**Key Patterns**:
- Command pattern for CLI routing
- Factory pattern for client creation
- Error boundary at top level

```typescript
async function runSync(options: SyncOptions) {
  const config = getConfig();
  const tribbleClient = createTribbleClient(config);
  const connector = createexceedraConnector(config, options);

  await connector.initialize({ tribble: tribbleClient, ... });
  const result = await connector.pull(params);

  displayResults(result);
}
```

### 2. config.ts (Configuration Management)

**Purpose**: Centralized configuration with validation

**Responsibilities**:
- Load environment variables
- Validate required settings
- Parse complex configuration (cron, sources list)
- Provide singleton config instance
- Type-safe configuration access

**Key Patterns**:
- Singleton pattern for config instance
- Early validation (fail fast)
- Environment variable abstraction

```typescript
export function loadConfig(): exceedraConfig {
  validateConfig();  // Throw if invalid

  return {
    exceedra: { ... },
    tribble: { ... },
    sync: { ... },
  };
}
```

### 3. exceedra-connector.ts (Integration Logic)

**Purpose**: Core integration implementation

**Responsibilities**:
- Extend BaseConnector for lifecycle management
- Implement pull() for data synchronization
- Handle pagination and rate limiting
- Manage checkpoints for incremental sync
- Coordinate transformation and upload
- Error handling and retry logic

**Key Patterns**:
- Template method pattern (extends BaseConnector)
- Strategy pattern (different sync strategies)
- State management (checkpoints)

```typescript
export class exceedraConnector extends BaseConnector {
  async pull(params: SyncParams): Promise<SyncResult> {
    for (const source of this.sources) {
      // Fetch with pagination
      // Transform data
      // Upload to Tribble
      // Update checkpoint
    }
  }
}
```

### 4. transformers.ts (Data Transformation)

**Purpose**: Convert exceedra format to Tribble format

**Responsibilities**:
- Type-safe transformation functions
- Data enrichment (searchable summaries)
- Metadata extraction
- Multiple entity types (documents, products, retailers)

**Key Patterns**:
- Adapter pattern (external format → Tribble format)
- Factory pattern (transformexceedraData routes to specific transformers)
- Immutability (pure transformation functions)

```typescript
export async function transformDocuments(
  documents: exceedraDocument[],
  context: TransformContext
): Promise<TransformResult[]> {
  return documents.map(doc => ({
    data: enrichDocument(doc),
    metadata: extractMetadata(doc),
    filename: generateFilename(doc),
  }));
}
```

## Design Patterns Used

### 1. Dependency Injection

The connector receives its dependencies through constructor injection:

```typescript
constructor(
  public readonly config: ConnectorConfig,
  exceedraConfig: exceedraConnectorConfig
) {
  super(config);
  this.transport = config.transport;  // Injected dependency
}
```

Benefits:
- Testability (mock transport, transformer)
- Flexibility (swap implementations)
- Clear dependencies

### 2. Template Method Pattern

BaseConnector defines the skeleton, subclass implements specifics:

```typescript
// BaseConnector (template)
abstract class BaseConnector {
  async initialize(context) { /* common setup */ }
  abstract pull(params): Promise<SyncResult>;  // Subclass implements
  async disconnect() { /* common cleanup */ }
}

// exceedraConnector (concrete implementation)
class exceedraConnector extends BaseConnector {
  async pull(params) {
    // exceedra-specific sync logic
  }
}
```

### 3. Strategy Pattern

Different sync strategies (full vs incremental):

```typescript
async pull(params: SyncParams): Promise<SyncResult> {
  let since: string | undefined;

  if (!params.fullSync) {
    // Incremental strategy
    since = this.getCheckpoint(source);
  } else {
    // Full sync strategy
    since = undefined;
  }

  return this.syncDataSource(source, since);
}
```

### 4. Factory Pattern

Factory function for creating connectors:

```typescript
export function createexceedraConnector(
  config: exceedraApiConfig,
  options: exceedraConnectorConfig
): exceedraConnector {
  const auth = new OAuth2Provider(config);
  const transport = new RestTransport({ auth, ... });
  const connectorConfig = { transport, ... };

  return new exceedraConnector(connectorConfig, options);
}
```

### 5. Adapter Pattern

Transformers adapt external API format to Tribble format:

```typescript
// External API format (exceedra)
interface exceedraDocument {
  id: string;
  title: string;
  document_type: string;
  // ... exceedra-specific fields
}

// Tribble format
interface TransformResult {
  data: any;
  metadata: Record<string, any>;
  filename: string;
}

// Adapter function
function adaptexceedraDocument(doc: exceedraDocument): TransformResult {
  return {
    data: { title: doc.title, ... },
    metadata: { exceedra_id: doc.id, ... },
    filename: `exceedra-${doc.id}.json`,
  };
}
```

## Data Flow

### Sync Operation Flow

```
1. User runs: npm run sync
              │
              ▼
2. index.ts parses CLI args
              │
              ▼
3. config.ts loads environment
              │
              ▼
4. createexceedraConnector() factory
   ├─ Creates OAuth2Provider
   ├─ Creates RestTransport
   └─ Creates exceedraConnector
              │
              ▼
5. connector.initialize()
   ├─ Connects transport
   ├─ Validates auth
   └─ Loads checkpoints
              │
              ▼
6. connector.pull(params)
              │
              ├─ For each source (documents, products, retailers):
              │  │
              │  ├─ Get checkpoint (if incremental)
              │  │
              │  ├─ Loop with pagination:
              │  │  │
              │  │  ├─ Rate limit delay (if needed)
              │  │  │
              │  │  ├─ transport.request() with retry
              │  │  │  ├─ OAuth2Provider.getCredentials()
              │  │  │  │  └─ Auto-refresh token if expired
              │  │  │  │
              │  │  │  └─ HTTP request to exceedra API
              │  │  │
              │  │  ├─ transformer.transform(data)
              │  │  │  └─ Convert to Tribble format
              │  │  │
              │  │  ├─ uploadToTribble()
              │  │  │  └─ ingestClient.uploadDocument()
              │  │  │
              │  │  └─ Update checkpoint
              │  │
              │  └─ Save checkpoint to file
              │
              └─ Return SyncResult
              │
              ▼
7. Display results to user
```

### Error Handling Flow

```
Request fails
    │
    ▼
Is retryable error?
    │
    ├─ Yes → Retry with backoff
    │         │
    │         └─ Max retries exceeded?
    │               │
    │               ├─ Yes → Log error, continue to next item
    │               └─ No  → Retry again
    │
    └─ No → Log error, continue to next item

All errors collected in errorDetails[]
Final SyncResult includes error count and details
```

## Checkpointing Strategy

### Purpose
Enable incremental syncs by tracking last sync timestamp per data source.

### Implementation

```typescript
interface exceedraCheckpoint {
  documents?: string;    // ISO timestamp
  products?: string;     // ISO timestamp
  retailers?: string;    // ISO timestamp
  lastSyncAt: string;    // Overall last sync
}
```

### Checkpoint Lifecycle

1. **Load**: Read from file at initialization
2. **Use**: Pass as `updated_since` parameter to API
3. **Update**: Track latest timestamp from batch
4. **Save**: Write to file after successful sync

```typescript
// Load checkpoint
private loadCheckpoints(): void {
  if (existsSync(this.checkpointFile)) {
    this.checkpoints = JSON.parse(readFileSync(this.checkpointFile));
  }
}

// Use checkpoint
const since = this.getCheckpoint(source);
queryParams.updated_since = since;

// Update checkpoint
const latestTimestamp = items[items.length - 1].updated_at;
this.updateCheckpoint(source, latestTimestamp);

// Save checkpoint
private saveCheckpoints(): void {
  writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoints));
}
```

### Checkpoint Recovery

If sync fails mid-way:
1. Partial data is uploaded
2. Checkpoint reflects last successful batch
3. Next sync resumes from checkpoint
4. No duplicate processing

## Rate Limiting Strategy

### Purpose
Respect exceedra API rate limits to avoid 429 errors.

### Implementation

```typescript
private async rateLimitedRequest<T>(endpoint: string): Promise<T> {
  const minIntervalMs = 1000 / this.rateLimit;  // e.g., 100ms for 10 req/s
  const timeSinceLastRequest = Date.now() - this.lastRequestTime;

  if (timeSinceLastRequest < minIntervalMs) {
    await sleep(minIntervalMs - timeSinceLastRequest);
  }

  this.lastRequestTime = Date.now();
  return this.transport.request<T>(endpoint);
}
```

### Token Bucket Alternative

For burst support, consider token bucket:

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  async acquire(): Promise<void> {
    // Refill tokens based on time elapsed
    // Wait if no tokens available
  }
}
```

## Retry Strategy

### Purpose
Handle transient failures automatically.

### Implementation

Uses SDK's `retry()` utility with:
- **Exponential backoff**: 1s → 2s → 4s → 8s
- **Max retries**: 3 attempts (configurable)
- **Jitter**: Randomize delay to avoid thundering herd
- **Conditional retry**: Only retry retryable errors

```typescript
const response = await retry(
  () => this.rateLimitedRequest(endpoint),
  {
    maxRetries: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000,
    shouldRetry: (error) => isRetryableError(error),
    onRetry: (error, attempt, delayMs) => {
      this.logger.warn('Retrying request', { attempt, delayMs });
    },
  }
);
```

### Retryable vs Non-Retryable Errors

**Retryable** (transient):
- Network errors (ECONNRESET, ETIMEDOUT)
- HTTP 429 (rate limit)
- HTTP 500-599 (server errors)

**Non-Retryable** (permanent):
- HTTP 401 (authentication failed)
- HTTP 403 (forbidden)
- HTTP 404 (not found)
- Validation errors

## Testing Strategy

### Unit Tests

Test individual components in isolation:

```typescript
describe('transformDocuments', () => {
  it('should transform exceedra document to Tribble format', async () => {
    const mockDocument = { id: 'doc-1', ... };
    const result = await transformDocuments([mockDocument], mockContext);

    expect(result).toHaveLength(1);
    expect(result[0].metadata.exceedra_id).toBe('doc-1');
  });
});
```

### Integration Tests

Test connector with mocked dependencies:

```typescript
describe('exceedraConnector', () => {
  it('should sync data and update checkpoint', async () => {
    const mockTransport = createMockTransport();
    const connector = new exceedraConnector(config, options);

    await connector.initialize(mockContext);
    const result = await connector.pull({ fullSync: false });

    expect(result.documentsProcessed).toBeGreaterThan(0);
    expect(result.checkpoint).toBeDefined();
  });
});
```

### End-to-End Tests

Test against real or staging exceedra API:

```typescript
describe('E2E: exceedra Integration', () => {
  it('should sync real data to Tribble', async () => {
    const connector = createexceedraConnector(realConfig, options);
    await connector.initialize(realContext);

    const result = await connector.pull({ fullSync: false });

    expect(result.errors).toBe(0);
    expect(result.documentsUploaded).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

### Memory Management

Process data in batches to avoid loading entire dataset:

```typescript
// Good: Stream processing
for await (const batch of transport.paginate(endpoint, pagination)) {
  await processBatch(batch);
  // Memory freed after each batch
}

// Bad: Load everything
const allData = await fetchAllData();  // OOM for large datasets
await processAll(allData);
```

### Parallel Processing

Sync multiple sources concurrently:

```typescript
// Sequential (slow)
for (const source of sources) {
  await this.syncDataSource(source);
}

// Parallel (fast)
await Promise.all(
  sources.map(source => this.syncDataSource(source))
);
```

### Batch Uploads

Upload multiple documents in single request:

```typescript
// Better throughput
await ingestClient.uploadBatch({
  items: transformedDocuments.slice(0, 10),
});
```

## Security Considerations

### Credential Management

- **Never commit** `.env` files
- Use environment variables or secret managers
- Rotate credentials regularly
- Use least-privilege OAuth2 scopes

### Token Storage

```typescript
// Good: Store tokens securely
const tokenState = auth.getTokenState();
await secretManager.store('exceedra_tokens', tokenState);

// Bad: Log tokens
console.log('Token:', accessToken);  // Don't do this!
```

### Request Signing

For webhook support, verify signatures:

```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Monitoring and Observability

### Metrics to Track

```typescript
// Sync metrics
const metrics = {
  'exceedra.sync.duration_ms': duration,
  'exceedra.sync.documents_processed': result.documentsProcessed,
  'exceedra.sync.documents_uploaded': result.documentsUploaded,
  'exceedra.sync.errors': result.errors,
  'exceedra.sync.batches': batchCount,
};

// API metrics
const apiMetrics = {
  'exceedra.api.requests': requestCount,
  'exceedra.api.errors': errorCount,
  'exceedra.api.latency_ms': avgLatency,
  'exceedra.api.rate_limit_hits': rateLimitCount,
};
```

### Logging Best Practices

```typescript
// Structured logging
this.logger.info('Starting sync', {
  sources: this.sources,
  fullSync: params.fullSync,
  traceId: params.traceId,
});

// Error context
this.logger.error('Sync failed', error, {
  source,
  endpoint,
  batchIndex,
  itemCount,
});
```

### Alerts

Set up alerts for:
- Sync failures (errors > 0)
- High error rate (errors / processed > 0.1)
- Slow syncs (duration > threshold)
- Rate limit hits
- Authentication failures

## Extension Points

### Adding New Data Sources

1. Define type in `transformers.ts`
2. Create transformation function
3. Add endpoint to `exceedra_ENDPOINTS`
4. Update `exceedraDataSource` type

### Custom Transformations

Override transformation logic:

```typescript
class CustomexceedraTransformer extends exceedraTransformer {
  async transform(input: any, context: TransformContext) {
    const baseResults = await super.transform(input, context);

    // Add custom enrichment
    return baseResults.map(result => ({
      ...result,
      data: {
        ...result.data,
        enrichedField: await this.enrich(result.data),
      },
    }));
  }
}
```

### Webhook Support

Extend connector for real-time updates:

```typescript
export class exceedraConnector extends BaseConnector {
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const eventType = payload.event;

    switch (eventType) {
      case 'document.updated':
        await this.syncDocument(payload.data.id);
        break;
      case 'product.created':
        await this.syncProduct(payload.data.id);
        break;
    }
  }
}
```

## Conclusion

This architecture demonstrates:

✅ **Separation of Concerns**: Clear boundaries between components
✅ **Extensibility**: Easy to add sources, transformations, features
✅ **Testability**: Dependency injection enables isolated testing
✅ **Resilience**: Retry logic, error handling, checkpointing
✅ **Performance**: Pagination, batching, rate limiting
✅ **Maintainability**: Clear patterns, comprehensive documentation

Use this as a template for building production-ready integrations with any third-party API using the Tribble SDK.
