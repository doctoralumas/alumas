"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  resolvePostAuthDestination,
  sanitizeClaimDirectoryId,
  sanitizeInternalReturnUrl,
} from "@/lib/claim-onboarding";

export default function PhoneLogin({
  claimInstitutionName = null,
}: {
  claimInstitutionName?: string | null;
}) {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="auth-card">{tCommon("loading")}</div>}>
      <PhoneLoginContent claimInstitutionName={claimInstitutionName} />
    </Suspense>
  );
}

type AuthNotice =
  | { type: "code"; code: string; fallback?: string }
  | { type: "key"; key: string; params?: Record<string, string | number> }
  | { type: "raw"; text: string }
  | null;

function resolveNotice(
  notice: AuthNotice,
  t: (key: string, params?: any) => string
): string {
  if (!notice) return "";
  if (notice.type === "key") {
    try {
      return t(notice.key, notice.params);
    } catch {
      return notice.key;
    }
  }
  if (notice.type === "code") {
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
    const key = codeMap[notice.code];
    if (key) {
      try {
        return t(key);
      } catch {}
    }
    return notice.fallback || t("errorVerify");
  }
  if (notice.type === "raw") {
    if (notice.text.includes("hesap bulunamadı")) return t("accountNotFoundPrompt");
    if (notice.text.includes("başka bir hesaba kayıtlı")) return t("phoneAlreadyRegistered");
    if (notice.text.includes("başka bir hesap tarafından kullanılıyor")) return t("phoneInUse");
    if (notice.text.includes("zaten kullanılmış")) return t("codeAlreadyUsed");
    if (notice.text.includes("süresi dolmuş") || notice.text.includes("geçersiz")) return t("errorVerify");
    if (notice.text.includes("Çok fazla")) return t("rateLimited");
    if (notice.text.includes("SMS gönderilemedi")) return t("smsSendFailed");
    if (notice.text.includes("Geçerli bir telefon")) return t("invalidPhone");
    if (notice.text.includes("yetkisi uyuşmuyor")) return t("unauthorizedOtp");
    return notice.text;
  }
  return "";
}

function PhoneLoginContent({
  claimInstitutionName,
}: {
  claimInstitutionName?: string | null;
}) {
  const t = useTranslations("auth");
  const r = useRouter();
  const params = useSearchParams();
  const claimDirectoryId = sanitizeClaimDirectoryId(params.get("claimDirectoryId"));
  const nextUrl = sanitizeInternalReturnUrl(params.get("next"));

  const [authMode, setAuthMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [notice, setNotice] = useState<AuthNotice>(null);
  const [canRegisterDirectly, setCanRegisterDirectly] = useState(false);
  const [canLoginDirectly, setCanLoginDirectly] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayMessage = resolveNotice(notice, t);

  async function request() {
    setNotice(null);
    setCanRegisterDirectly(false);
    setCanLoginDirectly(false);
    const x = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await x.json();
    if (!x.ok) {
      return setNotice({ type: "code", code: j.code || "SMS_SEND_FAILED", fallback: j.error });
    }
    setStep("code");
    if (j.devCode) {
      setNotice({ type: "key", key: "devCode", params: { code: j.devCode } });
    } else {
      setNotice({ type: "key", key: "codeSent" });
    }
  }

  async function verify(targetMode?: "login" | "register") {
    const activeMode = targetMode || authMode;
    setLoading(true);
    setNotice(null);
    setCanRegisterDirectly(false);
    setCanLoginDirectly(false);

    try {
      const x = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          mode: activeMode,
          name: activeMode === "register" ? (name.trim() || undefined) : undefined,
        }),
      });
      const j = await x.json();
      if (!x.ok) {
        if (j.code === "ACCOUNT_NOT_FOUND") {
          setCanRegisterDirectly(true);
        } else if (j.code === "PHONE_ALREADY_REGISTERED") {
          setCanLoginDirectly(true);
        }
        setLoading(false);
        return setNotice({ type: "code", code: j.code || "INVALID_OR_EXPIRED_CODE", fallback: j.error });
      }

      const userRole = String(j.user?.role || "PATIENT").toUpperCase();
      let destination = resolvePostAuthDestination({
        mode: activeMode,
        claimDirectoryId,
        next: nextUrl,
      });
      if (!claimDirectoryId && !nextUrl) {
        if (userRole === "DOCTOR") destination = "/doctor";
        else if (userRole === "ORGANIZATION") destination = "/business";
        else if (userRole === "ADMIN") destination = "/admin";
        else if (userRole === "AGENCY") destination = "/agency";
        else destination = "/profile";
      }
      window.location.href = destination;
    } catch {
      setNotice({ type: "key", key: "errorVerify" });
    }
    setLoading(false);
  }

  return (
    <div className="auth-card">
      {claimDirectoryId && (
        <div
          data-testid="auth-claim-context-banner"
          style={{
            marginBottom: "16px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e3a8a",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          <strong style={{ display: "block", color: "#0f172a", marginBottom: "4px" }}>
            {claimInstitutionName
              ? t("claimContextTitle", { name: claimInstitutionName })
              : t("claimContextGenericTitle")}
          </strong>
          {t("claimContextSubtitle")}
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "#f1f5f9", padding: "4px", borderRadius: "12px" }}>
        <button
          type="button"
          onClick={() => { setAuthMode("login"); setCanRegisterDirectly(false); setCanLoginDirectly(false); setNotice(null); }}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            background: authMode === "login" ? "#fff" : "transparent",
            color: authMode === "login" ? "#0f172a" : "#64748b",
            boxShadow: authMode === "login" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.2s"
          }}
        >
          {t("submitLogin")}
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode("register"); setCanRegisterDirectly(false); setCanLoginDirectly(false); setNotice(null); }}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            background: authMode === "register" ? "#fff" : "transparent",
            color: authMode === "register" ? "#0f172a" : "#64748b",
            boxShadow: authMode === "register" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.2s"
          }}
        >
          {t("submitRegister")}
        </button>
      </div>

      <span className="kicker">{authMode === "register" ? t("phoneRegister") : t("phoneLogin")}</span>
      <h1>{authMode === "register" ? t("registerTitle") : t("enterApp")}</h1>

      {authMode === "register" && step === "phone" && (
        <label>
          {t("nameLabel")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </label>
      )}

      <label>
        {t("phoneLabel")}
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="555 123 45 67"
          disabled={step === "code"}
        />
      </label>

      {step === "code" && (
        <label>
          {t("codeLabel")}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
          />
        </label>
      )}

      {displayMessage && <div className="inline-message">{displayMessage}</div>}

      {/* Smart Fallback Recovery Buttons */}
      {canRegisterDirectly && step === "code" && (
        <button
          type="button"
          className="primary full"
          style={{ marginBottom: "12px", background: "#059669" }}
          disabled={loading}
          onClick={() => verify("register")}
        >
          {t("registerWithThisPhone")}
        </button>
      )}

      {canLoginDirectly && step === "code" && (
        <button
          type="button"
          className="primary full"
          style={{ marginBottom: "12px", background: "#0ea5e9" }}
          disabled={loading}
          onClick={() => verify("login")}
        >
          {t("submitLogin")}
        </button>
      )}

      <button
        className="primary full"
        disabled={loading}
        onClick={step === "phone" ? request : () => verify()}
      >
        {loading ? t("loading") : step === "phone" ? t("sendCode") : authMode === "register" ? t("submitRegister") : t("submitLogin")}
      </button>

      {step === "code" && (
        <button
          className="secondary full auth-secondary"
          onClick={() => { setStep("phone"); setCanRegisterDirectly(false); setCanLoginDirectly(false); setNotice(null); }}
        >
          {t("changePhone")}
        </button>
      )}
    </div>
  );
}