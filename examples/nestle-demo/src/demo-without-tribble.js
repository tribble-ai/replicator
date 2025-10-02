import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataService } from './data-service.js';
import { IntelligenceEngine } from './intelligence-engine.js';
import { ArtifactGenerator } from './artifact-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Standalone demo server - works WITHOUT Tribble API
 * Uses only mock data and local intelligence engine
 * Perfect for testing and offline demos
 */

function requestId() {
  return crypto.randomUUID();
}

// Initialize services (NO Tribble required)
const dataService = new DataService({ useMockData: true });
const intelligenceEngine = new IntelligenceEngine(dataService);
const outputDir = path.join(__dirname, '..', 'output');
const artifactGenerator = new ArtifactGenerator(outputDir);

// Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory job store
const jobs = new Map();

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'nestle-kam-intelligence',
    version: '1.0.0',
    mode: 'standalone',
    tribbleRequired: false
  });
});

app.get('/stores', async (_req, res) => {
  try {
    const stores = await dataService.getAllStores();
    res.json({ stores: stores || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stores/:storeId', async (req, res) => {
  try {
    const profile = await dataService.getStoreProfile(req.params.storeId);
    if (!profile) return res.status(404).json({ error: 'Store not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stores/:storeId/visits', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 3;
    const visits = await dataService.getExceedraVisits(req.params.storeId, count);
    res.json({ visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stores/:storeId/sales', async (req, res) => {
  try {
    const sales = await dataService.getSAPSalesData(req.params.storeId);
    if (!sales) return res.status(404).json({ error: 'Sales data not found' });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stores/:storeId/similar-successes', async (req, res) => {
  try {
    const successes = await dataService.getSimilarStoreSuccesses(req.params.storeId);
    res.json({ successes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    if (!profile) return res.status(404).json({ error: 'Store not found' });

    res.json({ store: profile, nextBestActions, performance, riskAlerts, talkingPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simplified prep job (no Tribble AI generation)
app.post('/kam/prep/start', async (req, res) => {
  try {
    const { storeId, kamEmail = 'demo@nestle.com', visitType = 'routine', generateArtifacts = true } = req.body || {};

    if (!storeId) return res.status(400).json({ error: 'storeId required' });

    const profile = await dataService.getStoreProfile(storeId);
    if (!profile) return res.status(404).json({ error: `Store ${storeId} not found` });

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      storeId,
      kamEmail,
      visitType,
      status: 'pending',
      progress: { collection: 0, analysis: 0, generation: 0, artifacts: 0 },
      logs: [],
      errors: [],
      subscribers: new Set(),
      collectedData: {},
      intelligence: {},
      artifacts: {}
    };

    jobs.set(jobId, job);

    // Execute synchronously (fast without Tribble API calls)
    executeStandaloneJob(job, { generateArtifacts }).catch(err => {
      job.status = 'failed';
      job.errors.push(err.message);
    });

    res.status(202).json({ jobId, status: 'pending', storeId, storeName: profile.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function executeStandaloneJob(job, { generateArtifacts }) {
  try {
    // Phase 1: Data Collection
    job.status = 'collecting';
    addLog(job, 'Collecting data from sources...');
    broadcast(job, { type: 'phase', data: 'collecting' });

    const [profile, visits, sales, dashboard, similarSuccesses, competitors, products, campaigns] = await Promise.all([
      dataService.getStoreProfile(job.storeId),
      dataService.getExceedraVisits(job.storeId, 3),
      dataService.getSAPSalesData(job.storeId),
      dataService.getPowerBIDashboard(job.storeId),
      dataService.getSimilarStoreSuccesses(job.storeId),
      dataService.getCompetitorIntel(job.storeId),
      dataService.getProducts(),
      dataService.getCampaigns()
    ]);

    job.collectedData = { profile, visits, sales, dashboard, similarSuccesses, competitors, products, campaigns };
    job.progress.collection = 100;
    addLog(job, `✓ Data collected: ${visits.length} visits, ${sales.skuPerformance.length} SKUs`);

    // Phase 2: Intelligence Analysis
    job.status = 'analyzing';
    addLog(job, 'Analyzing data...');
    broadcast(job, { type: 'phase', data: 'analyzing' });

    const [nextBestActions, performance, visitSummary, talkingPoints, riskAlerts] = await Promise.all([
      intelligenceEngine.generateNextBestActions(job.storeId),
      intelligenceEngine.analyzePerformance(job.storeId),
      intelligenceEngine.summarizeVisitHistory(job.storeId, 3),
      intelligenceEngine.generateTalkingPoints(job.storeId),
      intelligenceEngine.generateRiskAlerts(job.storeId)
    ]);

    job.intelligence = { nextBestActions, performance, visitSummary, talkingPoints, riskAlerts };
    job.progress.analysis = 100;
    addLog(job, `✓ Analysis complete: ${nextBestActions.length} actions, ${riskAlerts.length} alerts`);

    // Phase 3: Generate executive summary (local, no AI)
    job.status = 'generating';
    addLog(job, 'Generating executive summary...');
    broadcast(job, { type: 'phase', data: 'generating' });

    const executiveSummary = generateLocalSummary(job);
    job.progress.generation = 100;
    addLog(job, '✓ Summary generated');

    // Phase 4: Artifacts
    if (generateArtifacts) {
      job.status = 'finalizing';
      addLog(job, 'Generating artifacts...');
      broadcast(job, { type: 'phase', data: 'finalizing' });

      const briefData = {
        executiveSummary,
        visitHistory: visitSummary,
        performance,
        salesInsights: formatSalesInsights(sales),
        nextBestActions,
        riskAlerts,
        similarStoreSuccesses: similarSuccesses,
        talkingPoints,
        competitorIntel: competitors,
        campaigns
      };

      const [markdown, onepager, json] = await Promise.all([
        artifactGenerator.generateMarkdownBrief(job.id, briefData, profile),
        artifactGenerator.generateOnePagerMarkdown(job.id, briefData, profile),
        artifactGenerator.generateJSONOutput(job.id, briefData, profile)
      ]);

      job.artifacts = { markdown, onepager, json };
      job.progress.artifacts = 100;
      addLog(job, `✓ Artifacts generated: ${markdown.filename}, ${onepager.filename}`);
    }

    job.status = 'completed';
    addLog(job, 'Completed successfully');
    broadcast(job, { type: 'done' });

  } catch (error) {
    job.status = 'failed';
    job.errors.push(error.message);
    addLog(job, `Failed: ${error.message}`);
    broadcast(job, { type: 'error', data: error.message });
  }
}

function generateLocalSummary(job) {
  const { profile } = job.collectedData;
  const { performance, nextBestActions, riskAlerts } = job.intelligence;
  const topAction = nextBestActions[0];
  const criticalAlerts = riskAlerts.filter(a => a.severity === 'high' || a.severity === 'critical');

  return `${profile.name} is currently rated as ${performance.overall} performance. ` +
         `${performance.strengths.length > 0 ? performance.strengths[0] + '. ' : ''}` +
         `${criticalAlerts.length > 0 ? `Critical attention needed: ${criticalAlerts[0].title}. ` : ''}` +
         `Top recommended action: ${topAction.action} - ${topAction.expectedImpact}. ` +
         `This recommendation is based on proven success at similar stores in the ${profile.region} region.`;
}

function formatSalesInsights(sales) {
  if (!sales) return null;
  const topPerformers = sales.skuPerformance
    .filter(sku => sku.growth > 0.05)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 3);
  return { categorySales: sales.categorySales, topPerformers, territoryComparison: sales.territoryComparison };
}

function broadcast(job, payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const subscriber of job.subscribers) {
    try { subscriber.write(data); } catch {}
  }
}

function addLog(job, message) {
  const timestamp = new Date().toISOString();
  job.logs.push(`[${timestamp}] ${message}`);
}

app.get('/kam/prep/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ id: job.id, storeId: job.storeId, status: job.status, progress: job.progress, logs: job.logs, errors: job.errors });
});

app.get('/kam/prep/:jobId/stream', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
  job.subscribers.add(res);
  res.write(`data: ${JSON.stringify({ type: 'status', data: job.status })}\n\n`);
  req.on('close', () => job.subscribers.delete(res));
});

app.get('/kam/prep/:jobId/result', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'completed') return res.status(202).json({ status: job.status, progress: job.progress });

  res.json({
    jobId: job.id,
    storeId: job.storeId,
    status: job.status,
    brief: {
      executiveSummary: generateLocalSummary(job),
      visitHistory: job.intelligence.visitSummary,
      performance: job.intelligence.performance,
      nextBestActions: job.intelligence.nextBestActions,
      riskAlerts: job.intelligence.riskAlerts,
      talkingPoints: job.intelligence.talkingPoints,
      similarStoreSuccesses: job.collectedData.similarSuccesses,
      competitorIntel: job.collectedData.competitors,
      salesInsights: job.collectedData.sales
    },
    artifacts: {
      markdown: job.artifacts.markdown ? { filename: job.artifacts.markdown.filename, url: `/kam/prep/${job.id}/artifact/markdown` } : null,
      onepager: job.artifacts.onepager ? { filename: job.artifacts.onepager.filename, url: `/kam/prep/${job.id}/artifact/onepager` } : null,
      json: job.artifacts.json ? { filename: job.artifacts.json.filename, url: `/kam/prep/${job.id}/artifact/json` } : null
    }
  });
});

app.get('/kam/prep/:jobId/artifact/:type', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const artifact = job.artifacts[req.params.type];
  if (!artifact) return res.status(404).json({ error: `Artifact type '${req.params.type}' not found` });

  try {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(artifact.filepath, 'utf-8');
    const contentType = req.params.type === 'json' ? 'application/json' : 'text/markdown';
    res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/kam/prep/jobs', (_req, res) => {
  const jobList = Array.from(jobs.values()).map(job => ({ id: job.id, storeId: job.storeId, status: job.status, progress: job.progress }));
  res.json({ jobs: jobList });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`\n🚀 Nestlé KAM Intelligence Agent (Standalone Mode)`);
  console.log(`📍 Listening on http://localhost:${port}`);
  console.log(`💾 Using MOCK data (no Tribble API required)`);
  console.log(`\n✨ Ready for offline demo!\n`);
});