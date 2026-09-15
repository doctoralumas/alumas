"use client";
import {useEffect,useState} from 'react';
import SectionVisual from "@/components/section-visual";
import { Ticket, CalendarBlank, CaretRight, Buildings, Info, Tag } from "@phosphor-icons/react";
import Link from 'next/link';

export default function Page(){
  const [rows,setRows]=useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetch('/api/campaigns')
      .then(r=>r.json())
      .then(setRows)
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="campaigns" alt="Kampanyalar" />
      
      <div style={{ marginBottom: "40px", display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <span className="kicker" style={{ color: "#db2777" }}>Fırsatları Keşfet</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>Kampanyalar & Paketler</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", lineHeight: "1.5" }}>
            Doğrulanmış sağlık kurumlarının güncel duyuruları ve avantajlı sağlık paketleri.
          </p>
        </div>
        <div style={{ background: "#fdf2f8", padding: "16px", borderRadius: "20px", border: "1px solid #fbcfe8", color: "#db2777", display: "flex", alignItems: "center", gap: "12px" }}>
          <Ticket size={32} weight="duotone" />
        </div>
      </div>

      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", marginBottom: "32px", display: "flex", alignItems: "flex-start", gap: "12px", border: "1px solid #e2e8f0" }}>
        <Info size={20} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>Tıbbi deontoloji kuralları gereği sağlık hizmetlerinde doğrudan indirim veya promosyon yapılamaz. Listelenen içerikler, kurumların sunduğu <b>Check-up, Beslenme Danışmanlığı, Güzellik ve Bakım Paketleri</b> gibi farkındalık ve ek hizmet duyurularını kapsar.</p>
      </div>

      {loading && <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Kampanyalar yükleniyor...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "48px" }}>
        {rows.map(c => (
          <div key={c.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", display: "flex", overflow: "hidden", position: "relative", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }} className="ticket-card">
            
            {/* Sol Renkli Kısım */}
            <div style={{ width: "12px", background: "linear-gradient(to bottom, #db2777, #f472b6)", flexShrink: 0 }}></div>
            
            <div style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ background: "#fef2f2", color: "#ef4444", padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}><Tag size={14} weight="bold" /> KAMPANYA</span>
                {c.organization && (
                  <Link href={`/organizations/${c.organization.slug}`} style={{ color: "#64748b", fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Buildings size={16} /> {c.organization.name}
                  </Link>
                )}
              </div>
              
              <h2 style={{ margin: 0, fontSize: "24px", color: "#0f172a", fontWeight: 700, lineHeight: "1.3" }}>{c.title}</h2>
              
              <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6", maxWidth: "800px" }}>
                {c.description || 'Detaylar ve randevu için doğrudan kurumla iletişime geçebilirsiniz.'}
              </p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "16px", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px", fontWeight: 500, background: "#f8fafc", padding: "8px 16px", borderRadius: "12px" }}>
                  <CalendarBlank size={16} /> 
                  <span>
                    {c.startsAt ? new Date(c.startsAt).toLocaleDateString('tr-TR') : 'Hemen Geçerli'}
                    {c.endsAt ? ` - ${new Date(c.endsAt).toLocaleDateString('tr-TR')} Tarihine Kadar` : ' (Süresiz)'}
                  </span>
                </div>
                
                {c.organization && (
                  <Link href={`/organizations/${c.organization.slug}`} style={{ background: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    Kurumu İncele <CaretRight size={16} weight="bold" />
                  </Link>
                )}
              </div>
            </div>
            
            {/* Bilet Kesik Çizgisi ve Dekorasyon */}
            <div style={{ width: "32px", borderLeft: "2px dashed #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: "-16px", left: "-16px", width: "32px", height: "32px", borderRadius: "50%", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}></div>
              <div style={{ position: "absolute", bottom: "-16px", left: "-16px", width: "32px", height: "32px", borderRadius: "50%", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}></div>
            </div>
          </div>
        ))}
        
        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1" }}>
            <Ticket size={48} weight="duotone" style={{ marginBottom: "16px", opacity: 0.5 }} />
            <div style={{ fontSize: "16px", fontWeight: 500 }}>Şu anda aktif bir kampanya bulunmuyor.</div>
          </div>
        )}
      </div>
    </div>
  )
}