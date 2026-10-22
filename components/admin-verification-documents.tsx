"use client";

import { useTranslations, useLocale } from "next-intl";

export function formatReviewerNote(
  rawNote: string | null | undefined,
  translateCode?: (code: string) => string
): string {
  if (!rawNote) return "";
  const match = rawNote.match(/^(?:\[([A-Z0-9_]+)\]|([A-Z0-9_]+)):\s*(.*)$/);
  if (match) {
    const code = match[1] || match[2];
    const freeText = match[3];
    const localizedCode = translateCode ? translateCode(code) : `[${code}]`;
    return `${localizedCode}: ${freeText}`;
  }
  return rawNote;
}

export default function AdminVerificationDocuments({ documents, onChanged }: { documents: any[]; onChanged: () => void }) {
  const t = useTranslations("admin.adminVerificationDocs");
  const tDocs = useTranslations("professional.verificationManager");
  const tDoctorList = useTranslations("admin.doctorList");
  const locale = useLocale();

  const getReasonCodeLabel = (code: string) => {
    try {
      return tDoctorList(`reasonCodes.${code}`);
    } catch {
      return `[${code}]`;
    }
  };

  const docTypeLabels: Record<string, string> = {
    IDENTITY: tDocs("docTypes.IDENTITY"),
    MEDICAL_LICENSE: tDocs("docTypes.MEDICAL_LICENSE"),
    SPECIALTY_CERTIFICATE: tDocs("docTypes.SPECIALTY_CERTIFICATE"),
    FACILITY_LICENSE: tDocs("docTypes.FACILITY_LICENSE"),
    HEALTH_TOURISM_AUTHORIZATION: tDocs("docTypes.HEALTH_TOURISM_AUTHORIZATION"),
    TAX_CERTIFICATE: tDocs("docTypes.TAX_CERTIFICATE"),
    TRADE_REGISTRY: tDocs("docTypes.TRADE_REGISTRY"),
  };

  const statusLabels: Record<string, string> = {
    PENDING: tDocs("statusPending"),
    APPROVED: tDocs("statusApproved"),
    REJECTED: tDocs("statusRejected"),
    EXPIRED: tDocs("statusExpired"),
    SUPERSEDED: tDocs("statusSuperseded"),
  };

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    const note = status === "REJECTED" ? prompt(t("promptReason")) || t("defaultReason") : undefined;
    const response = await fetch(`/api/admin/verification-documents/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-locale": locale },
      body: JSON.stringify({ status, note }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) alert(data.error || t("error"));
    onChanged();
  }

  if (!documents?.length) return <span style={{ color: "var(--text-muted)" }}>{t("empty")}</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
      {documents.filter((document) => document.status !== "SUPERSEDED").map((document) => (
        <div key={document.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: "13px" }}>
            <b>{docTypeLabels[document.documentType] || document.documentType}</b>
            <span> · {statusLabels[document.status] || document.status}</span>
            <span> · {document.documentNumber}</span>
            {document.expiresAt && (
              <span>
                {t("expiresAt", {
                  date: new Date(document.expiresAt).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR"),
                })}
              </span>
            )}
            {document.reviewerNote && (
              <span> · {formatReviewerNote(document.reviewerNote, getReasonCodeLabel)}</span>
            )}
            <div><a href={`/api/verification-documents/${document.id}/file`} target="_blank" rel="noopener noreferrer">{document.fileName}</a></div>
          </div>
          {document.status === "PENDING" && (
            <div className="row">
              <button className="secondary compact" type="button" onClick={() => review(document.id, "APPROVED")}>{t("approveDoc")}</button>
              <button className="danger compact" type="button" onClick={() => review(document.id, "REJECTED")}>{t("rejectDoc")}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
