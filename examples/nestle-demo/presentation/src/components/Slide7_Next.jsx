export default function Slide7_Next() {
  return (
    <div className="slide">
      <div className="badge">
        <span>🎯</span>
        <span>Next Steps</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '60px' }}>
        Let's Pilot Tribble with Your Team
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
        <div>
          <h3 style={{ fontSize: '32px', marginBottom: '24px' }}>🚀 4-Week Pilot Program</h3>
          <div style={{ fontSize: '18px', lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: '700', color: '#3263E9', marginBottom: '8px' }}>Week 1: Discovery & Connect</div>
              <div>Map workflows, connect Exceedra + SAP, define success criteria with 5-10 KAMs.</div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: '700', color: '#3263E9', marginBottom: '8px' }}>Week 2-3: Build & Iterate</div>
              <div>Deploy proactive briefs + territory dashboard. Daily feedback loops; SDK-powered UX tweaks in real-time.</div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontWeight: '700', color: '#3263E9', marginBottom: '8px' }}>Week 4: Measure & Scale</div>
              <div>Review KPIs (prep time, win rate, satisfaction). Plan rollout to broader team. Identify next workflows.</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(50,99,233,0.08)', padding: '40px', borderRadius: '20px', border: '2px solid rgba(50,99,233,0.2)' }}>
          <h3 style={{ fontSize: '28px', marginBottom: '24px', color: '#ffffff' }}>What You'll Get</h3>
          <ul style={{ fontSize: '18px', lineHeight: '2', color: 'rgba(255,255,255,0.9)', listStyle: 'none', paddingLeft: '0' }}>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Working mobile app installed on pilot users' phones
            </li>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Live connections to Exceedra, SAP, Power BI
            </li>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Proactive briefs running on schedule (nightly)
            </li>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Real-time territory analytics dashboard
            </li>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              "Ask Tribble" conversational AI interface
            </li>
            <li style={{ marginBottom: '16px', paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Write-back to Exceedra (completed actions)
            </li>
            <li style={{ paddingLeft: '36px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0', color: '#3263E9', fontWeight: '700' }}>✓</span>
              Documented ROI and rollout plan
            </li>
          </ul>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '40px' }}>
        <div className="card">
          <div className="card-title">🔒 Zero Risk</div>
          <div className="card-desc">
            No backend changes required. Pilot runs alongside existing systems. If it doesn't deliver, you walk away—no integration debt left behind.
          </div>
        </div>

        <div className="card">
          <div className="card-title">⚡ Fast Time-to-Value</div>
          <div className="card-desc">
            KAMs see value <strong>Week 1</strong> (first brief generated). Full workflow live by <strong>Week 3</strong>. Traditional AI projects take 6-12 months.
          </div>
        </div>

        <div className="card">
          <div className="card-title">📊 Measurable Outcomes</div>
          <div className="card-desc">
            We track prep time, NPS, win rate, action completion. Clear before/after metrics. ROI proven, not promised.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', fontWeight: '900', color: '#3263E9', marginBottom: '24px' }}>
          Ready to bring AI to the field?
        </div>
        <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)', marginBottom: '40px' }}>
          Let's start the pilot and show your KAMs what intelligence-first field sales feels like.
        </div>
        <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)' }}>
          <strong>Contact:</strong> hello@tribble.ai  |  <strong>Next Step:</strong> Schedule pilot kickoff
        </div>
      </div>
    </div>
  )
}
