# @tribble/sdk-integrations

Comprehensive integration primitives for connecting enterprise systems to Tribble. Build robust, scalable integrations with modern REST APIs, legacy FTP systems, flat files, and webhooks.

## Features

- **Multiple Transport Mechanisms**: REST, FTP, SFTP, file watchers, webhooks
- **Flexible Authentication**: OAuth2, API keys, basic auth, custom headers
- **Data Transformation**: CSV, JSON, fixed-width flat files with schema mapping
- **Pagination Support**: Cursor, offset, page-based pagination
- **Incremental Sync**: Built-in checkpoint management
- **Retry & Error Handling**: Automatic retries with exponential backoff
- **Scheduling**: Cron-based scheduling for periodic syncs
- **Production Ready**: TypeScript, comprehensive error handling, logging

## Installation

```bash
npm install @tribble/sdk-integrations
```

## Quick Start

### REST API Integration

```typescript
import {
  RestTransport,
  OAuth2Provider,
  JsonTransformer,
  RestApiConnector,
} from '@tribble/sdk-integrations';

// Create transport with OAuth2
const transport = new RestTransport({
  baseUrl: 'https://api.example.com',
  auth: new OAuth2Provider({
    tokenEndpoint: 'https://auth.example.com/token',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  }),
});

// Create connector
const connector = new RestApiConnector(
  {
    name: 'example-api',
    version: '1.0.0',
    source: 'example',
    transport,
    transformer: new JsonTransformer({ dataPath: 'items' }),
  },
  {
    endpoint: '/api/v1/data',
    pagination: {
      style: 'cursor',
      cursorPath: 'meta.next_cursor',
      itemsPath: 'data',
    },
  }
);

// Initialize and sync
await connector.initialize({ tribble: { ingest: ingestClient } });
const result = await connector.pull({ since: '2024-01-01' });
console.log(`Uploaded ${result.documentsUploaded} documents`);
```

### FTP/SFTP Integration

```typescript
import { FtpTransport, CsvTransformer } from '@tribble/sdk-integrations';

const transport = new FtpTransport({
  host: 'ftp.example.com',
  username: 'user',
  password: 'pass',
  secure: true, // Use SFTP
  rootPath: '/data/exports',
});

await transport.connect();

// Download and process files
for await (const { file, data } of transport.downloadBatch({ pattern: '*.csv' })) {
  const transformer = new CsvTransformer({ hasHeader: true });
  const results = await transformer.transform(data, {
    source: 'ftp',
    format: 'csv',
    metadata: { filename: file.name },
    receivedAt: new Date(),
  });

  // Upload to Tribble
  for (const result of results) {
    await ingestClient.uploadDocument({
      file: new Blob([result.data]),
      filename: result.filename,
      metadata: result.metadata,
    });
  }
}
```

### File Watcher Integration

```typescript
import { FileWatcherTransport } from '@tribble/sdk-integrations';

const transport = new FileWatcherTransport({
  watchPath: '/data/imports',
  pattern: '*.json',
  pollInterval: 5000,
  recursive: true,
});

await transport.connect();

// Watch for new files
transport.watch(async (event, data) => {
  console.log(`New file: ${event.filename}`);

  // Process and upload
  const transformer = new JsonTransformer();
  const results = await transformer.transform(data, {
    source: 'file-watcher',
    format: 'json',
    metadata: { filename: event.filename },
    receivedAt: new Date(),
  });

  // Upload to Tribble
  for (const result of results) {
    await ingestClient.uploadDocument({
      file: new Blob([result.data]),
      filename: result.filename,
      metadata: result.metadata,
    });
  }
});
```

## Architecture

### Transport Layer

Abstracts different data transfer mechanisms:

- **RestTransport**: HTTP/REST APIs with retry logic, pagination, SSE streaming
- **FtpTransport**: FTP/SFTP file transfers (requires external libraries)
- **FileWatcherTransport**: Monitor filesystem for new files
- **WebhookTransport**: Handle incoming webhook events with signature verification

### Authentication Layer

Supports various authentication methods:

- **OAuth2Provider**: Automatic token refresh, state persistence
- **ApiKeyAuthProvider**: API key in headers
- **BearerAuthProvider**: Bearer token authentication
- **BasicAuthProvider**: HTTP basic authentication
- **CustomAuthProvider**: Custom headers

### Transformation Layer

Convert data to Tribble-compatible formats:

- **CsvTransformer**: Parse CSV with column mapping, filtering
- **JsonTransformer**: Transform JSON with path extraction, flattening
- **FlatFileTransformer**: Parse fixed-width flat files (legacy systems)

### Connector Layer

Complete integration implementations:

- **BaseConnector**: Abstract base class with common functionality
- **RestApiConnector**: Generic REST API connector with pagination
- Custom connectors by extending BaseConnector

## Authentication Examples

### OAuth2 with Token Refresh

```typescript
const auth = new OAuth2Provider({
  tokenEndpoint: 'https://auth.example.com/oauth/token',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  grantType: 'client_credentials',
  scopes: ['read:data', 'write:data'],
  refreshBufferSeconds: 300, // Refresh 5 minutes before expiry
});

// Get credentials (auto-refreshes if expired)
const credentials = await auth.getCredentials();

// Persist token state for reuse
const state = auth.getTokenState();
// Save to database...

// Restore token state
auth.setTokenState(savedState);
```

### API Key Authentication

```typescript
const auth = new ApiKeyAuthProvider('your-api-key', 'X-API-Key');

// Will add header: X-API-Key: your-api-key
const headers = await auth.applyToHeaders({});
```

## Data Transformation Examples

### CSV with Column Mapping

```typescript
const transformer = new CsvTransformer({
  hasHeader: true,
  delimiter: ',',
  columnMappings: {
    'Customer ID': 'customerId',
    'Order Date': 'orderDate',
    'Total Amount': 'amount',
  },
  excludeColumns: ['Internal Notes'],
  transformers: {
    amount: (value) => parseFloat(value.replace('$', '')),
    orderDate: (value) => new Date(value).toISOString(),
  },
  filterRow: (row) => row.status !== 'cancelled',
});
```

### JSON Path Extraction

```typescript
const transformer = new JsonTransformer({
  dataPath: '$.data.items[*]', // Extract items array
  fieldMappings: {
    id: 'documentId',
    created_at: 'createdAt',
  },
  excludeFields: ['_internal', '_debug'],
  flatten: true, // Flatten nested objects
  flattenSeparator: '_',
  filterItem: (item) => item.status === 'active',
});
```

### Fixed-Width Flat Files

```typescript
const transformer = new FlatFileTransformer({
  fields: [
    { name: 'recordType', start: 1, length: 2, type: 'string' },
    { name: 'customerId', start: 3, length: 10, type: 'number' },
    { name: 'customerName', start: 13, length: 50, type: 'string', trim: true },
    { name: 'accountBalance', start: 63, length: 12, type: 'number' },
    { name: 'lastActivity', start: 75, length: 8, type: 'date', dateFormat: 'YYYYMMDD' },
  ],
  skipRows: 1, // Skip header row
  skipFooter: 1, // Skip footer row
  filterRecord: (record) => record.recordType === 'DT', // Only data records
});
```

## Custom Connector Example

```typescript
import { BaseConnector, type SyncParams, type SyncResult } from '@tribble/sdk-integrations';

class MyCustomConnector extends BaseConnector {
  async pull(params: SyncParams): Promise<SyncResult> {
    this.logger.info('Starting custom sync');

    // 1. Fetch data from source
    const transport = this.config.transport as RestTransport;
    const data = await transport.request('/api/data');

    // 2. Transform data
    const transformResults = await this.config.transformer.transform(data, {
      source: this.config.source,
      format: 'json',
      metadata: {},
      receivedAt: new Date(),
    });

    // 3. Upload to Tribble
    const { uploaded, errors } = await this.uploadToTribble(transformResults);

    return {
      documentsProcessed: data.length,
      documentsUploaded: uploaded,
      errors,
      checkpoint: this.createCheckpoint(new Date()),
    };
  }
}
```

## Scheduling

```typescript
import { createScheduler, describeCronSchedule } from '@tribble/sdk-integrations';

const scheduler = createScheduler({
  schedule: '0 * * * *', // Every hour
  onTrigger: async () => {
    const result = await connector.pull({});
    console.log('Sync completed:', result);
  },
  onError: (error) => {
    console.error('Sync failed:', error);
  },
});

scheduler.start();
console.log(describeCronSchedule('0 * * * *')); // "Every hour"
```

## Error Handling

```typescript
import { retry, isRetryableError, IntegrationError } from '@tribble/sdk-integrations';

try {
  const result = await retry(
    async () => {
      return await connector.pull(params);
    },
    {
      maxRetries: 3,
      backoffMs: 1000,
      shouldRetry: (error) => isRetryableError(error),
      onRetry: (error, attempt, delayMs) => {
        console.log(`Retry attempt ${attempt} after ${delayMs}ms`);
      },
    }
  );
} catch (error) {
  if (error instanceof IntegrationError) {
    console.error('Integration error:', error.code, error.message);
    console.log('Retryable?', error.retryable);
  }
}
```

## Webhook Handling

```typescript
import { WebhookTransport, createWebhookMiddleware } from '@tribble/sdk-integrations';

const transport = new WebhookTransport({
  endpoint: '/webhook',
  secret: 'your-webhook-secret',
  signatureHeader: 'X-Webhook-Signature',
  signatureAlgorithm: 'sha256',
});

await transport.connect();

// Register handler
transport.onWebhook(async (payload, headers) => {
  console.log('Webhook received:', payload.event);

  // Process webhook data
  const transformer = new JsonTransformer();
  const results = await transformer.transform(payload.data, {
    source: 'webhook',
    format: 'json',
    metadata: { event: payload.event },
    receivedAt: new Date(),
  });

  // Upload to Tribble
  for (const result of results) {
    await ingestClient.uploadDocument({
      file: new Blob([result.data]),
      filename: result.filename,
      metadata: result.metadata,
    });
  }
});

// Use with Express
app.post('/webhook', createWebhookMiddleware(transport));
```

## Best Practices

### 1. Use Incremental Sync

```typescript
// Store checkpoint after each successful sync
const result = await connector.pull({ since: lastCheckpoint });
if (result.errors === 0) {
  await saveCheckpoint(result.checkpoint);
}
```

### 2. Handle Rate Limits

```typescript
const transport = new RestTransport({
  baseUrl: 'https://api.example.com',
  auth,
  retryConfig: {
    maxRetries: 5,
    backoffMs: 2000,
    maxBackoffMs: 60000, // Max 1 minute
  },
});
```

### 3. Monitor and Log

```typescript
const logger: Logger = {
  debug: (msg, meta) => console.debug(msg, meta),
  info: (msg, meta) => console.log(msg, meta),
  warn: (msg, meta) => console.warn(msg, meta),
  error: (msg, err, meta) => console.error(msg, err, meta),
};

await connector.initialize({ tribble: { ingest }, logger, config: {} });
```

### 4. Validate Data

```typescript
const transformer = new CsvTransformer({
  hasHeader: true,
  filterRow: (row, index) => {
    // Validate required fields
    if (!row.id || !row.email) {
      console.warn(`Skipping invalid row ${index}`);
      return false;
    }
    return true;
  },
});
```

### 5. Use Idempotency Keys

```typescript
await ingestClient.uploadDocument({
  file,
  filename,
  metadata,
  idempotencyKey: `${source}-${documentId}-${timestamp}`,
});
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  IntegrationConnector,
  SyncParams,
  SyncResult,
  TransformContext,
  TransformResult,
} from '@tribble/sdk-integrations';
```

## License

UNLICENSED
