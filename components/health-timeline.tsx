'use client';
import {useEffect,useState} from 'react';
import { ClockCounterClockwise, CalendarBlank, MagnifyingGlass, FirstAid, User, Heartbeat, Pill, Images, Syringe, FolderUser, Flask } from "@phosphor-icons/react";

export default function HealthTimeline(){
  const [items,setItems]=useState<any[]>([]);
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const [loading, setLoading]=useState(true);

  const load=()=>{
    setLoading(true);
    const q=new URLSearchParams();
    if(from)q.set('from',from);
    if(to)q.set('to',to);
    fetch('/api/health/timeline?'+q).then(r=>r.ok?r.json():[]).then(setItems).finally(()=>setLoading(false));
  };
  useEffect(()=>{load()},[]);

  const getTimelineIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'randevu': return <User size={20} weight="fill" color="#3b82f6" />;
      case 'laboratuvar': return <Flask size={20} weight="fill" color="#8b5cf6" />;
      case 'görüntüleme': return <Images size={20} weight="fill" color="#f59e0b" />;
      case 'tetkik isteği': return <FirstAid size={20} weight="fill" color="#ef4444" />;
      case 'aşı': return <Syringe size={20} weight="fill" color="#10b981" />;
      case 'ilaç': return <Pill size={20} weight="fill" color="#db2777" />;
      case 'tıbbi geçmiş': return <FolderUser size={20} weight="fill" color="#64748b" />;
      default: return <Heartbeat size={20} weight="fill" color="#0ea5e9" />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'randevu': return { bg: '#eff6ff', text: '#2563eb' };
      case 'laboratuvar': return { bg: '#f5f3ff', text: '#7c3aed' };
      case 'görüntüleme': return { bg: '#fffbeb', text: '#d97706' };
      case 'tetkik isteği': return { bg: '#fef2f2', text: '#dc2626' };
      case 'aşı': return { bg: '#ecfdf5', text: '#059669' };
      case 'ilaç': return { bg: '#fdf2f8', text: '#db2777' };
      case 'tıbbi geçmiş': return { bg: '#f8fafc', text: '#475569' };
      default: return { bg: '#f0f9ff', text: '#0284c7' };
    }
  };

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: "24px" }}>
            <ClockCounterClockwise size={32} weight="duotone" color="#475569" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#475569" }}>Geçmiş Arşiv</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Sağlık Zaman Tüneli</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Tüm sağlık hareketleriniz kronolojik olarak tek ekranda.</p>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "40px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Başlangıç Tarihi</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", outline: "none", fontSize: "15px" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Bitiş Tarihi</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", outline: "none", fontSize: "15px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={load} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", height: "46px" }}>
            <MagnifyingGlass size={18} weight="bold" /> Filtrele
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Zaman tüneli oluşturuluyor...</div>}

      <div style={{ position: "relative", paddingLeft: "32px", paddingBottom: "48px" }}>
        
        {/* Dikey Çizgi */}
        {items.length > 0 && <div style={{ position: "absolute", left: "15px", top: "12px", bottom: 0, width: "2px", background: "#e2e8f0", zIndex: 0 }}></div>}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {items.map((x, i) => {
            const colors = getTimelineColor(x.type);
            return (
              <article key={i} style={{ position: "relative", zIndex: 1 }}>
                
                {/* İkon / Nokta */}
                <div style={{ position: "absolute", left: "-32px", top: "0px", width: "32px", height: "32px", borderRadius: "50%", background: "#fff", border: `2px solid ${colors.text}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, transform: "translateX(-50%)" }}>
                  <div style={{ transform: "scale(0.7)" }}>{getTimelineIcon(x.type)}</div>
                </div>

                {/* İçerik Kartı */}
                <div style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", marginLeft: "16px", transition: "transform 0.2s" }} className="hover-shadow">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", background: colors.bg, color: colors.text, padding: "4px 10px", borderRadius: "100px" }}>
                      {x.type}
                    </span>
                    <time style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CalendarBlank size={16} /> {new Date(x.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                  </div>
                  
                  <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>{x.title}</h3>
                  <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>{x.detail}</p>
                </div>
                
              </article>
            )
          })}
        </div>

        {!loading && items.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1", marginLeft: "16px" }}>
            <ClockCounterClockwise size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>Bu tarih aralığında sağlık hareketiniz bulunmuyor.</div>
          </div>
        )}
      </div>

    </div>
  )
}
