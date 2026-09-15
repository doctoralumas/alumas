'use client';
import {useEffect,useState} from 'react';
import { ShieldCheck, Heartbeat, CaretRight, WarningCircle, Drop, IdentificationCard, User, Users, Envelope, Link as LinkIcon, DownloadSimple, Pill, FirstAid, PhoneCall } from "@phosphor-icons/react";

export default function EmergencyHealthCard(){
  const [data,setData]=useState<any>(null);
  const [loading, setLoading]=useState(true);
  const [msg, setMsg]=useState('');
  const [copyMsg, setCopyMsg]=useState('');

  const load=()=>fetch('/api/health/emergency-card').then(r=>r.ok?r.json():null).then(setData).finally(()=>setLoading(false));
  useEffect(()=>{load()},[]);

  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMsg('Kaydediliyor...');
    const f=new FormData(e.currentTarget);
    const body={
      bloodType:f.get('bloodType'),
      allergies:f.get('allergies'),
      chronicConditions:f.get('chronicConditions'),
      medicationsSummary:f.get('medicationsSummary'),
      emergencyContactName:f.get('emergencyContactName'),
      emergencyContactPhone:f.get('emergencyContactPhone'),
      notes:f.get('notes'),
      sharingEnabled:f.get('sharingEnabled')==='on'
    };
    const r=await fetch('/api/health/emergency-card',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    setData(j);
    setMsg(r.ok?'Sağlık kartınız başarıyla güncellendi.':'Kaydedilemedi');
    setTimeout(() => setMsg(''), 3000);
  }

  const copyLink = () => {
    if(data?.shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/health-card/${data.shareToken}`);
      setCopyMsg("Kopyalandı!");
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

  const url = typeof window !== 'undefined' ? `${window.location.origin}/health-card/${data.shareToken}` : '';

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "24px" }}>
            <ShieldCheck size={32} weight="duotone" color="#ef4444" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#ef4444" }}>Acil Durum</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Sağlık Kartım</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Acil durumlarda görünmesini istediğiniz özet bilgileri yönetin.</p>
          </div>
        </div>
      </div>

      <form onSubmit={save} style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Drop size={18} color="#ef4444" /> Kan Grubu</label>
              <input name="bloodType" defaultValue={data.bloodType||''} placeholder="Örn: A RH+" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><WarningCircle size={18} color="#f59e0b" /> Alerjiler</label>
              <input name="allergies" defaultValue={(data.allergies||[]).join(', ')} placeholder="Virgülle ayırarak yazın" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><FirstAid size={18} color="#3b82f6" /> Kronik Hastalıklar & Durumlar</label>
              <input name="chronicConditions" defaultValue={(data.chronicConditions||[]).join(', ')} placeholder="Virgülle ayırarak yazın" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Pill size={18} color="#10b981" /> Önemli İlaçlar</label>
              <input name="medicationsSummary" defaultValue={(data.medicationsSummary||[]).join(', ')} placeholder="Virgülle ayırarak yazın" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Users size={18} color="#8b5cf6" /> Acil Durum Kişisi</label>
              <input name="emergencyContactName" defaultValue={data.emergencyContactName||''} placeholder="İsim Soyisim" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><PhoneCall size={18} color="#8b5cf6" /> Acil Durum Telefonu</label>
              <input name="emergencyContactPhone" defaultValue={data.emergencyContactPhone||''} placeholder="Telefon numarası" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>Not / Ek Bilgi</label>
              <textarea name="notes" rows={3} defaultValue={data.notes||''} placeholder="Sağlık görevlilerinin bilmesi gereken ekstra notlar" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a", resize: "vertical" }} />
            </div>
          </div>

          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <input type="checkbox" name="sharingEnabled" id="sharingEnabled" defaultChecked={data.sharingEnabled} style={{ width: "20px", height: "20px", marginTop: "2px" }} />
            <div>
              <label htmlFor="sharingEnabled" style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", cursor: "pointer", display: "block", marginBottom: "4px" }}>
                Acil Sağlık Kartımı Paylaşıma Aç
              </label>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                Kabul ederseniz, sağlık kartınız özel bir bağlantı üzerinden görüntülenebilir. Bu bağlantı sağlık kayıtlarınızın tamamına değil, yalnızca yukarıda seçtiğiniz kısıtlı bilgilere erişim sağlar.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button type="submit" style={{ padding: "16px 32px", background: "#0f172a", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", transition: "background 0.2s" }} className="hover-shadow">
              Bilgileri Kaydet
            </button>
            {msg && <span style={{ fontSize: "14px", fontWeight: 600, color: msg.includes('başarı') ? "#16a34a" : "#dc2626" }}>{msg}</span>}
          </div>

        </div>
      </form>

      {data.sharingEnabled && data.shareToken && (
        <section style={{ background: "#fff", borderRadius: "24px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "8px", borderRadius: "12px" }}><LinkIcon size={20} weight="bold" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Acil Paylaşım Bağlantısı</h2>
          </div>
          <p style={{ margin: "0 0 24px", fontSize: "15px", color: "#64748b" }}>Bu bağlantıya sahip olan kişi yalnızca sağlık kartında belirttiğiniz kısa bilgileri görür. QR kod vb. yerlerde bu adresi kullanabilirsiniz.</p>
          
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <code style={{ fontSize: "14px", color: "#334155", wordBreak: "break-all" }}>
              {url}
            </code>
            <button type="button" onClick={copyLink} style={{ padding: "10px 16px", background: "#4f46e5", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }} className="hover-shadow">
              {copyMsg || <><LinkIcon size={16} /> Kopyala</>}
            </button>
          </div>
        </section>
      )}

    </div>
  )
}
