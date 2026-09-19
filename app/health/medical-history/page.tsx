"use client";
import {useEffect,useState} from "react";
import SectionVisual from "@/components/section-visual";
import { FolderUser, Heartbeat, Scissors, Plus, X, CalendarBlank, Buildings, FirstAid } from "@phosphor-icons/react";

type H={conditions:any[];procedures:any[]};

export default function Page(){
  const [d,setD]=useState<H>({conditions:[],procedures:[]});
  const [kind,setKind]=useState<'condition'|'procedure'>('condition');
  const [open, setOpen]=useState(false);
  const [loading, setLoading]=useState(true);

  const load=()=>fetch('/api/health/history').then(r=>r.ok?r.json():{conditions:[],procedures:[]}).then(setD).finally(()=>setLoading(false));
  useEffect(() => { load(); },[]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form = e.currentTarget;
    const f=new FormData(form);
    const r=await fetch('/api/health/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,...Object.fromEntries(f.entries())})});
    if(r.ok){
      form.reset();
      setOpen(false);
      load();
    }
  }

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#e0e7ff", padding: "16px", borderRadius: "24px" }}>
            <FolderUser size={32} weight="duotone" color="#4f46e5" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#4f46e5" }}>TÄ±bbi ArÅŸiv</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>HastalÄ±k & Ä°ÅŸlem GeÃ§miÅŸi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Kronik hastalÄ±klarÄ±nÄ±zÄ±, ameliyatlarÄ±nÄ±zÄ± ve Ã¶nemli tÄ±bbi iÅŸlemlerinizi saklayÄ±n.</p>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "Ä°ptal" : "Yeni KayÄ±t Ekle"}
        </button>
      </div>

      {open && (
        <div style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          
          <div style={{ gap: "12px", marginBottom: "24px", background: "#f8fafc", padding: "8px", borderRadius: "20px", display: "inline-flex" }}>
            <button onClick={() => setKind('condition')} style={{ padding: "12px 24px", background: kind === 'condition' ? "#fff" : "transparent", color: kind === 'condition' ? "#0f172a" : "#64748b", border: "none", borderRadius: "16px", fontWeight: 600, cursor: "pointer", boxShadow: kind === 'condition' ? "0 2px 4px rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <Heartbeat size={18} weight={kind === 'condition' ? "fill" : "regular"} /> HastalÄ±k / Durum
            </button>
            <button onClick={() => setKind('procedure')} style={{ padding: "12px 24px", background: kind === 'procedure' ? "#fff" : "transparent", color: kind === 'procedure' ? "#0f172a" : "#64748b", border: "none", borderRadius: "16px", fontWeight: 600, cursor: "pointer", boxShadow: kind === 'procedure' ? "0 2px 4px rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <Scissors size={18} weight={kind === 'procedure' ? "fill" : "regular"} /> Ameliyat / Ä°ÅŸlem
            </button>
          </div>
          
          <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {kind === 'condition' ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>HastalÄ±k / Durum AdÄ± <span style={{ color: "#ef4444" }}>*</span></label>
                    <input name="name" placeholder="Ã–rn. Hipertansiyon, AstÄ±m" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Mevcut Durum</label>
                    <select name="status" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                      <option value="active">Aktif Devam Ediyor</option><option value="resolved">GeÃ§miÅŸte KaldÄ± / Ä°yileÅŸti</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>TeÅŸhis Tarihi</label>
                    <input name="diagnosedAt" type="date" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Ek Notlar</label>
                  <input name="notes" placeholder="Doktorun tavsiyeleri vb." style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Ä°ÅŸlem / Ameliyat AdÄ± <span style={{ color: "#ef4444" }}>*</span></label>
                  <input name="procedureName" placeholder="Ã–rn. Apandisit, Anjiyo" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>TÃ¼r</label>
                  <input name="procedureType" placeholder="Ã–rn. Cerrahi, TanÄ±sal" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Uygulanan Kurum</label>
                  <input name="provider" placeholder="Ã–rn. ÅiÅŸli Etfal" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Ä°ÅŸlem Tarihi <span style={{ color: "#ef4444" }}>*</span></label>
                  <input name="performedAt" type="date" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
                </div>
              </div>
            )}
            
            <button style={{ padding: "16px", background: "#4f46e5", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "8px" }}>Kaydet</button>
          </form>
        </div>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>YÃ¼kleniyor...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", marginBottom: "48px" }}>
        
        {/* HastalÄ±k GeÃ§miÅŸi */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "14px" }}><Heartbeat size={20} weight="fill" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>HastalÄ±k / Durum GeÃ§miÅŸi</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {d.conditions.map((x:any) => (
              <div key={x.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: x.status === 'active' ? "#fee2e2" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: x.status === 'active' ? "#ef4444" : "#94a3b8" }}>
                  <FirstAid size={24} weight="duotone" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{x.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: x.status === 'active' ? "#b91c1c" : "#64748b" }}>{x.status === 'active' ? 'Aktif' : 'GeÃ§miÅŸte KaldÄ±'}</span>
                    {x.diagnosedAt && (
                      <>
                        <span style={{ color: "#cbd5e1" }}>â€¢</span>
                        <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><CalendarBlank size={14}/> {new Date(x.diagnosedAt).toLocaleDateString('tr-TR')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && d.conditions.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>KayÄ±t yok.</div>}
          </div>
        </section>

        {/* Ameliyatlar */}
        <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px", borderRadius: "14px" }}><Scissors size={20} weight="fill" /></div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Ameliyat / Ä°ÅŸlemler</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {d.procedures.map((x:any) => (
              <div key={x.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                  <Scissors size={24} weight="duotone" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>{x.procedureName}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><CalendarBlank size={14}/> {new Date(x.performedAt).toLocaleDateString('tr-TR')}</span>
                    <span style={{ color: "#cbd5e1" }}>â€¢</span>
                    <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><Buildings size={14}/> {x.provider || 'Kurum belirtilmedi'}</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && d.procedures.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>KayÄ±t yok.</div>}
          </div>
        </section>

      </div>
    </div>
  )
}

