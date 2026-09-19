"use client";
import {useEffect,useState} from "react";
import SectionVisual from "@/components/section-visual";
import { User, Ruler, Scales, Circle, Plus, Clock, TrendUp } from "@phosphor-icons/react";

type R={id:string;weightKg?:number;heightCm?:number;waistCm?:number;measuredAt:string};

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [loading,setLoading]=useState(true);

  const load=()=>fetch('/api/health/body').then(r=>r.json()).then(x=>setRows(Array.isArray(x)?x:[])).finally(()=>setLoading(false));
  useEffect(() => { load(); },[]);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form = e.currentTarget;
    const f=new FormData(form),b=Object.fromEntries(f.entries());
    await fetch('/api/health/body',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
    form.reset();
    load();
  }

  const latest = rows[0];

  const calcBMI = (w?: number, h?: number) => {
    if (!w || !h) return null;
    return (w / ((h/100) * (h/100))).toFixed(1);
  };

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f3e8ff", padding: "16px", borderRadius: "24px" }}>
            <User size={32} weight="duotone" color="#9333ea" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#9333ea" }}>Fiziksel Ã–lÃ§Ã¼mler</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>VÃ¼cut Ã–lÃ§Ã¼leri</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Boy, kilo ve bel Ã§evresi deÄŸiÅŸimlerinizi takip edin.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        
        {/* BMI Card */}
        <div style={{ background: "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)", borderRadius: "32px", padding: "32px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 10px 15px -3px rgba(147, 51, 234, 0.3)" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", opacity: 0.9 }}>Son VÃ¼cut Kitle Ä°ndeksi (BMI)</span>
          <strong style={{ fontSize: "64px", lineHeight: 1, fontWeight: 800 }}>
            {calcBMI(latest?.weightKg, latest?.heightCm) || "--"}
          </strong>
          {latest && (
            <div style={{ display: "flex", gap: "16px", marginTop: "16px", opacity: 0.9 }}>
              <span>{latest.weightKg} kg</span>
              <span>â€¢</span>
              <span>{latest.heightCm} cm</span>
            </div>
          )}
        </div>

        {/* Yeni KayÄ±t Formu */}
        <form onSubmit={submit} style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px", borderRadius: "12px" }}><Plus size={20} weight="bold" /></div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Yeni Ã–lÃ§Ã¼m Gir</h2>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", color: "#64748b", display: "flex", justifyContent: "center" }}><Scales size={24} weight="duotone" /></div>
            <input name="weightKg" type="number" step="0.1" placeholder="Kilo (kg)" required style={{ flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", color: "#64748b", display: "flex", justifyContent: "center" }}><Ruler size={24} weight="duotone" /></div>
            <input name="heightCm" type="number" step="0.1" placeholder="Boy (cm)" style={{ flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", color: "#64748b", display: "flex", justifyContent: "center" }}><Circle size={24} weight="duotone" /></div>
            <input name="waistCm" type="number" step="0.1" placeholder="Bel Ã‡evresi (cm)" style={{ flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
          </div>
          
          <button style={{ padding: "16px", background: "#0f172a", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "8px" }}>Kaydet</button>
        </form>

      </div>

      <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#f1f5f9", color: "#475569", padding: "12px", borderRadius: "16px" }}><Clock size={24} weight="duotone" /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Ã–lÃ§Ã¼m GeÃ§miÅŸi</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>GirdiÄŸiniz tÃ¼m kayÄ±tlar.</p>
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {r.weightKg && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Kilo</span>
                    <strong style={{ fontSize: "20px", color: "#0f172a" }}>{r.weightKg} <small style={{ fontSize: "14px", color: "#94a3b8" }}>kg</small></strong>
                  </div>
                )}
                {r.heightCm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Boy</span>
                    <strong style={{ fontSize: "20px", color: "#0f172a" }}>{r.heightCm} <small style={{ fontSize: "14px", color: "#94a3b8" }}>cm</small></strong>
                  </div>
                )}
                {r.waistCm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Bel</span>
                    <strong style={{ fontSize: "20px", color: "#0f172a" }}>{r.waistCm} <small style={{ fontSize: "14px", color: "#94a3b8" }}>cm</small></strong>
                  </div>
                )}
              </div>
              
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, background: "#fff", padding: "8px 16px", borderRadius: "100px", border: "1px solid #e2e8f0" }}>
                {new Date(r.measuredAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>HenÃ¼z Ã¶lÃ§Ã¼m kaydÄ±nÄ±z bulunmuyor.</div>
          )}
        </div>
      </section>

    </div>
  )
}

