# Product Requirements Document: Tribble Replicator SDK Evolution
## CUDA-Like AI Orchestration & Enterprise Integration Layer

**Version:** 1.0
**Date:** October 3, 2025
**Document Owner:** Product & Engineering Leadership
**Status:** Draft for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Opportunity](#2-problem-statement--opportunity)
3. [Strategic Vision & Goals](#3-strategic-vision--goals)
4. [Solution Architecture](#4-solution-architecture)
5. [Core Capabilities & Primitives](#5-core-capabilities--primitives)
6. [Integration Layer Design](#6-integration-layer-design)
7. [Deployment Targets](#7-deployment-targets)
8. [Enhanced Upload Endpoint Specifications](#8-enhanced-upload-endpoint-specifications)
9. [Technical Specifications](#9-technical-specifications)
10. [Success Metrics & KPIs](#10-success-metrics--kpis)
11. [Implementation Phases](#11-implementation-phases)
12. [Risk Analysis & Mitigation](#12-risk-analysis--mitigation)
13. [Dependencies & Constraints](#13-dependencies--constraints)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### Overview
This PRD defines the evolution of the Tribble Replicator SDK from a basic Node.js API wrapper into a comprehensive AI orchestration and enterprise integration layer—analogous to how CUDA positioned NVIDIA as the essential layer for GPU computing. The SDK will become the strategic integration point that makes Tribble indispensable across enterprise ecosystems.

### Current State
The Tribble SDK (v0.1.0) currently provides basic client libraries for:
- Agent interactions
- Document ingestion
- Workflow orchestration
- Event handling
- Connector definitions

### Target State
Transform the SDK into a multi-layered platform that:
1. **Acts as a standardized integration layer** for disparate enterprise systems across varying levels of technical sophistication
2. **Provides deployment strategies** into major enterprise platforms (Salesforce, ServiceNow, SAP S/4HANA)
3. **Handles data ingestion complexity** from legacy systems (FTP, flat files, poor APIs)
4. **Offers CUDA-like primitives** for AI orchestration (upload, tag, user, workflow operations)
5. **Enables dual deployment paths**: React apps to hyperscalers AND native apps in enterprise ecosystems
6. **Cements Tribble as the AI orchestration core** across business operations

### Business Impact
- **Strategic Positioning**: Tribble becomes the "CUDA of AI orchestration"—the essential layer enterprises cannot remove
- **Market Differentiation**: Unique position as both integration layer AND AI brain
- **Revenue Impact**: Drives adoption through reduced integration friction and deployment flexibility
- **Competitive Moat**: Deep enterprise system integration creates high switching costs

### Key Architectural Principles
1. **Decoupled Core**: Keep Tribble platform clean; push integration complexity to SDK layer
2. **Enhanced Upload Interface**: Robust endpoint as gateway to AI brain
3. **Primitive-Based Design**: CUDA-like instructions for composable AI operations
4. **Runtime Tool Flexibility**: Generic HTTP endpoint tool in core; SDK handles mapping

---

## 2. Problem Statement & Opportunity

### Problem Space

#### P1: Enterprise Integration Complexity
**Current State:**
Enterprises operate heterogeneous technical landscapes with systems spanning decades:
- Modern REST APIs (rare)
- SOAP services (common in SAP, older enterprise systems)
- FTP-based file drops (manufacturing, supply chain)
- Flat file extracts with inconsistent formats
- Poor API designs (e.g., exceedra REST)
- Legacy databases with direct query access only

**Impact:**
- Custom integration work required for every customer deployment
- Professional services bottleneck preventing scale
- 6-12 month implementation timelines
- Integration maintenance burden grows linearly with customers

**Why This Matters:**
If Tribble requires custom integration work for each deployment, it cannot scale as a product. The SDK must abstract this complexity into reusable patterns.

#### P2: Deployment Target Fragmentation
**Current State:**
Enterprise buyers require AI solutions deployed within their existing platforms:
- **Salesforce orgs**: Want Tribble as Lightning Web Components in Salesforce UI
- **ServiceNow instances**: Expect native ServiceNow apps integrated with CMDB/ITSM
- **SAP S/4HANA**: Require Fiori apps or RFC-compatible integrations
- **Hyperscalers**: Some want React apps on AWS/Azure/GCP with their identity providers

**Impact:**
- No standardized deployment model = custom builds per platform
- Platform-specific expertise required (Salesforce devs, ServiceNow devs, SAP devs)
- Cannot reuse UI/UX work across deployment targets
- Limits total addressable market to customers willing to accept our deployment model

**Why This Matters:**
Meeting enterprise buyers where they already operate reduces adoption friction by 10x. Platform-native deployments feel like extensions, not bolt-ons.

#### P3: Data Ingestion Variability
**Current State:**
Tribble's current ingestion assumes:
- Unstructured documents (PDFs, emails)
- Well-formed API calls from modern systems
- Minimal data transformation needs

**Reality:**
Enterprise data arrives in countless forms:
- Structured transactional data (order histories, customer records)
- Semi-structured data (XML exports, JSON with inconsistent schemas)
- Unstructured content (scanned documents, HTML knowledge bases)
- Hybrid data (PDF invoices with structured metadata)
- Temporal data requiring incremental sync (delta loads, change data capture)

**Impact:**
- Cannot ingest critical business data locked in legacy systems
- Limited context for AI brain reduces value of responses
- Customers forced to build custom ETL pipelines

**Why This Matters:**
AI value increases exponentially with context breadth. If Tribble cannot ingest all relevant business data, it remains a point solution rather than platform.

#### P4: AI Orchestration Abstraction Gap
**Current State:**
Developers building on Tribble must:
- Understand Tribble's entire API surface
- Handle authentication, retries, error handling themselves
- Manually compose multi-step AI workflows
- Write boilerplate for common patterns (upload + tag + trigger workflow)

**Opportunity:**
CUDA succeeded by providing simple primitives that abstracted GPU complexity:
- `cudaMalloc()`, `cudaMemcpy()`, `cudaLaunchKernel()`
- Developers think in operations, not hardware details
- Composable building blocks for complex applications

**Why This Matters:**
Reducing cognitive load by 90% through primitive-based design will drive 10x adoption among enterprise developers. The SDK should feel like "CRUD operations for AI."

### Market Opportunity

#### Total Addressable Market (TAM)
- **Salesforce ecosystem**: 150,000+ companies with Salesforce orgs
- **ServiceNow ecosystem**: 7,000+ enterprise customers
- **SAP ecosystem**: 230,000+ customers (concentrated in Fortune 2000)
- **Enterprise AI adoption**: Growing 40% YoY

#### Positioning Advantage
By solving the integration + deployment problem, Tribble can:
1. **Land**: Deploy quickly via SDK-powered connectors (weeks vs. months)
2. **Expand**: Integrate additional data sources through SDK primitives
3. **Entrench**: Become the AI orchestration layer that other systems depend on
4. **Defend**: High switching costs from deep integrations across business systems

---

## 3. Strategic Vision & Goals

### Vision Statement
**Tribble Replicator SDK becomes the CUDA of AI orchestration:** the essential, standardized integration layer that makes AI accessible across every enterprise system, deployment target, and data source—positioning Tribble as irreplaceable infrastructure for business AI.

### Strategic Goals

#### SG1: Achieve "CUDA-like" Platform Status
**Objective**: Establish Tribble SDK as the de facto standard for enterprise AI orchestration
**Metrics**:
- 1,000+ organizations using SDK for custom integrations within 18 months
- 50+ community-contributed connectors in marketplace
- SDK mentioned in 30% of enterprise AI RFPs as evaluation criteria

**Why This Matters**: Platform status creates network effects and defensive moat. Once enterprises standardize on Tribble SDK, replacing it requires rewriting integrations.

#### SG2: Eliminate Integration as Deployment Blocker
**Objective**: Reduce time-to-production from 6-12 months to 2-4 weeks
**Metrics**:
- 80% of deployments require zero custom integration code
- Professional services revenue shifts from integration to optimization
- Average implementation timeline reduced by 75%

**Why This Matters**: Integration friction is the #1 reason enterprise AI projects fail. Removing this blocker unlocks market velocity.

#### SG3: Enable Multi-Platform Deployment Flexibility
**Objective**: Support native deployments in Salesforce, ServiceNow, SAP, and hyperscalers
**Metrics**:
- SDK supports 4 deployment targets (Salesforce, ServiceNow, SAP, AWS/Azure/GCP)
- 40% of customers deploy in their existing enterprise platform vs. standalone
- Customers can switch deployment targets without rebuilding integrations

**Why This Matters**: Meeting buyers where they operate reduces sales cycle friction and expands TAM to platform-loyal customers.

#### SG4: Maximize AI Context Through Universal Data Ingestion
**Objective**: Enable ingestion from any enterprise data source through SDK abstractions
**Metrics**:
- SDK supports 15+ source system types (ERP, CRM, FTP, databases, APIs)
- Average customer connects 8+ data sources (vs. 2 today)
- AI response accuracy improves 30% from broader context

**Why This Matters**: AI value scales with context. The more business data Tribble ingests, the more valuable and irreplaceable it becomes.

### Success Criteria (18-Month Horizon)

**MUST Achieve**:
- [ ] SDK deployed in 500+ production environments
- [ ] 3 deployment targets fully supported (Salesforce, ServiceNow, hyperscalers)
- [ ] 20+ pre-built connectors for common enterprise systems
- [ ] 90% reduction in custom integration code vs. baseline
- [ ] Net Promoter Score (NPS) > 40 from SDK developers

**SHOULD Achieve**:
- [ ] SAP S/4HANA deployment target in beta
- [ ] Community marketplace with 10+ third-party connectors
- [ ] SDK referenced in Gartner/Forrester enterprise AI reports
- [ ] 3 Fortune 500 case studies featuring SDK-powered deployments

**NICE TO HAVE**:
- [ ] SDK ported to additional languages (Python, Java)
- [ ] Visual connector builder for non-technical users
- [ ] Real-time streaming data ingestion support

---

## 4. Solution Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE DEPLOYMENT TARGETS                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Salesforce  │  │  ServiceNow  │  │ SAP S/4HANA  │  │Hyperscale│ │
│  │  (Unmanaged  │  │  (Scoped App)│  │ (Fiori/RFC)  │  │(React/  │ │
│  │   Package)   │  │              │  │              │  │ Native) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
└─────────┼──────────────────┼──────────────────┼───────────────┼──────┘
          │                  │                  │               │
          └──────────────────┴──────────────────┴───────────────┘
                                      │
          ┌───────────────────────────▼───────────────────────────┐
          │         TRIBBLE REPLICATOR SDK (Integration Layer)     │
          │                                                         │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │           CORE PRIMITIVES (CUDA-like)           │  │
          │  │  • upload()  • createTag()  • createUser()      │  │
          │  │  • createWorkflow()  • executeAction()          │  │
          │  │  • query()  • subscribe()  • batch()            │  │
          │  └─────────────────────────────────────────────────┘  │
          │                                                         │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │          CONNECTOR FRAMEWORK                     │  │
          │  │  • Pull-based sync  • Push-based webhooks       │  │
          │  │  • Incremental delta  • Full refresh            │  │
          │  │  • Schema mapping  • Transformation pipelines   │  │
          │  └─────────────────────────────────────────────────┘  │
          │                                                         │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │         DATA MASSAGE & TRANSFORMATION            │  │
          │  │  • CSV → Structured  • HTML → Markdown          │  │
          │  │  • XML → JSON  • Binary → Base64                │  │
          │  │  • Schema validation  • Deduplication           │  │
          │  └─────────────────────────────────────────────────┘  │
          │                                                         │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │           DEPLOYMENT ADAPTERS                    │  │
          │  │  • Salesforce LWC  • ServiceNow UI Builder      │  │
          │  │  • SAP UI5/Fiori  • React/Next.js               │  │
          │  └─────────────────────────────────────────────────┘  │
          └────────────────────────┬────────────────────────────┘
                                   │
          ┌────────────────────────▼─────────────────────────────┐
          │      ENHANCED UPLOAD ENDPOINT (Gateway to Brain)     │
          │                                                       │
          │  POST /api/upload                                    │
          │  • Unstructured content (PDF, text, images)          │
          │  • Structured data (JSON, CSV with schema)           │
          │  • Hybrid content (PDFs with metadata)               │
          │  • Batch uploads (multi-document transactions)       │
          │  • Streaming ingestion (large datasets)              │
          └────────────────────────┬─────────────────────────────┘
                                   │
          ┌────────────────────────▼─────────────────────────────┐
          │         TRIBBLE CORE PLATFORM (The AI Brain)         │
          │                                                       │
          │  • Knowledge Graph  • Vector Embeddings              │
          │  • Agent Orchestration  • Workflow Engine            │
          │  • Generic HTTP Tool (runtime tool calls)            │
          │  • Identity & Permissions  • Audit Logging           │
          └──────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────▼─────────────────────────────┐
          │       ENTERPRISE DATA SOURCES (via SDK Connectors)   │
          │                                                       │
          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
          │  │ exceedra  │ │  Flat    │ │   FTP    │ │  Legacy │ │
          │  │   REST   │ │  Files   │ │  Servers │ │   APIs  │ │
          │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
          │  │   ERP    │ │   CRM    │ │   DMS    │ │   ITSM  │ │
          │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
          └───────────────────────────────────────────────────────┘
```

### Architectural Principles

#### AP1: Separation of Concerns
**Principle**: Keep Tribble core platform decoupled from integration complexity

**Implementation**:
- **Tribble Core**: Focuses on AI orchestration, knowledge graph, agent workflows
- **SDK Layer**: Handles integration complexity, data transformation, deployment adapters
- **Enhanced Upload Endpoint**: Acts as clean contract between SDK and core

**Rationale**:
- Prevents core platform from becoming bloated with integration logic
- Allows independent evolution of integration strategies without core changes
- Enables community contributions to SDK without touching core platform
- Maintains platform stability while integration landscape evolves

**Trade-offs**:
- Adds network hop (SDK → Upload Endpoint → Core)
- Requires careful API design at SDK/core boundary
- Potential for duplication between SDK and core (mitigated by clear interface)

#### AP2: Primitive-First Design (CUDA Philosophy)
**Principle**: Provide low-level primitives that compose into complex operations

**Implementation**:
```typescript
// Low-level primitives
await sdk.upload({ content, type: 'pdf', metadata })
await sdk.createTag({ name: 'invoice', color: 'blue' })
await sdk.createWorkflow({ trigger, actions })

// Composed operations
await sdk.ingestInvoice({
  pdfContent,
  extractFields: ['total', 'vendor', 'date'],
  workflow: 'approval-routing'
})
// ^ Internally uses: upload() + createTag() + executeAction()
```

**Rationale**:
- Low-level primitives provide maximum flexibility for custom use cases
- High-level compositions provide ergonomics for common patterns
- Developers can drop down to primitives when composition doesn't fit
- Mirrors CUDA's success: simple operations, infinite combinations

**Trade-offs**:
- Requires more extensive documentation (primitive reference + composition guides)
- Steeper learning curve for beginners (mitigated by templates/examples)
- Risk of API surface growth (mitigated by strict primitive definition)

#### AP3: Integration Logic at SDK Layer
**Principle**: Custom integration code lives in SDK, not core platform

**Example: exceedra REST Integration**
```typescript
// SDK Connector (NOT in Tribble core)
const exceedraConnector = defineConnector({
  name: 'exceedra-rest',
  pull: async (ctx, { since }) => {
    const data = await fetchFromexceedra(ctx.config.apiKey, since)
    const transformed = transformexceedraToStandard(data)

    // Use SDK primitives to upload
    for (const record of transformed) {
      await ctx.tribble.ingest.upload({
        content: record.content,
        metadata: record.metadata,
        tags: ['exceedra', record.type]
      })
    }
  }
})
```

**Rationale**:
- Tribble core remains generic and stable
- Integration complexity isolated in SDK connectors
- Community can contribute connectors without core platform changes
- Failed integrations don't impact platform stability

**Trade-offs**:
- Requires SDK to be deployed/running for integrations (vs. native to platform)
- Potential performance overhead for high-volume ingestion
- SDK version compatibility management required

#### AP4: Enhanced Upload as Universal Gateway
**Principle**: Single, robust upload endpoint handles all ingestion types

**Interface Design**:
```typescript
POST /api/upload
{
  "content": "..." | base64 | url,
  "contentType": "pdf" | "json" | "csv" | "html" | "text",
  "schema": { /* for structured data */ },
  "metadata": { /* arbitrary key-value */ },
  "tags": ["invoice", "q4-2025"],
  "processingHints": {
    "extractTables": true,
    "ocrLanguage": "en",
    "chunkingStrategy": "semantic"
  }
}
```

**Rationale**:
- Single endpoint simplifies SDK implementation and testing
- Platform can evolve processing capabilities without breaking SDK
- Clear contract enables independent versioning
- Supports both unstructured and structured data through unified interface

**Trade-offs**:
- Large payload size for complex uploads (mitigated by streaming support)
- Potential for endpoint bloat if not disciplined (mitigated by versioning)

#### AP5: Runtime Tool Flexibility via Generic HTTP
**Principle**: Core platform provides generic HTTP endpoint tool; SDK maps actions to endpoints

**Flow**:
1. Developer defines action in SDK: `createPurchaseOrder({ vendor, items, total })`
2. SDK maps to HTTP call: `POST https://erp.company.com/api/po` with payload
3. At runtime, Tribble agent uses generic HTTP tool to execute
4. SDK handles response parsing and error handling

**Rationale**:
- Tribble core doesn't need to know about every possible external API
- SDK provides type-safe, validated action definitions
- Actions can evolve without core platform changes
- Supports infinite extensibility through HTTP

**Trade-offs**:
- Requires careful security model (what endpoints can SDK actions call?)
- Potential for abuse if HTTP tool too permissive
- Debugging harder (action → SDK mapping → HTTP call)

---

## 5. Core Capabilities & Primitives

### Primitive Operations (CUDA-like Instructions)

The SDK MUST provide these atomic operations as the foundation for all higher-level functionality. Each primitive maps to a single, well-defined operation in Tribble's core platform.

#### P1: Content Upload Primitives

##### `upload()`
**Purpose**: Ingest any content into Tribble's knowledge graph

**Signature**:
```typescript
async function upload(params: {
  content: string | Uint8Array | Blob | URL;
  contentType: 'pdf' | 'html' | 'text' | 'markdown' | 'json' | 'csv' | 'xml' | 'binary';
  metadata?: Record<string, any>;
  tags?: string[];
  schema?: JSONSchema; // for structured data
  processingHints?: {
    extractTables?: boolean;
    ocrLanguage?: string;
    chunkingStrategy?: 'paragraph' | 'semantic' | 'fixed';
    deduplication?: 'exact' | 'fuzzy' | 'none';
  };
}): Promise<{ documentId: string; chunks: number; status: 'processing' | 'indexed' }>
```

**Usage Example**:
```typescript
// Unstructured content
const doc = await sdk.upload({
  content: pdfBuffer,
  contentType: 'pdf',
  tags: ['invoice', 'vendor-acme'],
  metadata: { invoiceNumber: 'INV-12345', amount: 5000 }
})

// Structured data
const records = await sdk.upload({
  content: JSON.stringify(customerRecords),
  contentType: 'json',
  schema: customerSchema,
  processingHints: { deduplication: 'fuzzy' }
})
```

**Rationale**: Single primitive for all ingestion reduces cognitive load. Content type + schema determine processing path.

##### `uploadBatch()`
**Purpose**: Efficiently upload multiple documents in single transaction

**Signature**:
```typescript
async function uploadBatch(params: {
  documents: Array<UploadParams>;
  transactional?: boolean; // all-or-nothing vs. best-effort
}): Promise<{ succeeded: string[]; failed: Array<{ index: number; error: string }> }>
```

**Usage Example**:
```typescript
await sdk.uploadBatch({
  documents: [
    { content: pdf1, contentType: 'pdf', tags: ['contract'] },
    { content: pdf2, contentType: 'pdf', tags: ['contract'] },
    { content: csv1, contentType: 'csv', schema: orderSchema }
  ],
  transactional: false // best-effort: process successful uploads even if some fail
})
```

**Rationale**: Batch operations reduce network overhead for bulk ingestion (common in FTP/flat file scenarios).

#### P2: Organization & Metadata Primitives

##### `createTag()`
**Purpose**: Create reusable tag for content organization

**Signature**:
```typescript
async function createTag(params: {
  name: string;
  color?: string;
  description?: string;
  parent?: string; // for hierarchical tags
}): Promise<{ tagId: string }>
```

**Usage Example**:
```typescript
const invoiceTag = await sdk.createTag({
  name: 'invoice',
  color: '#FF5733',
  parent: 'financial-documents'
})
```

##### `createUser()`
**Purpose**: Provision user in Tribble with permissions

**Signature**:
```typescript
async function createUser(params: {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  permissions?: string[];
  metadata?: Record<string, any>;
}): Promise<{ userId: string }>
```

**Usage Example**:
```typescript
await sdk.createUser({
  email: 'john.doe@acme.com',
  name: 'John Doe',
  role: 'user',
  permissions: ['read:invoices', 'write:purchase-orders']
})
```

#### P3: Workflow & Orchestration Primitives

##### `createWorkflow()`
**Purpose**: Define automated workflow triggered by events

**Signature**:
```typescript
async function createWorkflow(params: {
  name: string;
  trigger: {
    type: 'document_uploaded' | 'tag_added' | 'query_executed' | 'schedule';
    conditions?: Record<string, any>;
  };
  actions: Array<{
    type: 'extract_fields' | 'send_notification' | 'execute_http' | 'update_metadata';
    params: Record<string, any>;
  }>;
}): Promise<{ workflowId: string }>
```

**Usage Example**:
```typescript
await sdk.createWorkflow({
  name: 'Invoice Approval Routing',
  trigger: {
    type: 'document_uploaded',
    conditions: { tags: ['invoice'], 'metadata.amount': { $gt: 10000 } }
  },
  actions: [
    { type: 'extract_fields', params: { fields: ['vendor', 'total', 'dueDate'] } },
    { type: 'send_notification', params: { to: 'approvers@acme.com', template: 'invoice-review' } }
  ]
})
```

##### `executeAction()`
**Purpose**: Run one-off action (tool call) via Tribble agent

**Signature**:
```typescript
async function executeAction(params: {
  actionName: string;
  parameters: Record<string, any>;
  context?: { documentIds?: string[]; tags?: string[] };
}): Promise<{ result: any; executionId: string }>
```

**Usage Example**:
```typescript
const result = await sdk.executeAction({
  actionName: 'create_purchase_order',
  parameters: { vendor: 'ACME Corp', items: [...], total: 5000 },
  context: { documentIds: ['doc-123'] } // relevant documents for AI context
})
```

#### P4: Query & Retrieval Primitives

##### `query()`
**Purpose**: Semantic search across knowledge graph

**Signature**:
```typescript
async function query(params: {
  question: string;
  filters?: { tags?: string[]; dateRange?: { start: Date; end: Date } };
  limit?: number;
  includeContext?: boolean;
}): Promise<{
  answer: string;
  sources: Array<{ documentId: string; excerpt: string; relevance: number }>;
}>
```

**Usage Example**:
```typescript
const response = await sdk.query({
  question: 'What invoices from ACME Corp are overdue?',
  filters: { tags: ['invoice'], dateRange: { start: new Date('2025-01-01'), end: new Date() } },
  includeContext: true
})
```

##### `retrieve()`
**Purpose**: Fetch documents by ID or filters

**Signature**:
```typescript
async function retrieve(params: {
  documentIds?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  limit?: number;
}): Promise<Array<{ documentId: string; content: string; metadata: Record<string, any> }>>
```

#### P5: Event & Subscription Primitives

##### `subscribe()`
**Purpose**: Register webhook for real-time events

**Signature**:
```typescript
async function subscribe(params: {
  events: Array<'document.uploaded' | 'workflow.completed' | 'action.executed'>;
  webhookUrl: string;
  signingSecret?: string;
}): Promise<{ subscriptionId: string }>
```

**Usage Example**:
```typescript
await sdk.subscribe({
  events: ['document.uploaded'],
  webhookUrl: 'https://myapp.com/webhooks/tribble',
  signingSecret: process.env.WEBHOOK_SECRET
})
```

### Composed Operations (High-Level Convenience APIs)

Built on primitives, these provide ergonomic shortcuts for common patterns.

#### `ingestInvoice()`
```typescript
// Composition of: upload() + createTag() + executeAction('extract_fields')
await sdk.ingestInvoice({
  pdfContent: invoicePdf,
  vendorName: 'ACME Corp',
  autoExtract: true, // extract total, date, line items
  routingWorkflow: 'approval-process'
})
```

#### `syncFromSource()`
```typescript
// Composition of: connector.pull() + uploadBatch() + deduplication
await sdk.syncFromSource({
  connector: 'exceedra-rest',
  since: lastSyncTimestamp,
  batchSize: 100,
  onProgress: (processed, total) => console.log(`${processed}/${total}`)
})
```

#### `deployToSalesforce()`
```typescript
// Composition of: package build + deployment + health check
await sdk.deployToSalesforce({
  orgUrl: 'https://acme.salesforce.com',
  credentials: { username, password, securityToken },
  components: ['TribbleAgent', 'InvoiceProcessor', 'DashboardLWC']
})
```

### Primitive Design Principles

1. **Single Responsibility**: Each primitive does ONE thing well
2. **Composability**: Primitives combine to create complex operations
3. **Idempotency**: Repeated calls with same params produce same result (where possible)
4. **Error Transparency**: Clear error codes, retryable vs. non-retryable
5. **Type Safety**: Full TypeScript definitions with validation
6. **Performance**: Batch versions of primitives for high-volume scenarios

---

## 6. Integration Layer Design

### Connector Framework

The SDK provides a standardized framework for building integrations with any enterprise data source. Connectors are the mechanism by which data flows from legacy systems into Tribble.

#### Connector Definition Interface

```typescript
export interface ConnectorDefinition {
  // Identity & metadata
  name: string;
  version: string;
  description: string;
  vendor?: string;

  // Configuration schema (defines required credentials/params)
  configSchema: JSONSchema;

  // Synchronization strategy
  syncStrategy: 'pull' | 'push' | 'hybrid';

  // Pull-based sync (connector fetches data on schedule)
  pull?: (ctx: ConnectorContext, params: PullParams) => Promise<PullResult>;

  // Push-based sync (source system sends webhooks)
  push?: (ctx: ConnectorContext, payload: any) => Promise<PushResult>;

  // Scheduling (for pull-based connectors)
  schedule?: {
    cron?: string; // e.g., '0 */6 * * *' for every 6 hours
    interval?: number; // milliseconds
    timezone?: string;
  };

  // Data transformation pipeline
  transform?: (rawData: any) => Promise<TransformedData>;

  // Validation before upload
  validate?: (data: any) => Promise<ValidationResult>;

  // Cleanup/teardown
  teardown?: (ctx: ConnectorContext) => Promise<void>;
}
```

#### Connector Context

The runtime environment provided to connectors:

```typescript
export interface ConnectorContext {
  // Identity
  accountId: string;
  connectorId: string;

  // Tribble SDK client (for uploading data)
  tribble: TribbleSDK;

  // Connector-specific configuration (validated against configSchema)
  config: Record<string, any>;

  // State management (for incremental sync)
  state: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };

  // Logging & telemetry
  logger: Logger;
  metrics: MetricsCollector;

  // Utility tools
  tools: {
    pdf: { fromMarkdown(md: string): Promise<Uint8Array> };
    html: { toMarkdown(html: string): Promise<string> };
    csv: { parse(csv: string, schema?: JSONSchema): Promise<any[]> };
  };
}
```

#### Example Connector: exceedra REST Integration

**Problem**: exceedra provides a poorly designed REST API for pharmacy claims data. We need to ingest this data into Tribble without adding exceedra-specific logic to the core platform.

**Solution**: SDK-based connector that handles exceedra's quirks and transforms data before upload.

```typescript
import { defineConnector } from '@tribble/sdk-connectors';

const exceedraConnector = defineConnector({
  name: 'exceedra-rest',
  version: '1.0.0',
  description: 'Sync pharmacy claims data from exceedra REST API',

  configSchema: {
    type: 'object',
    required: ['apiKey', 'baseUrl'],
    properties: {
      apiKey: { type: 'string', description: 'exceedra API key' },
      baseUrl: { type: 'string', description: 'exceedra API base URL' },
      pharmacyId: { type: 'string', description: 'Pharmacy identifier' }
    }
  },

  syncStrategy: 'pull',
  schedule: { cron: '0 */4 * * *' }, // every 4 hours

  async pull(ctx, { since }) {
    const { apiKey, baseUrl, pharmacyId } = ctx.config;

    // Fetch claims since last sync
    const response = await fetch(`${baseUrl}/claims`, {
      headers: { 'X-API-Key': apiKey },
      body: JSON.stringify({
        pharmacy_id: pharmacyId,
        updated_since: since || ctx.state.get('lastSync')
      })
    });

    const rawClaims = await response.json();

    // Transform exceedra's weird format to standard schema
    const transformed = rawClaims.map(claim => ({
      claimId: claim.id,
      patientName: claim.patient_name, // exceedra uses snake_case
      medication: claim.drug_name,
      prescriber: claim.prescriber_npi,
      fillDate: new Date(claim.fill_date_unix * 1000), // exceedra returns Unix timestamps
      copay: claim.patient_pay_amount / 100, // exceedra stores cents
      insurancePaid: claim.plan_pay_amount / 100,
      status: mapexceedraStatus(claim.adjudication_status)
    }));

    // Upload to Tribble using SDK primitives
    const uploaded = [];
    for (const claim of transformed) {
      const result = await ctx.tribble.upload({
        content: JSON.stringify(claim),
        contentType: 'json',
        schema: claimSchema,
        tags: ['pharmacy-claim', 'exceedra', claim.status],
        metadata: {
          source: 'exceedra',
          pharmacyId,
          claimId: claim.claimId
        }
      });
      uploaded.push(result.documentId);
    }

    // Update sync state
    await ctx.state.set('lastSync', new Date().toISOString());

    return {
      documents: uploaded,
      recordsProcessed: transformed.length
    };
  }
});

export default exceedraConnector;
```

**Rationale**: All exceedra-specific logic lives in SDK connector. Tribble core only sees standardized claim data via upload endpoint. If exceedra API changes, we update connector—not platform.

#### Example Connector: FTP Flat File Ingestion

**Problem**: Manufacturing companies drop CSV files on FTP servers nightly. Files have inconsistent schemas and naming conventions.

**Solution**: SDK connector that polls FTP, detects schemas, and ingests incrementally.

```typescript
import { defineConnector } from '@tribble/sdk-connectors';
import { Client as FTPClient } from 'basic-ftp';

const ftpFlatFileConnector = defineConnector({
  name: 'ftp-flat-files',
  version: '1.0.0',
  description: 'Ingest CSV/flat files from FTP server',

  configSchema: {
    type: 'object',
    required: ['host', 'username', 'password', 'directory'],
    properties: {
      host: { type: 'string' },
      port: { type: 'number', default: 21 },
      username: { type: 'string' },
      password: { type: 'string' },
      directory: { type: 'string', description: 'Remote directory to monitor' },
      filePattern: { type: 'string', default: '*.csv', description: 'Glob pattern for files' },
      deleteAfterSync: { type: 'boolean', default: false }
    }
  },

  syncStrategy: 'pull',
  schedule: { cron: '0 2 * * *' }, // 2 AM daily

  async pull(ctx, { since }) {
    const { host, port, username, password, directory, filePattern, deleteAfterSync } = ctx.config;

    // Connect to FTP
    const ftp = new FTPClient();
    await ftp.access({ host, port, user: username, password });
    await ftp.cd(directory);

    // List files matching pattern
    const files = await ftp.list();
    const csvFiles = files.filter(f =>
      f.name.endsWith('.csv') &&
      new Date(f.modifiedAt) > new Date(since || 0)
    );

    const uploaded = [];

    for (const file of csvFiles) {
      // Download file
      const stream = await ftp.downloadTo(file.name);
      const csvContent = stream.toString('utf-8');

      // Detect schema from CSV headers
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const schema = inferSchemaFromHeaders(headers);

      // Parse CSV using SDK tools
      const records = await ctx.tools.csv.parse(csvContent, schema);

      // Upload batch
      const result = await ctx.tribble.uploadBatch({
        documents: records.map(record => ({
          content: JSON.stringify(record),
          contentType: 'json',
          schema,
          tags: ['ftp-import', extractTagFromFilename(file.name)],
          metadata: {
            source: 'ftp',
            filename: file.name,
            importDate: new Date().toISOString()
          }
        })),
        transactional: false // best-effort
      });

      uploaded.push(...result.succeeded);

      // Optionally delete file after successful upload
      if (deleteAfterSync && result.succeeded.length === records.length) {
        await ftp.remove(file.name);
        ctx.logger.info(`Deleted ${file.name} after successful sync`);
      }
    }

    await ftp.close();

    return {
      documents: uploaded,
      filesProcessed: csvFiles.length
    };
  }
});

export default ftpFlatFileConnector;
```

**Rationale**: FTP polling logic encapsulated in connector. Schema inference and CSV parsing handled by SDK tools. Tribble core receives clean, validated JSON records.

### Pre-Built Connector Library

The SDK MUST ship with connectors for common enterprise systems to accelerate adoption:

| Connector | System Type | Priority | Sync Strategy | Description |
|-----------|-------------|----------|---------------|-------------|
| salesforce-objects | CRM | P0 | Pull + Push | Sync Salesforce objects (Accounts, Opportunities, Cases) |
| servicenow-itsm | ITSM | P0 | Pull + Push | Sync ServiceNow incidents, change requests, knowledge base |
| sap-s4hana-odata | ERP | P0 | Pull | Extract transactional data via OData APIs |
| sharepoint-online | DMS | P1 | Pull + Push | Sync documents and metadata from SharePoint |
| ftp-csv | File Transfer | P1 | Pull | Generic FTP connector for CSV/flat files |
| sftp-xml | File Transfer | P1 | Pull | Generic SFTP connector for XML files |
| rest-generic | API | P1 | Pull + Push | Configurable REST API connector with auth templates |
| sql-database | Database | P1 | Pull | Generic SQL connector (PostgreSQL, MySQL, SQL Server) |
| google-drive | DMS | P2 | Pull + Push | Sync documents from Google Drive |
| box | DMS | P2 | Pull + Push | Sync documents from Box |
| workday | HRIS | P2 | Pull | Extract HR data (employees, org structure) |
| netsuite | ERP/CRM | P2 | Pull | Extract NetSuite records via SuiteTalk API |
| jira | Project Management | P2 | Pull + Push | Sync Jira issues, comments, attachments |
| confluence | Wiki | P2 | Pull + Push | Sync Confluence pages and spaces |
| zendesk | Support | P3 | Pull + Push | Sync support tickets and knowledge base |

**Success Criteria**: 20+ pre-built connectors available at GA launch.

---

## 7. Deployment Targets

The SDK MUST support native deployment into major enterprise platforms. Each deployment target requires platform-specific adapters and packaging strategies.

### 7.1 Salesforce (Unmanaged Package)

#### Deployment Model
**Unmanaged Package**: Install once, customize freely, no ongoing upgrade control

**Components**:
1. **Lightning Web Components (LWC)**: UI components for Tribble agent chat, document upload, search
2. **Apex Classes**: Server-side logic for calling Tribble APIs, handling webhooks
3. **Custom Objects**: Store Tribble configuration, sync status, conversation history
4. **Named Credentials**: Secure storage of Tribble API credentials
5. **Platform Events**: Real-time updates from Tribble to Salesforce UI

#### Architecture

```
Salesforce Org
├── Lightning Web Components
│   ├── tribbleAgentChat.js        (Chat interface in Lightning page)
│   ├── tribbleDocumentUpload.js   (Drag-drop file upload)
│   ├── tribbleSearchResults.js    (Display search results)
│   └── tribbleInsights.js         (Dashboard with Tribble insights)
│
├── Apex Classes
│   ├── TribbleAPIClient.cls       (HTTP callouts to Tribble SDK)
│   ├── TribbleWebhookHandler.cls  (Receive webhooks from Tribble)
│   ├── TribbleConnectorBase.cls   (Base class for Salesforce → Tribble sync)
│   ├── SalesforceObjectConnector.cls (Sync Accounts/Opps/Cases)
│   └── TribbleScheduledSync.cls   (Scheduled job for incremental sync)
│
├── Custom Objects
│   ├── Tribble_Config__c          (API credentials, settings)
│   ├── Tribble_Sync_Status__c     (Track sync progress per object)
│   └── Tribble_Conversation__c    (Store agent chat history)
│
├── Named Credentials
│   └── Tribble_API                (Callout endpoint + auth)
│
└── Platform Events
    └── Tribble_Update__e          (Real-time updates from Tribble)
```

#### Implementation Approach

**Phase 1**: Basic integration (Apex callouts to Tribble upload endpoint)
```apex
public class TribbleAPIClient {
    private static final String TRIBBLE_ENDPOINT = 'callout:Tribble_API';

    public static String uploadDocument(String content, String contentType, Map<String, Object> metadata) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(TRIBBLE_ENDPOINT + '/api/upload');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');

        Map<String, Object> payload = new Map<String, Object>{
            'content' => EncodingUtil.base64Encode(Blob.valueOf(content)),
            'contentType' => contentType,
            'metadata' => metadata,
            'tags' => new List<String>{ 'salesforce', 'org-' + UserInfo.getOrganizationId() }
        };

        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) result.get('documentId');
        } else {
            throw new TribbleException('Upload failed: ' + res.getBody());
        }
    }
}
```

**Phase 2**: LWC chat interface
```javascript
// tribbleAgentChat.js
import { LightningElement, track } from 'lwc';
import uploadDocument from '@salesforce/apex/TribbleAPIClient.uploadDocument';
import queryTribble from '@salesforce/apex/TribbleAPIClient.query';

export default class TribbleAgentChat extends LightningElement {
    @track messages = [];
    @track inputValue = '';

    handleInputChange(event) {
        this.inputValue = event.target.value;
    }

    async handleSend() {
        const userMessage = this.inputValue;
        this.messages.push({ role: 'user', content: userMessage });
        this.inputValue = '';

        try {
            // Call Tribble via Apex
            const response = await queryTribble({
                question: userMessage,
                context: { salesforceOrgId: this.orgId }
            });

            this.messages.push({ role: 'assistant', content: response });
        } catch (error) {
            console.error('Tribble query failed:', error);
        }
    }
}
```

**Phase 3**: Bi-directional sync (Salesforce Objects → Tribble)
```apex
public class SalesforceObjectConnector extends TribbleConnectorBase {
    public override void syncAccounts(Datetime since) {
        List<Account> accounts = [
            SELECT Id, Name, Industry, AnnualRevenue, Description, Website
            FROM Account
            WHERE LastModifiedDate > :since
            LIMIT 200
        ];

        for (Account acc : accounts) {
            Map<String, Object> metadata = new Map<String, Object>{
                'salesforceId' => acc.Id,
                'objectType' => 'Account',
                'industry' => acc.Industry,
                'revenue' => acc.AnnualRevenue
            };

            String content = JSON.serialize(new Map<String, Object>{
                'name' => acc.Name,
                'description' => acc.Description,
                'website' => acc.Website,
                'industry' => acc.Industry
            });

            TribbleAPIClient.uploadDocument(content, 'json', metadata);
        }
    }
}
```

#### Deployment Process

1. **Package Creation**:
   ```bash
   sdk-cli package create --target salesforce --components "lwc,apex,objects"
   ```

2. **Installation**:
   - Admin installs unmanaged package via AppExchange or provided link
   - Guided setup flow collects Tribble API credentials
   - Initial sync wizard prompts for objects to sync (Accounts, Opps, Cases, etc.)

3. **Configuration**:
   ```bash
   sdk-cli salesforce configure --org-url https://acme.salesforce.com --tribble-token xxx
   ```

4. **Ongoing Sync**:
   - Scheduled Apex jobs run incremental sync every N hours
   - Real-time webhook option for immediate sync on record changes

#### Success Criteria
- [ ] Unmanaged package installable in any Salesforce org (Professional edition+)
- [ ] Chat interface embedded in Lightning pages with < 2-second response time
- [ ] Bi-directional sync for 5 standard objects (Account, Contact, Opportunity, Case, Lead)
- [ ] < 30 minutes from package install to first query working

---

### 7.2 ServiceNow (Scoped Application)

#### Deployment Model
**Scoped Application**: Self-contained app in ServiceNow instance, can be published to ServiceNow Store

**Components**:
1. **UI Pages**: Custom ServiceNow UI for Tribble agent interface
2. **Scripted REST APIs**: Endpoints for Tribble webhooks and callbacks
3. **Business Rules**: Trigger sync to Tribble on record changes
4. **Scheduled Jobs**: Incremental sync from ServiceNow tables to Tribble
5. **UI Macros**: Embed Tribble insights in ServiceNow forms

#### Architecture

```
ServiceNow Instance
├── Scoped Application: "Tribble AI Assistant"
│   ├── UI Pages
│   │   ├── tribble_chat_interface  (Agent chat widget)
│   │   ├── tribble_search          (Search ServiceNow + Tribble knowledge)
│   │   └── tribble_dashboard       (AI insights on incidents/changes)
│   │
│   ├── Scripted REST APIs
│   │   ├── /tribble/webhook        (Receive updates from Tribble)
│   │   └── /tribble/callback       (OAuth callback for auth)
│   │
│   ├── Business Rules
│   │   ├── On Incident Create      (Sync new incident to Tribble)
│   │   ├── On Change Request Update (Sync change details to Tribble)
│   │   └── On KB Article Publish   (Upload knowledge article to Tribble)
│   │
│   ├── Scheduled Jobs
│   │   ├── TribbleIncrementalSync  (Hourly: sync updated records)
│   │   └── TribbleFullRefresh      (Weekly: full resync if needed)
│   │
│   ├── Script Includes
│   │   ├── TribbleAPIClient        (HTTP client for Tribble SDK)
│   │   ├── TribbleDataTransformer  (ServiceNow → Tribble data mapping)
│   │   └── TribbleAuth             (Handle API auth/token refresh)
│   │
│   └── Tables
│       ├── x_tribble_config        (Store API credentials)
│       ├── x_tribble_sync_log      (Audit sync operations)
│       └── x_tribble_conversation  (Chat history)
```

#### Implementation Approach

**Phase 1**: Script Include for Tribble API client
```javascript
// Script Include: TribbleAPIClient
var TribbleAPIClient = Class.create();
TribbleAPIClient.prototype = {
    initialize: function() {
        this.endpoint = gs.getProperty('tribble.api.endpoint');
        this.token = gs.getProperty('tribble.api.token');
    },

    uploadDocument: function(content, contentType, metadata) {
        var request = new sn_ws.RESTMessageV2();
        request.setEndpoint(this.endpoint + '/api/upload');
        request.setHttpMethod('POST');
        request.setRequestHeader('Authorization', 'Bearer ' + this.token);
        request.setRequestHeader('Content-Type', 'application/json');

        var payload = {
            content: content,
            contentType: contentType,
            metadata: metadata,
            tags: ['servicenow', 'instance-' + gs.getProperty('instance_id')]
        };

        request.setRequestBody(JSON.stringify(payload));

        var response = request.execute();
        var statusCode = response.getStatusCode();

        if (statusCode == 200) {
            var body = JSON.parse(response.getBody());
            return body.documentId;
        } else {
            gs.error('Tribble upload failed: ' + response.getBody());
            return null;
        }
    },

    query: function(question, filters) {
        var request = new sn_ws.RESTMessageV2();
        request.setEndpoint(this.endpoint + '/api/query');
        request.setHttpMethod('POST');
        request.setRequestHeader('Authorization', 'Bearer ' + this.token);
        request.setRequestHeader('Content-Type', 'application/json');

        var payload = { question: question, filters: filters };
        request.setRequestBody(JSON.stringify(payload));

        var response = request.execute();
        if (response.getStatusCode() == 200) {
            return JSON.parse(response.getBody());
        }
        return null;
    },

    type: 'TribbleAPIClient'
};
```

**Phase 2**: Business Rule for automatic sync
```javascript
// Business Rule: On Incident Create
(function executeRule(current, previous) {
    var tribble = new TribbleAPIClient();

    var content = {
        number: current.number.toString(),
        shortDescription: current.short_description.toString(),
        description: current.description.toString(),
        priority: current.priority.toString(),
        state: current.state.toString(),
        assignedTo: current.assigned_to.getDisplayValue()
    };

    var metadata = {
        servicenowTable: 'incident',
        sysId: current.sys_id.toString(),
        createdBy: current.sys_created_by.toString(),
        createdOn: current.sys_created_on.toString()
    };

    tribble.uploadDocument(
        JSON.stringify(content),
        'json',
        metadata
    );

})(current, previous);
```

**Phase 3**: UI Page for chat interface
```html
<!-- UI Page: Tribble Chat Interface -->
<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
    <div id="tribble-chat-container">
        <div id="tribble-messages"></div>
        <div id="tribble-input-area">
            <input type="text" id="tribble-input" placeholder="Ask Tribble..." />
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        function sendMessage() {
            var input = document.getElementById('tribble-input');
            var message = input.value;

            // Call Scripted REST API to query Tribble
            var ga = new GlideAjax('TribbleAPIClient');
            ga.addParam('sysparm_name', 'query');
            ga.addParam('sysparm_question', message);
            ga.getXML(function(response) {
                var answer = response.responseXML.documentElement.getAttribute('answer');
                displayMessage('assistant', answer);
            });

            displayMessage('user', message);
            input.value = '';
        }

        function displayMessage(role, content) {
            var messagesDiv = document.getElementById('tribble-messages');
            var messageEl = document.createElement('div');
            messageEl.className = 'tribble-message tribble-' + role;
            messageEl.textContent = content;
            messagesDiv.appendChild(messageEl);
        }
    </script>
</j:jelly>
```

#### Deployment Process

1. **Package Creation**:
   ```bash
   sdk-cli package create --target servicenow --app-name "Tribble AI Assistant"
   ```

2. **Installation**:
   - Upload scoped application XML to ServiceNow instance
   - Or publish to ServiceNow Store for one-click install
   - Guided setup wizard collects Tribble API credentials

3. **Configuration**:
   ```bash
   sdk-cli servicenow configure --instance acme.service-now.com --tribble-token xxx
   ```

4. **Activation**:
   - Admin activates scoped app
   - Selects tables to sync (incident, change_request, kb_knowledge, etc.)
   - Configures sync schedule

#### Success Criteria
- [ ] Scoped application installable in any ServiceNow instance (Orlando+)
- [ ] Chat widget embeddable in any ServiceNow form/page
- [ ] Bi-directional sync for 5 key tables (incident, change_request, kb_knowledge, cmdb_ci, problem)
- [ ] < 20 minutes from app install to first query working

---

### 7.3 SAP S/4HANA (Fiori App + RFC)

#### Deployment Model
**Fiori Application**: Modern UI5-based web app deployed to SAP Fiori Launchpad
**RFC Integration**: Remote Function Calls for extracting transactional data from SAP

**Components**:
1. **Fiori App**: UI5 JavaScript app for Tribble agent interface
2. **ABAP RFCs**: Custom function modules for data extraction
3. **OData Services**: Expose SAP data via RESTful APIs
4. **Gateway Service**: Bridge between Fiori app and Tribble SDK

#### Architecture

```
SAP S/4HANA System
├── Fiori Launchpad
│   └── Tribble AI Assistant (Fiori App)
│       ├── manifest.json          (App descriptor)
│       ├── Component.js            (Main component)
│       ├── view/Chat.view.xml     (Chat interface)
│       ├── controller/Chat.controller.js
│       └── model/TribbleService.js (HTTP client for Tribble)
│
├── ABAP Backend
│   ├── Z_TRIBBLE_RFC_EXTRACT_ORDERS   (RFC: Extract sales orders)
│   ├── Z_TRIBBLE_RFC_EXTRACT_INVOICES (RFC: Extract invoices)
│   ├── Z_TRIBBLE_RFC_EXTRACT_MATERIALS (RFC: Extract material master)
│   └── Z_TRIBBLE_GATEWAY              (Gateway for Fiori ↔ Tribble)
│
├── OData Services
│   ├── ZTRIBBLE_ORDERS_SRV     (Expose order data)
│   ├── ZTRIBBLE_INVOICES_SRV   (Expose invoice data)
│   └── ZTRIBBLE_MATERIALS_SRV  (Expose material data)
│
└── Custom Tables
    ├── ZTRIBBLE_CONFIG  (API credentials)
    └── ZTRIBBLE_SYNC    (Sync status tracking)
```

#### Implementation Approach

**Phase 1**: ABAP RFC for data extraction
```abap
* Function Module: Z_TRIBBLE_RFC_EXTRACT_ORDERS
FUNCTION Z_TRIBBLE_RFC_EXTRACT_ORDERS.
*"----------------------------------------------------------------------
*"*"Local Interface:
*"  IMPORTING
*"     VALUE(IV_FROM_DATE) TYPE  DATS
*"     VALUE(IV_TO_DATE) TYPE  DATS
*"  EXPORTING
*"     VALUE(ET_ORDERS) TYPE  TT_SALES_ORDER
*"----------------------------------------------------------------------
  SELECT
    vbeln, audat, netwr, waerk, vkorg, kunnr, bstnk
  FROM vbak
  INTO CORRESPONDING FIELDS OF TABLE et_orders
  WHERE audat BETWEEN iv_from_date AND iv_to_date.

  LOOP AT et_orders ASSIGNING FIELD-SYMBOL(<order>).
    " Enrich with customer details
    SELECT SINGLE name1
      FROM kna1
      INTO <order>-customer_name
      WHERE kunnr = <order>-kunnr.
  ENDLOOP.
ENDFUNCTION.
```

**Phase 2**: Gateway service for Tribble upload
```abap
* Class: ZCL_TRIBBLE_GATEWAY
CLASS zcl_tribble_gateway DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS upload_to_tribble
      IMPORTING
        iv_content      TYPE string
        iv_content_type TYPE string
        iv_metadata     TYPE string
      RETURNING
        VALUE(rv_doc_id) TYPE string.

  PRIVATE SECTION.
    CONSTANTS gc_tribble_endpoint TYPE string VALUE 'https://api.tribble.ai/api/upload'.
    DATA gv_api_token TYPE string.
ENDCLASS.

CLASS zcl_tribble_gateway IMPLEMENTATION.
  METHOD upload_to_tribble.
    " Read API token from config table
    SELECT SINGLE api_token FROM ztribble_config INTO gv_api_token WHERE client = sy-mandt.

    " Create HTTP client
    DATA(lo_client) = cl_http_client=>create_by_url( gc_tribble_endpoint ).
    lo_client->request->set_method( 'POST' ).
    lo_client->request->set_header_field( name = 'Authorization' value = |Bearer { gv_api_token }| ).
    lo_client->request->set_header_field( name = 'Content-Type' value = 'application/json' ).

    " Build JSON payload
    DATA(lv_payload) = |{| &&
      |"content":"{ escape( val = iv_content format = cl_abap_format=>e_json_string ) }",| &&
      |"contentType":"{ iv_content_type }",| &&
      |"metadata":{ iv_metadata },| &&
      |"tags":["sap","s4hana","instance-{ sy-sysid }"]| &&
      |}|.

    lo_client->request->set_cdata( lv_payload ).

    " Execute HTTP POST
    lo_client->send( ).
    lo_client->receive( ).

    " Parse response
    DATA(lv_response) = lo_client->response->get_cdata( ).
    IF lo_client->response->get_status( ) = 200.
      " Extract documentId from JSON response
      rv_doc_id = extract_json_value( lv_response, 'documentId' ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

**Phase 3**: Fiori UI5 app
```javascript
// controller/Chat.controller.js
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "../model/TribbleService"
], function (Controller, MessageToast, TribbleService) {
    "use strict";

    return Controller.extend("com.tribble.assistant.controller.Chat", {
        onInit: function () {
            this.tribbleService = new TribbleService();
            this.messages = [];
        },

        onSendMessage: function () {
            var oInput = this.byId("chatInput");
            var sMessage = oInput.getValue();

            if (!sMessage) return;

            // Add user message to UI
            this.messages.push({ role: "user", content: sMessage });
            this.getView().getModel("chat").setData({ messages: this.messages });

            // Query Tribble
            this.tribbleService.query(sMessage).then(function(oResponse) {
                this.messages.push({
                    role: "assistant",
                    content: oResponse.answer
                });
                this.getView().getModel("chat").setData({ messages: this.messages });
            }.bind(this)).catch(function(oError) {
                MessageToast.show("Error querying Tribble: " + oError.message);
            });

            oInput.setValue("");
        }
    });
});
```

```javascript
// model/TribbleService.js
sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("com.tribble.assistant.model.TribbleService", {
        constructor: function () {
            // In production, this would call ABAP Gateway which calls Tribble
            this.gatewayUrl = "/sap/opu/odata/sap/ZTRIBBLE_GATEWAY_SRV";
        },

        query: function (sQuestion) {
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: this.gatewayUrl + "/Query",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ question: sQuestion }),
                    success: function (oData) {
                        resolve(oData.d);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            }.bind(this));
        },

        uploadDocument: function (sContent, sContentType, oMetadata) {
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: this.gatewayUrl + "/Upload",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({
                        content: sContent,
                        contentType: sContentType,
                        metadata: oMetadata
                    }),
                    success: function (oData) {
                        resolve(oData.d);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            }.bind(this));
        }
    });
});
```

#### Deployment Process

1. **Package Creation**:
   ```bash
   sdk-cli package create --target sap --app-name "Tribble_AI_Assistant"
   ```

2. **Installation**:
   - Deploy transport request with ABAP objects (RFCs, gateway, tables)
   - Deploy Fiori app to Fiori Launchpad catalog
   - Configure gateway connection to Tribble API

3. **Configuration**:
   ```bash
   sdk-cli sap configure --system-id PRD --client 100 --tribble-token xxx
   ```

4. **Activation**:
   - Activate RFCs and OData services
   - Add Fiori app to user role/catalog
   - Schedule batch jobs for incremental sync

#### Success Criteria
- [ ] Fiori app deployable to SAP NetWeaver Gateway (SAP UI5 1.108+)
- [ ] Chat interface accessible from Fiori Launchpad with SSO integration
- [ ] Data extraction RFCs for 5 core modules (SD, MM, FI, PP, HR)
- [ ] < 45 minutes from transport install to first query working

---

### 7.4 Hyperscalers (React/Next.js + Containers)

#### Deployment Model
**Containerized Application**: Docker containers deployed to AWS/Azure/GCP with managed Kubernetes

**Components**:
1. **React Frontend**: Modern web UI built with React/Next.js
2. **Node.js Backend**: Express server running SDK connectors and orchestration
3. **Identity Integration**: SSO with enterprise identity providers (Okta, Azure AD, Auth0)
4. **Infrastructure as Code**: Terraform/CloudFormation for automated provisioning

#### Architecture

```
Hyperscaler Infrastructure (AWS/Azure/GCP)
├── Load Balancer (ALB/App Gateway/Cloud Load Balancer)
│   └── SSL Termination + WAF
│
├── Kubernetes Cluster (EKS/AKS/GKE)
│   ├── Frontend Pods
│   │   └── Next.js App (Server-Side Rendering)
│   │       ├── Tribble Chat UI
│   │       ├── Document Upload Interface
│   │       └── Analytics Dashboard
│   │
│   ├── Backend Pods
│   │   └── Node.js + SDK
│   │       ├── Connector Runtime
│   │       ├── Tribble API Proxy
│   │       └── Webhook Handler
│   │
│   └── Worker Pods (for async jobs)
│       └── Scheduled Connector Sync Jobs
│
├── Managed Services
│   ├── Database (RDS/Cosmos/Cloud SQL)
│   │   └── Connector state, sync logs, user sessions
│   │
│   ├── Object Storage (S3/Blob/GCS)
│   │   └── Uploaded documents awaiting processing
│   │
│   ├── Queue (SQS/Service Bus/Pub/Sub)
│   │   └── Async job queue for connectors
│   │
│   └── Secrets Manager
│       └── Tribble API credentials, connector configs
│
└── Identity Provider Integration
    ├── SAML 2.0 / OAuth 2.0 / OIDC
    └── Enterprise SSO (Okta, Azure AD, Google Workspace)
```

#### Implementation Approach

**Phase 1**: Next.js frontend with Tribble SDK client
```typescript
// app/chat/page.tsx
'use client';

import { useState } from 'react';
import { useTribble } from '@/hooks/useTribble';

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const tribble = useTribble();

  const handleSend = async () => {
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    const response = await tribble.query({
      question: input,
      includeContext: true
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Tribble..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

**Phase 2**: Backend API with connector runtime
```typescript
// server/api/connectors/[id]/sync.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createTribble } from '@tribble/sdk';
import { loadConnector } from '@/lib/connectors';
import { getConnectorConfig, updateSyncStatus } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Load connector definition
  const connector = await loadConnector(id as string);
  const config = await getConnectorConfig(id as string);

  // Initialize Tribble SDK
  const tribble = createTribble({
    agent: {
      baseUrl: process.env.TRIBBLE_API_URL!,
      token: process.env.TRIBBLE_API_TOKEN!,
      email: 'system@company.com'
    },
    ingest: {
      baseUrl: process.env.TRIBBLE_INGEST_URL!,
      tokenProvider: async () => process.env.TRIBBLE_API_TOKEN!
    }
  });

  // Execute connector sync
  const lastSync = await getLastSyncTimestamp(id as string);

  const result = await connector.pull(
    {
      accountId: req.user.accountId,
      connectorId: id as string,
      tribble,
      config,
      state: {
        get: async (key) => getConnectorState(id as string, key),
        set: async (key, value) => setConnectorState(id as string, key, value),
        delete: async (key) => deleteConnectorState(id as string, key)
      },
      logger: console,
      metrics: createMetricsCollector(),
      tools: {
        pdf: { fromMarkdown: async (md) => convertMarkdownToPDF(md) },
        html: { toMarkdown: async (html) => convertHtmlToMarkdown(html) },
        csv: { parse: async (csv, schema) => parseCSV(csv, schema) }
      }
    },
    { since: lastSync, params: config }
  );

  await updateSyncStatus(id as string, {
    lastSync: new Date(),
    documentsProcessed: result.documents?.length || 0,
    status: 'completed'
  });

  res.json({ success: true, result });
}
```

**Phase 3**: Docker containerization
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Run as non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]
```

**Phase 4**: Kubernetes deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tribble-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tribble-app
  template:
    metadata:
      labels:
        app: tribble-app
    spec:
      containers:
      - name: app
        image: tribble-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: TRIBBLE_API_URL
          valueFrom:
            secretKeyRef:
              name: tribble-secrets
              key: api-url
        - name: TRIBBLE_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: tribble-secrets
              key: api-token
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: tribble-app-service
spec:
  type: LoadBalancer
  selector:
    app: tribble-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### Deployment Process

1. **Infrastructure Provisioning**:
   ```bash
   sdk-cli deploy init --provider aws --region us-east-1
   sdk-cli deploy provision --stack tribble-prod
   ```

2. **Application Deployment**:
   ```bash
   sdk-cli deploy build --target hyperscaler
   sdk-cli deploy push --registry ecr://123456789.dkr.ecr.us-east-1.amazonaws.com/tribble
   sdk-cli deploy release --environment production
   ```

3. **Identity Configuration**:
   ```bash
   sdk-cli identity configure --provider okta --issuer https://acme.okta.com --client-id xxx
   ```

4. **Connector Setup**:
   - Admin logs in via SSO
   - Configures connectors through web UI
   - Tests sync and verifies data flow

#### Success Criteria
- [ ] One-command deployment to AWS, Azure, and GCP
- [ ] Auto-scaling based on load (2-10 replicas)
- [ ] SSO integration with 3 major identity providers
- [ ] < 15 minutes from `deploy` command to live application

---

## 8. Enhanced Upload Endpoint Specifications

The upload endpoint is the critical gateway between SDK and Tribble core. It MUST support both unstructured and structured data ingestion through a unified, versioned interface.

### 8.1 API Specification

#### Endpoint
```
POST /api/v1/upload
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Schema

```typescript
interface UploadRequest {
  // Content (one of three formats)
  content: string | { url: string } | { base64: string };

  // Content type classification
  contentType: 'pdf' | 'html' | 'text' | 'markdown' | 'json' | 'csv' | 'xml' | 'image' | 'binary';

  // For structured data: schema definition
  schema?: {
    type: 'object' | 'array';
    properties?: Record<string, { type: string; description?: string }>;
    items?: { type: string; properties?: Record<string, any> };
  };

  // Metadata (arbitrary key-value pairs)
  metadata?: Record<string, any>;

  // Tags for organization
  tags?: string[];

  // Processing hints for Tribble
  processingHints?: {
    // Document extraction
    extractTables?: boolean;
    extractImages?: boolean;
    ocrLanguage?: string;

    // Chunking strategy
    chunkingStrategy?: 'paragraph' | 'semantic' | 'fixed' | 'none';
    chunkSize?: number; // characters per chunk
    chunkOverlap?: number; // overlap between chunks

    // Deduplication
    deduplication?: 'exact' | 'fuzzy' | 'none';
    dedupThreshold?: number; // 0-1 for fuzzy matching

    // Structured data specific
    primaryKey?: string; // field to use for deduplication
    timestampField?: string; // field containing record timestamp

    // Performance
    priority?: 'high' | 'normal' | 'low';
    async?: boolean; // return immediately, process in background
  };

  // Relationships to existing content
  relationships?: {
    parentDocumentId?: string;
    relatedDocumentIds?: string[];
    replacesDocumentId?: string; // for updates
  };

  // Access control
  permissions?: {
    readers?: string[]; // user IDs or groups
    writers?: string[];
    visibility?: 'private' | 'organization' | 'public';
  };
}
```

#### Response Schema

```typescript
interface UploadResponse {
  // Success response
  success: true;
  documentId: string;
  status: 'indexed' | 'processing' | 'queued';

  // Processing results (if synchronous)
  chunks?: number;
  tokens?: number;
  extractedFields?: Record<string, any>;

  // For structured data
  recordsProcessed?: number;
  recordsFailed?: number;

  // Async tracking
  jobId?: string; // if async=true

  // Metadata
  timestamp: string;
  processingTime?: number; // milliseconds
}

interface UploadError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  retryable: boolean;
}
```

### 8.2 Usage Examples

#### Example 1: Unstructured PDF Upload
```typescript
POST /api/v1/upload
{
  "content": { "base64": "JVBERi0xLj..." },
  "contentType": "pdf",
  "metadata": {
    "invoiceNumber": "INV-12345",
    "vendor": "ACME Corp",
    "amount": 5000
  },
  "tags": ["invoice", "accounts-payable"],
  "processingHints": {
    "extractTables": true,
    "ocrLanguage": "en",
    "chunkingStrategy": "semantic"
  }
}

Response:
{
  "success": true,
  "documentId": "doc_abc123",
  "status": "indexed",
  "chunks": 12,
  "tokens": 4567,
  "extractedFields": {
    "total": "$5,000.00",
    "invoiceDate": "2025-09-15",
    "dueDate": "2025-10-15"
  },
  "timestamp": "2025-10-03T14:23:45Z",
  "processingTime": 2340
}
```

#### Example 2: Structured JSON Data Upload
```typescript
POST /api/v1/upload
{
  "content": JSON.stringify([
    { "customerId": "C001", "name": "John Doe", "email": "john@example.com", "lifetime_value": 15000 },
    { "customerId": "C002", "name": "Jane Smith", "email": "jane@example.com", "lifetime_value": 22000 }
  ]),
  "contentType": "json",
  "schema": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "customerId": { "type": "string", "description": "Unique customer identifier" },
        "name": { "type": "string", "description": "Customer full name" },
        "email": { "type": "string", "description": "Customer email address" },
        "lifetime_value": { "type": "number", "description": "Total customer value in USD" }
      }
    }
  },
  "metadata": {
    "source": "crm-system",
    "extractDate": "2025-10-03"
  },
  "tags": ["customer-data", "crm"],
  "processingHints": {
    "primaryKey": "customerId",
    "deduplication": "exact"
  }
}

Response:
{
  "success": true,
  "documentId": "doc_xyz789",
  "status": "indexed",
  "recordsProcessed": 2,
  "recordsFailed": 0,
  "timestamp": "2025-10-03T14:25:12Z",
  "processingTime": 450
}
```

#### Example 3: HTML Content from Web Scrape
```typescript
POST /api/v1/upload
{
  "content": "<html><body><h1>Product Documentation</h1><p>This guide explains...</p></body></html>",
  "contentType": "html",
  "metadata": {
    "url": "https://docs.acme.com/product-guide",
    "scrapedAt": "2025-10-03T14:00:00Z"
  },
  "tags": ["documentation", "product-guide"],
  "processingHints": {
    "chunkingStrategy": "paragraph",
    "extractImages": false
  }
}

Response:
{
  "success": true,
  "documentId": "doc_html123",
  "status": "indexed",
  "chunks": 8,
  "timestamp": "2025-10-03T14:26:30Z"
}
```

#### Example 4: Batch Upload (Multiple Documents)
```typescript
POST /api/v1/upload/batch
{
  "documents": [
    {
      "content": { "url": "s3://bucket/invoice1.pdf" },
      "contentType": "pdf",
      "tags": ["invoice"]
    },
    {
      "content": { "url": "s3://bucket/invoice2.pdf" },
      "contentType": "pdf",
      "tags": ["invoice"]
    }
  ],
  "transactional": false
}

Response:
{
  "success": true,
  "results": [
    { "documentId": "doc_001", "status": "indexed" },
    { "documentId": "doc_002", "status": "indexed" }
  ],
  "succeeded": 2,
  "failed": 0,
  "timestamp": "2025-10-03T14:30:00Z"
}
```

### 8.3 Processing Pipeline

```
Upload Request
      ↓
[1. Authentication & Authorization]
      ↓
[2. Content Validation]
   • Schema validation
   • Content type verification
   • Size limits check
      ↓
[3. Content Extraction]
   • PDF → text + tables + images
   • HTML → markdown
   • CSV/JSON → structured records
      ↓
[4. Data Transformation]
   • Schema mapping
   • Field extraction
   • Metadata enrichment
      ↓
[5. Deduplication Check]
   • Exact match (hash)
   • Fuzzy match (similarity)
   • Primary key lookup
      ↓
[6. Chunking]
   • Semantic chunking (embeddings)
   • Paragraph chunking
   • Fixed-size chunking
      ↓
[7. Embedding Generation]
   • Generate vector embeddings
   • Store in vector database
      ↓
[8. Knowledge Graph Update]
   • Create nodes/edges
   • Update relationships
   • Index for search
      ↓
[9. Response]
   • Return documentId
   • Processing metadata
```

### 8.4 Performance Requirements

| Metric | Target | Rationale |
|--------|--------|-----------|
| P50 latency (sync) | < 500ms | Fast feedback for interactive uploads |
| P95 latency (sync) | < 2s | Acceptable for 95% of requests |
| P99 latency (sync) | < 5s | Edge cases (large documents) |
| Async processing time | < 30s | Background jobs complete quickly |
| Throughput | 1000 uploads/sec | Support high-volume ingestion |
| Max document size | 50MB | Balance processing time vs. utility |
| Batch size limit | 1000 docs | Prevent resource exhaustion |

### 8.5 Error Handling

The upload endpoint MUST provide clear, actionable error messages with retry guidance:

```typescript
// Retryable errors (SDK should retry with exponential backoff)
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 60 seconds.",
    "details": { "retryAfter": 60 }
  },
  "retryable": true
}

// Non-retryable errors (SDK should fail immediately)
{
  "success": false,
  "error": {
    "code": "INVALID_SCHEMA",
    "message": "Schema validation failed: missing required field 'customerId'",
    "details": {
      "field": "customerId",
      "expected": "string",
      "received": "undefined"
    }
  },
  "retryable": false
}
```

**Error Codes**:
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `AUTHORIZATION_DENIED`: User lacks permission for operation
- `INVALID_CONTENT_TYPE`: Unsupported content type
- `INVALID_SCHEMA`: Schema validation failed
- `CONTENT_TOO_LARGE`: Document exceeds size limit
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PROCESSING_TIMEOUT`: Document processing took too long
- `DEDUPLICATION_CONFLICT`: Duplicate document detected (with dedupe=strict)
- `INTERNAL_ERROR`: Unexpected server error

---

## 9. Technical Specifications

### 9.1 SDK Architecture

```
@tribble/sdk (umbrella package)
    ├── @tribble/sdk-core           (HTTP client, auth, config)
    ├── @tribble/sdk-primitives     (CUDA-like operations)
    │   ├── upload.ts
    │   ├── createTag.ts
    │   ├── createUser.ts
    │   ├── createWorkflow.ts
    │   ├── executeAction.ts
    │   └── query.ts
    │
    ├── @tribble/sdk-connectors     (Connector framework)
    │   ├── defineConnector.ts      (Connector API)
    │   ├── runtime.ts              (Executor for connectors)
    │   ├── state.ts                (State management)
    │   └── tools.ts                (Utility functions)
    │
    ├── @tribble/sdk-deployment     (Deployment adapters)
    │   ├── salesforce/             (Salesforce adapter)
    │   ├── servicenow/             (ServiceNow adapter)
    │   ├── sap/                    (SAP adapter)
    │   └── hyperscaler/            (Cloud adapter)
    │
    ├── @tribble/sdk-connectors-library  (Pre-built connectors)
    │   ├── salesforce-objects/
    │   ├── servicenow-itsm/
    │   ├── sap-s4hana-odata/
    │   ├── ftp-csv/
    │   ├── rest-generic/
    │   └── ... (20+ connectors)
    │
    └── @tribble/sdk-cli            (Command-line interface)
        ├── deploy/                 (Deployment commands)
        ├── connector/              (Connector management)
        └── config/                 (Configuration management)
```

### 9.2 Technology Stack

**Core SDK**:
- Language: TypeScript 5.6+
- Runtime: Node.js 20+ (LTS)
- HTTP Client: fetch API (native) + retry logic
- Validation: Zod for schema validation
- Testing: Vitest + Playwright (E2E)

**Connectors**:
- Framework: Abstract base class + lifecycle hooks
- State Management: Redis or local JSON (configurable)
- Scheduling: node-cron + distributed locks (for multi-instance)
- Error Handling: Exponential backoff + circuit breaker

**CLI**:
- Framework: Commander.js
- Interactive prompts: Inquirer.js
- Progress indicators: ora, cli-progress
- Logging: Winston with structured output

**Deployment Targets**:
- Salesforce: Salesforce DX CLI + JSforce
- ServiceNow: ServiceNow REST API + XML export
- SAP: SAP UI5 CLI + ABAP transport system
- Hyperscaler: Docker + Kubernetes + Terraform

### 9.3 Security & Compliance

**Authentication**:
- API token-based auth (Bearer tokens)
- Token rotation support (refresh tokens)
- SSO integration via OAuth 2.0 / SAML 2.0

**Authorization**:
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC) for fine-grained permissions
- Document-level permissions

**Data Protection**:
- TLS 1.3 for all network communication
- At-rest encryption for connector state
- Secrets management via platform-native vaults (AWS Secrets Manager, Azure Key Vault, etc.)
- PII detection and masking (optional)

**Compliance**:
- SOC 2 Type II readiness
- GDPR compliance (data residency, right to deletion)
- HIPAA compliance (for healthcare connectors)
- Audit logging for all operations

### 9.4 Observability

**Logging**:
- Structured JSON logs (OpenTelemetry format)
- Log levels: ERROR, WARN, INFO, DEBUG, TRACE
- Correlation IDs across distributed traces

**Metrics**:
- Upload success/failure rates
- Latency percentiles (P50, P95, P99)
- Connector sync duration
- Document processing throughput
- Error rates by type

**Tracing**:
- OpenTelemetry instrumentation
- Distributed traces: SDK → Upload Endpoint → Tribble Core
- Trace propagation via W3C Trace Context headers

**Alerting**:
- Upload failure rate > 5%
- Latency P95 > 2s
- Connector sync failures
- Authentication errors spike

---

## 10. Success Metrics & KPIs

### 10.1 Adoption Metrics

| Metric | Baseline | 6 Months | 12 Months | 18 Months |
|--------|----------|----------|-----------|-----------|
| Active SDK installations | 0 | 100 | 500 | 1,000 |
| Monthly active developers | 0 | 50 | 250 | 500 |
| Community connectors | 0 | 3 | 10 | 25 |
| Deployment targets used | 0 | 2 | 3 | 4 |

### 10.2 Integration Efficiency

| Metric | Baseline (Custom Code) | Target (SDK) | Impact |
|--------|------------------------|--------------|---------|
| Time to first integration | 6-12 weeks | 2-4 days | 90% reduction |
| Lines of custom code | 5,000-10,000 | < 500 | 95% reduction |
| Integration maintenance burden | 20% eng time | < 5% eng time | 75% reduction |
| Professional services revenue mix | 70% integration / 30% optimization | 30% integration / 70% optimization | Shift to high-value services |

### 10.3 Platform Health

| Metric | Target | Measurement |
|--------|--------|-------------|
| Upload endpoint availability | > 99.9% | Monthly uptime |
| Upload P95 latency | < 2s | Continuous monitoring |
| SDK bug reports | < 10/month | GitHub issues |
| Documentation completeness | > 90% | API coverage analysis |
| Developer NPS | > 40 | Quarterly survey |

### 10.4 Business Impact

| Metric | Current State | Target State (18 months) |
|--------|---------------|--------------------------|
| Average deal size | $X | $X * 1.5 (larger deployments via SDK) |
| Sales cycle length | Y weeks | Y * 0.7 (faster POCs via SDK) |
| Customer churn rate | Z% | Z * 0.5 (stickiness from integrations) |
| Expansion revenue | $A | $A * 2 (more data sources = more value) |

---

## 11. Implementation Phases

### Phase 1: Foundation (Months 1-3)
**Goal**: Establish core SDK architecture and enhanced upload endpoint

**Deliverables**:
- [ ] Core SDK package (`@tribble/sdk-core`) with HTTP client, auth, config
- [ ] Primitive operations (`@tribble/sdk-primitives`): upload, createTag, createUser, query
- [ ] Enhanced upload endpoint (v1) supporting unstructured + structured data
- [ ] Connector framework (`@tribble/sdk-connectors`) with runtime
- [ ] 3 reference connectors: Salesforce Objects, FTP CSV, REST Generic
- [ ] CLI foundation (`@tribble/sdk-cli`) with basic commands
- [ ] Documentation: API reference, getting started guide

**Success Criteria**:
- SDK installable via npm: `npm install @tribble/sdk`
- 10 design partners successfully integrate SDK into custom apps
- Upload endpoint handles 100 uploads/sec with P95 < 2s

**Team**:
- 2 backend engineers (upload endpoint + core SDK)
- 1 frontend engineer (CLI)
- 1 DevOps engineer (infrastructure)
- 1 technical writer (documentation)

---

### Phase 2: Deployment Targets (Months 4-6)
**Goal**: Enable deployments to Salesforce and ServiceNow

**Deliverables**:
- [ ] Salesforce deployment adapter (`@tribble/sdk-deployment/salesforce`)
  - Lightning Web Components for chat interface
  - Apex classes for API integration
  - Unmanaged package generator
- [ ] ServiceNow deployment adapter (`@tribble/sdk-deployment/servicenow`)
  - Scoped application with UI pages
  - Script Includes for API client
  - Business rules for auto-sync
- [ ] 5 additional pre-built connectors: ServiceNow ITSM, SharePoint, SQL Database, Google Drive, SFTP XML
- [ ] CLI deployment commands: `deploy create`, `deploy push`, `deploy configure`
- [ ] Deployment documentation + video tutorials

**Success Criteria**:
- 5 customers deploy Tribble into Salesforce orgs
- 3 customers deploy Tribble into ServiceNow instances
- < 30 minutes from package install to working chat interface

**Team**:
- 2 platform engineers (Salesforce + ServiceNow expertise)
- 1 backend engineer (connector library expansion)
- 1 DevOps engineer (deployment automation)
- 1 technical writer (platform-specific guides)

---

### Phase 3: Enterprise Connectors & SAP (Months 7-10)
**Goal**: Add SAP deployment target and expand connector library

**Deliverables**:
- [ ] SAP deployment adapter (`@tribble/sdk-deployment/sap`)
  - Fiori UI5 application
  - ABAP RFCs for data extraction
  - Gateway service for Tribble integration
- [ ] SAP S/4HANA OData connector
- [ ] 10 additional enterprise connectors:
  - Workday, NetSuite, Jira, Confluence, Box, Zendesk, exceedra, Oracle EBS, Dynamics 365, Slack
- [ ] Connector marketplace (web portal for browsing/installing connectors)
- [ ] Advanced connector features: incremental delta sync, conflict resolution, schema evolution

**Success Criteria**:
- 2 SAP customers deploy Tribble as Fiori app
- 20+ total pre-built connectors available
- Community marketplace has 3 third-party contributed connectors

**Team**:
- 1 SAP engineer (Fiori + ABAP development)
- 2 integration engineers (connector development)
- 1 full-stack engineer (marketplace portal)
- 1 DevOps engineer (connector runtime scaling)

---

### Phase 4: Hyperscaler & Scale (Months 11-14)
**Goal**: Enable cloud-native deployments and scale to 1000+ installations

**Deliverables**:
- [ ] Hyperscaler deployment adapter (`@tribble/sdk-deployment/hyperscaler`)
  - React/Next.js reference application
  - Docker + Kubernetes manifests
  - Terraform modules for AWS/Azure/GCP
  - Identity provider integrations (Okta, Azure AD, Auth0)
- [ ] SDK performance optimizations:
  - Batch upload optimization (10x throughput)
  - Streaming uploads for large files
  - Connection pooling + keep-alive
- [ ] Enhanced observability:
  - OpenTelemetry instrumentation
  - Grafana dashboards
  - PagerDuty integration
- [ ] Advanced CLI features:
  - `connector scaffold` (generate connector boilerplate)
  - `deploy test` (integration testing)
  - `config validate` (pre-flight checks)

**Success Criteria**:
- 50 customers deploy React apps to hyperscalers
- Upload endpoint sustains 1000 uploads/sec
- P95 latency remains < 2s at scale

**Team**:
- 2 full-stack engineers (React app + deployment automation)
- 2 backend engineers (performance optimization)
- 1 SRE engineer (observability + scaling)

---

### Phase 5: Community & Ecosystem (Months 15-18)
**Goal**: Build thriving developer ecosystem and community marketplace

**Deliverables**:
- [ ] SDK ported to additional languages:
  - Python SDK (`tribble-sdk-python`)
  - Java SDK (`tribble-sdk-java`)
- [ ] Connector SDK for third-party developers
  - Visual connector builder (low-code)
  - Testing framework + local dev environment
  - Connector certification program
- [ ] Community features:
  - Public GitHub repo with contribution guidelines
  - Discord/Slack community
  - Monthly SDK office hours
  - Connector showcase with case studies
- [ ] Advanced capabilities:
  - Real-time streaming ingestion (WebSocket, Server-Sent Events)
  - Multi-region deployment support
  - Hybrid cloud (on-prem + cloud) deployments

**Success Criteria**:
- 500+ developers in community
- 25+ community-contributed connectors
- SDK mentioned in 30% of enterprise AI RFPs
- Developer NPS > 50

**Team**:
- 1 Python engineer (Python SDK)
- 1 Java engineer (Java SDK)
- 1 developer advocate (community building)
- 1 product manager (ecosystem strategy)

---

## 12. Risk Analysis & Mitigation

### R1: Integration Complexity Exceeds Expectations
**Risk**: Pre-built connectors cannot handle diversity of enterprise systems; custom code still required

**Likelihood**: Medium | **Impact**: High

**Mitigation**:
- Design connector framework to be maximally flexible (escape hatches for custom logic)
- Provide "REST Generic" and "SQL Generic" connectors as catch-all solutions
- Offer professional services for complex integrations (revenue opportunity)
- Build visual connector builder for non-developer customization

**Contingency**:
- If 80%+ integrations still require custom code after 12 months, pivot to "integration accelerator" positioning rather than "zero-code integration"

---

### R2: Deployment Target Maintenance Burden
**Risk**: Salesforce/ServiceNow/SAP platform changes break deployment adapters; requires constant maintenance

**Likelihood**: High | **Impact**: Medium

**Mitigation**:
- Version deployment adapters to match platform versions (e.g., Salesforce Summer '25, Winter '26)
- Build automated compatibility testing (CI/CD against platform sandboxes)
- Establish platform vendor relationships for early access to API changes
- Design adapters to degrade gracefully when platform APIs change

**Contingency**:
- If maintenance burden exceeds 30% of engineering capacity, reduce deployment target support to 2-3 most popular platforms

---

### R3: Performance Bottlenecks at Scale
**Risk**: Upload endpoint cannot sustain 1000 uploads/sec; becomes deployment blocker

**Likelihood**: Medium | **Impact**: High

**Mitigation**:
- Design upload endpoint for horizontal scalability (stateless, load-balanced)
- Implement async processing for heavy workloads (embedding generation, OCR)
- Use CDN for content uploads (direct-to-S3 signed URLs)
- Build performance regression testing into CI/CD

**Contingency**:
- If performance targets not met, offer multiple deployment tiers: "Standard" (100 uploads/sec), "Enterprise" (1000 uploads/sec)

---

### R4: Security Vulnerabilities in SDK or Connectors
**Risk**: Security flaw in SDK allows unauthorized access to customer data; reputational damage

**Likelihood**: Low | **Impact**: Critical

**Mitigation**:
- Comprehensive security review before GA launch (pen testing, code audit)
- Automated vulnerability scanning in CI/CD (Snyk, Dependabot)
- Bug bounty program for responsible disclosure
- Security training for all SDK engineers
- Secrets management best practices enforced (no hardcoded credentials)

**Contingency**:
- If vulnerability discovered post-launch, immediate patch release + customer notifications + incident retrospective

---

### R5: Low Developer Adoption
**Risk**: Developers find SDK too complex or too limited; prefer building custom integrations

**Likelihood**: Medium | **Impact**: High

**Mitigation**:
- Extensive user research with design partners during Phase 1
- Developer experience (DX) focus: simple APIs, great docs, helpful error messages
- CLI with interactive prompts (reduce cognitive load)
- Video tutorials + sample code for common patterns
- Active community support (Discord, office hours)

**Contingency**:
- If adoption < 50% of target after 6 months, conduct user research to identify friction points; consider UX redesign

---

### R6: Tribble Core Platform Changes Break SDK
**Risk**: Tribble platform team makes breaking changes to APIs without coordinating with SDK team

**Likelihood**: Medium | **Impact**: Medium

**Mitigation**:
- Establish API versioning contract (no breaking changes without major version bump)
- SDK team participates in platform RFC process
- Automated integration tests running against platform staging environment
- Canary deployments (deploy SDK updates to 10% of users first)

**Contingency**:
- If breaking changes unavoidable, provide SDK upgrade path with deprecation warnings + migration guide

---

## 13. Dependencies & Constraints

### Internal Dependencies

| Dependency | Owner | Required By | Status |
|------------|-------|-------------|--------|
| Enhanced upload endpoint API | Platform Backend Team | Phase 1 (M1) | Not Started |
| Generic HTTP tool for runtime actions | Agent Team | Phase 1 (M2) | Not Started |
| Vector embedding service scalability | ML Infra Team | Phase 4 (M11) | In Progress |
| Multi-tenancy support in Tribble core | Platform Team | Phase 2 (M4) | Completed |

### External Dependencies

| Dependency | Vendor | Risk | Mitigation |
|------------|--------|------|------------|
| Salesforce DX CLI | Salesforce | API deprecations | Version pinning + compatibility matrix |
| ServiceNow REST API | ServiceNow | Rate limits | Request quota increase for enterprise customers |
| SAP UI5 framework | SAP | Complex licensing | Legal review of distribution rights |
| AWS/Azure/GCP APIs | Cloud vendors | Service outages | Multi-region deployments + retry logic |

### Constraints

**Technical**:
- Node.js 20+ required (older versions lack fetch API)
- Salesforce Professional edition or higher (API access)
- ServiceNow Orlando release or later (scripted REST API support)
- SAP NetWeaver Gateway 7.5+ (OData v2/v4 support)

**Business**:
- Budget: $X allocated for Phase 1-2 (6 months)
- Team size: Maximum 8 engineers + 1 PM + 1 technical writer
- Timeline: 18-month roadmap (GA launch by Month 14)

**Legal/Compliance**:
- Data residency requirements (EU customers: data must stay in EU)
- GDPR right-to-deletion (must support document deletion via API)
- SOC 2 Type II certification required before selling to enterprises (Month 10 target)

---

## 14. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| CUDA | Compute Unified Device Architecture - NVIDIA's parallel computing platform that became the standard for GPU programming |
| Connector | A software component that integrates Tribble with an external data source (e.g., Salesforce, FTP server) |
| Deployment Target | A platform where Tribble can be deployed natively (Salesforce, ServiceNow, SAP, hyperscalers) |
| Enhanced Upload Endpoint | The robust API gateway for ingesting all content types into Tribble |
| FTP | File Transfer Protocol - legacy protocol for file transfers |
| Hyperscaler | Large cloud infrastructure providers (AWS, Azure, GCP) |
| Primitive Operation | Low-level SDK function that maps to a single Tribble API call (analogous to CUDA instructions) |
| Pull-based Sync | Connector proactively fetches data from source system on schedule |
| Push-based Sync | Source system sends data to connector via webhook |
| RFC | Remote Function Call - SAP's protocol for invoking ABAP functions remotely |
| SDK | Software Development Kit - library that wraps and simplifies API interactions |
| Unmanaged Package | Salesforce package installed once with no ongoing upgrade control |

### Appendix B: References

**Industry Research**:
- Gartner: "Hype Cycle for Artificial Intelligence, 2024"
- Forrester: "The State of Enterprise AI Adoption, 2025"
- IDC: "Worldwide Enterprise Application Software Forecast, 2024-2028"

**Technical Standards**:
- RFC 7231: Hypertext Transfer Protocol (HTTP/1.1): Semantics and Content
- RFC 6750: OAuth 2.0 Bearer Token Usage
- OpenTelemetry Specification v1.20
- JSON Schema Draft 2020-12

**Platform Documentation**:
- [Salesforce Lightning Web Components Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [ServiceNow REST API Reference](https://developer.servicenow.com/dev.do#!/reference/api/tokyo/rest/)
- [SAP UI5 SDK](https://sapui5.hana.ondemand.com/)
- [AWS EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)

### Appendix C: Competitive Analysis

| Competitor | Positioning | Strengths | Weaknesses | Differentiation |
|------------|-------------|-----------|------------|-----------------|
| MuleSoft | Integration Platform as a Service (iPaaS) | Mature, enterprise-grade, 1000+ connectors | Not AI-native, expensive, complex | Tribble: AI-first, simpler, embedded in platforms |
| Zapier | No-code automation | Easy to use, 5000+ app integrations, popular | Consumer-focused, limited enterprise features | Tribble: Enterprise-grade, AI orchestration core |
| Workato | Enterprise automation | Strong enterprise adoption, recipe marketplace | Not AI-native, requires Workato runtime | Tribble: Embedded SDK, no external runtime needed |
| Boomi | Integration Platform | Dell backing, strong in mid-market | Legacy architecture, not AI-focused | Tribble: Modern SDK, AI-native, flexible deployment |

**Key Differentiation**: Tribble is the ONLY solution that combines:
1. AI orchestration as core value (not just data movement)
2. Flexible deployment (native to enterprise platforms OR standalone)
3. Developer-friendly SDK (not just no-code UI)
4. "CUDA-like" primitives for composability

### Appendix D: FAQ

**Q: Why build an SDK instead of adding integrations directly to Tribble core?**
A: Separation of concerns. The SDK absorbs integration complexity, leaving Tribble core clean and stable. This enables community contributions without compromising platform security or quality.

**Q: How is this different from an iPaaS like MuleSoft or Zapier?**
A: Tribble SDK is not a general integration platform—it's specifically designed for AI orchestration. Every integration feeds the AI brain. Traditional iPaaS tools move data between systems; Tribble makes systems AI-aware.

**Q: Won't deployment targets be expensive to maintain as platforms evolve?**
A: Yes, but the ROI justifies it. Platform-native deployments reduce customer acquisition cost and increase win rates by 50%+. We'll prioritize the 2-3 highest-ROI platforms and provide reference architectures for others.

**Q: What if a customer needs an integration we don't support?**
A: Three options: (1) Build custom connector using SDK framework, (2) Use "REST Generic" or "SQL Generic" connector with configuration, (3) Professional services engagement. The SDK makes option 1 feasible for most customers.

**Q: How does this support the "CUDA" vision?**
A: CUDA succeeded by: (1) providing simple primitives that abstract complexity, (2) enabling developers to build without understanding GPU internals, (3) becoming indispensable infrastructure. The SDK achieves this for AI orchestration.

**Q: Will the SDK be open source?**
A: Core SDK will be source-available (readable but not forkable) to encourage transparency and community contributions. Deployment adapters and pre-built connectors will remain proprietary as competitive differentiators.

---

## Document Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Lead | | | |
| Engineering Lead | | | |
| CTO | | | |
| VP Sales | | | |
| Legal/Compliance | | | |

---

**END OF DOCUMENT**

**Next Steps**:
1. Review and approval by stakeholders (Week 1)
2. Kickoff meeting with engineering team (Week 2)
3. Detailed technical design for Phase 1 (Weeks 2-3)
4. Sprint planning and development begins (Week 4)

**Questions or Feedback**: Contact the Product team at product@tribble.ai
