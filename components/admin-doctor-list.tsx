"use client";

import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
import { useTranslations } from "next-intl";

export default function AdminDoctorList() {
  const t = useTranslations("admin.doctorList");
  const [activeTab, setActiveTab] = useState<"DOCTORS" | "CLAIMS">("DOCTORS");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDoctors = async () => {
    try {
      const response = await fetch("/api/admin/doctors");
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

  const loadClaims = async () => {
    try {
      const response = await fetch("/api/admin/doctors/claims");
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
    await Promise.all([loadDoctors(), loadClaims()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  async function setDoctorVerified(id: string, approved: boolean) {
    const response = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, approved }),
    });
    const data = await response.json().catch(() => ({}));
    await loadAll();
    if (!response.ok) setError(data.error || t("updateError"));
  }

  async function handleClaimAction(claimId: string, status: "APPROVED" | "REJECTED") {
    let reason: string | undefined = undefined;
    if (status === "REJECTED") {
      const input = prompt(t("promptClaimRejectReason"));
      if (input === null) return; // user cancelled prompt
      reason = input.trim() || undefined;
    }

    const response = await fetch(`/api/admin/doctors/claims/${claimId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    const data = await response.json().catch(() => ({}));
    await loadAll();
    if (!response.ok) {
      setError(data.error || t("updateError"));
    }
  }

  const pendingClaimsCount = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("DOCTORS")}
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
          data-testid="admin-tab-claims"
          onClick={() => setActiveTab("CLAIMS")}
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

      {error && <div className="form-error">{error}</div>}

      {/* DOCTORS TAB */}
      {activeTab === "DOCTORS" && (
        <div className="slot-list">
          {doctors.length === 0 && !loading && (
            <div className="empty" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
              {t("noDoctors")}
            </div>
          )}
          {doctors.map((doctor) => (
            <div className="slot-row" key={doctor.id} style={{ alignItems: "flex-start" }}>
              <div>
                <b>{doctor.name}</b>
                <span>
                  {doctor.specialty} · {doctor.city} · {doctor.user?.email}
                </span>
                <small>{doctor.licenseNumber ? t("licensePrefix", { num: doctor.licenseNumber }) : "—"}</small>
                <AdminVerificationDocuments documents={doctor.verificationDocuments || []} onChanged={loadAll} />
              </div>
              <div className="row">
                <span className="status">{doctor.isVerified ? t("statusVerified") : t("statusPending")}</span>
                {doctor.isVerified ? (
                  <button className="secondary" onClick={() => setDoctorVerified(doctor.id, false)}>
                    {t("unpublish")}
                  </button>
                ) : (
                  <button className="primary" onClick={() => setDoctorVerified(doctor.id, true)}>
                    {t("approve")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CLAIMS TAB */}
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
                {/* Header row with Status */}
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
                      <strong>Unvan / Beyan:</strong> {claim.applicantTitle}
                    </div>
                  )}
                  {claim.applicantNote && (
                    <div style={{ color: "#334155", fontStyle: "italic" }}>
                      <strong>Not:</strong> "{claim.applicantNote}"
                    </div>
                  )}
                  {claim.doctor && (
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                      <strong>Kayıtlı Profil:</strong> {claim.doctor.name} ({claim.doctor.specialty} · {claim.doctor.city})
                      {claim.doctor.licenseNumber ? ` · Sicil: ${claim.doctor.licenseNumber}` : ""}
                      {claim.doctor.isVerified ? (
                        <span style={{ color: "#16a34a", fontWeight: 600, marginLeft: "6px" }}>[Doğrulanmış Uzman]</span>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 600, marginLeft: "6px" }}>[Belge Onayı Bekliyor]</span>
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
                    İncelendi: {new Date(claim.reviewedAt).toLocaleString()}
                    {claim.reviewedBy?.name ? ` · ${claim.reviewedBy.name}` : ""}
                    {claim.reviewerNote ? ` — Not: "${claim.reviewerNote}"` : ""}
                  </div>
                )}

                {/* Actions for Pending Claims */}
                {isPending && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                    <button
                      type="button"
                      data-testid={`reject-claim-${claim.id}`}
                      className="secondary"
                      onClick={() => handleClaimAction(claim.id, "REJECTED")}
                      style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                    >
                      {t("rejectClaim")}
                    </button>
                    <button
                      type="button"
                      data-testid={`approve-claim-${claim.id}`}
                      className="primary"
                      onClick={() => handleClaimAction(claim.id, "APPROVED")}
                      style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
                    >
                      {t("approveClaim")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
