#!/usr/bin/env node
import { createTribble } from '@tribble/sdk';

function usage() {
  console.log(`
tribble - Tribble Platform CLI

Usage:
  tribble <command> [options]

Commands:
  workflows trigger <slug>    Trigger a workflow
  ingest upload               Upload a document for ingestion
  upload                      Upload a document (auto-detects type)

Workflow Options:
  --endpoint <url>            Workflow endpoint URL
  --secret <secret>           Signing secret
  --input <json>              Input payload as JSON string

Ingest/Upload Options:
  --base-url <url>            Ingest API base URL
  --token <token>             Authentication token
  --file <path>               File to upload
  --type <type>               Document type (pdf|html|text|csv|json|spreadsheet)
  --metadata <json>           Metadata as JSON string

Examples:
  # Trigger a workflow
  tribble workflows trigger my-workflow \\
    --endpoint https://workflows.tribble.com/invoke \\
    --secret "your-secret" \\
    --input '{"userId": "123"}'

  # Upload a PDF
  tribble ingest upload \\
    --base-url https://ingest.tribble.com \\
    --token "your-token" \\
    --file ./document.pdf \\
    --metadata '{"title": "My Document"}'

  # Upload with auto-detection
  tribble upload \\
    --base-url https://ingest.tribble.com \\
    --token "your-token" \\
    --file ./data.csv \\
    --type csv
`);
}

async function main() {
  const [cmd, subcmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === '--help' || cmd === '-h') {
    return usage();
  }

  // workflows trigger
  if (cmd === 'workflows' && subcmd === 'trigger') {
    const args = parseArgs(rest);
    const endpoint = args['--endpoint'];
    const secret = args['--secret'];
    const slug = rest.find((a) => !a.startsWith('--'));
    const input = args['--input'] ? JSON.parse(args['--input']) : {};

    if (!endpoint || !secret || !slug) {
      console.error('Error: Missing required arguments for workflows trigger');
      console.error('Required: --endpoint, --secret, and workflow slug');
      process.exit(1);
    }

    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      workflows: { endpoint, signingSecret: secret },
    });

    const res = await tribble.workflows.trigger({ slug, input });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  // ingest upload (legacy PDF upload)
  if (cmd === 'ingest' && subcmd === 'upload') {
    const args = parseArgs(rest);
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    const file = args['--file'];
    const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};

    if (!baseUrl || !token || !file) {
      console.error('Error: Missing required arguments for ingest upload');
      console.error('Required: --base-url, --token, --file');
      process.exit(1);
    }

    const fs = await import('node:fs/promises');
    const data = await fs.readFile(file);
    const filename = file.split('/').pop() || 'file.pdf';

    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      ingest: { baseUrl, tokenProvider: async () => token },
    });

    const res = await tribble.ingest.uploadPDF({ file: data, filename, metadata });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  // upload (generic document upload with type detection)
  if (cmd === 'upload') {
    const args = parseArgs(rest);
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    const file = args['--file'];
    const type = args['--type'];
    const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};

    if (!baseUrl || !token || !file) {
      console.error('Error: Missing required arguments for upload');
      console.error('Required: --base-url, --token, --file');
      process.exit(1);
    }

    const fs = await import('node:fs/promises');
    const data = await fs.readFile(file);
    const filename = file.split('/').pop() || 'document';

    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      ingest: { baseUrl, tokenProvider: async () => token },
    });

    // Use uploadDocument with auto-detection or explicit type
    const res = await tribble.ingest.uploadDocument({
      file: data,
      filename,
      documentType: type as any,
      metadata,
    });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

function parseArgs(args: string[]): Record<string, string> {
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
  console.error('Error:', e?.message || e);
  process.exit(1);
});
