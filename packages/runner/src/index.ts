import type { ExtensionManifest } from '@tribble/sdk-extensions';
import { ControlClient } from '@tribble/sdk-control';

export interface RunnerDeps {
  execute: (capabilityRef: string, params?: any) => Promise<any>;
  log?: (line: string) => void;
}

export async function runExtension(manifest: ExtensionManifest, event: any, deps: RunnerDeps) {
  const when = String(event?.type || event?.event || '');
  const intents = manifest.intents.filter((i) => i.when === when);
  if (!intents.length) return { ok: true, steps: 0 };
  let steps = 0;
  for (const intent of intents) {
    for (const step of (intent.steps as any[])) {
      steps++;
      switch (step.type) {
        case 'call': {
          const ref = String(step.capability);
          await deps.execute(ref, step.params || {});
          deps.log?.(`call ${ref}`);
          break;
        }
        case 'dedupe':
        case 'enrich':
        case 'route':
          // Non-call steps are advisory in this MVP runner; real logic should live in capabilities/tools
          deps.log?.(`${step.type}`);
          break;
        default:
          deps.log?.(`unknown step: ${step.type}`);
      }
    }
  }
  return { ok: true, steps };
}

export function controlExecutor(ctrl: ControlClient) {
  return async (capabilityRef: string, params?: any) => {
    const m = capabilityRef.match(/^(.+):v(\d+)$/);
    if (!m) throw new Error(`Invalid capability ref: ${capabilityRef}`);
    const name = m[1];
    const version = Number(m[2]);
    return ctrl.executeCapability({ name, version, params: params || {} });
  };
}

