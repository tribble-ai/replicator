export default function Slide10_Objections() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>🛡️</span>
        <span>Objection Handling</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Quick Talk Tracks</h2>

      <div className="card-grid two-col">
        <div className="card">
          <div className="card-title">“We already have Exceedra and Power BI.”</div>
          <div className="card-desc">Right—Tribble sits above them to turn their data into a brief + actions. No duplicate entry, no new system of record.</div>
        </div>
        <div className="card">
          <div className="card-title">“How do you prove action → sales?”</div>
          <div className="card-desc">We tag each action with store, category, date; compare to similar stores (A/B or matched pair) and attribute lift windows.</div>
        </div>
        <div className="card">
          <div className="card-title">“Integration risk.”</div>
          <div className="card-desc">Pilot is read‑only; single service account; limited scope. We can run on snapshots if needed.</div>
        </div>
        <div className="card">
          <div className="card-title">“Security & privacy.”</div>
          <div className="card-desc">Customer/store data only; no PHI/PII beyond contacts; encryption in transit/at rest; SSO; audit logs.</div>
        </div>
        <div className="card">
          <div className="card-title">“Reps won’t adopt another tool.”</div>
          <div className="card-desc">This replaces 20–30 minutes of manual prep, and actions live in Teams where they already work.</div>
        </div>
      </div>
    </div>
  )
}
