Extension Runner (Private/Local)

Purpose
- Execute an extension manifest locally or in a private environment using the control plane for capability execution.

Package
- `@tribble/sdk-runner`: `runExtension(manifest, event, deps)` and `controlExecutor(ControlClient)`.

CLI
- `tribble runner run --manifest <path> --event <fixture.json> --control-base-url <url> --control-token <token>`

How it works
- Reads the manifest, finds intents that match the event `type`, iterates steps.
- `call` steps invoke capabilities through the control plane (`name:vN`).
- Non-call steps (dedupe/enrich/route) are advisory in this MVP; model them as capabilities or tools in your control plane for production.

When to use
- Private/VPC execution for data residency.
- Early local validation before publishing to the managed runtime.

