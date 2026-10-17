"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DOCUMENT_STATUS_LABELS,
  requiredDocuments,
  type DocumentOwnerKind,
} from "@/lib/verification-requirements";
import {
  FileText,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  Clock,
  UploadSimple,
  DownloadSimple,
} from "@phosphor-icons/react/dist/ssr";

type Owner = {
  kind: DocumentOwnerKind;
  entityType?: string | null;
  organizationId?: string;
  doctorId?: string;
  agencyId?: string;
};

export default function VerificationDocumentManager({
  owner,
  documents,
}: {
  owner: Owner;
  documents: any[];
}) {
  const t = useTranslations("professional.verificationManager");
  const [rows, setRows] = useState(documents || []);
  const [msg, setMsg] = useState("");
  const requirements = requiredDocuments(owner.kind, owner.entityType);

  const statusLabels: Record<string, string> = {
    PENDING: t("statusPending"),
    APPROVED: t("statusApproved"),
    REJECTED: t("statusRejected"),
    EXPIRED: t("statusExpired"),
    SUPERSEDED: t("statusSuperseded"),
  };

  async function upload(event: React.FormEvent<HTMLFormElement>, type: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.querySelector('input[type="file"]') as HTMLInputElement)
      ?.files?.[0];
    if (file && file.size > 4.5 * 1024 * 1024) {
      setMsg(t("fileTooLarge"));
      return;
    }
    const body = new FormData(form);
    body.set("documentType", type);
    if (owner.organizationId) body.set("organizationId", owner.organizationId);
    if (owner.doctorId) body.set("doctorId", owner.doctorId);
    if (owner.agencyId) body.set("agencyId", owner.agencyId);
    setMsg(t("uploading"));
    const response = await fetch("/api/verification-documents", {
      method: "POST",
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || t("uploadFailed"));
      return;
    }
    setRows(
      rows
        .map((r: any) =>
          r.documentType === data.documentType
            ? { ...r, status: "SUPERSEDED" }
            : r
        )
        .concat(data)
    );
    setMsg(t("uploadedSuccess"));
    form.reset();
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "#f0fdf4",
          color: "#16a34a",
          icon: <CheckCircle size={16} weight="fill" />,
        };
      case "PENDING":
        return {
          bg: "#fff7ed",
          color: "#ea580c",
          icon: <Clock size={16} weight="fill" />,
        };
      case "REJECTED":
        return {
          bg: "#fef2f2",
          color: "#ef4444",
          icon: <WarningCircle size={16} weight="fill" />,
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#64748b",
          icon: <WarningCircle size={16} weight="fill" />,
        };
    }
  };

  return (
    <details className="premium-accordion" open>
      <summary className="premium-accordion-summary">
        <div className="premium-accordion-header">
          <div
            className="premium-accordion-icon"
            style={{ background: "#f3e8ff", color: "#9333ea" }}
          >
            <ShieldCheck size={28} weight="duotone" />
          </div>
          <div>
            <h3 className="premium-accordion-title">{t("title")}</h3>
            <p className="premium-accordion-desc">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
          className="premium-chevron"
        >
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
        </svg>
      </summary>

      <div className="premium-accordion-content">
        {msg && (
          <div
            className="inline-message"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 500,
              color: "#0f172a",
            }}
          >
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {requirements.map((requirement) => {
            const current = rows.find(
              (row) =>
                row.documentType === requirement.type &&
                row.status !== "SUPERSEDED"
            );
            const statusStyle = getStatusColor(current?.status);

            return (
              <article
                key={requirement.type}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px dashed #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={24} weight="duotone" />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: "0 0 4px",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {t.has("docTypes." + requirement.type)
                          ? t("docTypes." + requirement.type)
                          : requirement.label}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "#64748b",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: requirement.required ? 600 : 400,
                            color: requirement.required ? "#0f172a" : "#64748b",
                          }}
                        >
                          {requirement.required ? t("required") : t("optional")}
                        </span>
                        {requirement.expires && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            • {t("expiresNotice")}
                          </span>
                        )}
                        {current?.documentNumber && (
                          <span>• {t("docNumber", { number: current.documentNumber })}</span>
                        )}
                        {current?.expiresAt && (
                          <span>
                            • {t("expiresAt", {
                              date: new Date(current.expiresAt).toLocaleDateString(),
                            })}
                          </span>
                        )}
                      </div>
                      {current?.reviewerNote && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "13px",
                            color: "#ef4444",
                            fontWeight: 500,
                          }}
                        >
                          {t("reviewerNote", { note: current.reviewerNote })}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {statusStyle.icon}
                    {current
                      ? statusLabels[current.status] ||
                        DOCUMENT_STATUS_LABELS[current.status] ||
                        current.status
                      : t("missing")}
                  </span>
                </header>

                <form
                  className="compact-form"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    alignItems: "end",
                  }}
                  onSubmit={(event) => upload(event, requirement.type)}
                >
                  <label
                    className="field"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {t("docNumberLabel")}
                    </span>
                    <input
                      name="documentNumber"
                      placeholder={t("docNumberPlaceholder")}
                      required
                      defaultValue={current?.documentNumber || ""}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </label>
                  <label
                    className="field"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {t("issuerLabel")}
                    </span>
                    <input
                      name="issuer"
                      placeholder={t("issuerPlaceholder")}
                      required
                      defaultValue={current?.issuer || ""}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </label>
                  <label
                    className="field"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {t("issuedAtLabel")}
                    </span>
                    <input
                      type="date"
                      name="issuedAt"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </label>
                  {requirement.expires && (
                    <label
                      className="field"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      >
                        {t("expiresAtLabel")}
                      </span>
                      <input
                        type="date"
                        name="expiresAt"
                        required
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </label>
                  )}
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      padding: "12px",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <input
                      type="file"
                      required
                      accept="image/jpeg,image/png,application/pdf"
                      style={{ flex: 1, fontSize: "14px" }}
                    />
                    <span
                      className="muted"
                      style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      {t("maxSize")}
                    </span>
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <button
                      className="primary"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#0f172a",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <UploadSimple size={18} weight="bold" /> {t("uploadDoc")}
                    </button>
                    {current && (
                      <a
                        href={`/api/verification-documents/${current.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#3b82f6",
                          fontWeight: 600,
                          textDecoration: "none",
                          padding: "10px 16px",
                          borderRadius: "8px",
                          background: "#eff6ff",
                        }}
                      >
                        <DownloadSimple size={18} weight="bold" />{" "}
                        {t("viewCurrentDoc")}
                      </a>
                    )}
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      </div>
    </details>
  );
}
