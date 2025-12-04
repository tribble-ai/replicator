export default function Slide6_Impact() {
  return (
    <div className="slide">
      <div className="badge">
        <span>📈</span>
        <span>Business Impact</span>
      </div>

      <h2 style={{ textAlign: 'center' }}>Business Impact</h2>
      <p style={{ fontSize: '18px', textAlign: 'center', maxWidth: '900px', margin: '0 auto 16px' }}>Outcomes you can measure in weeks.</p>

      <div className="stats">
        <div className="stat">
          <div className="stat-value">−90%</div>
          <div className="stat-label">Visit Prep Time</div>
        </div>
        <div className="stat">
          <div className="stat-value">2 Weeks</div>
          <div className="stat-label">UX Iteration Cycle</div>
        </div>
        <div className="stat">
          <div className="stat-value">+25%</div>
          <div className="stat-label">Win Rate Lift</div>
        </div>
        <div className="stat">
          <div className="stat-value">Zero</div>
          <div className="stat-label">Backend Disruption</div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-icon">⚡</div>
          <div className="card-title">Velocity & Agility</div>
          <div className="card-desc">
            <strong>Test workflows in weeks, not quarters.</strong> Rapid feedback loops mean you adapt to market changes faster than competitors still waiting on IT roadmaps.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🎯</div>
          <div className="card-title">Precision Execution</div>
          <div className="card-desc">
            <strong>Proof-backed recommendations scale wins.</strong> Every action comes with evidence from similar stores. Best practices propagate automatically across 200+ KAMs.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🚀</div>
          <div className="card-title">Competitive Moat</div>
          <div className="card-desc">An intelligence layer that improves every day.</div>
        </div>
      </div>

      <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(50,99,233,0.06)', borderRadius: '16px', border: '1px solid rgba(50,99,233,0.25)', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#3263E9', marginBottom: '6px' }}>Compounding Intelligence</div>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(11,18,32,0.8)' }}>Every action makes the next action smarter.</div>
      </div>
    </div>
  )
}
