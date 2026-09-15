'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import { ShieldCheck, Heartbeat, CaretRight, WarningCircle, Drop, IdentificationCard, User, Users, Envelope, Link as LinkIcon, DownloadSimple, Pill, Activity } from "@phosphor-icons/react";

export default function EmergencyHealthCard(){
  const [data,setData]=useState<any>(null);
  const [open,setOpen]=useState(false);
  const [loading, setLoading]=useState(true);
  const [copyMsg, setCopyMsg]=useState('');

  const load=()=>fetch('/api/health-card').then(r=>r.ok?r.json():null).then(setData).finally(()=>setLoading(false));
  useEffect(()=>{load()},[]);

  async function toggle(){
    await fetch('/api/health-card',{method:'POST'});
    load();
  }

  const copyLink = () => {
    if(data?.shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareToken}`);
      setCopyMsg("Bağlantı Kopyalandı!");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  if(!data && loading) return (
    <div style={{ padding: "64px", textAlign: "center", color: "#64748b" }}>
      <ShieldCheck size={48} weight="duotone" className="spin-slow" style={{ marginBottom: "16px", opacity: 0.5 }} />
      <div style={{ fontSize: "16px" }}>Acil durum kartınız yükleniyor...</div>
    </div>
  );
  if(!data) return <div style={{ padding: "64px", textAlign: "center", color: "#ef4444" }}>Veriler yüklenemedi.</div>;

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "24px" }}>
            <ShieldCheck size={32} weight="duotone" color="#ef4444" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#ef4444" }}>Acil Durum & Paylaşım</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Sağlık Kartım</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Kritik tıbbi bilgilerinizi acil durumlarda sağlık profesyonelleriyle paylaşın.</p>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
        
        {/* Apple Medical ID Style Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "16px", border: "4px solid #fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <User size={48} weight="fill" />
          </div>
          <h2 style={{ margin: "0 0 4px", fontSize: "28px", color: "#0f172a" }}>{data.user.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748b", fontSize: "15px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Envelope size={16} /> {data.user.email}</span>
          </div>
        </div>

        {/* Basic Stats / Demographics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "24px 0" }}>
          <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
            <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: "4px" }}>Kan Grubu</span>
            <strong style={{ fontSize: "24px", color: "#ef4444" }}>{data.bloodType || '--'}</strong>
          </div>
          <div style={{ textAlign: "center", borderRight: "1px solid #f1f5f9" }}>
            <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: "4px" }}>Boy</span>
            <strong style={{ fontSize: "24px", color: "#0f172a" }}>{data.height ? `${data.height} cm` : '--'}</strong>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: "4px" }}>Kilo</span>
            <strong style={{ fontSize: "24px", color: "#0f172a" }}>{data.weight ? `${data.weight} kg` : '--'}</strong>
          </div>
        </div>

        {/* Critical Information Lists */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <WarningCircle size={20} color="#ef4444" /> Alerjiler & Reaksiyonlar
            </h3>
            {data.allergies.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.allergies.map((a:any) => (
                  <div key={a.id} style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fee2e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: "#991b1b", fontSize: "15px" }}>{a.allergen}</b>
                    <span style={{ fontSize: "13px", color: "#dc2626" }}>{a.reaction || 'Belirtilmedi'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", color: "#64748b", fontSize: "14px" }}>Bilinen alerji yok.</div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} color="#3b82f6" /> Tıbbi Durumlar
            </h3>
            {data.conditions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.conditions.map((c:any) => (
                  <div key={c.id} style={{ padding: "12px 16px", background: "#eff6ff", borderRadius: "12px", border: "1px solid #dbeafe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: "#1e40af", fontSize: "15px" }}>{c.name}</b>
                    {c.notes && <span style={{ fontSize: "13px", color: "#2563eb" }}>{c.notes}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", color: "#64748b", fontSize: "14px" }}>Kayıtlı tıbbi durum yok.</div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Pill size={20} color="#10b981" /> Düzenli İlaçlar
            </h3>
            {data.medications.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.medications.map((m:any) => (
                  <div key={m.id} style={{ padding: "12px 16px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: "#065f46", fontSize: "15px" }}>{m.name}</b>
                    <span style={{ fontSize: "13px", color: "#059669" }}>{m.dose}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px", color: "#64748b", fontSize: "14px" }}>Düzenli kullanılan ilaç yok.</div>
            )}
          </div>
          
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Paylaşım Yönetimi */}
        <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={24} weight="duotone" color="#4f46e5" /> Güvenli Paylaşım
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "400px" }}>Sağlık kartınızı doktorunuzla veya acil durum ekipleriyle bir bağlantı aracılığıyla anında paylaşın.</p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: data.isShared ? "#16a34a" : "#64748b" }}>{data.isShared ? "Paylaşıma Açık" : "Paylaşıma Kapalı"}</span>
              <button 
                onClick={toggle}
                style={{ width: "52px", height: "28px", borderRadius: "100px", background: data.isShared ? "#16a34a" : "#cbd5e1", border: "none", position: "relative", cursor: "pointer", transition: "background 0.3s" }}
              >
                <div style={{ width: "24px", height: "24px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: data.isShared ? "26px" : "2px", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
          </div>

          {data.isShared && data.shareToken && (
            <div style={{ marginTop: "24px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ fontSize: "14px", color: "#334155", wordBreak: "break-all" }}>
                {window.location.origin}/share/{data.shareToken}
              </div>
              <button onClick={copyLink} style={{ padding: "10px 16px", background: "#4f46e5", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }} className="hover-shadow">
                {copyMsg || <><LinkIcon size={16} /> Kopyala</>}
              </button>
            </div>
          )}
        </div>

        {/* Güncelleme Yönlendirmeleri */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <Link href="/health/medical-history" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", textDecoration: "none", color: "#0f172a", fontWeight: 600, transition: "background 0.2s" }} className="hover-bg-slate-100">
            Tıbbi Durumları Güncelle <CaretRight size={16} color="#64748b" />
          </Link>
          <Link href="/health/allergies" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", textDecoration: "none", color: "#0f172a", fontWeight: 600, transition: "background 0.2s" }} className="hover-bg-slate-100">
            Alerjileri Güncelle <CaretRight size={16} color="#64748b" />
          </Link>
          <Link href="/health/medications" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", textDecoration: "none", color: "#0f172a", fontWeight: 600, transition: "background 0.2s" }} className="hover-bg-slate-100">
            İlaçları Güncelle <CaretRight size={16} color="#64748b" />
          </Link>
        </div>

      </div>

    </div>
  )
}
