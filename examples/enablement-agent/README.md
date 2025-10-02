Enablement Agent Quickstart (Rep Onboarding)

What it does
- Ingests onboarding documents (single file or folder) and asks the agent for a structured 2‑week onboarding plan.
- Streams generation in real time, then writes `onboarding-plan.json` and `onboarding-plan.md` artifacts.
- Also emits `onboarding-plan.pdf` via a lightweight PDF adapter (pdfkit).
- Optional: triggers a signed workflow when configured.

Run locally
- Node 18+ required
- Copy `.env.example` to `.env` and fill values
- Commands:
  - `npm i`
  - Single file: `npm start -- --file ./onboarding-pack.pdf`
  - Folder of PDFs: `npm start -- --dir ./docs`
  - Reference‑only (skip ingest): `npm start -- --file ./onboarding-pack.pdf --reference-only`

CLI usage
- `npm start -- [--file path.pdf ...] [--dir docs/] [--reference-only] [--out-dir artifacts] [--slug onboarding-plan] [--conv-id CID]`
- Notes:
  - You can pass multiple `--file` flags; `--dir` ingests all `*.pdf` in the folder.
  - `--reference-only` skips uploading and references filenames/uuids directly.
  - Artifacts are saved to `--out-dir` (default `artifacts`).
  - Provide `--slug` to set a workflow slug when workflow env is configured.

Environment
- `TRIBBLE_AGENT_BASE_URL`: e.g. `https://tribble-chat.tribble.ai/api/external`
- `TRIBBLE_AGENT_TOKEN`: External client token
- `TRIBBLE_AGENT_EMAIL`: User email for the chat context
- `TRIBBLE_BASE_URL`: e.g. `https://my.tribble.ai`
- `TRIBBLE_INGEST_TOKEN`: Bearer token for `/api/upload`
- Optional workflow trigger:
  - `TRIBBLE_WORKFLOW_ENDPOINT`: HTTPS endpoint or `/invoke` URL
  - `TRIBBLE_WORKFLOW_SECRET`: Shared HMAC secret for signing

Deploy with Docker
- `docker build -t tribble-example-enablement-agent .`
- `docker run --env-file .env -v "$PWD/artifacts:/app/artifacts" tribble-example-enablement-agent -- --file ./onboarding-pack.pdf`
