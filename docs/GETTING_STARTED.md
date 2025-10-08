Getting Started

Audience
- Customer developers and partners implementing on Tribble.

Prereqs
- Node 18+ (or Deno/Bun for runtime-agnostic libs)
- Install CLI: npm i -g @tribble/sdk-cli (or use npx tribble)

Quick Start (choose one)

1) Use the unified primitives to upload data

  npx tribble upload \
    --base-url https://my.tribble.ai \
    --token $TRIBBLE_INGEST_TOKEN \
    --type pdf \
    --file ./invoice.pdf \
    --metadata '{"label":"invoice"}'

2) Author an extension (No‑Maintenance Custom)

  # scaffold
  npx tribble ext init ./my-extension
  # iterate on extension.yaml
  npx tribble ext validate --manifest ./my-extension/extension.yaml
  npx tribble ext test --manifest ./my-extension/extension.yaml
  # publish to a channel (local)
  npx tribble ext publish --manifest ./my-extension/extension.yaml --channel regular

3) Run an extension privately (optional)

  npx tribble runner run \
    --manifest ./my-extension/extension.yaml \
    --event ./my-extension/fixtures/sample.json \
    --control-base-url https://control.tribble.ai \
    --control-token $TRIBBLE_CONTROL_TOKEN

Next Steps
- Learn about extension manifests: docs/EXTENSIONS.md
- See all CLI commands: docs/CLI.md
- Explore deployment options: docs/DEPLOY.md

