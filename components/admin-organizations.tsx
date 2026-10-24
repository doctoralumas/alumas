"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";
import { useTranslations } from "next-intl";

type ClaimInfo = {
  isDirectoryClaim: boolean;
  directoryInstitutionId: string | null;
  directoryInstitutionName: string | null;
  applicantRoleTitle: string | null;
  applicantNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
};

type OrgCounts = {
  doctors?: number;
  services?: number;
  reviews?: number;
  appointments?: number;
};

type Org = {
  id: string;
  name: string;
  slug?: string;
  type: string;
  status: string;
  isVerified?: boolean;
  isPublished?: boolean;
  isOnDuty?: boolean;
  rejectionReason?: string | null;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  description?: string | null;
  licenseFileName?: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
  verificationDocuments?: any[];
  owner?: { id?: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  claim?: ClaimInfo | null;
  _count?: OrgCounts;
  doctors?: any[];
  services?: any[];
};

type OrgStats = {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
};

export default function AdminOrganizations() {
  const t = useTranslations("admin.organizationsList");

  // Filter & Search States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Data States
  const [rows, setRows] = useState<Org[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stats, setStats] = useState<OrgStats>({ total: 0, pending: 0, approved: 0, suspended: 0, rejected: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Modals & Action States
  const [viewingOrg, setViewingOrg] = useState<Org | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "documents" | "resources" | "claim">("overview");
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    type: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    isPublished: boolean;
    isOnDuty: boolean;
  }>({
    name: "",
    type: "HOSPITAL",
    city: "",
    district: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    isPublished: false,
    isOnDuty: false,
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>("");

  // Dependency Guard Callout Modal
  const [dependencyWarningOrg, setDependencyWarningOrg] = useState<Org | null>(null);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "STATUS" | "DELETE" | "TOGGLE_PUBLISH";
    id: string;
    orgName: string;
    targetStatus?: string;
    title: string;
    description: string;
    confirmLabel?: string;
    variant: "danger" | "warning" | "primary";
    showReasonInput?: boolean;
    requireReason?: boolean;
    reasonPlaceholder?: string;
  } | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  // Debounce Search input
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
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (cityFilter.trim()) params.set("city", cityFilter.trim());

      const response = await fetch(`/api/admin/organizations?${params.toString()}`);
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
  }, [page, debouncedSearch, statusFilter, typeFilter, cityFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const typeLabels: Record<string, string> = {
    HOSPITAL: t("typeHospital"),
    CLINIC: t("typeClinic"),
    PHARMACY: t("typePharmacy"),
    IMAGING_CENTER: t("typeImaging"),
    LABORATORY: t("typeLab"),
  };

  // --- Handlers ---
  function openEditModal(org: Org) {
    setEditingOrg(org);
    setEditError("");
    setEditForm({
      name: org.name || "",
      type: org.type || "HOSPITAL",
      city: org.city || "",
      district: org.district || "",
      address: org.address || "",
      phone: org.phone || "",
      email: org.email || "",
      website: org.website || "",
      description: org.description || "",
      isPublished: !!org.isPublished,
      isOnDuty: !!org.isOnDuty,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOrg) return;

    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setEditError(t("fieldName") + " en az 2 karakter olmalıdır.");
      return;
    }
    if (!editForm.address.trim() || editForm.address.trim().length < 5) {
      setEditError(t("fieldAddress") + " en az 5 karakter olmalıdır.");
      return;
    }
    if (!editForm.email.trim() || !editForm.email.includes("@")) {
      setEditError(t("fieldEmail") + " geçerli olmalıdır.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          name: editForm.name.trim(),
          type: editForm.type,
          city: editForm.city.trim(),
          district: editForm.district.trim() || null,
          address: editForm.address.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          website: editForm.website.trim() || null,
          description: editForm.description.trim() || null,
          isPublished: editForm.isPublished,
          isOnDuty: editForm.isOnDuty,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setEditError(data.error || t("updateError"));
        return;
      }

      setSuccess(t("saveSuccess"));
      setEditingOrg(null);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setEditError(t("updateError"));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleActionClick(org: Org, targetStatus: string) {
    const isSuspension = targetStatus === "SUSPENDED";
    const isRejection = targetStatus === "REJECTED";

    if (isSuspension || isRejection) {
      setConfirmDialog({
        type: "STATUS",
        id: org.id,
        orgName: org.name,
        targetStatus,
        title: isSuspension ? t("suspend") : t("reject"),
        description: isSuspension
          ? `"${org.name}" kurumunu askıya almak ve tüm yayınlanan hizmetlerini durdurmak üzeresiniz.`
          : `"${org.name}" kurum başvurusunu reddetmek üzeresiniz.`,
        confirmLabel: isSuspension ? t("suspend") : t("reject"),
        variant: isSuspension ? "warning" : "danger",
        showReasonInput: true,
        reasonPlaceholder: t("promptReason"),
      });
      return;
    }

    // Direct status update for APPROVE or PENDING
    executeStatusUpdate(org.id, targetStatus);
  }

  async function executeStatusUpdate(id: string, status: string, reason?: string) {
    setIsBusy(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, reason: reason || t("defaultReason") }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || t("updateError"));
      } else {
        await load();
        if (viewingOrg && viewingOrg.id === id) {
          setViewingOrg((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } finally {
      setIsBusy(false);
      setConfirmDialog(null);
    }
  }

  function handleDeleteClick(org: Org) {
    const depCount =
      (org._count?.doctors || 0) +
      (org._count?.services || 0) +
      (org._count?.reviews || 0) +
      (org._count?.appointments || 0);

    if (depCount > 0) {
      setDependencyWarningOrg(org);
      return;
    }

    setConfirmDialog({
      type: "DELETE",
      id: org.id,
      orgName: org.name,
      title: t("confirmDeleteTitle"),
      description: t("confirmDeleteDesc", { name: org.name }),
      confirmLabel: t("deleteOrganization"),
      variant: "danger",
      showReasonInput: true,
      reasonPlaceholder: t("promptReason"),
    });
  }

  async function executeDelete(id: string) {
    setIsBusy(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
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

  async function handleTogglePublish(org: Org) {
    const newPublished = !org.isPublished;
    try {
      const response = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          name: org.name,
          type: org.type,
          city: org.city,
          address: org.address,
          phone: org.phone,
          email: org.email,
          isPublished: newPublished,
          reason: newPublished ? "Admin activated publication" : "Admin deactivated publication",
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
    if (confirmDialog.type === "STATUS") {
      await executeStatusUpdate(confirmDialog.id, confirmDialog.targetStatus || "APPROVED", reason);
    } else if (confirmDialog.type === "DELETE") {
      await executeDelete(confirmDialog.id);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Messages */}
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

      {/* Summary KPI Statistics Cards */}
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
          onClick={() => { setStatusFilter("SUSPENDED"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: statusFilter === "SUSPENDED" ? "#fef2f2" : "var(--bg, #ffffff)",
            border: statusFilter === "SUSPENDED" ? "2px solid #ef4444" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 600 }}>
            {t("statSuspended")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#dc2626" }}>
            {stats.suspended}
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
          <option value="SUSPENDED">{t("filterStatusSuspended")}</option>
          <option value="REJECTED">{t("filterStatusRejected")}</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="ALL">{t("filterTypeAll")}</option>
          <option value="HOSPITAL">{t("typeHospital")}</option>
          <option value="CLINIC">{t("typeClinic")}</option>
          <option value="PHARMACY">{t("typePharmacy")}</option>
          <option value="IMAGING_CENTER">{t("typeImaging")}</option>
          <option value="LABORATORY">{t("typeLab")}</option>
        </select>

        <input
          type="text"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          placeholder="Şehir (örn: İstanbul)"
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            width: "160px",
          }}
        />

        {(search || statusFilter !== "ALL" || typeFilter !== "ALL" || cityFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
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

      {/* Main List */}
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
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏥</div>
          <div style={{ fontWeight: 600, fontSize: "16px" }}>{t("empty")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {rows.map((org) => {
            const depCount =
              (org._count?.doctors || 0) +
              (org._count?.services || 0) +
              (org._count?.reviews || 0) +
              (org._count?.appointments || 0);

            return (
              <div
                key={org.id}
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
                        {org.name}
                      </h3>
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
                        {typeLabels[org.type] || org.type}
                      </span>
                      {org.isVerified && (
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
                          ✓ {t("alumasVerifiedBadge")}
                        </span>
                      )}
                      {org.claim?.isDirectoryClaim && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "100px",
                            background: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                          }}
                        >
                          {t("directoryClaimBadge")}
                        </span>
                      )}
                      {org.isPublished ? (
                        <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                          ● {t("badgePublished")}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                          ○ {t("badgeUnpublished")}
                        </span>
                      )}
                      {org.isOnDuty && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                          }}
                        >
                          🚨 {t("badgeOnDuty")}
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                      <span>
                        📍 <strong>{org.city}</strong>{org.district ? `, ${org.district}` : ""} · {org.address}
                      </span>
                      <span>
                        👤 {org.owner?.name || t("noOwner")} ({org.owner?.email || "—"})
                        {org.claim?.applicantRoleTitle ? ` · ${org.claim.applicantRoleTitle}` : ""}
                      </span>
                      <span>
                        📞 {org.phone} | ✉️ {org.email}
                      </span>
                      {org.website && (
                        <a
                          href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "none" }}
                        >
                          🌐 {org.website}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Badge & Primary Action Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AdminStatusBadge status={org.status} />
                  </div>
                </div>

                {/* Claim details if applicable */}
                {org.claim?.isDirectoryClaim && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#92400e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span>
                      🏥 <strong>{t("claimedDirectoryTarget")}:</strong> {org.claim.directoryInstitutionName || org.claim.directoryInstitutionId}
                      {org.claim.applicantNote ? ` — "${org.claim.applicantNote}"` : ""}
                    </span>
                  </div>
                )}

                {/* Rejection / Suspension Notice */}
                {org.rejectionReason && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#b91c1c",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>⚠️ <strong>İşlem Notu:</strong> {org.rejectionReason}</span>
                  </div>
                )}

                {/* Resources summary pills & documents */}
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
                      👨‍⚕️ {t("countDoctors", { count: org._count?.doctors || 0 })}
                    </span>
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
                      🧪 {t("countServices", { count: org._count?.services || 0 })}
                    </span>
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
                      📅 {t("countAppointments", { count: org._count?.appointments || 0 })}
                    </span>
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
                      ⭐ {t("countReviews", { count: org._count?.reviews || 0 })}
                    </span>

                    <AdminVerificationDocuments
                      documents={org.verificationDocuments || []}
                      onChanged={load}
                    />

                    {org.licenseFileName && (
                      <a
                        href={`/api/admin/organizations/${org.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#2563eb",
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "3px 8px",
                          backgroundColor: "#eff6ff",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        📄 {t("legacyFile", { name: org.licenseFileName })}
                      </a>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setViewingOrg(org); setDetailTab("overview"); }}
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
                      onClick={() => openEditModal(org)}
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
                      ✏️ {t("editOrganization")}
                    </button>

                    {/* Status Mutation Buttons */}
                    {org.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleActionClick(org, "APPROVED")}
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
                        <button
                          onClick={() => handleActionClick(org, "REJECTED")}
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
                      </>
                    )}

                    {org.status === "APPROVED" && (
                      <>
                        <button
                          onClick={() => handleActionClick(org, "SUSPENDED")}
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
                          onClick={() => handleTogglePublish(org)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            color: org.isPublished ? "#64748b" : "#16a34a",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {org.isPublished ? t("deactivate") : t("activate")}
                        </button>
                      </>
                    )}

                    {(org.status === "REJECTED" || org.status === "SUSPENDED") && (
                      <>
                        <button
                          onClick={() => handleActionClick(org, "APPROVED")}
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
                          ✓ {t("reapprove")}
                        </button>
                        <button
                          onClick={() => handleActionClick(org, "PENDING")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#334155",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {t("review")}
                        </button>
                      </>
                    )}

                    {/* Guarded Delete Button */}
                    <button
                      onClick={() => handleDeleteClick(org)}
                      title={depCount > 0 ? "Kayıtlı hekim, hizmet veya randevu bulunduğu için doğrudan silinemez" : t("deleteOrganization")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        background: depCount > 0 ? "#f8fafc" : "#fef2f2",
                        color: depCount > 0 ? "#94a3b8" : "#dc2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🗑️ {t("deleteOrganization")}
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
      {viewingOrg && (
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
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
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
                  {viewingOrg.name}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {typeLabels[viewingOrg.type] || viewingOrg.type} · {viewingOrg.city}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge status={viewingOrg.status} />
                <button
                  onClick={() => setViewingOrg(null)}
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
                {t("tabDocuments")} ({viewingOrg.verificationDocuments?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab("resources")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "resources" ? "#ffffff" : "transparent",
                  color: detailTab === "resources" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: detailTab === "resources" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {t("tabResources")}
              </button>
              {viewingOrg.claim?.isDirectoryClaim && (
                <button
                  onClick={() => setDetailTab("claim")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: detailTab === "claim" ? "#ffffff" : "transparent",
                    color: detailTab === "claim" ? "#b45309" : "#64748b",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: detailTab === "claim" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {t("tabClaim")}
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {detailTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldName")}</label>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{viewingOrg.name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldType")}</label>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>
                      {typeLabels[viewingOrg.type] || viewingOrg.type}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldOwner")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {viewingOrg.owner?.name || t("noOwner")} ({viewingOrg.owner?.email || "—"})
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldPhone")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingOrg.phone}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldEmail")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingOrg.email}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldWebsite")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingOrg.website || "—"}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldAddress")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {viewingOrg.city}{viewingOrg.district ? `, ${viewingOrg.district}` : ""} - {viewingOrg.address}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldDescription")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px", color: viewingOrg.description ? "#0f172a" : "#94a3b8" }}>
                      {viewingOrg.description || t("noDescription")}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <AdminVerificationDocuments
                    documents={viewingOrg.verificationDocuments || []}
                    onChanged={() => {
                      load();
                      fetch(`/api/admin/organizations/${viewingOrg.id}`)
                        .then((r) => r.json())
                        .then((d) => d.data && setViewingOrg(d.data));
                    }}
                  />
                  {viewingOrg.licenseFileName && (
                    <div style={{ marginTop: "12px" }}>
                      <a
                        href={`/api/admin/organizations/${viewingOrg.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#2563eb",
                          padding: "8px 14px",
                          background: "#eff6ff",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        📄 {t("legacyFile", { name: viewingOrg.licenseFileName })}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "resources" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>👨‍⚕️ {t("countDoctors", { count: viewingOrg._count?.doctors || 0 })}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>🧪 {t("countServices", { count: viewingOrg._count?.services || 0 })}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>📅 {t("countAppointments", { count: viewingOrg._count?.appointments || 0 })}</div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>⭐ {t("countReviews", { count: viewingOrg._count?.reviews || 0 })}</div>
                  </div>
                </div>
              )}

              {detailTab === "claim" && viewingOrg.claim && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fffbeb", padding: "16px", borderRadius: "10px", border: "1px solid #fef3c7" }}>
                  <div>
                    <strong style={{ color: "#92400e" }}>{t("claimedDirectoryTarget")}:</strong>{" "}
                    {viewingOrg.claim.directoryInstitutionName || viewingOrg.claim.directoryInstitutionId}
                  </div>
                  {viewingOrg.claim.applicantRoleTitle && (
                    <div>
                      <strong style={{ color: "#92400e" }}>Başvuran Unvanı:</strong> {viewingOrg.claim.applicantRoleTitle}
                    </div>
                  )}
                  {viewingOrg.claim.applicantNote && (
                    <div>
                      <strong style={{ color: "#92400e" }}>Başvuru Notu:</strong> "{viewingOrg.claim.applicantNote}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                onClick={() => setViewingOrg(null)}
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
      {editingOrg && (
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
              maxWidth: "680px",
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
                onClick={() => setEditingOrg(null)}
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

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
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
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldType")} *
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#fff",
                    }}
                  >
                    <option value="HOSPITAL">{t("typeHospital")}</option>
                    <option value="CLINIC">{t("typeClinic")}</option>
                    <option value="PHARMACY">{t("typePharmacy")}</option>
                    <option value="IMAGING_CENTER">{t("typeImaging")}</option>
                    <option value="LABORATORY">{t("typeLab")}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldCity")} *
                  </label>
                  <input
                    type="text"
                    required
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
                    {t("fieldDistrict")}
                  </label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm((p) => ({ ...p, district: e.target.value }))}
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
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  {t("fieldAddress")} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
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
                    {t("fieldPhone")} *
                  </label>
                  <input
                    type="text"
                    required
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
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    {t("fieldEmail")} *
                  </label>
                  <input
                    type="email"
                    required
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

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm((p) => ({ ...p, isPublished: e.target.checked }))}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>{t("fieldIsPublished")}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editForm.isOnDuty}
                    onChange={(e) => setEditForm((p) => ({ ...p, isOnDuty: e.target.checked }))}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>{t("fieldIsOnDuty")}</span>
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
                onClick={() => setEditingOrg(null)}
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

      {/* Dependency Guard Warning Dialog */}
      {dependencyWarningOrg && (
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
              {t("hasDependenciesWarning", {
                doctors: dependencyWarningOrg._count?.doctors || 0,
                services: dependencyWarningOrg._count?.services || 0,
                appointments: dependencyWarningOrg._count?.appointments || 0,
                reviews: dependencyWarningOrg._count?.reviews || 0,
              })}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => setDependencyWarningOrg(null)}
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
                  const orgToSuspend = dependencyWarningOrg;
                  setDependencyWarningOrg(null);
                  handleActionClick(orgToSuspend, "SUSPENDED");
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

      {/* Confirmation Dialog */}
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
