"use client";

import { useState } from "react";
import {
  UploadSimple,
  FileText,
  CheckCircle,
  WarningCircle,
  CaretDown,
  FileDashed,
} from "@phosphor-icons/react/dist/ssr";

type Doc = {
  id: string;
  type: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  uploadedAt: string;
};

export default function VerificationDocumentManager({
  owner,
  documents,
}: {
  owner: any;
  documents: Doc[];
}) {
  const [docs, setDocs] = useState<Doc[]>(documents);
  const [msg, setMsg] = useState("");

  const documentTypes: Record<string, string[]> = {
    HOSPITAL: ["Ruhsat", "Faaliyet Belgesi", "Vergi Levhası", "İmza Sirküleri"],
    CLINIC: [
      "Ruhsat",
      "Vergi Levhası",
      "Tabip Odası Kaydı",
      "Kimlik Fotokopisi",
    ],
    PHARMACY: ["Eczane Ruhsatı", "Eczacılar Odası Kaydı", "Vergi Levhası"],
    IMAGING_CENTER: ["Ruhsat", "TAEK Lisansı", "Vergi Levhası"],
    LABORATORY: ["Ruhsat", "Kalite Belgesi", "Vergi Levhası"],
    DOCTOR: [
      "Diploma",
      "Uzmanlık Belgesi",
      "Tabip Odası Kaydı",
      "Kimlik Fotokopisi",
    ],
  };

  const expectedTypes = owner.entityType
    ? documentTypes[owner.entityType] || ["Diğer"]
    : ["Kimlik Fotokopisi", "Diploma"];

  const statusColors = {
    PENDING: {
      bg: "#fff7ed",
      text: "#ea580c",
      icon: WarningCircle,
      label: "İnceleniyor",
    },
    APPROVED: {
      bg: "#f0fdf4",
      text: "#16a34a",
      icon: CheckCircle,
      label: "Onaylandı",
    },
    REJECTED: {
      bg: "#fef2f2",
      text: "#dc2626",
      icon: WarningCircle,
      label: "Reddedildi",
    },
  };

  async function upload(e: any) {
    e.preventDefault();
    setMsg("Belge yükleniyor...");
    const form = e.currentTarget;
    const f = new FormData(form);

    // Yükleme simülasyonu
    await new Promise((r) => setTimeout(r, 1000));

    const r = await fetch(`/api/verification/upload`, {
      method: "POST",
      body: f,
    });

    const j = await r.json();
    if (r.ok) {
      setDocs((x) => [j.document, ...x]);
      form.reset();
      setMsg("Belge başarıyla yüklendi ve incelemeye alındı.");
    } else {
      setMsg(j.error || "Yükleme başarısız.");
    }
  }

  return (
    <details className="premium-accordion" open>
      <summary className="premium-accordion-summary">
        <div className="premium-accordion-header">
          <div
            className="premium-accordion-icon"
            style={{ background: "#fef2f2", color: "#ef4444" }}
          >
            <FileText size={28} weight="duotone" />
          </div>
          <div>
            <h3 className="premium-accordion-title">Doğrulama Belgeleri</h3>
            <p className="premium-accordion-desc">
              Kimlik, ruhsat ve faaliyet belgelerinizi buradan yükleyin.
            </p>
          </div>
        </div>
        <CaretDown size={24} weight="bold" className="premium-chevron" />
      </summary>

      <div className="premium-accordion-content">
        {msg && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              color: "#0f172a",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {msg}
          </div>
        )}

        <form
          onSubmit={upload}
          className="responsive-form-grid"
          style={{
            marginBottom: "32px",
            background: "#ffffff",
            border: "2px dashed #cbd5e1",
          }}
        >
          <input type="hidden" name="ownerKind" value={owner.kind} />
          {owner.organizationId && (
            <input
              type="hidden"
              name="organizationId"
              value={owner.organizationId}
            />
          )}
          {owner.doctorId && (
            <input type="hidden" name="doctorId" value={owner.doctorId} />
          )}

          <div className="responsive-form-field">
            <label>Belge Türü</label>
            <select name="type" required>
              <option value="">Seçiniz...</option>
              {expectedTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          <div className="responsive-form-field">
            <label>Dosya (PDF, JPG, PNG)</label>
            <input
              type="file"
              name="file"
              accept="image/*,application/pdf"
              required
              style={{ padding: "9px 12px" }}
            />
          </div>

          <button
            className="primary"
            style={{
              height: "46px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
            }}
          >
            <UploadSimple size={20} weight="bold" /> Yükle
          </button>
        </form>

        <h4
          style={{
            fontSize: "16px",
            fontWeight: 700,
            margin: "0 0 16px 0",
            color: "#0f172a",
          }}
        >
          Yüklenen Belgeler
        </h4>

        <div className="premium-card-list">
          {docs.map((d) => {
            const StatusIcon = statusColors[d.status].icon;
            return (
              <div key={d.id} className="premium-card-item">
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={28} weight="duotone" />
                  </div>
                  <div>
                    <b
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {d.type}
                    </b>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Yüklenme:{" "}
                      {new Date(d.uploadedAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                  className="premium-card-item-actions"
                >
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#3b82f6",
                      textDecoration: "none",
                    }}
                  >
                    Görüntüle
                  </a>

                  <span
                    className="premium-badge"
                    style={{
                      background: statusColors[d.status].bg,
                      color: statusColors[d.status].text,
                    }}
                  >
                    <StatusIcon size={16} weight="fill" />
                    {statusColors[d.status].label}
                  </span>
                </div>
              </div>
            );
          })}

          {docs.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "#f8fafc",
                borderRadius: "16px",
                color: "#94a3b8",
              }}
            >
              <FileDashed
                size={48}
                weight="duotone"
                style={{ margin: "0 auto 12px" }}
              />
              <p style={{ margin: 0, fontSize: "15px" }}>
                Henüz yüklenmiş bir belge bulunmuyor.
                <br />
                Hizmet verebilmek için zorunlu belgelerinizi yükleyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
