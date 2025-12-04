export default function Exec6_ROI() {
  return (
    <div className="slide compact">
      <div className="badge"><span>💹</span><span>ROI</span></div>
      <h2>ROI (conservative, auditable)</h2>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <div className="chip">Pilot: ~£164k value on £120k fee (credited on convert)</div>
        <div className="chip">Year‑1 (Core UK): ~3.0× ROI; ~3‑month payback</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(11,18,32,0.55)', marginBottom: 8 }}>
        Assumptions: fully‑loaded wage rates, £340/day per flagged SKU/store, matched‑store controls.
      </div>
      <div className="card">
        <div className="card-title">Levers</div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
          <li>• Time saved</li>
          <li>• OOS days ↓</li>
          <li>• Promo/placement lift</li>
          <li>• Reporting automation</li>
        </ul>
      </div>
    </div>
  )
}

