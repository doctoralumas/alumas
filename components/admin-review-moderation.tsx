"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";

type ReviewUser = {
  id: string;
  name: string;
  email: string;
};

type DoctorReview = {
  id: string;
  rating: number;
  comment?: string | null;
  status: string;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  user: ReviewUser;
  doctor: {
    id: string;
    name: string;
    slug: string;
    specialty: string;
  };
};

type OrgReview = {
  id: string;
  rating: number;
  comment?: string | null;
  status: string;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
  user: ReviewUser;
  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  doctors: number;
  organizations: number;
};

export default function AdminReviewModeration() {
  const t = useTranslations("admin.reviewModeration");

  const [doctorReviews, setDoctorReviews] = useState<DoctorReview[]>([]);
  const [orgReviews, setOrgReviews] = useState<OrgReview[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    doctors: 0,
    organizations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Confirm dialog
  const [busyId, setBusyId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    kind: "doctor" | "organization";
    id: string;
    targetStatus: "APPROVED" | "REJECTED" | "PENDING";
    title: string;
    description: string;
    confirmLabel: string;
    variant: "primary" | "danger" | "warning";
    showReasonInput?: boolean;
    reasonPlaceholder?: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Değerlendirmeler yüklenemedi.");
      }

      setDoctorReviews(data.doctorReviews || []);
      setOrgReviews(data.organizationReviews || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || "Değerlendirmeler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function handleActionClick(
    kind: "doctor" | "organization",
    review: DoctorReview | OrgReview,
    targetStatus: "APPROVED" | "REJECTED" | "PENDING"
  ) {
    const targetName = kind === "doctor" ? (review as DoctorReview).doctor?.name : (review as OrgReview).organization?.name;
    const reviewerName = review.user?.name || "Anonim";

    if (targetStatus === "APPROVED") {
      setConfirmDialog({
        kind,
        id: review.id,
        targetStatus: "APPROVED",
        title: t("publish"),
        description: `${reviewerName} tarafından "${targetName}" için yapılan bu değerlendirmeyi onaylayıp sitede yayınlamak üzeresiniz.`,
        confirmLabel: t("publish"),
        variant: "primary",
        showReasonInput: false,
      });
    } else if (targetStatus === "REJECTED") {
      setConfirmDialog({
        kind,
        id: review.id,
        targetStatus: "REJECTED",
        title: t("reject"),
        description: `${reviewerName} tarafından "${targetName}" için yapılan bu değerlendirmeyi yayından kaldırmak / reddetmek üzeresiniz.`,
        confirmLabel: t("reject"),
        variant: "danger",
        showReasonInput: true,
        reasonPlaceholder: t("promptReason"),
      });
    } else {
      setConfirmDialog({
        kind,
        id: review.id,
        targetStatus: "PENDING",
        title: "Yeniden Değerlendir",
        description: `${reviewerName} değerlendirmesini yeniden inceleme kuyruğuna almak istiyor musunuz?`,
        confirmLabel: "Kuyruğa Al",
        variant: "warning",
        showReasonInput: false,
      });
    }
  }

  async function executeConfirm(reason?: string) {
    if (!confirmDialog) return;
    setBusyId(confirmDialog.id);
    setError("");

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: confirmDialog.kind,
          id: confirmDialog.id,
          status: confirmDialog.targetStatus,
          reason: reason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "İşlem başarısız.");
      }

      setSuccess(
        confirmDialog.targetStatus === "APPROVED"
          ? "Değerlendirme onaylandı ve yayınlandı."
          : confirmDialog.targetStatus === "REJECTED"
          ? "Değerlendirme reddedildi."
          : "Değerlendirme inceleme kuyruğuna alındı."
      );

      setConfirmDialog(null);
      await load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "İşlem sırasında hata oluştu.");
    } finally {
      setBusyId("");
    }
  }

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function renderStars(rating: number) {
    return (
      <span style={{ color: "#f59e0b", letterSpacing: "2px", fontSize: "14px" }}>
        {"★".repeat(Math.max(1, Math.min(5, rating)))}
        {"☆".repeat(Math.max(0, 5 - rating))}
      </span>
    );
  }

  // Combine reviews for unified sorting/display
  const combinedReviews: Array<
    ({ kind: "doctor" } & DoctorReview) | ({ kind: "organization" } & OrgReview)
  > = [
    ...doctorReviews.map((r) => ({ ...r, kind: "doctor" as const })),
    ...orgReviews.map((r) => ({ ...r, kind: "organization" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Callouts */}
      {error && <AdminCallout variant="danger">{error}</AdminCallout>}
      {success && <AdminCallout variant="success">{success}</AdminCallout>}

      {/* KPI Cards / Metric Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          onClick={() => setStatusFilter("PENDING")}
          style={{
            cursor: "pointer",
            background: statusFilter === "PENDING" ? "#fffbeb" : "var(--bg, #ffffff)",
            border:
              statusFilter === "PENDING"
                ? "2px solid #f59e0b"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 500 }}>
            Bekleyen Moderasyon
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
            {stats.pending}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          style={{
            cursor: "pointer",
            background: statusFilter === "APPROVED" ? "#f0fdf4" : "var(--bg, #ffffff)",
            border:
              statusFilter === "APPROVED"
                ? "2px solid #10b981"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#166534", fontWeight: 500 }}>
            Onaylanan & Yayında
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>
            {stats.approved}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          style={{
            cursor: "pointer",
            background: statusFilter === "REJECTED" ? "#fef2f2" : "var(--bg, #ffffff)",
            border:
              statusFilter === "REJECTED"
                ? "2px solid #ef4444"
                : "1px solid var(--border-light, #e2e8f0)",
            borderRadius: "12px",
            padding: "16px",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 500 }}>
            Reddedilen / Engellenen
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#dc2626", marginTop: "4px" }}>
            {stats.rejected}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("ALL")}
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
            Toplam Değerlendirme
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
            {stats.total}
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
            placeholder="Kullanıcı adı, uzman, kurum veya yorum içeriğinde ara..."
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            background: "var(--bg, #ffffff)",
            minWidth: "160px",
          }}
        >
          <option value="ALL">Tüm Hedefler</option>
          <option value="doctor">Yalnızca Uzmanlar ({stats.doctors})</option>
          <option value="organization">Yalnızca Kurumlar ({stats.organizations})</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            fontSize: "14px",
            background: "var(--bg, #ffffff)",
            minWidth: "160px",
          }}
        >
          <option value="PENDING">Bekleyenler</option>
          <option value="APPROVED">Onaylananlar</option>
          <option value="REJECTED">Reddedilenler</option>
          <option value="ALL">Tüm Durumlar</option>
        </select>

        {(search || statusFilter !== "PENDING" || typeFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("PENDING");
              setTypeFilter("ALL");
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
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Review List */}
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
          Değerlendirmeler yükleniyor...
        </div>
      ) : combinedReviews.length === 0 ? (
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
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>⭐</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            {t("empty")}
          </div>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>
            Seçilen filtre ve arama kriterlerine uyan herhangi bir değerlendirme bulunamadı.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {combinedReviews.map((r) => {
            const isDoc = r.kind === "doctor";
            const targetName = isDoc ? (r as DoctorReview).doctor?.name : (r as OrgReview).organization?.name;
            const targetSubtitle = isDoc ? (r as DoctorReview).doctor?.specialty : (r as OrgReview).organization?.type;
            const isPending = r.status === "PENDING";
            const isApproved = r.status === "APPROVED";
            const isRejected = r.status === "REJECTED";

            return (
              <div
                key={r.id}
                style={{
                  background: "var(--bg, #ffffff)",
                  borderRadius: "12px",
                  border: isPending
                    ? "2px solid #fde68a"
                    : "1px solid var(--border-light, #e2e8f0)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
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
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: isDoc ? "#eff6ff" : "#f0fdf4",
                        color: isDoc ? "#2563eb" : "#166534",
                        border: isDoc ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                      }}
                    >
                      {isDoc ? "👨‍⚕️ Uzman Hekim" : "🏥 Sağlık Kuruluşu"}
                    </span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{targetName}</strong>
                    {targetSubtitle && (
                      <span style={{ fontSize: "12px", color: "#64748b" }}>({targetSubtitle})</span>
                    )}
                    <AdminStatusBadge status={r.status} size="sm" />
                  </div>

                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    🕒 {formatDateTime(r.createdAt)}
                  </span>
                </div>

                {/* Rating and Reviewer */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div>{renderStars(r.rating)}</div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                    👤 {r.user?.name || "Kullanıcı"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    ({r.user?.email})
                  </span>
                </div>

                {/* Review Comment */}
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: r.comment ? "#1e293b" : "#94a3b8",
                    fontStyle: r.comment ? "normal" : "italic",
                    borderLeft: "3px solid #cbd5e1",
                  }}
                >
                  {r.comment || t("noComment")}
                </div>

                {/* Moderation reason if rejected */}
                {r.moderationReason && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#b91c1c",
                      background: "#fef2f2",
                      padding: "8px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    ⚠️ <strong>Red Nedeni:</strong> {r.moderationReason}
                  </div>
                )}

                {/* Action Buttons */}
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
                  {!isApproved && (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => handleActionClick(r.kind, r, "APPROVED")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "1px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#15803d",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✓ {t("publish")}
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => handleActionClick(r.kind, r, "REJECTED")}
                      style={{
                        padding: "6px 14px",
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

                  {isRejected && (
                    <button
                      disabled={busyId === r.id}
                      onClick={() => handleActionClick(r.kind, r, "PENDING")}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-light, #cbd5e1)",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ↺ Yeniden Değerlendir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={executeConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel="Vazgeç"
          showReasonInput={confirmDialog.showReasonInput}
          reasonPlaceholder={confirmDialog.reasonPlaceholder}
          isBusy={busyId === confirmDialog.id}
        />
      )}
    </div>
  );
}
