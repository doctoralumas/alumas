const fs = require('fs');
const content = `'use client';
import {useEffect,useState} from 'react';
import { ShieldCheck, Heartbeat, CaretRight, WarningCircle, Drop, IdentificationCard, User, Users, Envelope, Link as LinkIcon, DownloadSimple, Pill, FirstAid, PhoneCall, QrCode } from "@phosphor-icons/react";

export default function EmergencyHealthCard(){
  const [data,setData]=useState<any>(null);
  const [previewData, setPreviewData]=useState<any>(null);
  const [loading, setLoading]=useState(true);
  const [msg, setMsg]=useState('');
  const [copyMsg, setCopyMsg]=useState('');

  const load=()=>fetch('/api/health/emergency-card').then(r=>r.ok?r.json():null).then(d => {
    setData(d);
    setPreviewData(d);
  }).finally(()=>setLoading(false));
  
  useEffect(()=>{load()},[]);

  function handleFormChange(e: React.FormEvent<HTMLFormElement>) {
    const f = new FormData(e.currentTarget);
    setPreviewData({
      ...data,
      bloodType: f.get('bloodType'),
      allergies: f.get('allergies') ? (f.get('allergies') as string).split(',').map(x=>x.trim()) : [],
      chronicConditions: f.get('chronicConditions') ? (f.get('chronicConditions') as string).split(',').map(x=>x.trim()) : [],
      medicationsSummary: f.get('medicationsSummary') ? (f.get('medicationsSummary') as string).split(',').map(x=>x.trim()) : [],
      emergencyContactName: f.get('emergencyContactName'),
      emergencyContactPhone: f.get('emergencyContactPhone'),
      notes: f.get('notes'),
      sharingEnabled: f.get('sharingEnabled') === 'on'
    });
  }

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
    setPreviewData(j);
    setMsg(r.ok?'Saðlýk kartýnýz baþarýyla güncellendi.':'Kaydedilemedi');
    setTimeout(() => setMsg(''), 3000);
  }

  const copyLink = () => {
    if(data?.shareToken) {
      navigator.clipboard.writeText(\`\${window.location.origin}/health-card/\${data.shareToken}\`);
      setCopyMsg("Kopyalandý!");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  if(!data && loading) return (
    <div style={{ padding: "64px", textAlign: "center", color: "#64748b" }}>
      <ShieldCheck size={48} weight="duotone" className="spin-slow" style={{ marginBottom: "16px", opacity: 0.5 }} />
      <div style={{ fontSize: "16px" }}>Acil durum kartýnýz yükleniyor...</div>
    </div>
  );
  if(!data) return <div style={{ padding: "64px", textAlign: "center", color: "#ef4444" }}>Veriler yüklenemedi.</div>;

  const url = typeof window !== 'undefined' ? \`\${window.location.origin}/health-card/\${data.shareToken}\` : '';

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "24px" }}>
            <ShieldCheck size={32} weight="duotone" color="#ef4444" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#ef4444" }}>Acil Durum</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Saðlýk Kartým</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Acil durumlarda görünmesini istediðiniz özet bilgileri yönetin.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", alignItems: "start" }}>
        
        {/* Sol Taraf: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <form onChange={handleFormChange} onSubmit={save} style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Drop size={18} color="#ef4444" /> Kan Grubu</label>
                  <input name="bloodType" defaultValue={data.bloodType||''} placeholder="Örn: A RH+" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><WarningCircle size={18} color="#f59e0b" /> Alerjiler</label>
                  <input name="allergies" defaultValue={(data.allergies||[]).join(', ')} placeholder="Virgülle ayýrarak yazýn" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><FirstAid size={18} color="#3b82f6" /> Kronik Hastalýklar & Durumlar</label>
                  <input name="chronicConditions" defaultValue={(data.chronicConditions||[]).join(', ')} placeholder="Virgülle ayýrarak yazýn" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Pill size={18} color="#10b981" /> Önemli Ýlaçlar</label>
                  <input name="medicationsSummary" defaultValue={(data.medicationsSummary||[]).join(', ')} placeholder="Virgülle ayýrarak yazýn" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>

                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Users size={18} color="#8b5cf6" /> Acil Durum Kiþisi</label>
                  <input name="emergencyContactName" defaultValue={data.emergencyContactName||''} placeholder="Ýsim Soyisim" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><PhoneCall size={18} color="#8b5cf6" /> Acil Durum Telefonu</label>
                  <input name="emergencyContactPhone" defaultValue={data.emergencyContactPhone||''} placeholder="Telefon numarasý" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a" }} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>Not / Ek Bilgi</label>
                  <textarea name="notes" rows={3} defaultValue={data.notes||''} placeholder="Saðlýk görevlilerinin bilmesi gereken ekstra notlar" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#0f172a", resize: "vertical" }} />
                </div>
              </div>

              <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <input type="checkbox" name="sharingEnabled" id="sharingEnabled" defaultChecked={data.sharingEnabled} style={{ width: "20px", height: "20px", marginTop: "2px" }} />
                <div>
                  <label htmlFor="sharingEnabled" style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", cursor: "pointer", display: "block", marginBottom: "4px" }}>
                    Acil Saðlýk Kartýmý Paylaþýma Aç
                  </label>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    Kabul ederseniz, saðlýk kartýnýz özel bir baðlantý üzerinden görüntülenebilir.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button type="submit" style={{ padding: "16px 32px", background: "#0f172a", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", transition: "background 0.2s" }} className="hover-shadow">
                  Bilgileri Kaydet
                </button>
                {msg && <span style={{ fontSize: "14px", fontWeight: 600, color: msg.includes('baþarý') ? "#16a34a" : "#dc2626" }}>{msg}</span>}
              </div>

            </div>
          </form>

          {data.sharingEnabled && data.shareToken && (
            <section style={{ background: "#fff", borderRadius: "24px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "8px", borderRadius: "12px" }}><LinkIcon size={20} weight="bold" /></div>
                <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Acil Paylaþým Baðlantýsý</h2>
              </div>
              <p style={{ margin: "0 0 24px", fontSize: "15px", color: "#64748b" }}>Bu baðlantýya sahip olan kiþi yalnýzca saðlýk kartýnda belirttiðiniz kýsa bilgileri görür. QR kod vb. yerlerde bu adresi kullanabilirsiniz.</p>
              
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

        {/* Sað Taraf: Canlý Önizleme */}
        <div style={{ position: "sticky", top: "32px" }}>
          <div style={{ padding: "8px 0 16px", display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
            <Heartbeat size={20} weight="duotone" /> <span style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Canlý Önizleme</span>
          </div>
          
          <div style={{
            width: "100%", background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            borderRadius: "24px", color: "#fff", padding: "32px", position: "relative", overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(239, 68, 68, 0.3), 0 8px 10px -6px rgba(239, 68, 68, 0.3)",
            minHeight: "450px", display: "flex", flexDirection: "column"
          }}>
            {/* Dekoratif Arkaplan Objeleri */}
            <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "180px", height: "180px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
            <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "120px", height: "120px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", position: "relative", zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px" }}>ACÝL SAÐLIK KARTI</h3>
                <span style={{ fontSize: "12px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600 }}>Medical ID</span>
              </div>
              <div style={{ background: "#fff", padding: "10px", borderRadius: "14px", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={28} weight="fill" />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 1, flex: 1 }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", padding: "16px", borderRadius: "20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.8, display: "block", marginBottom: "4px", fontWeight: 600, letterSpacing: "0.5px" }}>Kan Grubu</span>
                  <strong style={{ fontSize: "24px", fontWeight: 800 }}>{previewData?.bloodType || "Belirtilmedi"}</strong>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.15)", padding: "16px", borderRadius: "20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.8, display: "block", marginBottom: "4px", fontWeight: 600, letterSpacing: "0.5px" }}>Alerjiler</span>
                <strong style={{ fontSize: "15px", display: "block", lineHeight: "1.5" }}>{previewData?.allergies?.length ? previewData.allergies.join(", ") : "Yok / Belirtilmedi"}</strong>
              </div>

              <div style={{ background: "rgba(255,255,255,0.15)", padding: "16px", borderRadius: "20px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.8, display: "block", marginBottom: "4px", fontWeight: 600, letterSpacing: "0.5px" }}>Kronik Durumlar</span>
                <strong style={{ fontSize: "15px", display: "block", lineHeight: "1.5" }}>{previewData?.chronicConditions?.length ? previewData.chronicConditions.join(", ") : "Yok / Belirtilmedi"}</strong>
              </div>
            </div>

            <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px dashed rgba(255,255,255,0.3)", position: "relative", zIndex: 1 }}>
               <span style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.8, display: "block", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.5px" }}>Acil Durum Kiþisi</span>
               <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                 <div style={{ background: "rgba(255,255,255,0.2)", padding: "10px", borderRadius: "50%" }}>
                   <PhoneCall size={20} weight="fill" />
                 </div>
                 <div>
                   <strong style={{ fontSize: "16px", display: "block" }}>{previewData?.emergencyContactName || "Kiþi eklenmedi"}</strong>
                   <span style={{ fontSize: "14px", opacity: 0.9 }}>{previewData?.emergencyContactPhone || "-"}</span>
                 </div>
               </div>
            </div>

            {previewData?.sharingEnabled && (
              <div style={{ position: "absolute", bottom: "32px", right: "32px", zIndex: 1, background: "#fff", padding: "6px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <QrCode size={40} color="#0f172a" weight="regular" />
              </div>
            )}
            
          </div>
          
          <div style={{ marginTop: "16px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
            Bu önizleme, verilerinizin gerçek acil saðlýk personelinin (veya QR kodu okutan kiþinin) ekranýnda nasýl görüneceðini simüle eder.
          </div>
        </div>

      </div>

    </div>
  )
}
`;
fs.writeFileSync('components/emergency-health-card.tsx', content, 'utf8');
