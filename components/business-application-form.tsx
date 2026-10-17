"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";

const ORG_TYPES = ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"] as const;

export default function BusinessApplicationForm({ initialType }: { initialType?: string }) {
  const t = useTranslations("professional.businessApply");
  const start = ORG_TYPES.includes(String(initialType || "").toUpperCase() as typeof ORG_TYPES[number])
    ? (String(initialType).toUpperCase() as typeof ORG_TYPES[number])
    : "CLINIC";
  const [type, setType] = useState(start);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const tooLarge = [...f.querySelectorAll('input[type="file"]')].some(
      (input) => (input as HTMLInputElement).files?.[0] && (input as HTMLInputElement).files![0].size > 4.5 * 1024 * 1024
    );
    if (tooLarge) {
      setMsg(t("fileTooLarge"));
      return;
    }
    setMsg(t("submitting"));
    try {
      const r = await fetch("/api/organizations", { method: "POST", body: new FormData(f) });
      if (r.status === 413) {
        setMsg(t("fileVercelLimit"));
        return;
      }
      if (!r.ok) {
        const text = await r.text();
        try {
          const j = JSON.parse(text);
          setMsg(j.error || t("submitFailed"));
        } catch {
          setMsg(t("serverError", { status: r.status }));
        }
        return;
      }
      await r.json();
      setMsg(t("submitSuccess"));
      setTimeout(() => router.push("/business"), 700);
    } catch (err: any) {
      setMsg(err.message || t("genericError"));
    }
  }

  const Req = () => <span style={{ color: "#ef4444", marginLeft: "4px", fontWeight: "bold" }}>*</span>;

  const orgTypeOptions: [typeof ORG_TYPES[number], string][] = [
    ["HOSPITAL", t("tabHospital")],
    ["CLINIC", t("tabClinic")],
    ["PHARMACY", t("tabPharmacy")],
    ["IMAGING_CENTER", t("tabImaging")],
    ["LABORATORY", t("tabLab")],
  ];

  return (
    <form className="business-form premium-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="org-type-select" style={{ marginBottom: "12px" }}>
        {orgTypeOptions.map((x) => (
          <button
            type="button"
            className={type === x[0] ? "selected" : ""}
            key={x[0]}
            onClick={() => setType(x[0])}
          >
            {x[1]}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("nameLabel")} <Req />
        </span>
        <input
          name="name"
          required
          placeholder={t("namePlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
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
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>{t("districtLabel")}</span>
          <input
            name="district"
            placeholder={t("districtPlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      </div>
      <label>
        <span style={{ fontWeight: "500" }}>
          {t("addressLabel")} <Req />
        </span>
        <input
          name="address"
          required
          placeholder={t("addressPlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      <div className="form-pair" style={{ display: "flex", gap: "16px" }}>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("phoneLabel")} <Req />
          </span>
          <input
            name="phone"
            required
            placeholder={t("phonePlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={{ fontWeight: "500" }}>
            {t("emailLabel")} <Req />
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
          />
        </label>
      </div>
      <label>
        <span style={{ fontWeight: "500" }}>{t("websiteLabel")}</span>
        <input
          name="website"
          placeholder={t("websitePlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      <label>
        <span style={{ fontWeight: "500" }}>{t("descLabel")}</span>
        <textarea
          name="description"
          rows={4}
          placeholder={t("descPlaceholder")}
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "6px" }}
        />
      </label>
      <DocumentUploadFields kind="organization" entityType={type} />
      {msg && (
        <div
          className="inline-message"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: msg === t("submitSuccess") ? "#dcfce3" : "#fee2e2",
            color: msg === t("submitSuccess") ? "#166534" : "#991b1b",
            fontWeight: "500",
          }}
        >
          {msg}
        </div>
      )}
      <button
        className="primary"
        type="submit"
        style={{ padding: "14px", fontSize: "16px", fontWeight: "600", marginTop: "8px", borderRadius: "8px" }}
      >
        {t("submitButton")}
      </button>
    </form>
  );
}
