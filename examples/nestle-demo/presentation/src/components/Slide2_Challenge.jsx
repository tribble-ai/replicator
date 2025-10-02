export default function Slide2_Challenge() {
  return (
    <div className="slide">
      <div className="badge">
        <span>⚠️</span>
        <span>The Challenge</span>
      </div>

      <h2>Your KAMs are drowning in complexity</h2>
      <p style={{ fontSize: '24px', maxWidth: '1000px', marginBottom: '40px' }}>
        Field sales teams spend more time preparing than selling—hunting across systems, copying data, and making decisions without real-time insights.
      </p>

      <div className="card-grid">
        <div className="card">
          <div className="card-icon">⏰</div>
          <div className="card-title">45 Minutes of Prep</div>
          <div className="card-desc">
            KAMs manually aggregate data from 6+ systems before every store visit. Time that should be spent selling is lost to admin work.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🔀</div>
          <div className="card-title">Fragmented Intelligence</div>
          <div className="card-desc">
            Critical insights live in silos—Exceedra, SAP, Power BI, ICP, DEX. No single source of truth means decisions are made on incomplete data.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">❌</div>
          <div className="card-title">Missed Opportunities</div>
          <div className="card-desc">
            Without proof points from similar stores, KAMs lack the confidence to recommend high-impact actions. Wins don't scale across territory.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <div className="card-title">Reactive, Not Proactive</div>
          <div className="card-desc">
            OOS risks, churn signals, and expansion opportunities are discovered too late. Teams are always catching up, never getting ahead.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🐌</div>
          <div className="card-title">Slow Innovation Cycles</div>
          <div className="card-desc">
            Testing new workflows requires IT resources, long dev cycles, and expensive custom UI builds. Feedback loops are measured in quarters.
          </div>
        </div>

        <div className="card">
          <div className="card-icon">💰</div>
          <div className="card-title">Rising Costs, Flat ROI</div>
          <div className="card-desc">
            More tools, more seats, more training—but productivity hasn't improved. Legacy systems can't talk to each other; integration debt grows.
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '20px', color: '#3263E9', fontWeight: '700' }}>
        You need a layer that connects everything—without replacing anything.
      </div>
    </div>
  )
}
