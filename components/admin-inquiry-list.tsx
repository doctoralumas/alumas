"use client";

import { useEffect, useState, useCallback } from "react";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";
import { useTranslations } from "next-intl";

type InquiryUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type InquiryItem = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: InquiryUser | null;
  recentLogs?: Array<{
    id: string;
    action: string;
    actorUserId?: string | null;
    outcome?: string | null;
    metadata?: any;
    createdAt: string;
  }>;
};

type Stats = {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

export default function AdminInquiryList() {
  const t = useTranslations("admin.inquiriesList");

  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals
  const [viewingInquiry, setViewingInquiry] = useState<InquiryItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "STATUS_CHANGE" | "DELETE";
    inquiry: InquiryItem;
    targetStatus?: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "primary" | "danger" | "warning";
    showReasonInput?: boolean;
    reasonPlaceholder?: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("loadError"));
      }

      setInquiries(data.rows || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(inquiry: InquiryItem) {
    setViewingInquiry(inquiry);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiry.id}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setViewingInquiry(data.data);
      }
    } catch {
      // Keep lightweight version on error
    }
  }

  function handleStatusChangeClick(inquiry: InquiryItem, targetStatus: string) {
    let title = "";
    let description = "";
    let confirmLabel = "";

    switch (targetStatus) {
      case "in_progress":
        title = t("confirmInProgressTitle");
        description = t("confirmInProgressDesc", { subject: inquiry.subject, name: inquiry.name });
        confirmLabel = t("btnTakeProgress");
        break;
      case "resolved":
        title = t("confirmResolvedTitle");
        description = t("confirmResolvedDesc", { subject: inquiry.subject, name: inquiry.name });
        confirmLabel = t("btnMarkResolved");
        break;
      case "closed":
        title = t("confirmClosedTitle");
        description = t("confirmClosedDesc", { subject: inquiry.subject, name: inquiry.name });
        confirmLabel = t("btnCloseInquiry");
        break;
      default:
        title = t("confirmStatusTitle");
        description = t("confirmStatusDesc");
        confirmLabel = t("btnUpdateStatus");
    }

    setConfirmDialog({
      type: "STATUS_CHANGE",
      inquiry,
      targetStatus,
      title,
      description,
      confirmLabel,
      variant: targetStatus === "closed" ? "warning" : "primary",
      showReasonInput: true,
      reasonPlaceholder: t("statusNotePlaceholder"),
    });
  }

  function handleDeleteClick(inquiry: InquiryItem) {
    setConfirmDialog({
      type: "DELETE",
      inquiry,
      title: t("confirmDeleteTitle"),
      description: t("confirmDeleteDesc", { subject: inquiry.subject, name: inquiry.name }),
      confirmLabel: t("deleteInquiry"),
      variant: "danger",
      showReasonInput: false,
    });
  }

  async function executeAction(reason?: string) {
    if (!confirmDialog) return;
    setIsBusy(true);
    setError("");

    try {
      if (confirmDialog.type === "STATUS_CHANGE" && confirmDialog.targetStatus) {
        const res = await fetch(`/api/admin/inquiries/${confirmDialog.inquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: confirmDialog.targetStatus,
            note: reason || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("actionError"));

        setSuccess(t("statusUpdateSuccess"));
      } else if (confirmDialog.type === "DELETE") {
        const res = await fetch(`/api/admin/inquiries/${confirmDialog.inquiry.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("actionError"));

        setSuccess(t("deleteSuccess"));
      }

      setConfirmDialog(null);
      if (viewingInquiry?.id === confirmDialog.inquiry.id) {
        setViewingInquiry(null);
      }
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || t("actionError"));
    } finally {
      setIsBusy(false);
    }
  }

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function getStatusLabel(status: string) {
    switch (status.toLowerCase()) {
      case "new":
        return t("statusNew");
      case "in_progress":
        return t("statusInProgress");
      case "resolved":
        return t("statusResolved");
      case "closed":
        return t("statusClosed");
      default:
        return status;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Notifications */}
      {error && (
        <AdminCallout variant="danger" title={t("errorTitle")}>
          {error}
        </AdminCallout>
      )}
      {success && (
        <AdminCallout variant="success" title={t("successTitle")}>
          {success}
        </AdminCallout>
      )}

      {/* KPI Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "ALL" ? "#eff6ff" : "var(--bg, #ffffff)",
            border:
              statusFilter === "ALL"
                ? "2px solid #3b82f6"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 500 }}>
            {t("statTotal")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("new");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "new" ? "#fffbeb" : "var(--bg, #ffffff)",
            border:
              statusFilter === "new"
                ? "2px solid #f59e0b"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 500 }}>
            {t("statNew")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
            {stats.new}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("in_progress");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "in_progress" ? "#eff6ff" : "var(--bg, #ffffff)",
            border:
              statusFilter === "in_progress"
                ? "2px solid #2563eb"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 500 }}>
            {t("statInProgress")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
            {stats.inProgress}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("resolved");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "resolved" ? "#f0fdf4" : "var(--bg, #ffffff)",
            border:
              statusFilter === "resolved"
                ? "2px solid #10b981"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#166534", fontWeight: 500 }}>
            {t("statResolved")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
            {stats.resolved}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("closed");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "closed" ? "#f8fafc" : "var(--bg, #ffffff)",
            border:
              statusFilter === "closed"
                ? "2px solid #64748b"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>
            {t("statClosed")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#475569", marginTop: "4px" }}>
            {stats.closed}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          background: "var(--bg, #ffffff)",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid var(--border-light, #e2e8f0)",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              paddingLeft: "36px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            🔍
          </span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            background: "var(--bg, #ffffff)",
            minWidth: "150px",
          }}
        >
          <option value="ALL">{t("filterStatusAll")}</option>
          <option value="new">{t("statusNew")}</option>
          <option value="in_progress">{t("statusInProgress")}</option>
          <option value="resolved">{t("statusResolved")}</option>
          <option value="closed">{t("statusClosed")}</option>
        </select>

        {(search || statusFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPage(1);
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              background: "#f8fafc",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Inquiry List */}
      {isLoading ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            color: "var(--text-muted, #64748b)",
            background: "var(--bg, #ffffff)",
            borderRadius: "12px",
            border: "1px solid var(--border-light, #e2e8f0)",
          }}
        >
          {t("loading")}
        </div>
      ) : inquiries.length === 0 ? (
        <div
          style={{
            padding: "48px",
            textAlign: "center",
            color: "var(--text-muted, #64748b)",
            background: "var(--bg, #ffffff)",
            borderRadius: "12px",
            border: "1px solid var(--border-light, #e2e8f0)",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>💬</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            {t("emptyTitle")}
          </div>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>{t("emptyDesc")}</p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {inquiries.map((inq) => {
            const isResolved = inq.status === "resolved";
            const isClosed = inq.status === "closed";
            const isInProgress = inq.status === "in_progress";
            const isNew = inq.status === "new";

            return (
              <div
                key={inq.id}
                style={{
                  background: "var(--bg, #ffffff)",
                  borderRadius: "12px",
                  border: isNew
                    ? "2px solid #fde68a"
                    : "1px solid var(--border-light, #e2e8f0)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transition: "box-shadow 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                      {inq.subject}
                    </h3>
                    <AdminStatusBadge
                      status={inq.status}
                      label={getStatusLabel(inq.status)}
                      size="sm"
                    />
                  </div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    🕒 {formatDateTime(inq.createdAt)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    fontSize: "13px",
                    color: "#475569",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>👤 {inq.name}</span>
                  <span>✉️ {inq.email}</span>
                  {inq.phone && <span>📞 {inq.phone}</span>}
                  {inq.user && (
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: "9999px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      Kayıtlı Üye ({inq.user.role})
                    </span>
                  )}
                </div>

                {/* Message preview */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#334155",
                    margin: 0,
                    lineHeight: "1.5",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {inq.message}
                </p>

                {/* Action buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    borderTop: "1px solid var(--border-light, #f1f5f9)",
                    paddingTop: "12px",
                  }}
                >
                  <button
                    onClick={() => openDetail(inq)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-light, #cbd5e1)",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    👁 {t("btnDetail")}
                  </button>

                  {isNew && (
                    <button
                      onClick={() => handleStatusChangeClick(inq, "in_progress")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ⏳ {t("btnTakeProgress")}
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => handleStatusChangeClick(inq, "resolved")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#15803d",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✓ {t("btnMarkResolved")}
                    </button>
                  )}

                  {!isClosed && (
                    <button
                      onClick={() => handleStatusChangeClick(inq, "closed")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✕ {t("btnCloseInquiry")}
                    </button>
                  )}

                  {(isResolved || isClosed) && (
                    <button
                      onClick={() => handleDeleteClick(inq)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🗑 {t("btnDelete")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0",
              }}
            >
              <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                {t("pageInfo", { current: page, total: totalPages, count: totalCount })}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-light, #cbd5e1)",
                    background: "var(--bg, #ffffff)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  ← {t("prevPage")}
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-light, #cbd5e1)",
                    background: "var(--bg, #ffffff)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  {t("nextPage")} →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingInquiry && (
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
            if (e.target === e.currentTarget) setViewingInquiry(null);
          }}
        >
          <div
            style={{
              background: "var(--bg, #ffffff)",
              borderRadius: "16px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-light, #e2e8f0)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  {viewingInquiry.subject}
                </h2>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  ID: {viewingInquiry.id} · {formatDateTime(viewingInquiry.createdAt)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge
                  status={viewingInquiry.status}
                  label={getStatusLabel(viewingInquiry.status)}
                />
                <button
                  onClick={() => setViewingInquiry(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px 8px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Sender Details */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("fieldName")}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                    {viewingInquiry.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("fieldEmail")}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#2563eb", marginTop: "2px" }}>
                    <a href={`mailto:${viewingInquiry.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {viewingInquiry.email}
                    </a>
                  </div>
                </div>

                {viewingInquiry.phone && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      {t("fieldPhone")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      <a href={`tel:${viewingInquiry.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {viewingInquiry.phone}
                      </a>
                    </div>
                  </div>
                )}

                {viewingInquiry.user && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      {t("fieldLinkedAccount")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                      {viewingInquiry.user.name} ({viewingInquiry.user.role})
                    </div>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
                  {t("fieldMessage")}
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#1e293b",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {viewingInquiry.message}
                </div>
              </div>

              {/* Operational Audit History */}
              {viewingInquiry.recentLogs && viewingInquiry.recentLogs.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
                    🛡 {t("auditHistory")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {viewingInquiry.recentLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          fontSize: "12px",
                          padding: "8px 10px",
                          background: "#f8fafc",
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <strong>{log.action}</strong>
                          {log.metadata?.note ? ` · ${log.metadata.note}` : ""}
                        </span>
                        <span style={{ color: "#94a3b8" }}>{formatDateTime(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border-light, #e2e8f0)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                {viewingInquiry.status !== "in_progress" && viewingInquiry.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChangeClick(viewingInquiry, "in_progress")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #bfdbfe",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⏳ {t("btnTakeProgress")}
                  </button>
                )}

                {viewingInquiry.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChangeClick(viewingInquiry, "resolved")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#15803d",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✓ {t("btnMarkResolved")}
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewingInquiry(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light, #cbd5e1)",
                  background: "#f8fafc",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION DIALOG */}
      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={t("btnDialogCancel")}
          variant={confirmDialog.variant}
          showReasonInput={confirmDialog.showReasonInput}
          reasonPlaceholder={confirmDialog.reasonPlaceholder}
          isBusy={isBusy}
          onConfirm={(reason) => executeAction(reason)}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

