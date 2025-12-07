import 'dotenv/config';
import express from 'express';
import { createTribble } from '@tribble/sdk';
import { UploadQueue } from '@tribble/sdk/queue';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function requestId() {
  return crypto.randomUUID();
}

// Orchestrator: multi-phase account prep for field sales
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

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// In-memory job store and SSE subscriptions
const jobs = new Map(); // jobId -> { status, logs, progress, ingest, conversationId, brief, errors, subscribers:Set }

function addLog(job, msg) {
  const ts = new Date().toISOString();
  job.logs.push(`[${ts}] ${msg}`);
}

app.post('/prep/start', async (req, res) => {
  try {
    const traceId = req.headers['x-request-id'] || requestId();
    const {
      accountId,
      since = new Date().toISOString().slice(0, 10),
      retailers = [],
      territory,
      stores = [],
      attachments = { urls: [], mode: 'ingest' }, // mode: 'ingest' | 'reference'
      session = {},
      route = [], // optional: [{ storeId, name, retailer, city, state }]
      generateArtifacts = true,
    } = req.body || {};

    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      accountId,
      since,
      retailers,
      territory,
      stores,
      route,
      status: 'pending',
      progress: { ingest: 0, research: 0, chat: 0 },
      ingest: { items: [] },
      logs: [],
      subscribers: new Set(),
      errors: [],
      conversationId: session.conversationId || undefined,
      brief: undefined,
      artifacts: {},
    };
    jobs.set(jobId, job);
    addLog(job, `Job created (trace ${traceId}) for account=${accountId}`);

    // Kick off orchestration asynchronously
    orchestrate(job, { attachments, traceId, generateArtifacts }).catch((err) => {
      job.status = 'failed';
      job.errors.push(String(err?.message || err));
      addLog(job, `Failed: ${err?.message || err}`);
      broadcast(job, { type: 'error', data: job.errors.at(-1) });
    });

    return res.status(202).json({ jobId });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get('/prep/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job not found' });
  const { id, status, progress, logs, errors, conversationId } = job;
  res.json({ id, status, progress, logs, errors, conversationId });
});

app.get('/prep/:jobId/result', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job not found' });
  if (job.status !== 'completed') return res.status(202).json({ status: job.status });
  res.json({ conversationId: job.conversationId, brief: job.brief, artifacts: job.artifacts });
});

app.get('/prep/:jobId/stream', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).end();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  job.subscribers.add(res);
  req.on('close', () => job.subscribers.delete(res));
});

app.post('/prep/:jobId/actions', async (req, res) => {
  try {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'job not found' });
    if (!tribble.workflows) return res.status(400).json({ error: 'workflows not configured' });
    if (!job.brief?.actions) return res.status(400).json({ error: 'no actions in brief' });

    const idempotencyKey = `followups-${job.accountId}-${job.since}`;
    await tribble.workflows.trigger({
      slug: 'field/create-followups',
      input: { accountId: job.accountId, actions: job.brief.actions, attachments: job.brief.attachments },
      idempotencyKey,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get('/prep/:jobId/artifact', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job not found' });
  const p = job.artifacts?.markdownPath;
  if (!p) return res.status(404).json({ error: 'no artifact' });
  try {
    const md = await fs.readFile(p, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(md);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

function broadcast(job, payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const s of job.subscribers) {
    try { s.write(data); } catch {}
  }
}

async function orchestrate(job, { attachments, traceId, generateArtifacts }) {
  job.status = 'ingesting';
  addLog(job, `Attachments: mode=${attachments.mode}, count=${attachments.urls?.length || 0}`);

  const ingested = [];
  const references = [];
  const urls = attachments.urls && attachments.urls.length ? attachments.urls : [new URL('./sample.pdf', import.meta.url).toString()];

  if (attachments.mode === 'ingest' && urls.length) {
    const q = new UploadQueue({ concurrency: 2, storage: { load: () => [], save: () => {} } });
    let completed = 0;
    await Promise.all(
      urls.map(async (url, idx) => {
        const uuid = `acc-${job.accountId}-${job.since}-${idx}`;
        job.ingest.items.push({ url, uuid, status: 'pending' });
        await q.enqueue(async () => {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`Fetch failed for ${url}: ${resp.status}`);
          const buf = new Uint8Array(await resp.arrayBuffer());
          await tribble.ingest.uploadPDF({
            file: buf,
            filename: url.split('/').pop() || `artifact-${idx}.pdf`,
            metadata: {
              uuid,
              privacy: 'private',
              typeId: -1,
              typeIsRfp: false,
              typeIsStructured: false,
              typeIsInsight: false,
              uploadDate: new Date().toISOString(),
              useForGeneration: true,
              label: `Account Artifact – ${job.accountId}`,
            },
            traceId,
            idempotencyKey: `ingest-${uuid}`,
          });
          ingested.push(uuid);
          job.ingest.items[idx].status = 'done';
          completed++;
          job.progress.ingest = Math.round((completed / urls.length) * 100);
        });
      })
    );
    addLog(job, `Ingest complete: ${ingested.length} uploaded`);
  } else {
    references.push(...urls);
    addLog(job, `Using ${references.length} referenced docs (no ingest)`);
    job.progress.ingest = 100;
  }

  job.status = 'preparing';
  addLog(job, `Preparing research prompts for retailers: ${job.retailers.join(', ') || '(none specified)'}`);

  const evidence = ingested.length ? ingested : references;

  // Build research context from retailers
  const retailerSearches = (job.retailers || []).slice(0, 5).map(r =>
    `${r} weekly ad ${job.territory || ''} ${new Date(job.since).toLocaleString('en', { month: 'long', year: 'numeric' })}`.trim()
  );

  const prompt = `You are a Field Sales Intelligence Assistant helping prepare for account visits.

ACCOUNT CONTEXT:
- Account ID: ${job.accountId}
- Period: Since ${job.since}
- Territory: ${job.territory || 'Not specified'}
- Retailers: ${job.retailers?.join(', ') || 'None specified'}
- Stores: ${job.stores?.length || 0} stores
${job.route?.length ? `- Route Plan: ${job.route.map(s => s.name || s.storeId).join(' → ')}` : ''}

EVIDENCE DOCUMENTS:
${evidence.map(e => `- ${e}`).join('\n') || 'No evidence documents provided'}

${retailerSearches.length ? `RETAILER RESEARCH (search these for current promotions):
${retailerSearches.map(q => `- "${q}"`).join('\n')}` : ''}

TASK:
Generate a comprehensive field sales prep brief with the following sections. Return as JSON.

Required sections:
1. summary - Executive summary of the account situation
2. pricingFlags - Any pricing issues or competitive pricing alerts
3. oosRisks - Out-of-stock risks and inventory concerns
4. promoOpportunities - Promotional opportunities to discuss
5. storeTasks - Specific tasks for each store visit
6. talkingPoints - Key talking points for store manager conversations
7. attachments - Relevant materials to bring/reference
8. routePlan - Optimized visit sequence with objectives for each stop

Return JSON with this structure:
{
  "summary": "...",
  "pricingFlags": ["..."],
  "oosRisks": ["..."],
  "promoOpportunities": ["..."],
  "storeTasks": [{"store": "...", "task": "..."}],
  "talkingPoints": ["..."],
  "attachments": ["..."],
  "routePlan": [{"storeId": "...", "name": "...", "objectives": ["..."], "notes": "..."}]
}`;

  job.status = 'chatting';
  job.progress.research = 100;
  addLog(job, 'Starting agent stream');
  broadcast(job, { type: 'status', data: 'chatting' });

  let answer = '';
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), Number(process.env.PREP_TIMEOUT_MS || 300000));
  try {
    for await (const tok of tribble.agent.stream({ conversationId: job.conversationId, message: prompt, signal: ac.signal })) {
      if (tok?.delta) {
        answer += tok.delta;
        job.progress.chat = Math.min(99, Math.floor(answer.length / 2000 * 100));
        broadcast(job, { type: 'delta', data: tok.delta });
      }
    }
    // Finalize
    broadcast(job, { type: 'done' });
    job.progress.chat = 100;
    const parsed = tribble.agent.parseJSON(answer);
    job.brief = parsed;
    if (generateArtifacts) {
      const outDir = path.resolve(process.cwd(), 'output');
      await fs.mkdir(outDir, { recursive: true });
      const mdPath = path.join(outDir, `route-${job.id}.md`);
      await fs.writeFile(mdPath, toMarkdown(job, parsed), 'utf-8');
      job.artifacts.markdownPath = mdPath;
      addLog(job, `Wrote artifact: ${mdPath}`);
    }
    job.status = 'completed';
    addLog(job, 'Completed');
  } finally {
    clearTimeout(t);
  }
}

function toMarkdown(job, brief) {
  const h = (s, n=2) => `${'#'.repeat(n)} ${s}`;
  const lines = [];
  lines.push(`# Account Prep – ${job.accountId}`);
  lines.push(`Date range: since ${job.since}`);
  if (job.territory) lines.push(`Territory: ${job.territory}`);
  if (job.retailers?.length) lines.push(`Retailers: ${job.retailers.join(', ')}`);
  lines.push('');
  if (brief?.summary) {
    lines.push(h('Executive Summary'));
    lines.push(brief.summary);
    lines.push('');
  }
  if (brief?.pricingFlags) {
    lines.push(h('Pricing Flags'));
    for (const p of [].concat(brief.pricingFlags || [])) lines.push(`- ${p}`);
    lines.push('');
  }
  if (brief?.oosRisks) {
    lines.push(h('OOS Risks'));
    for (const r of [].concat(brief.oosRisks || [])) lines.push(`- ${r}`);
    lines.push('');
  }
  if (brief?.promoOpportunities) {
    lines.push(h('Promo Opportunities'));
    for (const r of [].concat(brief.promoOpportunities || [])) lines.push(`- ${r}`);
    lines.push('');
  }
  if (brief?.talkingPoints) {
    lines.push(h('Talking Points'));
    for (const t of [].concat(brief.talkingPoints || [])) lines.push(`- ${t}`);
    lines.push('');
  }
  if (brief?.storeTasks) {
    lines.push(h('Store Tasks'));
    for (const s of [].concat(brief.storeTasks || [])) {
      if (typeof s === 'string') { lines.push(`- ${s}`); continue; }
      lines.push(`- [${s.store || 'Store'}] ${s.task || ''}`);
    }
    lines.push('');
  }
  if (brief?.routePlan) {
    lines.push(h('Route Plan'));
    for (const st of [].concat(brief.routePlan || [])) {
      lines.push(h(st.name || st.storeId || 'Store', 3));
      if (st.objectives?.length) {
        lines.push('Objectives:');
        for (const o of st.objectives) lines.push(`- ${o}`);
      }
      if (st.notes) lines.push(`Notes: ${st.notes}`);
      lines.push('');
    }
  }
  if (brief?.attachments?.length) {
    lines.push(h('Attachments'));
    for (const a of brief.attachments) {
      if (typeof a === 'string') lines.push(`- ${a}`);
      else if (a.url) lines.push(`- ${a.label || a.url}: ${a.url}`);
    }
  }
  return lines.join('\n');
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Field-sales example listening on :${port}`));
