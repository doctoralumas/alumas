"use client";
import { useState } from "react";
import { UserCircle, EnvelopeSimple, Lock, Key, CheckCircle, FloppyDisk, PaperPlaneTilt } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

type EditorFeedback = {
  type: "success" | "error" | "";
  key?: string;
  code?: string;
  fallback?: string;
  suffix?: string;
} | null;

function resolveEditorMessage(
  feedback: EditorFeedback,
  t: (key: string, params?: any) => string
): string {
  if (!feedback || !feedback.type) return "";
  if (feedback.key) {
    try {
      return `${t(feedback.key)}${feedback.suffix || ""}`;
    } catch {
      return feedback.key;
    }
  }
  if (feedback.code) {
    const codeMap: Record<string, string> = {
      INVALID_EMAIL: "invalidEmail",
      INVALID_CODE: "enterEmailCode",
      EMAIL_IN_USE: "emailAlreadyUsed",
      CURRENT_PASSWORD_REQUIRED: "currentPasswordWrong",
      INVALID_OR_EXPIRED_CODE: "codeExpiredOrInvalid",
      CODE_ALREADY_USED: "codeAlreadyUsed",
      RATE_LIMITED: "rateLimited",
      EMAIL_SEND_FAILED: "emailSendFailed",
      AUTH_REQUIRED: "errorMsg",
      PASSWORD_REQUIRED_FOR_EMAIL: "passwordRequiredForEmail",
      PASSWORD_POLICY_VIOLATION: "passwordPolicyViolation",
      EMAIL_VERIFICATION_REQUIRED: "emailVerificationRequired",
    };
    const key = codeMap[feedback.code];
    if (key) {
      try {
        return t(key);
      } catch {}
    }
    return feedback.fallback || t("errorMsg");
  }
  if (feedback.fallback) {
    if (feedback.fallback.includes("geçerli bir e-posta adresi girin")) return t("invalidEmail");
    if (feedback.fallback.includes("6 haneli")) return t("enterEmailCode");
    if (feedback.fallback.includes("zaten başka bir hesaba")) return t("emailAlreadyUsed");
    if (feedback.fallback.includes("Mevcut şifreniz")) return t("currentPasswordWrong");
    if (feedback.fallback.includes("süresi dolmuş") || feedback.fallback.includes("geçersiz")) return t("codeExpiredOrInvalid");
    if (feedback.fallback.includes("kullanılmış")) return t("codeAlreadyUsed");
    if (feedback.fallback.includes("Çok fazla")) return t("rateLimited");
    if (feedback.fallback.includes("E-posta gönderilemedi")) return t("emailSendFailed");
    if (feedback.fallback.includes("şifre belirleyin")) return t("passwordRequiredForEmail");
    if (feedback.fallback.includes("en az 6 karakter")) return t("passwordPolicyViolation");
    if (feedback.fallback.includes("geçerli bir e-posta adresini doğrulayınız")) return t("emailVerificationRequired");
    return feedback.fallback;
  }
  return "";
}

export default function PersonalInfoEditor({
  initialName,
  initialEmail,
  initialHasPassword = false,
}: {
  initialName: string;
  initialEmail: string;
  initialHasPassword?: boolean;
}) {
  const t = useTranslations("profile.personalInfo");
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<EditorFeedback>(null);

  const displayEmail = email.includes("@alumas.local") ? "" : email;
  const [editEmail, setEditEmail] = useState(displayEmail);
  const isEmailChanged = editEmail.trim().toLowerCase() !== displayEmail.trim().toLowerCase();
  const requiresCurrentPassword = hasPassword && (Boolean(password) || (isEmailChanged && Boolean(editEmail)));

  const displayFeedback = resolveEditorMessage(feedback, t);

  async function requestCode() {
    if (!editEmail || !editEmail.includes("@")) {
      return setFeedback({ type: "error", key: "invalidEmail" });
    }
    setSendingCode(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail, currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodeRequested(true);
        const codeNote = data.devCode ? ` (Test Kodu: ${data.devCode})` : "";
        setFeedback({ type: "success", key: "emailCodeSent", suffix: codeNote });
      } else {
        setFeedback({ type: "error", code: data.code, fallback: data.error });
      }
    } catch {
      setFeedback({ type: "error", key: "errorMsg" });
    }
    setSendingCode(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      // Flow 1: Linking or updating email address requires server-verified email OTP
      if (isEmailChanged && editEmail) {
        if (!emailCode || emailCode.length < 6) {
          setLoading(false);
          return setFeedback({ type: "error", key: "enterEmailCode" });
        }

        // When linking a real email to a passwordless account, require password so user can immediately log in with email
        if (!hasPassword && (!password || password.length < 6)) {
          setLoading(false);
          return setFeedback({ type: "error", key: "passwordRequiredForEmail" });
        }

        const res = await fetch("/api/auth/email/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: editEmail,
            code: emailCode,
            password: password || undefined,
            currentPassword: currentPassword || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          // If name was also modified, update name via PATCH
          if (name !== initialName) {
            await fetch("/api/auth/me", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
          }
          setEmail(data.user.email);
          if (typeof data.user?.hasPassword === "boolean") {
            setHasPassword(data.user.hasPassword);
          }
          setCodeRequested(false);
          setEmailCode("");
          setPassword("");
          setCurrentPassword("");
          setFeedback({ type: "success", key: "successMsg" });
        } else {
          setFeedback({ type: "error", code: data.code, fallback: data.error });
        }
      } else {
        // Flow 2: Standard personal info update (Name or Password change with reauth)
        if (!hasPassword && !displayEmail && password) {
          setLoading(false);
          return setFeedback({ type: "error", key: "emailVerificationRequired" });
        }

        const payload: { name: string; password?: string; currentPassword?: string } = { name };
        if (password) {
          payload.password = password;
          payload.currentPassword = currentPassword;
        }

        const res = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          if (typeof data.user?.hasPassword === "boolean") {
            setHasPassword(data.user.hasPassword);
          }
          setFeedback({ type: "success", key: "successMsg" });
          setPassword("");
          setCurrentPassword("");
        } else {
          setFeedback({ type: "error", code: data.code, fallback: data.error });
        }
      }
    } catch {
      setFeedback({ type: "error", key: "errorMsg" });
    }
    setLoading(false);
  }

  return (
    <section style={{ background: "#fff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", color: "#0f172a" }}>
        <UserCircle size={24} weight="duotone" color="#0ea5e9" />
        <h2 style={{ margin: 0, fontSize: "20px" }}>{t("title")}</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
        {t("desc")}
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{t("nameLabel")}</label>
          <div style={{ position: "relative" }}>
            <UserCircle size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder={t("namePlaceholder")}
              style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} 
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{t("emailLabel")}</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <EnvelopeSimple size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="email" 
                value={editEmail} 
                onChange={e => {
                  setEditEmail(e.target.value);
                  setCodeRequested(false);
                }} 
                placeholder={t("emailPlaceholder")}
                style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} 
              />
            </div>
            {isEmailChanged && editEmail && (
              <button
                type="button"
                onClick={requestCode}
                disabled={sendingCode}
                style={{ padding: "0 16px", borderRadius: "10px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", fontWeight: 600, fontSize: "13px", cursor: sendingCode ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <PaperPlaneTilt size={16} />
                {sendingCode ? t("sendingEmailCode") : t("sendEmailCode")}
              </button>
            )}
          </div>
        </div>

        {isEmailChanged && codeRequested && (
          <div style={{ background: "#f0f9ff", padding: "16px", borderRadius: "12px", border: "1px solid #bae6fd" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0369a1", marginBottom: "6px" }}>{t("emailCodeLabel")}</label>
            <div style={{ position: "relative" }}>
              <Key size={18} color="#0284c7" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                maxLength={6}
                value={emailCode} 
                onChange={e => setEmailCode(e.target.value.trim())} 
                placeholder={t("emailCodePlaceholder")}
                style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #7dd3fc", outline: "none", fontSize: "16px", letterSpacing: "2px", fontWeight: 700, fontFamily: "inherit", background: "#fff" }} 
              />
            </div>
          </div>
        )}

        {requiresCurrentPassword && (
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{t("currentPasswordLabel")}</label>
            <div style={{ position: "relative" }}>
              <Key size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                placeholder={t("currentPasswordPlaceholder")}
                autoComplete="current-password"
                style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} 
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>{t("passwordLabel")}</label>
          <div style={{ position: "relative" }}>
            <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontFamily: "inherit" }} 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", borderRadius: "10px", background: "#0ea5e9", color: "#fff", border: "none", fontWeight: 600, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s", marginTop: "8px" }}
        >
          {feedback?.type === "success" ? <CheckCircle size={20} weight="bold" /> : <FloppyDisk size={20} weight="bold" />}
          {loading ? t("saving") : isEmailChanged ? t("verifyAndSave") : feedback?.type === "success" ? t("saved") : t("saveButton")}
        </button>

        {displayFeedback && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: feedback?.type === "success" ? "#ecfdf5" : "#fef2f2", color: feedback?.type === "success" ? "#047857" : "#b91c1c", fontSize: "14px", fontWeight: 500, textAlign: "center", marginTop: "4px" }}>
            {displayFeedback}
          </div>
        )}
      </form>
    </section>
  );
}
