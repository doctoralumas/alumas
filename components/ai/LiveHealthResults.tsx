"use client";
import { useState } from "react";

type Result={
  source:string; id:string; name:string; type:string; address?:string|null;
  distanceKm?:number|null; openNow?:boolean|null; isOnDuty?:boolean;
  insuranceMatch?:boolean|null; verified?:boolean; rating?:number|null;
  googleMapsUri?:string|null; score:number; why?:string[];
};

export default function LiveHealthResults(){
  const [kind,setKind]=useState("hospital");
  const [rows,setRows]=useState<Result[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function load(nextKind=kind){
    setKind(nextKind); setLoading(true); setError("");
    if(!navigator.geolocation){
      setError("Bu cihaz konum hizmetini desteklemiyor."); setLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const r=await fetch("/api/ai/facilities/live",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({kind:nextKind,lat:pos.coords.latitude,lng:pos.coords.longitude,radiusMeters:10000})
        });
        const data=await r.json();
        if(!r.ok) throw new Error(data.error||"Sonuçlar alınamadı.");
        setRows(data.results||[]);
      }catch(e:any){setError(e.message||"Sonuçlar alınamadı.");}
      finally{setLoading(false);}
    },()=>{setError("Yakındaki sonuçları göstermek için konum izni gerekli.");setLoading(false);},
    {enableHighAccuracy:false,timeout:10000,maximumAge:120000});
  }

  const labels:any={hospital:"Hastaneler",clinic:"Klinikler",pharmacy:"Açık eczaneler"};
  return <section className="live-health">
    <div className="live-health-head">
      <div><h2>Yakınınızdaki sağlık hizmetleri</h2><p>Konumunuza göre canlı ve doğrulanmış seçenekler.</p></div>
      <button onClick={()=>load(kind)} disabled={loading}>{loading?"Aranıyor…":"Konumumda ara"}</button>
    </div>
    <div className="live-tabs">
      {["hospital","clinic","pharmacy"].map(k=>
        <button key={k} className={kind===k?"active":""} onClick={()=>load(k)}>{labels[k]}</button>
      )}
    </div>
    {error&&<div className="live-error">{error}</div>}
    <div className="live-grid">
      {rows.map(r=><article className="live-card" key={`${r.source}-${r.id}`}>
        <div className="live-badges">
          {r.verified&&<span>✓ Alumas doğrulandı</span>}
          {r.isOnDuty&&<span>Nöbetçi</span>}
          {r.openNow===true&&<span>Açık</span>}
        </div>
        <h3>{r.name}</h3>
        <p>{r.address||"Adres bilgisi mevcut değil"}</p>
        <div className="live-meta">
          {r.distanceKm!=null&&<b>{r.distanceKm} km</b>}
          {r.rating!=null&&<b>★ {r.rating}</b>}
          {r.insuranceMatch===true&&<b>Sigorta uyumlu</b>}
        </div>
        {r.googleMapsUri&&<a href={r.googleMapsUri} target="_blank" rel="noreferrer">Haritada aç</a>}
      </article>)}
    </div>
    <small className="live-note">Ben sağlık profesyoneli değilim. Açık eczane bilgisi nöbetçi eczane anlamına gelmez.</small>
  </section>;
}
