Deployment Options

1) Tribble Managed Runtime (Default)
- Publish extensions to channels; Tribble operates, monitors, upgrades.
- Use CLI `ext publish/promote/freeze/test/migrate`.

2) Private Runner (Your Infra)
- Run `@tribble/sdk-runner` near your data; capabilities execute via control plane.
- CLI: `tribble runner run ...` for local testing; package as container/Helm for production.

3) Ecosystem Runtimes (Salesforce/ServiceNow/SAP)
- Ship thin native packages (UI + secure HTTP tools) that call Tribble capabilities.
- Use packages: `packages/salesforce`, `packages/servicenow`, `packages/sap` and wire them to primitives/capabilities.

Configuration
- Control plane access for primitives and runner:

  TribbleConfig.control = {
    baseUrl: 'https://control.tribble.ai',
    tokenProvider: async () => process.env.TRIBBLE_CONTROL_TOKEN!
  }

Security & Governance
- Enforce policies via manifest validation (PII, data_scope, cost) and server-side checks.
- Use channels and kill-switches to manage rollouts and incident response.

