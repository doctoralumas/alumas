"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DocumentUploadFields } from "@/components/verification-document-fields";

export default function AgencyApplicationForm() {
  const t = useTranslations("professional.agencyApply");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const r = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const tooLarge = [...form.querySelectorAll('input[type="file"]')].some(
      (input) =>
        (input as HTMLInputElement).files?.[0] &&
        (input as HTMLInputElement).files![0].size > 4.5 * 1024 * 1024
    );
    if (tooLarge) {
      setIsSuccess(false);
      setMsg(t("fileTooLarge"));
      return;
    }

    const res = await fetch("/api/agencies", { method: "POST", body: new FormData(form) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setIsSuccess(false);
      setMsg(j.error || t("submitFailed"));
      return;
    }

    setIsSuccess(true);
    setMsg(t("submitSuccess"));
    setTimeout(() => r.push(`/agency/${j.id}`), 700);
  }

  const Req = () => (
    <span style={{ color: "#ef4444", marginLeft: "4px", fontWeight: "bold" }}>*</span>
  );

  return (
    <form
      className="business-form premium-form"
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("nameLabel")} <Req />
        </span>
        <input
          name="name"
          required
          placeholder={t("namePlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <div className="form-pair" style={{ display: "flex", gap: "16px" }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("cityLabel")} <Req />
          </span>
          <input
            name="city"
            required
            placeholder={t("cityPlaceholder")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginTop: "6px",
            }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("phoneLabel")} <Req />
          </span>
          <input
            name="phone"
            required
            placeholder={t("phonePlaceholder")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginTop: "6px",
            }}
          />
        </label>
      </div>
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("emailLabel")} <Req />
        </span>
        <input
          name="email"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("websiteLabel")}</span>
        <input
          name="website"
          placeholder={t("websitePlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("tursabLabel")}</span>
        <input
          name="tursabNo"
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("languagesLabel")}</span>
        <input
          name="languages"
          placeholder={t("languagesPlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("descLabel")} <Req />
        </span>
        <textarea
          name="description"
          rows={5}
          required
          placeholder={t("descPlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <DocumentUploadFields kind="agency" />
      {msg && (
        <div
          className="inline-message"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: isSuccess ? "#dcfce3" : "#fee2e2",
            color: isSuccess ? "#166534" : "#991b1b",
            fontWeight: "500",
          }}
        >
          {msg}
        </div>
      )}
      <button
        className="primary"
        style={{
          padding: "14px",
          fontSize: "16px",
          fontWeight: "600",
          marginTop: "8px",
          borderRadius: "8px",
        }}
      >
        {t("submitButton")}
      </button>
    </form>
  );
}