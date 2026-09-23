"use client";

import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/verification-requirements";

export default function AdminVerificationDocuments({ documents, onChanged }: { documents: any[]; onChanged: () => void }) {
  async function review(id: string, status: "APPROVED" | "REJECTED") {
    const note = status === "REJECTED" ? prompt("Red nedeni") || "Belge doğrulanamadı" : undefined;
    const response = await fetch(`/api/admin/verification-documents/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) alert(data.error || "Belge güncellenemedi.");
    onChanged();
  }

  if (!documents?.length) return <span style={{ color: "var(--text-muted)" }}>Yazılı belge kaydı yok. Eski başvurularda tek ruhsat dosyası kullanılabilir.</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
      {documents.filter((document) => document.status !== "SUPERSEDED").map((document) => (
        <div key={document.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: "13px" }}>
            <b>{DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}</b>
            <span> · {DOCUMENT_STATUS_LABELS[document.status] || document.status}</span>
            <span> · {document.documentNumber}</span>
            {document.expiresAt && <span> · Bitiş {new Date(document.expiresAt).toLocaleDateString("tr-TR")}</span>}
            {document.reviewerNote && <span> · {document.reviewerNote}</span>}
            <div><a href={`/api/verification-documents/${document.id}/file`} target="_blank" rel="noopener noreferrer">{document.fileName}</a></div>
          </div>
          {document.status === "PENDING" && (
            <div className="row">
              <button className="secondary compact" type="button" onClick={() => review(document.id, "APPROVED")}>Belgeyi onayla</button>
              <button className="danger compact" type="button" onClick={() => review(document.id, "REJECTED")}>Belgeyi reddet</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
