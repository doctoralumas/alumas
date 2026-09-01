"use client";
import Link from "next/link";
import {FormEvent, useState} from "react";
import {MapPin, Search, ShieldCheck, Stethoscope, CalendarDays} from "@/components/icons";

type Result = {
  source:string;
  summary:string;
  commentary:string;
  sources:Array<{id:string;label:string;kind:string;authority:string;description:string;publisher?:string;url?:string;verifiedAt?:string|null}>;
  intent:{triage:"routine"|"urgent"|"emergency";specialty:string|null;facility:string|null;locationHint:string|null;confidence:number;followUpQuestion:string|null};
  doctors:Array<{id:string;slug:string;name:string;title:string;specialty:string;hospital:string;city:string;rating:number;reviewCount:number;price:number;organization?:{name:string;district?:string|null}|null;nextAvailable?:string|null}>;
  organizations:Array<{id:string;slug:string;name:string;type:string;city:string;district?:string|null;address:string;phone:string;isOnDuty:boolean}>;
  safety:{disclaimer:string;medicalKnowledgeConnected:boolean;knowledgeMode?:string;policy:string};
  followUps?:string[];
  personalization?:{enabled:boolean;note:string|null;usedFields:string[];dataMinimization:boolean;modelDisclosure:string};
};

const prompts=["Başım ağrıyor","Diş ağrısı","Çocuğumun ateşi var","Tahlil sonuçlarım","Yakın eczane"];

export default function HealthNavigator({compact=false}:{compact?:boolean}){
  const [message,setMessage]=useState("");
  const [result,setResult]=useState<Result|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [history,setHistory]=useState<Array<{role:"user"|"assistant";text:string}>>([]);
  const [personalize,setPersonalize]=useState(false);

  async function submit(e?:FormEvent){
    e?.preventDefault();
    if(message.trim().length<3)return;
    setLoading(true);setError("");
    try{
      const res=await fetch("/api/ai/navigate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message,history,personalize})});
      const json=await res.json();
      if(!res.ok) throw new Error(json.error||"İstek tamamlanamadı");
      setResult(json.data);
      setHistory(h=>[...h,{role:"user" as const,text:message},{role:"assistant" as const,text:json.data.commentary}].slice(-8));
    }catch(err){setError(err instanceof Error?err.message:"Bir hata oluştu");}
    finally{setLoading(false)}
  }

  return <section className={`ai-navigator ${compact?"compact":""}`}>
    <div className="ai-navigator-head">
      <div>
        <span className="ai-kicker"><ShieldCheck size={15}/> Güvenli sağlık navigasyonu</span>
        <h1>{compact?"Size en uygun sağlık hizmetini bulalım.":"Size nasıl yardımcı olabilirim?"}</h1>
        <p>İhtiyacınızı doğal şekilde yazın. Alumas sizi uygun branş, doktor veya sağlık kurumuna yönlendirsin.</p>
      </div>
      <img src="/brand/alumas-logo.png" className="ai-brand-logo" alt="Alumas"/>
    </div>

    <form className="ai-search-form" onSubmit={submit}>
      <Search size={20}/>
      <input value={message} onChange={e=>setMessage(e.target.value)} placeholder="Örn. 3 gündür dizim ağrıyor, Ataşehir'deyim..." aria-label="Sağlık ihtiyacınızı yazın"/>
      <button disabled={loading||message.trim().length<3}>{loading?"Aranıyor…":"Bul"}</button>
    </form>
    <div className="ai-prompt-row">{prompts.map(p=><button key={p} onClick={()=>setMessage(p)} type="button">{p}</button>)}</div>
    <label className="ai-personalize-toggle"><input type="checkbox" checked={personalize} onChange={e=>setPersonalize(e.target.checked)}/><span><b>Sağlık profilimi kullanarak kişiselleştir</b><small>Yalnız giriş yaptıysanız ve açık izin verirseniz yaş aralığı, aktif durumlar, ilaçlar ve alerjiler gibi gerekli alanlar kullanılır. Bu sürümde kişisel sağlık verileri harici bir dil modeline gönderilmez.</small></span></label>
    {error&&<div className="ai-error">{error}</div>}

    {result&&<div className="ai-result-wrap">
      <div className={`ai-safety ai-${result.intent.triage}`}>
        <div><ShieldCheck size={18}/><strong>{result.intent.triage==="emergency"?"Acil yönlendirme":result.intent.triage==="urgent"?"Hızlı değerlendirme":"Yönlendirme sonucu"}</strong></div>
        <p>{result.summary}</p>
        <div className="ai-commentary"><b>Alumas yorumu</b><span>{result.commentary}</span></div>
        {result.personalization?.enabled&&result.personalization.note&&<div className="ai-personalization-note"><b>Kişiselleştirme</b><span>{result.personalization.note}</span><small>{result.personalization.modelDisclosure}</small></div>}
        {result.intent.followUpQuestion&&<p><b>Ek bilgi:</b> {result.intent.followUpQuestion}</p>}
        {result.intent.triage==="emergency"&&<div className="ai-emergency-actions"><a href="tel:112">112’yi Ara</a><Link href="/nearby">En Yakın Acil</Link></div>}
      </div>

      {result.doctors.length>0&&<div className="ai-results-section">
        <div className="ai-section-title"><span><Stethoscope size={18}/> Önerilen doğrulanmış uzmanlar</span><small>Güven {(result.intent.confidence*100).toFixed(0)}%</small></div>
        <div className="ai-doctor-list">{result.doctors.map(d=><article key={d.id} className="ai-doctor-card">
          <div className="ai-avatar">{d.name.split(" ").slice(-2).map(x=>x[0]).join("").slice(0,2)}</div>
          <div className="ai-doctor-copy"><b>{d.title} {d.name}</b><span>{d.specialty}</span><small>{d.organization?.name||d.hospital} · {d.organization?.district||d.city}</small><div>★ {d.rating.toFixed(1)} <em>({d.reviewCount})</em></div></div>
          <div className="ai-doctor-actions">{d.nextAvailable&&<small><CalendarDays size={13}/> {new Date(d.nextAvailable).toLocaleString("tr-TR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</small>}<Link href={`/doctors/${d.slug}`}>Profili Gör</Link></div>
        </article>)}</div>
      </div>}

      {result.organizations.length>0&&<div className="ai-results-section">
        <div className="ai-section-title"><span><MapPin size={18}/> Uygun sağlık kurumları</span></div>
        <div className="ai-org-list">{result.organizations.map(o=><Link href={`/organizations/${o.slug}`} key={o.id}><b>{o.name}</b><span>{o.district?`${o.district}, `:""}{o.city}</span><small>{o.isOnDuty?"Şu an nöbetçi/açık bilgisi mevcut":"Doğrulanmış kurum"}</small></Link>)}</div>
      </div>}

      {result.doctors.length===0&&result.organizations.length===0&&result.intent.triage!=="emergency"&&<div className="ai-empty-result">
        <b>Doğrulanmış eşleşme bulunamadı.</b><span>Filtreleri genişletebilir veya tüm doktor ve kurumları inceleyebilirsiniz.</span><div><Link href="/doctors">Doktorları Gör</Link><Link href="/organizations">Kurumları Gör</Link></div>
      </div>}
      <section className="ai-source-panel">
        <div className="ai-section-title"><span><ShieldCheck size={18}/> Bu cevabın kaynakları</span><small>{result.sources.length} kaynak</small></div>
        <div className="ai-source-list">{result.sources.map(src=><article key={src.id}>
          <div><b>{src.label}</b><span>{src.authority==="internal_verified"?"Doğrulanmış Alumas verisi":src.authority==="external_medical"?"Tıbbi bilgi kaynağı":"Kontrollü yönlendirme kuralı"}</span></div>
          <p>{src.description}</p>{src.url&&<a href={src.url} target="_blank" rel="noreferrer">Kaynağı aç ↗</a>}{src.publisher&&<small>{src.publisher}{src.verifiedAt?` · Son kontrol ${src.verifiedAt}`:""}</small>}
        </article>)}</div>
        <div className="ai-kb-warning ai-kb-ok"><b>Kaynaklı bilgi modu aktif</b><span>Tıbbi açıklamalar yalnız sürüm kontrollü ve onaylı kaynak özetleriyle sınırlandırılır. Tanı veya reçete üretilmez.</span></div>
      </section>
      {result.followUps&&result.followUps.length>0&&<section className="ai-followups">
        <b>Devam etmek için sorabilirsiniz</b>
        <div>{result.followUps.map(q=><button key={q} type="button" onClick={()=>{setMessage(q);}}>{q}</button>)}</div>
      </section>}
      <p className="ai-disclaimer"><strong>{result.safety.disclaimer}</strong></p>
    </div>}
    <p className="ai-always-disclaimer"><strong>Ben sağlık profesyoneli değilim.</strong> Alumas yönlendirme ve bilgilendirme sağlar; tanı ve tedavi için yetkili sağlık profesyoneline başvurun.</p>
  </section>
}
