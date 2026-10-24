"use client";

import { useEffect, useState, useCallback } from "react";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";
import { useTranslations } from "next-intl";

type AppointmentPatient = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
};

type AppointmentDoctor = {
  id: string;
  name: string;
  specialty: string;
  title: string;
  city?: string | null;
  hospital?: string | null;
  slug?: string;
  isVerified?: boolean;
  isPublished?: boolean;
};

type AppointmentOrg = {
  id: string;
  name: string;
  type: string;
  city: string;
  status?: string;
  isPublished?: boolean;
};

type AppointmentItem = {
  id: string;
  startsAt: string;
  type: string;
  status: string;
  note?: string | null;
  visitCity?: string | null;
  visitDistrict?: string | null;
  visitAddress?: string | null;
  createdAt: string;
  reviewRequestedAt?: string | null;
  reviewSubmittedAt?: string | null;
  user: AppointmentPatient;
  doctor: AppointmentDoctor;
  organization?: AppointmentOrg | null;
  specialProfile?: { id: string; name: string; type: string } | null;
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
  confirmed: number;
  completed: number;
  cancelled: number;
  pending: number;
};

export default function AdminAppointmentList() {
  const t = useTranslations("admin.appointmentsList");

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
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
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Modals & Dialogs
  const [viewingAppointment, setViewingAppointment] = useState<AppointmentItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "CANCEL" | "COMPLETE";
    appointment: AppointmentItem;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "primary";
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
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/appointments?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("loadError"));
      }

      setAppointments(data.rows || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(appointment: AppointmentItem) {
    setIsLoadingDetail(true);
    setViewingAppointment(appointment);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setViewingAppointment(data.data);
      }
    } catch {
      // Keep lightweight version on error
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleCancelClick(appointment: AppointmentItem) {
    setConfirmDialog({
      type: "CANCEL",
      appointment,
      title: t("confirmCancelTitle"),
      description: t("confirmCancelDesc", {
        patient: appointment.user.name,
        doctor: appointment.doctor.name,
      }),
      confirmLabel: t("cancelAppointment"),
      variant: "danger",
      showReasonInput: true,
      reasonPlaceholder: t("cancelReasonPlaceholder"),
    });
  }

  function handleCompleteClick(appointment: AppointmentItem) {
    setConfirmDialog({
      type: "COMPLETE",
      appointment,
      title: t("confirmCompleteTitle"),
      description: t("confirmCompleteDesc", {
        patient: appointment.user.name,
        doctor: appointment.doctor.name,
      }),
      confirmLabel: t("markCompleted"),
      variant: "primary",
      showReasonInput: false,
    });
  }

  async function executeAction(reason?: string) {
    if (!confirmDialog) return;
    setIsBusy(true);
    setError("");

    const newStatus = confirmDialog.type === "CANCEL" ? "cancelled" : "completed";

    try {
      const res = await fetch(`/api/admin/appointments/${confirmDialog.appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("actionError"));
      }

      setSuccess(
        confirmDialog.type === "CANCEL"
          ? t("cancelSuccess")
          : t("completeSuccess")
      );
      setConfirmDialog(null);
      if (viewingAppointment?.id === confirmDialog.appointment.id) {
        setViewingAppointment(null);
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

  function getTypeLabel(type: string) {
    switch (type) {
      case "online":
        return t("typeOnline");
      case "in_person":
      case "in-person":
        return t("typeInPerson");
      case "home":
      case "home_visit":
        return t("typeHomeVisit");
      default:
        return type;
    }
  }

  function getTypeBadgeColor(type: string) {
    switch (type) {
      case "online":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
      case "in_person":
      case "in-person":
        return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
      case "home":
      case "home_visit":
        return { bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
    }
  }

  function getStatusLabel(status: string) {
    switch (status.toLowerCase()) {
      case "confirmed":
        return t("statusConfirmed");
      case "completed":
        return t("statusCompleted");
      case "cancelled":
        return t("statusCancelled");
      case "pending":
        return t("statusPending");
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

      {/* KPI Cards / Metric Filters */}
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
            setStatusFilter("confirmed");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "confirmed" ? "#f0fdf4" : "var(--bg, #ffffff)",
            border:
              statusFilter === "confirmed"
                ? "2px solid #10b981"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#166534", fontWeight: 500 }}>
            {t("statConfirmed")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
            {stats.confirmed}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("completed");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "completed" ? "#eff6ff" : "var(--bg, #ffffff)",
            border:
              statusFilter === "completed"
                ? "2px solid #2563eb"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 500 }}>
            {t("statCompleted")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
            {stats.completed}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("pending");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "pending" ? "#fffbeb" : "var(--bg, #ffffff)",
            border:
              statusFilter === "pending"
                ? "2px solid #f59e0b"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 500 }}>
            {t("statPending")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
            {stats.pending}
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter("cancelled");
            setPage(1);
          }}
          style={{
            cursor: "pointer",
            background: statusFilter === "cancelled" ? "#fef2f2" : "var(--bg, #ffffff)",
            border:
              statusFilter === "cancelled"
                ? "2px solid #ef4444"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 500 }}>
            {t("statCancelled")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#dc2626", marginTop: "4px" }}>
            {stats.cancelled}
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
          <option value="confirmed">{t("statusConfirmed")}</option>
          <option value="completed">{t("statusCompleted")}</option>
          <option value="pending">{t("statusPending")}</option>
          <option value="cancelled">{t("statusCancelled")}</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
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
          <option value="ALL">{t("filterTypeAll")}</option>
          <option value="online">{t("typeOnline")}</option>
          <option value="in_person">{t("typeInPerson")}</option>
          <option value="home_visit">{t("typeHomeVisit")}</option>
        </select>

        {(search || statusFilter !== "ALL" || typeFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
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

      {/* Appointment List / Table */}
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
      ) : appointments.length === 0 ? (
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
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📅</div>
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
          {appointments.map((apt) => {
            const typeColor = getTypeBadgeColor(apt.type);
            const isCancelled = apt.status.toLowerCase() === "cancelled";
            const isCompleted = apt.status.toLowerCase() === "completed";

            return (
              <div
                key={apt.id}
                style={{
                  background: "var(--bg, #ffffff)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light, #e2e8f0)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
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
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      🕒 {formatDateTime(apt.startsAt)}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: typeColor.bg,
                        color: typeColor.color,
                        border: `1px solid ${typeColor.border}`,
                      }}
                    >
                      {getTypeLabel(apt.type)}
                    </span>
                    <AdminStatusBadge
                      status={apt.status}
                      label={getStatusLabel(apt.status)}
                      size="sm"
                    />
                  </div>

                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    ID: {apt.id.slice(0, 10)}...
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    background: "#f8fafc",
                    padding: "12px 14px",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      {t("colPatient")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                      {apt.user.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {apt.user.email} {apt.user.phone ? `· ${apt.user.phone}` : ""}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      {t("colDoctor")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                      {apt.doctor.title} {apt.doctor.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {apt.doctor.specialty} {apt.doctor.city ? `· ${apt.doctor.city}` : ""}
                    </div>
                  </div>

                  {apt.organization && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                        {t("colFacility")}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                        {apt.organization.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {apt.organization.city}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visit address if home care */}
                {(apt.visitAddress || apt.visitCity) && (
                  <div style={{ fontSize: "12px", color: "#475569", background: "#faf5ff", padding: "8px 12px", borderRadius: "6px" }}>
                    📍 <strong>{t("visitAddressLabel")}:</strong> {apt.visitAddress}{" "}
                    {apt.visitDistrict ? `(${apt.visitDistrict}` : ""}{apt.visitCity ? ` / ${apt.visitCity})` : ""}
                  </div>
                )}

                {/* Actions */}
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
                    onClick={() => openDetail(apt)}
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

                  {!isCancelled && !isCompleted && (
                    <button
                      onClick={() => handleCompleteClick(apt)}
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
                      ✓ {t("btnComplete")}
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelClick(apt)}
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
                      ✕ {t("btnCancel")}
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
      {viewingAppointment && (
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
            if (e.target === e.currentTarget) setViewingAppointment(null);
          }}
        >
          <div
            style={{
              background: "var(--bg, #ffffff)",
              borderRadius: "16px",
              maxWidth: "680px",
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
                  {t("detailModalTitle")}
                </h2>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                  ID: {viewingAppointment.id}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge
                  status={viewingAppointment.status}
                  label={getStatusLabel(viewingAppointment.status)}
                />
                <button
                  onClick={() => setViewingAppointment(null)}
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

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Timing & Type */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {t("fieldStartsAt")}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                    🕒 {formatDateTime(viewingAppointment.startsAt)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {t("fieldType")}
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                    {getTypeLabel(viewingAppointment.type)}
                  </div>
                </div>
              </div>

              {/* Patient info */}
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                  👤 {t("sectionPatient")}
                </h4>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px",
                    borderRadius: "8px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldName")}:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{viewingAppointment.user.name}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldEmail")}:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{viewingAppointment.user.email}</div>
                  </div>
                  {viewingAppointment.user.phone && (
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldPhone")}:</span>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>{viewingAppointment.user.phone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor info */}
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                  👨‍⚕️ {t("sectionDoctor")}
                </h4>
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px",
                    borderRadius: "8px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldName")}:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {viewingAppointment.doctor.title} {viewingAppointment.doctor.name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldSpecialty")}:</span>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {viewingAppointment.doctor.specialty}
                    </div>
                  </div>
                  {viewingAppointment.doctor.city && (
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldCity")}:</span>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>{viewingAppointment.doctor.city}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization info if any */}
              {viewingAppointment.organization && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                    🏥 {t("sectionFacility")}
                  </h4>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "14px",
                      borderRadius: "8px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldOrgName")}:</span>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {viewingAppointment.organization.name}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{t("fieldOrgCity")}:</span>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {viewingAppointment.organization.city}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visit location if home care */}
              {(viewingAppointment.visitAddress || viewingAppointment.visitCity) && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                    📍 {t("sectionHomeVisitAddress")}
                  </h4>
                  <div style={{ background: "#faf5ff", padding: "14px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "14px", color: "#1e293b" }}>
                      {viewingAppointment.visitAddress}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {viewingAppointment.visitDistrict} / {viewingAppointment.visitCity}
                    </div>
                  </div>
                </div>
              )}

              {/* Note */}
              {viewingAppointment.note && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                    📝 {t("fieldNote")}
                  </h4>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
                    {viewingAppointment.note}
                  </div>
                </div>
              )}

              {/* Audit history */}
              {viewingAppointment.recentLogs && viewingAppointment.recentLogs.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                    🛡 {t("auditHistory")}
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {viewingAppointment.recentLogs.map((log) => (
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
                          {log.metadata?.reason ? ` · ${log.metadata.reason}` : ""}
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
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setViewingAppointment(null)}
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

      {/* CONFIRM / CANCEL ACTION DIALOG */}
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

