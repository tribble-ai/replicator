#!/usr/bin/env node
import { createTribble } from '@tribble/sdk';

function usage() {
  console.log(`
tribble <command>

Commands:
  workflows trigger <slug> --endpoint <url> --secret <secret> --input <json>
  ingest upload --base-url <url> --token <token> --file <path> --metadata <json>
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

