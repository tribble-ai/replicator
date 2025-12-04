export default function Slide8_PilotPlan() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>🧪</span>
        <span>Pilot Plan</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>UK&I Pilot — Scope, Data, Success</h2>

      <div className="card-grid two-col">
        <div className="card">
          <div className="card-title">Scope</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>• 5–8 KAMs; 20–30 stores</li>
            <li>• 4–6 weeks</li>
          </ul>

          <div className="card-title" style={{ marginTop: 10 }}>Data</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>• Read‑only from Exceedra (visits, plans)</li>
            <li>• SAP (sell‑out/sell‑in as available)</li>
            <li>• Power BI (curated metrics)</li>
            <li>• No writes</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">Integrations</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>• Auth: SSO (Azure AD) or pilot service account(s)</li>
            <li>• Channels: Microsoft Teams deep links</li>
            <li>• Devices: iPad + iPhone; offline cache for briefs</li>
          </ul>

          <div className="card-title" style={{ marginTop: 10 }}>Governance</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>• Weekly 20‑min check‑in</li>
            <li>• Mid‑pilot review</li>
            <li>• Final read‑out + playbook</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-title">Success Metrics</div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 16px' }}>
          <li>• Time‑to‑prep ≤ 3 min/visit</li>
          <li>• NBA completion +20–30 pts (≤72h)</li>
          <li>• Revenue proxy: lift for 1–2 actions vs matched stores</li>
          <li>• OOS time‑to‑resolution −30–50%</li>
        </ul>
      </div>

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'rgba(11,18,32,0.75)' }}>
          Decision gate: If ≥2 of 3 targets met → roll to UK&I; start CH pilot.
        </div>
      </div>
    </div>
  )
}

