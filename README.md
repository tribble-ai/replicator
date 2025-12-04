# Tribble SDK

Build GenAI applications on the Tribble Platform with document ingestion, agent chat, and workflow automation.

## Installation

```bash
npm install @tribble/sdk
```

## Quick Start

```typescript
import { createTribble } from '@tribble/sdk';

const tribble = createTribble({
  agent: {
    baseUrl: 'https://api.tribble.com',
    token: 'your-token',
    email: 'user@example.com'
  },
  ingest: {
    baseUrl: 'https://ingest.tribble.com',
    tokenProvider: async () => 'your-token'
  },
  workflows: {
    endpoint: 'https://workflows.tribble.com/invoke',
    signingSecret: 'your-secret'
  }
});

// Chat with an AI agent
const response = await tribble.agent.chat('Hello!');

// Upload a document
await tribble.ingest.uploadDocument({
  file: pdfBuffer,
  filename: 'document.pdf',
  metadata: { title: 'My Document' }
});

// Trigger a workflow
await tribble.workflows.trigger({
  slug: 'process-lead',
  input: { userId: '123' }
});
```

## Packages

| Package | Description |
|---------|-------------|
| `@tribble/sdk` | Main SDK - use this for most applications |
| `@tribble/sdk-core` | HTTP client, errors, utilities |
| `@tribble/sdk-agent` | AI agent chat and streaming |
| `@tribble/sdk-ingest` | Document ingestion (PDF, HTML, CSV, JSON, spreadsheets) |
| `@tribble/sdk-workflows` | Workflow triggers with HMAC signing |
| `@tribble/sdk-events` | Webhook signature verification |
| `@tribble/sdk-auth` | OAuth2 PKCE authentication |
| `@tribble/sdk-queue` | Job queue with retries |
| `@tribble/sdk-cli` | Command-line interface |

## Features

### Agent Chat

```typescript
import { AgentClient } from '@tribble/sdk';

const agent = new AgentClient({
  baseUrl: 'https://api.tribble.com',
  token: 'your-token',
  email: 'user@example.com'
});

// Simple chat
const response = await agent.chat('What are today\'s top priorities?');
console.log(response);

// Streaming response
for await (const chunk of agent.stream('Summarize the quarterly report')) {
  process.stdout.write(chunk);
}

// Parse JSON from response
const data = await agent.parseJSON('List the top 3 customers as JSON');
```

### Document Ingestion

```typescript
import { IngestClient } from '@tribble/sdk';

const ingest = new IngestClient({
  baseUrl: 'https://ingest.tribble.com',
  tokenProvider: async () => 'your-token'
});

// Upload PDF
await ingest.uploadPDF({
  file: pdfBuffer,
  filename: 'report.pdf',
  metadata: { category: 'reports', year: 2024 }
});

// Upload CSV with schema validation
await ingest.uploadStructuredData({
  data: csvString,
  format: 'csv',
  metadata: {
    schema: [
      { name: 'email', type: 'string', required: true },
      { name: 'revenue', type: 'number', required: true }
    ],
    validateSchema: true
  }
});

// Upload HTML
await ingest.uploadHTML({
  content: '<html><body>Hello</body></html>',
  metadata: { source: 'https://example.com' }
});

// Upload spreadsheet
await ingest.uploadSpreadsheet({
  file: xlsxBuffer,
  filename: 'data.xlsx',
  sheetName: 'Q4 Sales'
});

// Upload with auto-detection
await ingest.uploadDocument({
  file: fileBuffer,
  filename: 'document.pdf'  // type detected from extension
});

// Upload transactional data
await ingest.uploadTransactionalData({
  data: { orderId: '123', amount: 99.99, status: 'completed' },
  entityType: 'order',
  metadata: { transactionId: 'TXN-456' }
});
```

### Workflow Triggers

```typescript
import { WorkflowsClient } from '@tribble/sdk';

const workflows = new WorkflowsClient({
  endpoint: 'https://workflows.tribble.com/invoke',
  signingSecret: 'your-secret'
});

// Trigger a workflow
await workflows.trigger({
  slug: 'new-lead-handler',
  input: {
    leadId: 'LEAD-123',
    source: 'website'
  }
});
```

### Webhook Handling

```typescript
import { verifySignature, createWebhookApp } from '@tribble/sdk';

// Create webhook handler
const app = createWebhookApp({ signingSecret: 'your-secret' });

app.on('lead_created', async (event) => {
  console.log('New lead:', event.data);
});

app.on('document_processed', async (event) => {
  console.log('Document ready:', event.data.documentId);
});

// Start listening
await app.listen(8080);
```

### Authentication

```typescript
import { TribbleAuth, FileStorage } from '@tribble/sdk';

const auth = new TribbleAuth({
  env: 'prod',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['read', 'write'],
  storage: new FileStorage('.tribble-tokens')
});

// Start OAuth2 PKCE flow
const { url, codeVerifier } = await auth.loginPkce();
// Redirect user to url...

// Exchange code for tokens
await auth.exchangeCode(code, codeVerifier);

// Get access token (auto-refreshes if needed)
const token = await auth.getAccessToken({ ensureFresh: true });
```

### Job Queue

```typescript
import { UploadQueue } from '@tribble/sdk';

const queue = new UploadQueue({
  concurrency: 3,
  maxRetries: 5,
  backoffMs: 1000
});

queue.on('success', ({ id, result }) => {
  console.log(`Job ${id} completed:`, result);
});

queue.on('failed', ({ id, error }) => {
  console.error(`Job ${id} failed:`, error);
});

// Enqueue jobs
await queue.enqueue(async () => {
  return await uploadDocument(file1);
}, { meta: { filename: 'doc1.pdf' } });

await queue.enqueue(async () => {
  return await uploadDocument(file2);
}, { meta: { filename: 'doc2.pdf' } });
```

## CLI

```bash
# Install CLI globally
npm install -g @tribble/sdk-cli

# Upload a document
tribble upload \
  --base-url https://ingest.tribble.com \
  --token "your-token" \
  --file ./document.pdf \
  --type pdf

# Trigger a workflow
tribble workflows trigger my-workflow \
  --endpoint https://workflows.tribble.com/invoke \
  --secret "your-secret" \
  --input '{"userId": "123"}'
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
packages/
  core/       # HTTP client, errors, utilities
  agent/      # AI agent chat and streaming
  ingest/     # Document ingestion
  workflows/  # Workflow triggers
  events/     # Webhook handling
  auth/       # OAuth2 authentication
  queue/      # Job queue
  sdk/        # Main SDK (aggregates all packages)
  cli/        # Command-line interface
examples/
  nestle-demo/  # Demo application
```

## Configuration

The SDK uses `TribbleConfig` for configuration:

```typescript
interface TribbleConfig {
  agent: {
    baseUrl: string;
    token: string;
    email: string;
    defaultHeaders?: Record<string, string>;
  };
  ingest?: {
    baseUrl: string;
    tokenProvider: () => Promise<string>;
    defaultHeaders?: Record<string, string>;
  };
  workflows?: {
    endpoint: string;
    signingSecret: string;
    defaultHeaders?: Record<string, string>;
  };
  telemetry?: {
    serviceName?: string;
    propagateTraceHeader?: string;
  };
}
```

## Error Handling

The SDK provides typed errors for different failure modes:

```typescript
import {
  TribbleError,
  AuthError,
  RateLimitError,
  ValidationError,
  ServerError,
  NetworkError,
  TimeoutError
} from '@tribble/sdk-core';

try {
  await tribble.agent.chat('Hello');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
  } else if (error instanceof AuthError) {
    // Re-authenticate
  } else if (error instanceof NetworkError) {
    // Check connectivity
  }
}
```

## License

UNLICENSED - Internal use only
