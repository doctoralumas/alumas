"use client";
import { useEffect, useMemo, useState } from "react";
import HealthTrendChart from "@/components/health-trend-chart";
import HealthTargetEditor from "@/components/health-target-editor";
import { Heartbeat, Drop, Moon, Plus, X, Trash, WarningCircle, ChartLineUp, Clock, Info } from "@phosphor-icons/react";
import { useTranslations, useFormatter } from "next-intl";

type Mode = "blood-pressure" | "glucose" | "sleep";

export default function HealthModule({ mode }: { mode: Mode }) {
  const t = useTranslations("healthModule");
  const format = useFormatter();

  const [rows, setRows] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  
  const endpoint = `/api/health/${mode}`;
  
  const fmt = (d: string) => format.dateTime(new Date(d), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const defs = useMemo(() => {
    if (mode === "blood-pressure") {
      return [
        { metric: "bp-systolic", label: t("targetDefs.bpSystolic"), unit: "mmHg" },
        { metric: "bp-diastolic", label: t("targetDefs.bpDiastolic"), unit: "mmHg" }
      ];
    }
    if (mode === "glucose") {
      return [
        { metric: "glucose", label: t("targetDefs.glucose"), unit: "mg/dL" }
      ];
    }
    return [
      { metric: "sleep-hours", label: t("targetDefs.sleepHours"), unit: t("unitHours") }
    ];
  }, [mode, t]);

  const load = () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    fetch(`${endpoint}?${q}`).then(r => r.ok ? r.json() : []).then(setRows);
  };
  
  const loadTargets = () => fetch('/api/health/targets').then(r => r.ok ? r.json() : []).then(setTargets);
  
  useEffect(() => { load(); loadTargets(); }, [endpoint]);
  
  const title = mode === "blood-pressure" ? t("bloodPressure.title") : mode === "glucose" ? t("glucose.title") : t("sleep.title");
  const desc = mode === "blood-pressure" ? t("bloodPressure.desc") : mode === "glucose" ? t("glucose.desc") : t("sleep.desc");
  const icon = mode === "blood-pressure" ? <Heartbeat size={32} weight="duotone" color="#ef4444" /> : mode === "glucose" ? <Drop size={32} weight="duotone" color="#ea580c" /> : <Moon size={32} weight="duotone" color="#4f46e5" />;
  const color = mode === "blood-pressure" ? "#ef4444" : mode === "glucose" ? "#ea580c" : "#4f46e5";
  const bg = mode === "blood-pressure" ? "#fef2f2" : mode === "glucose" ? "#fff7ed" : "#e0e7ff";
  
  const latest = rows[0];
  const seriesRows = useMemo(() => rows.slice(0, 14).reverse(), [rows]);
  const targetMap = useMemo(() => new Map(targets.map(trg => [trg.metric, trg])), [targets]);
  
  const glucoseMg = (r: any) => String(r?.unit || "mg/dL").toLowerCase() === "mmol/l" ? Number(r.value) * 18.0182 : Number(r?.value);
  
  function warningFor(r: any) {
    if (!r) return null;
    const outside = (metric: string, value: number) => { const trg: any = targetMap.get(metric); return !!trg && trg.enabled && ((trg.minValue != null && value < trg.minValue) || (trg.maxValue != null && value > trg.maxValue)); };
    if (mode === "blood-pressure" && (outside("bp-systolic", r.systolic) || outside("bp-diastolic", r.diastolic))) return t("outsideTargetRange");
    if (mode === "glucose" && outside("glucose", glucoseMg(r))) return t("outsideTargetRange");
    if (mode === "sleep") { const h = (new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 3600000; if (outside("sleep-hours", h)) return t("outsideTargetDuration"); }
    return null;
  }
  
  const latestWarning = warningFor(latest);
  
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const form = e.currentTarget;
    const f = new FormData(form), body: any = Object.fromEntries(f.entries());
    
    for (const k of Object.keys(body)) {
      if (body[k] === "") delete body[k];
    }
    
    if (body.measuredAt) body.measuredAt = new Date(body.measuredAt).toISOString();
    if (body.startedAt) body.startedAt = new Date(body.startedAt).toISOString();
    if (body.endedAt) body.endedAt = new Date(body.endedAt).toISOString();

    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || t("saveFailed")); return; }
    setOpen(false); form.reset(); load();
  }
  
  async function remove(id: string) {
    if (!confirm(t("deleteConfirmation"))) return;
    await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" }); load();
  }
  
  const chart = mode === "blood-pressure" ? {
    labels: seriesRows.map(r => format.dateTime(new Date(r.measuredAt), { day: '2-digit', month: '2-digit' })),
    series: [
      { name: t('bloodPressure.chartSystolic'), values: seriesRows.map(r => r.systolic) },
      { name: t('bloodPressure.chartDiastolic'), values: seriesRows.map(r => r.diastolic) }
    ]
  } : mode === "glucose" ? {
    labels: seriesRows.map(r => format.dateTime(new Date(r.measuredAt), { day: '2-digit', month: '2-digit' })),
    series: [{ name: t('glucose.chartSeries'), values: seriesRows.map(r => Number(glucoseMg(r).toFixed(1))) }]
  } : {
    labels: seriesRows.map(r => format.dateTime(new Date(r.startedAt), { day: '2-digit', month: '2-digit' })),
    series: [{ name: t('sleep.chartSeries'), values: seriesRows.map(r => Number(((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 3600000).toFixed(1))) }]
  };

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ background: bg, padding: "16px", borderRadius: "24px" }}>
            {icon}
          </div>
          <div>
            <span className="kicker" style={{ color: color }}>{t("dailyTracking")}</span>
            <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "4px 0" }}>{title}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{desc}</p>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ padding: "12px 24px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {open ? <X size={20} /> : <Plus size={20} />} {open ? t("close") : t("addNewRecord")}
        </button>
      </div>

      {/* Form Overlay */}
      {open && (
        <form onSubmit={submit} style={{ background: "#fff", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            {mode === "blood-pressure" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("bloodPressure.systolicLabel")}</label>
                  <input name="systolic" type="number" defaultValue="120" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("bloodPressure.diastolicLabel")}</label>
                  <input name="diastolic" type="number" defaultValue="80" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("bloodPressure.pulseLabel")}</label>
                  <input name="pulse" type="number" defaultValue="72" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("bloodPressure.measuredAtLabel")}</label>
                  <input name="measuredAt" type="datetime-local" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", color: "#475569" }} />
                </div>
              </>
            )}
            {mode === "glucose" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("glucose.valueLabel")}</label>
                  <input name="value" type="number" step="0.1" defaultValue="95" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("glucose.unitLabel")}</label>
                  <select name="unit" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}><option>mg/dL</option><option>mmol/L</option></select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("glucose.contextLabel")}</label>
                  <select name="context" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}>
                    <option value="FASTING">{t("glucose.contextFasting")}</option>
                    <option value="POSTPRANDIAL">{t("glucose.contextPostprandial")}</option>
                    <option value="RANDOM">{t("glucose.contextRandom")}</option>
                    <option value="BEDTIME">{t("glucose.contextBedtime")}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("glucose.measuredAtLabel")}</label>
                  <input name="measuredAt" type="datetime-local" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", color: "#475569" }} />
                </div>
              </>
            )}
            {mode === "sleep" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("sleep.startedAtLabel")}</label>
                  <input name="startedAt" type="datetime-local" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", color: "#475569" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("sleep.endedAtLabel")}</label>
                  <input name="endedAt" type="datetime-local" required style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none", color: "#475569" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("sleep.qualityLabel")}</label>
                  <select name="quality" style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }}>
                    <option value="5">{t("sleep.quality5")}</option>
                    <option value="4">{t("sleep.quality4")}</option>
                    <option value="3">{t("sleep.quality3")}</option>
                    <option value="2">{t("sleep.quality2")}</option>
                    <option value="1">{t("sleep.quality1")}</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>{t("optionalNote")}</label>
            <input name="note" placeholder={t("notePlaceholder")} style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1", background: "#f8fafc", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button type="submit" style={{ padding: "14px 32px", background: color, color: "#fff", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>{t("save")}</button>
            <button type="button" onClick={() => setOpen(false)} style={{ padding: "14px 32px", background: "#f1f5f9", color: "#475569", borderRadius: "16px", border: "none", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>{t("cancel")}</button>
          </div>
          {msg && <div style={{ color: "#ef4444", fontWeight: 600, fontSize: "14px" }}>{msg}</div>}
        </form>
      )}

      {/* Target Warning */}
      {latestWarning && (
        <div style={{ background: "#fef2f2", borderLeft: "4px solid #ef4444", padding: "16px 20px", borderRadius: "0 16px 16px 0", display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", color: "#b91c1c" }}>
          <WarningCircle size={24} weight="duotone" />
          <div>
            <strong style={{ display: "block", fontSize: "14px", marginBottom: "2px" }}>{t("targetNotification")}</strong>
            <span style={{ fontSize: "13px" }}>{latestWarning}. {t("medicalDisclaimer")}</span>
          </div>
        </div>
      )}

      {/* Hero Stats (Latest Measurement) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        
        <div style={{ background: bg, padding: "32px", borderRadius: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{t("latestMeasurement")}</span>
          
          {mode === "blood-pressure" ? (
            <>
              <strong style={{ fontSize: "42px", color: "#0f172a", lineHeight: 1, fontWeight: 800 }}>{latest ? `${latest.systolic}/${latest.diastolic}` : "--"}</strong>
              <small style={{ fontSize: "15px", color: "#475569", marginTop: "8px", fontWeight: 500 }}>mmHg {latest?.pulse ? `• ${t("bloodPressure.pulseLabel").split(" ")[0]} ${latest.pulse}` : ""}</small>
            </>
          ) : mode === "glucose" ? (
            <>
              <strong style={{ fontSize: "42px", color: "#0f172a", lineHeight: 1, fontWeight: 800 }}>{latest ? latest.value : "--"}</strong>
              <small style={{ fontSize: "15px", color: "#475569", marginTop: "8px", fontWeight: 500 }}>{latest?.unit || "mg/dL"} • {latest?.context === "FASTING" ? t("glucose.contextFasting") : latest?.context === "POSTPRANDIAL" ? t("glucose.contextPostprandial") : t("measurementFallback")}</small>
            </>
          ) : (
            <>
              <strong style={{ fontSize: "42px", color: "#0f172a", lineHeight: 1, fontWeight: 800 }}>{latest ? `${((new Date(latest.endedAt).getTime() - new Date(latest.startedAt).getTime()) / 3600000).toFixed(1)}${t("unitHours")}` : "--"}</strong>
              <small style={{ fontSize: "15px", color: "#475569", marginTop: "8px", fontWeight: 500 }}>{t("qualityPrefix")} {latest?.quality || "?"}/5</small>
            </>
          )}
        </div>

        <div style={{ background: "#f8fafc", padding: "32px", borderRadius: "32px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{t("totalRecords")}</span>
          <strong style={{ fontSize: "42px", color: "#0f172a", lineHeight: 1, fontWeight: 800 }}>{rows.length}</strong>
          <small style={{ fontSize: "15px", color: "#94a3b8", marginTop: "8px", fontWeight: 500 }}>{t("historySubtitle")}</small>
        </div>

      </div>

      {/* Chart Section */}
      <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0", marginBottom: "40px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "16px", color: "#475569" }}><ChartLineUp size={24} weight="duotone" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t("trendAnalysis")}</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{t("trendSubtitle")}</p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", outline: "none" }} />
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", outline: "none" }} />
            <button onClick={load} style={{ padding: "10px 24px", background: "#0f172a", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 600, cursor: "pointer" }}>{t("filter")}</button>
          </div>
        </div>
        <div style={{ padding: "16px 0" }}>
          <HealthTrendChart labels={chart.labels} series={chart.series} />
        </div>
      </section>

      {/* Targets */}
      <div style={{ marginBottom: "40px" }}>
        <HealthTargetEditor defs={defs} onChange={loadTargets} />
      </div>

      {/* History */}
      <section style={{ background: "#fff", borderRadius: "32px", padding: "32px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "16px", color: "#475569" }}><Clock size={24} weight="duotone" /></div>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>{t("pastMeasurements")}</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{t("pastSubtitle")}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rows.length ? rows.map(r => {
            const warning = warningFor(r);
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: warning ? "#fef2f2" : "#f8fafc", borderRadius: "16px", border: `1px solid ${warning ? '#fecaca' : '#e2e8f0'}` }}>
                <div style={{ flex: 1 }}>
                  <b style={{ display: "block", fontSize: "16px", color: warning ? "#b91c1c" : "#0f172a", marginBottom: "4px" }}>
                    {mode === "blood-pressure" ? `${r.systolic}/${r.diastolic} mmHg` : mode === "glucose" ? `${r.value} ${r.unit}` : `${((new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime()) / 3600000).toFixed(1)} ${t("unitHours")}`}
                  </b>
                  <span style={{ fontSize: "13px", color: warning ? "#dc2626" : "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Info size={14} />
                    {mode === "sleep" ? `${fmt(r.startedAt)} - ${fmt(r.endedAt)}` : fmt(r.measuredAt)} 
                    {warning ? ` • ${warning}` : ''}
                  </span>
                </div>
                <button onClick={() => remove(r.id)} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Trash size={16} />
                </button>
              </div>
            )
          }) : (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px" }}>{t("noRecordsYet")}</div>
          )}
        </div>
      </section>

    </div>
  );
}
