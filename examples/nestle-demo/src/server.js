import 'dotenv/config';
import express from 'express';
import { createTribble } from '@tribble/sdk';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataService } from './data-service.js';
import { IntelligenceEngine } from './intelligence-engine.js';
import { ArtifactGenerator } from './artifact-generator.js';
import { PrepOrchestrator } from './orchestrator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function optional(name, defaultValue = null) {
  return process.env[name] || defaultValue;
}

function requestId() {
  return crypto.randomUUID();
}

// Initialize services
const useMockData = optional('USE_MOCK_DATA', 'true') === 'true';
const dataService = new DataService({ useMockData });
const intelligenceEngine = new IntelligenceEngine(dataService);
const outputDir = path.join(__dirname, '..', 'output');
const artifactGenerator = new ArtifactGenerator(outputDir);

// Initialize Tribble SDK
const tribble = createTribble({
  agent: {
    baseUrl: required('TRIBBLE_AGENT_BASE_URL'),
    token: required('TRIBBLE_AGENT_TOKEN'),
    email: required('TRIBBLE_AGENT_EMAIL'),
  },
  ingest: {
    baseUrl: required('TRIBBLE_BASE_URL'),
    tokenProvider: async () => required('TRIBBLE_INGEST_TOKEN'),
  },
  workflows: process.env.TRIBBLE_WORKFLOW_ENDPOINT && process.env.TRIBBLE_WORKFLOW_SECRET
    ? {
        endpoint: required('TRIBBLE_WORKFLOW_ENDPOINT'),
        signingSecret: required('TRIBBLE_WORKFLOW_SECRET'),
      }
    : undefined,
});

const orchestrator = new PrepOrchestrator({
  tribble,
  dataService,
  intelligenceEngine,
  artifactGenerator
});

// Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS for demo purposes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory job store
const jobs = new Map();

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'nestle-kam-intelligence',
    version: '1.0.0',
    mockData: useMockData
  });
});

/**
 * List available stores
 */
app.get('/stores', async (_req, res) => {
  try {
    const stores = await dataService.getAllStores();
    res.json({ stores: stores || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get store profile
 */
app.get('/stores/:storeId', async (req, res) => {
  try {
    const profile = await dataService.getStoreProfile(req.params.storeId);
    if (!profile) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get store visit history
 */
app.get('/stores/:storeId/visits', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 3;
    const visits = await dataService.getExceedraVisits(req.params.storeId, count);
    res.json({ visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get store sales data
 */
app.get('/stores/:storeId/sales', async (req, res) => {
  try {
    const sales = await dataService.getSAPSalesData(req.params.storeId);
    if (!sales) {
      return res.status(404).json({ error: 'Sales data not found' });
    }
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get similar store successes
 */
app.get('/stores/:storeId/similar-successes', async (req, res) => {
  try {
    const successes = await dataService.getSimilarStoreSuccesses(req.params.storeId);
    res.json({ successes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start pre-call prep job
 */
app.post('/kam/prep/start', async (req, res) => {
  try {
    const traceId = req.headers['x-request-id'] || requestId();
    const {
      storeId,
      kamEmail = 'sarah.williams@nestle.com',
      visitType = 'routine',
      dataSources = {
        exceedra: { visitHistoryCount: 3, includeTerritorySimilar: true },
        sap: { period: '90 days', categories: ['Adult Nutrition', 'Immunity', 'Vitamins'] },
        powerbi: { period: '12 months' }
      },
      intelligence = {
        includeCompetitorAds: true,
        suggestActions: true,
        similarStoreInsights: true
      },
      session = {},
      generateArtifacts = true
    } = req.body || {};

    if (!storeId) {
      return res.status(400).json({ error: 'storeId required' });
    }

    // Verify store exists
    const profile = await dataService.getStoreProfile(storeId);
    if (!profile) {
      return res.status(404).json({ error: `Store ${storeId} not found` });
    }

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      storeId,
      kamEmail,
      visitType,
      dataSources,
      intelligence,
      status: 'pending',
      progress: {
        collection: 0,
        analysis: 0,
        generation: 0,
        artifacts: 0
      },
      logs: [],
      errors: [],
      subscribers: new Set(),
      conversationId: session.conversationId || undefined,
      collectedData: {},
      intelligence: {},
      aiBrief: null,
      artifacts: {}
    };

    jobs.set(jobId, job);

    // Start orchestration asynchronously
    orchestrator.execute(job, { generateArtifacts, traceId }).catch(err => {
      job.status = 'failed';
      job.errors.push(err.message);
    });

    res.status(202).json({
      jobId,
      status: 'pending',
      storeId,
      storeName: profile.name
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get job status
 */
app.get('/kam/prep/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    storeId: job.storeId,
    status: job.status,
    progress: job.progress,
    logs: job.logs,
    errors: job.errors,
    conversationId: job.conversationId
  });
});

/**
 * Stream job progress (SSE)
 */
app.get('/kam/prep/:jobId/stream', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).end();
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  job.subscribers.add(res);

  // Send current status immediately
  res.write(`data: ${JSON.stringify({ type: 'status', data: job.status })}\n\n`);

  req.on('close', () => {
    job.subscribers.delete(res);
  });
});

/**
 * Get job result
 */
app.get('/kam/prep/:jobId/result', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed') {
    return res.status(202).json({
      status: job.status,
      progress: job.progress
    });
  }

  // Return complete result
  res.json({
    jobId: job.id,
    storeId: job.storeId,
    status: job.status,
    conversationId: job.conversationId,
    brief: {
      executiveSummary: job.aiBrief?.executiveSummary,
      visitHistory: job.intelligence.visitSummary,
      performance: job.intelligence.performance,
      nextBestActions: job.intelligence.nextBestActions,
      riskAlerts: job.intelligence.riskAlerts,
      talkingPoints: job.intelligence.talkingPoints,
      similarStoreSuccesses: job.collectedData.similarSuccesses,
      competitorIntel: job.collectedData.competitors,
      salesInsights: job.collectedData.sales,
      aiBriefRaw: job.aiBrief
    },
    artifacts: {
      markdown: job.artifacts.markdown ? {
        filename: job.artifacts.markdown.filename,
        url: `/kam/prep/${job.id}/artifact/markdown`
      } : null,
      onepager: job.artifacts.onepager ? {
        filename: job.artifacts.onepager.filename,
        url: `/kam/prep/${job.id}/artifact/onepager`
      } : null,
      json: job.artifacts.json ? {
        filename: job.artifacts.json.filename,
        url: `/kam/prep/${job.id}/artifact/json`
      } : null
    }
  });
});

/**
 * Download artifact
 */
app.get('/kam/prep/:jobId/artifact/:type', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const type = req.params.type;
  const artifact = job.artifacts[type];

  if (!artifact) {
    return res.status(404).json({ error: `Artifact type '${type}' not found` });
  }

  try {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(artifact.filepath, 'utf-8');

    const contentType = type === 'json' ? 'application/json' :
                        type === 'markdown' || type === 'onepager' ? 'text/markdown' :
                        'text/plain';

    res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get intelligence insights for a store (quick endpoint for testing)
 */
app.get('/kam/intelligence/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const [profile, nextBestActions, performance, riskAlerts, talkingPoints] = await Promise.all([
      dataService.getStoreProfile(storeId),
      intelligenceEngine.generateNextBestActions(storeId),
      intelligenceEngine.analyzePerformance(storeId),
      intelligenceEngine.generateRiskAlerts(storeId),
      intelligenceEngine.generateTalkingPoints(storeId)
    ]);

    if (!profile) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      store: profile,
      nextBestActions,
      performance,
      riskAlerts,
      talkingPoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * List all jobs (for debugging)
 */
app.get('/kam/prep/jobs', (_req, res) => {
  const jobList = Array.from(jobs.values()).map(job => ({
    id: job.id,
    storeId: job.storeId,
    status: job.status,
    progress: job.progress,
    createdAt: job.logs[0] || null
  }));

  res.json({ jobs: jobList });
});

/**
 * Delete job (cleanup)
 */
app.delete('/kam/prep/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  if (!jobs.has(jobId)) {
    return res.status(404).json({ error: 'Job not found' });
  }

  jobs.delete(jobId);
  res.json({ ok: true, deleted: jobId });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`\n🚀 Nestlé KAM Intelligence Agent`);
  console.log(`📍 Listening on http://localhost:${port}`);
  console.log(`💾 Using ${useMockData ? 'MOCK' : 'LIVE'} data`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /stores`);
  console.log(`   GET  /stores/:storeId`);
  console.log(`   POST /kam/prep/start`);
  console.log(`   GET  /kam/prep/:jobId/status`);
  console.log(`   GET  /kam/prep/:jobId/stream`);
  console.log(`   GET  /kam/prep/:jobId/result`);
  console.log(`   GET  /kam/prep/:jobId/artifact/:type`);
  console.log(`   GET  /kam/intelligence/:storeId (quick test)`);
  console.log(`\n✨ Ready for demo!\n`);
});