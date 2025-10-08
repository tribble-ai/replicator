import { validateManifest, type ExtensionManifest } from '@tribble/sdk-extensions';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

export interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

export interface RunResults {
  ok: boolean;
  validation: { ok: boolean; errors: string[]; warnings: string[] };
  tests: TestResult[];
}

export async function runContractTests(manifest: ExtensionManifest, opts: { cwd?: string } = {}): Promise<RunResults> {
  const v = validateManifest(manifest);
  const results: TestResult[] = [];
  const cwd = opts.cwd || process.cwd();

  const callsByEvent = new Map<string, string[]>();
  for (const intent of manifest.intents) {
    const list = callsByEvent.get(intent.when) || [];
    for (const step of intent.steps as any[]) {
      if (step?.type === 'call' && typeof step.capability === 'string') {
        const name = step.capability.split(':')[0];
        list.push(name);
      }
    }
    callsByEvent.set(intent.when, list);
  }

  for (const t of manifest.tests || []) {
    const fp = resolve(cwd, t.given_event);
    let payload: any;
    try {
      payload = JSON.parse(await readFile(fp, 'utf8'));
    } catch (e: any) {
      results.push({ name: t.name, passed: false, details: `failed to read fixture: ${t.given_event} (${e?.message || e})` });
      continue;
    }
    const when = String(payload?.type || payload?.event || '');
    const called = callsByEvent.get(when) || [];
    const missing: string[] = [];
    for (const expected of t.expect) {
      const expName = expected.split(':')[0];
      if (!called.some((c) => c.startsWith(expName))) missing.push(expected);
    }
    if (missing.length) {
      results.push({ name: t.name, passed: false, details: `missing expected capabilities for event '${when}': ${missing.join(', ')}` });
    } else {
      results.push({ name: t.name, passed: true });
    }
  }

  return { ok: v.ok && results.every((r) => r.passed), validation: v, tests: results };
}

