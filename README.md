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

## Real-World Example: Field Sales Intelligence App

This example shows how to build a **Field Sales Intelligence App** (like the Nestlé KAM demo) that transforms 45-minute visit prep into a 2-minute AI-generated brief.

### The Use Case

**Problem:** Field sales reps spend 45 minutes before each store visit manually querying 6 different systems (CRM, ERP, BI tools) to prepare.

**Solution:** An AI-powered app that:
1. Ingests data from enterprise systems (store data, visit history, sales performance)
2. Generates a 60-second brief with evidence-backed recommendations
3. Provides a territory dashboard for managers to coach their teams

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │  Sales Rep App  │          │  Manager Dashboard      │   │
│  │  (Mobile)       │          │  (Tablet)               │   │
│  └────────┬────────┘          └────────────┬────────────┘   │
└───────────┼────────────────────────────────┼────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      YOUR BACKEND                            │
│   /api/visit-prep      /api/territory      /api/ask         │
└───────────┬────────────────────────────────┬────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      TRIBBLE SDK                             │
│   IngestClient          AgentClient         WorkflowsClient │
└───────────┬────────────────────────────────┬────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   TRIBBLE PLATFORM                           │
│            (Knowledge Base + AI + Workflows)                 │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Ingest Enterprise Data

First, load your enterprise data into Tribble's knowledge base:

```typescript
import { createTribble } from '@tribble/sdk';

const tribble = createTribble({
  agent: { baseUrl: TRIBBLE_CHAT_URL, token: TOKEN, email: EMAIL },
  ingest: { baseUrl: TRIBBLE_INGEST_URL, tokenProvider: async () => TOKEN },
  workflows: { endpoint: WORKFLOW_URL, signingSecret: SECRET }
});

// 1. Ingest store master data
await tribble.ingest.uploadStructuredData({
  data: storesCsv,
  format: 'csv',
  metadata: {
    title: 'Store Master Data',
    entityType: 'store',
    schema: [
      { name: 'store_id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'manager_name', type: 'string' },
      { name: 'region', type: 'string' },
      { name: 'format', type: 'string' },
      { name: 'demographics', type: 'string' }
    ],
    primaryKey: 'store_id'
  }
});

// 2. Ingest visit history from CRM
await tribble.ingest.uploadStructuredData({
  data: visitHistoryJson,
  format: 'json',
  metadata: {
    title: 'Visit History',
    entityType: 'visit',
    schema: [
      { name: 'visit_id', type: 'string', required: true },
      { name: 'store_id', type: 'string', required: true },
      { name: 'visit_date', type: 'date', required: true },
      { name: 'actions_completed', type: 'array' },
      { name: 'issues_identified', type: 'array' },
      { name: 'manager_feedback', type: 'string' }
    ]
  }
});

// 3. Ingest sales data from ERP
await tribble.ingest.uploadStructuredData({
  data: salesDataCsv,
  format: 'csv',
  metadata: {
    title: 'Sales Performance (90 days)',
    entityType: 'sales',
    timestampField: 'date'
  }
});

// 4. Ingest campaign materials
await tribble.ingest.uploadDocument({
  file: campaignDeckBuffer,
  filename: 'Q4-Campaign-Playbook.pdf',
  metadata: {
    title: 'Q4 Campaign Playbook',
    category: 'campaigns',
    tags: ['Q4', 'promotional', 'playbook']
  }
});
```

### Step 2: Build the Visit Prep API

Create an endpoint that generates AI-powered visit briefs:

```typescript
// POST /api/visit-prep
async function generateVisitPrep(req, res) {
  const { storeId } = req.body;

  // Build the prompt - Tribble has access to all ingested data
  const prompt = `
You are a field sales intelligence assistant.

Generate a visit prep brief for store ${storeId}.

Return JSON with this exact structure:
{
  "store": {
    "id": "store ID",
    "name": "store name",
    "manager": "manager name",
    "demographics": "demographic profile"
  },
  "executive_summary": "One sentence on what's trending at this store",
  "next_best_actions": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "What to do",
      "rationale": "Why this matters",
      "evidence": {
        "similar_store": "Store that did this successfully",
        "result": "What happened (e.g., +14% category lift)",
        "timeframe": "How long it took"
      },
      "expected_impact": "Expected result for this store"
    }
  ],
  "risk_alerts": [
    {
      "type": "OOS|COMPLIANCE|COMPETITOR",
      "product": "affected product",
      "details": "what's happening",
      "daily_impact": "£ value at risk"
    }
  ]
}

Include 3 next-best-actions ranked by impact.
Every action MUST have evidence from a similar store that succeeded.
`;

  // Call Tribble agent
  const response = await tribble.agent.chat({ message: prompt });

  // Parse and return structured response
  const brief = JSON.parse(response.message);
  res.json(brief);
}
```

### Step 3: Build the Territory Dashboard API

Create endpoints for the manager's territory view:

```typescript
// GET /api/territory/:territoryId
async function getTerritoryDashboard(req, res) {
  const { territoryId } = req.params;

  const prompt = `
Analyze territory ${territoryId} and return JSON:
{
  "kpis": {
    "revenue_90d": "formatted revenue",
    "yoy_growth": "percentage with sign",
    "oos_incidents": number,
    "visits_completed": number
  },
  "category_mix": [
    { "category": "name", "revenue": "formatted", "percentage": number }
  ],
  "store_leaderboard": [
    {
      "store_id": "id",
      "name": "store name",
      "revenue": "formatted",
      "yoy_change": "percentage with sign",
      "status": "improving|stable|declining"
    }
  ],
  "risk_alerts": [
    { "store": "name", "issue": "description", "impact": "£ value" }
  ],
  "coaching_opportunities": [
    { "rep_name": "name", "insight": "coaching suggestion" }
  ]
}
`;

  const response = await tribble.agent.chat({ message: prompt });
  const dashboard = JSON.parse(response.message);
  res.json(dashboard);
}

// GET /api/territory/:territoryId/insight/:metric
async function getMetricInsight(req, res) {
  const { territoryId, metric } = req.params;

  const prompt = `
Explain why ${metric} changed in territory ${territoryId}.

Return JSON:
{
  "metric": "${metric}",
  "current_value": "value",
  "change": "percentage or absolute change",
  "drivers": [
    { "factor": "what drove the change", "contribution": "how much" }
  ],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2"
  ]
}
`;

  const response = await tribble.agent.chat({ message: prompt });
  res.json(JSON.parse(response.message));
}
```

### Step 4: Add Streaming Chat ("Ask Tribble")

Let users ask follow-up questions with streaming responses:

```typescript
// POST /api/ask (streaming)
async function askTribble(req, res) {
  const { question, context } = req.body;

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const prompt = `
Context: Store ${context.storeId}, Territory ${context.territoryId}

User question: ${question}

Answer based on the ingested data. Be specific with numbers and evidence.
`;

  // Stream the response
  for await (const chunk of tribble.agent.stream({ message: prompt })) {
    res.write(`data: ${JSON.stringify({ delta: chunk.delta })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
```

### Step 5: Automate with Workflows

Trigger actions automatically:

```typescript
// Morning brief scheduler (run via cron)
async function sendMorningBriefs() {
  const todaysVisits = await getScheduledVisits();

  for (const visit of todaysVisits) {
    // Generate the brief
    const brief = await generateVisitPrep(visit.storeId);

    // Trigger notification workflow
    await tribble.workflows.trigger({
      slug: 'send-morning-brief',
      input: {
        repId: visit.repId,
        storeId: visit.storeId,
        brief
      }
    });
  }
}

// Post-visit logging
async function onVisitComplete(visitData) {
  await tribble.workflows.trigger({
    slug: 'post-visit-sync',
    input: {
      storeId: visitData.storeId,
      repId: visitData.repId,
      actionsCompleted: visitData.actions,
      notes: visitData.notes,
      nextSteps: visitData.nextSteps
    }
  });
}
```

### Step 6: Build the Frontend

**Sales Rep Mobile App (React Native / PWA):**

```jsx
function VisitPrepScreen({ storeId }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/visit-prep`, {
      method: 'POST',
      body: JSON.stringify({ storeId })
    })
      .then(r => r.json())
      .then(setBrief)
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      {/* Store Header */}
      <View style={styles.storeCard}>
        <Text style={styles.storeName}>{brief.store.name}</Text>
        <Text style={styles.manager}>Manager: {brief.store.manager}</Text>
        <Text style={styles.demographics}>{brief.store.demographics}</Text>
      </View>

      {/* Executive Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>{brief.executive_summary}</Text>
      </View>

      {/* Next Best Actions */}
      <Text style={styles.sectionTitle}>Next Best Actions</Text>
      {brief.next_best_actions.map((action, i) => (
        <ActionCard key={i} action={action} />
      ))}

      {/* Risk Alerts */}
      {brief.risk_alerts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Risk Alerts</Text>
          {brief.risk_alerts.map((alert, i) => (
            <RiskAlert key={i} alert={alert} />
          ))}
        </>
      )}

      {/* Ask Tribble Button */}
      <TouchableOpacity
        style={styles.askButton}
        onPress={() => navigation.navigate('Chat', { storeId })}
      >
        <Text>Ask Tribble</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ActionCard({ action }) {
  return (
    <View style={[styles.actionCard, styles[action.priority.toLowerCase()]]}>
      <View style={styles.priorityBadge}>
        <Text>{action.priority}</Text>
      </View>
      <Text style={styles.actionText}>{action.action}</Text>
      <Text style={styles.rationale}>{action.rationale}</Text>
      <View style={styles.evidence}>
        <Text style={styles.evidenceTitle}>Evidence:</Text>
        <Text>{action.evidence.similar_store}: {action.evidence.result}</Text>
        <Text style={styles.timeframe}>{action.evidence.timeframe}</Text>
      </View>
      <Text style={styles.impact}>Expected: {action.expected_impact}</Text>
    </View>
  );
}
```

**Manager Territory Dashboard (React):**

```jsx
function TerritoryDashboard({ territoryId }) {
  const [data, setData] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);

  useEffect(() => {
    fetch(`/api/territory/${territoryId}`)
      .then(r => r.json())
      .then(setData);
  }, [territoryId]);

  if (!data) return <LoadingSpinner />;

  return (
    <div className="dashboard">
      {/* KPI Row */}
      <div className="kpi-row">
        <KPICard
          label="90-Day Revenue"
          value={data.kpis.revenue_90d}
          onInfoClick={() => loadInsight('revenue')}
        />
        <KPICard
          label="YoY Growth"
          value={data.kpis.yoy_growth}
          positive={data.kpis.yoy_growth.startsWith('+')}
        />
        <KPICard
          label="OOS Incidents"
          value={data.kpis.oos_incidents}
          alert={data.kpis.oos_incidents > 3}
        />
      </div>

      {/* Two Column Layout */}
      <div className="columns">
        <div className="left-column">
          <CategoryMixChart data={data.category_mix} />
          <StoreLeaderboard
            stores={data.store_leaderboard}
            onStoreClick={(store) => openStoreDetail(store)}
          />
        </div>
        <div className="right-column">
          <RiskAlerts alerts={data.risk_alerts} />
          <CoachingOpportunities items={data.coaching_opportunities} />
        </div>
      </div>

      {/* Insight Modal */}
      {selectedInsight && (
        <InsightModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      )}
    </div>
  );
}
```

### What This Achieves

| Before | After |
|--------|-------|
| 45 min prep across 6 systems | 2 min AI-generated brief |
| Generic recommendations | Evidence-backed actions from similar stores |
| No visibility for managers | Real-time territory dashboard |
| Manual post-visit logging | Automated workflow triggers |
| Static reports | Conversational "Ask Tribble" follow-ups |

---

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
const response = await agent.chat({ message: 'What are today\'s top priorities?' });
console.log(response.message);

// Streaming response
for await (const chunk of agent.stream({ message: 'Summarize the quarterly report' })) {
  process.stdout.write(chunk.delta);
}

// Parse JSON from response
const data = agent.parseJSON(response.message);
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

// Upload with auto-detection
await ingest.uploadDocument({
  file: fileBuffer,
  filename: 'document.pdf'
});
```

### Workflow Triggers

```typescript
import { WorkflowsClient } from '@tribble/sdk';

const workflows = new WorkflowsClient({
  endpoint: 'https://workflows.tribble.com/invoke',
  signingSecret: 'your-secret'
});

await workflows.trigger({
  slug: 'new-lead-handler',
  input: { leadId: 'LEAD-123', source: 'website' }
});
```

### Webhook Handling

```typescript
import { createWebhookApp } from '@tribble/sdk';

const app = createWebhookApp({ signingSecret: 'your-secret' });

app.on('document_processed', async (event) => {
  console.log('Document ready:', event.data.documentId);
});

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

// OAuth2 PKCE flow
const { url, codeVerifier } = await auth.loginPkce();
// ... redirect user, get code ...
await auth.exchangeCode(code, codeVerifier);

// Get token (auto-refreshes)
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

queue.on('success', ({ id, result }) => console.log(`Done: ${id}`));
queue.on('failed', ({ id, error }) => console.error(`Failed: ${id}`, error));

await queue.enqueue(async () => uploadDocument(file), { meta: { name: 'doc.pdf' } });
```

## CLI

```bash
npm install -g @tribble/sdk-cli

# Upload a document
tribble upload --base-url https://ingest.tribble.com --token "..." --file ./doc.pdf

# Trigger a workflow
tribble workflows trigger my-workflow --endpoint https://... --secret "..." --input '{}'
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
  nestle-demo/  # Field sales intelligence demo
```

## Error Handling

```typescript
import {
  AuthError,
  RateLimitError,
  ValidationError,
  NetworkError,
  TimeoutError
} from '@tribble/sdk-core';

try {
  await tribble.agent.chat({ message: 'Hello' });
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
