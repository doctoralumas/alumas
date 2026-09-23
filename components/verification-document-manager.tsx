"use client";

import { useState } from "react";
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
  const [rows, setRows] = useState(documents || []);
  const [msg, setMsg] = useState("");
  const requirements = requiredDocuments(owner.kind, owner.entityType);

  async function upload(event: React.FormEvent<HTMLFormElement>, type: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.querySelector('input[type="file"]') as HTMLInputElement)
      ?.files?.[0];
    if (file && file.size > 4.5 * 1024 * 1024) {
      setMsg("Dosya 4.5 MB'dan küçük olmalı.");
      return;
    }
    const body = new FormData(form);
    body.set("documentType", type);
    if (owner.organizationId) body.set("organizationId", owner.organizationId);
    if (owner.doctorId) body.set("doctorId", owner.doctorId);
    if (owner.agencyId) body.set("agencyId", owner.agencyId);
    setMsg("Belge gönderiliyor...");
    const response = await fetch("/api/verification-documents", {
      method: "POST",
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Belge yüklenemedi.");
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
    setMsg("Belge incelemeye gönderildi.");
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
    <section
      className="panel form-span"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "#f3e8ff",
            color: "#9333ea",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={24} weight="duotone" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
            Doğrulama belgeleri
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Zorunlu belgeler onaylanmadan profil yayınlanmaz. Süresi dolan belge
            yayını durdurur. Yeni dosya, eskisinin yerine incelenmek üzere
            eklenir.
          </p>
        </div>
      </div>

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
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
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
                      {requirement.label}
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
                        {requirement.required ? "Zorunlu" : "İsteğe bağlı"}
                      </span>
                      {requirement.expires && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          • Son kullanma tarihi takip edilir
                        </span>
                      )}
                      {current?.documentNumber && (
                        <span>• No: {current.documentNumber}</span>
                      )}
                      {current?.expiresAt && (
                        <span>
                          • Bitiş:{" "}
                          {new Date(current.expiresAt).toLocaleDateString(
                            "tr-TR"
                          )}
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
                        Not: {current.reviewerNote}
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
                    ? DOCUMENT_STATUS_LABELS[current.status] || current.status
                    : "Eksik"}
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
                    Belge numarası
                  </span>
                  <input
                    name="documentNumber"
                    placeholder="Örn. 123456"
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
                    Veren kurum
                  </span>
                  <input
                    name="issuer"
                    placeholder="Kurum adı"
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
                    Düzenlenme tarihi
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
                      Son kullanma tarihi
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
                    Max 4.5 MB
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
                    <UploadSimple size={18} weight="bold" /> Belge Yükle
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
                      <DownloadSimple size={18} weight="bold" /> Mevcut Belgeyi
                      Görüntüle
                    </a>
                  )}
                </div>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
