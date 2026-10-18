"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeviceMobile, CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react";
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

export default function OtpPanel({ initialPhone = null }: { initialPhone?: string | null }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [verifiedPhone, setVerifiedPhone] = useState<string>(initialPhone || "");
  const [phone, setPhone] = useState<string>(initialPhone ? formatDisplayPhone(initialPhone) : "");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(initialPhone ? 3 : 1);

  async function request() {
    if (!phone.trim()) return;
    setLoading(true);
    setMsg("");
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
        setMsg(j.error || t("errorSend"));
      } else {
        if (j.devCode) setDevCode(j.devCode);
        setMsg(t("codeSent"));
        setStep(2);
      }
    } catch {
      setIsError(true);
      setMsg(t("errorSend"));
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
        setMsg(t("phoneVerified"));
        setStep(3);
        router.refresh();
      } else {
        setIsError(true);
        setMsg(j.error || t("authFailed"));
      }
    } catch {
      setIsError(true);
      setMsg(t("authFailed"));
    } finally {
      setLoading(false);
    }
  }

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <CheckCircle size={24} weight="fill" color="#10b981" />
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
            setMsg("");
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
          }}
        >
          {t("changePhone")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {verifiedPhone && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                {t("phoneVerified")}: <strong>{formatDisplayPhone(verifiedPhone)}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhone(formatDisplayPhone(verifiedPhone));
                  setStep(3);
                  setMsg("");
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

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <DeviceMobile
                size={20}
                color="#94a3b8"
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555 123 45 67"
                type="tel"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  outline: "none",
                  fontSize: "15px",
                  color: "#0f172a",
                }}
              />
            </div>
            <button
              onClick={request}
              disabled={!phone || loading}
              type="button"
              style={{
                padding: "0 24px",
                background: phone && !loading ? "#0f172a" : "#cbd5e1",
                color: "#fff",
                borderRadius: "16px",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: phone && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
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
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("codeDigitsPlaceholder")}
              inputMode="numeric"
              maxLength={6}
              disabled={loading}
              autoFocus
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                outline: "none",
                fontSize: "15px",
                color: "#0f172a",
                letterSpacing: "4px",
                textAlign: "center",
                fontWeight: 600,
              }}
            />
            <button
              onClick={verify}
              disabled={code.length < 6 || loading}
              type="button"
              style={{
                padding: "0 24px",
                background: code.length >= 6 && !loading ? "#0f172a" : "#cbd5e1",
                color: "#fff",
                borderRadius: "16px",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: code.length >= 6 && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? t("loading") : t("verifyOtp")}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              {t("codeSentTo", { phone: formatDisplayPhone(phone) })}
            </span>
            <button
              onClick={() => {
                setStep(1);
                setMsg("");
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
              }}
            >
              {t("goBack")}
            </button>
          </div>
        </div>
      )}

      {devCode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#fef3c7",
            color: "#d97706",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "14px",
          }}
        >
          <WarningCircle size={20} weight="fill" /> Dev Code: <strong>{devCode}</strong>
        </div>
      )}

      {msg && (
        <div
          style={{
            fontSize: "13px",
            color: isError ? "#ef4444" : "#10b981",
            fontWeight: 500,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
