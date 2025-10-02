export default function Slide5_Demo() {
  return (
    <div className="slide">
      <div className="badge">
        <span>📱</span>
        <span>Live Demo</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>
        See Tribble in Action: Three Field Sales Challenges
      </h2>

      <p style={{ fontSize: '22px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto 80px' }}>
        We built a working mobile app that demonstrates how Tribble transforms your KAMs' daily workflow. Each pillar addresses a critical pain point you raised.
      </p>

      <div className="pillars">
        <div className="pillar">
          <div className="pillar-number">1</div>
          <div className="pillar-title">Proactive Visit Prep</div>
          <div className="pillar-desc">
            <strong>Challenge:</strong> 45 minutes hunting across systems before every visit.
            <br /><br />
            <strong>Tribble Solution:</strong> Intelligence briefs prepared overnight. KAM opens app at 7am—store context, metrics, proof-backed actions already waiting. 45 minutes → 2 minutes.
          </div>
        </div>

        <div className="pillar">
          <div className="pillar-number">2</div>
          <div className="pillar-title">Territory Intelligence</div>
          <div className="pillar-desc">
            <strong>Challenge:</strong> No real-time view of territory performance; data scattered across dashboards.
            <br /><br />
            <strong>Tribble Solution:</strong> One unified dashboard—sales trends, store health, OOS alerts. Color-coded for instant triage. Spot underperforming stores in seconds.
          </div>
        </div>

        <div className="pillar">
          <div className="pillar-number">3</div>
          <div className="pillar-title">Conversational AI Fallback</div>
          <div className="pillar-desc">
            <strong>Challenge:</strong> Questions that don't fit pre-built dashboards. "Why is Immunity down this week?"
            <br /><br />
            <strong>Tribble Solution:</strong> "Ask Tribble" chat—natural language queries against live data. Tribble queries Exceedra, SAP, Power BI and responds in seconds.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#3263E9', marginBottom: '16px' }}>
          Let's see it live →
        </div>
        <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>
          (Switch to mobile demo app)
        </div>
      </div>

      <div style={{ marginTop: '60px', padding: '24px', background: 'rgba(50,99,233,0.08)', borderRadius: '16px', border: '1px solid rgba(50,99,233,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
          <strong style={{ color: '#ffffff' }}>Note:</strong> This entire mobile experience—designed, built, and iterated—took <span className="highlight">2 weeks</span> using Tribble SDK. Traditional development would take 6+ months and require full backend integration work.
        </div>
      </div>
    </div>
  )
}
