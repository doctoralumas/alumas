"use client";
import { useState } from "react";
import { UserCircle, EnvelopeSimple, Lock, Key, CheckCircle, FloppyDisk, PaperPlaneTilt } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

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
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const displayEmail = email.includes("@alumas.local") ? "" : email;
  const [editEmail, setEditEmail] = useState(displayEmail);
  const isEmailChanged = editEmail.trim().toLowerCase() !== displayEmail.trim().toLowerCase();

  async function requestCode() {
    if (!editEmail || !editEmail.includes("@")) {
      return setMsg({ type: "error", text: "Lütfen geçerli bir e-posta adresi girin." });
    }
    setSendingCode(true);
    setMsg({ type: "", text: "" });

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
        setMsg({ type: "success", text: `${t("emailCodeSent")}${codeNote}` });
      } else {
        setMsg({ type: "error", text: data.error || t("errorMsg") });
      }
    } catch {
      setMsg({ type: "error", text: t("errorMsg") });
    }
    setSendingCode(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // Flow 1: Linking or updating email address requires server-verified email OTP
      if (isEmailChanged && editEmail) {
        if (!emailCode || emailCode.length < 6) {
          setLoading(false);
          return setMsg({ type: "error", text: "Lütfen e-postanıza gönderilen 6 haneli doğrulama kodunu girin." });
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
          setCodeRequested(false);
          setEmailCode("");
          setPassword("");
          setCurrentPassword("");
          setMsg({ type: "success", text: t("successMsg") });
        } else {
          setMsg({ type: "error", text: data.error || t("errorMsg") });
        }
      } else {
        // Flow 2: Standard personal info update (Name or Password change with reauth)
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
          setMsg({ type: "success", text: t("successMsg") });
          setPassword("");
          setCurrentPassword("");
        } else {
          setMsg({ type: "error", text: data.error || t("errorMsg") });
        }
      }
    } catch {
      setMsg({ type: "error", text: t("errorMsg") });
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

        {(password || initialHasPassword) && (
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
          {msg.type === "success" ? <CheckCircle size={20} weight="bold" /> : <FloppyDisk size={20} weight="bold" />}
          {loading ? t("saving") : isEmailChanged ? t("verifyAndSave") : msg.type === "success" ? t("saved") : t("saveButton")}
        </button>

        {msg.text && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: msg.type === "success" ? "#ecfdf5" : "#fef2f2", color: msg.type === "success" ? "#047857" : "#b91c1c", fontSize: "14px", fontWeight: 500, textAlign: "center", marginTop: "4px" }}>
            {msg.text}
          </div>
        )}
      </form>
    </section>
  );
}
