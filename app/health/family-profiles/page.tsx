"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import { Baby, Heartbeat, CalendarBlank, CaretLeft } from "@phosphor-icons/react";

type P={id:string;type:'PREGNANCY'|'CHILD';name:string;relationLabel?:string;birthDate?:string;dueDate?:string;isActive:boolean;notes?:string};

export default function Page(){
  const [rows,setRows]=useState<P[]>([]);
  const [type,setType]=useState<'PREGNANCY'|'CHILD'>('PREGNANCY');

  const load=()=>fetch('/api/health/special-profiles').then(r=>r.ok?r.json():[]).then(setRows);
  useEffect(() => { load(); },[]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const form=e.currentTarget;const f=new FormData(form);
    const r=await fetch('/api/health/special-profiles',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type,...Object.fromEntries(f.entries())})
    });
    if(r.ok){
      form.reset();
      load();
    }
  }

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/health/family-hub" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Aile Paneline Dön
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">Profil Yönetimi</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>Gebelik & Çocuk Profilleri</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Gebelik takibi veya çocuğunuz için özel sağlık profilleri oluşturun.</p>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: "32px", borderRadius: "24px", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", padding: "6px", background: "#f8fafc", borderRadius: "16px", width: "fit-content" }}>
          <button 
            onClick={()=>setType('PREGNANCY')}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: type === 'PREGNANCY' ? "#fff" : "transparent", color: type === 'PREGNANCY' ? "#db2777" : "#64748b", fontWeight: 600, cursor: "pointer", boxShadow: type === 'PREGNANCY' ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}
          >
            <Heartbeat size={20} weight={type === 'PREGNANCY' ? "duotone" : "regular"} /> Gebelik Profili
          </button>
          <button 
            onClick={()=>setType('CHILD')}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: type === 'CHILD' ? "#fff" : "transparent", color: type === 'CHILD' ? "#16a34a" : "#64748b", fontWeight: 600, cursor: "pointer", boxShadow: type === 'CHILD' ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}
          >
            <Baby size={20} weight={type === 'CHILD' ? "duotone" : "regular"} /> Çocuk Profili
          </button>
        </div>

        <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>
                {type==='PREGNANCY' ? 'Profil Adı (Örn: İlk Gebeliğim) *' : 'Çocuğun Adı *'}
              </label>
              <input name="name" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
            </div>
            {type==='CHILD' && (
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Yakınlık Derecesi</label>
                <input name="relationLabel" placeholder="Örn: Kızım" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </div>
            )}
            {type==='PREGNANCY' ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Son Adet Tarihi (SAT)</label>
                  <input name="startDate" type="date" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", color: "#475569" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Tahmini Doğum Tarihi</label>
                  <input name="dueDate" type="date" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", color: "#475569" }} />
                </div>
              </>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Doğum Tarihi</label>
                <input name="birthDate" type="date" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", color: "#475569" }} />
              </div>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>Özel Notlar</label>
            <input name="notes" placeholder="Eklemek istediğiniz notlar..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
          </div>
          <button className="primary" style={{ padding: "14px", fontSize: "15px", borderRadius: "10px", alignSelf: "flex-start", marginTop: "8px" }}>
            Profili Oluştur
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px" }}>Mevcut Profiller</h2>
      <div style={{ display: "grid", gap: "16px" }}>
        {rows.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ padding: "12px", background: p.type === 'CHILD' ? "#dcfce7" : "#fce7f3", borderRadius: "12px", color: p.type === 'CHILD' ? "#16a34a" : "#db2777" }}>
                {p.type === 'CHILD' ? <Baby size={24} weight="duotone" /> : <Heartbeat size={24} weight="duotone" />}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{p.name}</strong>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b" }}>
                  <CalendarBlank size={14} />
                  {p.type==='PREGNANCY' 
                    ? (p.dueDate ? 'Tahmini Doğum: ' + new Date(p.dueDate).toLocaleDateString('tr-TR') : 'Tarih belirtilmedi')
                    : (p.birthDate ? 'Doğum: ' + new Date(p.birthDate).toLocaleDateString('tr-TR') : 'Doğum tarihi belirtilmedi')
                  }
                </span>
              </div>
            </div>
            <Link href={`/health/family?profile=${p.id}`} className="secondary compact" style={{ borderRadius: "20px", padding: "8px 16px", fontSize: "13px", fontWeight: 600 }}>
              Yönet
            </Link>
          </div>
        ))}
        {!rows.length && (
          <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
            Henüz oluşturulmuş bir özel profil bulunmuyor.
          </div>
        )}
      </div>
    </div>
  )
}
