export default function Slide1_Title() {
  const isNestle = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('brand')?.toLowerCase() === 'nestle'
  return (
    <div className="slide" style={{ textAlign: 'center' }}>

      <div className="badge">
        <span>🚀</span>
        <span>Tribble Platform for Nestlé</span>
      </div>

      {/* intentionally minimal for light mode */}

      <h1 style={{ marginBottom: '16px' }}>
        Intelligence Where<br />Your Teams Already Work
      </h1>

      <p style={{ fontSize: '22px', maxWidth: '900px', margin: '0 auto', lineHeight: '1.5' }}>
        One simple workflow across <span className="highlight">Exceedra, SAP, Power BI</span> —
        built for field teams and leaders.
      </p>

      {isNestle && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <div className="cobrand" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 999 }}>
            <span className="muted" style={{ fontSize: 12, color: 'var(--text-muted)' }}>for</span>
            <img src="/nestle-hs.svg" alt="Nestlé Health Science" style={{ height: 14, opacity: 0.9 }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: '80px', display: 'flex', gap: '60px', justifyContent: 'center', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(11,18,32,0.55)', marginBottom: '8px' }}>FOR</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>Nestlé UK Field Sales</div>
        </div>
        <div style={{ width: '2px', height: '60px', background: '#e6eaf2' }} />
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(11,18,32,0.55)', marginBottom: '8px' }}>PRESENTED BY</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>Tribble</div>
        </div>
        <div style={{ width: '2px', height: '60px', background: '#e6eaf2' }} />
        <div>
          <div style={{ fontSize: '18px', color: 'rgba(11,18,32,0.55)', marginBottom: '8px' }}>DATE</div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
  )
}
