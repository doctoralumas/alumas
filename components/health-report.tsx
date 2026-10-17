"use client";
import {useEffect,useState} from "react";
import { useTranslations, useLocale } from "next-intl";
import HealthTrendChart from "@/components/health-trend-chart";
import ReportSharing from "@/components/report-sharing";
import { ChartLineUp, DownloadSimple, Heartbeat, Drop, Moon, Pill, Info, CalendarBlank, ChartBar } from "@phosphor-icons/react";

const n=(v:any,d=1)=>v==null?'--':Number(v).toFixed(d);

export default function HealthReport(){
  const t = useTranslations('health.healthReport');
  const locale = useLocale();
  const [period,setPeriod]=useState<'week'|'month'|'custom'>('week');
  const [data,setData]=useState<any>(null);
  const [from,setFrom]=useState(()=>new Date(Date.now()-7*86400000).toISOString().slice(0,10));
  const [to,setTo]=useState(()=>new Date().toISOString().slice(0,10));
  const [loading, setLoading]=useState(true);

  const load=()=>{
    setLoading(true);
    const q=period==='custom'?`from=${from}&to=${to}`:`period=${period}`;
    fetch(`/api/health/reports?${q}`).then(r=>r.ok?r.json():null).then(setData).finally(()=>setLoading(false));
  };
  useEffect(()=>{load()},[period]);

  if(!data && loading) return (
    <div style={{ padding: "64px", textAlign: "center", color: "#64748b" }}>
      <ChartBar size={48} weight="duotone" style={{ marginBottom: "16px", opacity: 0.5 }} />
      <div style={{ fontSize: "16px" }}>{t('preparing')}</div>
    </div>
  );
  if(!data) return <div style={{ padding: "64px", textAlign: "center", color: "#ef4444" }}>{t('loadError')}</div>;

  const s=data.summary;
  
  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "48px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: "#f0fdf4", padding: "16px", borderRadius: "24px" }}>
            <ChartLineUp size={32} weight="duotone" color="#16a34a" />
          </div>
          <div>
            <span className="kicker" style={{ color: "#16a34a" }}>{t('kicker')}</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{t('title')}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{t('subtitle')}</p>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "4px" }}>
            <button onClick={()=>setPeriod('week')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: period==='week'?"#fff":"transparent", color: period==='week'?"#0f172a":"#64748b", fontWeight: 600, boxShadow: period==='week'?"0 2px 4px rgba(0,0,0,0.05)":"none", cursor: "pointer", transition: "all 0.2s" }}>{t('periodWeek')}</button>
            <button onClick={()=>setPeriod('month')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: period==='month'?"#fff":"transparent", color: period==='month'?"#0f172a":"#64748b", fontWeight: 600, boxShadow: period==='month'?"0 2px 4px rgba(0,0,0,0.05)":"none", cursor: "pointer", transition: "all 0.2s" }}>{t('periodMonth')}</button>
            <button onClick={()=>setPeriod('custom')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: period==='custom'?"#fff":"transparent", color: period==='custom'?"#0f172a":"#64748b", fontWeight: 600, boxShadow: period==='custom'?"0 2px 4px rgba(0,0,0,0.05)":"none", cursor: "pointer", transition: "all 0.2s" }}>{t('periodCustom')}</button>
          </div>
          
          <a href={`/api/health/reports/pdf?${period==='custom'?`from=${from}&to=${to}`:`period=${period}`}`} style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", borderRadius: "12px", textDecoration: "none", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }} className="hover-shadow">
            <DownloadSimple size={18} weight="bold" /> {t('downloadPdf')}
          </a>
        </div>
      </div>

      {period === 'custom' && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "32px", background: "#f8fafc", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>{t('startDate')}</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", outline: "none", fontSize: "15px" }} />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>{t('endDate')}</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", outline: "none", fontSize: "15px" }} />
          </div>
          <button onClick={load} style={{ padding: "12px 24px", background: "#16a34a", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, fontSize: "15px", cursor: "pointer", height: "46px" }}>
            {t('apply')}
          </button>
        </div>
      )}

      {/* Ortalamalar (Hero Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        
        <div style={{ background: "#fef2f2", padding: "24px", borderRadius: "32px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", marginBottom: "16px" }}>
            <Heartbeat size={24} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "13px", letterSpacing: "1px" }}>{t('bpAverage')}</span>
          </div>
          <strong style={{ fontSize: "36px", fontWeight: 800, color: "#991b1b", lineHeight: 1 }}>{n(s.bp.systolicAvg,0)} / {n(s.bp.diastolicAvg,0)}</strong>
          <span style={{ fontSize: "14px", color: "#b91c1c", marginTop: "8px", fontWeight: 500 }}>{t('bpCount', { count: s.bp.count })}</span>
        </div>

        <div style={{ background: "#fff7ed", padding: "24px", borderRadius: "32px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ea580c", marginBottom: "16px" }}>
            <Drop size={24} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "13px", letterSpacing: "1px" }}>{t('glucoseAverage')}</span>
          </div>
          <strong style={{ fontSize: "36px", fontWeight: 800, color: "#9a3412", lineHeight: 1 }}>{n(s.glucose.avg,1)}</strong>
          <span style={{ fontSize: "14px", color: "#c2410c", marginTop: "8px", fontWeight: 500 }}>{t('glucoseUnitAndCount', { unit: s.glucose.unit, count: s.glucose.count })}</span>
        </div>

        <div style={{ background: "#e0e7ff", padding: "24px", borderRadius: "32px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4f46e5", marginBottom: "16px" }}>
            <Moon size={24} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "13px", letterSpacing: "1px" }}>{t('sleepAverage')}</span>
          </div>
          <strong style={{ fontSize: "36px", fontWeight: 800, color: "#3730a3", lineHeight: 1 }}>{n(s.sleep.hoursAvg,1)} <small style={{ fontSize: "18px" }}>{t('sleepHours')}</small></strong>
          <span style={{ fontSize: "14px", color: "#4338ca", marginTop: "8px", fontWeight: 500 }}>{t('sleepCount', { count: s.sleep.count })}</span>
        </div>

        <div style={{ background: "#fdf2f8", padding: "24px", borderRadius: "32px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#db2777", marginBottom: "16px" }}>
            <Pill size={24} weight="fill" /> <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "13px", letterSpacing: "1px" }}>{t('adherenceTitle')}</span>
          </div>
          <strong style={{ fontSize: "36px", fontWeight: 800, color: "#9d174d", lineHeight: 1 }}>{s.medication.adherence==null?'--':`%${s.medication.adherence}`}</strong>
          <span style={{ fontSize: "14px", color: "#be185d", marginTop: "8px", fontWeight: 500 }}>{t('adherenceStats', { taken: s.medication.taken, skipped: s.medication.skipped })}</span>
        </div>

      </div>

      {/* Grafikler */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "48px" }}>
        
        {data.series.bp.length > 0 && (
          <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "#fef2f2", color: "#ef4444", padding: "8px", borderRadius: "12px" }}><Heartbeat size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t('bpTrend')}</h2>
            </div>
            <HealthTrendChart labels={data.series.bp.map((x:any)=>new Date(x.at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US',{day:'2-digit',month:'2-digit'}))} series={[{name: t('systolic'),values:data.series.bp.map((x:any)=>x.systolic)},{name: t('diastolic'),values:data.series.bp.map((x:any)=>x.diastolic)}]}/>
          </section>
        )}

        {data.series.glucose.length > 0 && (
          <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "#fff7ed", color: "#ea580c", padding: "8px", borderRadius: "12px" }}><Drop size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t('glucoseTrend')}</h2>
            </div>
            <HealthTrendChart labels={data.series.glucose.map((x:any)=>new Date(x.at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US',{day:'2-digit',month:'2-digit'}))} series={[{name: t('glucoseLabel'),values:data.series.glucose.map((x:any)=>x.value)}]}/>
          </section>
        )}

        {data.series.sleep.length > 0 && (
          <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ background: "#e0e7ff", color: "#4f46e5", padding: "8px", borderRadius: "12px" }}><Moon size={20} weight="fill" /></div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t('sleepTrend')}</h2>
            </div>
            <HealthTrendChart labels={data.series.sleep.map((x:any)=>new Date(x.at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US',{day:'2-digit',month:'2-digit'}))} series={[{name: t('sleepLabel'),values:data.series.sleep.map((x:any)=>Number(x.hours.toFixed(1)))}]}/>
          </section>
        )}

      </div>

      <ReportSharing fromDate={data.from.slice(0,10)} toDate={data.to.slice(0,10)}/>
      
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", marginTop: "32px" }}>
        <Info size={20} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
          {t('disclaimer')}
        </p>
      </div>

    </div>
  )
}
