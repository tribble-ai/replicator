import 'dotenv/config';
import { createTribble } from '@tribble/sdk';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';

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
      out.flags[k] = true;
    } else if (k) {
      out.flags[k] = a;
      k = null;
    } else {
      out.positionals.push(a);
    }
  }
  return out;
}

function usage() {
  console.log(`
Real-time Sales Coach

Usage:
  npm start -- [--interactive] [--prompt "text"] [--timeout-ms 300000] [--conv-id CID] [--save transcript.json] [--json]

Examples:
  npm start -- --prompt "Coach me on pricing objections"
  npm start -- --interactive --conv-id abc123 --save transcript.json
`);
}

function getClient() {
  return createTribble({
    agent: {
      baseUrl: required('TRIBBLE_AGENT_BASE_URL'),
      token: required('TRIBBLE_AGENT_TOKEN'),
      email: required('TRIBBLE_AGENT_EMAIL'),
    },
  });
}

async function streamOnce({ message, conversationId, timeoutMs }) {
  const tribble = getClient();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), Number(timeoutMs || process.env.COACH_TIMEOUT_MS || 300000));
  let text = '';
  try {
    for await (const tok of tribble.agent.stream({ conversationId, message, signal: ac.signal })) {
      process.stdout.write(tok.delta);
      text += tok.delta;
    }
    process.stdout.write('\n');
  } finally {
    clearTimeout(timer);
  }
  return { text };
}

async function interactive({ conversationId, timeoutMs, savePath, json }) {
  const tribble = getClient();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const transcript = [];
  let convId = conversationId; // note: streaming does not return conv id; provide one to persist context
  console.log('Enter messages to coach. Type ":exit" to quit.');
  while (true) {
    const prompt = await rl.question('You> ');
    if (prompt.trim() === ':exit') break;
    process.stdout.write('Coach> ');
    const { text } = await streamOnce({ message: prompt, conversationId: convId, timeoutMs });
    transcript.push({ role: 'user', content: prompt });
    transcript.push({ role: 'coach', content: text });
    if (savePath) await fs.writeFile(savePath, JSON.stringify({ conversationId: convId, transcript }, null, 2));
  }
  rl.close();
  if (json) console.log(JSON.stringify({ conversationId: convId, transcript }, null, 2));
}

async function main() {
  const { flags, positionals } = parseArgs(process.argv.slice(2));
  if (flags.help) return usage();
  const interactiveMode = !!flags.interactive;
  const timeoutMs = flags['timeout-ms'] ? Number(flags['timeout-ms']) : undefined;
  const conversationId = flags['conv-id'] || process.env.CONV_ID || undefined;
  const savePath = flags.save || undefined;
  const json = !!flags.json;

  if (interactiveMode) {
    return interactive({ conversationId, timeoutMs, savePath, json });
  }

  const prompt = flags.prompt || positionals.join(' ') || 'Coach me on objection handling for price pressure.';
  process.stdout.write('Coach> ');
  const { text } = await streamOnce({ message: prompt, conversationId, timeoutMs });
  if (json) console.log(JSON.stringify({ conversationId, prompt, response: text }, null, 2));
  if (savePath) await fs.writeFile(savePath, JSON.stringify({ conversationId, prompt, response: text }, null, 2));
}

main().catch((e) => {
  console.error(e?.stack || e);
  process.exit(1);
});
