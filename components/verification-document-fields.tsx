"use client";

import { requiredDocuments, type DocumentOwnerKind, type RequiredDocument } from "@/lib/verification-requirements";

const fieldStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px", width: "100%" };

export function DocumentUploadFields({ kind, entityType }: { kind: DocumentOwnerKind; entityType?: string | null }) {
  const documents = requiredDocuments(kind, entityType);
  if (!documents.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <h2 style={{ margin: "8px 0 4px", fontSize: "18px" }}>Doğrulama belgeleri</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Dosyalar hasta sayfasında görünmez. Son kullanma tarihi dolan zorunlu belge yayını durdurur.</p>
      </div>
      {documents.map((document) => <DocumentFields key={document.type} document={document} />)}
    </div>
  );
}

function DocumentFields({ document }: { document: RequiredDocument }) {
  return (
    <fieldset style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <legend style={{ fontWeight: 600, padding: "0 6px" }}>{document.label}{document.required ? " *" : " (isteğe bağlı)"}{document.expires ? " · son kullanma tarihi takip edilir" : ""}</legend>
      <label>Belge numarası<input name={`docNumber_${document.type}`} required={document.required} placeholder="Belge veya sicil numarası" style={fieldStyle} /></label>
      <label>Veren kurum<input name={`docIssuer_${document.type}`} required={document.required} placeholder="Örn: İl Sağlık Müdürlüğü" style={fieldStyle} /></label>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <label style={{ flex: 1 }}>Düzenlenme tarihi<input type="date" name={`docIssued_${document.type}`} style={fieldStyle} /></label>
        {document.expires && <label style={{ flex: 1 }}>Son kullanma tarihi<input type="date" name={`docExpires_${document.type}`} required={document.required} style={fieldStyle} /></label>}
      </div>
      <label>Dosya (PDF, JPG veya PNG, en fazla 4.5 MB)<input type="file" name={`docFile_${document.type}`} accept="application/pdf,image/jpeg,image/png" required={document.required} style={{ marginTop: "6px" }} /></label>
    </fieldset>
  );
}
