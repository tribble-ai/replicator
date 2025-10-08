Managed Extensibility (SDK Upgrades)

Goal: deliver “No‑Maintenance Custom” — customers get tailor‑made workflows on a stable core, while Tribble builds, hosts, monitors, upgrades, and repairs customizations.

What’s new in the SDK (MVP)
- `@tribble/sdk-extensions`: typed manifest + validator for extensions.
- JSON Schema at `schemas/extension.schema.json` for control‑plane and CI validation.
- CLI support via `@tribble/sdk-cli`:
  - `tribble ext init [dir]` — scaffold an example `extension.yaml`.
  - `tribble ext validate --manifest <path>` — validate against the local rules/registry.
  - `tribble ext plan --manifest <path>` — print a normalized execution plan.
  - `tribble ext test --manifest <path>` — run contract tests declared in the manifest.
  - `tribble ext publish --manifest <path> --channel <lts|regular|canary>` — publish locally and update channel pointers.
  - `tribble ext promote --name <n> --version <v> --from <c> --to <c>` — move a version between channels.
  - `tribble ext freeze --name <n> --channel <c>` — mark a channel as frozen.
  - `tribble ext migrate --manifest <path> --rename old=new [--write]` — codemod helper for capability ref changes.
- Seed Capability Registry (in `@tribble/sdk-extensions`): `contact.lookup:v1`, `email.send:v2`, `crm.upsert:v1`.

Why this matters
- Creates a governed, declarative layer (“intents + policies”) over the agentic core.
- Enables contract/compat testing and channelized rollouts in CI.
- Keeps customizations thin and auto‑migratable as models/tools evolve.

Authoring a new extension
1) Initialize
   - `npx tribble ext init examples/extensions/my-extension`

2) Edit `extension.yaml`
   - Fill in `name`, `version`, `capabilities`, `intents`, `policies`, `tests`, `permissions`.
   - See example: `examples/extensions/lead-dedupe-and-route/extension.yaml`.

3) Validate locally
   - `npx tribble ext validate --manifest examples/extensions/lead-dedupe-and-route/extension.yaml`
   - Output: `{ ok, errors[], warnings[] }` (warnings include capabilities not in the local registry).

4) Preview plan
   - `npx tribble ext plan --manifest examples/extensions/lead-dedupe-and-route/extension.yaml`

Manifest reference (MVP)
- `name` (string): unique extension name.
- `version` (semver string): your extension’s version.
- `sdk` (string): SDK range (e.g., `"@tribble/sdk@0.x"`).
- `capabilities` (string[]): list like `email.send:v2`.
- `intents` (array):
  - `when` (string): event, e.g., `lead_created`.
  - `steps` (array of objects):
    - `type: call`, `capability: name:vN`, optional `params`.
    - `type: dedupe`, `strategy: exact|semantic|semantic+exact`, optional `threshold`.
    - `type: enrich`, `source: <string>`.
    - `type: route`, `rule: <string>`, `owners: string[]`.
- `policies`:
  - `pii: allow|redact|deny`
  - `data_scope: tenant|global`
  - `cost_limit_usd: number`
- `tests` (array): `{ name, given_event, expect[] }` (for contract testing in CI).
- `permissions` (string[]): e.g., `crm:write`, `email:send`.

Control plane/CI integration (next steps)
- Run schema and semantic validation on PRs and before rollouts.
- Generate consumer‑driven contract tests from `tests` and gate SDK/capability updates.
- Add release channels (LTS/Regular/Canary) to the publish pipeline.
- Expand capability registry from the server‑side canonical list.

Limitations in MVP
- YAML parsing in CLI requires the `yaml` package at runtime; otherwise provide JSON.
- Capability registry is a local seed; warnings are emitted when refs aren’t recognized.
- No runtime execution here — this is authoring/validation; execution occurs in Tribble’s extension runtime.
