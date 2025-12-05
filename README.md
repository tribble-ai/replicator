# Tribble SDK

**Build extensions and applications for the Tribble AI Platform.**

---

## What is This?

The **Tribble Platform** is an enterprise AI system that powers intelligent assistants, knowledge bases, and automated workflows. The **Tribble SDK** lets you:

1. **Extend the Platform** - Add custom tools, integrations, AI personas, and file parsers
2. **Build Applications** - Create web/mobile apps that consume platform capabilities

```
                                  TRIBBLE PLATFORM
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    │   AI Agent Engine    Knowledge Base (Brain) │
                    │   ┌─────────────┐    ┌─────────────────┐   │
                    │   │ GPT-4o      │    │ Vector Search   │   │
                    │   │ Claude      │    │ Document Store  │   │
                    │   │ Tool Calls  │    │ Citations       │   │
                    │   └─────────────┘    └─────────────────┘   │
                    │                                             │
                    │   Cartridges         Integrations           │
                    │   ┌─────────────┐    ┌─────────────────┐   │
                    │   │ AI Personas │    │ Salesforce      │   │
                    │   │ Prompts     │    │ SAP, Oracle     │   │
                    │   │ Tool Sets   │    │ Custom APIs     │   │
                    │   └─────────────┘    └─────────────────┘   │
                    │                                             │
                    └──────────────────┬──────────────────────────┘
                                       │
                                       │ API
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────────┐    ┌───────────────────────┐    ┌───────────────────┐
│   EXTENSION KIT   │    │      CLIENT KIT       │    │    YOUR APP       │
│                   │    │                       │    │                   │
│ Add new:          │    │ Build apps with:      │    │ React/Mobile/Web  │
│ • Tools           │    │ • Offline support     │    │ using platform    │
│ • Integrations    │    │ • Structured output   │    │ capabilities      │
│ • Cartridges      │    │ • Rate limiting       │    │                   │
│ • File parsers    │    │ • Observability       │    │                   │
└───────────────────┘    └───────────────────────┘    └───────────────────┘
```

---

## Quick Start

### Option A: Extend the Platform

Create custom tools, integrations, or AI personas that run inside the platform.

```bash
# Initialize a new extension project
npx tribble ext init my-extension
cd my-extension
npm install
```

```typescript
// src/index.ts
import { ToolBuilder, ExtensionBundle } from '@tribble/sdk-extensions';
import { z } from 'zod';

// Create a custom tool the AI can call
const weatherTool = new ToolBuilder('get_weather')
  .description('Get current weather for a location')
  .parameter('city', z.string(), 'City name')
  .handler(async (args, ctx) => {
    const weather = await fetchWeather(args.city);
    return {
      content: `Weather in ${args.city}: ${weather.temp}°F, ${weather.conditions}`,
    };
  })
  .build();

// Bundle and export
export default new ExtensionBundle({
  name: 'weather-extension',
  version: '1.0.0',
  description: 'Weather data for AI assistants',
  author: 'Your Company',
  platformVersion: '>=2.0.0',
})
  .addTool(weatherTool)
  .build();
```

```bash
# Test and publish
npm run build
npx tribble ext validate
npx tribble ext publish --env development
```

### Option B: Build a Client Application

Create apps that consume platform capabilities.

```bash
npm install @tribble/sdk
```

```typescript
import { createTribble } from '@tribble/sdk';

const tribble = createTribble({
  agent: {
    baseUrl: 'https://api.tribble.com',
    token: process.env.TRIBBLE_TOKEN,
    email: 'user@company.com',
  },
  offline: { enabled: true },
  rateLimit: '100/minute',
});

// Chat with AI
const response = await tribble.agent.chat({
  cartridge: 'sales-assistant',
  message: 'What should I know before visiting Acme Corp tomorrow?',
});

// Get structured output
const tasks = await tribble.structured.generate({
  prompt: 'List 3 action items from this meeting',
  schema: z.array(z.object({
    task: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
});

// Upload documents to knowledge base
await tribble.ingest.upload({
  file: document,
  tags: ['sales', 'q4-planning'],
});
```

---

## Understanding the Architecture

### How Extensions Work

When you build an extension, you're adding components that run **inside** the Tribble Platform:

```
Your Extension                           Tribble Platform Runtime
┌─────────────────────────┐              ┌─────────────────────────────────────┐
│                         │              │                                     │
│  ToolBuilder ──────────────────────────▶ AI Agent calls your tool           │
│  "crm_search"           │              │ when user asks about customers      │
│                         │   publishes  │                                     │
│  IntegrationBuilder ───────────────────▶ Platform manages OAuth tokens,      │
│  "salesforce"           │              │ connection health, credentials      │
│                         │              │                                     │
│  CartridgeBuilder ─────────────────────▶ Platform loads your AI persona,    │
│  "sales-assistant"      │              │ prompt template, tool set           │
│                         │              │                                     │
│  IngestAdapterBuilder ─────────────────▶ Platform uses your parser when     │
│  "excel-promotions"     │              │ users upload matching files         │
│                         │              │                                     │
└─────────────────────────┘              └─────────────────────────────────────┘
```

### How Client Applications Work

When you build a client app, you're calling the platform **externally**:

```
Your Application                         Tribble Platform
┌─────────────────────────┐              ┌─────────────────────────────────────┐
│                         │              │                                     │
│  React/Mobile/Web App   │   HTTP API   │                                     │
│                         │ ──────────▶  │  Agent: Chat with AI assistants     │
│  @tribble/sdk           │              │  Brain: Search knowledge base       │
│  @tribble/sdk-react     │ ◀──────────  │  Ingest: Upload documents           │
│  @tribble/sdk-offline   │   Responses  │  Workflows: Trigger automations     │
│                         │              │                                     │
└─────────────────────────┘              └─────────────────────────────────────┘
```

---

## Extension Components

### 1. Tools

Tools are functions the AI can call to fetch data or take actions.

```typescript
import { ToolBuilder } from '@tribble/sdk-extensions';
import { z } from 'zod';

const crmSearch = new ToolBuilder('crm_search')
  // Description tells the AI when to use this tool
  .description('Search CRM for customer accounts, contacts, and opportunities')

  // Parameters with Zod schemas (auto-generates JSON Schema for LLM)
  .parameter('query', z.string(), 'Search query')
  .parameter('type', z.enum(['account', 'contact', 'opportunity']).optional(), 'Record type filter')
  .parameter('limit', z.number().max(100).optional(), 'Max results (default 10)')

  // Require the salesforce integration to be configured
  .requiredIntegration('salesforce')

  // The handler runs when AI calls this tool
  .handler(async (args, ctx) => {
    // ctx.services gives you platform capabilities
    const sf = await ctx.services.integrations.get<SalesforceClient>('salesforce');
    const results = await sf.search(args.query, { type: args.type, limit: args.limit });

    // Log and track metrics
    ctx.services.logger.info('CRM search executed', { query: args.query, resultCount: results.length });
    ctx.services.metrics.increment('crm_search.invocations');

    // Return content for the AI + optional citations
    return {
      content: JSON.stringify(results, null, 2),
      citations: results.map(r => ({
        title: r.name,
        url: r.url,
        snippet: r.description,
      })),
    };
  })
  .build();
```

**What happens at runtime:**
1. User asks: "What's the status of the Acme deal?"
2. AI decides to call `crm_search` with `{query: "Acme", type: "opportunity"}`
3. Platform invokes your handler with credentials already set up
4. Your handler queries Salesforce and returns results
5. AI uses the results to answer the user

### 2. Integrations

Integrations connect the platform to external services with managed credentials.

```typescript
import { IntegrationBuilder } from '@tribble/sdk-extensions';

const salesforce = new IntegrationBuilder('salesforce')
  .displayName('Salesforce')
  .description('Connect to Salesforce CRM')

  // OAuth2 configuration - platform handles the flow
  .oauth2({
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: ['api', 'refresh_token'],
  })

  // Health check - platform monitors connection status
  .healthCheck({
    endpoint: '/services/data/v58.0/',
    expectedStatus: [200],
    intervalSeconds: 300,
  })

  // Factory creates your client when tools need it
  .clientFactory(async (ctx) => {
    return new SalesforceClient({
      instanceUrl: ctx.credentials.metadata?.instanceUrl,
      accessToken: ctx.credentials.accessToken,
    });
  })
  .build();
```

**What the platform handles for you:**
- OAuth flow UI and redirects
- Token storage and encryption
- Automatic token refresh
- Connection health monitoring
- Per-tenant credential isolation

### 3. Cartridges

Cartridges define AI personas with specific capabilities and prompts.

```typescript
import { CartridgeBuilder } from '@tribble/sdk-extensions';
import { z } from 'zod';

const salesAssistant = new CartridgeBuilder('sales-assistant')
  .displayName('Sales Intelligence Assistant')
  .description('AI assistant for field sales preparation and insights')

  // Model selection
  .model('gpt-4o')

  // Tools this persona can use
  .tools(['brain_search', 'crm_search', 'pos_query', 'get_weather'])

  // System prompt with Handlebars templating
  .promptTemplate(`
You are a sales intelligence assistant helping {{userName}} prepare for customer visits.

Your role:
- Research customers before visits using CRM and internal documents
- Identify sales opportunities based on POS data
- Provide evidence-backed recommendations with citations

Current context:
- Territory: {{territory}}
- Focus brands: {{focusBrands}}

Always:
1. Search internal knowledge base first
2. Cross-reference with CRM data
3. Cite your sources
4. Be concise and actionable
  `)

  // Runtime configuration schema
  .configSchema(z.object({
    territory: z.string(),
    focusBrands: z.array(z.string()),
  }))

  // Custom initialization
  .init(async (ctx) => {
    return {
      preambleMessages: [{
        role: 'assistant',
        content: `Hello ${ctx.user?.name}! I'm ready to help you prepare for your customer visits today.`,
      }],
    };
  })
  .build();
```

**What happens when a user chats:**
1. User opens chat with the "sales-assistant" cartridge
2. Platform compiles the prompt template with user context
3. User message goes to GPT-4o with the system prompt and available tools
4. AI can call any of the configured tools to gather information
5. Response is streamed back with citations

### 4. Ingest Adapters

Ingest adapters parse custom file formats for the knowledge base.

```typescript
import { IngestAdapterBuilder } from '@tribble/sdk-extensions';
import XLSX from 'xlsx';

const promotionsAdapter = new IngestAdapterBuilder('excel-promotions')
  .displayName('Promotions Excel Export')
  .description('Parse trade promotion spreadsheets from TPM systems')

  // File types this adapter handles
  .extensions(['.xlsx', '.xls'])
  .mimeTypes([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ])

  // Limits
  .maxSize(100 * 1024 * 1024) // 100MB

  // Parser implementation
  .handler(async (data, ctx) => {
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Convert each row to a searchable chunk
    const chunks = rows.map((row: any, i) => ({
      content: `
        Promotion: ${row.promotionName}
        Customer: ${row.customerName}
        Start: ${row.startDate} | End: ${row.endDate}
        Spend: $${row.spend} | Lift: ${row.expectedLift}%
        Status: ${row.status}
      `,
      index: i,
      title: row.promotionName,
      metadata: {
        customerId: row.customerId,
        status: row.status,
        spend: row.spend,
      },
    }));

    return {
      chunks,
      metadata: {
        title: ctx.file.name,
        rowCount: rows.length,
      },
      autoTags: ['promotions', 'tpm', new Date().getFullYear().toString()],
    };
  })
  .build();
```

**What happens when a user uploads a file:**
1. User uploads "Q4_Promotions.xlsx"
2. Platform detects .xlsx extension, routes to your adapter
3. Your handler parses the Excel file into chunks
4. Platform embeds chunks and stores in vector database
5. AI can now search and cite this data in conversations

---

## Extension Development Workflow

### 1. Initialize

```bash
npx tribble ext init my-extension
cd my-extension
npm install
```

This creates:
```
my-extension/
├── src/
│   └── index.ts        # Your extension code
├── test/
│   └── index.test.ts   # Tests
├── package.json
├── tsconfig.json
└── tribble.config.json # Extension configuration
```

### 2. Develop

```typescript
// src/index.ts
import { ToolBuilder, IntegrationBuilder, CartridgeBuilder, ExtensionBundle } from '@tribble/sdk-extensions';

// ... build your components ...

export default new ExtensionBundle({
  name: 'my-extension',
  version: '1.0.0',
  description: 'My custom extension',
  author: 'My Company',
  platformVersion: '>=2.0.0',
})
  .addTool(myTool)
  .addIntegration(myIntegration)
  .addCartridge(myCartridge)
  .build();
```

### 3. Test

```bash
# Validate against security policies
npx tribble ext validate --policy enterprise

# Run tests with mocked platform services
npx tribble ext test

# Run extension locally
npx tribble runner
```

Testing with mocked services:

```typescript
import { ExtensionTestSuite } from '@tribble/sdk-test';
import extension from '../src';

const suite = new ExtensionTestSuite(extension);

suite.test('crm_search returns customer data', async (ctx) => {
  const tool = ctx.getTool('crm_search');

  // Mock the integration
  tool.mockIntegration('salesforce', {
    search: async () => [{ name: 'Acme Corp', id: '123' }],
  });

  const result = await tool.invoke({ query: 'Acme' });

  tool.assertSuccess(result);
  tool.assertContentContains(result, 'Acme Corp');
});
```

### 4. Publish

```bash
# Preview what will be deployed
npx tribble ext plan --env development

# Publish to development
npx tribble ext publish --env development

# Promote through environments
npx tribble ext promote --from development --to staging
npx tribble ext promote --from staging --to production
```

---

## Client SDK Usage

### Basic Setup

```typescript
import { createTribble } from '@tribble/sdk';

const tribble = createTribble({
  agent: {
    baseUrl: process.env.TRIBBLE_API_URL,
    token: process.env.TRIBBLE_TOKEN,
    email: currentUser.email,
  },
  ingest: {
    baseUrl: process.env.TRIBBLE_INGEST_URL,
    tokenProvider: async () => getAccessToken(),
  },
  offline: { enabled: true },
  observability: { serviceName: 'my-app' },
  rateLimit: '100/minute',
});
```

### Chat with AI

```typescript
// Simple chat
const response = await tribble.agent.chat({
  cartridge: 'sales-assistant',
  message: 'What should I know about visiting Store #1234 tomorrow?',
});
console.log(response.content);

// Streaming
const stream = await tribble.agent.streamChat({
  cartridge: 'sales-assistant',
  message: 'Summarize Q3 performance',
});
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

// With conversation history
const conv = tribble.conversations.create({ id: 'user-123-session-1' });
await conv.send('Hello!');
await conv.send('What were we discussing?'); // Has context from previous message
```

### Structured Output

```typescript
import { z } from '@tribble/sdk';

// Generate data matching a schema
const tasks = await tribble.structured.generate({
  prompt: 'List 3 action items from the Q4 planning meeting',
  schema: z.array(z.object({
    task: z.string(),
    assignee: z.string(),
    dueDate: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
});
// Returns: [{ task: '...', assignee: '...', ... }, ...]
```

### Offline Support

```typescript
// Cache expensive operations
const customerData = await tribble.cache.getOrFetch(
  `customer:${customerId}`,
  async () => fetchCustomerFromCRM(customerId),
  { ttl: '1h' }
);

// Queue operations when offline
tribble.sync.enqueue({
  type: 'UPDATE_VISIT_NOTES',
  payload: { visitId, notes },
});

// Sync when back online
tribble.sync.on('online', async () => {
  await tribble.sync.flush();
});
```

### React Integration

```typescript
import { TribbleProvider, useChat, useAgent } from '@tribble/sdk-react';

function App() {
  return (
    <TribbleProvider config={tribbleConfig}>
      <ChatInterface />
    </TribbleProvider>
  );
}

function ChatInterface() {
  const { messages, send, isLoading } = useChat({ cartridge: 'sales-assistant' });

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      <input onSubmit={e => send(e.target.value)} disabled={isLoading} />
    </div>
  );
}
```

---

## Package Reference

### Extension Kit (for extending the platform)

| Package | Description |
|---------|-------------|
| `@tribble/sdk-extensions` | Core builders: ToolBuilder, IntegrationBuilder, CartridgeBuilder, IngestAdapterBuilder |
| `@tribble/sdk-test` | Testing utilities with mocked platform services |
| `@tribble/sdk-policy` | Security policy validation (Enterprise, Development, Sandbox) |
| `@tribble/sdk-capabilities` | Platform capability version checking |
| `@tribble/sdk-control` | Control plane API for deployment management |
| `@tribble/sdk-primitives` | Low-level upload and batch operations |
| `@tribble/sdk-runner` | Local extension execution for development |

### Client Kit (for building applications)

| Package | Description |
|---------|-------------|
| `@tribble/sdk` | Main entry point - includes everything below |
| `@tribble/sdk-react` | React components and hooks |
| `@tribble/sdk-structured` | Zod-based structured output |
| `@tribble/sdk-offline` | Caching, offline storage, sync queue |
| `@tribble/sdk-conversations` | Multi-turn conversation management |
| `@tribble/sdk-telemetry` | Tracing, metrics, logging |
| `@tribble/sdk-prompts` | Prompt registry with versioning and A/B testing |
| `@tribble/sdk-batch` | Rate limiting, circuit breakers, retry logic |

### Platform Packages (low-level clients)

| Package | Description |
|---------|-------------|
| `@tribble/sdk-core` | HTTP client, errors, utilities |
| `@tribble/sdk-agent` | Agent chat API client |
| `@tribble/sdk-ingest` | Document ingestion client |
| `@tribble/sdk-workflows` | Workflow trigger client |
| `@tribble/sdk-events` | Webhook signature verification |
| `@tribble/sdk-auth` | OAuth2 authentication helpers |
| `@tribble/sdk-queue` | Background job queue |

---

## Security Policies

Extensions are validated against security policies before deployment:

```bash
# Validate against enterprise policy (strictest)
npx tribble ext validate --policy enterprise

# Development policy (warnings only)
npx tribble ext validate --policy development
```

| Policy | Use Case | Strictness |
|--------|----------|------------|
| **Enterprise** | Production deployments | Blocks: HTTP, unapproved integrations, PII without encryption |
| **Development** | Local testing | Warnings only |
| **Sandbox** | Isolated testing | No external network, read-only data |

```typescript
import { PolicyValidator, ENTERPRISE_POLICY } from '@tribble/sdk-policy';

const validator = new PolicyValidator(ENTERPRISE_POLICY);
const result = validator.validate(extension.manifest);

if (!result.valid) {
  result.violations.forEach(v => {
    console.error(`[${v.severity}] ${v.message}`);
    if (v.suggestion) console.log(`  Fix: ${v.suggestion}`);
  });
}
```

---

## CLI Reference

```bash
# Extension Commands
tribble ext init <name>          # Create new extension project
tribble ext validate             # Validate against policies
tribble ext test                 # Run extension tests
tribble ext plan --env <env>     # Preview deployment
tribble ext publish --env <env>  # Deploy extension
tribble ext promote              # Move between environments
tribble ext freeze               # Lock version in production
tribble ext migrate              # Run migrations

# Development
tribble runner                   # Run extension locally

# Document Operations
tribble upload <file>            # Upload to knowledge base
tribble connectors list          # List available integrations
```

---

## Examples

The `examples/` directory contains complete working examples:

- **nestle-demo/** - Field sales intelligence application
  - Full React frontend
  - Custom cartridge for sales preparation
  - CRM and POS tool integrations
  - Territory-based knowledge base

---

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Clean build artifacts
npm run clean

# Format code
npm run format
```

---

## License

UNLICENSED - Internal use only
