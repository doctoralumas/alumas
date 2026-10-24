"use client";

import { useEffect, useState, useCallback } from "react";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";
import { useTranslations } from "next-intl";

type UserDoctor = {
  id: string;
  name: string;
  specialty: string;
  title: string;
  isVerified: boolean;
  isPublished: boolean;
  hospital?: string;
  city?: string;
  _count?: { appointments: number; reviews: number };
};

type UserOrg = {
  id: string;
  name: string;
  type: string;
  city: string;
  status: string;
  isPublished: boolean;
  _count?: { doctors: number; services: number; appointments: number };
};

type UserAgency = {
  id: string;
  name: string;
  city?: string | null;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  _count?: { packages: number };
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  birthDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  doctorProfile?: UserDoctor | null;
  organizations?: UserOrg[];
  tourismAgencies?: UserAgency[];
  _count?: {
    appointments?: number;
    doctorReviews?: number;
    organizationReviews?: number;
    healthEntries?: number;
    documents?: number;
    sessions?: number;
  };
  recentLogs?: any[];
};

type UserStats = {
  total: number;
  patients: number;
  doctors: number;
  institutionStaff: number;
  admins: number;
};

export default function AdminUserList() {
  const t = useTranslations("admin.usersList");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Data
  const [rows, setRows] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    patients: 0,
    doctors: 0,
    institutionStaff: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals & Action States
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "entities" | "activity">("overview");

  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    birthDate: string;
  }>({
    name: "",
    phone: "",
    birthDate: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Dependency Guard Callout
  const [dependencyWarningUser, setDependencyWarningUser] = useState<UserItem | null>(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "DELETE";
    user: UserItem;
    title: string;
    description: string;
    confirmLabel?: string;
    variant: "danger" | "warning";
    showReasonInput?: boolean;
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
      if (roleFilter !== "ALL") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("loadError"));
        setRows([]);
        return;
      }

      setRows(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setError(t("loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Handlers ---
  async function openDetailModal(user: UserItem) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      if (data && data.ok && data.data) {
        setViewingUser(data.data);
      } else {
        setViewingUser(user);
      }
    } catch {
      setViewingUser(user);
    }
    setDetailTab("overview");
  }

  function openEditModal(user: UserItem) {
    setEditingUser(user);
    setEditError("");
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setEditError(t("fieldName") + " en az 2 karakter olmalıdır.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || null,
          birthDate: editForm.birthDate ? editForm.birthDate : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(data.error || t("updateError"));
        return;
      }

      setSuccess(t("saveSuccess"));
      setEditingUser(null);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setEditError(t("updateError"));
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleDeleteClick(user: UserItem) {
    if (user.role === "ADMIN") {
      setError(t("cannotDeleteAdmin"));
      return;
    }

    const docDeps = user.doctorProfile ? 1 : 0;
    const orgCount = user.organizations?.length || 0;
    const agencyCount = user.tourismAgencies?.length || 0;
    const appointmentCount = user._count?.appointments || 0;

    const totalDeps = docDeps + orgCount + agencyCount + appointmentCount;

    if (totalDeps > 0) {
      setDependencyWarningUser(user);
      return;
    }

    setConfirmDialog({
      type: "DELETE",
      user,
      title: t("confirmDeleteTitle"),
      description: t("confirmDeleteDesc", { name: user.name, email: user.email }),
      confirmLabel: t("deleteUser"),
      variant: "danger",
      showReasonInput: true,
      reasonPlaceholder: "Silme gerekçesi (isteğe bağlı)",
    });
  }

  async function executeDelete(user: UserItem) {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
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

      {/* KPI Stats Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          onClick={() => { setRoleFilter("ALL"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: roleFilter === "ALL" ? "#eff6ff" : "var(--bg, #ffffff)",
            border: roleFilter === "ALL" ? "2px solid #3b82f6" : "1px solid var(--border-light, #e2e8f0)",
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
          onClick={() => { setRoleFilter("PATIENT"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: roleFilter === "PATIENT" ? "#f0fdf4" : "var(--bg, #ffffff)",
            border: roleFilter === "PATIENT" ? "2px solid #10b981" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>
            {t("statPatients")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#059669" }}>
            {stats.patients}
          </div>
        </div>

        <div
          onClick={() => { setRoleFilter("DOCTOR"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: roleFilter === "DOCTOR" ? "#eff6ff" : "var(--bg, #ffffff)",
            border: roleFilter === "DOCTOR" ? "2px solid #2563eb" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600 }}>
            {t("statDoctors")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#2563eb" }}>
            {stats.doctors}
          </div>
        </div>

        <div
          onClick={() => { setRoleFilter("INSTITUTION_STAFF"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: roleFilter === "INSTITUTION_STAFF" ? "#fffbeb" : "var(--bg, #ffffff)",
            border: roleFilter === "INSTITUTION_STAFF" ? "2px solid #f59e0b" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>
            {t("statStaff")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#d97706" }}>
            {stats.institutionStaff}
          </div>
        </div>

        <div
          onClick={() => { setRoleFilter("ADMIN"); setPage(1); }}
          style={{
            cursor: "pointer",
            background: roleFilter === "ADMIN" ? "#fdf4ff" : "var(--bg, #ffffff)",
            border: roleFilter === "ADMIN" ? "2px solid #a855f7" : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#7e22ce", fontWeight: 600 }}>
            {t("statAdmins")}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px", color: "#9333ea" }}>
            {stats.admins}
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
        <div style={{ flex: "1 1 260px", minWidth: "220px", position: "relative" }}>
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
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="ALL">{t("filterRoleAll")}</option>
          <option value="PATIENT">{t("filterRolePatient")}</option>
          <option value="DOCTOR">{t("filterRoleDoctor")}</option>
          <option value="INSTITUTION_STAFF">{t("filterRoleStaff")}</option>
          <option value="ADMIN">{t("filterRoleAdmin")}</option>
        </select>

        {(search || roleFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("ALL");
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

      {/* Users List */}
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
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
          <div style={{ fontWeight: 600, fontSize: "16px" }}>{t("empty")}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {rows.map((user) => {
            const orgCount = user.organizations?.length || 0;
            const agencyCount = user.tourismAgencies?.length || 0;
            const appointmentCount = user._count?.appointments || 0;

            return (
              <div
                key={user.id}
                style={{
                  border: "1px solid var(--border-light, #e2e8f0)",
                  borderRadius: "12px",
                  padding: "18px",
                  backgroundColor: "var(--bg, #ffffff)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
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
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        color: "#334155",
                        fontWeight: 700,
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #e2e8f0",
                        flexShrink: 0,
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text, #0f172a)" }}>
                          {user.name}
                        </h3>
                        <AdminStatusBadge status={user.role} size="sm" />
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", marginTop: "2px" }}>
                        ✉️ {user.email} {user.phone ? `· 📞 ${user.phone}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Registered date */}
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {t("colCreatedAt")}: {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>

                {/* Linked Entities and Activity Summary */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    borderTop: "1px solid var(--border-light, #f1f5f9)",
                    paddingTop: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {user.doctorProfile && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        👨‍⚕️ {user.doctorProfile.title ? `${user.doctorProfile.title} ` : ""}{user.doctorProfile.specialty}
                      </span>
                    )}

                    {orgCount > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        🏥 {t("badgeOrgOwner", { count: orgCount })}
                      </span>
                    )}

                    {agencyCount > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        ✈️ {t("badgeAgencyOwner", { count: agencyCount })}
                      </span>
                    )}

                    {appointmentCount > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          background: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontWeight: 500,
                        }}
                      >
                        📅 {t("countAppointments", { count: appointmentCount })}
                      </span>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => openDetailModal(user)}
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
                      onClick={() => openEditModal(user)}
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
                      ✏️ {t("editUser")}
                    </button>

                    <button
                      onClick={() => handleDeleteClick(user)}
                      title={user.role === "ADMIN" ? t("cannotDeleteAdmin") : t("deleteUser")}
                      disabled={user.role === "ADMIN"}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                        background: user.role === "ADMIN" ? "#f1f5f9" : "#fef2f2",
                        color: user.role === "ADMIN" ? "#94a3b8" : "#dc2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: user.role === "ADMIN" ? "not-allowed" : "pointer",
                      }}
                    >
                      🗑️ {t("deleteUser")}
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

      {/* User Details Modal */}
      {viewingUser && (
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
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>{viewingUser.name}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {viewingUser.email}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AdminStatusBadge status={viewingUser.role} />
                <button
                  onClick={() => setViewingUser(null)}
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
                }}
              >
                {t("tabOverview")}
              </button>
              <button
                onClick={() => setDetailTab("entities")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "entities" ? "#ffffff" : "transparent",
                  color: detailTab === "entities" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("tabEntities")} ({(viewingUser.doctorProfile ? 1 : 0) + (viewingUser.organizations?.length || 0) + (viewingUser.tourismAgencies?.length || 0)})
              </button>
              <button
                onClick={() => setDetailTab("activity")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: detailTab === "activity" ? "#ffffff" : "transparent",
                  color: detailTab === "activity" ? "#2563eb" : "#64748b",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("tabActivity")}
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {detailTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldName")}</label>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{viewingUser.name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldRole")}</label>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{viewingUser.role}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldEmail")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingUser.email}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldPhone")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>{viewingUser.phone || "—"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldCreatedAt")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {new Date(viewingUser.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{t("fieldBirthDate")}</label>
                    <div style={{ fontSize: "14px", marginTop: "2px" }}>
                      {viewingUser.birthDate ? new Date(viewingUser.birthDate).toLocaleDateString("tr-TR") : "—"}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "entities" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {viewingUser.doctorProfile && (
                    <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e40af" }}>
                        👨‍⚕️ Uzman Profili: {viewingUser.doctorProfile.title ? `${viewingUser.doctorProfile.title} ` : ""}{viewingUser.doctorProfile.name}
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                        {viewingUser.doctorProfile.specialty} · {viewingUser.doctorProfile.hospital || "—"} ({viewingUser.doctorProfile.city})
                      </div>
                    </div>
                  )}

                  {viewingUser.organizations && viewingUser.organizations.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#64748b" }}>Sahip Olunan Kurumlar:</div>
                      {viewingUser.organizations.map((org) => (
                        <div key={org.id} style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>🏥 {org.name} ({org.type})</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {org.city} · Durum: {org.status}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewingUser.tourismAgencies && viewingUser.tourismAgencies.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#64748b" }}>Sağlık Turizmi Acenteleri:</div>
                      {viewingUser.tourismAgencies.map((agency) => (
                        <div key={agency.id} style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontWeight: 600, fontSize: "14px" }}>✈️ {agency.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>Durum: {agency.status} · Aktif: {agency.isActive ? "Evet" : "Hayır"}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!viewingUser.doctorProfile && (!viewingUser.organizations || viewingUser.organizations.length === 0) && (!viewingUser.tourismAgencies || viewingUser.tourismAgencies.length === 0) && (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      {t("noEntities")}
                    </div>
                  )}
                </div>
              )}

              {detailTab === "activity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>📅 Randevular: {viewingUser._count?.appointments || 0}</div>
                    </div>
                    <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>⭐ Değerlendirmeler: {(viewingUser._count?.doctorReviews || 0) + (viewingUser._count?.organizationReviews || 0)}</div>
                    </div>
                  </div>

                  {viewingUser.recentLogs && viewingUser.recentLogs.length > 0 ? (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>Son İşlem Günlükleri:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {viewingUser.recentLogs.map((log: any) => (
                          <div key={log.id} style={{ fontSize: "12px", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                            <span><strong>{log.action}</strong> ({log.entityType})</span>
                            <span style={{ color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      {t("noAuditLogs")}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setViewingUser(null)}
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

      {/* User Edit Modal */}
      {editingUser && (
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
              maxWidth: "540px",
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
                onClick={() => setEditingUser(null)}
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

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  {t("fieldPhone")}
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+905..."
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
                  {t("fieldBirthDate")}
                </label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "12px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bae6fd",
                  fontSize: "12px",
                  color: "#0369a1",
                  lineHeight: 1.5,
                }}
              >
                🔒 <strong>Rol Bilgisi: {editingUser.role}</strong> — {t("roleSecurityNote")}
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
                onClick={() => setEditingUser(null)}
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

      {/* Dependency Safety Warning Dialog */}
      {dependencyWarningUser && (
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
                clinical: dependencyWarningUser.doctorProfile ? 1 : 0,
                orgs: dependencyWarningUser.organizations?.length || 0,
                agencies: dependencyWarningUser.tourismAgencies?.length || 0,
                appointments: dependencyWarningUser._count?.appointments || 0,
              })}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDependencyWarningUser(null)}
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

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => executeDelete(confirmDialog.user)}
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
