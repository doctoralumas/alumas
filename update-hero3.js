const fs = require('fs');

const fullCode = `"use client";
import SectionVisual from "@/components/section-visual";
import {useEffect,useState} from "react";
import { MagnifyingGlass, AirplaneTilt, Suitcase, GlobeHemisphereWest, Buildings, ShieldCheck, Translate, CarProfile, CaretRight, PhoneCall, Link as LinkIcon, Star, Bed, Handshake } from "@phosphor-icons/react";
import Link from "next/link";

export default function Page(){
  const [rows,setRows]=useState<any[]>([]);
  const [agencies,setAgencies]=useState<any[]>([]);
  const [q,setQ]=useState('');
  const [loading,setLoading]=useState(true);

  const load=async ()=>{
    setLoading(true);
    fetch('/api/health-tourism?q='+encodeURIComponent(q))
      .then(r=>r.json())
      .then(x=>setRows(Array.isArray(x)?x:[]))
      .finally(()=>setLoading(false));
  };
  
  useEffect(()=>{
    load();
    fetch('/api/health-tourism/agencies').then(r=>r.json()).then(x=>setAgencies(Array.isArray(x)?x:[]));
  },[]);

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="health-tourism" alt="Sağlık Turizmi" />
      
      <div style={{ marginBottom: "48px", background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", borderRadius: "32px", padding: "48px", color: "#0f172a", display: "flex", flexDirection: "column", gap: "28px", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -15px rgba(14, 165, 233, 0.15)" }}>
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
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "48px", overflowX: "auto", paddingBottom: "8px" }}>
        <Link href="/nearby?category=hotel" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "12px 20px", borderRadius: "16px", border: "1px solid #cbd5e1", textDecoration: "none", color: "#0f172a", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
          <Bed size={20} weight="duotone" /> Yakındaki Oteller
        </Link>
        <Link href="/organizations" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "12px 20px", borderRadius: "16px", border: "1px solid #cbd5e1", textDecoration: "none", color: "#0f172a", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
          <Buildings size={20} weight="duotone" /> Sağlık Kurumları
        </Link>
      </div>

      {/* Acenteler Section */}
      <div style={{ marginBottom: "64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "12px", borderRadius: "16px" }}><Suitcase size={24} weight="duotone" /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>Doğrulanmış Acenteler</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Koordinasyon ve seyahat hizmetleri sağlayan yetkili kurumlar.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "16px", snapType: "x mandatory" }}>
          {agencies.map(a => (
            <div key={a.id} style={{ minWidth: "350px", background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", snapAlign: "start", transition: "all 0.2s" }} className="hover-shadow">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>{a.name}</h3>
                {a.isVerified && <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 700, padding: "4px 8px", background: "#ecfdf5", color: "#059669", borderRadius: "100px" }}><ShieldCheck size={14} weight="fill"/> Doğrulanmış</span>}
              </div>
              
              <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{a.description}</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "100px", border: "1px solid #e2e8f0" }}>
                  <Buildings size={14} /> {a.city || 'Belirtilmemiş'}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", background: "#f8fafc", padding: "6px 12px", borderRadius: "100px", border: "1px solid #e2e8f0" }}>
                  <Translate size={14} /> {(a.languages||[]).join(', ')}
                </span>
              </div>

              {a.services?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                  {a.services.map((s:any) => (
                    <span key={s.id} style={{ fontSize: "12px", fontWeight: 600, color: "#4f46e5", background: "#e0e7ff", padding: "4px 10px", borderRadius: "8px" }}>
                      {s.title}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "auto", paddingTop: "16px", borderTop: "1px dashed #e2e8f0" }}>
                {a.phone && (
                  <a href={`tel:${a.phone}`} style={{ flex: 1, padding: "10px", background: "#0f172a", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <PhoneCall size={16} /> Ara
                  </a>
                )}
                {a.website && (
                  <a href={a.website} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <LinkIcon size={16} /> Web
                  </a>
                )}
                <Link href={`/agencies/${a.id}`} style={{ flex: 1, padding: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <CaretRight size={16} /> İncele
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paketler Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#fef3c7", color: "#d97706", padding: "12px", borderRadius: "16px" }}><Star size={24} weight="duotone" /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>Tedavi & Seyahat Paketleri</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Her şey dahil organizasyonlar ve özel medikal paketler.</p>
          </div>
        </div>

        {loading && <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>}
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "24px" }}>
          {rows.map(r => (
            <div key={r.id} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", transition: "all 0.2s" }} className="hover-shadow">
              <span style={{ alignSelf: "flex-start", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#d97706", background: "#fef3c7", padding: "4px 10px", borderRadius: "100px" }}>
                {r.category}
              </span>
              
              <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 700, lineHeight: "1.3" }}>{r.title}</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#475569", fontWeight: 500 }}>
                  <Buildings size={16} /> {r.providerName} • {r.city}
                </div>
                {r.agency && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#059669", fontWeight: 500 }}>
                    <Handshake size={16} /> Koord: {r.agency.name} {r.agency.isVerified && <ShieldCheck size={14} weight="fill" />}
                  </div>
                )}
              </div>

              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>{r.description}</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {r.includes.map((x:string) => (
                  <span key={x} style={{ fontSize: "12px", fontWeight: 600, color: "#334155", background: "#f1f5f9", padding: "6px 12px", borderRadius: "100px" }}>{x}</span>
                ))}
                {r.transferIncluded && <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7", background: "#e0f2fe", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "4px" }}><CarProfile size={14} /> Transfer</span>}
                {r.accommodationIncluded && <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7", background: "#e0f2fe", padding: "6px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "4px" }}><Bed size={14} /> Konaklama</span>}
              </div>

              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569" }}>
                {r.transferNotes && <div><b style={{ color: "#0f172a" }}>Transfer:</b> {r.transferNotes}</div>}
                {r.accommodationNotes && <div><b style={{ color: "#0f172a" }}>Konaklama:</b> {r.accommodationNotes}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Translate size={14} /> <b>Diller:</b> {r.languages.join(', ') || 'Belirtilmemiş'}</div>
              </div>

              {r.startingPrice && (
                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "16px", marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>Başlangıç Fiyatı</span>
                  <strong style={{ fontSize: "20px", color: "#0f172a" }}>{r.startingPrice} {r.currency}</strong>
                </div>
              )}
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "64px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "24px" }}>
              Arama kriterlerine uygun paket bulunamadı.
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
`;
fs.writeFileSync('app/health-tourism/page.tsx', fullCode, 'utf8');
console.log('REWRITTEN');
