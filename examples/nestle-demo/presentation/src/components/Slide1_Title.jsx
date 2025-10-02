export default function Slide1_Title() {
  return (
    <div className="slide" style={{ textAlign: 'center' }}>
      <div className="badge">
        <span>🚀</span>
        <span>Tribble Platform for Nestlé</span>
      </div>

      <h1 style={{ fontSize: '96px', marginBottom: '32px' }}>
        Intelligence Where<br />Your Teams Work
      </h1>

      <p style={{ fontSize: '28px', maxWidth: '900px', margin: '0 auto', lineHeight: '1.5' }}>
        AI-powered field sales intelligence that integrates your existing systems—<br />
        <span className="highlight">Exceedra, SAP, Power BI, ICP, DEX</span>—into one unified experience
      </p>

      <div style={{ marginTop: '80px', display: 'flex', gap: '60px', justifyContent: 'center', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>FOR</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>Nestlé UK Field Sales</div>
        </div>
        <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>PRESENTED BY</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>Tribble</div>
        </div>
        <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.1)' }} />
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>DATE</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
  )
}
