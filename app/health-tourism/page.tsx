"use client";
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
      
      <div style={{ marginBottom: "40px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "32px", padding: "40px", color: "#fff", display: "flex", flexDirection: "column", gap: "24px", position: "relative", overflow: "hidden" }}>
        <AirplaneTilt size={200} weight="duotone" color="#fff" style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.05 }} />
        <GlobeHemisphereWest size={150} weight="duotone" color="#fff" style={{ position: "absolute", left: "-20px", bottom: "-20px", opacity: 0.05 }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#e2e8f0", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "100px", display: "inline-block", marginBottom: "12px" }}>
            Premium Concierge
          </span>
          <h1 style={{ fontSize: "36px", margin: "0 0 12px", fontWeight: 700, letterSpacing: "-0.5px" }}>Sağlık Turizmi</h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#cbd5e1", maxWidth: "600px", lineHeight: "1.6" }}>
            Türkiye'nin önde gelen sağlık kuruluşları, onaylı acenteler, VIP transfer ve konaklama seçenekleriyle tedavinizi bir seyahat deneyimine dönüştürün.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "250px", position: "relative", display: "flex", alignItems: "center" }}>
            <MagnifyingGlass size={20} color="#94a3b8" style={{ position: "absolute", left: "16px" }} />
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              onKeyDown={e=>{if(e.key==='Enter')load()}} 
              placeholder="Tedavi, şehir, acente veya kategori ara..."
              style={{ width: "100%", padding: "16px 16px 16px 44px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: "15px" }}
            />
          </div>
          <button onClick={load} style={{ padding: "0 28px", background: "#f8fafc", color: "#0f172a", borderRadius: "16px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center" }}>Ara</button>
        </div>
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
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "12px", borderRadius: "16px" }}><Suitcase size={24} weight="duotone" /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>Doğrulanmış Acenteler</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Koordinasyon ve seyahat hizmetleri sağlayan yetkili kurumlar.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
          {agencies.map(a => (
            <div key={a.id} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
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