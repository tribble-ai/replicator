Primitives (CUDA‑like) – SDK Overview

Goals
- Unify ingestion and orchestration behind a small set of atomic operations.
- Compose primitives into business recipes while keeping the core platform generic.

Current status (MVP)
- Implemented: `upload(params)`, `uploadBatch(params)` via the existing ingest endpoints.
- Placeholders (server wiring required): `createTag`, `createUser`, `createWorkflow`, `executeAction`, `query`, `subscribe`.
- Package: `@tribble/sdk-primitives`. Re-export: `@tribble/sdk/primitives`.

Examples
// Node/Edge
import { PrimitivesClient } from '@tribble/sdk/primitives'

const primitives = new PrimitivesClient({
  agent: { baseUrl: 'https://placeholder', token: 'x', email: 'you@company.com' },
  ingest: { baseUrl: 'https://my.tribble.ai', tokenProvider: async () => process.env.TRIBBLE_INGEST_TOKEN! }
} as any)

await primitives.upload({
  content: await fs.readFile('invoice.pdf'),
  contentType: 'pdf',
  tags: ['invoice', 'vendor-acme'],
  metadata: { invoiceNumber: 'INV-12345' }
})

CLI usage
- `tribble upload --base-url <url> --token <token> --type pdf --file ./file.pdf --metadata '{"label":"contract"}'`

Planned wiring (control plane)
- Stable REST endpoints for tags, users, workflows, action execution, query, and subscriptions.
- Idempotency keys, typed error codes, and span/trace propagation by default.

