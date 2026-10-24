"use client";

import { useEffect, useState, useMemo } from "react";
import AdminVerificationDocuments, { formatReviewerNote } from "@/components/admin-verification-documents";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import { useTranslations, useLocale } from "next-intl";

export default function AdminDoctorList() {
  const t = useTranslations("admin.doctorList");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"DOCTORS" | "DIRECTORY" | "CLAIMS">("DOCTORS");

  // Registered Specialists State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<string>("all");
  const [doctorPublishedFilter, setDoctorPublishedFilter] = useState<string>("all");
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<any | null>(null);

  // Directory Specialists State
  const [directoryDoctors, setDirectoryDoctors] = useState<any[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryTotalPages, setDirectoryTotalPages] = useState(1);
  const [directoryStats, setDirectoryStats] = useState<any>({ total: 0, active: 0, claimed: 0, unclaimed: 0 });
  const [directorySearch, setDirectorySearch] = useState("");
  const [directorySourceFilter, setDirectorySourceFilter] = useState("all");
  const [directoryClaimFilter, setDirectoryClaimFilter] = useState("all");
  const [directoryActiveFilter, setDirectoryActiveFilter] = useState("all");
  const [editingDirectoryDoctor, setEditingDirectoryDoctor] = useState<any | null>(null);

  // Claims State
  const [claims, setClaims] = useState<any[]>([]);

  // General State
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionConfirmDialog, setActionConfirmDialog] = useState<{
    type: "DELETE_DOCTOR" | "REVOKE_CLAIM" | "REJECT_CLAIM" | "APPROVE_CLAIM_MISMATCH" | "APPROVE_CLAIM";
    claim?: any;
    doctor?: any;
    title: string;
    description: string;
    confirmLabel?: string;
    variant: "danger" | "warning" | "primary";
    requireReason?: boolean;
    showReasonInput?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
    minReasonLength?: number;
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const getReasonCodeLabel = (code: string) => {
    try {
      return t(`reasonCodes.${code}`);
    } catch {
      return `[${code}]`;
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch("/api/admin/doctors", {
        headers: { "x-locale": locale },
      });
      const data = await response.json();
      if (!Array.isArray(data)) {
        setError(data.error || t("loadError"));
        setDoctors([]);
        return;
      }
      setDoctors(data);
    } catch {
      setError(t("loadError"));
      setDoctors([]);
    }
  };

  const loadDirectoryDoctors = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        q: directorySearch,
        source: directorySourceFilter === "all" ? "" : directorySourceFilter,
        claimStatus: directoryClaimFilter,
        active: directoryActiveFilter,
      });

      const response = await fetch(`/api/admin/doctors/directory?${params.toString()}`, {
        headers: { "x-locale": locale },
      });
      const data = await response.json();
      if (data && data.ok) {
        setDirectoryDoctors(data.items || []);
        setDirectoryTotal(data.total || 0);
        setDirectoryPage(data.page || 1);
        setDirectoryTotalPages(data.totalPages || 1);
        if (data.stats) setDirectoryStats(data.stats);
      }
    } catch {
      // directory error handled silently or via error state if active
    }
  };

  const loadClaims = async () => {
    try {
      const response = await fetch("/api/admin/doctors/claims", {
        headers: { "x-locale": locale },
      });
      const data = await response.json();
      if (data && data.ok && Array.isArray(data.data)) {
        setClaims(data.data);
      } else {
        setClaims([]);
      }
    } catch {
      setClaims([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    await Promise.all([loadDoctors(), loadDirectoryDoctors(directoryPage), loadClaims()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Filter registered doctors locally
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (doctorSearch.trim()) {
        const query = doctorSearch.toLowerCase();
        const matchesName = doc.name?.toLowerCase().includes(query);
        const matchesSpecialty = doc.specialty?.toLowerCase().includes(query);
        const matchesCity = doc.city?.toLowerCase().includes(query);
        const matchesLicense = doc.licenseNumber?.toLowerCase().includes(query);
        const matchesEmail = doc.user?.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesSpecialty && !matchesCity && !matchesLicense && !matchesEmail) {
          return false;
        }
      }

      if (doctorStatusFilter === "verified" && !doc.isVerified) return false;
      if (doctorStatusFilter === "pending" && doc.isVerified) return false;

      if (doctorPublishedFilter === "published" && !doc.isPublished) return false;
      if (doctorPublishedFilter === "unpublished" && doc.isPublished) return false;

      return true;
    });
  }, [doctors, doctorSearch, doctorStatusFilter, doctorPublishedFilter]);

  async function setDoctorVerified(id: string, approved: boolean) {
    const response = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-locale": locale },
      body: JSON.stringify({ id, approved }),
    });
    const data = await response.json().catch(() => ({}));
    await loadAll();
    if (!response.ok) {
      setError(data.error || t("updateError"));
    } else {
      setSuccess(t("saveSuccess"));
      setTimeout(() => setSuccess(""), 4000);
    }
  }

  async function handleSaveDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      const response = await fetch(`/api/admin/doctors/${editingDoctor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          title: editingDoctor.title,
          name: editingDoctor.name,
          specialty: editingDoctor.specialty,
          city: editingDoctor.city,
          hospital: editingDoctor.hospital,
          licenseNumber: editingDoctor.licenseNumber,
          bio: editingDoctor.bio,
          price: editingDoctor.price,
          isPublished: editingDoctor.isPublished,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || t("updateError"));
      } else {
        setSuccess(t("saveSuccess"));
        setEditingDoctor(null);
        await loadAll();
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError(t("updateError"));
    }
  }

  async function handleDeleteDoctor(doc: any) {
    const totalDeps =
      (doc._count?.appointments || 0) +
      (doc._count?.carePlans || 0) +
      (doc._count?.reviews || 0);

    if (totalDeps > 0) {
      setError(t("clinicalDependenciesNotice", { count: totalDeps }));
      return;
    }

    setActionConfirmDialog({
      type: "DELETE_DOCTOR",
      doctor: doc,
      title: t("deleteDoctor"),
      description: t("confirmDelete", { name: doc.name }),
      confirmLabel: t("deleteDoctor"),
      variant: "danger",
    });
  }

  async function handleSaveDirectoryDoctor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDirectoryDoctor) return;

    try {
      const response = await fetch(`/api/admin/doctors/directory/${editingDirectoryDoctor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-locale": locale },
        body: JSON.stringify(editingDirectoryDoctor),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || t("updateError"));
      } else {
        setSuccess(t("saveSuccess"));
        setEditingDirectoryDoctor(null);
        await loadDirectoryDoctors(directoryPage);
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError(t("updateError"));
    }
  }

  async function handleToggleDirectoryActive(item: any) {
    const newActive = !item.isActive;
    try {
      const response = await fetch(`/api/admin/doctors/directory/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          isActive: newActive,
          reason: newActive ? "Admin restored directory listing" : "Admin deactivated directory listing",
        }),
      });
      if (response.ok) {
        await loadDirectoryDoctors(directoryPage);
      }
    } catch {
      // ignore
    }
  }

  async function handleClaimAction(claim: any, status: "APPROVED" | "REJECTED" | "REVOKED") {
    if (status === "REVOKED") {
      setActionConfirmDialog({
        type: "REVOKE_CLAIM",
        claim,
        title: t("confirmRevoke"),
        description: `${claim.claimant?.name || "Kullanıcı"} kullanıcısının hekim profili üzerindeki sahiplenmesini geri almak üzeresiniz. Profil yayından kaldırılacak ve dizin kaydı boşa çıkacaktır.`,
        confirmLabel: t("confirmRevoke"),
        variant: "danger",
        requireReason: true,
        minReasonLength: 10,
        reasonLabel: t("promptRevokeReason"),
        reasonPlaceholder: t("promptRevokeReason"),
      });
      return;
    }

    if (status === "REJECTED") {
      setActionConfirmDialog({
        type: "REJECT_CLAIM",
        claim,
        title: t("rejectClaim"),
        description: `${claim.claimant?.name || "Başvuru sahibi"} tarafından yapılan uzman sahiplenme başvurusunu reddetmek üzeresiniz.`,
        confirmLabel: t("rejectClaim"),
        variant: "danger",
        showReasonInput: true,
        reasonLabel: t("promptClaimRejectReason"),
        reasonPlaceholder: t("promptClaimRejectReason"),
      });
      return;
    }

    if (status === "APPROVED") {
      const isMismatch = claim.identityMatch && !claim.identityMatch.matches;
      if (isMismatch) {
        setActionConfirmDialog({
          type: "APPROVE_CLAIM_MISMATCH",
          claim,
          title: t("identityMismatchWarning"),
          description: t("identityMismatchDesc"),
          confirmLabel: t("forceApprove"),
          variant: "warning",
          requireReason: true,
          minReasonLength: 15,
          reasonLabel: t("identityMismatchPrompt"),
          reasonPlaceholder: t("overrideReasonMinLength"),
        });
        return;
      }

      setActionConfirmDialog({
        type: "APPROVE_CLAIM",
        claim,
        title: t("confirmApprove"),
        description: `${claim.claimant?.name || "Başvuru sahibi"} kullanıcısının ${claim.directoryDoctor?.name || "uzman"} sahiplenme talebini onaylamak üzeresiniz.`,
        confirmLabel: t("approveClaim"),
        variant: "primary",
      });
      return;
    }
  }

  async function handleExecuteActionConfirmDialog(reason?: string) {
    if (!actionConfirmDialog) return;
    setActionBusy(true);

    try {
      if (actionConfirmDialog.type === "DELETE_DOCTOR") {
        const doc = actionConfirmDialog.doctor;
        const response = await fetch(`/api/admin/doctors/${doc.id}`, {
          method: "DELETE",
          headers: { "x-locale": locale },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || t("updateError"));
        } else {
          setSuccess(t("deleteSuccess"));
          await loadAll();
          setTimeout(() => setSuccess(""), 4000);
        }
      } else if (actionConfirmDialog.type === "REVOKE_CLAIM") {
        const claim = actionConfirmDialog.claim;
        const response = await fetch(`/api/admin/doctors/claims/${claim.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-locale": locale },
          body: JSON.stringify({ status: "REVOKED", reason }),
        });
        const data = await response.json().catch(() => ({}));
        await loadAll();
        if (!response.ok) {
          setError(data.error || t("updateError"));
        } else {
          setSuccess(t("saveSuccess"));
          setTimeout(() => setSuccess(""), 4000);
        }
      } else if (actionConfirmDialog.type === "REJECT_CLAIM") {
        const claim = actionConfirmDialog.claim;
        const response = await fetch(`/api/admin/doctors/claims/${claim.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-locale": locale },
          body: JSON.stringify({ status: "REJECTED", reason }),
        });
        const data = await response.json().catch(() => ({}));
        await loadAll();
        if (!response.ok) {
          setError(data.error || t("updateError"));
        } else {
          setSuccess(t("saveSuccess"));
          setTimeout(() => setSuccess(""), 4000);
        }
      } else if (actionConfirmDialog.type === "APPROVE_CLAIM_MISMATCH") {
        const claim = actionConfirmDialog.claim;
        const response = await fetch(`/api/admin/doctors/claims/${claim.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-locale": locale },
          body: JSON.stringify({
            status: "APPROVED",
            forceIdentityOverride: true,
            overrideReason: reason,
          }),
        });
        const data = await response.json().catch(() => ({}));
        await loadAll();
        if (!response.ok) {
          setError(data.error || t("updateError"));
        } else {
          setSuccess(t("saveSuccess"));
          setTimeout(() => setSuccess(""), 4000);
        }
      } else if (actionConfirmDialog.type === "APPROVE_CLAIM") {
        const claim = actionConfirmDialog.claim;
        const response = await fetch(`/api/admin/doctors/claims/${claim.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-locale": locale },
          body: JSON.stringify({ status: "APPROVED" }),
        });
        const data = await response.json().catch(() => ({}));
        await loadAll();
        if (!response.ok) {
          setError(data.error || t("updateError"));
        } else {
          setSuccess(t("saveSuccess"));
          setTimeout(() => setSuccess(""), 4000);
        }
      }
    } catch {
      setError(t("updateError"));
    } finally {
      setActionBusy(false);
      setActionConfirmDialog(null);
    }
  }

  function getDoctorDocStatus(doctor: any) {
    const docs: any[] = doctor.verificationDocuments || [];
    const requiredTypes = ["IDENTITY", "MEDICAL_LICENSE"];
    const hasRejectedRequired = docs.some(
      (d) => requiredTypes.includes(d.documentType) && d.status === "REJECTED"
    );
    const hasApprovedRequired = requiredTypes.every((type) =>
      docs.some(
        (d) =>
          d.documentType === type &&
          d.status === "APPROVED" &&
          (!d.expiresAt || new Date(d.expiresAt).getTime() > Date.now())
      )
    );
    const canApprove = hasApprovedRequired;
    return {
      hasRejectedRequired,
      hasApprovedRequired,
      canApprove,
    };
  }

  const pendingClaimsCount = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="admin-tab-doctors"
          onClick={() => {
            setActiveTab("DOCTORS");
            setError("");
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "DOCTORS" ? "#2563eb" : "#f1f5f9",
            color: activeTab === "DOCTORS" ? "#ffffff" : "#475569",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {t("tabDoctors")} ({doctors.length})
        </button>

        <button
          type="button"
          data-testid="admin-tab-directory"
          onClick={() => {
            setActiveTab("DIRECTORY");
            setError("");
            loadDirectoryDoctors(1);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "DIRECTORY" ? "#2563eb" : "#f1f5f9",
            color: activeTab === "DIRECTORY" ? "#ffffff" : "#475569",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {t("tabDirectory")} ({directoryStats.total || 386})
        </button>

        <button
          type="button"
          data-testid="admin-tab-claims"
          onClick={() => {
            setActiveTab("CLAIMS");
            setError("");
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "CLAIMS" ? "#2563eb" : "#f1f5f9",
            color: activeTab === "CLAIMS" ? "#ffffff" : "#475569",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {t("tabClaims")} ({claims.length})
          {pendingClaimsCount > 0 && (
            <span
              style={{
                background: activeTab === "CLAIMS" ? "#ffffff" : "#ef4444",
                color: activeTab === "CLAIMS" ? "#2563eb" : "#ffffff",
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "100px",
                fontWeight: 700,
              }}
            >
              {pendingClaimsCount}
            </span>
          )}
        </button>
      </div>

      {error && <div className="form-error" style={{ padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
      {success && <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "14px", fontWeight: 500 }}>{success}</div>}

      {/* ======================================================== */}
      {/* 1. REGISTERED SPECIALISTS (DOCTORS TAB)                  */}
      {/* ======================================================== */}
      {activeTab === "DOCTORS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              background: "#f8fafc",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              data-testid="search-registered-doctors"
              placeholder={t("searchPlaceholder")}
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              style={{
                flex: "1 1 240px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
              }}
            />

            <select
              value={doctorStatusFilter}
              onChange={(e) => setDoctorStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="all">{t("filterAll")} ({t("fieldVerified")})</option>
              <option value="verified">{t("filterStatusVerified")}</option>
              <option value="pending">{t("filterStatusPending")}</option>
            </select>

            <select
              value={doctorPublishedFilter}
              onChange={(e) => setDoctorPublishedFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="all">{t("filterAll")} ({t("fieldPublished")})</option>
              <option value="published">{t("filterPublished")}</option>
              <option value="unpublished">{t("filterUnpublished")}</option>
            </select>

            <div style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>
              {t("statsSummary", {
                total: doctors.length,
                verified: doctors.filter((d) => d.isVerified).length,
                published: doctors.filter((d) => d.isPublished).length,
              })}
            </div>
          </div>

          {/* List of Registered Specialists */}
          <div className="slot-list">
            {filteredDoctors.length === 0 && !loading && (
              <div className="empty" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                {t("noDoctors")}
              </div>
            )}
            {filteredDoctors.map((doctor) => {
              const docStatus = getDoctorDocStatus(doctor);
              const clinicalDeps =
                (doctor._count?.appointments || 0) +
                (doctor._count?.carePlans || 0) +
                (doctor._count?.reviews || 0);

              return (
                <div
                  className="slot-row"
                  key={doctor.id}
                  data-testid={`doctor-row-${doctor.id}`}
                  style={{
                    alignItems: "flex-start",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "12px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <b style={{ fontSize: "16px", color: "#0f172a" }}>
                        {doctor.title ? `${doctor.title} ` : ""}
                        {doctor.name}
                      </b>
                      {doctor.directoryDoctor && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "#e0e7ff",
                            color: "#3730a3",
                            fontWeight: 600,
                          }}
                        >
                          🔗 {doctor.directoryDoctor.source}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                      <strong>{doctor.specialty}</strong> · {doctor.hospital || doctor.city}
                      {doctor.user?.email ? ` · ✉️ ${doctor.user.email}` : ""}
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {doctor.licenseNumber ? t("licensePrefix", { num: doctor.licenseNumber }) : "—"}
                      {doctor.price ? ` · 💳 ${doctor.price} ₺` : ""}
                    </div>

                    {/* Dependencies info indicator */}
                    <div style={{ marginTop: "6px", fontSize: "12px" }}>
                      {clinicalDeps > 0 ? (
                        <span style={{ color: "#475569", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                          📊 {t("activeDependencies", {
                            appointments: doctor._count?.appointments || 0,
                            carePlans: doctor._count?.carePlans || 0,
                            reviews: doctor._count?.reviews || 0,
                          })}
                        </span>
                      ) : (
                        <span style={{ color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: "4px" }}>
                          🛡️ {t("zeroDependencies")}
                        </span>
                      )}
                    </div>

                    {/* Document Status Alerts */}
                    {docStatus.hasRejectedRequired && (
                      <div
                        style={{
                          margin: "8px 0",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#991b1b",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        ⚠️ {t("documentsRejectedNotice")}
                      </div>
                    )}
                    {!docStatus.hasRejectedRequired && !doctor.isVerified && !docStatus.hasApprovedRequired && (
                      <div
                        style={{
                          margin: "8px 0",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#fefce8",
                          border: "1px solid #fef08a",
                          color: "#854d0e",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        ℹ️ {t("documentsPendingNotice")}
                      </div>
                    )}

                    <div style={{ marginTop: "10px" }}>
                      <AdminVerificationDocuments documents={doctor.verificationDocuments || []} onChanged={loadAll} />
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span
                        className="status"
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "100px",
                          background: doctor.isVerified
                            ? "#dcfce7"
                            : docStatus.hasRejectedRequired
                            ? "#fee2e2"
                            : "#fef3c7",
                          color: doctor.isVerified
                            ? "#15803d"
                            : docStatus.hasRejectedRequired
                            ? "#b91c1c"
                            : "#b45309",
                          border: doctor.isVerified
                            ? "1px solid #86efac"
                            : docStatus.hasRejectedRequired
                            ? "1px solid #fca5a5"
                            : "1px solid #fde68a",
                        }}
                      >
                        {doctor.isVerified
                          ? t("statusVerified")
                          : docStatus.hasRejectedRequired
                          ? t("statusDocumentsRejected")
                          : t("statusPending")}
                      </span>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 8px",
                          borderRadius: "100px",
                          background: doctor.isPublished ? "#eff6ff" : "#f1f5f9",
                          color: doctor.isPublished ? "#2563eb" : "#64748b",
                          border: doctor.isPublished ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                        }}
                      >
                        {doctor.isPublished ? t("filterPublished") : t("filterUnpublished")}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {/* Edit Button */}
                      <button
                        type="button"
                        data-testid={`edit-doctor-${doctor.id}`}
                        onClick={() => setEditingDoctor({ ...doctor })}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                        }}
                      >
                        ✏️ {t("actionEdit")}
                      </button>

                      {/* Detail Modal Button */}
                      <button
                        type="button"
                        onClick={() => setViewingDoctor(doctor)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                        }}
                      >
                        🔍 {t("actionDetail")}
                      </button>

                      {/* Approve / Unpublish Button */}
                      {doctor.isVerified ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setDoctorVerified(doctor.id, false)}
                          style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "12px" }}
                        >
                          {t("unpublish")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary"
                          disabled={!docStatus.canApprove}
                          title={
                            !docStatus.canApprove
                              ? docStatus.hasRejectedRequired
                                ? t("documentsRejectedNotice")
                                : t("documentsPendingNotice")
                              : undefined
                          }
                          style={
                            !docStatus.canApprove
                              ? { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(0.6)", padding: "6px 12px", borderRadius: "6px", fontSize: "12px" }
                              : { padding: "6px 12px", borderRadius: "6px", fontSize: "12px" }
                          }
                          onClick={() => {
                            if (!docStatus.canApprove) return;
                            setDoctorVerified(doctor.id, true);
                          }}
                        >
                          {t("approve")}
                        </button>
                      )}

                      {/* Safe Delete Button */}
                      <button
                        type="button"
                        data-testid={`delete-doctor-${doctor.id}`}
                        onClick={() => handleDeleteDoctor(doctor)}
                        disabled={clinicalDeps > 0}
                        title={clinicalDeps > 0 ? t("clinicalDependenciesNotice", { count: clinicalDeps }) : t("zeroDependencies")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: clinicalDeps > 0 ? "not-allowed" : "pointer",
                          opacity: clinicalDeps > 0 ? 0.4 : 1,
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          color: "#b91c1c",
                        }}
                      >
                        🗑️ {t("actionDelete")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EXTERNAL DIRECTORY SPECIALISTS TAB                    */}
      {/* ======================================================== */}
      {activeTab === "DIRECTORY" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Stats Bar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              background: "#eff6ff",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            📋 {t("dirStats", {
              total: directoryStats.total || 0,
              claimed: directoryStats.claimed || 0,
              unclaimed: directoryStats.unclaimed || 0,
              active: directoryStats.active || 0,
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              background: "#f8fafc",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              data-testid="search-directory-doctors"
              placeholder={t("searchPlaceholder")}
              value={directorySearch}
              onChange={(e) => {
                setDirectorySearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadDirectoryDoctors(1);
              }}
              style={{
                flex: "1 1 240px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
              }}
            />

            <select
              value={directoryClaimFilter}
              onChange={(e) => {
                setDirectoryClaimFilter(e.target.value);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="all">{t("filterClaimStatusAll")}</option>
              <option value="claimed">{t("filterClaimed")}</option>
              <option value="unclaimed">{t("filterUnclaimed")}</option>
              <option value="pending">{t("filterPendingClaim")}</option>
            </select>

            <select
              value={directoryActiveFilter}
              onChange={(e) => {
                setDirectoryActiveFilter(e.target.value);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="all">{t("filterAll")} ({t("badgeActiveListing")})</option>
              <option value="true">{t("badgeActiveListing")}</option>
              <option value="false">{t("badgeInactiveListing")}</option>
            </select>

            <button
              type="button"
              onClick={() => loadDirectoryDoctors(1)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              🔍 Ara
            </button>
          </div>

          {/* Directory Doctor Rows */}
          <div className="slot-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {directoryDoctors.length === 0 && !loading && (
              <div className="empty" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                {t("noDirectoryDoctors")}
              </div>
            )}
            {directoryDoctors.map((item) => {
              const isClaimed = Boolean(item.doctorId);
              const hasPendingClaim = item.claims?.some((c: any) => c.status === "PENDING");

              return (
                <div
                  key={item.id}
                  data-testid={`directory-doctor-${item.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: item.isActive ? "#ffffff" : "#f8fafc",
                    opacity: item.isActive ? 1 : 0.7,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <b style={{ fontSize: "16px", color: "#0f172a" }}>
                        {item.title ? `${item.title} ` : ""}
                        {item.name}
                      </b>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "#e2e8f0",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {item.source}
                      </span>
                      {item.externalRef && (
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>#{item.externalRef}</span>
                      )}
                    </div>

                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                      <strong>{item.specialty}</strong> · {item.hospital || item.city}
                      {item.district ? ` (${item.district})` : ""}
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                      {item.phone ? `📞 ${item.phone}` : ""}
                      {item.officialWebsite ? (
                        <a
                          href={item.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: "8px", color: "#2563eb", textDecoration: "none" }}
                        >
                          🌐 {t("fieldWebsite")}
                        </a>
                      ) : null}
                    </div>

                    {isClaimed && item.doctor && (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#166534" }}>
                        🔗 <strong>{t("registeredProfile")}:</strong> {item.doctor.name} ({item.doctor.user?.email || "Hesap"})
                      </div>
                    )}
                  </div>

                  {/* Status Badges and Actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {/* Claim Status Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "100px",
                          background: isClaimed ? "#dcfce7" : hasPendingClaim ? "#fef3c7" : "#f1f5f9",
                          color: isClaimed ? "#15803d" : hasPendingClaim ? "#b45309" : "#64748b",
                          border: isClaimed ? "1px solid #86efac" : hasPendingClaim ? "1px solid #fde68a" : "1px solid #cbd5e1",
                        }}
                      >
                        {isClaimed
                          ? t("badgeClaimed")
                          : hasPendingClaim
                          ? t("badgePendingReview")
                          : t("badgeUnclaimed")}
                      </span>

                      {/* Active Status Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "100px",
                          background: item.isActive ? "#eff6ff" : "#fee2e2",
                          color: item.isActive ? "#2563eb" : "#b91c1c",
                          border: item.isActive ? "1px solid #bfdbfe" : "1px solid #fca5a5",
                        }}
                      >
                        {item.isActive ? t("badgeActiveListing") : t("badgeInactiveListing")}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingDirectoryDoctor({ ...item })}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                        }}
                      >
                        ✏️ {t("actionEdit")}
                      </button>

                      {/* Hide / Restore Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleDirectoryActive(item)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: item.isActive ? "#fee2e2" : "#dcfce7",
                          border: item.isActive ? "1px solid #fca5a5" : "1px solid #86efac",
                          color: item.isActive ? "#b91c1c" : "#15803d",
                        }}
                      >
                        {item.isActive ? t("toggleListingActive") : t("toggleListingRestore")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Directory Pagination Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <button
              type="button"
              disabled={directoryPage <= 1}
              onClick={() => {
                const prev = Math.max(1, directoryPage - 1);
                setDirectoryPage(prev);
                loadDirectoryDoctors(prev);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: directoryPage <= 1 ? "not-allowed" : "pointer",
                opacity: directoryPage <= 1 ? 0.5 : 1,
              }}
            >
              ← {t("prevPage")}
            </button>

            <span style={{ color: "#64748b", fontWeight: 500 }}>
              {t("pageInfo", { page: directoryPage, totalPages: directoryTotalPages, total: directoryTotal })}
            </span>

            <button
              type="button"
              disabled={directoryPage >= directoryTotalPages}
              onClick={() => {
                const next = Math.min(directoryTotalPages, directoryPage + 1);
                setDirectoryPage(next);
                loadDirectoryDoctors(next);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: directoryPage >= directoryTotalPages ? "not-allowed" : "pointer",
                opacity: directoryPage >= directoryTotalPages ? 0.5 : 1,
              }}
            >
              {t("nextPage")} →
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CLAIMS TAB (WITH FULL REVOKE WORKFLOW)                 */}
      {/* ======================================================== */}
      {activeTab === "CLAIMS" && (
        <div className="slot-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {claims.length === 0 && !loading && (
            <div className="empty" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
              {t("noClaims")}
            </div>
          )}
          {claims.map((claim) => {
            const isPending = claim.status === "PENDING";
            const isApproved = claim.status === "APPROVED";
            const isRejected = claim.status === "REJECTED";
            const isMismatch = claim.identityMatch && !claim.identityMatch.matches;

            return (
              <div
                key={claim.id}
                data-testid={`claim-row-${claim.id}`}
                style={{
                  border: isApproved ? "1px solid #bbf7d0" : isRejected ? "1px solid #fecaca" : "1px solid #fed7aa",
                  background: isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Header row with Target Specialist & Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "#92400e",
                      }}
                    >
                      {t("claimDoctorTarget")}
                    </span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: "17px", color: "#0f172a" }}>
                      {claim.directoryDoctor?.title} {claim.directoryDoctor?.name}
                    </h3>
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                      {claim.directoryDoctor?.specialty} · {claim.directoryDoctor?.hospital || claim.directoryDoctor?.city} (
                      {claim.directoryDoctor?.source})
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "100px",
                      background: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                      color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#b45309",
                      border: isApproved
                        ? "1px solid #86efac"
                        : isRejected
                        ? "1px solid #fca5a5"
                        : "1px solid #fde68a",
                    }}
                  >
                    {isApproved
                      ? t("claimStatusApproved")
                      : isRejected
                      ? t("claimStatusRejected")
                      : t("claimStatusPending")}
                  </span>
                </div>

                {/* Identity Mismatch Warning Box */}
                {isMismatch && (
                  <div
                    data-testid={`identity-mismatch-warning-${claim.id}`}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                        {t("identityMismatchWarning")}
                      </div>
                      <div>{t("identityMismatchDesc")}</div>
                      {claim.identityMatch?.mismatchCode === "SURNAME_MISMATCH" && claim.identityMatch?.mismatchDetails ? (
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#b91c1c" }}>
                          {t("mismatchSurname", {
                            applicant: claim.identityMatch.mismatchDetails.applicantSurname || "—",
                            target: claim.identityMatch.mismatchDetails.targetSurname || "—",
                          })}
                        </div>
                      ) : claim.identityMatch?.mismatchCode === "GIVEN_NAME_MISMATCH" && claim.identityMatch?.mismatchDetails ? (
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#b91c1c" }}>
                          {t("mismatchGivenName", {
                            applicant: claim.identityMatch.mismatchDetails.applicantGiven || "—",
                            target: claim.identityMatch.mismatchDetails.targetGiven || "—",
                          })}
                        </div>
                      ) : claim.identityMatch?.mismatchCode === "MISSING_NAME" ? (
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#b91c1c" }}>
                          {t("mismatchMissingName")}
                        </div>
                      ) : claim.identityMatch?.reason ? (
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#b91c1c" }}>
                          {claim.identityMatch.reason}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Applicant and Doctor Details */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong>{t("claimApplicant")}:</strong> {claim.claimant?.name} ({claim.claimant?.email})
                    {claim.claimant?.phone ? ` · 📞 ${claim.claimant?.phone}` : ""}
                  </div>
                  {claim.applicantTitle && (
                    <div>
                      <strong>{t("applicantTitle")}:</strong> {claim.applicantTitle}
                    </div>
                  )}
                  {claim.applicantNote && (
                    <div style={{ color: "#334155", fontStyle: "italic" }}>
                      <strong>{t("applicantNote")}:</strong> "{claim.applicantNote}"
                    </div>
                  )}
                  {claim.doctor && (
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                      <strong>{t("registeredProfile")}:</strong> {claim.doctor.name} ({claim.doctor.specialty} · {claim.doctor.city})
                      {claim.doctor.licenseNumber ? ` · ${t("licensePrefix", { num: claim.doctor.licenseNumber })}` : ""}
                      {claim.doctor.isVerified ? (
                        <span style={{ color: "#16a34a", fontWeight: 600, marginLeft: "6px" }}>[{t("badgeVerifiedDoctor")}]</span>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 600, marginLeft: "6px" }}>[{t("badgePendingApproval")}]</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Verification Documents of Claimant Doctor */}
                {claim.doctor?.verificationDocuments && claim.doctor.verificationDocuments.length > 0 && (
                  <div>
                    <AdminVerificationDocuments
                      documents={claim.doctor.verificationDocuments}
                      onChanged={loadAll}
                    />
                  </div>
                )}

                {/* Review info if processed */}
                {claim.reviewedAt && (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {t("reviewedAt", {
                      date: new Date(claim.reviewedAt).toLocaleString(locale === "en" ? "en-US" : "tr-TR"),
                    })}
                    {claim.reviewedBy?.name ? ` · ${claim.reviewedBy.name}` : ""}
                    {claim.reviewerNote ? ` — ${t("reviewerNote", { note: formatReviewerNote(claim.reviewerNote, getReasonCodeLabel) })}` : ""}
                  </div>
                )}

                {/* Actions for Claims */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        data-testid={`reject-claim-${claim.id}`}
                        className="secondary"
                        onClick={() => handleClaimAction(claim, "REJECTED")}
                        style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                      >
                        {t("rejectClaim")}
                      </button>
                      <button
                        type="button"
                        data-testid={`approve-claim-${claim.id}`}
                        className="primary"
                        onClick={() => handleClaimAction(claim, "APPROVED")}
                        style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                      >
                        {t("approveClaim")}
                      </button>
                    </>
                  )}

                  {/* Revoke Approved Claim Workflow */}
                  {isApproved && (
                    <button
                      type="button"
                      data-testid={`revoke-claim-${claim.id}`}
                      onClick={() => handleClaimAction(claim, "REVOKED")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: "#fee2e2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      ↩️ {t("actionRevoke")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT REGISTERED DOCTOR                            */}
      {/* ======================================================== */}
      {editingDoctor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              {t("editDoctorTitle")}
            </h3>

            <form onSubmit={handleSaveDoctor} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: "0 0 120px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldTitle")}</label>
                  <input
                    type="text"
                    value={editingDoctor.title || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, title: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldName")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.name || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldSpecialty")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.specialty || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldCity")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDoctor.city || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, city: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldHospital")}</label>
                  <input
                    type="text"
                    value={editingDoctor.hospital || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, hospital: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldLicense")}</label>
                  <input
                    type="text"
                    value={editingDoctor.licenseNumber || ""}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, licenseNumber: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldPrice")}</label>
                  <input
                    type="number"
                    value={editingDoctor.price || 0}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                  <input
                    type="checkbox"
                    id="editDocPublished"
                    checked={editingDoctor.isPublished || false}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, isPublished: e.target.checked })}
                  />
                  <label htmlFor="editDocPublished" style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                    {t("fieldPublished")}
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldBio")}</label>
                <textarea
                  rows={3}
                  value={editingDoctor.bio || ""}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, bio: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  {t("btnSave")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW REGISTERED DOCTOR DETAILS                    */}
      {/* ======================================================== */}
      {viewingDoctor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                {t("doctorDetailTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setViewingDoctor(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div><strong>{t("fieldName")}:</strong> {viewingDoctor.title} {viewingDoctor.name}</div>
              <div><strong>{t("fieldSpecialty")}:</strong> {viewingDoctor.specialty}</div>
              <div><strong>{t("fieldCity")}:</strong> {viewingDoctor.city} ({viewingDoctor.hospital || "—"})</div>
              <div><strong>{t("fieldLicense")}:</strong> {viewingDoctor.licenseNumber || "—"}</div>
              <div><strong>{t("fieldPrice")}:</strong> {viewingDoctor.price ? `${viewingDoctor.price} ₺` : "—"}</div>
              <div><strong>E-posta:</strong> {viewingDoctor.user?.email || "—"}</div>
              <div><strong>Kullanıcı Rolü:</strong> {viewingDoctor.user?.role || "—"}</div>
              <div><strong>Oluşturulma:</strong> {new Date(viewingDoctor.createdAt).toLocaleString()}</div>
            </div>

            <div style={{ fontSize: "13px" }}>
              <strong>{t("fieldBio")}:</strong>
              <p style={{ color: "#475569", margin: "4px 0 0 0" }}>{viewingDoctor.bio || "—"}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setViewingDoctor(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
              >
                {t("btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT DIRECTORY DOCTOR                             */}
      {/* ======================================================== */}
      {editingDirectoryDoctor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>
              {t("editDirectoryTitle")}
            </h3>

            <form onSubmit={handleSaveDirectoryDoctor} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: "0 0 120px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldTitle")}</label>
                  <input
                    type="text"
                    value={editingDirectoryDoctor.title || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, title: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldName")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDirectoryDoctor.name || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldSpecialty")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDirectoryDoctor.specialty || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, specialty: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldHospital")}</label>
                  <input
                    type="text"
                    value={editingDirectoryDoctor.hospital || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, hospital: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldCity")} *</label>
                  <input
                    type="text"
                    required
                    value={editingDirectoryDoctor.city || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, city: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldDistrict")}</label>
                  <input
                    type="text"
                    value={editingDirectoryDoctor.district || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, district: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldPhone")}</label>
                  <input
                    type="text"
                    value={editingDirectoryDoctor.phone || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldWebsite")}</label>
                  <input
                    type="url"
                    value={editingDirectoryDoctor.officialWebsite || ""}
                    onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, officialWebsite: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldAddress")}</label>
                <input
                  type="text"
                  value={editingDirectoryDoctor.address || ""}
                  onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, address: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                <input
                  type="checkbox"
                  id="editDirActive"
                  checked={editingDirectoryDoctor.isActive ?? true}
                  onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, isActive: e.target.checked })}
                />
                <label htmlFor="editDirActive" style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                  {t("badgeActiveListing")}
                </label>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>{t("fieldReason")} *</label>
                <input
                  type="text"
                  required
                  placeholder="Değişiklik gerekçesi..."
                  value={editingDirectoryDoctor.reason || ""}
                  onChange={(e) => setEditingDirectoryDoctor({ ...editingDirectoryDoctor, reason: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingDirectoryDoctor(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                >
                  {t("btnCancel")}
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "8px", background: "#2563eb", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  {t("btnSave")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ACCESSIBLE CONFIRMATION & ADMINISTRATIVE REASON DIALOG   */}
      {/* ======================================================== */}
      {actionConfirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionConfirmDialog(null)}
          onConfirm={handleExecuteActionConfirmDialog}
          title={actionConfirmDialog.title}
          description={actionConfirmDialog.description}
          confirmLabel={actionConfirmDialog.confirmLabel}
          variant={actionConfirmDialog.variant}
          requireReason={actionConfirmDialog.requireReason}
          showReasonInput={actionConfirmDialog.showReasonInput}
          reasonLabel={actionConfirmDialog.reasonLabel}
          reasonPlaceholder={actionConfirmDialog.reasonPlaceholder}
          minReasonLength={actionConfirmDialog.minReasonLength}
          isBusy={actionBusy}
        />
      )}
    </div>
  );
}
