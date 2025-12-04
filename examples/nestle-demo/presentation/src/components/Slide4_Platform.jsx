export default function Slide4_Platform() {
  return (
    <div className="slide">
      <div className="badge">
        <span>🏗️</span>
        <span>Platform Architecture</span>
      </div>

      <h2>Decoupled Innovation</h2>
      <p style={{ fontSize: '18px', maxWidth: '900px', marginBottom: '20px' }}>
        Change UX weekly while your backend stays stable.
      </p>

      <div className="arch-diagram">
        <div className="arch-layer">
          <div className="arch-title">Your Backend Systems</div>
          <div className="arch-items" style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✓ Exceedra</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✓ SAP</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✓ Power BI</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✓ ICP</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✓ DEX</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(11,18,32,0.6)' }}>
            (Untouched • Source of Truth)
          </div>
        </div>

        <div className="arch-arrow">→</div>

        <div className="arch-layer highlight-layer">
          <div className="arch-title" style={{ color: '#3263E9', fontSize: '24px' }}>Tribble Platform</div>
          <div className="arch-items" style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '12px', fontWeight: '600', color: '#0b1220' }}>🧠 AI Orchestration Engine</div>
            <div style={{ marginBottom: '8px' }}>Autonomous queries</div>
            <div style={{ marginBottom: '8px' }}>Cross-system analytics</div>
            <div style={{ marginBottom: '8px' }}>Scheduled workflows</div>
            <div style={{ marginBottom: '8px' }}>Write-back automation</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#3263E9', fontWeight: '700' }}>
            (Innovation Layer • SDK-Powered)
          </div>
        </div>

        <div className="arch-arrow">→</div>

        <div className="arch-layer">
          <div className="arch-title">Custom Frontend</div>
          <div className="arch-items" style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>📱 Mobile-First UX</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>💬 Chat in Microsoft Teams</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>📊 Desktop Analytics</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✅ Action Tracking</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(11,18,32,0.6)' }}>
            (Rapid Iteration • User Feedback)
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '28px' }}>
        <div className="card">
          <div className="card-title">🔐 Secure by Design</div>
          <div className="card-desc">SSO, roles, audit logs. Data stays in your tenant.</div>
        </div>

        <div className="card">
          <div className="card-title">⚡ Built for Speed</div>
          <div className="card-desc">2‑week sprints. Test → Learn → Iterate.</div>
        </div>

        <div className="card">
          <div className="card-title">♻️ Progressive Consolidation</div>
          <div className="card-desc">Start beside current tools; retire UIs over time.</div>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '16px', fontWeight: '700', color: '#3263E9' }}>Backend stability. Frontend agility.</div>
    </div>
  )
}
