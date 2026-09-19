"use client";
import React, {useEffect,useMemo,useState,Suspense} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import { Baby, Heartbeat, User, Plus, CaretLeft, CheckCircle, Circle, Ruler, Scales } from "@phosphor-icons/react";

type Profile={id:string;type:'PREGNANCY'|'CHILD';name:string;relationLabel?:string;birthDate?:string;dueDate?:string;startDate?:string;isActive:boolean};

function MiniChart({rows,field,unit,color}:{rows:any[];field:string;unit:string;color:string}){
  const vals=rows.map(x=>Number(x[field])).filter(Number.isFinite);
  if(vals.length<2) return <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", color: "#64748b", textAlign: "center", fontSize: "13px" }}>Grafik iÃ§in en az iki kayÄ±t gerekir.</div>;
  const min=Math.min(...vals), max=Math.max(...vals), span=max-min||1;
  const points=rows.map((x,i)=>{
    const v=Number(x[field]);
    if(!Number.isFinite(v)) return null;
    return `${(i/(rows.length-1))*100},${92-((v-min)/span)*72}`
  }).filter(Boolean).join(' ');

  return (
    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "120px", overflow: "visible" }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
        <span>Min: {min.toFixed(1)} {unit}</span>
        <span>Maks: {max.toFixed(1)} {unit}</span>
      </div>
    </div>
  )
}

export default function Page(){ 
  return <Suspense fallback={<div style={{padding: "40px", textAlign: "center", color: "#64748b"}}>YÃ¼kleniyor...</div>}><FamilyContent/></Suspense>; 
}

function FamilyContent(){
  const sp=useSearchParams(), initial=sp.get('profile')||'me';
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [selected,setSelected]=useState<string>(initial);
  const [growth,setGrowth]=useState<any[]>([]);
  const [events,setEvents]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  
  const current=useMemo(()=>profiles.find(p=>p.id===selected),[profiles,selected]);
  
  const loadProfiles=()=>fetch('/api/health/special-profiles').then(r=>r.ok?r.json():[]).then((x:Profile[])=>{
    setProfiles(x);
    if(selected!=='me'&&!x.some(p=>p.id===selected)) setSelected('me');
  });
  
  useEffect(()=>{loadProfiles()},[]);
  
  useEffect(()=>{
    if(!current){ setGrowth([]); setEvents([]); return; }
    if(current.type==='CHILD'){
      fetch('/api/health/growth?profileId='+current.id).then(r=>r.ok?r.json():[]).then(setGrowth);
    } else {
      fetch('/api/health/pregnancy-events?profileId='+current.id).then(r=>r.ok?r.json():[]).then(setEvents);
    }
  },[current?.id]);

  async function addGrowth(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!current)return;
    const form = e.currentTarget;
    const f=new FormData(form);
    const body={profileId:current.id,...Object.fromEntries(f.entries())};
    const r=await fetch('/api/health/growth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    setMsg(r.ok?'BÃ¼yÃ¼me kaydÄ± eklendi.':j.error||'Kaydedilemedi');
    if(r.ok){
      form.reset();
      fetch('/api/health/growth?profileId='+current.id).then(x=>x.json()).then(setGrowth);
      setTimeout(()=>setMsg(''), 3000);
    }
  }

  async function toggleEvent(id:string,completed:boolean){
    const r=await fetch('/api/health/pregnancy-events',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,completed})});
    if(r.ok&&current) fetch('/api/health/pregnancy-events?profileId='+current.id).then(x=>x.json()).then(setEvents);
  }

  async function addEvent(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!current)return;
    const form = e.currentTarget;
    const f=new FormData(form);
    const body={profileId:current.id,...Object.fromEntries(f.entries())};
    const r=await fetch('/api/health/pregnancy-events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    setMsg(r.ok?'Takvim kaydÄ± eklendi.':j.error||'Kaydedilemedi');
    if(r.ok){
      form.reset();
      fetch('/api/health/pregnancy-events?profileId='+current.id).then(x=>x.json()).then(setEvents);
      setTimeout(()=>setMsg(''), 3000);
    }
  }

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/health/family-hub" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> Aile Paneline DÃ¶n
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">BÃ¼yÃ¼me & Gebelik</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>SaÄŸlÄ±k Takibi</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>Profiliniz ile Ã¶zel Ã§ocuk ve gebelik profilleri arasÄ±nda geÃ§iÅŸ yapÄ±n.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px", marginBottom: "24px", WebkitOverflowScrolling: "touch" }}>
        <button 
          onClick={()=>setSelected('me')}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", border: selected === 'me' ? "2px solid #0284c7" : "1px solid #cbd5e1", background: selected === 'me' ? "#f0f9ff" : "#fff", color: selected === 'me' ? "#0369a1" : "#475569", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
        >
          <User size={18} weight={selected==='me' ? "duotone" : "regular"} /> Benim SaÄŸlÄ±ÄŸÄ±m
        </button>
        {profiles.map(p=>(
          <button 
            key={p.id}
            onClick={()=>setSelected(p.id)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", border: selected === p.id ? `2px solid ${p.type==='CHILD' ? '#16a34a' : '#db2777'}` : "1px solid #cbd5e1", background: selected === p.id ? (p.type==='CHILD' ? '#f0fdf4' : '#fdf2f8') : "#fff", color: selected === p.id ? (p.type==='CHILD' ? '#15803d' : '#be185d') : "#475569", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
          >
            {p.type==='CHILD' ? <Baby size={18} weight={selected===p.id ? "duotone" : "regular"}/> : <Heartbeat size={18} weight={selected===p.id ? "duotone" : "regular"}/>} 
            {p.name}
          </button>
        ))}
        <Link href="/health/family-profiles" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "100px", border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#64748b", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          <Plus size={16} /> Yeni Profil
        </Link>
      </div>

      {msg && (
        <div style={{ padding: "16px", borderRadius: "12px", background: "#ecfdf5", color: "#047857", marginBottom: "24px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={20} /> {msg}
        </div>
      )}

      {selected==='me' ? (
        <section className="panel" style={{ padding: "32px", borderRadius: "24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "16px", background: "#f1f5f9", borderRadius: "50%", color: "#64748b", marginBottom: "16px" }}>
            <User size={48} weight="duotone" />
          </div>
          <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "8px" }}>Kendi SaÄŸlÄ±k Profiliniz</h2>
          <p style={{ color: "#64748b", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
            KiÅŸisel saÄŸlÄ±k kayÄ±tlarÄ±nÄ±z, laboratuvar sonuÃ§larÄ±nÄ±z ve diÄŸer tÃ¼m saÄŸlÄ±k verileriniz ana SaÄŸlÄ±k Ã–zeti alanÄ±nda tutulur.
          </p>
          <Link href="/health/summary" className="primary" style={{ padding: "12px 24px", borderRadius: "12px", textDecoration: "none" }}>SaÄŸlÄ±k Ã–zetine Git</Link>
        </section>
      ) : current?.type==='CHILD' ? (
        <>
          <section className="panel" style={{ padding: "32px", borderRadius: "24px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "8px" }}>Yeni Ã–lÃ§Ã¼m Ekle</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>{current.name} iÃ§in boy, kilo ve baÅŸ Ã§evresi Ã¶lÃ§Ã¼mlerini kaydedin.</p>
            
            <form onSubmit={addGrowth} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Tarih *</label>
                  <input name="measuredAt" type="date" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Boy (cm)</label>
                  <input name="heightCm" type="number" step="0.1" placeholder="Ã–rn: 75.5" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Kilo (kg)</label>
                  <input name="weightKg" type="number" step="0.01" placeholder="Ã–rn: 9.2" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>BaÅŸ Ã‡evresi (cm)</label>
                  <input name="headCircumferenceCm" type="number" step="0.1" placeholder="Ã–rn: 44.0" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Not</label>
                <input name="notes" placeholder="Ekstra belirtmek istediÄŸiniz bir not..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </div>
              <button className="primary" style={{ padding: "14px", borderRadius: "10px", alignSelf: "flex-start", marginTop: "4px" }}>Ã–lÃ§Ã¼mÃ¼ Kaydet</button>
            </form>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <section className="panel" style={{ padding: "24px", borderRadius: "24px" }}>
              <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Ruler size={20} color="#16a34a" weight="duotone" /> Boy Trendi</h2>
              <MiniChart rows={growth} field="heightCm" unit="cm" color="#16a34a" />
            </section>
            <section className="panel" style={{ padding: "24px", borderRadius: "24px" }}>
              <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Scales size={20} color="#0284c7" weight="duotone" /> Kilo Trendi</h2>
              <MiniChart rows={growth} field="weightKg" unit="kg" color="#0284c7" />
            </section>
          </div>

          <section className="panel" style={{ padding: "24px", borderRadius: "24px" }}>
            <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px" }}>GeÃ§miÅŸ Ã–lÃ§Ã¼mler</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...growth].reverse().map(x=>(
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block", marginBottom: "4px" }}>{new Date(x.measuredAt).toLocaleDateString('tr-TR')}</strong>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>
                      {x.heightCm && <strong style={{ color: "#16a34a" }}>Boy: {x.heightCm} cm</strong>}
                      {x.weightKg && <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>}
                      {x.weightKg && <strong style={{ color: "#0284c7" }}>Kilo: {x.weightKg} kg</strong>}
                      {x.headCircumferenceCm && <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>}
                      {x.headCircumferenceCm && <strong style={{ color: "#8b5cf6" }}>BaÅŸ Ã‡evresi: {x.headCircumferenceCm} cm</strong>}
                    </span>
                  </div>
                </div>
              ))}
              {!growth.length && <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>HenÃ¼z Ã¶lÃ§Ã¼m kaydÄ± bulunmuyor.</div>}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="panel" style={{ padding: "32px", borderRadius: "24px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "8px" }}>Yeni Plan Ekle</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Kontrol randevularÄ±nÄ± ve tetkik hatÄ±rlatmalarÄ±nÄ± {current?.name} iÃ§in takvime ekleyin.</p>
            
            <form onSubmit={addEvent} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>BaÅŸlÄ±k *</label>
                  <input name="title" required placeholder="Ã–rn: 12. Hafta Ultrason KontrolÃ¼" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Tarih / Saat *</label>
                  <input name="startsAt" type="datetime-local" required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>KayÄ±t TÃ¼rÃ¼</label>
                  <select name="kind" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a" }}>
                    <option value="checkup">Kontrol</option>
                    <option value="test">Tetkik</option>
                    <option value="reminder">HatÄ±rlatma</option>
                    <option value="other">DiÄŸer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Ek Notlar</label>
                  <input name="notes" placeholder="Doktora sorulacaklar vb." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <button className="primary" style={{ padding: "14px", borderRadius: "10px", alignSelf: "flex-start", marginTop: "4px" }}>Takvime Ekle</button>
            </form>
          </section>

          <section className="panel" style={{ padding: "24px", borderRadius: "24px" }}>
            <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px" }}>Planlananlar</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {events.map(x=>(
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: x.completedAt ? "#f8fafc" : "#fff", borderRadius: "12px", border: "1px solid", borderColor: x.completedAt ? "#e2e8f0" : "#cbd5e1", opacity: x.completedAt ? 0.7 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button 
                      onClick={()=>toggleEvent(x.id,!x.completedAt)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: x.completedAt ? "#16a34a" : "#cbd5e1" }}
                      title={x.completedAt ? "TamamlandÄ±" : "Tamamla"}
                    >
                      {x.completedAt ? <CheckCircle size={28} weight="fill" /> : <Circle size={28} weight="bold" />}
                    </button>
                    <div>
                      <strong style={{ display: "block", color: x.completedAt ? "#64748b" : "#0f172a", fontSize: "16px", textDecoration: x.completedAt ? "line-through" : "none", marginBottom: "4px" }}>{x.title}</strong>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>{new Date(x.startsAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} â€¢ {x.kind === 'checkup' ? 'Kontrol' : x.kind === 'test' ? 'Tetkik' : x.kind === 'reminder' ? 'HatÄ±rlatma' : 'DiÄŸer'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!events.length && <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>PlanlanmÄ±ÅŸ bir etkinlik bulunmuyor.</div>}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

