export default function Slide3_Meeting() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>🗓️</span>
        <span>Meeting Plan (45m)</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Goal & Run‑of‑Show</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Goal (say this up front)</div>
        <div className="card-desc">
          “Agree a 4–6 week field pilot in UK&I with 5–8 KAMs to prove: (1) time‑to‑prep ↓, (2) execution consistency ↑, and (3) revenue impact for top actions.”
        </div>
      </div>

      <div className="card-grid two-col" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">Agenda</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>• Context & goals (5m)</li>
            <li>• Live demo (20m)</li>
            <li>• How it works (5m)</li>
            <li>• Pilot plan & success (10m)</li>
            <li>• Decision & next steps (5m)</li>
          </ul>
        </div>
        <div className="card">
          <div className="card-title">In‑person touch</div>
          <div className="card-desc">If in London, run a 10‑minute hallway demo with Julie and ask for her top two pilot outcomes.</div>
          <div className="card-title" style={{ marginTop: 12 }}>What to open with</div>
          <div className="card-desc">Summarise Exceedra, SAP, Power BI, and pains: fast call prep, suggested actions, link to sales.</div>
        </div>
      </div>
    </div>
  )
}

