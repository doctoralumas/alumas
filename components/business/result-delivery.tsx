"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("professional.resultDelivery");
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
    setMsg(t("saving"));
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
      setMsg(data.error || t("saveFailed"));
      return;
    }
    setReportText("");
    setImpression("");
    setValue("");
    setUnit("");
    setReferenceLow("");
    setReferenceHigh("");
    setWhen("");
    setMsg(imaging ? t("imagingSaved") : t("labSaved"));
  }

  return (
    <section className="panel form-span" style={{ marginBottom: 24 }}>
      <h2>{imaging ? t("imagingTitle") : t("labTitle")}</h2>
      <p>
        {imaging ? t("imagingDesc") : t("labDesc")}
        {" "}
        <a href="/messages">{t("goToMessages")}</a>
      </p>
      {!catalog.length && <div className="empty">{t("emptyCatalog")}</div>}
      {!!catalog.length && !patients.length && <div className="empty">{t("emptyPatients")}</div>}
      {!!catalog.length && !!patients.length && (
        <form className="panel-fields" onSubmit={submit}>
          <label className="field">
            <span>{t("patientLabel")}</span>
            <select value={patientId} onChange={(event) => setPatientId(event.target.value)} required>
              <option value="">{t("selectPatient")}</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.email}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{imaging ? t("examLabel") : t("testLabel")}</span>
            <select value={catalogId} onChange={(event) => setCatalogId(event.target.value)} required>
              <option value="">{imaging ? t("selectExam") : t("selectTest")}</option>
              {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{imaging ? t("scanDateLabel") : t("sampleDateLabel")}</span>
            <input type="date" value={when} onChange={(event) => setWhen(event.target.value)} required />
          </label>
          {imaging ? (
            <>
              <label className="field">
                <span>{t("reportTextLabel")}</span>
                <textarea value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder={t("findingsPlaceholder")} required />
              </label>
              <label className="field">
                <span>{t("shortImpressionLabel")}</span>
                <input value={impression} onChange={(event) => setImpression(event.target.value)} placeholder={t("optionalPlaceholder")} />
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span>{t("resultValueLabel")}</span>
                <input value={value} onChange={(event) => setValue(event.target.value)} required />
              </label>
              <label className="field">
                <span>{t("unitLabel")}</span>
                <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="mg/dL" />
              </label>
              <label className="field">
                <span>{t("referenceLowLabel")}</span>
                <input value={referenceLow} onChange={(event) => setReferenceLow(event.target.value)} />
              </label>
              <label className="field">
                <span>{t("referenceHighLabel")}</span>
                <input value={referenceHigh} onChange={(event) => setReferenceHigh(event.target.value)} />
              </label>
            </>
          )}
          <button className="primary">{t("submitButton")}</button>
        </form>
      )}
      {msg && <div className="inline-message">{msg}</div>}
    </section>
  );
}
