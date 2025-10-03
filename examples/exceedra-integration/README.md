# exceedra REST API Integration Example

A production-ready reference implementation for integrating the exceedra pharmaceutical/CPG REST API with Tribble using the SDK's integration primitives.

## Overview

This example demonstrates best practices for building custom integrations with third-party systems that should **NOT** be built into Tribble's core platform. Instead, it leverages the powerful SDK integration layer to:

- Handle complex OAuth2 authentication with automatic token refresh
- Manage pagination, rate limiting, and retry logic
- Transform external API formats to Tribble-compatible structured data
- Support both full and incremental syncs with checkpointing
- Schedule periodic syncs using cron expressions
- Provide comprehensive error handling and logging

## Why This Example Matters

exceedra is a real pharmaceutical/CPG system with quirks that don't belong in Tribble's core:
- Complex, domain-specific data models
- Rate limiting that varies by customer tier
- OAuth2 with custom token endpoints
- Inconsistent pagination styles across endpoints

By using the SDK integration layer, you can handle these "shitty" API quirks in your custom app while keeping Tribble clean and focused.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Custom App                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           exceedra Connector (This Example)            │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  • OAuth2 Authentication                              │  │
│  │  • REST API Communication                             │  │
│  │  • Data Transformation                                │  │
│  │  • Pagination & Rate Limiting                         │  │
│  │  • Checkpointing                                      │  │
│  └─────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         @tribble/sdk-integrations Package             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  BaseConnector │ RestTransport │ OAuth2Provider       │  │
│  │  Retry Logic   │ Scheduler     │ Error Handling       │  │
│  └─────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         @tribble/sdk-ingest Package                   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  uploadDocument()                                     │  │
│  │  uploadStructuredData()                               │  │
│  └─────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Tribble Platform   │
              │   (Clean & Simple)   │
              └──────────────────────┘
```

## Features Demonstrated

### 1. OAuth2 Authentication
- Automatic token acquisition using client credentials
- Token refresh before expiration
- Token persistence for reuse across runs

### 2. REST API Integration
- Cursor-based pagination
- Rate limiting (configurable requests per second)
- Retry logic with exponential backoff
- Request/response error handling

### 3. Data Transformation
- exceedra Document → Tribble JSON document
- exceedra Product → Tribble structured data
- exceedra Retailer → Tribble structured data
- Rich metadata extraction for enhanced search

### 4. Sync Capabilities
- **Full Sync**: Fetch all data (ignore checkpoints)
- **Incremental Sync**: Fetch only updated data since last sync
- **Checkpoint Persistence**: Resume from last successful sync
- **Multi-Source Sync**: Documents, Products, Retailers

### 5. Scheduling
- Cron-based scheduling for periodic syncs
- Graceful shutdown handling
- Error recovery and retry

### 6. Production-Ready
- Comprehensive error handling
- Detailed logging with configurable verbosity
- Configuration validation
- Integration tests
- CLI interface

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Tribble API key
- exceedra API credentials (Client ID, Client Secret)

### Installation

```bash
# Navigate to the example directory
cd examples/exceedra-integration

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Configuration

Edit `.env` with your credentials:

```bash
# exceedra API Configuration
exceedra_BASE_URL=https://api.exceedra.com
exceedra_CLIENT_ID=your-client-id-here
exceedra_CLIENT_SECRET=your-client-secret-here
exceedra_TOKEN_ENDPOINT=https://auth.exceedra.com/oauth/token

# Tribble Configuration
TRIBBLE_API_KEY=your-tribble-api-key-here
TRIBBLE_BRAIN_URL=https://brain.tribble.ai
TRIBBLE_INGEST_URL=https://ingest.tribble.ai

# Sync Configuration
SYNC_SCHEDULE=0 */6 * * *  # Every 6 hours
SYNC_SOURCES=documents,products  # Comma-separated list
SYNC_BATCH_SIZE=100
SYNC_MAX_RETRIES=3

# Optional: Rate Limiting
RATE_LIMIT_REQUESTS_PER_SECOND=10
```

## Usage

### Validate Configuration

Before running syncs, validate your configuration:

```bash
npm run validate
```

### One-Time Sync

Run a one-time incremental sync:

```bash
npm run sync
# or
npm run dev
```

Run a full sync (ignore checkpoints):

```bash
npm run sync:full
```

### Scheduled Sync

Run continuous syncs based on cron schedule:

```bash
npm run schedule
```

Press `Ctrl+C` to stop gracefully.

### Advanced Usage

Sync specific data sources:

```bash
tsx src/index.ts sync --sources documents
tsx src/index.ts sync --sources products,retailers
```

Run with debug logging:

```bash
ENABLE_DEBUG_LOGGING=true npm run sync
```

### CLI Commands

```bash
# Run incremental sync
tsx src/index.ts sync

# Run full sync
tsx src/index.ts sync --full

# Sync specific sources
tsx src/index.ts sync --sources documents,products

# Run scheduled syncs
tsx src/index.ts schedule

# Validate configuration
tsx src/index.ts validate

# Show help
tsx src/index.ts help
```

## Code Structure

```
examples/exceedra-integration/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment template
├── README.md                # This file
├── src/
│   ├── index.ts            # Main entry point & CLI
│   ├── config.ts           # Configuration management
│   ├── exceedra-connector.ts # exceedra connector implementation
│   └── transformers.ts     # Data transformation logic
└── test/
    └── integration.test.ts  # Integration tests
```

## Key Concepts

### BaseConnector

The `BaseConnector` class from `@tribble/sdk-integrations` provides:
- Connection lifecycle management
- Helper methods for uploading to Tribble
- Checkpoint parsing and creation
- Logging infrastructure

```typescript
export class exceedraConnector extends BaseConnector {
  async pull(params: SyncParams): Promise<SyncResult> {
    // Fetch data from exceedra API
    // Transform to Tribble format
    // Upload using this.uploadToTribble()
    // Return sync results
  }
}
```

### RestTransport

Handles REST API communication with automatic auth:

```typescript
const transport = new RestTransport({
  baseUrl: 'https://api.exceedra.com',
  auth: new OAuth2Provider({ ... }),
  retryConfig: {
    maxRetries: 3,
    backoffMs: 1000,
    maxBackoffMs: 30000,
  },
});

// Make authenticated requests
const data = await transport.request('/api/v1/documents');

// Handle pagination automatically
for await (const batch of transport.paginate('/api/v1/documents', paginationConfig)) {
  // Process batch
}
```

### Data Transformation

Transform external API format to Tribble-compatible structure:

```typescript
export async function transformDocuments(
  documents: exceedraDocument[],
  context: TransformContext
): Promise<TransformResult[]> {
  return documents.map((doc) => ({
    data: {
      title: doc.title,
      content: doc.content,
      // ... enriched data
    },
    metadata: {
      exceedra_id: doc.id,
      document_type: doc.document_type,
      // ... searchable metadata
    },
    filename: `exceedra-document-${doc.id}.json`,
    contentType: 'application/json',
  }));
}
```

### Checkpointing

Persist sync state for incremental updates:

```typescript
// Load checkpoint from file
private loadCheckpoints(): void {
  if (existsSync(this.checkpointFile)) {
    this.checkpoints = JSON.parse(readFileSync(this.checkpointFile, 'utf-8'));
  }
}

// Update checkpoint after successful sync
private updateCheckpoint(source: string, timestamp: string): void {
  this.checkpoints[source] = timestamp;
  this.checkpoints.lastSyncAt = new Date().toISOString();
}

// Save to file
private saveCheckpoints(): void {
  writeFileSync(this.checkpointFile, JSON.stringify(this.checkpoints, null, 2));
}
```

### Rate Limiting

Respect API rate limits:

```typescript
private async rateLimitedRequest<T>(endpoint: string): Promise<T> {
  const minIntervalMs = 1000 / this.rateLimit;
  const timeSinceLastRequest = Date.now() - this.lastRequestTime;

  if (timeSinceLastRequest < minIntervalMs) {
    await sleep(minIntervalMs - timeSinceLastRequest);
  }

  this.lastRequestTime = Date.now();
  return this.transport.request<T>(endpoint);
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The tests demonstrate:
- Data transformation validation
- Error handling
- Mock connector behavior
- Integration patterns

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --production

# Copy source
COPY src/ ./src/

# Build
RUN npm run build

# Run
CMD ["node", "dist/index.js", "schedule"]
```

Build and run:

```bash
docker build -t exceedra-integration .
docker run --env-file .env exceedra-integration
```

### Kubernetes

Create a `CronJob` for scheduled syncs:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: exceedra-sync
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: exceedra-sync
            image: your-registry/exceedra-integration:latest
            command: ["node", "dist/index.js", "sync"]
            envFrom:
            - secretRef:
                name: exceedra-credentials
          restartPolicy: OnFailure
```

### AWS Lambda

For serverless deployment, use AWS Lambda with EventBridge:

```typescript
// lambda-handler.ts
import { runSync } from './index.js';

export const handler = async (event: any) => {
  try {
    await runSync({ fullSync: false });
    return { statusCode: 200, body: 'Sync completed' };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { statusCode: 500, body: error.message };
  }
};
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully and provide context:

```typescript
try {
  await this.syncDataSource(source, params);
} catch (error: any) {
  this.logger.error(`Failed to sync ${source}`, error);
  errorDetails.push({
    message: `Failed to sync ${source}: ${error.message}`,
    context: { source, error: error.stack },
  });
}
```

### 2. Logging

Use structured logging for debugging:

```typescript
this.logger.info('Starting data sync', {
  sources: this.exceedraConfig.sources,
  fullSync: params.fullSync,
  since: params.since,
});
```

### 3. Retry Logic

Use the SDK's retry utilities for transient failures:

```typescript
const response = await retry(
  () => this.rateLimitedRequest(endpoint, params),
  {
    maxRetries: 3,
    shouldRetry: (error) => isRetryableError(error),
    onRetry: (error, attempt, delayMs) => {
      this.logger.warn('Retrying request', { attempt, delayMs });
    },
  }
);
```

### 4. Idempotency

Use idempotency keys for uploads:

```typescript
await this.context.tribble.ingest.uploadDocument({
  file: documentBlob,
  filename: `exceedra-${id}.json`,
  metadata,
  idempotencyKey: `exceedra-${source}-${id}-${version}`,
});
```

### 5. Monitoring

Add metrics and alerts:

```typescript
// Track sync metrics
const startTime = Date.now();
const result = await connector.pull(params);
const duration = Date.now() - startTime;

// Send to monitoring service
sendMetric('exceedra.sync.duration', duration);
sendMetric('exceedra.sync.documents', result.documentsUploaded);
sendMetric('exceedra.sync.errors', result.errors);
```

## Troubleshooting

### Authentication Fails

- Verify `exceedra_CLIENT_ID` and `exceedra_CLIENT_SECRET`
- Check `exceedra_TOKEN_ENDPOINT` is correct
- Ensure OAuth2 scopes are authorized

### Rate Limiting Errors

- Reduce `RATE_LIMIT_REQUESTS_PER_SECOND`
- Increase `SYNC_BATCH_SIZE` to reduce request count
- Contact exceedra support for rate limit increases

### Checkpoint Issues

- Delete `.exceedra-checkpoint.json` to reset
- Disable persistence: `ENABLE_CHECKPOINT_PERSISTENCE=false`
- Check file permissions

### Upload Failures

- Verify `TRIBBLE_API_KEY` is valid
- Check `TRIBBLE_INGEST_URL` is accessible
- Review error logs for specific upload errors

## Extending This Example

### Add New Data Sources

1. Define the API response type in `transformers.ts`
2. Create a transformation function
3. Add endpoint to `exceedra_ENDPOINTS`
4. Update `exceedraDataSource` type
5. Add to `SYNC_SOURCES` in `.env`

### Custom Transformations

Modify `transformers.ts` to customize data format:

```typescript
export async function transformDocuments(
  documents: exceedraDocument[],
  context: TransformContext
): Promise<TransformResult[]> {
  // Add custom enrichment logic
  // Call external APIs for additional data
  // Apply business rules
  return enrichedResults;
}
```

### Add Webhooks

Extend the connector to handle real-time updates:

```typescript
export class exceedraConnector extends BaseConnector {
  async handleWebhook(payload: any, headers: Record<string, string>): Promise<void> {
    // Verify webhook signature
    // Process event
    // Upload to Tribble
  }
}
```

## Performance Optimization

### Parallel Processing

Process multiple sources concurrently:

```typescript
const results = await Promise.all(
  this.exceedraConfig.sources.map((source) =>
    this.syncDataSource(source, params)
  )
);
```

### Batch Uploads

Upload multiple documents in a single request:

```typescript
// Use uploadBatch() for better throughput
await this.context.tribble.ingest.uploadBatch({
  items: transformedDocuments,
});
```

### Memory Management

For large datasets, stream data instead of loading all at once:

```typescript
for await (const batch of transport.paginate(endpoint, paginationConfig)) {
  await this.processAndUpload(batch);
  // Batch processed, memory freed
}
```

## Support

For questions or issues:

1. Review this README thoroughly
2. Check the Tribble SDK documentation
3. Examine the test files for usage examples
4. Contact your Tribble support representative

## License

This example is provided as reference implementation for Tribble SDK customers.
Modify and deploy as needed for your integration requirements.

---

**Built with [Tribble SDK](https://tribble.ai/docs/sdk)**
