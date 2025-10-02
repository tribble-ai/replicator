Field Sales Quickstart

What it does
- Orchestrates a multi‑phase “account prep” job for field reps:
  - Ingest or reference documents in parallel (UploadQueue)
  - Prepare research prompts for retailers/territory (custom web.search actions)
  - Stream the agent’s reasoning/output to clients (SSE)
  - Produce a structured JSON brief: summary, pricing flags, OOS risks, promo opportunities, store tasks, talking points, route plan, attachments
  - Generates a Markdown artifact (downloadable) representing a seller‑ready call plan
  - Optionally trigger follow‑ups via a signed workflow
  - Note: Uses the SDK actions DSL; if your agent isn’t wired for tools, the JSON payload still works as a precise instruction set.

Run locally
- Node 18+ required
- Copy .env.example to .env and fill values
- Commands:
  - npm i
  - npm start
- Health: GET /health

Environment
- TRIBBLE_AGENT_BASE_URL: e.g. https://tribble-chat.tribble.ai/api/external
- TRIBBLE_AGENT_TOKEN: External client token
- TRIBBLE_AGENT_EMAIL: User email for the chat context
- TRIBBLE_BASE_URL: e.g. https://my.tribble.ai
- TRIBBLE_INGEST_TOKEN: Bearer token for /api/upload
- TRIBBLE_WORKFLOW_ENDPOINT: Optional webhook endpoint to invoke (slug-based)
- TRIBBLE_WORKFLOW_SECRET: HMAC secret for signing webhook invocations
- PREP_TIMEOUT_MS: Optional (default 300000). Abort long-running chat stream.

API
- POST /prep/start
  - body: {
      accountId: string,
      since?: string (YYYY-MM-DD),
      retailers?: string[], territory?: string, stores?: string[],
      attachments?: { urls: string[], mode: 'ingest' | 'reference' },
      route?: { storeId?: string, name?: string, retailer?: string, city?: string, state?: string }[],
      session?: { conversationId?: string },
      generateArtifacts?: boolean
    }
  - returns: { jobId }
- GET /prep/:jobId/status
  - returns: { id, status, progress, logs, errors, conversationId }
- GET /prep/:jobId/stream
  - SSE stream of agent deltas (event: data: { type, data })
- GET /prep/:jobId/result
  - 202 while running, 200 with { conversationId, brief, artifacts } when complete
- GET /prep/:jobId/artifact
  - text/markdown output for easy sharing (if enabled)
- POST /prep/:jobId/actions
  - triggers optional workflow with actions from the brief

Deploy with Docker
- docker build -t tribble-example-cpg-field-sales .
- docker run -p 3000:3000 --env-file .env tribble-example-cpg-field-sales
