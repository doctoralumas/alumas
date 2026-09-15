"use client";
import {useEffect,useState} from "react";
import { Warning, Plus, X, WarningCircle, Pill, Hamburger, Plant, Question } from "@phosphor-icons/react";

type A={id:string;allergen:string;category?:string;reaction?:string;severity:string;isActive:boolean};

export default function Page(){
  const [rows,setRows]=useState<A[]>([]);
  const [open,setOpen]=useState(false);
  const [loading, setLoading]=useState(true);

  const load=()=>fetch('/api/health/allergies').then(r=>r.ok?r.json():[]).then(setRows).finally(()=>setLoading(false));
  useEffect(() => { load(); },[]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const r=await fetch('/api/health/allergies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f.entries()))});
    if(r.ok){
      setOpen(false);
      e.currentTarget.reset();
      load();
    }
  }

  async function toggle(a:A){
    await fetch('/api/health/allergies',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:a.id,isActive:!a.isActive})});
    load();
  }

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'İlaç': return <Pill size={24} weight="duotone" />;
      case 'Gıda': return <Hamburger size={24} weight="duotone" />;
      case 'Çevresel': return <Plant size={24} weight="duotone" />;
      default: return <Question size={24} weight="duotone" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'severe': return { label: 'Şiddetli', bg: '#fee2e2', color: '#b91c1c' };
      case 'moderate': return { label: 'Orta', bg: '#fef3c7', color: '#d97706' };
      case 'mild': return { label: 'Hafif', bg: '#fefce8', color: '#a16207' };
      default: return { label: 'Belirtilmedi', bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "24px" }}>
            <Warning size={32} weight="duotone" color="#ef4444" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#ef4444" }}>Tıbbi Geçmiş</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Alerjilerim</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>İlaç, gıda ve çevresel alerjilerinizi kategorize ederek kaydedin.</p>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? "İptal" : "Yeni Alerji Ekle"}
        </button>
      </div>

      {open && (
        <form onSubmit={add} style={{ background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Alerjen Adı <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="allergen" required placeholder="Örn. Penilisin, Fıstık" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Kategori</label>
              <select name="category" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                <option>İlaç</option><option>Gıda</option><option>Çevresel</option><option>Diğer</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Şiddeti</label>
              <select name="severity" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                <option value="unknown">Belirtilmedi</option><option value="mild">Hafif</option><option value="moderate">Orta</option><option value="severe">Şiddetli</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>Reaksiyon / Belirti</label>
            <input name="reaction" placeholder="Örn. Ciltte kızarıklık, nefes darlığı" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
          </div>
          <button style={{ padding: "16px", background: "#ef4444", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>Kaydet</button>
        </form>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Yükleniyor...</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
        {rows.map(a => {
          const sev = getSeverityBadge(a.severity);
          return (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: "24px", padding: "24px", border: `1px solid ${a.isActive ? '#e2e8f0' : '#f1f5f9'}`, opacity: a.isActive ? 1 : 0.6, boxShadow: a.isActive ? "0 4px 6px -1px rgba(0,0,0,0.02)" : "none", flexWrap: "wrap", gap: "16px" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: a.isActive ? "#fef2f2" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: a.isActive ? "#ef4444" : "#94a3b8" }}>
                  {getCategoryIcon(a.category)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 700, textDecoration: a.isActive ? 'none' : 'line-through' }}>{a.allergen}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>{a.category || 'Kategori Yok'}</span>
                    <span style={{ color: "#cbd5e1" }}>•</span>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>{a.reaction || 'Reaksiyon belirtilmedi'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {a.isActive && <span style={{ padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, background: sev.bg, color: sev.color }}>{sev.label}</span>}
                <button onClick={() => toggle(a)} style={{ background: a.isActive ? "#f8fafc" : "#0f172a", color: a.isActive ? "#64748b" : "#fff", border: a.isActive ? "1px solid #e2e8f0" : "none", padding: "8px 16px", borderRadius: "12px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  {a.isActive ? 'Geçmişe Al' : 'Aktif Yap'}
                </button>
              </div>

            </div>
          )
        })}

        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
            <WarningCircle size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>Kayıtlı alerjiniz bulunmuyor.</div>
          </div>
        )}
      </div>

    </div>
  )
}
