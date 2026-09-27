const fs = require('fs');
let content = fs.readFileSync('app/health-tourism/page.tsx', 'utf8');

const targetStr = '<div style={{ marginBottom: "40px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"';
if(content.includes(targetStr)) {
  const p1 = content.split(targetStr);
  const p2 = p1[1].split('</form>\n      </div>');

  const newHero = `<div style={{ marginBottom: "48px", background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", borderRadius: "32px", padding: "48px", color: "#0f172a", display: "flex", flexDirection: "column", gap: "28px", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(14, 165, 233, 0.15)" }}>
        <AirplaneTilt size={300} weight="duotone" color="#0ea5e9" style={{ position: "absolute", right: "-40px", top: "-40px", opacity: 0.08, transform: "rotate(15deg)" }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0284c7", background: "#fff", padding: "6px 14px", borderRadius: "100px", marginBottom: "16px", boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.1)" }}>
            <GlobeHemisphereWest size={16} weight="bold" /> PREMIUM CONCIERGE
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: "1.1" }}>
            Sağlık Turizmi & <span style={{ color: "#0ea5e9" }}>VIP Tedavi</span>
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: "18px", color: "#475569", maxWidth: "600px", lineHeight: "1.5" }}>
            Türkiye'nin önde gelen sağlık kuruluşları, onaylı acenteler, VIP transfer ve konaklama seçenekleriyle tedavinizi birinci sınıf bir seyahat deneyimine dönüştürün.
          </p>
        </div>

        <form onSubmit={e=>{e.preventDefault();load()}} style={{ position: "relative", zIndex: 1, display: "flex", gap: "12px", maxWidth: "800px", marginTop: "12px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <MagnifyingGlass size={20} color="#64748b" style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              placeholder="Tedavi, şehir, klinik veya kategori ara..." 
              style={{ width: "100%", padding: "20px 20px 20px 52px", borderRadius: "20px", border: "2px solid #fff", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", color: "#0f172a", fontSize: "16px", outline: "none", transition: "all 0.2s", boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.1)" }}
              onFocus={(e) => e.target.style.borderColor = "#38bdf8"}
              onBlur={(e) => e.target.style.borderColor = "#fff"}
            />
          </div>
          <button type="submit" style={{ padding: "0 32px", borderRadius: "20px", border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer", boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.3)", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            Ara
          </button>
        </form>
      </div>`;

  content = p1[0] + newHero + p2[1];
  fs.writeFileSync('app/health-tourism/page.tsx', content, 'utf8');
  console.log('SUCCESS');
} else {
  console.log('Target string not found!');
}
