Connectors (Integration Layer)

Purpose
- Move data from external systems into Tribble using unified primitives.

Authoring
- Use `@tribble/sdk-connectors` to define a connector with `syncStrategy` (pull/push/hybrid), optional schedule, and hooks.

Example

  import { defineConnector } from '@tribble/sdk-connectors'

  export default defineConnector({
    name: 'my-api',
    syncStrategy: 'pull',
    async pull(ctx, { since }) {
      const data = await fetchSomeAPI(ctx.config, since)
      await ctx.tribble.ingest.uploadStructuredData({ data, format: 'json', filename: 'records.json' })
      return { processed: Array.isArray(data) ? data.length : 1 }
    }
  })

Local run (one‑shot)
- `npx tribble connectors run --module ./connector.js --since 2024-01-01T00:00:00Z --base-url <ingest-url> --token <token>`

State & Scheduling
- The SDK includes a simple in‑memory store for testing; production deployments should provide a durable state store and scheduler.

