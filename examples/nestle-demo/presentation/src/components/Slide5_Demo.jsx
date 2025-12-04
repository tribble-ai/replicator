export default function Slide5_Demo() {
  return (
    <div className="slide">
      <div className="badge">
        <span>📱</span>
        <span>Live Demo</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>NAM → KAM → Teams (10+10 mins)</h2>

      <p style={{ fontSize: '18px', textAlign: 'center', maxWidth: '1050px', margin: '0 auto 28px' }}>
        Tip: open with <code>?brand=nestle</code> to enable Nestlé theme. Co‑brand lockup appears automatically.
      </p>

      <div className="pillars">
        <div className="pillar">
          <div className="pillar-number">A</div>
          <div className="pillar-title">Tablet · NAM Territory Command</div>
          <div className="pillar-desc">
            Dashboard → Insight popover → Store row → open a Call. Prove drivers & suggested actions and auto‑summarised calls.
          </div>
        </div>

        <div className="pillar">
          <div className="pillar-number">B</div>
          <div className="pillar-title">Phone · KAM Visit Prep</div>
          <div className="pillar-desc">
            60‑second brief + 3 NBAs. Show evidence, tap Ask Tribble and Share to Teams. Escalate OOS by default.
          </div>
        </div>

        <div className="pillar">
          <div className="pillar-number">C</div>
          <div className="pillar-title">Hallway Script (Julie)</div>
          <div className="pillar-desc">
            Insight → store → call → phone → one action → “Share to Teams”. Ask her top two pilot outcomes.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(50,99,233,0.06)', borderRadius: '12px', border: '1px solid rgba(50,99,233,0.2)' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0b1220', marginBottom: '8px' }}>
          Throughout the demo
        </div>
        <div style={{ fontSize: '16px', color: 'rgba(11,18,32,0.8)' }}>
          Punch out to <strong>Microsoft Teams</strong> from NAM and KAM to:
          <ul style={{ marginTop: '8px', listStyle: 'none', paddingLeft: 0 }}>
            <li style={{ marginBottom: '6px' }}>• Ask Tribble in plain English</li>
            <li style={{ marginBottom: '6px' }}>• Share store/account context with links</li>
            <li style={{ marginBottom: '6px' }}>• Create follow‑ups and tasks</li>
            <li>• Keep a record in Teams</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#3263E9', marginBottom: '8px' }}>
          Ready to switch to the app →
        </div>
        <div style={{ fontSize: '16px', color: 'rgba(11,18,32,0.7)' }}>
          NAM (tablet) then KAM (phone), with Teams share.
        </div>
      </div>

      <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(50,99,233,0.06)', borderRadius: '12px', border: '1px solid rgba(50,99,233,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'rgba(11,18,32,0.8)', lineHeight: '1.6' }}>
          <strong style={{ color: '#0b1220' }}>Note:</strong> Built in <span className="highlight">2 weeks</span> with Tribble SDK. Traditional builds take 6+ months.
        </div>
      </div>
    </div>
  )
}
