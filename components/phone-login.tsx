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

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [msg, setMsg] = useState("");

  async function request() {
    setMsg("");
    const x = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await x.json();
    if (!x.ok) return setMsg(j.error || t("errorSend"));
    setStep("code");
    setMsg(j.devCode ? t("devCode", { code: j.devCode }) : t("codeSent"));
  }

  async function verify() {
    const x = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, login: true }),
    });
    const j = await x.json();
    if (!x.ok) return setMsg(j.error || t("errorVerify"));
    const userRole = String(j.user?.role || "PATIENT").toUpperCase();
    let destination = resolvePostAuthDestination({
      mode: "login",
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
      <span className="kicker">{t("phoneLogin")}</span>
      <h1>{t("enterApp")}</h1>
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
      {msg && <div className="inline-message">{msg}</div>}
      <button
        className="primary full"
        onClick={step === "phone" ? request : verify}
      >
        {step === "phone" ? t("sendCode") : t("submitLogin")}
      </button>
      {step === "code" && (
        <button
          className="secondary full auth-secondary"
          onClick={() => setStep("phone")}
        >
          {t("changePhone")}
        </button>
      )}
    </div>
  );
}