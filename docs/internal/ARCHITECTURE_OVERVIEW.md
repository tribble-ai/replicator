# Tribble SDK Architecture Overview

This document provides a visual reference for the SDK architecture described in the full PRD.

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE APPLICATIONS                           │
│                                                                          │
│  Salesforce Org          ServiceNow Instance       SAP S/4HANA          │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐      │
│  │ Lightning    │        │ Scoped App   │        │ Fiori App    │      │
│  │ Web Comp.    │        │ (UI Pages)   │        │ (UI5)        │      │
│  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘      │
│         │                       │                       │               │
│  ┌──────▼───────┐        ┌──────▼───────┐        ┌──────▼───────┐      │
│  │ Apex Classes │        │ Script       │        │ ABAP         │      │
│  │ (TribbleAPI) │        │ Includes     │        │ Gateway      │      │
│  └──────────────┘        └──────────────┘        └──────────────┘      │
│                                                                          │
│         │                       │                       │               │
│         └───────────────────────┴───────────────────────┘               │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       TRIBBLE REPLICATOR SDK                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     CORE PRIMITIVES LAYER                       │    │
│  │                                                                  │    │
│  │  upload()           createTag()         createUser()            │    │
│  │  createWorkflow()   executeAction()     query()                 │    │
│  │  subscribe()        retrieve()          uploadBatch()           │    │
│  │                                                                  │    │
│  │  (CUDA-like: Simple operations, infinite combinations)          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   CONNECTOR FRAMEWORK                           │    │
│  │                                                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │  │   Pull      │  │    Push     │  │   Hybrid    │            │    │
│  │  │   Sync      │  │  Webhooks   │  │   Mode      │            │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  │                                                                  │    │
│  │  • State Management       • Schema Mapping                      │    │
│  │  • Retry Logic            • Transformation Pipeline             │    │
│  │  • Deduplication          • Error Handling                      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │               DEPLOYMENT ADAPTERS                               │    │
│  │                                                                  │    │
│  │  Salesforce      ServiceNow      SAP S/4HANA     Hyperscaler   │    │
│  │  (Unmanaged      (Scoped App)    (Fiori+RFC)     (React+K8s)   │    │
│  │   Package)                                                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENHANCED UPLOAD ENDPOINT                              │
│                     (Gateway to AI Brain)                                │
│                                                                          │
│  POST /api/v1/upload                                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Input:                                                           │    │
│  │ • content: string | url | base64                                │    │
│  │ • contentType: 'pdf' | 'json' | 'csv' | 'html' | ...           │    │
│  │ • schema?: JSONSchema (for structured data)                     │    │
│  │ • metadata?: { key: value, ... }                                │    │
│  │ • tags?: ['invoice', 'q4-2025', ...]                            │    │
│  │ • processingHints?: { extractTables, ocrLanguage, ... }         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Processing Pipeline:                                             │    │
│  │ 1. Auth & Validation                                            │    │
│  │ 2. Content Extraction (PDF→text, HTML→markdown, CSV→JSON)      │    │
│  │ 3. Deduplication Check                                          │    │
│  │ 4. Chunking (semantic | paragraph | fixed)                      │    │
│  │ 5. Embedding Generation                                         │    │
│  │ 6. Knowledge Graph Update                                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   TRIBBLE CORE PLATFORM                                  │
│                      (The AI Brain)                                      │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │
│  │  Knowledge   │   │   Vector     │   │   Agent      │               │
│  │  Graph       │   │  Embeddings  │   │ Orchestrator │               │
│  └──────────────┘   └──────────────┘   └──────────────┘               │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │
│  │  Workflow    │   │  Generic     │   │  Identity &  │               │
│  │  Engine      │   │  HTTP Tool   │   │  Permissions │               │
│  └──────────────┘   └──────────────┘   └──────────────┘               │
│                                                                          │
│         │                                                                │
│         └─── Runtime Tool Calls (executeAction) ───┐                    │
│                                                     │                    │
└─────────────────────────────────────────────────────┼────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS (via HTTP Tool)                      │
│                                                                          │
│  ERP Systems     CRM Systems      ITSM Tools      Custom APIs          │
│  SAP, Oracle    Salesforce       ServiceNow      Company-specific      │
│  NetSuite       Dynamics         Jira            REST endpoints        │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE DATA SOURCES                               │
│                  (Ingested via SDK Connectors)                           │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ exceedra  │  │   FTP    │  │  Legacy  │  │  Flat    │               │
│  │  REST    │  │  Server  │  │   APIs   │  │  Files   │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   ERP    │  │   CRM    │  │   DMS    │  │   ITSM   │               │
│  │ Systems  │  │ Systems  │  │ Systems  │  │ Systems  │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Document Ingestion Example

```
Legacy System (exceedra REST API)
        │
        │ 1. Connector polls API on schedule (every 4 hours)
        ▼
SDK Connector (exceedra-rest)
        │
        │ 2. Transform data: snake_case → camelCase, Unix timestamps → Date
        ▼
SDK Primitive: upload()
        │
        │ 3. HTTP POST /api/v1/upload
        │    { content: JSON, contentType: 'json', schema: {...} }
        ▼
Enhanced Upload Endpoint
        │
        │ 4. Validate schema, deduplicate, chunk, embed
        ▼
Tribble Core Platform
        │
        │ 5. Store in knowledge graph + vector DB
        ▼
AI Agent Query
        │
        │ 6. User asks: "What claims from exceedra are pending?"
        ▼
Agent Response
        "Based on exceedra data, 23 claims are pending approval..."
```

## Data Flow: Runtime Action Example

```
User Chat Message
"Create a purchase order for ACME Corp: 100 widgets @ $50 each"
        │
        ▼
Tribble Agent (LLM decides to use tool)
        │
        │ Tool: create_purchase_order
        │ Parameters: { vendor: "ACME Corp", items: [...], total: 5000 }
        ▼
Generic HTTP Tool (in Tribble Core)
        │
        │ SDK-defined mapping:
        │ POST https://erp.company.com/api/purchase-orders
        ▼
External ERP System
        │
        │ Creates PO, returns PO-12345
        ▼
Agent Response
"Purchase order PO-12345 created for ACME Corp: $5,000"
```

## Connector Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CONNECTOR DEFINITION                            │
│                                                                      │
│  export const myConnector = defineConnector({                       │
│    name: 'my-system',                                               │
│    version: '1.0.0',                                                │
│    syncStrategy: 'pull',                                            │
│    schedule: { cron: '0 */6 * * *' },  // every 6 hours            │
│                                                                      │
│    configSchema: {                                                  │
│      type: 'object',                                                │
│      required: ['apiKey', 'baseUrl'],                               │
│      properties: {                                                  │
│        apiKey: { type: 'string' },                                  │
│        baseUrl: { type: 'string' }                                  │
│      }                                                               │
│    },                                                                │
│                                                                      │
│    async pull(ctx, { since, params }) {                             │
│      // 1. Fetch data from source system                            │
│      const data = await fetchFromAPI(ctx.config.apiKey, since)      │
│                                                                      │
│      // 2. Transform to standard format                             │
│      const transformed = transformData(data)                        │
│                                                                      │
│      // 3. Upload to Tribble using SDK primitives                   │
│      for (const record of transformed) {                            │
│        await ctx.tribble.upload({                                   │
│          content: JSON.stringify(record),                           │
│          contentType: 'json',                                       │
│          metadata: { source: 'my-system' },                         │
│          tags: ['my-system', record.type]                           │
│        })                                                            │
│      }                                                               │
│                                                                      │
│      // 4. Update state for incremental sync                        │
│      await ctx.state.set('lastSync', new Date())                    │
│                                                                      │
│      return { documents: uploadedIds }                              │
│    }                                                                 │
│  })                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Target Architectures

### Salesforce Deployment

```
┌──────────────────────────────────────────────┐
│         Salesforce Org                       │
│                                              │
│  Lightning Page (Account Detail)            │
│  ┌──────────────────────────────────────┐   │
│  │ <tribble-agent-chat />               │   │
│  │  (Lightning Web Component)           │   │
│  │                                      │   │
│  │  User: "What deals are at risk?"    │   │
│  │  Tribble: "3 deals closing this..."  │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│                 │ @wire queryTribble         │
│                 ▼                            │
│  ┌──────────────────────────────────────┐   │
│  │  TribbleAPIClient.cls (Apex)         │   │
│  │                                      │   │
│  │  public static String query(...) {  │   │
│  │    HttpRequest req = ...            │   │
│  │    req.setEndpoint(TRIBBLE_API);    │   │
│  │    return http.send(req);           │   │
│  │  }                                   │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
└─────────────────┼────────────────────────────┘
                  │
                  │ HTTP POST /api/query
                  ▼
          Tribble Core Platform
```

### ServiceNow Deployment

```
┌──────────────────────────────────────────────┐
│       ServiceNow Instance                    │
│                                              │
│  Incident Form (INC0012345)                 │
│  ┌──────────────────────────────────────┐   │
│  │ [UI Macro: tribble_insights]         │   │
│  │                                      │   │
│  │ "Similar incidents resolved by..."   │   │
│  │ "Suggested knowledge article: KB..."│   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│                 │ GlideAjax call             │
│                 ▼                            │
│  ┌──────────────────────────────────────┐   │
│  │  TribbleAPIClient (Script Include)   │   │
│  │                                      │   │
│  │  query: function(question) {         │   │
│  │    var req = new sn_ws.RESTMessage()│   │
│  │    req.setEndpoint(TRIBBLE_API)     │   │
│  │    return req.execute()              │   │
│  │  }                                   │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
└─────────────────┼────────────────────────────┘
                  │
                  │ HTTP POST /api/query
                  ▼
          Tribble Core Platform
```

### Hyperscaler Deployment (Kubernetes)

```
┌──────────────────────────────────────────────────────────┐
│              AWS / Azure / GCP                           │
│                                                          │
│  Load Balancer (ALB / App Gateway / Cloud LB)          │
│  └────────┬─────────────────────────────────────────┐   │
│           │                                         │   │
│           ▼                                         │   │
│  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  Frontend Pod      │  │  Frontend Pod      │    │   │
│  │  (Next.js SSR)     │  │  (Next.js SSR)     │    │   │
│  └────────┬───────────┘  └────────┬───────────┘    │   │
│           │                       │                 │   │
│           ▼                       ▼                 │   │
│  ┌────────────────────┐  ┌────────────────────┐    │   │
│  │  Backend Pod       │  │  Backend Pod       │    │   │
│  │  (Node.js + SDK)   │  │  (Node.js + SDK)   │    │   │
│  │  • Connector       │  │  • Connector       │    │   │
│  │    Runtime         │  │    Runtime         │    │   │
│  │  • API Proxy       │  │  • API Proxy       │    │   │
│  └────────┬───────────┘  └────────┬───────────┘    │   │
│           │                       │                 │   │
│           └───────────┬───────────┘                 │   │
│                       │                             │   │
│  ┌────────────────────▼──────────────────────────┐  │   │
│  │         Managed Services                      │  │   │
│  │  • RDS/Cosmos/CloudSQL (connector state)     │  │   │
│  │  • S3/Blob/GCS (document uploads)            │  │   │
│  │  • SQS/ServiceBus/PubSub (job queue)         │  │   │
│  └───────────────────────────────────────────────┘  │   │
└──────────────────────────────────────────────────────────┘
                         │
                         │ HTTP requests
                         ▼
                 Tribble Core Platform
```

## SDK Package Structure

```
@tribble/sdk (monorepo root)
│
├── packages/
│   ├── core/                   # HTTP client, auth, config
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── http.ts        # HTTP client with retry
│   │   │   ├── auth.ts        # Token management
│   │   │   └── errors.ts      # Error classes
│   │   └── package.json
│   │
│   ├── primitives/             # CUDA-like operations
│   │   ├── src/
│   │   │   ├── upload.ts      # upload()
│   │   │   ├── createTag.ts   # createTag()
│   │   │   ├── createUser.ts  # createUser()
│   │   │   ├── query.ts       # query()
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── connectors/             # Connector framework
│   │   ├── src/
│   │   │   ├── define.ts      # defineConnector()
│   │   │   ├── runtime.ts     # Executor
│   │   │   ├── state.ts       # State management
│   │   │   └── tools.ts       # Utility functions
│   │   └── package.json
│   │
│   ├── connectors-library/     # Pre-built connectors
│   │   ├── salesforce-objects/
│   │   ├── servicenow-itsm/
│   │   ├── sap-s4hana-odata/
│   │   ├── ftp-csv/
│   │   ├── rest-generic/
│   │   └── ... (20+ connectors)
│   │
│   ├── deployment/             # Deployment adapters
│   │   ├── salesforce/
│   │   │   ├── lwc/           # Lightning Web Components
│   │   │   ├── apex/          # Apex classes
│   │   │   └── package.xml
│   │   ├── servicenow/
│   │   │   ├── ui-pages/
│   │   │   ├── script-includes/
│   │   │   └── update-set.xml
│   │   ├── sap/
│   │   │   ├── fiori-app/
│   │   │   ├── abap/
│   │   │   └── transport.zip
│   │   └── hyperscaler/
│   │       ├── react-app/
│   │       ├── docker/
│   │       ├── k8s/
│   │       └── terraform/
│   │
│   ├── cli/                    # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── deploy.ts
│   │   │   │   ├── connector.ts
│   │   │   │   └── config.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── sdk/                    # Umbrella package
│       ├── src/
│       │   └── index.ts       # Re-exports all packages
│       └── package.json
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 1. TRANSPORT SECURITY                                  │     │
│  │    • TLS 1.3 for all connections                       │     │
│  │    • Certificate pinning (optional)                    │     │
│  │    • WAF rules at edge                                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 2. AUTHENTICATION                                      │     │
│  │    • API tokens (Bearer auth)                          │     │
│  │    • Token rotation (refresh tokens)                   │     │
│  │    • SSO integration (OAuth 2.0, SAML 2.0)            │     │
│  │    • MFA support                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 3. AUTHORIZATION                                       │     │
│  │    • Role-Based Access Control (RBAC)                  │     │
│  │    • Attribute-Based Access Control (ABAC)             │     │
│  │    • Document-level permissions                        │     │
│  │    • API scope restrictions                            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 4. DATA PROTECTION                                     │     │
│  │    • At-rest encryption (AES-256)                      │     │
│  │    • In-transit encryption (TLS 1.3)                   │     │
│  │    • PII detection & masking                           │     │
│  │    • Secrets management (vault integration)            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 5. AUDIT & COMPLIANCE                                  │     │
│  │    • Structured audit logs (all operations)            │     │
│  │    • Data lineage tracking                             │     │
│  │    • GDPR compliance (right to deletion)               │     │
│  │    • SOC 2 Type II controls                            │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY LAYERS                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ METRICS (Prometheus/CloudWatch/Azure Monitor)          │     │
│  │                                                         │     │
│  │  • Upload success/failure rates                        │     │
│  │  • Latency percentiles (P50, P95, P99)                 │     │
│  │  • Connector sync duration                             │     │
│  │  • Error rates by type                                 │     │
│  │  • Throughput (uploads/sec)                            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ LOGS (Structured JSON via OpenTelemetry)               │     │
│  │                                                         │     │
│  │  • INFO: Successful operations                         │     │
│  │  • WARN: Retryable errors                              │     │
│  │  • ERROR: Failed operations                            │     │
│  │  • DEBUG: Detailed execution traces                    │     │
│  │                                                         │     │
│  │  Correlation via request IDs across services           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ TRACES (OpenTelemetry → Jaeger/X-Ray/AppInsights)     │     │
│  │                                                         │     │
│  │  SDK Client → Upload Endpoint → Tribble Core          │     │
│  │     100ms         250ms            150ms               │     │
│  │  └───────────────────────────────────────────┘         │     │
│  │  Total: 500ms (P50 latency)                            │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ ALERTS (PagerDuty/OpsGenie)                            │     │
│  │                                                         │     │
│  │  • Upload failure rate > 5% (15 min)                   │     │
│  │  • P95 latency > 2s (5 min)                            │     │
│  │  • Connector sync failures (immediate)                 │     │
│  │  • Authentication error spike (5 min)                  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### AD1: Integration Logic at SDK Layer
**Rationale**: Keeps Tribble core clean; enables community contributions; faster iteration on connectors

### AD2: Enhanced Upload Endpoint as Universal Gateway
**Rationale**: Single, robust interface for all content types; clean SDK/core contract; supports evolution

### AD3: CUDA-Like Primitives
**Rationale**: Reduces cognitive load; composable operations; maximum flexibility for developers

### AD4: Multi-Platform Deployment Support
**Rationale**: Meet buyers where they operate; reduces adoption friction; expands TAM

### AD5: Generic HTTP Tool for Runtime Actions
**Rationale**: Tribble core doesn't need to know every external API; SDK provides type-safe definitions

---

For full details, see [PRD_CUDA_INTEGRATION_LAYER.md](./PRD_CUDA_INTEGRATION_LAYER.md)
