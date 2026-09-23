"use client";

import { useState } from "react";
import { DOCUMENT_STATUS_LABELS, requiredDocuments, type DocumentOwnerKind } from "@/lib/verification-requirements";

type Owner = { kind: DocumentOwnerKind; entityType?: string | null; organizationId?: string; doctorId?: string; agencyId?: string };

export default function VerificationDocumentManager({ owner, documents }: { owner: Owner; documents: any[] }) {
  const [rows, setRows] = useState(documents || []);
  const [msg, setMsg] = useState("");
  const requirements = requiredDocuments(owner.kind, owner.entityType);

  async function upload(event: React.FormEvent<HTMLFormElement>, type: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
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
    const response = await fetch("/api/verification-documents", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Belge yüklenemedi.");
      return;
    }
    setRows((current) => [data, ...current]);
    form.reset();
    setMsg("Belge incelemeye gönderildi.");
  }

  return (
    <section className="panel form-span" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <h2>Doğrulama belgeleri</h2>
        <p>Zorunlu belgeler onaylanmadan profil yayınlanmaz. Süresi dolan belge yayını durdurur. Yeni dosya, eskisinin yerine incelenmek üzere eklenir.</p>
      </div>
      {msg && <div className="inline-message">{msg}</div>}
      {requirements.map((requirement) => {
        const current = rows.find((row) => row.documentType === requirement.type && row.status !== "SUPERSEDED");
        return (
          <div key={requirement.type} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
            <div className="row between">
              <b>{requirement.label}</b>
              <span className="status">{current ? DOCUMENT_STATUS_LABELS[current.status] || current.status : "Eksik"}</span>
            </div>
            <small>
              {requirement.required ? "Zorunlu" : "İsteğe bağlı"}
              {requirement.expires ? " · Son kullanma tarihi takip edilir" : ""}
              {current?.documentNumber ? ` · No: ${current.documentNumber}` : ""}
              {current?.expiresAt ? ` · Bitiş: ${new Date(current.expiresAt).toLocaleDateString("tr-TR")}` : ""}
              {current?.reviewerNote ? ` · ${current.reviewerNote}` : ""}
            </small>
            {current && <div style={{ marginTop: "8px" }}><a href={`/api/verification-documents/${current.id}/file`}>Yüklenen dosyayı aç</a></div>}
            <form style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }} onSubmit={(event) => upload(event, requirement.type)}>
              <input name="documentNumber" placeholder="Belge numarası" required defaultValue={current?.documentNumber || ""} />
              <input name="issuer" placeholder="Veren kurum" required defaultValue={current?.issuer || ""} />
              <input type="date" name="issuedAt" />
              {requirement.expires && <input type="date" name="expiresAt" required />}
              <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required />
              <button className="secondary" type="submit">{current ? "Yeni dosya gönder" : "Belge yükle"}</button>
            </form>
          </div>
        );
      })}
    </section>
  );
}
