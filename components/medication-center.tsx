"use client";
import {useEffect,useState} from "react";
import {scheduleLocalReminder} from "@/lib/local-reminders";
import MedicationAdherence from "@/components/medication-adherence";
import MedicationHistoryCalendar from "@/components/medication-history-calendar";
import { Pill, Plus, X, Clock, PlayCircle, PauseCircle, Info, CalendarCheck } from "@phosphor-icons/react";

export default function MedicationCenter(){
  const [rows,setRows]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(true);
  const [timesList,setTimesList]=useState<string[]>(["09:00"]);
  
  const load=()=>fetch('/api/health/medications').then(r=>r.ok?r.json():[]).then(setRows).finally(()=>setLoading(false));
  useEffect(()=>{load()},[]);
  
  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMsg("");
    const f=new FormData(e.currentTarget);
    const times = f.getAll('times').map(x=>String(x).trim()).filter(Boolean);
    const body={name:f.get('name'),dose:f.get('dose'),instructions:f.get('instructions'),times};
    
    const r=await fetch('/api/health/medications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    
    if(!r.ok){
      setMsg(j.error||'Kaydedilemedi');
      return;
    }
    
    for(const reminder of j.reminders||[]) await scheduleLocalReminder(reminder);
    setMsg('İlaç ve hatırlatıcılar başarıyla eklendi.');
    setTimeout(()=> { setOpen(false); setMsg(""); setTimesList(["09:00"]); load(); }, 1500);
  }
  
  async function toggle(id:string,isActive:boolean){
    await fetch('/api/health/medications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,isActive})});
    load();
  }

  const activeMeds = rows.filter(m => m.isActive);
  const inactiveMeds = rows.filter(m => !m.isActive);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fdf2f8", padding: "16px", borderRadius: "24px" }}>
            <Pill size={32} weight="duotone" color="#db2777" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#db2777" }}>Tedavi Düzeni</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>İlaç Takibi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>İlaçlarını, dozlarını, günlük saatlerini ve alım geçmişini yönet.</p>
          </div>
        </div>
        <button onClick={()=>{setOpen(!open); setTimesList(["09:00"]); setMsg("");}} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "İptal" : "Yeni İlaç Ekle"}
        </button>
      </div>

      {/* İlaç Ekleme Formu Overlay */}
      {open && (
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><Plus size={20} weight="bold" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Reçete & İlaç Bilgisi</h2>
          </div>
          
          <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>İlaç Adı <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="name" required placeholder="Örn. Coraspin 100mg" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Doz / Miktar <span style={{ color: "#ef4444" }}>*</span></label>
                <input name="dose" required placeholder="Örn. 1 tablet, 5 ml" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Saatler (Hatırlatıcı)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {timesList.map((t, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px" }}>
                      <input name="times" type="time" required value={t} onChange={e => { const newT = [...timesList]; newT[idx] = e.target.value; setTimesList(newT); }} style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                      <button type="button" onClick={() => { const newT = timesList.filter((_, i) => i !== idx); setTimesList(newT.length ? newT : ["09:00"]); }} style={{ background: "#fee2e2", border: "none", borderRadius: "12px", width: "45px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", cursor: "pointer" }}><X size={16} weight="bold" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTimesList([...timesList, "12:00"])} style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1", padding: "10px", borderRadius: "12px", color: "#475569", fontWeight: 600, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Plus size={14} /> Saat Ekle</button>
                </div>
              </div>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Kullanım Talimatı</label>
              <input name="instructions" placeholder="Tok karnına, uyumadan önce vb." style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>

            <button style={{ padding: "16px", background: "#db2777", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "8px" }}>İlacı Listeye Ekle</button>
            {msg && <div style={{ background: msg.includes('başarı') ? '#fdf2f8' : '#fef2f2', color: msg.includes('başarı') ? '#be185d' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center" }}>{msg}</div>}
          </form>
        </div>
      )}

      {/* Adherence & Calendar sub-components (They have their own styling, but we wrap them neatly) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px", marginBottom: "40px" }}>
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><CalendarCheck size={20} weight="duotone" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Alım İstatistikleri & Takvim</h2>
          </div>
          <MedicationAdherence />
          <div style={{ marginTop: "32px" }}>
            <MedicationHistoryCalendar />
          </div>
        </div>
      </div>

      {/* İlaç Listesi */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#fdf2f8", color: "#db2777", padding: "10px", borderRadius: "14px" }}><Pill size={20} weight="fill" /></div>
          <h2 style={{ margin: 0, fontSize: "24px", color: "#0f172a" }}>İlaç Listem</h2>
        </div>

        {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>}
        
        {/* Aktif İlaçlar */}
        {activeMeds.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
            {activeMeds.map(m => (
              <div key={m.id} style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #fbcfe8", boxShadow: "0 4px 6px -1px rgba(219, 39, 119, 0.05)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#059669", background: "#ecfdf5", padding: "4px 8px", borderRadius: "100px", display: "inline-block", marginBottom: "8px" }}>Aktif Tedavi</span>
                    <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{m.name}</h3>
                  </div>
                  <button onClick={() => toggle(m.id, false)} style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer" }} title="Tedaviyi Duraklat">
                    <PauseCircle size={24} weight="fill" />
                  </button>
                </div>
                
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#db2777", marginBottom: "8px" }}>{m.dose}</div>
                <div style={{ fontSize: "14px", color: "#475569", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", flex: 1 }}>
                  <Info size={16} /> {m.instructions || "Kullanım talimatı yok."}
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto", borderTop: "1px dashed #e2e8f0", paddingTop: "16px" }}>
                  {m.times?.map((t:string) => (
                    <span key={t} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 600, color: "#0f172a", background: "#f8fafc", padding: "6px 12px", borderRadius: "100px", border: "1px solid #e2e8f0" }}>
                      <Clock size={14} /> {t}
                    </span>
                  ))}
                  {(!m.times || m.times.length === 0) && <span style={{ fontSize: "13px", color: "#94a3b8" }}>Saat belirtilmemiş</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pasif İlaçlar */}
        {inactiveMeds.length > 0 && (
          <>
            <h3 style={{ fontSize: "18px", color: "#64748b", marginBottom: "16px", marginTop: "32px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Geçmiş / Duraklatılan İlaçlar</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {inactiveMeds.map(m => (
                <div key={m.id} style={{ background: "#f8fafc", borderRadius: "20px", padding: "20px", border: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#475569" }}>{m.name} <span style={{ fontSize: "13px", fontWeight: 500 }}>({m.dose})</span></h3>
                  </div>
                  <button onClick={() => toggle(m.id, true)} style={{ background: "#fff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                    <PlayCircle size={18} weight="fill" color="#10b981" /> Devam Et
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        
        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
            <Pill size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>Kayıtlı ilacınız bulunmuyor.</div>
          </div>
        )}

      </div>
    </div>
  )
}
