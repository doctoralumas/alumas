"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  buildAuthHref,
  resolvePostAuthDestination,
  sanitizeClaimDirectoryId,
  sanitizeInternalReturnUrl,
} from "@/lib/claim-onboarding";

export default function AuthForm({
  mode,
  isProfessional = false,
  claimInstitutionName = null,
}: {
  mode: "login" | "register";
  isProfessional?: boolean;
  claimInstitutionName?: string | null;
}) {
  const tCommon = useTranslations("common");
  return (
    <Suspense fallback={<div className="auth-card">{tCommon("loading")}</div>}>
      <AuthFormContent
        mode={mode}
        isProfessional={isProfessional}
        claimInstitutionName={claimInstitutionName}
      />
    </Suspense>
  );
}

function AuthFormContent({
  mode,
  isProfessional,
  claimInstitutionName,
}: {
  mode: "login" | "register";
  isProfessional: boolean;
  claimInstitutionName?: string | null;
}) {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const claimDirectoryId = sanitizeClaimDirectoryId(params.get("claimDirectoryId"));
  const nextUrl = sanitizeInternalReturnUrl(params.get("next"));
  const requested = String(
    params.get("type") || (claimDirectoryId ? "organization" : "patient")
  ).toLowerCase();

  const initialType = isProfessional
    ? requested === "organization"
      ? "ORGANIZATION"
      : requested === "agency"
      ? "AGENCY"
      : requested === "imaging_center"
      ? "IMAGING_CENTER"
      : requested === "laboratory"
      ? "LABORATORY"
      : claimDirectoryId
      ? "ORGANIZATION"
      : "DOCTOR"
    : "PATIENT";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [accountType, setAccountType] = useState(initialType);

  const proOptions = [
    { id: "DOCTOR", label: t("doctorType"), sub: t("doctorSub"), icon: "👨‍⚕️" },
    { id: "ORGANIZATION", label: t("hospitalType"), sub: t("hospitalSub"), icon: "🏥" },
    { id: "AGENCY", label: t("agencyType"), sub: t("agencySub"), icon: "✈️" },
    { id: "IMAGING_CENTER", label: t("imagingType"), sub: t("imagingSub"), icon: "🩻" },
    { id: "LABORATORY", label: t("labType"), sub: t("labSub"), icon: "🧪" },
  ];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (!isProfessional && mode === "register") {
      data.accountType = "PATIENT";
    } else if (isProfessional && mode === "register") {
      data.accountType = accountType;
    }

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      let msg = typeof json.error === "string" ? json.error : json.error?.message || t("authFailed");
      if (json.details && Array.isArray(json.details)) {
        msg += " (" + json.details.map((d: any) => `${d.path}: ${d.message}`).join(", ") + ")";
      }
      setError(msg);
      return;
    }

    const destination = resolvePostAuthDestination({
      mode,
      accountType: String((data as any).accountType || "PATIENT"),
      claimDirectoryId,
      next: nextUrl,
    });
    window.location.href = destination;
  }

  const switchAuthHref =
    mode === "login"
      ? buildAuthHref(isProfessional ? "/pro/register" : "/register", {
          claimDirectoryId,
          next: nextUrl,
          type: claimDirectoryId ? "organization" : params.get("type"),
        })
      : buildAuthHref(isProfessional ? "/pro/login" : "/login", {
          claimDirectoryId,
          next: nextUrl,
          type: params.get("type"),
        });

  return (
    <form
      className="auth-card premium-auth-card"
      onSubmit={submit}
      style={{
        padding: "32px",
        borderRadius: "28px",
        border: "none",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08), 0 0 20px rgba(0,0,0,0.02)",
        background: "#fff",
        width: "100%",
        maxWidth: isProfessional && mode === "register" ? "540px" : "440px",
      }}
    >
      {claimDirectoryId && (
        <div
          data-testid="auth-claim-context-banner"
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e3a8a",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#1d4ed8",
              marginBottom: "4px",
            }}
          >
            {t("claimContextKicker")}
          </span>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
            {claimInstitutionName
              ? t("claimContextTitle", { name: claimInstitutionName })
              : t("claimContextGenericTitle")}
          </div>
          <div>{t("claimContextSubtitle")}</div>
          {mode === "register" && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#1e40af" }}>
              {t("claimExistingAccountHint")}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "#3b82f6",
            letterSpacing: "1px",
            textTransform: "uppercase",
            background: "#eff6ff",
            padding: "6px 12px",
            borderRadius: "100px",
          }}
        >
          {isProfessional ? "Alumas Pro" : "Alumas"}
        </span>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#0f172a",
            margin: "14px 0 6px 0",
            letterSpacing: "-0.5px",
          }}
        >
          {mode === "login"
            ? t("loginTitle")
            : isProfessional
            ? t("proTitle")
            : t("registerTitle")}
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
        </p>
      </div>

      {mode === "register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              margin: 0,
            }}
          >
            {isProfessional ? t("proNameLabel") : t("nameLabel")}
            <input
              name="name"
              required
              placeholder={t("namePlaceholder")}
              data-testid="register-name"
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </label>

          {isProfessional && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                {t("accountTypeLabel")}
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "8px",
                }}
              >
                {proOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setAccountType(opt.id)}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border: "2px solid",
                      borderColor: accountType === opt.id ? "#3b82f6" : "#e2e8f0",
                      background: accountType === opt.id ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "2px" }}>{opt.icon}</div>
                    <strong
                      style={{
                        fontSize: "13px",
                        color: accountType === opt.id ? "#1d4ed8" : "#334155",
                      }}
                    >
                      {opt.label}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        color: accountType === opt.id ? "#3b82f6" : "#64748b",
                      }}
                    >
                      {opt.sub}
                    </span>
                  </div>
                ))}
              </div>
              <input type="hidden" name="accountType" value={accountType} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            margin: 0,
          }}
        >
          {t("emailLabel")}
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            data-testid="auth-email"
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            margin: 0,
          }}
        >
          {t("passwordLabel")}
          <input
            name="password"
            type="password"
            minLength={mode === "login" ? 1 : 10}
            required
            placeholder={t("passwordPlaceholder")}
            data-testid="auth-password"
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </label>
      </div>

      {mode === "register" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "16px",
            marginBottom: "8px",
          }}
        >
          <label
            className="consent-check"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#64748b",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            <input
              name="privacyNotice"
              type="checkbox"
              required
              data-testid="privacy-notice"
              style={{ marginTop: "2px", width: "14px", height: "14px", accentColor: "#3b82f6" }}
            />
            <span>
              <Link href="/privacy" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                {t("privacyNoticePrefix")}
              </Link>{" "}
              {t("privacyNoticeMid")}{" "}
              <Link href="/terms" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
                {t("termsLink")}
              </Link>{" "}
              {t("termsSuffix")}
            </span>
          </label>

          <label
            className="consent-check"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#64748b",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            <input
              name="marketingConsent"
              type="checkbox"
              style={{ marginTop: "2px", width: "14px", height: "14px", accentColor: "#3b82f6" }}
            />
            <span>{t("marketingConsent")}</span>
          </label>
        </div>
      )}

      {error && (
        <div
          className="form-error"
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            fontSize: "13px",
            fontWeight: 500,
            margin: "14px 0",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <button
        className="primary full"
        disabled={loading}
        data-testid="auth-submit"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "100px",
          fontSize: "15px",
          fontWeight: 700,
          marginTop: "20px",
          transition: "all 0.2s",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? t("loading") : mode === "login" ? t("submitLogin") : t("submitRegister")}
      </button>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
        {mode === "login" ? (
          <>
            {t("dontHaveAccount")}{" "}
            <Link
              href={switchAuthHref}
              data-testid="auth-switch-mode-link"
              style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}
            >
              {t("registerLink")}
            </Link>
          </>
        ) : (
          <>
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={switchAuthHref}
              data-testid="auth-switch-mode-link"
              style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}
            >
              {t("loginLink")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
