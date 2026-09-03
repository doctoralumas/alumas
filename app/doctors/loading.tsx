import SectionVisual from "@/components/section-visual";

export default function Loading() {
  return (
    <div className="page" style={{ opacity: 0.7, pointerEvents: 'none', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <SectionVisual slug="doctors" alt="Yükleniyor" />
      <div className="page-title">
        <span className="kicker" style={{ width: 80, height: 14, backgroundColor: '#e2e8f0', display: 'inline-block', borderRadius: 4 }}></span>
        <h1 style={{ width: 250, height: 32, backgroundColor: '#cbd5e1', marginTop: 8, borderRadius: 6 }}></h1>
        <p style={{ width: 200, height: 16, backgroundColor: '#f1f5f9', marginTop: 8, borderRadius: 4 }}></p>
      </div>
      
      <div className="doctor-list" style={{ marginTop: 24, display: 'grid', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div className="doctor-card" key={i} style={{ display: 'flex', gap: 16, padding: 16, border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <div className="avatar" style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#cbd5e1' }}></div>
            <div className="doctor-copy" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <div style={{ width: 140, height: 20, backgroundColor: '#cbd5e1', borderRadius: 4 }}></div>
              <div style={{ width: 100, height: 14, backgroundColor: '#e2e8f0', borderRadius: 4 }}></div>
              <div className="meta" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ width: 60, height: 12, backgroundColor: '#f1f5f9', borderRadius: 4 }}></span>
                <span style={{ width: 60, height: 12, backgroundColor: '#f1f5f9', borderRadius: 4 }}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
