export default function Slide2_Stakeholders() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>🧭</span>
        <span>Who Cares About What</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Primary Audience & Angle</h2>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Julie Crest — Head of Field Sales (UK&I)</div>
          <div className="card-desc">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Care‑abouts</div>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>• Territory performance</li>
              <li>• KAM productivity</li>
              <li>• Consistent execution</li>
              <li>• Wins this quarter</li>
            </ul>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Angle</div>
            <div>“KAMs get instant call prep + NBAs today, proven by similar‑store wins. You get a clear view of execution and OOS risk.”</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Abby Dellow — Global Commercial Execution</div>
          <div className="card-desc">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Care‑abouts</div>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>• Process adoption</li>
              <li>• Coaching at scale</li>
              <li>• Measurable action → sales</li>
            </ul>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Angle</div>
            <div>“Standardises call prep, captures coaching signals, shows action→sales lift without ripping Exceedra, SAP, or Power BI.”</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Hana Nendl — Global (Change & Scale)</div>
          <div className="card-desc">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Care‑abouts</div>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              <li>• Low‑friction integration</li>
              <li>• Data security</li>
              <li>• Cross‑market rollout</li>
            </ul>
            <div style={{ fontWeight: 700, marginTop: 8 }}>Angle</div>
            <div>“Read‑only overlay with SSO; Azure + Teams friendly; markets can adopt with their own system mix.”</div>
          </div>
        </div>
      </div>
    </div>
  )
}

