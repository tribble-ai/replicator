export default function Slide6_ROI() {
  return (
    <div className="slide compact">
      <div className="badge">
        <span>💹</span>
        <span>ROI</span>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>ROI — Retail Execution & KAM Productivity</h2>

      {/* Headline KPIs */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div className="chip">Payback &lt; 6 weeks (pilot) · ~3 months (Year‑1)</div>
        <div className="chip">Year‑1 ROI ≈ 3.0× (≈ +£2.0m net on £660k cost)</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(11,18,32,0.55)', marginBottom: '8px' }}>
        Assumptions: fully‑loaded wage rates, £340/day per flagged SKU/store, matched‑store controls.
      </div>

      {/* Value drivers */}
      <div className="card" style={{ padding: '16px', marginBottom: '10px' }}>
        <div className="card-title">How We Create Value</div>
        <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px', marginTop: '6px' }}>
          <li>• Time saved (Field)</li>
          <li>• Time saved (KAM)</li>
          <li>• Fewer OOS days</li>
          <li>• Promo / placement lift</li>
          <li>• Reporting automation</li>
        </ul>
      </div>

      {/* Economics summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">Pilot (8 weeks)</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '6px' }}>
            <li>Value: ~£164k</li>
            <li>Fee: £120k (100% credit on convert)</li>
            <li>ROI: +36% · Payback: ~5.9 weeks</li>
          </ul>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">Year‑1 (Core UK)</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '6px' }}>
            <li>Total value: ≈ £2.62m</li>
            <li>Cost: £660k (sub + onboarding)</li>
            <li>ROI: ~3.0× · Payback: ~3 months</li>
          </ul>
        </div>
      </div>

      {/* Sensitivity & proof */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">Sensitivity</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '6px' }}>
            <li>OOS % +5pp → ~£294k/yr</li>
            <li>+100 field users → ~£400k/yr</li>
            <li>+1 min/visit (600 users) → ~£300k/yr</li>
          </ul>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-title">Proof & Measurement</div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '6px' }}>
            <li>Baseline: 4–8 weeks</li>
            <li>During pilot: daily capture</li>
            <li>Matched‑store control + scorecard</li>
          </ul>
        </div>
      </div>

      {/* Fine print */}
      <div style={{ fontSize: '12px', color: 'rgba(11,18,32,0.55)', marginTop: '8px', textAlign: 'center' }}>
        Figures are conservative and auditable; OOS → revenue uses £340/day per flagged SKU/store; wage rates are fully‑loaded. Pilot fee 100% credited on conversion.
      </div>
    </div>
  )
}
