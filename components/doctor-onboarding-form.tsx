"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";

export default function DoctorOnboardingForm() {
  const t = useTranslations("professional.onboarding");
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
      setMsg(t("fileSizeError"));
      return;
    }
    setMsg(t("submitting"));
    const res = await fetch("/api/onboarding/doctor", { method: "POST", body: new FormData(form) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setIsSuccess(false);
      setMsg(j.error || t("submitError"));
      return;
    }
    setIsSuccess(true);
    setMsg(t("submitSuccess"));
    setTimeout(() => r.push("/doctor"), 700);
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
          {t("titleLabel")} <Req />
        </span>
        <input
          name="title"
          placeholder={t("titlePlaceholder")}
          required
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
          {t("specialtyLabel")} <Req />
        </span>
        <input
          name="specialty"
          placeholder={t("specialtyPlaceholder")}
          required
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
            {t("hospitalLabel")} <Req />
          </span>
          <input
            name="hospital"
            placeholder={t("hospitalPlaceholder")}
            required
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
          {t("licenseLabel")} <Req />
        </span>
        <input
          name="licenseNumber"
          required
          placeholder={t("licensePlaceholder")}
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
          {t("bioLabel")} <Req />
        </span>
        <textarea
          name="bio"
          rows={5}
          required
          placeholder={t("bioPlaceholder")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("priceLabel")}</span>
        <input
          name="price"
          type="number"
          min="0"
          defaultValue="0"
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginTop: "6px",
          }}
        />
      </label>
      <DocumentUploadFields kind="doctor" />
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