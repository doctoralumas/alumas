export default function Loading() {
  return (
    <div className="page" style={{ opacity: 0.7, pointerEvents: 'none', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div className="page-title">
        <span className="kicker" style={{ width: 80, height: 14, backgroundColor: '#e2e8f0', display: 'inline-block', borderRadius: 4 }}></span>
        <h1 style={{ width: 200, height: 32, backgroundColor: '#cbd5e1', marginTop: 8, borderRadius: 6 }}></h1>
        <p style={{ width: 300, height: 16, backgroundColor: '#f1f5f9', marginTop: 8, borderRadius: 4 }}></p>
      </div>

      <div className="health-circle-summary" style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 100, backgroundColor: '#1e3a5f', borderRadius: 12 }}></div>
        ))}
      </div>

      <div className="profile-columns health-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        {[1, 2].map(i => (
          <section className="panel" key={i}>
            <h2 style={{ width: 120, height: 20, backgroundColor: '#cbd5e1', borderRadius: 4, marginBottom: 16 }}></h2>
            <div className="slot-list">
              <div className="slot-row" style={{ height: 60, backgroundColor: '#f8fafc', borderRadius: 8 }}></div>
            </div>
          </section>
        ))}
      </div>

      {[1, 2].map(i => (
        <section className="panel health-section" key={i} style={{ marginTop: 24 }}>
          <h2 style={{ width: 150, height: 20, backgroundColor: '#cbd5e1', borderRadius: 4, marginBottom: 16 }}></h2>
          <div className="slot-list">
            <div className="slot-row" style={{ height: 60, backgroundColor: '#f8fafc', borderRadius: 8 }}></div>
          </div>
        </section>
      ))}
    </div>
  )
}
