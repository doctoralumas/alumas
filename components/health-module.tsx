"use client";
import {useEffect,useMemo,useState} from "react";
import HealthTrendChart from "@/components/health-trend-chart";
import HealthTargetEditor from "@/components/health-target-editor";

type Mode="blood-pressure"|"glucose"|"sleep";
const fmt=(d:string)=>new Date(d).toLocaleString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const modeDefs:Record<Mode,{metric:string;label:string;unit:string}[]>={
  "blood-pressure":[{metric:"bp-systolic",label:"Sistolik hedefi",unit:"mmHg"},{metric:"bp-diastolic",label:"Diyastolik hedefi",unit:"mmHg"}],
  glucose:[{metric:"glucose",label:"Kan şekeri hedefi",unit:"mg/dL"}],
  sleep:[{metric:"sleep-hours",label:"Uyku süresi hedefi",unit:"saat"}],
};

export default function HealthModule({mode}:{mode:Mode}){
 const [rows,setRows]=useState<any[]>([]),[targets,setTargets]=useState<any[]>([]),[open,setOpen]=useState(false),[msg,setMsg]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 const endpoint=`/api/health/${mode}`;
 const load=()=>{const q=new URLSearchParams();if(from)q.set("from",from);if(to)q.set("to",to);fetch(`${endpoint}?${q}`).then(r=>r.ok?r.json():[]).then(setRows)};
 const loadTargets=()=>fetch('/api/health/targets').then(r=>r.ok?r.json():[]).then(setTargets);
 useEffect(()=>{load();loadTargets()},[endpoint]);
 const title=mode==="blood-pressure"?"Tansiyon Takibi":mode==="glucose"?"Kan Şekeri Takibi":"Uyku Takibi";
 const latest=rows[0];
 const seriesRows=useMemo(()=>rows.slice(0,14).reverse(),[rows]);
 const targetMap=useMemo(()=>new Map(targets.map(t=>[t.metric,t])),[targets]);
 const glucoseMg=(r:any)=>String(r?.unit||"mg/dL").toLowerCase()==="mmol/l"?Number(r.value)*18.0182:Number(r?.value);
 function warningFor(r:any){
   if(!r)return null;
   const outside=(metric:string,value:number)=>{const t:any=targetMap.get(metric);return !!t&&t.enabled&&((t.minValue!=null&&value<t.minValue)||(t.maxValue!=null&&value>t.maxValue));};
   if(mode==="blood-pressure"&&(outside("bp-systolic",r.systolic)||outside("bp-diastolic",r.diastolic)))return "Tanımladığın hedef aralığının dışında";
   if(mode==="glucose"&&outside("glucose",glucoseMg(r)))return "Tanımladığın hedef aralığının dışında";
   if(mode==="sleep"){const h=(new Date(r.endedAt).getTime()-new Date(r.startedAt).getTime())/3600000;if(outside("sleep-hours",h))return "Tanımladığın hedef sürenin dışında";}
   return null;
 }
 const latestWarning=warningFor(latest);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setMsg("");const f=new FormData(e.currentTarget),body:any=Object.fromEntries(f.entries());const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();if(!r.ok){setMsg(j.error||"Kaydedilemedi");return}setOpen(false);e.currentTarget.reset();load();}
 async function remove(id:string){if(!confirm("Bu kaydı silmek istiyor musun?"))return;await fetch(`${endpoint}?id=${encodeURIComponent(id)}`,{method:"DELETE"});load();}
 const chart=mode==="blood-pressure"?{labels:seriesRows.map(r=>new Date(r.measuredAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'})),series:[{name:'Sistolik',values:seriesRows.map(r=>r.systolic)},{name:'Diyastolik',values:seriesRows.map(r=>r.diastolic)}]}:mode==="glucose"?{labels:seriesRows.map(r=>new Date(r.measuredAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'})),series:[{name:'Kan şekeri (mg/dL)',values:seriesRows.map(r=>Number(glucoseMg(r).toFixed(1)))}]}:{labels:seriesRows.map(r=>new Date(r.startedAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'})),series:[{name:'Uyku (saat)',values:seriesRows.map(r=>Number(((new Date(r.endedAt).getTime()-new Date(r.startedAt).getTime())/3600000).toFixed(1)))}]};
 return <div className="page"><div className="page-title row between"><div><span className="kicker">Sağlık takibi</span><h1>{title}</h1><p>Ölçümlerini kaydet, geçmişini ve trendini tek ekranda gör.</p></div><button className="primary" onClick={()=>setOpen(v=>!v)}>+ Yeni kayıt</button></div>
 {open&&<form className="panel health-form-v14" onSubmit={submit}>{mode==="blood-pressure"&&<><label>Sistolik<input name="systolic" type="number" defaultValue="118" required/></label><label>Diyastolik<input name="diastolic" type="number" defaultValue="76" required/></label><label>Nabız<input name="pulse" type="number" defaultValue="72"/></label><label>Ölçüm zamanı<input name="measuredAt" type="datetime-local"/></label></>}{mode==="glucose"&&<><label>Değer<input name="value" type="number" step="0.1" defaultValue="92" required/></label><label>Birim<select name="unit"><option>mg/dL</option><option>mmol/L</option></select></label><label>Durum<select name="context"><option value="FASTING">Açlık</option><option value="POSTPRANDIAL">Tokluk</option><option value="RANDOM">Rastgele</option><option value="BEDTIME">Gece</option></select></label><label>Ölçüm zamanı<input name="measuredAt" type="datetime-local"/></label></>}{mode==="sleep"&&<><label>Uyku başlangıcı<input name="startedAt" type="datetime-local" required/></label><label>Uyanış<input name="endedAt" type="datetime-local" required/></label><label>Kalite<select name="quality"><option value="5">Çok iyi</option><option value="4">İyi</option><option value="3">Orta</option><option value="2">Zayıf</option><option value="1">Çok zayıf</option></select></label></>}<label className="wide">Not<input name="note" placeholder="İsteğe bağlı not"/></label><div className="wide row gap"><button className="primary">Kaydet</button><button type="button" className="secondary" onClick={()=>setOpen(false)}>Vazgeç</button></div>{msg&&<p className="wide form-message">{msg}</p>}</form>}
 {latestWarning&&<div className="target-warning-v15"><b>Hedef bildirimi</b><span>{latestWarning}. Bu bildirim tıbbi tanı değildir; endişen varsa sağlık profesyoneline danış.</span></div>}
 <div className="tracker-summary-v14">{mode==="blood-pressure"?<><div className="tracker-hero mint-v14"><span>Son ölçüm</span><strong>{latest?`${latest.systolic} / ${latest.diastolic}`:"—"}</strong><small>mmHg {latest?.pulse?`· Nabız ${latest.pulse}`:""}</small></div><div className="tracker-hero lime-v14"><span>Kayıt sayısı</span><strong>{rows.length}</strong><small>Son 60 kayıt</small></div></>:mode==="glucose"?<><div className="tracker-hero peach-v14"><span>Son ölçüm</span><strong>{latest?latest.value:"—"}</strong><small>{latest?.unit||"mg/dL"} · {latest?.context==="FASTING"?"Açlık":latest?.context==="POSTPRANDIAL"?"Tokluk":"Ölçüm"}</small></div><div className="tracker-hero pink-v14"><span>Kayıt sayısı</span><strong>{rows.length}</strong><small>Son 60 kayıt</small></div></>:<><div className="tracker-hero purple-v14"><span>Son uyku</span><strong>{latest?`${((new Date(latest.endedAt).getTime()-new Date(latest.startedAt).getTime())/3600000).toFixed(1)} saat`:"—"}</strong><small>Kalite {latest?.quality||"—"}/5</small></div><div className="tracker-hero sky-v14"><span>Kayıt sayısı</span><strong>{rows.length}</strong><small>Son 45 gece</small></div></>}</div>
 <section className="panel health-section"><div className="row between"><div><h2>Trend grafiği</h2><p>Seçtiğin tarih aralığındaki kayıtlar.</p></div><div className="row gap"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input type="date" value={to} onChange={e=>setTo(e.target.value)}/><button className="secondary compact" onClick={load}>Filtrele</button></div></div><HealthTrendChart labels={chart.labels} series={chart.series}/></section>
 <HealthTargetEditor defs={modeDefs[mode]} onChange={loadTargets}/>
 <section className="panel health-section"><h2>Geçmiş kayıtlar</h2><div className="tracker-list-v14">{rows.length?rows.map(r=>{const warning=warningFor(r);return <div className={`tracker-row-v14 ${warning?'row-warning-v15':''}`} key={r.id}><div><b>{mode==="blood-pressure"?`${r.systolic}/${r.diastolic} mmHg`:mode==="glucose"?`${r.value} ${r.unit}`:`${((new Date(r.endedAt).getTime()-new Date(r.startedAt).getTime())/3600000).toFixed(1)} saat`}</b><span>{mode==="sleep"?`${fmt(r.startedAt)} → ${fmt(r.endedAt)}`:fmt(r.measuredAt)}{warning?` · ${warning}`:''}</span></div><button className="secondary compact" onClick={()=>remove(r.id)}>Sil</button></div>}):<p>Henüz kayıt yok.</p>}</div></section></div>
}
