"use client";

import { useEffect, useState, useCallback } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";
import { useTranslations } from "next-intl";

type PackageInfo = {
  id: string;
  title: string;
  price?: number | null;
  currency?: string | null;
  durationDays?: number | null;
  isPublished?: boolean;
};

type Agency = {
  id: string;
  name: string;
  slug?: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  languages?: string[];
  description?: string | null;
  isVerified?: boolean;
  status: string;
  isActive?: boolean;
  createdAt?: string;
  owner?: { id?: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  verificationDocuments?: any[];
  packages?: PackageInfo[];
  _count?: { packages: number; services?: number };
};

type AgencyStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export default function AdminAgencyList() {
  const t = useTranslations("admin.agencyList");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Data
  const [rows, setRows] = useState<Agency[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<AgencyStats>({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals & Action States
  const [viewingAgency, setViewingAgency] = useState<Agency | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "packages" | "documents">("overview");

  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    languages: string;
    description: string;
    isActive: boolean;
  }>({
    name: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    languages: "",
    description: "",
    isActive: false,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Dependency Guard Callout Modal
  const [dependencyWarningAgency, setDependencyWarningAgency] = useState<Agency | null>(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "APPROVE" | "REJECT" | "SUSPEND" | "DELETE";
    agency: Agency;
    title: string;
    description: string;
    confirmLabel?: string;
    variant: "danger" | "warning" | "primary";
    showReasonInput?: boolean;
    requireReason?: boolean;
    reasonPlaceholder?: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (cityFilter.trim()) params.set("city", cityFilter.trim());

      const response = await fetch(`/api/admin/agencies?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("loadError"));
        setRows([]);
        return;
      }

      if (Array.isArray(data)) {
        setRows(data);
        setTotal(data.length);
        setTotalPages(1);
      } else if (data && data.rows) {
        setRows(data.rows);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      } else {
        setRows([]);
      }
    } catch {
      setError(t("loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, cityFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Handlers ---
  async function openDetailModal(agency: Agency) {
    try {
      const res = await fetch(`/api/admin/agencies?id=${agency.id}`);
      const data = await res.json();
      if (data && data.ok && data.data) {
        setViewingAgency(data.data);
      } else {
        setViewingAgency(agency);
      }
    } catch {
      setViewingAgency(agency);
    }
    setDetailTab("overview");
  }

  function openEditModal(agency: Agency) {
    setEditingAgency(agency);
    setEditError("");
    setEditForm({
      name: agency.name || "",
      city: agency.city || "",
      phone: agency.phone || "",
      email: agency.email || "",
      website: agency.website || "",
      languages: (agency.languages || []).join(", "),
      description: agency.description || "",
      isActive: !!agency.isActive,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAgency) return;

    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setEditError(t("fieldName") + " en az 2 karakter olmalıdır.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch(`/api/admin/agencies`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          id: editingAgency.id,
          name: editForm.name.trim(),
          city: editForm.city.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
          website: editForm.website.trim() || null,
          languages: editForm.languages.split(",").map((s) => s.trim()).filter(Boolean),
          description: editForm.description.trim() || null,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setEditError(data.error || t("updateError"));
        return;
      }

      setSuccess(t("saveSuccess"));
      setEditingAgency(null);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setEditError(t("updateError"));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleActionClick(agency: Agency, actionType: "APPROVE" | "REJECT" | "SUSPEND") {
    if (actionType === "APPROVE") {
      setConfirmDialog({
        type: "APPROVE",
        agency,
        title: t("confirmApproveTitle"),
        description: t("confirmApproveDesc", { name: agency.name }),
        confirmLabel: t("approve"),
        variant: "primary",
      });
    } else if (actionType === "REJECT") {
      setConfirmDialog({
        type: "REJECT",
        agency,
        title: t("confirmRejectTitle"),
        description: t("confirmRejectDesc", { name: agency.name }),
        confirmLabel: t("reject"),
        variant: "danger",
        showReasonInput: true,
        reasonPlaceholder: t("promptReason"),
      });
    } else if (actionType === "SUSPEND") {
      setConfirmDialog({
        type: "SUSPEND",
        agency,
        title: t("confirmSuspendTitle"),
        description: t("confirmSuspendDesc", { name: agency.name }),
        confirmLabel: t("suspend"),
        variant: "warning",
        showReasonInput: true,
        reasonPlaceholder: t("promptReason"),
      });
    }
  }

  async function executeStatusUpdate(agency: Agency, approved: boolean, status: string, reason?: string) {
    setIsBusy(true);
    try {
      const response = await fetch(`/api/admin/agencies`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agency.id,
          approved,
          status,
          reason: reason || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || t("updateError"));
      } else {
        await load();
        if (viewingAgency && viewingAgency.id === agency.id) {
          setViewingAgency((prev) => (prev ? { ...prev, status, isActive: approved, isVerified: approved } : null));
        }
      }
    } finally {
      setIsBusy(false);
      setConfirmDialog(null);
    }
  }

  function handleDeleteClick(agency: Agency) {
    const pkgCount = agency._count?.packages || 0;
    if (pkgCount > 0) {
      setDependencyWarningAgency(agency);
      return;
    }

    setConfirmDialog({
      type: "DELETE",
      agency,
      title: t("confirmDeleteTitle"),
      description: t("confirmDeleteDesc", { name: agency.name }),
      confirmLabel: t("deleteAgency"),
      variant: "danger",
      showReasonInput: true,
      reasonPlaceholder: t("promptReason"),
    });
  }

  async function executeDelete(agency: Agency) {
    setIsBusy(true);
    try {
      const response = await fetch(`/api/admin/agencies?id=${agency.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || t("updateError"));
      } else {
        setSuccess(t("deleteSuccess"));
        await load();
        setTimeout(() => setSuccess(""), 4000);
      }
    } finally {
      setIsBusy(false);
      setConfirmDialog(null);
    }
  }

  async function handleToggleActive(agency: Agency) {
    const newActive = !agency.isActive;
    try {
      const response = await fetch(`/api/admin/agencies`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          id: agency.id,
          name: agency.name,
          isActive: newActive,
          reason: newActive ? "Admin activated agency" : "Admin deactivated agency",
        }),
      });
      if (response.ok) {
        await load();
      }
    } catch {
      // ignore
    }
  }

  async function handleConfirmModalSubmit(reason?: string) {
    if (!confirmDialog) return;
    if (confirmDialog.type === "APPROVE") {
      await executeStatusUpdate(confirmDialog.agency, true, "APPROVED", reason);
    } else if (confirmDialog.type === "REJECT") {
      await executeStatusUpdate(confirmDialog.agency, false, "REJECTED", reason);
    } else if (confirmDialog.type === "SUSPEND") {
      await executeStatusUpdate(confirmDialog.agency, false, "SUSPENDED", reason);
    } else if (confirmDialog.type === "DELETE") {
      await executeDelete(confirmDialog.agency);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Alert Notices */}
      {error && (
        <AdminCallout variant="danger" title={t("loadError")}>
          {error}
        </AdminCallout>
      )}
      {success && (
        <AdminCallout variant="success">
          {success}
        </AdminCallout>
      )}

      {/* KPI Stats Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          onClick={() => { setStatusFilter("ALL"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: statusFilter === "ALL" ? "#eff6ff" : "var(--bg, #ffffff)",
            border: statusFilter === "ALL" ? "2px solid #3b82f6" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
            {t("statTotal")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#1e293b" }}>
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => { setStatusFilter("APPROVED"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: statusFilter === "APPROVED" ? "#ecfdf5" : "var(--bg, #ffffff)",
            border: statusFilter === "APPROVED" ? "2px solid #10b981" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>
            {t("statApproved")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#059669" }}>
            {stats.approved}
          </div>
        </div>

        <div
          onClick={() => { setStatusFilter("PENDING"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: statusFilter === "PENDING" ? "#fffbeb" : "var(--bg, #ffffff)",
            border: statusFilter === "PENDING" ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>
            {t("statPending")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#d97706" }}>
            {stats.pending}
          </div>
        </div>

        <div
          onClick={() => { setStatusFilter("REJECTED"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: statusFilter === "REJECTED" ? "#fef2f2" : "var(--bg, #ffffff)",
            border: statusFilter === "REJECTED" ? "2px solid #ef4444" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#7f1d1d", fontWeight: 600 }}>
            {t("statRejected")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#991b1b" }}>
            {stats.rejected}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          background: "var(--card-bg, #ffffff)",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid var(--border-light, #e2e8f0)",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
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
          <span style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="ALL">{t("filterStatusAll")}</option>
          <option value="PENDING">{t("filterStatusPending")}</option>
          <option value="APPROVED">{t("filterStatusApproved")}</option>
          <option value="REJECTED">{t("filterStatusRejected")}</option>
        </select>

        <input
          type="text"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          placeholder="Şehir (örn: Antalya)"
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            width: "160px",
          }}
        />

        {(search || statusFilter !== "ALL" || cityFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setCityFilter("");
              setPage(1);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-light, #cbd5e1)",
              background: "#f1f5f9",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Main Agency List */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
          Yükleniyor...
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--card-bg, #ffffff)",
            borderRadius: "12px",
            border: "1px dashed var(--border-light, #cbd5e1)",
            color: "var(--text-muted, #64748b)",
          }}
        >
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>✈️</div>
          <div style={{ fontWeight: 600, fontSize: "16px" }}>{t("empty")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {rows.map((agency) => {
            const pkgCount = agency._count?.packages || 0;

            return (
              <div
                key={agency.id}
                style={{
                  border: "1px solid var(--border-light, #e2e8f0)",
                  borderRadius: "12px",
                  padding: "20px",
                  backgroundColor: "var(--bg, #ffffff)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                        {agency.name}
                      </h3>
                      {agency.city && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                          }}
                        >
                          📍 {agency.city}
                        </span>
                      )}
                      {agency.isVerified && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "100px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          ✓ {t("badgeVerified")}
                        </span>
                      )}
                      {agency.isActive ? (
                        <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                          ● {t("badgeActive")}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                          ○ {t("badgeInactive")}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                      <span>
                        👤 {agency.owner?.name || t("defaultOwner")} ({agency.owner?.email || agency.email || "—"})
                      </span>
                      {agency.phone && (
                        <span>📞 {agency.phone}</span>
                      )}
                      {agency.website && (
                        <a
                          href={agency.website.startsWith("http") ? agency.website : `https://${agency.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "none" }}
                        >
                          🌐 {agency.website}
                        </a>
                      )}
                    </div>

                    {agency.languages && agency.languages.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                        {agency.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              background: "#f0fdf4",
                              color: "#166534",
                              border: "1px solid #bbf7d0",
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            🌐 {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AdminStatusBadge status={agency.status} />
                  </div>
                </div>

                {/* Bottom Row with Resources & Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderTop: "1px solid var(--border-light, #f1f5f9)",
                    paddingTop: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      📦 {t("countPackages", { count: pkgCount })}
                    </span>

                    <AdminVerificationDocuments
                      documents={agency.verificationDocuments || []}
                      onChanged={load}
                    />
                  </div>

                  {/* Actions Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => openDetailModal(agency)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      👁️ {t("viewDetails")}
                    </button>

                    <button
                      onClick={() => openEditModal(agency)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✏️ {t("editAgency")}
                    </button>

                    {/* Status Mutation Buttons */}
                    {agency.status !== "APPROVED" ? (
                      <button
                        onClick={() => handleActionClick(agency, "APPROVE")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#10b981",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✓ {t("approve")}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleActionClick(agency, "SUSPEND")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #fde68a",
                            background: "#fffbeb",
                            color: "#b45309",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ⚠️ {t("suspend")}
                        </button>
                        <button
                          onClick={() => handleToggleActive(agency)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            color: agency.isActive ? "#64748b" : "#16a34a",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {agency.isActive ? t("deactivate") : t("activate")}
                        </button>
                      </>
                    )}

                    {agency.status === "PENDING" && (
                      <button
                        onClick={() => handleActionClick(agency, "REJECT")}
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
                        ✕ {t("reject")}
                      </button>
                    )}

                    {/* Guarded Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(agency)}
                      title={pkgCount > 0 ? "Kayıtlı sağlık turizmi paketleri bulunduğu için silinemez" : t("deleteAgency")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        background: pkgCount > 0 ? "#f8fafc" : "#fef2f2",
                        color: pkgCount > 0 ? "#94a3b8" : "#dc2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🗑️ {t("deleteAgency")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "var(--card-bg, #ffffff)",
            borderRadius: "12px",
            border: "1px solid var(--border-light, #e2e8f0)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--text-muted, #64748b)" }}>
            {t("pageInfo", {
              total,
              from: Math.min((page - 1) * pageSize + 1, total),
              to: Math.min(page * pageSize, total),
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: page <= 1 ? "#f1f5f9" : "#ffffff",
                color: page <= 1 ? "#94a3b8" : "#0f172a",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {t("prevPage")}
            </button>

            <span style={{ fontSize: "14px", fontWeight: 600, padding: "0 8px" }}>
              {t("pageNumber", { current: page, total: totalPages })}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: page >= totalPages ? "#f1f5f9" : "#ffffff",
                color: page >= totalPages ? "#94a3b8" : "#0f172a",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {t("nextPage")}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingAgency && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                  {viewingAgency.name}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {viewingAgency.city || "—"} · Sağlık Turizmi Acentesi
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge status={viewingAgency.status} />
                <button
                  onClick={() => setViewingAgency(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#94a3b8",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "10px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => setDetailTab("overview")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "overview" ? "#ffffff" : "transparent",
                  color: detailTab === "overview" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: detailTab === "overview" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {t("tabOverview")}
              </button>
              <button
                onClick={() => setDetailTab("packages")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "packages" ? "#ffffff" : "transparent",
                  color: detailTab === "packages" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: detailTab === "packages" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {t("tabPackages", { count: viewingAgency.packages?.length || viewingAgency._count?.packages || 0 })}
              </button>
              <button
                onClick={() => setDetailTab("documents")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "documents" ? "#ffffff" : "transparent",
                  color: detailTab === "documents" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: detailTab === "documents" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {t("tabDocuments")} ({viewingAgency.verificationDocuments?.length || 0})
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {detailTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldName")}</label>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{viewingAgency.name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldOwner")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {viewingAgency.owner?.name || t("defaultOwner")} ({viewingAgency.owner?.email || viewingAgency.email || "—"})
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldCity")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingAgency.city || "—"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldPhone")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingAgency.phone || "—"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldEmail")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingAgency.email || "—"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldWebsite")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingAgency.website || "—"}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldLanguages")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {viewingAgency.languages && viewingAgency.languages.length > 0
                        ? viewingAgency.languages.join(", ")
                        : t("noLanguages")}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldDescription")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px", color: viewingAgency.description ? "#0f172a" : "#94a3b8" }}>
                      {viewingAgency.description || "Tanıtım açıklaması girilmemiş"}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "packages" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {viewingAgency.packages && viewingAgency.packages.length > 0 ? (
                    viewingAgency.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>{pkg.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            {pkg.durationDays ? t("pkgDuration", { days: pkg.durationDays }) : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {pkg.price && (
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                              {t("pkgPrice", { price: pkg.price, currency: pkg.currency || "EUR" })}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "100px",
                              fontWeight: 600,
                              background: pkg.isPublished ? "#ecfdf5" : "#f1f5f9",
                              color: pkg.isPublished ? "#047857" : "#64748b",
                            }}
                          >
                            {pkg.isPublished ? t("pkgPublished") : t("pkgDraft")}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      {t("noPackages")}
                    </div>
                  )}
                </div>
              )}

              {detailTab === "documents" && (
                <AdminVerificationDocuments
                  documents={viewingAgency.verificationDocuments || []}
                  onChanged={() => {
                    load();
                    fetch(`/api/admin/agencies?id=${viewingAgency.id}`)
                      .then((r) => r.json())
                      .then((d) => d.data && setViewingAgency(d.data));
                  }}
                />
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setViewingAgency(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {t("closeModal")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAgency && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <form
            onSubmit={handleSaveEdit}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>{t("modalEditTitle")}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {t("modalEditSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgency(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {editError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "13px" }}>
                  {editError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  {t("fieldName")} *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldCity")}
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldPhone")}
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldEmail")}
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldWebsite")}
                  </label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                  {t("fieldLanguages")}
                </label>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>
                  {t("fieldLanguagesHelp")}
                </span>
                <input
                  type="text"
                  value={editForm.languages}
                  onChange={(e) => setEditForm((p) => ({ ...p, languages: e.target.value }))}
                  placeholder="İngilizce, Almanca, Rusça"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  {t("fieldDescription")}
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>{t("fieldIsActive")}</span>
                </label>
              </div>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setEditingAgency(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {t("closeModal")}
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: isSavingEdit ? "not-allowed" : "pointer",
                  opacity: isSavingEdit ? 0.7 : 1,
                }}
              >
                {isSavingEdit ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dependency Warning Dialog */}
      {dependencyWarningAgency && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🚫</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#991b1b" }}>
                {t("dependenciesModalTitle")}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: "14px", color: "#334155", lineHeight: 1.5 }}>
              {t("hasPackagesWarning", {
                count: dependencyWarningAgency._count?.packages || 0,
              })}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setDependencyWarningAgency(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {t("closeModal")}
              </button>
              <button
                onClick={() => {
                  const agToSuspend = dependencyWarningAgency;
                  setDependencyWarningAgency(null);
                  handleActionClick(agToSuspend, "SUSPEND");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  color: "#b45309",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ⚠️ {t("suspend")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleConfirmModalSubmit}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.confirmLabel}
          showReasonInput={confirmDialog.showReasonInput}
          reasonPlaceholder={confirmDialog.reasonPlaceholder}
          isBusy={isBusy}
        />
      )}
    </div>
  );
}
