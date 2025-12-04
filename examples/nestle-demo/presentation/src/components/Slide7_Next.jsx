export default function Slide7_Next() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>🎯</span>
        <span>Next Steps</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Let's Pilot Tribble</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ marginBottom: '8px' }}>🚀 4‑Week Pilot</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '16px', color: 'rgba(11,18,32,0.8)' }}>
            <li>Week 1 — Connect & define success</li>
            <li>Weeks 2–3 — Build, ship, iterate</li>
            <li>Week 4 — Measure & scale plan</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(50,99,233,0.06)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(50,99,233,0.2)' }}>
          <h3 style={{ marginBottom: '8px', color: '#0b1220' }}>What You'll Get</h3>
          <ul style={{ fontSize: '16px', lineHeight: '1.7', color: 'rgba(11,18,32,0.85)', listStyle: 'none', paddingLeft: '0' }}>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Working mobile app installed on pilot users' phones
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Live connections to Exceedra, SAP, Power BI
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Proactive briefs running on schedule (nightly)
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Real-time territory analytics dashboard
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              "Ask Tribble" conversational AI interface
            </li>
            <li style={{ marginBottom: '8px', paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Write-back to Exceedra (completed actions)
            </li>
            <li style={{ paddingLeft: '28px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Documented ROI and rollout plan
            </li>
          </ul>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '12px' }}>
        <div className="card">
          <div className="card-title">🔒 Zero Risk</div>
          <div className="card-desc">No backend changes. Walk away if it misses.</div>
        </div>

        <div className="card">
          <div className="card-title">⚡ Fast Time-to-Value</div>
          <div className="card-desc">Value in Week 1. Full flow by Week 3.</div>
        </div>

        <div className="card">
          <div className="card-title">📊 Measurable Outcomes</div>
          <div className="card-desc">Track prep time, actions, OOS, and wins.</div>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#3263E9', marginBottom: '8px' }}>
          Ready to bring AI to the field?
        </div>
        <div style={{ fontSize: '16px', color: 'rgba(11,18,32,0.8)', marginBottom: '8px' }}>
          Let's start the pilot and show your KAMs what intelligence-first field sales feels like.
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(11,18,32,0.6)' }}>
          <strong>Contact:</strong> hello@tribble.ai  |  <strong>Next Step:</strong> Schedule pilot kickoff
        </div>
      </div>
    </div>
  )
}
