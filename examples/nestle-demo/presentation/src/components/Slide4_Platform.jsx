export default function Slide4_Platform() {
  return (
    <div className="slide">
      <div className="badge">
        <span>🏗️</span>
        <span>Platform Architecture</span>
      </div>

      <h2>Decoupled Innovation: Frontend ↔ Backend</h2>
      <p style={{ fontSize: '22px', maxWidth: '1100px', marginBottom: '40px' }}>
        Tribble creates a clean separation between <span className="highlight">what KAMs see</span> and <span className="highlight">where data lives</span>. Innovate on UX without touching production systems.
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
          <div style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            (Untouched • Source of Truth)
          </div>
        </div>

        <div className="arch-arrow">→</div>

        <div className="arch-layer highlight-layer">
          <div className="arch-title" style={{ color: '#3263E9', fontSize: '24px' }}>Tribble Platform</div>
          <div className="arch-items" style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '12px', fontWeight: '600', color: '#ffffff' }}>🧠 AI Orchestration Engine</div>
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
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>💬 Chat Interface</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>📊 Territory Dashboards</div>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>✅ Action Tracking</div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            (Rapid Iteration • User Feedback)
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '60px' }}>
        <div className="card">
          <div className="card-title">🔐 Secure by Design</div>
          <div className="card-desc">
            OAuth, role-based access, audit logs. Data stays in your tenant; Tribble never stores sensitive customer data.
          </div>
        </div>

        <div className="card">
          <div className="card-title">⚡ Built for Speed</div>
          <div className="card-desc">
            SDK-powered UX means 2-week sprint cycles. Test → Learn → Iterate. No 6-month IT roadmap required.
          </div>
        </div>

        <div className="card">
          <div className="card-title">♻️ Progressive Consolidation</div>
          <div className="card-desc">
            Start alongside existing tools. As confidence grows, retire redundant UIs. Backend systems stay; interfaces simplify.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '20px', fontWeight: '700', color: '#3263E9' }}>
        Backend stability. Frontend agility. Best of both worlds.
      </div>
    </div>
  )
}
