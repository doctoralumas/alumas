"use client";

import { useEffect, useState } from "react";

type Patient = { id: string; name: string; email: string };
type CatalogItem = { id: string; name: string };

export default function ResultDelivery({
  organizationId,
  kind,
  catalog,
}: {
  organizationId: string;
  kind: "imaging" | "laboratory";
  catalog: CatalogItem[];
}) {
  const imaging = kind === "imaging";
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [reportText, setReportText] = useState("");
  const [impression, setImpression] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceLow, setReferenceLow] = useState("");
  const [referenceHigh, setReferenceHigh] = useState("");
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/organizations/${organizationId}/results`)
      .then((response) => response.ok ? response.json() : { patients: [] })
      .then((data) => setPatients(Array.isArray(data.patients) ? data.patients : []))
      .catch(() => setPatients([]));
  }, [organizationId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMsg("Kaydediliyor...");
    const response = await fetch(`/api/organizations/${organizationId}/results`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        patientId,
        catalogId,
        reportText,
        impression,
        value,
        unit,
        referenceLow,
        referenceHigh,
        performedAt: when,
        measuredAt: when,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Sonuç işlenemedi");
      return;
    }
    setReportText("");
    setImpression("");
    setValue("");
    setUnit("");
    setReferenceLow("");
    setReferenceHigh("");
    setWhen("");
    setMsg(imaging ? "Rapor hastanın görüntüleme geçmişine işlendi." : "Sonuç hastanın tahlil geçmişine işlendi.");
  }

  return (
    <section className="panel form-span" style={{ marginBottom: 24 }}>
      <h2>{imaging ? "Raporu hastanın kaydına işle" : "Sonucu hastanın tahlil geçmişine işle"}</h2>
      <p>
        {imaging
          ? "Seçilen tetkik raporu, mesajı veya randevusu olan hastanın görüntüleme geçmişine yazılır."
          : "Seçilen tahlil sonucu, mesajı veya randevusu olan hastanın tahlil geçmişine yazılır."}
        {" "}
        <a href="/messages">Mesajlara git</a>
      </p>
      {!catalog.length && <div className="empty">Önce kataloğa kayıt ekleyin. Sonuç, yayınlanan katalogdan seçilir.</div>}
      {!!catalog.length && !patients.length && <div className="empty">Henüz bu kurumla mesajlaşan veya randevusu olan hasta yok.</div>}
      {!!catalog.length && !!patients.length && (
        <form className="compact-form" onSubmit={submit}>
          <select value={patientId} onChange={(event) => setPatientId(event.target.value)} required>
            <option value="">Hasta seç</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.email}</option>)}
          </select>
          <select value={catalogId} onChange={(event) => setCatalogId(event.target.value)} required>
            <option value="">{imaging ? "Tetkik seç" : "Tahlil seç"}</option>
            {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input type="date" value={when} onChange={(event) => setWhen(event.target.value)} required />
          {imaging ? (
            <>
              <textarea value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder="Rapor metni" required />
              <input value={impression} onChange={(event) => setImpression(event.target.value)} placeholder="Kısa sonuç notu (opsiyonel)" />
            </>
          ) : (
            <>
              <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Sonuç değeri" required />
              <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Birim, örn. mg/dL" />
              <input value={referenceLow} onChange={(event) => setReferenceLow(event.target.value)} placeholder="Referans alt" />
              <input value={referenceHigh} onChange={(event) => setReferenceHigh(event.target.value)} placeholder="Referans üst" />
            </>
          )}
          <button className="primary">Hastanın kaydına işle</button>
        </form>
      )}
      {msg && <div className="inline-message">{msg}</div>}
    </section>
  );
}
