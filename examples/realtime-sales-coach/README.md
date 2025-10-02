Real-time Sales Coach Quickstart

What it does
- Streams coaching responses from Tribble in real time (SSE), suitable for CLIs or backend services.
- Supports interactive chat mode, timeouts/abort, saving transcripts, and JSON output.

Run locally
- Node 18+ required
- Copy `.env.example` to `.env` and fill values
- Commands:
  - `npm i`
  - One‑shot prompt: `npm start -- --prompt "Coach me on pricing objections"`
  - Interactive chat: `npm start -- --interactive --conv-id <existing-conv-id>`

CLI usage
- `npm start -- [--interactive] [--prompt "text"] [--timeout-ms 300000] [--conv-id CID] [--save transcript.json] [--json]`
- Notes:
  - `--interactive` enters a REPL. Type `:exit` to quit. Provide `--conv-id` to persist server conversation context across turns.
  - `--timeout-ms` sets a hard timeout for each response (default `COACH_TIMEOUT_MS` or 300000).
  - `--save` writes transcript or response to a JSON file after each turn/run.
  - `--json` prints a structured JSON payload in addition to streaming tokens.

Environment
- `TRIBBLE_AGENT_BASE_URL`: e.g. `https://tribble-chat.tribble.ai/api/external`
- `TRIBBLE_AGENT_TOKEN`: External client token
- `TRIBBLE_AGENT_EMAIL`: User email for the chat context
- `COACH_TIMEOUT_MS`: Optional per‑turn timeout default (ms)

Deploy with Docker
- `docker build -t tribble-example-realtime-coach .`
- `docker run --env-file .env tribble-example-realtime-coach -- --prompt "Coach me on pricing objections"`
