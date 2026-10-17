"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function AuditLogViewer() {
  const t = useTranslations("admin.auditLogViewer");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";

  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");

  async function load() {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (outcome) q.set("outcome", outcome);
    const [a, o] = await Promise.all([
      fetch(`/api/admin/audit?${q}`).then((r) => r.json()),
      fetch("/api/admin/ops").then((r) => r.json()),
    ]);
    setRows(a.data?.rows || []);
    setSummary(o.data || null);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="admin-stats v30-ops-stats">
        <div className="metric">
          <span>{t("audit24")}</span>
          <strong>{summary?.audit24 ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>{t("failedAudit24")}</span>
          <strong>{summary?.failedAudit24 ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>{t("failedLogins24")}</span>
          <strong>{summary?.failedLogins24 ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>{t("newAppointments24")}</span>
          <strong>{summary?.newAppointments24 ?? "—"}</strong>
        </div>
      </div>
      <div className="row wrap v30-audit-filters">
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder={t("searchAction")}
        />
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="">{t("allOutcomes")}</option>
          <option value="success">{t("successOutcome")}</option>
          <option value="failed">{t("failedOutcome")}</option>
        </select>
        <button className="secondary" type="button" onClick={load}>
          {t("filter")}
        </button>
      </div>
      <div className="audit-table">
        <div className="audit-head">
          <b>{t("colTime")}</b>
          <b>{t("colAction")}</b>
          <b>{t("colEntity")}</b>
          <b>{t("colOutcome")}</b>
        </div>
        {rows.slice(0, 100).map((r) => (
          <div className="audit-row" key={r.id}>
            <span>{new Date(r.createdAt).toLocaleString(dateLocale)}</span>
            <span>{r.action}</span>
            <span>{r.entityType}</span>
            <span className={r.outcome === "success" ? "status" : "status warning"}>
              {r.outcome === "success" ? t("successOutcome") : r.outcome === "failed" ? t("failedOutcome") : r.outcome}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
