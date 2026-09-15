"use client";
import SectionVisual from "@/components/section-visual";
import {useEffect,useState} from "react";
import { PhoneCall, IdentificationCard, AddressBook, Crosshair, Ambulance, ShieldPlus, CaretRight, NavigationArrow, Info } from "@phosphor-icons/react";
import Link from "next/link";

type R={id:string;kind:string;name:string;phone?:string;city?:string;district?:string;note?:string;distanceKm?:number;is24Hours?:boolean;description?:string};

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [providers,setProviders]=useState<R[]>([]);
  const [locMsg,setLocMsg]=useState("");
  const [loading, setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      fetch('/api/emergency').then(r=>r.json()),
      fetch('/api/emergency/providers').then(r=>r.json())
    ]).then(([x, y]) => {
      setRows(Array.isArray(x) ? x : []);
      setProviders(Array.isArray(y) ? y : []);
    }).finally(() => setLoading(false));
  },[]);

  function nearby(){
    if(!navigator.geolocation){
      setLocMsg("Konum desteklenmiyor");
      return;
    }
    setLocMsg("Konum alınıyor...");
    navigator.geolocation.getCurrentPosition(p=>{
      fetch(`/api/emergency/providers?lat=${p.coords.latitude}&lng=${p.coords.longitude}`)
        .then(r=>r.json())
        .then(x=>{
          setProviders(x);
          setLocMsg("Yakından uzağa sıralandı");
        });
    },()=>setLocMsg("Konum izni verilmedi"));
  }

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="emergency" alt="Acil 112" />
      
      <div style={{ marginBottom: "32px" }}>
        <span className="kicker" style={{ color: "#dc2626" }}>Acil Erişim</span>
        <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Acil Yardım</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
          Hayati tehlike arz eden tüm acil durumlarda öncelikli olarak 112'yi arayın. Alumas bir acil çağrı merkezi değildir.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        
        {/* SOS Button */}
        <a href="tel:112" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", borderRadius: "32px", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "#fff", boxShadow: "0 20px 25px -5px rgba(239, 68, 68, 0.4)", transition: "transform 0.2s" }} className="hover-shadow">
          <PhoneCall size={64} weight="duotone" style={{ marginBottom: "16px", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "2px", opacity: 0.9 }}>ACİL ARAMA</span>
          <strong style={{ fontSize: "64px", lineHeight: 1, letterSpacing: "-2px" }}>112</strong>
        </a>

        {/* Health Card & Directory */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "12px", borderRadius: "16px" }}><IdentificationCard size={28} weight="duotone" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Acil Sağlık Kartı</h2>
            </div>
            <p style={{ color: "#475569", marginBottom: "24px", fontSize: "15px", lineHeight: "1.5" }}>Kritik sağlık bilgilerinizi, alerjilerinizi ve kan grubunuzu acil durumlarda ilk yardım ekipleriyle anında paylaşın.</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/health-card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#0f172a", color: "#fff", padding: "14px 20px", borderRadius: "16px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                Kartı Aç <CaretRight size={16} weight="bold" />
              </Link>
              <Link href="/phone-directory" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", padding: "14px 20px", borderRadius: "16px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                <AddressBook size={20} /> Rehber
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", marginBottom: "48px" }}>
        
        {/* Özel Ambulans ve Danışmanlık */}
        <section style={{ background: "#fff", borderRadius: "32px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ background: "#fee2e2", color: "#ef4444", padding: "8px", borderRadius: "12px" }}><Ambulance size={20} weight="duotone" /></div>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Özel Ambulans & Transfer</h2>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Doğrulanmış özel ambulans firmaları.</p>
              </div>
              <button onClick={nearby} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#0f172a" }}>
                <Crosshair size={16} /> Yakınımdakiler
              </button>
            </div>
            {locMsg && <div style={{ marginTop: "12px", fontSize: "13px", color: "#0284c7", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}><Info size={16}/>{locMsg}</div>}
          </div>
          
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {providers.map(r => (
              <div key={r.id} style={{ background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>{r.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                    <span style={{ fontWeight: 600, color: "#475569" }}>{r.kind}</span>
                    {r.is24Hours && <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "100px", fontWeight: 700 }}>7/24</span>}
                    {r.city && <span><NavigationArrow size={12} style={{verticalAlign:"middle"}}/> {r.city}</span>}
                    {r.distanceKm != null && <span style={{ color: "#ef4444", fontWeight: 600 }}>{r.distanceKm.toFixed(1)} km</span>}
                  </div>
                  {r.description && <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>{r.description}</p>}
                </div>
                {r.phone && (
                  <a href={`tel:${r.phone}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", background: "#ef4444", color: "#fff", borderRadius: "16px", textDecoration: "none" }}>
                    <PhoneCall size={24} weight="fill" />
                  </a>
                )}
              </div>
            ))}
            {!providers.length && !loading && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>Yakınınızda ambulans hizmeti bulunamadı.</div>
            )}
          </div>
        </section>

        {/* Acil Sağlık Rehberi (Hastaneler vs) */}
        <section style={{ background: "#fff", borderRadius: "32px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ background: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "12px" }}><ShieldPlus size={20} weight="duotone" /></div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Acil Destek Rehberi</h2>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Bölgenizdeki nöbetçi eczaneler ve hastane acil servisleri.</p>
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: "#f8fafc", padding: "16px", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>{r.name}</h3>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    {r.kind} {r.city ? `• ${r.city}` : ''} {r.district ? `/ ${r.district}` : ''}
                  </div>
                </div>
                {r.phone && (
                  <a href={`tel:${r.phone}`} style={{ padding: "10px 16px", background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <PhoneCall size={16} /> Ara
                  </a>
                )}
              </div>
            ))}
            {!rows.length && !loading && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>Yerel rehber kaydı bulunamadı.</div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}