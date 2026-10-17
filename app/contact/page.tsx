"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(f)),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setIsSuccess(true);
      setMsg(t("success"));
      form.reset();
    } else {
      setIsSuccess(false);
      setMsg(j.error || t("error"));
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <form className="v26-contact-form" onSubmit={submit}>
          <input name="name" placeholder={t("namePlaceholder")} required />
          <input name="email" type="email" placeholder={t("emailPlaceholder")} required />
          <input name="phone" placeholder={t("phonePlaceholder")} />
          <input name="subject" placeholder={t("subjectPlaceholder")} required />
          <textarea name="message" placeholder={t("messagePlaceholder")} required />
          <button className="primary">{t("sendButton")}</button>
        </form>
        {msg && (
          <div
            className="inline-message"
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background: isSuccess ? "#ecfdf5" : "#fef2f2",
              color: isSuccess ? "#047857" : "#b91c1c",
              fontWeight: 500,
            }}
          >
            {msg}
          </div>
        )}
      </section>
      <section className="panel health-section">
        <h2>{t("emergencyTitle")}</h2>
        <p>{t("emergencyDesc")}</p>
        <a className="secondary" href="tel:112">
          {t("emergencyCall")}
        </a>
      </section>
    </div>
  );
}