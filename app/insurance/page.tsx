"use client";
import SectionVisual from "@/components/section-visual";
import { useEffect, useState } from "react";
import { ShieldCheck, Umbrella, PhoneCall, Globe, CaretRight, CheckCircle } from "@phosphor-icons/react";

type R={id:string;name:string;description?:string;website?:string;phone?:string};

export default function Page() {
  const [rows, setRows] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insurance')
      .then(r => r.json())
      .then(x => setRows(Array.isArray(x) ? x : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="insurance" alt="Sigortalarım" />
      
      <div style={{ marginBottom: "40px", display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <span className="kicker" style={{ color: "#059669" }}>Anlaşmalı Kurumlar</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Sigorta Ağları</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", lineHeight: "1.5" }}>
            Platformumuzdaki onaylı sigorta şirketleri. Randevu alırken poliçenizin geçerliliğini kurum ile teyit etmenizi öneririz.
          </p>
        </div>
        <div style={{ background: "#ecfdf5", padding: "16px 24px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid #d1fae5" }}>
          <Umbrella size={32} weight="duotone" color="#059669" />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#065f46" }}>Tam Kapsamlı</div>
            <div style={{ fontSize: "12px", color: "#047857" }}>%100 Doğrulanmış</div>
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {rows.map(r => (
          <div key={r.id} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "all 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }} className="hover-shadow">
            
            {/* Dekoratif Arka Plan İkonu */}
            <ShieldCheck size={120} weight="duotone" color="#f1f5f9" style={{ position: "absolute", right: "-20px", bottom: "-20px", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>{r.name}</h3>
                <CheckCircle size={24} weight="fill" color="#10b981" style={{ flexShrink: 0 }} />
              </div>
              
              <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5", flex: 1 }}>{r.description || 'Özel sağlık sigortası ve tamamlayıcı sağlık sigortası (TSS) anlaşmalı kurum.'}</p>
              
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                {r.phone && (
                  <a href={`tel:${r.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f8fafc", color: "#0f172a", padding: "12px", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "1px solid #cbd5e1" }}>
                    <PhoneCall size={18} /> Destek
                  </a>
                )}
                {r.website && (
                  <a href={r.website} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f8fafc", color: "#0f172a", padding: "12px", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "1px solid #cbd5e1" }}>
                    <Globe size={18} /> Site <CaretRight size={14} weight="bold" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
