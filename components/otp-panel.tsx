"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeviceMobile, CheckCircle, WarningCircle, ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

function formatDisplayPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  if (digits.length === 12 && digits.startsWith("90")) {
    const d = digits.slice(2);
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }
  return raw;
}

type OtpNotice = {
  key?: string;
  code?: string;
  fallback?: string;
} | null;

function resolveOtpNotice(notice: OtpNotice, t: (k: string) => string): string {
  if (!notice) return "";
  if (notice.key) {
    try {
      return t(notice.key);
    } catch {
      return notice.key;
    }
  }
  if (notice.code) {
    const codeMap: Record<string, string> = {
      ACCOUNT_NOT_FOUND: "accountNotFoundPrompt",
      PHONE_ALREADY_REGISTERED: "phoneAlreadyRegistered",
      INVALID_OR_EXPIRED_CODE: "errorVerify",
      CODE_ALREADY_USED: "codeAlreadyUsed",
      PHONE_IN_USE: "phoneInUse",
      RATE_LIMITED: "rateLimited",
      INVALID_PHONE: "invalidPhone",
      INVALID_INPUT: "invalidPhone",
      UNAUTHORIZED_OTP: "unauthorizedOtp",
      SMS_SEND_FAILED: "smsSendFailed",
    };
    const k = codeMap[notice.code];
    if (k) {
      try {
        return t(k);
      } catch {}
    }
    return notice.fallback || t("errorVerify");
  }
  if (notice.fallback) {
    if (notice.fallback.includes("başka bir hesap tarafından")) return t("phoneInUse");
    if (notice.fallback.includes("başka bir hesaba")) return t("phoneAlreadyRegistered");
    if (notice.fallback.includes("zaten kullanılmış")) return t("codeAlreadyUsed");
    if (notice.fallback.includes("süresi dolmuş") || notice.fallback.includes("geçersiz")) return t("errorVerify");
    if (notice.fallback.includes("Çok fazla")) return t("rateLimited");
    if (notice.fallback.includes("SMS gönderilemedi")) return t("smsSendFailed");
    if (notice.fallback.includes("Geçerli bir telefon")) return t("invalidPhone");
    return notice.fallback;
  }
  return "";
}

export default function OtpPanel({ initialPhone = null }: { initialPhone?: string | null }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [verifiedPhone, setVerifiedPhone] = useState<string>(initialPhone || "");
  const [phone, setPhone] = useState<string>(initialPhone ? formatDisplayPhone(initialPhone) : "");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [notice, setNotice] = useState<OtpNotice>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(initialPhone ? 3 : 1);

  const displayNotice = resolveOtpNotice(notice, t);

  async function request() {
    if (!phone.trim()) return;
    setLoading(true);
    setNotice(null);
    setIsError(false);

    try {
      const r = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setIsError(true);
        setNotice({ code: j.code, fallback: j.error });
      } else {
        if (j.devCode) setDevCode(j.devCode);
        setStep(2);
      }
    } catch {
      setIsError(true);
      setNotice({ key: "errorSend" });
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (code.length < 6) return;
    setLoading(true);
    setIsError(false);

    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const canonicalPhone = j.phone || phone;
        setIsError(false);
        setVerifiedPhone(canonicalPhone);
        setPhone(formatDisplayPhone(canonicalPhone));
        setNotice({ key: "phoneVerified" });
        setStep(3);
        router.refresh();
      } else {
        setIsError(true);
        setNotice({ code: j.code, fallback: j.error });
      }
    } catch {
      setIsError(true);
      setNotice({ key: "authFailed" });
    } finally {
      setLoading(false);
    }
  }

  // STEP 3: Phone is Verified
  if (step === 3 && verifiedPhone) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "#ecfdf5",
          padding: "16px 20px",
          borderRadius: "16px",
          border: "1px solid #d1fae5",
          flexWrap: "wrap",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CheckCircle size={26} weight="fill" color="#10b981" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: "block", color: "#065f46", fontSize: "15px" }}>
              {t("phoneVerified")}
            </strong>
            <span style={{ fontSize: "14px", color: "#059669", fontWeight: 600 }}>
              {formatDisplayPhone(verifiedPhone)}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setPhone("");
            setCode("");
            setNotice(null);
            setIsError(false);
            setStep(1);
          }}
          type="button"
          style={{
            background: "#fff",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "8px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {t("changePhone")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>
      {/* STEP 1: Phone Number Input */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            request();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", boxSizing: "border-box" }}
        >
          {verifiedPhone && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                {t("phoneVerified")}: <strong>{formatDisplayPhone(verifiedPhone)}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhone(formatDisplayPhone(verifiedPhone));
                  setStep(3);
                  setNotice(null);
                  setIsError(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {t("cancel")}
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", width: "100%", boxSizing: "border-box", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px", boxSizing: "border-box" }}>
              <DeviceMobile
                size={20}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                type="tel"
                disabled={loading}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px 13px 44px",
                  borderRadius: "14px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  outline: "none",
                  fontSize: "15px",
                  color: "#0f172a",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              onClick={request}
              disabled={!phone || loading}
              type="submit"
              style={{
                flex: "0 0 auto",
                padding: "0 22px",
                minHeight: "46px",
                background: phone && !loading ? "#0f172a" : "#cbd5e1",
                color: "#fff",
                borderRadius: "14px",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: phone && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
              }}
            >
              {loading ? t("loading") : (
                <>
                  {t("continue")}
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Verification Code Input (Clean stacked layout, no horizontal overflow) */}
      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", boxSizing: "border-box" }}
        >
          {/* Helper info */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#475569" }}>
              {t("codeSentTo", { phone: formatDisplayPhone(phone) })}
            </span>
            <button
              onClick={() => {
                setStep(1);
                setCode("");
                setNotice(null);
                setIsError(false);
              }}
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: 0,
              }}
            >
              <ArrowLeft size={14} weight="bold" />
              {t("goBack")}
            </button>
          </div>

          {/* 6-digit input */}
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="------"
              inputMode="numeric"
              maxLength={6}
              disabled={loading}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1.5px solid #cbd5e1",
                background: "#f8fafc",
                outline: "none",
                fontSize: "20px",
                color: "#0f172a",
                letterSpacing: "8px",
                textAlign: "center",
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Full-width action button */}
          <button
            onClick={verify}
            disabled={code.length < 6 || loading}
            type="submit"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px",
              background: code.length >= 6 && !loading ? "#0f172a" : "#cbd5e1",
              color: "#fff",
              borderRadius: "14px",
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: code.length >= 6 && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? t("loading") : (
              <>
                <CheckCircle size={18} weight="bold" />
                {t("verifyOtp")}
              </>
            )}
          </button>
        </form>
      )}

      {/* Dev code helper (only in non-prod when sms provider is console/dev) */}
      {devCode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fef3c7",
            color: "#d97706",
            padding: "10px 14px",
            borderRadius: "12px",
            fontSize: "13px",
            boxSizing: "border-box",
          }}
        >
          <WarningCircle size={18} weight="fill" /> Dev Code: <strong>{devCode}</strong>
        </div>
      )}

      {/* Error notification banner */}
      {isError && displayNotice && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#b91c1c",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxSizing: "border-box",
          }}
        >
          <WarningCircle size={18} weight="fill" style={{ flexShrink: 0 }} />
          <span>{displayNotice}</span>
        </div>
      )}
    </div>
  );
}
