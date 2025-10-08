Capabilities – Versioned Contracts

Summary
- Capabilities are versioned, semantic contracts used by extensions (e.g., `email.send:v2`).
- The SDK ships a seed registry in `@tribble/sdk-capabilities`; the control plane is the source of truth.

Package
- `@tribble/sdk-capabilities`: types, parser (`name:vN`), and a default registry.
- Used by `@tribble/sdk-extensions` validator to warn on unknown capability refs.

Why
- Enables compatibility testing and safe upgrades across tenants.
- Stabilizes external interface while the agentic layer evolves.

Next steps
- Generate TS types for inputs/outputs from the canonical registry.
- Expose deprecation metadata and suggested migrations.
- Drive `tribble ext migrate` codemods from registry rules.

