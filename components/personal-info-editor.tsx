"use client";
import { useState } from "react";
import { UserCircle, EnvelopeSimple, CheckCircle, FloppyDisk } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

export default function PersonalInfoEditor({ initialName, initialEmail }: { initialName: string, initialEmail: string }) {
  const t = useTranslations("profile.personalInfo");
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const displayEmail = email.includes("@alumas.local") ? "" : email;
  const [editEmail, setEditEmail] = useState(displayEmail);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: editEmail })
    });

    if (res.ok) {
      setMsg({ type: "success", text: t("successMsg") });
      const data = await res.json();
      setEmail(data.user.email);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ type: "error", text: data.error || t("errorMsg") });
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
          <div style={{ position: "relative" }}>
            <EnvelopeSimple size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="email" 
              value={editEmail} 
              onChange={e => setEditEmail(e.target.value)} 
              placeholder={t("emailPlaceholder")}
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
          {loading ? t("saving") : msg.type === "success" ? t("saved") : t("saveButton")}
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
