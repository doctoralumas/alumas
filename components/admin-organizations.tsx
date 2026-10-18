"use client";

import { useEffect, useState } from "react";
import AdminVerificationDocuments from "@/components/admin-verification-documents";
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

type Org = {
  id: string;
  name: string;
  slug?: string;
  type: string;
  status: string;
  isVerified?: boolean;
  rejectionReason?: string | null;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  licenseFileName?: string | null;
  verificationDocuments?: any[];
  owner?: { name?: string | null; email?: string | null } | null;
  claim?: ClaimInfo | null;
};

export default function AdminOrganizations() {
  const t = useTranslations("admin.organizationsList");
  const [rows, setRows] = useState<Org[]>([]);
  const [error, setError] = useState("");

  const typeLabels: Record<string, string> = {
    HOSPITAL: t("typeHospital"),
    CLINIC: t("typeClinic"),
    PHARMACY: t("typePharmacy"),
    IMAGING_CENTER: t("typeImaging"),
    LABORATORY: t("typeLab"),
  };

  async function load() {
    setError("");
    const response = await fetch("/api/admin/organizations");
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok || !Array.isArray(data)) {
      const message =
        data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : t("loadError");
      setRows([]);
      setError(message);
      return;
    }
    setRows(data as Org[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, status: string) {
    const reason =
      status === "REJECTED" || status === "SUSPENDED"
        ? prompt(t("promptReason")) || t("defaultReason")
        : undefined;
    const response = await fetch(`/api/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    const data = await response.json().catch(() => ({}));
    await load();
    if (!response.ok) setError(data.error || t("updateError"));
  }

  if (error) return <div className="form-error">{error}</div>;
  if (!rows.length) return <div className="empty">{t("empty")}</div>;

  return (
    <div className="slot-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {rows.map((org) => (
        <div
          className="organization-admin-row"
          style={{
            border: "1px solid var(--border-light)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: "var(--bg)",
            gap: "16px",
            flexWrap: "wrap",
          }}
          key={org.id}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>{org.name}</h3>
              <span className="status" style={{ fontSize: "12px" }}>
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
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span>
                👤 {org.owner?.name || t("noOwner")} ({org.owner?.email || "—"})
                {org.claim?.applicantRoleTitle ? ` · ${org.claim.applicantRoleTitle}` : ""}
              </span>
              <span>
                📍 {org.city}
                {org.district ? `, ${org.district}` : ""} - {org.address}
              </span>
              <span>
                📞 {org.phone} | ✉️ {org.email}
                {org.website ? ` | 🌐 ${org.website}` : ""}
              </span>
              {org.claim?.isDirectoryClaim && (
                <span style={{ color: "#92400e", fontWeight: 500, marginTop: "2px" }}>
                  🏥 {t("claimedDirectoryTarget")}: {org.claim.directoryInstitutionName || org.claim.directoryInstitutionId}
                  {org.claim.applicantNote ? ` — "${org.claim.applicantNote}"` : ""}
                </span>
              )}
              {org.rejectionReason && (
                <span style={{ color: "#b91c1c", fontWeight: 500, marginTop: "2px" }}>
                  ⚠️ {org.rejectionReason}
                </span>
              )}
            </div>
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              <AdminVerificationDocuments documents={org.verificationDocuments || []} onChanged={load} />
              {org.licenseFileName && (
                <a
                  href={`/api/admin/organizations/${org.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "var(--primary)",
                    fontWeight: 500,
                    padding: "4px 8px",
                    backgroundColor: "var(--primary-light)",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  {t("legacyFile", { name: org.licenseFileName })}
                </a>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
            <span className={`status org-${org.status.toLowerCase()}`}>{org.status}</span>
            <div className="row">
              {org.status === "PENDING" && (
                <>
                  <button className="secondary compact" onClick={() => act(org.id, "APPROVED")}>
                    {t("approve")}
                  </button>
                  <button className="danger compact" onClick={() => act(org.id, "REJECTED")}>
                    {t("reject")}
                  </button>
                </>
              )}
              {org.status === "APPROVED" && (
                <>
                  <button className="secondary compact" onClick={() => act(org.id, "SUSPENDED")}>
                    {t("suspend")}
                  </button>
                  <button className="danger compact" onClick={() => act(org.id, "REJECTED")}>
                    {t("cancel")}
                  </button>
                </>
              )}
              {(org.status === "REJECTED" || org.status === "SUSPENDED") && (
                <>
                  <button className="primary compact" onClick={() => act(org.id, "APPROVED")}>
                    {t("reapprove")}
                  </button>
                  <button className="secondary compact" onClick={() => act(org.id, "PENDING")}>
                    {t("review")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
