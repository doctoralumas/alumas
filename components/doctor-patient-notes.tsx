"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function DoctorPatientNotes({ patientId }: { patientId: string }) {
  const t = useTranslations("professional.doctorPatientNotes");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch(`/api/doctor/patients/${patientId}/notes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows);

  useEffect(() => {
    load();
  }, [patientId]);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/doctor/patients/${patientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(f.entries())),
    });
    const j = await r.json();
    setMsg(r.ok ? t("noteSaved") : j.error || t("saveFailed"));
    if (r.ok) {
      form.reset();
      load();
    }
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("desc")}</p>
      <form className="doctor-note-form-v17" onSubmit={add}>
        <input name="title" placeholder={t("titlePlaceholder")} />
        <select name="category">
          <option value="general">{t("catGeneral")}</option>
          <option value="followup">{t("catFollowup")}</option>
          <option value="lab">{t("catLab")}</option>
          <option value="medication">{t("catMedication")}</option>
        </select>
        <textarea name="body" placeholder={t("bodyPlaceholder")} required />
        <label className="check-label-v17">
          <input type="checkbox" name="patientVisible" value="true" /> {t("shareWithPatient")}
        </label>
        <button className="primary">{t("saveNote")}</button>
      </form>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="note-list-v17">
        {rows.map((n) => (
          <article key={n.id}>
            <div className="row between">
              <b>{n.title || t("defaultNoteTitle")}</b>
              <em>{n.patientVisible ? t("badgePatientVisible") : t("badgePrivate")}</em>
            </div>
            <p>{n.body}</p>
            <small>{new Date(n.createdAt).toLocaleString(dateLocale)}</small>
          </article>
        ))}
        {!rows.length && <div className="empty">{t("noNotes")}</div>}
      </div>
    </section>
  );
}
