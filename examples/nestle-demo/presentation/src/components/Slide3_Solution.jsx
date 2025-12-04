export default function Slide3_Solution() {
  return (
    <div className="slide">
      <div className="badge">
        <span>✨</span>
        <span>The Solution</span>
      </div>

      <h2>One Layer, Not Another Tool</h2>
      <p style={{ fontSize: '20px', maxWidth: '900px', marginBottom: '28px' }}>
        Tribble <span className="highlight">orchestrates</span> Exceedra, SAP, and Power BI—so teams work faster in one place.
      </p>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-icon">🧠</div>
          <div className="card-title" style={{ fontSize: '22px' }}>An intelligence layer, not another system of record</div>
          <div className="card-desc" style={{ fontSize: '16px' }}>One interface on top of Exceedra, SAP, Power BI. Insights in, actions out—no backend disruption.</div>
        </div>

        <div className="card">
          <div className="card-icon">⚡</div>
          <div className="card-title">Proactive by Default</div>
          <div className="card-desc">Briefs and alerts arrive before the day starts.</div>
        </div>

        <div className="card">
          <div className="card-icon">🎯</div>
          <div className="card-title">Proof‑Backed Actions</div>
          <div className="card-desc">Recommendations include evidence from similar stores.</div>
        </div>

        <div className="card">
          <div className="card-icon">🔄</div>
          <div className="card-title">Write‑Back Included</div>
          <div className="card-desc">Completed actions sync to Exceedra; analytics flow to Power BI.</div>
        </div>

        <div className="card">
          <div className="card-icon">📍</div>
          <div className="card-title">Where Your Teams Work</div>
          <div className="card-desc">Mobile for KAMs, desktop for Market, chat in Teams.</div>
        </div>
      </div>

      <div style={{ marginTop: '28px', padding: '20px', background: 'rgba(50,99,233,0.06)', borderRadius: '16px', border: '1px solid rgba(50,99,233,0.25)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#3263E9', marginBottom: '6px' }}>THE TRIBBLE DIFFERENCE</div>
        <div style={{ fontSize: '16px', lineHeight: '1.6' }}>Keep your systems. Add an intelligence layer. Zero disruption.</div>
      </div>
    </div>
  )
}
