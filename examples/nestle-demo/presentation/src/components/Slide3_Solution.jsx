export default function Slide3_Solution() {
  return (
    <div className="slide">
      <div className="badge">
        <span>✨</span>
        <span>The Solution</span>
      </div>

      <h2>Tribble: Your AI Intelligence Layer</h2>
      <p style={{ fontSize: '24px', maxWidth: '1100px', marginBottom: '60px' }}>
        We don't replace your systems—we <span className="highlight">orchestrate them</span>. One AI platform that connects, analyzes, and acts across your entire stack.
      </p>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-icon">🧠</div>
          <div className="card-title" style={{ fontSize: '28px' }}>Intelligence Without the Integration Tax</div>
          <div className="card-desc" style={{ fontSize: '18px' }}>
            Tribble sits <span className="highlight">on top</span> of Exceedra, SAP, Power BI, ICP, and DEX—pulling data autonomously, generating insights, and writing back results. Your teams get one interface; your backend stays intact.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">⚡</div>
          <div className="card-title">Proactive, Not Reactive</div>
          <div className="card-desc">
            Briefs are prepared <strong>before</strong> visits. OOS alerts trigger <strong>before</strong> stockouts. Expansion plays fire <strong>before</strong> contracts expire. AI runs overnight; KAMs wake up to intelligence.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🎯</div>
          <div className="card-title">Proof-Backed Recommendations</div>
          <div className="card-desc">
            Every action comes with evidence from similar stores. "Birmingham Fort did this display reposition—£2,890 lift in 2 weeks." KAMs walk in with confidence, not guesswork.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🔄</div>
          <div className="card-title">Write-Back to Your Systems</div>
          <div className="card-desc">
            Tribble doesn't just read—it <strong>executes</strong>. Completed actions write back to Exceedra. Analytics flow into Power BI. Your systems stay the source of truth; Tribble keeps them synchronized.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">📱</div>
          <div className="card-title">Custom UX, Rapid Iteration</div>
          <div className="card-desc">
            Using our SDK, we build tailored mobile experiences in <strong>weeks, not quarters</strong>. Test new workflows fast. Change the interface based on feedback—without touching backend systems.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px', padding: '32px', background: 'rgba(50,99,233,0.1)', borderRadius: '20px', border: '2px solid rgba(50,99,233,0.3)' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#3263E9', marginBottom: '12px' }}>THE TRIBBLE DIFFERENCE</div>
        <div style={{ fontSize: '22px', lineHeight: '1.6' }}>
          You keep your systems. We add the intelligence layer. Your KAMs get AI-powered insights; your IT gets zero disruption. And when you're ready, we can retire redundant UIs—gradually consolidating interfaces while backend systems run untouched.
        </div>
      </div>
    </div>
  )
}
