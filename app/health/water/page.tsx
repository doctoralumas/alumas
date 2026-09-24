"use client";
import {useEffect,useMemo,useState} from "react";
import SectionVisual from "@/components/section-visual";
import { Drop, Plus, Clock, TrendUp } from "@phosphor-icons/react";

type R={id:string;amountMl:number;consumedAt:string};

export default function Page(){
  const [rows,setRows]=useState<R[]>([]);
  const [loading,setLoading]=useState(true);

  const load=()=>fetch('/api/health/water?days=7').then(r => r.ok ? r.json() : []).then(x=>setRows(Array.isArray(x)?x:[])).finally(()=>setLoading(false));
  useEffect(() => { load(); },[]);

  const today=useMemo(()=>rows.filter(x=>new Date(x.consumedAt).toDateString()===new Date().toDateString()).reduce((a,b)=>a+b.amountMl,0),[rows]);
  const todayCount=useMemo(()=>rows.filter(x=>new Date(x.consumedAt).toDateString()===new Date().toDateString()).length,[rows]);

  async function add(amountMl:number){
    await fetch('/api/health/water',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amountMl})});
    load();
  }

  // Varsayılan hedef 2500ml
  const target = 2500;
  const progress = Math.min((today / target) * 100, 100);

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#e0f2fe", padding: "16px", borderRadius: "24px" }}>
            <Drop size={32} weight="duotone" color="#0284c7" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#0284c7" }}>Günlük Takip</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>Su Tüketimi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Günlük su tüketiminizi takip edin ve hedefinize ulaşın.</p>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "32px", padding: "40px", border: "1px solid #e2e8f0", marginBottom: "40px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "64px", fontWeight: 800, color: "#0284c7", lineHeight: 1 }}>{(today/1000).toFixed(2)}<span style={{ fontSize: "32px", color: "#7dd3fc" }}>L</span></div>
        <div style={{ fontSize: "15px", color: "#64748b", marginTop: "12px", fontWeight: 500 }}>Bugün {todayCount} kez su içtiniz</div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "16px", background: "#f1f5f9", borderRadius: "100px", marginTop: "32px", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)", borderRadius: "100px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>
          <span>0 L</span>
          <span>Hedef: {(target/1000).toFixed(1)} L</span>
        </div>
      </div>

      <section style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px", borderRadius: "14px" }}><Plus size={20} weight="bold" /></div>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Hızlı Ekle</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
          {[
            { v: 200, label: 'Bardak' },
            { v: 330, label: 'Kutu' },
            { v: 500, label: 'Küçük Şişe' },
            { v: 1000, label: 'Büyük Şişe' }
          ].map(x => (
            <button 
              key={x.v} 
              onClick={() => add(x.v)} 
              style={{ padding: "20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
              className="hover-bg-sky-50"
            >
              <Drop size={28} weight="fill" color="#7dd3fc" />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong style={{ fontSize: "18px", color: "#0f172a" }}>{x.v}</strong>
                <small style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ml</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#f1f5f9", color: "#475569", padding: "10px", borderRadius: "14px" }}><Clock size={20} weight="duotone" /></div>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Geçmiş (Son 7 Gün)</h2>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Drop size={20} weight="fill" color="#38bdf8" />
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>{r.amountMl} ml</strong>
              </div>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                {new Date(r.consumedAt).toLocaleDateString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>Henüz su tüketimi kaydedilmedi.</div>
          )}
        </div>
      </section>

    </div>
  )
}

