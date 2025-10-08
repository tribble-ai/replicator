#!/usr/bin/env node
import { createTribble } from '@tribble/sdk';
import { validateManifest, planFromManifest } from '@tribble/sdk-extensions';

function usage() {
  console.log(`
tribble <command>

Commands:
  workflows trigger <slug> --endpoint <url> --secret <secret> --input <json>
  ingest upload --base-url <url> --token <token> --file <path> --metadata <json>
  ext init [dir]
  ext validate --manifest <path>
  ext plan --manifest <path>
  ext test --manifest <path>
  ext publish --manifest <path> --channel <lts|regular|canary>
  ext promote --name <name> --version <semver> --from <channel> --to <channel>
  ext freeze --name <name> --channel <channel>
  ext migrate --manifest <path> --rename <old>=<new> [--write]
  connectors run --module <path> --since <iso> --base-url <url> --token <token>
  runner run --manifest <path> --event <fixture.json> --control-base-url <url> --control-token <token>
  upload --base-url <url> --token <token> --type <pdf|html|text|markdown|json|csv> --file <path> --metadata <json>
`);
}

async function main() {
  const [cmd, subcmd, ...rest] = process.argv.slice(2);
  if (!cmd) return usage();

  if (cmd === 'workflows' && subcmd === 'trigger') {
    const args = parseArgs(rest);
    const endpoint = args['--endpoint'];
    const secret = args['--secret'];
    const slug = rest.find((a) => !a.startsWith('--')) as string;
    const input = args['--input'] ? JSON.parse(args['--input']) : {};
    if (!endpoint || !secret || !slug) return usage();
    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      workflows: { endpoint, signingSecret: secret },
    } as any);
    const res = await tribble.workflows.trigger({ slug, input });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'ingest' && subcmd === 'upload') {
    const args = parseArgs(rest);
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    const file = args['--file'];
    const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};
    if (!baseUrl || !token || !file) return usage();
    const data = await import('node:fs/promises').then((m) => m.readFile(file));
    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      ingest: { baseUrl, tokenProvider: async () => token },
    } as any);
    const res = await tribble.ingest.uploadPDF({ file: data, filename: file.split('/').pop() || 'file.pdf', metadata });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'upload') {
    const args = parseArgs(rest);
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    const file = args['--file'];
    const type = args['--type'] as any;
    const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};
    if (!baseUrl || !token || !file || !type) return usage();
    const data = await import('node:fs/promises').then((m) => m.readFile(file));
    const { PrimitivesClient } = await import('@tribble/sdk-primitives');
    const primitives = new PrimitivesClient({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      ingest: { baseUrl, tokenProvider: async () => token },
    } as any);
    const res = await primitives.upload({ content: data, contentType: type, filename: file.split('/').pop(), metadata });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'ext') {
    if (subcmd === 'init') {
      const dir = rest.find((a) => !a.startsWith('--')) || '.';
      await scaffoldExtension(dir);
      return;
    }
    if (subcmd === 'validate') {
      const args = parseArgs(rest);
      const path = args['--manifest'];
      if (!path) return usage();
      const mf = await loadManifest(path);
      const res = validateManifest(mf);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.ok ? 0 : 1);
      return;
    }
    if (subcmd === 'plan') {
      const args = parseArgs(rest);
      const path = args['--manifest'];
      if (!path) return usage();
      const mf = await loadManifest(path);
      const plan = planFromManifest(mf);
      console.log(JSON.stringify(plan, null, 2));
      return;
    }
    if (subcmd === 'test') {
      const args = parseArgs(rest);
      const path = args['--manifest'];
      if (!path) return usage();
      const mf = await loadManifest(path);
      const { runContractTests } = await import('@tribble/sdk-test');
      const res = await runContractTests(mf, { cwd: require('node:path').dirname(path) });
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.ok ? 0 : 1);
      return;
    }
    if (subcmd === 'publish') {
      const args = parseArgs(rest);
      const path = args['--manifest'];
      const channel = args['--channel'] || 'regular';
      const remote = '--remote' in args || args['--remote'] !== undefined;
      const controlBaseUrl = args['--control-base-url'];
      const controlToken = args['--control-token'];
      if (!path) return usage();
      const mf = await loadManifest(path);
      if (remote) {
        if (!controlBaseUrl || !controlToken) return usage();
        const { ControlClient } = await import('@tribble/sdk-control');
        const ctrl = new ControlClient({ baseUrl: controlBaseUrl, tokenProvider: async () => controlToken });
        const { validateManifest } = await import('@tribble/sdk-extensions');
        const v = validateManifest(mf);
        if (!v.ok) throw new Error('Manifest invalid: ' + v.errors.join('; '));
        await ctrl.publishExtension({ manifest: mf, channel });
        console.log(`Published remotely to ${channel}`);
      } else {
        await publishExtension(mf, { manifestPath: path, channel });
      }
      return;
    }
    if (subcmd === 'promote') {
      const args = parseArgs(rest);
      const name = args['--name'];
      const version = args['--version'];
      const from = args['--from'];
      const to = args['--to'];
      if (!name || !version || !from || !to) return usage();
      await promoteExtension({ name, version, from, to });
      return;
    }
    if (subcmd === 'freeze') {
      const args = parseArgs(rest);
      const name = args['--name'];
      const channel = args['--channel'];
      if (!name || !channel) return usage();
      await freezeChannel({ name, channel });
      return;
    }
    if (subcmd === 'migrate') {
      const args = parseArgs(rest);
      const path = args['--manifest'];
      const rename = args['--rename'];
      const write = !!args['--write'];
      if (!path || !rename) return usage();
      const [oldRef, newRef] = rename.split('=');
      const mf = await loadManifest(path);
      const updated = migrateManifest(mf, { rename: { [oldRef]: newRef } });
      if (write) {
        await saveManifest(path, updated);
        console.log(`Updated manifest written to ${path}`);
      } else {
        console.log(JSON.stringify(updated, null, 2));
      }
      return;
    }
  }

  if (cmd === 'connectors' && subcmd === 'run') {
    const args = parseArgs(rest);
    const mod = args['--module'];
    const since = args['--since'] || new Date(0).toISOString();
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    if (!mod || !baseUrl || !token) return usage();
    const m = await import(require('node:path').resolve(mod));
    const def = m.default || m.connector || m;
    const { IngestClient } = await import('@tribble/sdk-ingest');
    const { MemoryStateStore, runConnectorOnce } = await import('@tribble/sdk-connectors');
    const state = new MemoryStateStore();
    const ctx: any = {
      accountId: 'local', connectorId: 'local',
      tribble: { ingest: new IngestClient({ baseUrl, tokenProvider: async () => token }) },
      config: {}, state
    };
    const res = await runConnectorOnce(def, ctx, { since });
    console.log(JSON.stringify(res || {}, null, 2));
    return;
  }

  if (cmd === 'runner' && subcmd === 'run') {
    const args = parseArgs(rest);
    const manifestPath = args['--manifest'];
    const eventPath = args['--event'];
    const baseUrl = args['--control-base-url'];
    const token = args['--control-token'];
    if (!manifestPath || !eventPath || !baseUrl || !token) return usage();
    const mf = await loadManifest(manifestPath);
    const evt = JSON.parse(await import('node:fs/promises').then((m) => m.readFile(eventPath, 'utf8')));
    const { runExtension, controlExecutor } = await import('@tribble/sdk-runner');
    const { ControlClient } = await import('@tribble/sdk-control');
    const ctrl = new ControlClient({ baseUrl, tokenProvider: async () => token });
    const res = await runExtension(mf, evt, { execute: controlExecutor(ctrl), log: (s) => console.log(s) });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  usage();
}

function parseArgs(args: string[]) {
  const out: Record<string, string> = {};
  let key: string | null = null;
  for (const a of args) {
    if (a.startsWith('--')) {
      key = a;
      out[key] = '';
    } else if (key) {
      out[key] = a;
      key = null;
    }
  }
  return out;
}

main().catch((e) => {
  console.error(e?.stack || e);
  process.exit(1);
});

async function scaffoldExtension(dir: string) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  await fs.mkdir(dir, { recursive: true });
  const manifestPath = path.join(dir, 'extension.yaml');
  const example = `name: lead-dedupe-and-route
version: 0.1.0
sdk: "@tribble/sdk@0.x"
capabilities:
  - contact.lookup:v1
  - email.send:v2
  - crm.upsert:v1
intents:
  - when: "lead_created"
    steps:
      - type: dedupe
        strategy: semantic+exact
        threshold: 0.92
      - type: enrich
        source: clearbit
      - type: route
        rule: region+size
        owners: ["AE-west", "AE-east"]
      - type: call
        capability: crm.upsert:v1
        params:
          externalId: "{{ lead.id }}"
      - type: call
        capability: email.send:v2
        params:
          to: "{{ owner.email }}"
          template: "new-lead"
policies:
  pii: redact
  data_scope: tenant
  cost_limit_usd: 25
tests:
  - name: routes correct enterprise lead
    given_event: fixtures/enterprise_lead.json
    expect: ["crm.upsert", "email.send"]
permissions:
  - crm:write
  - email:send
`;
  await fs.writeFile(manifestPath, example, 'utf8');
  console.log(`Created ${manifestPath}`);
}

async function loadManifest(filePath: string): Promise<any> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const content = await fs.readFile(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return JSON.parse(content);
  if (ext === '.yaml' || ext === '.yml') {
    try {
      // Optional dependency; if unavailable, prompt user to use JSON
      // @ts-ignore
      const yaml = await import('yaml');
      return yaml.parse(content);
    } catch (e) {
      throw new Error('YAML parser not available. Install "yaml" dependency or provide a JSON manifest.');
    }
  }
  // Try JSON first; if fails, try YAML
  try { return JSON.parse(content); } catch {}
  try {
    // @ts-ignore
    const yaml = await import('yaml');
    return yaml.parse(content);
  } catch {}
  throw new Error('Unable to parse manifest. Use .json or .yaml');
}

async function publishExtension(mf: any, opts: { manifestPath: string; channel: string }) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { validateManifest, planFromManifest } = await import('@tribble/sdk-extensions');
  const v = validateManifest(mf);
  if (!v.ok) throw new Error('Manifest invalid: ' + v.errors.join('; '));
  const name = String(mf.name);
  const version = String(mf.version);
  const outDir = path.join(process.cwd(), 'dist', 'extensions', name, version);
  await fs.mkdir(outDir, { recursive: true });
  const ext = path.extname(opts.manifestPath).toLowerCase();
  const manifestJsonPath = path.join(outDir, 'extension.json');
  await fs.writeFile(manifestJsonPath, JSON.stringify(mf, null, 2), 'utf8');
  if (ext === '.yaml' || ext === '.yml') {
    await fs.copyFile(opts.manifestPath, path.join(outDir, 'extension.yaml'));
  }
  const plan = planFromManifest(mf);
  await fs.writeFile(path.join(outDir, 'plan.json'), JSON.stringify(plan, null, 2), 'utf8');
  // Update channels mapping
  const channelsPath = path.join(process.cwd(), 'dist', 'extensions', name, 'channels.json');
  let channels: any = {};
  try { channels = JSON.parse(await fs.readFile(channelsPath, 'utf8')); } catch {}
  channels[opts.channel] = { version, frozen: false, updatedAt: new Date().toISOString() };
  await fs.writeFile(channelsPath, JSON.stringify(channels, null, 2), 'utf8');
  console.log(`Published ${name}@${version} to channel ${opts.channel}`);
}

async function promoteExtension(opts: { name: string; version: string; from: string; to: string }) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const channelsPath = path.join(process.cwd(), 'dist', 'extensions', opts.name, 'channels.json');
  let channels: any = {};
  try { channels = JSON.parse(await fs.readFile(channelsPath, 'utf8')); } catch {}
  channels[opts.to] = { version: opts.version, frozen: false, updatedAt: new Date().toISOString() };
  await fs.writeFile(channelsPath, JSON.stringify(channels, null, 2), 'utf8');
  console.log(`Promoted ${opts.name}@${opts.version} from ${opts.from} to ${opts.to}`);
}

async function freezeChannel(opts: { name: string; channel: string }) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const channelsPath = path.join(process.cwd(), 'dist', 'extensions', opts.name, 'channels.json');
  let channels: any = {};
  try { channels = JSON.parse(await fs.readFile(channelsPath, 'utf8')); } catch {}
  if (!channels[opts.channel]) channels[opts.channel] = {};
  channels[opts.channel].frozen = true;
  channels[opts.channel].updatedAt = new Date().toISOString();
  await fs.writeFile(channelsPath, JSON.stringify(channels, null, 2), 'utf8');
  console.log(`Froze channel ${opts.channel} for ${opts.name}`);
}

function migrateManifest(mf: any, opts: { rename: Record<string, string> }) {
  const out = JSON.parse(JSON.stringify(mf));
  // rename in capabilities
  if (Array.isArray(out.capabilities)) {
    out.capabilities = out.capabilities.map((c: string) => opts.rename[c] || c);
  }
  // rename in steps
  for (const intent of out.intents || []) {
    for (const step of intent.steps || []) {
      if (step?.type === 'call' && typeof step.capability === 'string') {
        if (opts.rename[step.capability]) step.capability = opts.rename[step.capability];
      }
    }
  }
  return out;
}

async function saveManifest(filePath: string, mf: any) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    await fs.writeFile(filePath, JSON.stringify(mf, null, 2), 'utf8');
    return;
  }
  if (ext === '.yaml' || ext === '.yml') {
    // @ts-ignore
    const yaml = await import('yaml');
    await fs.writeFile(filePath, yaml.stringify(mf), 'utf8');
    return;
  }
  await fs.writeFile(filePath + '.json', JSON.stringify(mf, null, 2), 'utf8');
}
