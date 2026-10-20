"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";
import { ShieldCheck, Sparkle } from "@phosphor-icons/react";

export interface ClaimDoctorSummary {
  id: string;
  name: string;
  title: string;
  specialty: string;
  hospital: string | null;
  city: string;
}

export default function DoctorOnboardingForm({
  claimDoctor,
  suggestedMatches = [],
}: {
  claimDoctor?: ClaimDoctorSummary | null;
  suggestedMatches?: ClaimDoctorSummary[];
}) {
  const t = useTranslations("professional.onboarding");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const r = useRouter();

  const [selectedClaim, setSelectedClaim] = useState<ClaimDoctorSummary | null>(claimDoctor || null);
  const [title, setTitle] = useState(claimDoctor?.title || "");
  const [specialty, setSpecialty] = useState(claimDoctor?.specialty || "");
  const [city, setCity] = useState(claimDoctor?.city || "");
  const [hospital, setHospital] = useState(claimDoctor?.hospital || "");

  function handleSelectClaim(item: ClaimDoctorSummary) {
    setSelectedClaim(item);
    setTitle(item.title);
    setSpecialty(item.specialty);
    setCity(item.city);
    setHospital(item.hospital || "");
  }

  function handleCancelClaim() {
    setSelectedClaim(null);
  }

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
      {/* Selected Claim Banner */}
      {selectedClaim && (
        <div
          data-testid="selected-claim-card"
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            padding: "16px 20px",
            borderRadius: "16px",
            marginBottom: "8px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
            color: "#0369a1",
          }}
        >
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <ShieldCheck size={28} weight="duotone" color="#0284c7" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>
                {t("claimSelectedNotice")}
              </div>
              <div style={{ fontSize: "14px", color: "#0c4a6e" }}>
                <strong>
                  {selectedClaim.title} {selectedClaim.name}
                </strong>{" "}
                — {selectedClaim.specialty} ({selectedClaim.hospital || selectedClaim.city})
              </div>
              <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "4px" }}>
                {t("claimSelectedHint")}
              </div>
            </div>
          </div>
          <button
            type="button"
            data-testid="cancel-claim-button"
            onClick={handleCancelClaim}
            style={{
              background: "transparent",
              border: "1px solid #93c5fd",
              color: "#0369a1",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t("cancelClaim")}
          </button>
          <input type="hidden" name="claimDoctorId" value={selectedClaim.id} />
        </div>
      )}

      {/* Suggested Directory Matches (Safe Opt-in, never auto-claimed) */}
      {!selectedClaim && suggestedMatches.length > 0 && (
        <div
          data-testid="suggested-matches-card"
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            padding: "18px 20px",
            borderRadius: "16px",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkle size={22} weight="duotone" color="#2563eb" />
            <strong style={{ fontSize: "15px", color: "#0f172a" }}>
              {t("existingMatchesNotice")}
            </strong>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
            {t("existingMatchesDesc")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {suggestedMatches.map((m) => (
              <div
                key={m.id}
                data-testid={`suggested-match-${m.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>
                    {m.title} {m.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {m.specialty} · {m.hospital || m.city}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid={`claim-suggested-button-${m.id}`}
                  onClick={() => handleSelectClaim(m)}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("claimThisProfile")}
                </button>
              </div>
            ))}
          </div>
          <small style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
            {t("independentNotice")}
          </small>
        </div>
      )}

      <label>
        <span style={{ fontWeight: "500" }}>
          {t("titleLabel")} <Req />
        </span>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
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
            value={city}
            onChange={(e) => setCity(e.target.value)}
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
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
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
