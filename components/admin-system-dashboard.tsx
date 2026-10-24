"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorUserId?: string | null;
  outcome?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export default function AdminSystemDashboard() {
  const t = useTranslations("admin.systemDashboard");

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const [dbStatus, setDbStatus] = useState<"healthy" | "loading" | "error">("loading");
  const [dbPingMs, setDbPingMs] = useState<number | null>(null);

  // Check system health
  useEffect(() => {
    const start = performance.now();
    fetch("/api/health")
      .then((res) => {
        const duration = Math.round(performance.now() - start);
        setDbPingMs(duration);
        if (res.ok) setDbStatus("healthy");
        else setDbStatus("error");
      })
      .catch(() => {
        setDbStatus("error");
      });
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      if (outcomeFilter !== "ALL") params.set("outcome", outcomeFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuditLogs(data.data.rows || []);
        setTotalLogs(data.data.total || 0);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, [actionFilter, entityFilter, outcomeFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      (log.actorUserId && log.actorUserId.toLowerCase().includes(term)) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* System Health Pulse Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          style={{
            background: "var(--bg, #ffffff)",
            border: "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            {t("dbStatusLabel")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: dbStatus === "healthy" ? "#10b981" : dbStatus === "loading" ? "#f59e0b" : "#ef4444",
                boxShadow: dbStatus === "healthy" ? "0 0 8px #10b981" : "none",
              }}
            />
            <strong style={{ fontSize: "16px", color: "#0f172a" }}>
              {dbStatus === "healthy" ? t("dbHealthy") : dbStatus === "loading" ? t("checking") : t("dbError")}
            </strong>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {dbPingMs !== null ? `${t("ping")}: ${dbPingMs} ms` : "..."}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg, #ffffff)",
            border: "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            {t("authEngineLabel")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <strong style={{ fontSize: "16px", color: "#0f172a" }}>
              {t("authEngineActive")}
            </strong>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            23 {t("routesProtected")}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg, #ffffff)",
            border: "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "14px",
            padding: "18px 20px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
            {t("auditStreamLabel")}
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
            {totalLogs}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            {t("recordedAuditEvents")}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600, textTransform: "uppercase" }}>
              {t("releaseOpsLabel")}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e3a8a", marginTop: "4px" }}>
              Go / No-Go Dashboard
            </div>
          </div>
          <Link
            href="/admin/release"
            style={{
              marginTop: "8px",
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 700,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            {t("viewReleaseReadiness")} →
          </Link>
        </div>
      </div>

      {/* Audit Log Stream Section */}
      <section
        style={{
          background: "var(--bg, #ffffff)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              🛡 {t("auditStreamTitle")}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
              {t("auditStreamSubtitle")}
            </p>
          </div>
          <button
            onClick={() => loadAuditLogs()}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              background: "#f8fafc",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔄 {t("refreshLogs")}
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <input
              type="text"
              placeholder={t("searchAuditPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                paddingLeft: "32px",
                borderRadius: "8px",
                border: "1px solid var(--border-light, #cbd5e1)",
                fontSize: "13px",
              }}
            />
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              🔍
            </span>
          </div>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              fontSize: "13px",
              background: "#fff",
            }}
          >
            <option value="ALL">{t("filterOutcomeAll")}</option>
            <option value="SUCCESS">{t("outcomeSuccess")}</option>
            <option value="FAILURE">{t("outcomeFailure")}</option>
          </select>
        </div>

        {/* Audit Log Table */}
        {isLoadingLogs ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            {t("loadingLogs")}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            {t("noLogsFound")}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>{t("colTime")}</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>{t("colAction")}</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>{t("colEntity")}</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>{t("colOutcome")}</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>{t("colDetails")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 100).map((log) => {
                  const isSuccess = log.outcome !== "FAILURE" && log.outcome !== "FAILED";

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background 0.1s ease",
                      }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>
                        {log.action}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>
                        <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span style={{ marginLeft: "6px", color: "#94a3b8", fontSize: "11px" }}>
                            {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: isSuccess ? "#ecfdf5" : "#fef2f2",
                            color: isSuccess ? "#047857" : "#b91c1c",
                          }}
                        >
                          {log.outcome || "SUCCESS"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.metadata ? JSON.stringify(log.metadata) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* LOG INSPECTION MODAL */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {t("auditDetailTitle")}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              <div>
                <strong>ID:</strong> {selectedLog.id}
              </div>
              <div>
                <strong>{t("colTime")}:</strong> {formatDateTime(selectedLog.createdAt)}
              </div>
              <div>
                <strong>{t("colAction")}:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>{t("colEntity")}:</strong> {selectedLog.entityType} ({selectedLog.entityId || "-"})
              </div>
              <div>
                <strong>{t("actorLabel")}:</strong> {selectedLog.actorUserId || "System / Anonymous"}
              </div>
              <div>
                <strong>{t("colOutcome")}:</strong> {selectedLog.outcome || "SUCCESS"}
              </div>
              {selectedLog.metadata && (
                <div>
                  <strong>{t("metadataLabel")}:</strong>
                  <pre
                    style={{
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      overflowX: "auto",
                      marginTop: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

