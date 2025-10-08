import type { TribbleConfig } from '@tribble/sdk-core';
import { createRequestId } from '@tribble/sdk-core';
import { AgentClient } from '@tribble/sdk-agent';
import { IngestClient } from '@tribble/sdk-ingest';
import { WorkflowsClient } from '@tribble/sdk-workflows';

export function createTribble(config: TribbleConfig) {
  const propagate = config.telemetry?.propagateTraceHeader || 'X-Tribble-Request-Id';

  const agent = new AgentClient({
    ...config.agent,
    defaultHeaders: { ...(config.agent.defaultHeaders || {}), [propagate]: createRequestId() },
  });

  const ingest = config.ingest
    ? new IngestClient({ ...config.ingest, defaultHeaders: { ...(config.ingest.defaultHeaders || {}), [propagate]: createRequestId() } })
    : undefined;

  const workflows = config.workflows
    ? new WorkflowsClient({ ...config.workflows, defaultHeaders: { ...(config.workflows.defaultHeaders || {}), [propagate]: createRequestId() } })
    : undefined;

  // optional primitives (ingest/control powered). Only attach if require/import available.
  let primitives: any;
  try {
    // Safe in CJS; in ESM, typeof require === 'undefined'
    // @ts-ignore
    if (typeof require !== 'undefined') {
      // @ts-ignore
      const { PrimitivesClient } = require('@tribble/sdk-primitives');
      primitives = new PrimitivesClient({ ...config, ingest: config.ingest } as TribbleConfig);
    }
  } catch {}

  return {
    agent,
    ingest: ingest!,
    workflows: workflows!,
    primitives,
    config,
  } as const;
}

export type { TribbleConfig };

// Re-exports for convenience
export { AgentClient } from '@tribble/sdk-agent';
export { IngestClient } from '@tribble/sdk-ingest';
export { WorkflowsClient } from '@tribble/sdk-workflows';
export * as actions from '@tribble/sdk-actions';
