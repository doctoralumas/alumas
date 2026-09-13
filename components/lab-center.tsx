"use client";
import {useEffect,useMemo,useState,useRef} from "react";
import HealthTrendChart from "@/components/health-trend-chart";
import LabPanelTemplates from "@/components/lab-panel-templates";
import { ChartLineUp, Flask } from "@phosphor-icons/react";

type Lab={id:string;testName:string;panel?:string;value:string;numericValue?:number|null;unit?:string;reference?:string;referenceLow?:number|null;referenceHigh?:number|null;status:string;measuredAt:string;note?:string};

export default function LabCenter(){
  const [rows,setRows]=useState<Lab[]>([]);
  const [selected,setSelected]=useState('');
  const [comments,setComments]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [draft,setDraft]=useState({panel:'',testName:'',unit:''});
  
  const formRef = useRef<HTMLFormElement>(null);

  const load=()=>{
    fetch('/api/health/labs').then(r=>r.ok?r.json():[]).then(setRows);
    fetch('/api/health/lab-comments').then(r=>r.ok?r.json():[]).then(setComments);
  };
  
  useEffect(()=>{load()},[]);
  
  const names=useMemo(()=>Array.from(new Set(rows.map(x=>x.testName))),[rows]);
  useEffect(()=>{if(!selected&&names[0])setSelected(names[0])},[names,selected]);
  
  const trend=rows.filter(x=>x.testName===selected&&x.numericValue!=null).slice().reverse();
  const commentMap=useMemo(()=>comments.reduce((m:any,c:any)=>{(m[c.labResultId]??=[]).push(c);return m},{}),[comments]);
  
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setIsSubmitting(true);
    setMsg('');
    const f=new FormData(e.currentTarget);
    const body=Object.fromEntries(f.entries());
    
    try {
      const r=await fetch('/api/health/labs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(r.ok){
        setMsg('Laboratuvar sonucu başarıyla kaydedildi.');
        e.currentTarget.reset();
        setDraft({panel:'',testName:'',unit:''});
        load();
      } else {
        setMsg(j.error||'Kaydedilemedi');
      }
    } catch(err) {
      setMsg('Sunucuya bağlanılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">Yapılandırılmış sonuçlar</span>
        <h1>Laboratuvar</h1>
        <p>Sayısal sonuçları referans aralıklarıyla kaydet, panel şablonlarını kullan ve doktor yorumlarını aynı yerde gör.</p>
      </div>
      
      <LabPanelTemplates onPick={(panel,testName,unit)=>{
        setDraft({panel,testName,unit:unit||''});
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }}/>
      
      <section className="panel health-section">
        <h2>Yeni sonuç</h2>
        <form className="lab-form-v20" onSubmit={submit} ref={formRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Panel (Örn. Hemogram)
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="panel" placeholder="Panel adı..." value={draft.panel} onChange={e=>setDraft(v=>({...v,panel:e.target.value}))}/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Test Adı *
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="testName" placeholder="Test adını girin..." required value={draft.testName} onChange={e=>setDraft(v=>({...v,testName:e.target.value}))}/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Sonuç Değeri *
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="value" placeholder="Sonucu girin..." required/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Birim
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="unit" placeholder="Örn. mg/dL" value={draft.unit} onChange={e=>setDraft(v=>({...v,unit:e.target.value}))}/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Referans Alt Sınır
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="referenceLow" type="number" step="any" placeholder="Alt sınır"/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Referans Üst Sınır
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="referenceHigh" type="number" step="any" placeholder="Üst sınır"/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)'}}>
            Ölçüm Tarihi
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="measuredAt" type="datetime-local"/>
          </label>
          
          <label style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--muted)', gridColumn: '1 / -1'}}>
            Not (İsteğe bağlı)
            <input style={{border:'1px solid rgba(18,63,107,0.15)',padding:'12px',borderRadius:'12px',color:'#123f6b'}} name="note" placeholder="Eklemek istediğiniz not..."/>
          </label>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="primary" disabled={isSubmitting} style={{ minWidth: '140px', padding: '12px 24px', fontSize: '15px' }}>
              {isSubmitting ? 'Kaydediliyor...' : 'Sonucu Kaydet'}
            </button>
          </div>
        </form>
        {msg&&<div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', backgroundColor: msg.includes('başarıyla') ? '#d9eee9' : '#fae7ef', color: msg.includes('başarıyla') ? '#0b2545' : '#b93b36', fontSize: '14px' }}>{msg}</div>}
      </section>
      
      <section className="panel health-section">
        <div className="row between">
          <div>
            <h2>Test trendi</h2>
            <p>Aynı testin sayısal sonuçları.</p>
          </div>
          {names.length > 0 && (
            <select className="report-select-v15" value={selected} onChange={e=>setSelected(e.target.value)}>
              {names.map(n=><option key={n}>{n}</option>)}
            </select>
          )}
        </div>
        {trend.length > 0 ? (
          <HealthTrendChart labels={trend.map(x=>new Date(x.measuredAt).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit'}))} series={[{name:trend[0]?.unit||'Değer',values:trend.map(x=>Number(x.numericValue))}]}/>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(11,37,69,0.4)', background: 'rgba(18,63,107,0.02)', borderRadius: '16px', marginTop: '16px', border: '1px dashed rgba(18,63,107,0.1)' }}>
            <ChartLineUp size={48} weight="duotone" style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', marginBottom: '4px', color: '#123f6b' }}>Yeterli Veri Yok</h3>
            <p style={{ fontSize: '14px' }}>Grafik oluşturmak için önce yukarıdan sayısal sonuçlara sahip bir test kaydedin.</p>
          </div>
        )}
      </section>
      
      <section className="panel health-section">
        <h2>Son sonuçlar</h2>
        <div className="lab-list" style={{ marginTop: '16px' }}>
          {rows.map(l=>
            <div className="lab-result-wrap-v18" key={l.id} style={{ marginBottom: '12px', background: '#fff', border: '1px solid rgba(18,63,107,0.08)', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div className="lab-row" style={{ display: 'grid', gridTemplateColumns: '1fr max-content max-content max-content', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ fontSize: '16px', color: '#123f6b' }}>{l.testName}</b>
                  <span style={{ fontSize: '12px', color: 'rgba(11,37,69,0.6)' }}>{l.panel?l.panel+' · ':''}{new Date(l.measuredAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <strong style={{ fontSize: '18px', color: '#123f6b' }}>{l.value} <span style={{fontSize: '14px', fontWeight: 'normal', color: 'rgba(11,37,69,0.7)'}}>{l.unit||''}</span></strong>
                <span style={{ fontSize: '13px', color: 'rgba(11,37,69,0.6)', background: 'rgba(18,63,107,0.04)', padding: '4px 8px', borderRadius: '8px' }}>
                  {l.referenceLow!=null||l.referenceHigh!=null?`${l.referenceLow??'—'} – ${l.referenceHigh??'—'}`:l.reference||'Ref. Yok'}
                </span>
                <em style={{ 
                  fontStyle: 'normal', fontSize: '13px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '100px',
                  background: l.status==='normal' ? '#d9eee9' : '#fae7ef',
                  color: l.status==='normal' ? '#0d4a3e' : '#b93b36'
                }}>
                  {l.status==='normal'?'Normal':l.status==='high'?'Yüksek':'Düşük'}
                </em>
              </div>
              {commentMap[l.id]?.map((c:any)=>
                <div className="lab-comment-v18" key={c.id} style={{ marginTop: '12px', padding: '12px', background: 'rgba(18,63,107,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ fontSize: '13px', color: '#123f6b' }}>{c.doctor?.name||'Doktor Değerlendirmesi'}</b>
                  <span style={{ fontSize: '14px', color: 'rgba(11,37,69,0.8)' }}>{c.body}</span>
                  <small style={{ fontSize: '11px', color: 'rgba(11,37,69,0.5)' }}>{new Date(c.createdAt).toLocaleString('tr-TR')}</small>
                </div>
              )}
            </div>
          )}
          {!rows.length && (
            <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed rgba(18,63,107,0.1)' }}>
              <Flask size={40} weight="duotone" color="rgba(18,63,107,0.3)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '15px', color: 'rgba(11,37,69,0.7)', margin: 0 }}>Henüz sonuç yok.</h3>
            </div>
          )}
        </div>
      </section>
      
      <div className="health-disclaimer-v15" style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'rgba(11,37,69,0.5)' }}>
        Alumas laboratuvar sonuçlarını düzenler ve görselleştirir; sonuçların klinik anlamı için sağlık profesyoneli değerlendirmesi gerekir.
      </div>
    </div>
  )
}
