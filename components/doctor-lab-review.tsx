"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function DoctorLabReview({ patientId }: { patientId: string }) {
  const t = useTranslations("professional.doctorLabReview");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";

  const [labs, setLabs] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch(`/api/health/labs?patientId=${patientId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setLabs);
    fetch(`/api/health/lab-comments?patientId=${patientId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setComments);
  };

  useEffect(() => {
    load();
  }, [patientId]);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch("/api/health/lab-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        labResultId: f.get("labResultId"),
        body: f.get("body"),
        patientVisible: f.get("patientVisible") === "true",
      }),
    });
    const j = await r.json();
    setMsg(r.ok ? t("successMsg") : j.error || t("errorMsg"));
    if (r.ok) {
      form.reset();
      load();
    }
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      <form className="lab-comment-form-v18" onSubmit={add}>
        <select name="labResultId" required>
          <option value="">{t("selectResult")}</option>
          {labs.map((l) => (
            <option key={l.id} value={l.id}>
              {l.testName} · {l.value} {l.unit || ""}
            </option>
          ))}
        </select>
        <textarea name="body" placeholder={t("commentPlaceholder")} required />
        <label className="check-label-v17">
          <input
            type="checkbox"
            name="patientVisible"
            value="true"
            defaultChecked
          />{" "}
          {t("shareWithPatient")}
        </label>
        <button className="primary">{t("saveComment")}</button>
      </form>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="note-list-v17">
        {comments.map((c) => (
          <article key={c.id}>
            <b>{c.labResult?.testName}</b>
            <p>{c.body}</p>
            <small>
              {new Date(c.createdAt).toLocaleString(dateLocale)} ·{" "}
              {c.patientVisible ? t("visibleToPatient") : t("privateNote")}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
