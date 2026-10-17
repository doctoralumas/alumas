'use client';
import {useEffect,useState} from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Stethoscope, Plus, CheckCircle, Clock, CalendarBlank, WarningCircle, User, CaretRight, X } from "@phosphor-icons/react";

export default function DiagnosticRequests({patientId,doctorMode=false}:{patientId?:string;doctorMode?:boolean}){
  const t = useTranslations('health.healthTasks');
  const locale = useLocale();
  const [rows,setRows]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const [msg,setMsg]=useState('');
  const [isSuccess,setIsSuccess]=useState(false);
  const [loading, setLoading]=useState(true);

  const load=()=>fetch('/api/diagnostic-requests').then(r=>r.ok?r.json():[]).then((x:any[])=>setRows(patientId?x.filter(r=>r.patientId===patientId):x)).finally(()=>setLoading(false));
  useEffect(()=>{load()},[patientId]);

  async function add(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget),b=Object.fromEntries(f.entries());
    const r=await fetch('/api/diagnostic-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...b,patientId})});
    const j=await r.json().catch(()=>({}));
    setIsSuccess(r.ok);
    setMsg(r.ok ? t('createSuccess') : j.error || t('createFailed'));
    if(r.ok){
      setTimeout(() => { setOpen(false); setMsg(""); load(); }, 1500);
    }
  }

  async function status(id:string,s:string){
    await fetch('/api/diagnostic-requests',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:s})});
    load();
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'requested': return { label: t('statusRequested'), icon: <WarningCircle size={20} weight="fill" />, bg: '#fef3c7', color: '#d97706' };
      case 'scheduled': return { label: t('statusScheduled'), icon: <Clock size={20} weight="fill" />, bg: '#e0f2fe', color: '#0284c7' };
      case 'completed': return { label: t('statusCompleted'), icon: <CheckCircle size={20} weight="fill" />, bg: '#dcfce7', color: '#16a34a' };
      case 'cancelled': return { label: t('statusCancelled'), icon: <X size={20} weight="fill" />, bg: '#f1f5f9', color: '#64748b' };
      default: return { label: status, icon: <WarningCircle size={20} />, bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const getCategoryName = (cat: string) => {
    switch(cat) {
      case 'lab': return t('catNameLab');
      case 'imaging': return t('catNameImaging');
      case 'consultation': return t('catNameConsultation');
      default: return t('catNameOther');
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "48px" }}>
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#e0f2fe", padding: "16px", borderRadius: "24px" }}>
            <Stethoscope size={32} weight="duotone" color="#0284c7" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#0284c7" }}>{t('kicker')}</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{t('title')}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{doctorMode ? t('subtitleDoctor') : t('subtitlePatient')}</p>
          </div>
        </div>
        {doctorMode && patientId && (
          <button onClick={()=>setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            {open ? <X size={20} /> : <Plus size={20} />} {open ? t('cancel') : t('newRequest')}
          </button>
        )}
      </div>

      {open && doctorMode && (
        <form onSubmit={add} style={{ background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t('titleLabel')} <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="title" required placeholder={t('titlePlaceholder')} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t('categoryLabel')}</label>
              <select name="category" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px" }}>
                <option value="lab">{t('catOptionLab')}</option>
                <option value="imaging">{t('catOptionImaging')}</option>
                <option value="consultation">{t('catOptionConsultation')}</option>
                <option value="other">{t('catOptionOther')}</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t('dueDateLabel')}</label>
              <input name="dueAt" type="date" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", fontSize: "15px", color: "#475569" }} />
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t('detailsLabel')}</label>
            <textarea name="details" rows={3} placeholder={t('detailsPlaceholder')} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", resize: "none", fontSize: "15px" }} />
          </div>
          <button style={{ padding: "16px", background: "#0284c7", color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer", marginTop: "20px" }}>{t('submit')}</button>
          {msg && <div style={{ background: isSuccess ? '#f0fdf4' : '#fef2f2', color: isSuccess ? '#16a34a' : '#b91c1c', padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, textAlign: "center", marginTop: "16px" }}>{msg}</div>}
        </form>
      )}

      {loading && <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>{t('loading')}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {rows.map(r => {
          const cfg = getStatusConfig(r.status);
          return (
            <div key={r.id} style={{ display: "flex", flexWrap: "wrap", gap: "24px", background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", opacity: r.status === 'completed' || r.status === 'cancelled' ? 0.7 : 1 }}>
              
              <div style={{ flex: 1, minWidth: "250px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: cfg.bg, color: cfg.color, padding: "6px 12px", borderRadius: "100px" }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>{getCategoryName(r.category)}</span>
                </div>
                
                <h3 style={{ margin: "0 0 12px", fontSize: "20px", color: "#0f172a" }}>{r.title}</h3>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#64748b" }}>
                    <User size={16} weight="duotone" /> {doctorMode ? t('patientLabel', { name: r.patient?.name || '-' }) : t('doctorLabel', { name: r.doctor?.name || '-' })}
                  </span>
                  {r.dueAt && (
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#64748b" }}>
                      <CalendarBlank size={16} weight="duotone" /> {t('targetDateDisplay', { date: new Date(r.dueAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US') })}
                    </span>
                  )}
                </div>

                {r.details && (
                  <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
                    <b>{t('detailsLabel')}:</b> {r.details}
                  </p>
                )}
              </div>

              {/* Aksiyon Butonları (Hastanın tetkik durumunu güncellemesi) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "160px", justifyContent: "center" }}>
                {!doctorMode && r.status === 'requested' && (
                  <button onClick={() => status(r.id, 'scheduled')} style={{ padding: "12px 16px", background: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s" }} className="hover-bg-sky-100">
                    <Clock size={18} weight="fill" /> {t('actionScheduled')}
                  </button>
                )}
                {r.status !== 'completed' && r.status !== 'cancelled' && (
                  <button onClick={() => status(r.id, 'completed')} style={{ padding: "12px 16px", background: "#ecfdf5", color: "#16a34a", border: "1px solid #a7f3d0", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s" }} className="hover-bg-green-100">
                    <CheckCircle size={18} weight="fill" /> {t('actionComplete')}
                  </button>
                )}
              </div>

            </div>
          )
        })}

        {!loading && rows.length === 0 && (
          <div style={{ padding: "64px", textAlign: "center", background: "#f8fafc", borderRadius: "32px", border: "1px dashed #cbd5e1" }}>
            <Stethoscope size={48} weight="duotone" color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>{t('empty')}</div>
          </div>
        )}
      </div>

    </div>
  )
}
