"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Result={
  source:string; id:string; name:string; type:string; address?:string|null;
  distanceKm?:number|null; openNow?:boolean|null; isOnDuty?:boolean;
  insuranceMatch?:boolean|null; verified?:boolean; rating?:number|null;
  googleMapsUri?:string|null; score:number; why?:string[];
};

export default function LiveHealthResults(){
  const t = useTranslations("luma");
  const [kind,setKind]=useState("hospital");
  const [rows,setRows]=useState<Result[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function load(nextKind=kind){
    setKind(nextKind); setLoading(true); setError("");
    if(!navigator.geolocation){
      setError(t("geoUnsupported")); setLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const r=await fetch("/api/ai/facilities/live",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({kind:nextKind,lat:pos.coords.latitude,lng:pos.coords.longitude,radiusMeters:10000})
        });
        const data=await r.json();
        if(!r.ok) throw new Error(data.error||t("fetchError"));
        setRows(data.results||[]);
      }catch(e:any){setError(e.message||t("fetchError"));}
      finally{setLoading(false);}
    },()=>{setError(t("permissionDenied"));setLoading(false);},
    {enableHighAccuracy:false,timeout:10000,maximumAge:120000});
  }

  const labels:any={hospital:t("categories.hospital"),clinic:t("categories.clinic"),pharmacy:t("categories.pharmacy")};
  return <section className="live-health">
    <div className="live-health-head">
      <div><h2>{t("liveHealthTitle")}</h2><p>{t("liveHealthDesc")}</p></div>
      <button onClick={()=>load(kind)} disabled={loading}>{loading?t("searchingAction"):t("searchLocation")}</button>
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
          {r.verified&&<span>{t("verifiedBadge")}</span>}
          {r.isOnDuty&&<span>{t("onDutyBadge")}</span>}
          {r.openNow===true&&<span>{t("openBadge")}</span>}
        </div>
        <h3>{r.name}</h3>
        <p>{r.address||t("noAddress")}</p>
        <div className="live-meta">
          {r.distanceKm!=null&&<b>{r.distanceKm} km</b>}
          {r.rating!=null&&<b>★ {r.rating}</b>}
          {r.insuranceMatch===true&&<b>{t("insuranceMatch")}</b>}
        </div>
        {r.googleMapsUri&&<a href={r.googleMapsUri} target="_blank" rel="noreferrer">{t("openMap")}</a>}
      </article>)}
    </div>
    <small className="live-note">{t("disclaimer")}</small>
  </section>;
}
