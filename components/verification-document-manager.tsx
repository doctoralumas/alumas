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
    <section className="panel form-span">
      <h2>Doğrulama belgeleri</h2>
      <p>Zorunlu belgeler onaylanmadan profil yayınlanmaz. Süresi dolan belge yayını durdurur. Yeni dosya, eskisinin yerine incelenmek üzere eklenir.</p>
      {msg && <div className="inline-message">{msg}</div>}
      <div style={{ display: "grid", gap: 14 }}>
        {requirements.map((requirement) => {
          const current = rows.find((row) => row.documentType === requirement.type && row.status !== "SUPERSEDED");
          return (
            <article className="doc-card" key={requirement.type}>
              <header>
                <div>
                  <b>{requirement.label}</b>
                  <p>
                    {requirement.required ? "Zorunlu" : "İsteğe bağlı"}
                    {requirement.expires ? " · Son kullanma tarihi takip edilir" : ""}
                    {current?.documentNumber ? ` · No: ${current.documentNumber}` : ""}
                    {current?.expiresAt ? ` · Bitiş: ${new Date(current.expiresAt).toLocaleDateString("tr-TR")}` : ""}
                    {current?.reviewerNote ? ` · ${current.reviewerNote}` : ""}
                  </p>
                </div>
                <span className="status">{current ? DOCUMENT_STATUS_LABELS[current.status] || current.status : "Eksik"}</span>
              </header>
              {current && <a href={`/api/verification-documents/${current.id}/file`}>Yüklenen dosyayı aç</a>}
              <form className="doc-fields" onSubmit={(event) => upload(event, requirement.type)}>
                <label className="field">
                  <span>Belge numarası</span>
                  <input name="documentNumber" placeholder="Örn. 123456" required defaultValue={current?.documentNumber || ""} />
                </label>
                <label className="field">
                  <span>Veren kurum</span>
                  <input name="issuer" placeholder="Kurum adı" required defaultValue={current?.issuer || ""} />
                </label>
                <label className="field">
                  <span>Düzenlenme tarihi</span>
                  <input type="date" name="issuedAt" />
                </label>
                {requirement.expires && (
                  <label className="field">
                    <span>Son kullanma tarihi</span>
                    <input type="date" name="expiresAt" required />
                  </label>
                )}
                <label className="field field-span">
                  <span>Belge dosyası</span>
                  <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required />
                </label>
                <button className="primary" type="submit">{current ? "Yeni dosya gönder" : "Belge yükle"}</button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
