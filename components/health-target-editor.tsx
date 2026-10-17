"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Def = { metric: string; label: string; unit: string };

export default function HealthTargetEditor({ defs, onChange }: { defs: Def[]; onChange?: () => void }) {
  const t = useTranslations("healthTargetEditor");
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => fetch('/api/health/targets').then(r => r.ok ? r.json() : []).then(setRows);
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const metric = String(f.get('metric'));
    const r = await fetch('/api/health/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, minValue: f.get('minValue'), maxValue: f.get('maxValue') })
    });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? t("saved") : (j.error || t("saveFailed")));
    if (r.ok) {
      load();
      onChange?.();
      setOpen(false);
    }
  }

  const relevant = rows.filter(r => defs.some(d => d.metric === r.metric));

  return (
    <section className="panel health-section">
      <div className="row space-between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <button className="secondary" type="button" onClick={() => setOpen(v => !v)}>{t("editTarget")}</button>
      </div>
      {open && (
        <form className="target-form-v15" onSubmit={save} style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <select name="metric">
            {defs.map(d => <option value={d.metric} key={d.metric}>{d.label}</option>)}
          </select>
          <input name="minValue" type="number" step="0.1" placeholder={t("minLimit")} />
          <input name="maxValue" type="number" step="0.1" placeholder={t("maxLimit")} />
          <button className="primary" type="submit">{t("save")}</button>
        </form>
      )}
      {msg && <div className="notice-v14" style={{ marginTop: "12px" }}>{msg}</div>}
      <div className="target-list-v15" style={{ marginTop: "16px" }}>
        {relevant.length ? (
          relevant.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <b>{defs.find(d => d.metric === r.metric)?.label || r.label || r.metric}</b>
              <span>{r.minValue ?? '—'} – {r.maxValue ?? '—'} {r.unit}</span>
            </div>
          ))
        ) : (
          <p>{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
