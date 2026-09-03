export default function Loading() {
  return (
    <div className="page" style={{ opacity: 0.7, pointerEvents: 'none', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div className="page-title">
        <span className="kicker" style={{ width: 80, height: 14, backgroundColor: '#e2e8f0', display: 'inline-block', borderRadius: 4 }}></span>
        <h1 style={{ width: 200, height: 32, backgroundColor: '#cbd5e1', marginTop: 8, borderRadius: 6 }}></h1>
        <p style={{ width: 150, height: 16, backgroundColor: '#f1f5f9', marginTop: 8, borderRadius: 4 }}></p>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <section className="panel" key={i} style={{ minHeight: 150 }}>
            <h2 style={{ width: 120, height: 20, backgroundColor: '#cbd5e1', borderRadius: 4 }}></h2>
            <div className="slot-list" style={{ marginTop: 16 }}>
              <div className="slot-row" style={{ height: 48, backgroundColor: '#f8fafc', borderRadius: 8 }}></div>
              <div className="slot-row" style={{ height: 48, backgroundColor: '#f8fafc', borderRadius: 8 }}></div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
