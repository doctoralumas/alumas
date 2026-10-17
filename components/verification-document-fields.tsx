"use client";

import { requiredDocuments, type DocumentOwnerKind, type RequiredDocument } from "@/lib/verification-requirements";
import { useTranslations } from "next-intl";

const fieldStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px", width: "100%" };

export function DocumentUploadFields({ kind, entityType }: { kind: DocumentOwnerKind; entityType?: string | null }) {
  const t = useTranslations("professional.verificationFields");
  const documents = requiredDocuments(kind, entityType);
  if (!documents.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <h2 style={{ margin: "8px 0 4px", fontSize: "18px" }}>{t("title")}</h2>
        <p style={{ margin: 0, color: "#64748b" }}>{t("desc")}</p>
      </div>
      {documents.map((document) => <DocumentFields key={document.type} document={document} t={t} />)}
    </div>
  );
}

function DocumentFields({ document, t }: { document: RequiredDocument; t: (key: string) => string }) {
  return (
    <fieldset style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <legend style={{ fontWeight: 600, padding: "0 6px" }}>{document.label}{document.required ? " *" : t("optional")}{document.expires ? t("expiresTracked") : ""}</legend>
      <label>{t("docNumber")}<input name={`docNumber_${document.type}`} required={document.required} placeholder={t("docNumberPlaceholder")} style={fieldStyle} /></label>
      <label>{t("docIssuer")}<input name={`docIssuer_${document.type}`} required={document.required} placeholder={t("docIssuerPlaceholder")} style={fieldStyle} /></label>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <label style={{ flex: 1 }}>{t("issueDate")}<input type="date" name={`docIssued_${document.type}`} style={fieldStyle} /></label>
        {document.expires && <label style={{ flex: 1 }}>{t("expiryDate")}<input type="date" name={`docExpires_${document.type}`} required={document.required} style={fieldStyle} /></label>}
      </div>
      <label>{t("fileLabel")}<input type="file" name={`docFile_${document.type}`} accept="application/pdf,image/jpeg,image/png" required={document.required} style={{ marginTop: "6px" }} /></label>
    </fieldset>
  );
}
