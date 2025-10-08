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

// NAM: Territory overview (aggregated KPIs for tablet view)
app.get('/nam/overview', async (_req, res) => {
  try {
    const stores = await dataService.getAllStores();
    if (!stores) return res.json({ stores: 0, summary: {}, categoryMix: {}, leaderboard: [], riskAlerts: [] });

    // Load per-store data in parallel
    const perStore = await Promise.all(stores.map(async (s) => {
      const [sales, dashboard, visits] = await Promise.all([
        dataService.getSAPSalesData(s.storeId),
        dataService.getPowerBIDashboard(s.storeId),
        dataService.getExceedraVisits(s.storeId, 3)
      ]);
      return { store: s, sales, dashboard, visits };
    }));

    // Aggregate KPIs
    let totalRevenue = 0;
    let totalYOYGrowth = 0;
    let yoyCount = 0;
    const categoryTotals = new Map();
    let oosIncidents = 0;
    let actionsLast60d = 0;

    const now = new Date();
    const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    perStore.forEach(({ sales, dashboard, visits }) => {
      if (sales?.categorySales) {
        sales.categorySales.forEach(cat => {
          totalRevenue += cat.revenue;
          categoryTotals.set(cat.category, (categoryTotals.get(cat.category) || 0) + cat.revenue);
        });
      }
      if (sales?.skuPerformance) {
        oosIncidents += sales.skuPerformance.reduce((sum, sku) => sum + (sku.oosIncidents || 0), 0);
      }
      if (dashboard?.kpis?.yoyGrowth != null) {
        totalYOYGrowth += dashboard.kpis.yoyGrowth;
        yoyCount += 1;
      }
      if (visits?.length) {
        visits.forEach(v => {
          const d = new Date(v.visitDate);
          if (!Number.isNaN(d) && d >= cutoff) {
            actionsLast60d += (v.actionsCompleted?.length || 0);
          }
        });
      }
    });

    // Category mix percentage
    const categoryMix = Array.from(categoryTotals.entries()).map(([category, revenue]) => ({
      category,
      revenue,
      mix: totalRevenue > 0 ? revenue / totalRevenue : 0
    }));

    // Simple leaderboard by revenue
    const leaderboard = perStore.map(({ store, sales, dashboard }) => ({
      storeId: store.storeId,
      name: store.name,
      retailer: store.retailer,
      revenue90d: sales?.categorySales?.reduce((sum, c) => sum + c.revenue, 0) || 0,
      yoyGrowth: dashboard?.kpis?.yoyGrowth ?? null
    }))
    .sort((a, b) => b.revenue90d - a.revenue90d)
    .slice(0, 5);

    // Risk alerts: synthesize from pricing variance & OOS
    const riskAlerts = [];
    perStore.forEach(({ store, sales }) => {
      const oos = (sales?.skuPerformance || []).filter(sku => sku.oosIncidents > 0);
      if (oos.length > 0) {
        const top = oos.sort((a, b) => b.oosIncidents - a.oosIncidents)[0];
        riskAlerts.push({
          type: 'oos',
          severity: top.oosIncidents > 1 ? 'high' : 'medium',
          storeId: store.storeId,
          storeName: store.name,
          title: `${top.name} OOS incidents: ${top.oosIncidents}`
        });
      }
      const pricing = (sales?.skuPerformance || []).filter(sku => Math.abs(sku.priceVsTerritory) > 0.08);
      pricing.slice(0, 1).forEach(p => riskAlerts.push({
        type: 'pricing',
        severity: 'medium',
        storeId: store.storeId,
        storeName: store.name,
        title: `${p.name} pricing variance ${Math.round(p.priceVsTerritory * 100)}%`
      }));
    });

    res.json({
      stores: stores.length,
      summary: {
        revenue90d: totalRevenue,
        yoyGrowthAvg: yoyCount > 0 ? totalYOYGrowth / yoyCount : null,
        oosIncidents,
        actionsLast60d
      },
      categoryMix,
      leaderboard,
      riskAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NAM: KAM roster with light metrics
app.get('/nam/kams', async (_req, res) => {
  try {
    const nam = await dataService.getNAMData();
    const stores = await dataService.getAllStores();
    const byId = new Map(stores.map(s => [s.storeId, s]));

    const roster = await Promise.all((nam?.kams || []).map(async kam => {
      // Aggregate revenue across KAM stores
      const storeIds = kam.stores || [];
      const revenues = await Promise.all(storeIds.map(async id => {
        const sales = await dataService.getSAPSalesData(id);
        return sales?.categorySales?.reduce((sum, c) => sum + c.revenue, 0) || 0;
      }));
      const totalRevenue = revenues.reduce((a, b) => a + b, 0);
      return {
        name: kam.name,
        email: kam.email,
        territory: kam.territory,
        stores: storeIds.map(id => ({ id, name: byId.get(id)?.name || id })),
        performanceScore: kam.performanceScore,
        meetingsThisWeek: kam.meetingsThisWeek,
        lastActive: kam.lastActive,
        coachingNeeds: kam.coachingNeeds,
        revenue90d: totalRevenue
      };
    }));

    res.json({ kams: roster });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NAM: Recorded calls list (Tribble Recorder mock)
app.get('/nam/calls', async (_req, res) => {
  try {
    const nam = await dataService.getNAMData();
    const calls = (nam?.calls || []).map(c => ({
      id: c.id,
      date: c.date,
      type: c.type,
      storeId: c.storeId,
      storeName: c.storeName,
      camName: c.camName,
      managerName: c.managerName,
      durationMin: c.durationMin,
      sentiment: c.sentiment,
      topics: c.topics,
      transcriptSnippet: c.transcriptSnippet
    }));
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NAM: Call details by ID (includes transcript & analytics)
app.get('/nam/calls/:id', async (req, res) => {
  try {
    const nam = await dataService.getNAMData();
    const call = (nam?.calls || []).find(c => c.id === req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });
    res.json(call);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NAM: Agent-style explanations for metrics and entities
app.get('/nam/explain', async (req, res) => {
  try {
    const metric = (req.query.metric || '').toString();
    const category = req.query.category?.toString();
    const storeId = req.query.storeId?.toString();

    // Helper to aggregate overview (reuse logic from /nam/overview)
    async function aggregate() {
      const stores = await dataService.getAllStores();
      const perStore = await Promise.all(stores.map(async (s) => {
        const [sales, dashboard, visits, similar] = await Promise.all([
          dataService.getSAPSalesData(s.storeId),
          dataService.getPowerBIDashboard(s.storeId),
          dataService.getExceedraVisits(s.storeId, 3),
          dataService.getSimilarStoreSuccesses(s.storeId)
        ]);
        return { store: s, sales, dashboard, visits, similar };
      }));
      return perStore;
    }

    if (metric === 'store' && storeId) {
      // Store-level insight using local intelligence engine
      const [profile, perf, actions, risks] = await Promise.all([
        dataService.getStoreProfile(storeId),
        intelligenceEngine.analyzePerformance(storeId),
        intelligenceEngine.generateNextBestActions(storeId),
        intelligenceEngine.generateRiskAlerts(storeId)
      ]);
      if (!profile) return res.status(404).json({ error: 'Store not found' });
      return res.json({
        title: `${profile.name} · Insight`,
        summary: `${profile.name} performance is ${perf.overall}. ${perf.strengths[0] || ''}`.trim(),
        drivers: [
          ...(perf.strengths || []).slice(0, 3),
          ...(perf.concerns || []).slice(0, 2).map(c => `Concern: ${c}`)
        ],
        suggestions: (actions || []).slice(0, 3).map(a => `${a.action} (${a.expectedImpact})`),
        risks: (risks || []).slice(0, 3),
      });
    }

    const perStore = await aggregate();

    if (metric === 'revenue90d') {
      const totalRevenue = perStore.reduce((sum, p) => sum + (p.sales?.categorySales?.reduce((s, c) => s + c.revenue, 0) || 0), 0);
      const topStores = perStore.map(p => ({
        name: p.store.name,
        id: p.store.storeId,
        revenue: p.sales?.categorySales?.reduce((s, c) => s + c.revenue, 0) || 0
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 3);
      const oos = perStore.reduce((acc, p) => acc + (p.sales?.skuPerformance?.reduce((s, sku) => s + (sku.oosIncidents || 0), 0) || 0), 0);
      return res.json({
        title: 'Revenue (90d) — What drives this?',
        summary: `£${Math.round(totalRevenue).toLocaleString()} across ${perStore.length} stores. Top contributors listed below.`,
        drivers: topStores.map(s => `${s.name}: £${Math.round(s.revenue).toLocaleString()}`),
        suggestions: [
          `Replicate top stores\' best actions in similar profiles (consider end-cap displays and range extension).`,
          oos > 0 ? `Reduce out-of-stock hotspots (≈${oos} incidents recorded) to recover revenue.` : `Maintain strong availability; no major OOS hotspots detected.`,
          `Prioritize high-growth categories with targeted promos and staff enablement.`
        ]
      });
    }

    if (metric === 'yoy') {
      const withYoY = perStore.filter(p => p.dashboard?.kpis?.yoyGrowth != null);
      const avg = withYoY.reduce((s, p) => s + p.dashboard.kpis.yoyGrowth, 0) / (withYoY.length || 1);
      const winners = withYoY.filter(p => p.dashboard.kpis.yoyGrowth >= 0.1).map(p => `${p.store.name} (${Math.round(p.dashboard.kpis.yoyGrowth*100)}%)`);
      const laggards = withYoY.filter(p => p.dashboard.kpis.yoyGrowth < 0.02).map(p => `${p.store.name} (${Math.round(p.dashboard.kpis.yoyGrowth*100)}%)`);
      return res.json({
        title: 'YoY Growth (avg) — Interpretation',
        summary: `Average YoY growth is ${(avg*100).toFixed(1)}% across ${withYoY.length} stores.`,
        drivers: [
          winners.length ? `Leaders: ${winners.slice(0,3).join(', ')}` : 'No clear YoY leaders.',
          laggards.length ? `Underperformers: ${laggards.slice(0,3).join(', ')}` : 'Few underperformers detected.'
        ],
        suggestions: [
          'Cross-pollinate leader tactics to underperformers (displays, training, pricing calibration).',
          'Audit pricing variance on key SKUs; correct outliers to remove drag.',
          'Time promotions with footfall peaks; reinforce manager-preferences with tailored visuals.'
        ]
      });
    }

    if (metric === 'oos') {
      const skuIncidents = [];
      perStore.forEach(p => (p.sales?.skuPerformance || []).forEach(sku => {
        if (sku.oosIncidents > 0) skuIncidents.push({ store: p.store, sku });
      }));
      const total = skuIncidents.reduce((s, r) => s + r.sku.oosIncidents, 0);
      const hotspots = skuIncidents.sort((a,b)=>b.sku.oosIncidents-a.sku.oosIncidents).slice(0,3)
        .map(r => `${r.store.name} · ${r.sku.name} (${r.sku.oosIncidents} OOS)`);
      return res.json({
        title: 'OOS Incidents — Impact & Next Steps',
        summary: `${total} OOS incidents across the territory (last 90d) impacting conversion and revenue.`,
        drivers: hotspots,
        suggestions: [
          'Set safety-stock thresholds on top-risk SKUs; enable alerts from DC availability.',
          'Sequence promos only with confirmed stock coverage; pre-allocate inventory for high-velocity items.',
          'Add shelf checks to KAM actions; track recovery impact in SAP trend.'
        ]
      });
    }

    if (metric === 'actions') {
      const now = new Date(); const cutoff = new Date(now.getTime() - 60*24*60*60*1000);
      let actionCount = 0;
      perStore.forEach(p => (p.visits || []).forEach(v => { const d = new Date(v.visitDate); if (d>=cutoff) actionCount += (v.actionsCompleted?.length || 0); }));
      return res.json({
        title: 'Actions (60d) — Execution Pulse',
        summary: `${actionCount} actions logged in the last 60 days across the territory.`,
        drivers: [
          'More actions correlate with faster recovery of OOS and better promo execution.',
          'Coaching opportunity: ensure follow-ups are closed and measured for impact.'
        ],
        suggestions: [
          'Set weekly action targets per KAM; auto-remind via workflows.',
          'Standardize action templates (display, pricing, training) to speed execution.'
        ]
      });
    }

    if (metric === 'categoryMix' && category) {
      // Compute category revenue and growth signals
      let revenue = 0; const signals = [];
      perStore.forEach(p => {
        const cat = p.sales?.categorySales?.find(c => c.category === category);
        if (cat) {
          revenue += cat.revenue;
          if (cat.vsTerritory > 0.03) signals.push(`${p.store.name}: outperforming territory by ${Math.round(cat.vsTerritory*100)}%`);
          if (cat.growth > 0.08) signals.push(`${p.store.name}: strong growth ${Math.round(cat.growth*100)}%`);
        }
      });
      return res.json({
        title: `${category} — Category Insight`,
        summary: `£${Math.round(revenue).toLocaleString()} revenue in last 90d across the territory.`,
        drivers: signals.slice(0,5),
        suggestions: [
          `Increase space allocation where ${category} is outperforming territory.`,
          'Run targeted promo + educational POS to amplify conversion.',
          'Replicate winning placements from top stores to similar profiles.'
        ]
      });
    }

    return res.status(400).json({ error: 'Unsupported metric or missing parameters' });
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
