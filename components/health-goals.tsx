"use client";
import {useEffect,useState} from "react";
import { Target, Trophy, Clock, CheckCircle, PauseCircle, Plus, X, TrendUp } from "@phosphor-icons/react";

export default function HealthGoals({patientId}:{patientId?:string}){
  const [rows,setRows]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  const [open, setOpen]=useState(false);
  const [loading, setLoading]=useState(true);

  const qs=patientId?`?patientId=${patientId}`:'';
  const load=()=>fetch('/api/health/goals'+qs).then(r=>r.ok?r.json():[]).then(setRows).finally(()=>setLoading(false));
  useEffect(()=>{load()},[patientId]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form),body:any=Object.fromEntries(f.entries());
    if(patientId)body.patientId=patientId;
    
    const r=await fetch('/api/health/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    setMsg(r.ok?'Yeni hedef başarıyla eklendi.':j.error||'Eklenemedi');
    
    if(r.ok){
      form.reset();
      setTimeout(()=>{ setOpen(false); setMsg(""); load(); }, 1500);
    }
  }

  async function update(id:string,patch:any){
    await fetch('/api/health/goals',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...patch})});
    load();
  }

  const activeGoals = rows.filter(g => g.status === 'active');
  const otherGoals = rows.filter(g => g.status !== 'active');

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fef3c7", padding: "16px", borderRadius: "24px" }}>
            <Target size={32} weight="duotone" color="#d97706" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#d97706" }}>Gelişim & Takip</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{patientId ? 'Hasta Hedefleri' : 'Sağlık Hedeflerim'}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{patientId ? 'Hastanın tedavi hedeflerini belirle.' : 'Uzmanla birlikte belirlenen veya kişisel hedeflerini takip et.'}</p>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "İptal" : "Yeni Hedef Belirle"}
        </button>
      </div>

      {open && (
        <form onSubmit={add} style={{ background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Hedef Başlığı <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="title" placeholder="Örn. Haftada 4 gün yürüyüş" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Metrik (Opsiyonel)</label>
              <input name="metric" placeholder="Örn. Kilo, Adım Sayısı" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Hedef Değer</label>
              <input name="targetValue" type="number" step="any" placeholder="Örn. 75, 10000" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Birim</label>
              <input name="unit" placeholder="Örn. kg, adım" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Bitiş Tarihi</label>
              <input name="targetDate" type="date" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Ek Notlar</label>
              <input name="note" placeholder="Diyetisyenin önerisi vb." style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
          </div>

          <button style={{ padding: "16px", background: "#d97706", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "20px" }}>Hedefi Başlat</button>
          {msg && <div style={{ background: msg.includes('başarı') ? '#fef3c7' : '#fef2f2', color: msg.includes('başarı') ? '#b45309' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center", marginTop: "16px" }}>{msg}</div>}
        </form>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Hedefler yükleniyor...</div>}

      {/* Aktif Hedefler */}
      {activeGoals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>
          {activeGoals.map(g => (
            <div key={g.id} style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #fde68a", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 4px 6px -1px rgba(217, 119, 6, 0.05)" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: 700 }}>{g.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    {g.doctor?.name && <span style={{ fontSize: "13px", fontWeight: 600, color: "#d97706", background: "#fef3c7", padding: "4px 10px", borderRadius: "100px" }}>{g.doctor.name} ile Ortak</span>}
                    {g.targetDate && <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {new Date(g.targetDate).toLocaleDateString('tr-TR')} Son Tarih</span>}
                  </div>
                </div>
                {g.targetValue != null && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Nihai Hedef</span>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>{g.targetValue} <small style={{ fontSize: "14px", color: "#94a3b8" }}>{g.unit}</small></div>
                  </div>
                )}
              </div>

              {g.note && <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{g.note}</p>}

              <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>İlerleme Durumu</span>
                  <strong style={{ fontSize: "18px", color: "#d97706" }}>%{g.progressPercent || 0}</strong>
                </div>
                
                <div style={{ width: "100%", height: "12px", background: "#e2e8f0", borderRadius: "100px", overflow: "hidden", marginBottom: "20px" }}>
                  <div style={{ width: `${g.progressPercent || 0}%`, height: "100%", background: "linear-gradient(90deg, #fbbf24 0%, #d97706 100%)", borderRadius: "100px", transition: "width 0.5s ease" }} />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Yüzde Güncelle:</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue={g.progressPercent || 0}
                      onBlur={e => update(g.id, { progressPercent: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: "#d97706" }}
                    />
                  </div>
                  <button onClick={() => update(g.id, { progressPercent: 100, status: 'completed' })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ecfdf5", color: "#059669", border: "1px solid #10b981", padding: "10px 16px", borderRadius: "12px", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }} className="hover-bg-green-100">
                    <CheckCircle size={18} weight="fill" /> Hedefi Tamamla
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Geçmiş / Tamamlanan Hedefler */}
      {otherGoals.length > 0 && (
        <>
          <h3 style={{ fontSize: "18px", color: "#64748b", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>Geçmiş Hedefler</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {otherGoals.map(g => (
              <div key={g.id} style={{ background: "#f8fafc", borderRadius: "20px", padding: "20px", border: "1px solid #e2e8f0", opacity: 0.8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  {g.status === 'completed' ? <Trophy size={24} weight="duotone" color="#16a34a" /> : <PauseCircle size={24} weight="duotone" color="#64748b" />}
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#475569" }}>{g.title}</h3>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                  <span>{g.status === 'completed' ? 'Başarıyla Tamamlandı' : 'Duraklatıldı'}</span>
                  <strong>%{g.progressPercent || 0}</strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
          <Target size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
          <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>Belirlenmiş bir sağlık hedefiniz bulunmuyor.</div>
        </div>
      )}
    </div>
  )
}
