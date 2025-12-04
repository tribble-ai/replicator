import type { TribbleConfig } from '@tribble/sdk-core';
import { createRequestId } from '@tribble/sdk-core';
import { AgentClient } from '@tribble/sdk-agent';
import { IngestClient } from '@tribble/sdk-ingest';
import { WorkflowsClient } from '@tribble/sdk-workflows';

/**
 * Create a configured Tribble SDK instance
 *
 * @example
 * ```typescript
 * const tribble = createTribble({
 *   agent: {
 *     baseUrl: 'https://api.tribble.com',
 *     token: 'your-token',
 *     email: 'user@example.com'
 *   },
 *   ingest: {
 *     baseUrl: 'https://ingest.tribble.com',
 *     tokenProvider: async () => 'your-token'
 *   },
 *   workflows: {
 *     endpoint: 'https://workflows.tribble.com/invoke',
 *     signingSecret: 'your-secret'
 *   }
 * });
 *
 * // Chat with an agent
 * const response = await tribble.agent.chat('Hello!');
 *
 * // Upload a document
 * await tribble.ingest.uploadDocument({
 *   file: pdfBuffer,
 *   filename: 'document.pdf',
 *   metadata: { title: 'My Document' }
 * });
 *
 * // Trigger a workflow
 * await tribble.workflows.trigger({ event: 'user_created', data: { userId: '123' } });
 * ```
 */
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

// Re-exports for direct access
export { AgentClient } from '@tribble/sdk-agent';
export { IngestClient } from '@tribble/sdk-ingest';
export { WorkflowsClient } from '@tribble/sdk-workflows';
export { TribbleAuth, InMemoryStorage, FileStorage } from '@tribble/sdk-auth';
export { UploadQueue } from '@tribble/sdk-queue';
export { verifySignature, createWebhookApp } from '@tribble/sdk-events';
