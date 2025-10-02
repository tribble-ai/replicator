import 'dotenv/config';
import { createTribble, actions } from '@tribble/sdk';
import { setRenderer, fromMarkdown as renderFromMarkdown } from '@tribble/sdk/render';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function parseArgs(argv) {
  const out = { flags: {}, positionals: [] };
  let k = null;
  for (const a of argv) {
    if (a.startsWith('--')) {
      k = a.replace(/^--/, '');
      if (!(k in out.flags)) out.flags[k] = true; // mark presence
    } else if (k) {
      const prev = out.flags[k];
      if (prev === true) out.flags[k] = a;
      else if (Array.isArray(prev)) prev.push(a);
      else out.flags[k] = [prev, a];
      k = null;
    } else out.positionals.push(a);
  }
  return out;
}

function usage() {
  console.log(`
Enablement Agent (Rep Onboarding)

Usage:
  npm start -- [--file path.pdf ...] [--dir docs/] [--reference-only] [--out-dir artifacts] [--slug onboarding-plan] [--conv-id CID]

Examples:
  npm start -- --file ./onboarding-pack.pdf
  npm start -- --dir ./docs --slug onboarding-plan
`);
}

function getClient() {
  return createTribble({
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
      ? { endpoint: process.env.TRIBBLE_WORKFLOW_ENDPOINT, signingSecret: process.env.TRIBBLE_WORKFLOW_SECRET }
      : undefined,
  });
}

async function readFilesFromDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf')).map((e) => path.join(dir, e.name));
  return files;
}

async function ingestDocuments(files) {
  const tribble = getClient();
  const uuids = [];
  let completed = 0;
  const total = files.length;
  for (const file of files) {
    const filePath = typeof file === 'string' ? file : fileURLToPath(file);
    const data = await fs.readFile(filePath);
    const uuid = `onboarding-${crypto.randomUUID()}`;
    await tribble.ingest.uploadPDF({
      file: data,
      filename: path.basename(filePath),
      metadata: {
        uuid,
        privacy: 'private',
        typeId: -1,
        typeIsRfp: false,
        typeIsStructured: false,
        typeIsInsight: false,
        uploadDate: new Date().toISOString(),
        useForGeneration: true,
        label: path.basename(filePath),
      },
      idempotencyKey: `ingest-${uuid}`,
    });
    uuids.push(uuid);
    completed++;
    const pct = Math.round((completed / total) * 100);
    console.log(`Ingested ${completed}/${total} (${pct}%) -> ${path.basename(filePath)} [uuid=${uuid}]`);
  }
  return uuids;
}

function planActions(evidenceDocs) {
  return actions.compose([
    actions.generate.brief({
      scope: 'rep-onboarding',
      period: 'first 2 weeks',
      audience: 'new enterprise AE in SaaS',
      goals: ['ramp quickly', 'learn ICP', 'shadow top calls', 'first pipeline'],
      deliverable: 'structured plan',
      evidenceDocs,
      output: { format: 'JSON', fields: ['summary', 'milestones', 'tasks', 'links', 'skills'] },
    }),
  ]);
}

function toMarkdown(plan) {
  const lines = [];
  lines.push(`# Onboarding Plan`);
  if (plan.summary) { lines.push('', plan.summary); }
  if (Array.isArray(plan.milestones) && plan.milestones.length) {
    lines.push('', '## Milestones');
    for (const m of plan.milestones) lines.push(`- ${typeof m === 'string' ? m : m.title || JSON.stringify(m)}`);
  }
  if (Array.isArray(plan.tasks) && plan.tasks.length) {
    lines.push('', '## Tasks');
    for (const t of plan.tasks) lines.push(`- ${typeof t === 'string' ? t : t.title || JSON.stringify(t)}`);
  }
  if (Array.isArray(plan.skills) && plan.skills.length) {
    lines.push('', '## Skills');
    for (const s of plan.skills) lines.push(`- ${typeof s === 'string' ? s : JSON.stringify(s)}`);
  }
  if (Array.isArray(plan.links) && plan.links.length) {
    lines.push('', '## Links');
    for (const l of plan.links) lines.push(`- ${typeof l === 'string' ? l : `${l.title || l.name || 'Link'}: ${l.url || ''}`}`);
  }
  return lines.join('\n');
}

async function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  if (flags.help) return usage();

  const outDir = flags['out-dir'] || 'artifacts';
  await fs.mkdir(outDir, { recursive: true });

  // Gather documents
  let files = [];
  const fileFlags = Array.isArray(flags.file) ? flags.file : flags.file ? [flags.file] : [];
  for (const f of fileFlags) files.push(path.resolve(process.cwd(), f));
  if (flags.dir) files.push(...(await readFilesFromDir(path.resolve(process.cwd(), flags.dir))));
  if (files.length === 0) {
    // Fallback to sample.pdf bundled in repo
    const fallback = new URL('../cpg-field-sales/sample.pdf', import.meta.url);
    files.push(fallback);
  }

  const referenceOnly = !!flags['reference-only'];
  let evidenceDocs = [];
  if (!referenceOnly) {
    console.log(`Ingesting ${files.length} document(s)...`);
    evidenceDocs = await ingestDocuments(files);
  } else {
    console.log(`Using reference-only mode (no ingest).`);
    // In reference-only mode, we pass filenames (or custom UUIDs you manage externally)
    evidenceDocs = files.map((f) => path.basename(String(f)));
  }

  // Compose the request and stream response
  const message = planActions(evidenceDocs);
  const convId = flags['conv-id'] || undefined;
  process.stdout.write('Generating onboarding plan (streaming)...\n');
  process.stdout.write('Agent> ');
  let text = '';
  const tribble = getClient();
  for await (const tok of tribble.agent.stream({ conversationId: convId, message })) {
    process.stdout.write(tok.delta);
    text += tok.delta;
  }
  process.stdout.write('\n');

  // Parse JSON plan from response
  let plan;
  try {
    plan = tribble.agent.parseJSON(text);
  } catch (e) {
    console.warn('Could not parse JSON from response. Saving raw text.');
    await fs.writeFile(path.join(outDir, 'onboarding-plan.txt'), text, 'utf8');
    return;
  }

  // Save artifacts
  await fs.writeFile(path.join(outDir, 'onboarding-plan.json'), JSON.stringify(plan, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'onboarding-plan.md'), toMarkdown(plan), 'utf8');
  console.log(`\nSaved artifacts to ${outDir}/onboarding-plan.{json,md}`);

  // Render PDF from Markdown via a simple adapter (pdfkit)
  await configurePdfRenderer();
  try {
    const pdfBytes = await renderFromMarkdown(toMarkdown(plan));
    const buf = pdfBytes instanceof Uint8Array ? Buffer.from(pdfBytes) : Buffer.from([]);
    await fs.writeFile(path.join(outDir, 'onboarding-plan.pdf'), buf);
    console.log(`Saved PDF artifact to ${outDir}/onboarding-plan.pdf`);
  } catch (e) {
    console.warn('PDF render failed (skipping):', e?.message || e);
  }

  // Optional workflow trigger if configured
  const slug = flags.slug || 'onboarding-plan';
  if (getClient().workflows) {
    try {
      const res = await getClient().workflows.trigger({ slug, input: { plan, evidenceDocs } });
      console.log(`Triggered workflow '${slug}'`, res);
    } catch (e) {
      console.warn(`Workflow trigger failed: ${e?.message || e}`);
    }
  }
}

main().catch((e) => {
  console.error(e?.stack || e);
  process.exit(1);
});

async function configurePdfRenderer() {
  setRenderer({
    async fromMarkdown(md) {
      const mod = await import('pdfkit');
      const PDFDocument = mod.default || mod;
      const doc = new PDFDocument({ size: 'A4', margin: 54 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      const done = new Promise((resolve) => doc.on('end', resolve));

      // Basic markdown rendering: headings (#, ##, ###), bullets (-, *) and paragraphs
      const lines = String(md).split(/\r?\n/);
      doc.font('Helvetica').fontSize(12);
      for (const line of lines) {
        if (!line.trim()) { doc.moveDown(0.6); continue; }
        if (line.startsWith('### ')) { doc.font('Helvetica-Bold').fontSize(14).text(line.slice(4)); doc.font('Helvetica').fontSize(12); continue; }
        if (line.startsWith('## ')) { doc.font('Helvetica-Bold').fontSize(16).text(line.slice(3)); doc.font('Helvetica').fontSize(12); continue; }
        if (line.startsWith('# ')) { doc.font('Helvetica-Bold').fontSize(20).text(line.slice(2)); doc.font('Helvetica').fontSize(12); continue; }
        if (line.startsWith('- ') || line.startsWith('* ')) { doc.text('• ' + line.slice(2), { indent: 12 }); continue; }
        doc.text(line);
      }

      doc.end();
      await done;
      const buf = Buffer.concat(chunks);
      return new Uint8Array(buf);
    },
  });
}
