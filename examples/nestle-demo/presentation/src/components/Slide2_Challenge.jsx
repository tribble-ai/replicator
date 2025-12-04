export default function Slide2_Challenge() {
  return (
    <div className="slide">
      <div className="badge">
        <span>⚠️</span>
        <span>The Challenge</span>
      </div>

      <h2>Your NAMs & KAMs face tool overload</h2>
      <p style={{ fontSize: '20px', maxWidth: '900px', marginBottom: '28px' }}>
        Too many systems, not enough time. Here are the top pain points.
      </p>

      <div className="card-grid">
        <div className="card">
          <div className="card-icon">⏰</div>
          <div className="card-title">45 Minutes of Prep</div>
          <div className="card-desc">6+ systems before every visit. Admin steals selling time.</div>
        </div>

        <div className="card">
          <div className="card-icon">🔀</div>
          <div className="card-title">Fragmented intelligence</div>
          <div className="card-desc">Across Exceedra, SAP, Power BI → no single call view.</div>
        </div>

        <div className="card">
          <div className="card-icon">❌</div>
          <div className="card-title">Missed Opportunities</div>
          <div className="card-desc">No proof points → low confidence. Wins don’t scale.</div>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <div className="card-title">Always Catching Up</div>
          <div className="card-desc">OOS and churn found late. Hard to get ahead.</div>
        </div>

        <div className="card">
          <div className="card-icon">🐌</div>
          <div className="card-title">Slow Innovation</div>
          <div className="card-desc">UI changes take months. Feedback loops too slow.</div>
        </div>

        <div className="card">
          <div className="card-icon">💰</div>
          <div className="card-title">Rising Costs, Flat ROI</div>
          <div className="card-desc">More tools, same output. Integration debt grows.</div>
        </div>
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '20px', color: '#3263E9', fontWeight: '700' }}>
        You need a layer that connects everything—without replacing anything.
      </div>
    </div>
  )
}
