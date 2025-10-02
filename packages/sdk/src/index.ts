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

  return {
    agent,
    ingest: ingest!,
    workflows: workflows!,
    config,
  } as const;
}

export type { TribbleConfig };

// Re-exports for convenience
export { AgentClient } from '@tribble/sdk-agent';
export { IngestClient } from '@tribble/sdk-ingest';
export { WorkflowsClient } from '@tribble/sdk-workflows';
export * as actions from '@tribble/sdk-actions';

