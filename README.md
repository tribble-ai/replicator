Tribble SDK (Monorepo)

This folder contains the initial scaffold for a runtime‑agnostic, TypeScript‑first SDK for Tribble. It’s independent of Tribble’s internal server codebase and intended to be published as a separate open‑source/partner SDK.

Highlights
- ESM‑first, dual export (CJS/ESM), treeshakeable
- Runtime‑agnostic (Node/Bun/Deno/Edge) with global fetch
- Secure defaults (timeouts, abort, HMAC signing for webhooks)
- Observability hooks and correlation IDs supported
- Minimal, typed surface: core, agent, ingest, workflows, events, actions, connectors

Packages
- @tribble/sdk-core – HTTP client, retries, idempotency, errors
- @tribble/sdk-agent – Chat (sync + SSE), helpers
- @tribble/sdk-ingest – /api/upload wrapper (PDF + metadata)
- @tribble/sdk-workflows – Trigger signed webhook workflows
- @tribble/sdk-events – Webhook signature verify + lightweight router
- @tribble/sdk-actions – Action composition DSL
- @tribble/sdk-connectors – Plugin API surface for external connectors
- @tribble/sdk – Umbrella package that re‑exports and wires createTribble
- @tribble/sdk-cli – Placeholder CLI (to be expanded)

Notes
- This SDK directory is self‑contained and has no dependencies on Tribble’s internal monorepo code.
- Endpoints are configurable per customer environment; defaults are sensible but overrideable.

Quickstarts
- **Field Sales Orchestrator** – `cd SDK/examples/cpg-field-sales && npm i && npm start`
  - Multi-phase job: parallel ingest/reference, retailer research prompts, live SSE stream, Markdown call-plan artifact, optional workflow trigger.
  - Env: `TRIBBLE_AGENT_BASE_URL`, `TRIBBLE_AGENT_TOKEN`, `TRIBBLE_AGENT_EMAIL`, `TRIBBLE_BASE_URL`, `TRIBBLE_INGEST_TOKEN`, optional `TRIBBLE_WORKFLOW_ENDPOINT`, `TRIBBLE_WORKFLOW_SECRET`, `PREP_TIMEOUT_MS`.
- **Real-time Sales Coach** – `cd SDK/examples/realtime-sales-coach && npm i && npm start -- --prompt "your prompt"`
  - Interactive or one‑shot streaming with timeout/abort, transcript saving, and JSON output.
  - Env: `TRIBBLE_AGENT_BASE_URL`, `TRIBBLE_AGENT_TOKEN`, `TRIBBLE_AGENT_EMAIL`, optional `COACH_TIMEOUT_MS`.
- **Enablement Agent** – `cd SDK/examples/enablement-agent && npm i && npm start -- --file ./onboarding-pack.pdf`
  - Ingests files or a folder, streams generation, writes JSON + Markdown artifacts, optional workflow trigger.
  - Env: `TRIBBLE_AGENT_BASE_URL`, `TRIBBLE_AGENT_TOKEN`, `TRIBBLE_AGENT_EMAIL`, `TRIBBLE_BASE_URL`, `TRIBBLE_INGEST_TOKEN`, optional `TRIBBLE_WORKFLOW_ENDPOINT`, `TRIBBLE_WORKFLOW_SECRET`.

Compatibility & API Alignment
- **Chat**: POST `https://tribble-chat.<env>.tribble.ai/api/external/chat` with `{ email, message, conversation_id?, streaming }` and text/event-stream responses.
- **Ingest**: POST `/api/upload` with multipart `files` + `metadata_{index}`. Headers: `Authorization: Bearer <token>`, optional `X-Tribble-Request-Id`, `X-Idempotency-Key` (SDK sends both).
- **Workflow Trigger**: Any HTTPS endpoint; SDK signs with `X-Tribble-Signature: t=<unix>, v1=<hmac>` using the shared secret.
- **Metadata Support**: Upload metadata keys handled today – `uuid`, `privacy`, `typeId`, `typeIsRfp`, `typeIsStructured`, `typeIsInsight`, `uploadDate`, `useForGeneration`, `label`, `source_url`, `externalDocSource`, `always_tag_metadata`, `auto_tag_metadata`, `never_auto_tag_metadata`.
- **Known gaps** (handled by SDK fallbacks): ingest responses may omit `document_ids`; chat SSE emits only `data:` blocks without explicit `event` names.

Release Checklist (v0.1+)
- Verify `npm run build` succeeds at repo root (`SDK` directory).
- Bump versions where needed (packages/*/package.json, package-lock.json) and update tags.
- Update this README with compatibility notes if server/API contracts change; communicate breaking changes via CHANGELOG (todo).
- Publish packages (e.g. `npm publish --access public` per workspace or via `npm run publish` script when added).
- Smoke test quickstarts against staging/prod environments with env vars only – focus on SSE stream and ingest idempotency.
