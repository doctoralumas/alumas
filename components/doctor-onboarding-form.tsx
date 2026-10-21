"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadFields } from "@/components/verification-document-fields";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Sparkle,
  User,
  Buildings,
  ChatCircleText,
  LockKey,
  X,
  CheckCircle,
  CurrencyCny,
  WarningCircle,
} from "@phosphor-icons/react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    setMsg(t("submitting"));
    try {
      const res = await fetch("/api/onboarding/doctor", { method: "POST", body: new FormData(form) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIsSuccess(false);
        setMsg(j.error || t("submitError"));
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setMsg(t("submitSuccess"));
      setTimeout(() => r.push("/doctor"), 700);
    } catch {
      setIsSuccess(false);
      setMsg(t("submitError"));
      setIsSubmitting(false);
    }
  }

  const Req = () => (
    <span style={{ color: "#ef4444", marginLeft: "4px", fontWeight: "bold" }}>*</span>
  );

  const inputStyle = {
    width: "100%",
    minHeight: "46px",
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#0d9488";
    e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "#cbd5e1";
    e.target.style.boxShadow = "none";
  };

  return (
    <form
      className="business-form premium-form"
      onSubmit={submit}
      style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%", boxSizing: "border-box" }}
    >
      {/* 1. Selected Claim Banner */}
      {selectedClaim && (
        <div
          data-testid="selected-claim-card"
          style={{
            background: "linear-gradient(135deg, #f0fdfa 0%, #f0f9ff 100%)",
            border: "1px solid #99f6e4",
            padding: "18px 20px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            boxShadow: "0 2px 8px -2px rgba(13, 148, 136, 0.08)",
            boxSizing: "border-box",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: "1 1 260px", minWidth: 0 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#ccfbf1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f766e",
                flexShrink: 0,
                marginTop: "2px",
              }}
            >
              <ShieldCheck size={24} weight="duotone" color="#0d9488" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "#0f766e",
                  background: "#e6fffa",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  marginBottom: "6px",
                }}
              >
                {t("claimSelectedNotice")}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {selectedClaim.title} {selectedClaim.name}
              </div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px", wordBreak: "break-word" }}>
                {selectedClaim.specialty} · {selectedClaim.hospital || selectedClaim.city}
              </div>
              <div style={{ fontSize: "12px", color: "#0f766e", marginTop: "6px", lineHeight: 1.5 }}>
                {t("claimSelectedHint")}
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="cancel-claim-button"
            onClick={handleCancelClaim}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              alignSelf: "flex-start",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <X size={14} weight="bold" />
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
            border: "1px solid #e2e8f0",
            padding: "20px",
            borderRadius: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                flexShrink: 0,
              }}
            >
              <Sparkle size={20} weight="duotone" />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                {t("existingMatchesNotice")}
              </strong>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0", lineHeight: 1.5 }}>
                {t("existingMatchesDesc")}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {suggestedMatches.map((m) => (
              <div
                key={m.id}
                data-testid={`suggested-match-${m.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                    {m.title} {m.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {m.specialty} · {m.hospital || m.city}
                  </div>
                </div>
                <button
                  type="button"
                  data-testid={`claim-suggested-button-${m.id}`}
                  onClick={() => handleSelectClaim(m)}
                  style={{
                    background: "#0d9488",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: "40px",
                    transition: "background 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#0f766e";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#0d9488";
                  }}
                >
                  {t("claimThisProfile")}
                </button>
              </div>
            ))}
          </div>

          <small style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>
            {t("independentNotice")}
          </small>
        </div>
      )}

      {/* SECTION 1: Mesleki Kimlik Bilgileri */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#f0fdfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f766e",
              flexShrink: 0,
            }}
          >
            <User size={18} weight="bold" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              {t("sectionProfile")}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              {t("sectionProfileDesc")}
            </p>
          </div>
        </div>

        {/* Title and Specialty - Responsive 2 Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "16px",
          }}
        >
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelStyle}>
              {t("titleLabel")} <Req />
            </span>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </label>

          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelStyle}>
              {t("specialtyLabel")} <Req />
            </span>
            <input
              name="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder={t("specialtyPlaceholder")}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </label>
        </div>

        {/* License Number */}
        <label style={{ display: "block", width: "100%" }}>
          <span style={labelStyle}>
            {t("licenseLabel")} <Req />
          </span>
          <input
            name="licenseNumber"
            required
            placeholder={t("licensePlaceholder")}
            style={inputStyle}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </label>
      </div>

      {/* SECTION 2: Çalışma Yeri & Lokasyon */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#f0fdfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f766e",
              flexShrink: 0,
            }}
          >
            <Buildings size={18} weight="bold" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              {t("sectionWorkplace")}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              {t("sectionWorkplaceDesc")}
            </p>
          </div>
        </div>

        {/* City and Hospital - Responsive 2 Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "16px",
          }}
        >
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelStyle}>
              {t("cityLabel")} <Req />
            </span>
            <input
              name="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("cityPlaceholder")}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </label>

          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelStyle}>
              {t("hospitalLabel")} <Req />
            </span>
            <input
              name="hospital"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder={t("hospitalPlaceholder")}
              required
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: Biyografi ve Danışmanlık */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#f0fdfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f766e",
              flexShrink: 0,
            }}
          >
            <ChatCircleText size={18} weight="bold" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              {t("bioLabel")}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              {t("sectionProfileDesc")}
            </p>
          </div>
        </div>

        {/* Bio Textarea */}
        <label style={{ display: "block", width: "100%" }}>
          <span style={labelStyle}>
            {t("bioLabel")} <Req />
          </span>
          <textarea
            name="bio"
            rows={4}
            required
            placeholder={t("bioPlaceholder")}
            style={{
              ...inputStyle,
              minHeight: "110px",
              resize: "vertical",
              lineHeight: 1.5,
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </label>

        {/* Price Input */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <label style={{ display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={labelStyle}>
                {t("priceLabel")}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#64748b",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  padding: "1px 8px",
                  borderRadius: "100px",
                }}
              >
                {t("optionalBadge")}
              </span>
            </div>
            <div style={{ position: "relative", width: "100%" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: "15px",
                }}
              >
                ₺
              </span>
              <input
                name="price"
                type="number"
                min="0"
                defaultValue="0"
                style={{
                  ...inputStyle,
                  paddingLeft: "32px",
                  maxWidth: "280px",
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </label>
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
            {t("priceHint")}
          </p>
        </div>
      </div>

      {/* SECTION 4: Mesleki Doğrulama Belgeleri */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
        <DocumentUploadFields kind="doctor" />
      </div>

      {/* SECTION 5: Onay ve Gönderim */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
        {/* Security & Regulatory Reassurance */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "#475569",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          <LockKey size={18} weight="duotone" color="#0d9488" style={{ flexShrink: 0 }} />
          <span>{t("secureSubmissionNotice")}</span>
        </div>

        {/* Message Banner */}
        {msg && (
          <div
            className="inline-message"
            data-testid="onboarding-status-message"
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              background: isSuccess ? "#f0fdf4" : "#fef2f2",
              border: isSuccess ? "1px solid #bbf7d0" : "1px solid #fecaca",
              color: isSuccess ? "#166534" : "#991b1b",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {isSuccess ? (
              <CheckCircle size={20} weight="fill" color="#16a34a" style={{ flexShrink: 0 }} />
            ) : (
              <WarningCircle size={20} weight="fill" color="#dc2626" style={{ flexShrink: 0 }} />
            )}
            <span>{msg}</span>
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="doctor-onboarding-submit-button"
          style={{
            width: "100%",
            minHeight: "52px",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "14px",
            background: isSubmitting ? "#475569" : "#0f172a",
            color: "#ffffff",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.16)",
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            letterSpacing: "-0.01em",
          }}
          onMouseOver={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = "#1e293b";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(15, 23, 42, 0.22)";
            }
          }}
          onMouseOut={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = "#0f172a";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.16)";
            }
          }}
        >
          {isSubmitting ? t("submitting") : t("submitButton")}
        </button>
      </div>
    </form>
  );
}
