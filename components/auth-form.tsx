"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode, isProfessional = false }: { mode: "login" | "register", isProfessional?: boolean }) {
  return (
    <Suspense fallback={<div className="auth-card">Yükleniyor...</div>}>
      <AuthFormContent mode={mode} isProfessional={isProfessional} />
    </Suspense>
  );
}

function AuthFormContent({ mode, isProfessional }: { mode: "login" | "register", isProfessional: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = String(params.get("type") || "patient").toLowerCase();
  const initialType = isProfessional 
    ? (requested === "organization" ? "ORGANIZATION" : requested === "agency" ? "AGENCY" : "DOCTOR")
    : "PATIENT";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [accountType, setAccountType] = useState(initialType);
  
  const proOptions = [
    { id: "DOCTOR", label: "Doktor / Uzman", sub: "Diyetisyen, Fzt. vb.", icon: "👨‍⚕️" },
    { id: "ORGANIZATION", label: "Hastane / Klinik", sub: "Eczane, lab", icon: "🏥" },
    { id: "AGENCY", label: "Sağlık Turizmi", sub: "Acente & Koordinasyon", icon: "✈️" },
    { id: "IMAGING_CENTER", label: "Görüntüleme", sub: "MR, Röntgen vb.", icon: "🩻" },
    { id: "PARTNER", label: "Çözüm Ortağı", sub: "Aracı Kurum", icon: "🤝" }
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
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      let msg = typeof json.error === "string" ? json.error : (json.error?.message || "İşlem başarısız");
      if (json.details && Array.isArray(json.details)) {
        msg += " (" + json.details.map((d:any)=>`${d.path}: ${d.message}`).join(", ") + ")";
      }
      setError(msg);
      return;
    }

    if (mode === "register") {
      const kind = String((data as any).accountType || "PATIENT");
      if (kind === "DOCTOR") window.location.href = "/onboarding/doctor";
      else if (kind === "ORGANIZATION" || kind === "IMAGING_CENTER") window.location.href = "/business/apply";
      else if (kind === "AGENCY") window.location.href = "/agency/apply";
      else if (kind === "PARTNER") window.location.href = "/partner/apply";
      else window.location.href = "/profile";
    } else {
      window.location.href = "/profile";
    }
  }

  return (
    <form className="auth-card premium-auth-card" onSubmit={submit} style={{ padding: "32px", borderRadius: "28px", border: "none", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08), 0 0 20px rgba(0,0,0,0.02)", background: "#fff", width: "100%", maxWidth: isProfessional && mode === "register" ? "540px" : "400px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#3b82f6", letterSpacing: "1px", textTransform: "uppercase", background: "#eff6ff", padding: "6px 12px", borderRadius: "100px" }}>
          {isProfessional ? "Alumas İş Ortağı Ağı" : "Alumas Hesabı"}
        </span>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "14px 0 6px 0", letterSpacing: "-0.5px" }}>
          {mode === "login" ? "Tekrar hoş geldin" : (isProfessional ? "Profesyonel ağa katılın" : "Sağlığını tek yerde yönet")}
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          {mode === "login" ? "Bilgilerini girerek platforma giriş yap." : "Hızlıca hesabını oluştur ve hemen başla."}
        </p>
      </div>

      {mode === "register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
            {isProfessional ? "Ad Soyad / Yetkili Kişi" : "Ad Soyad"}
            <input name="name" required placeholder="Ad Soyad" data-testid="register-name" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none", transition: "all 0.2s" }} onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
          </label>

          {isProfessional && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>Hesap Türü</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                {proOptions.map(opt => (
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
                      gap: "2px"
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "2px" }}>{opt.icon}</div>
                    <strong style={{ fontSize: "13px", color: accountType === opt.id ? "#1d4ed8" : "#334155" }}>{opt.label}</strong>
                    <span style={{ fontSize: "11px", color: accountType === opt.id ? "#3b82f6" : "#64748b" }}>{opt.sub}</span>
                  </div>
                ))}
              </div>
              <input type="hidden" name="accountType" value={accountType} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
          E-posta
          <input name="email" type="email" required placeholder="ornek@email.com" data-testid="auth-email" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none", transition: "all 0.2s" }} onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
          Parola
          <input name="password" type="password" minLength={mode === "login" ? 1 : 10} required placeholder="En az 10 karakter" data-testid="auth-password" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", outline: "none", transition: "all 0.2s" }} onFocus={e => e.target.style.borderColor = "#3b82f6"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
        </label>
      </div>

      {mode === "register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", marginBottom: "8px" }}>
          <label className="consent-check" style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
            <input name="privacyNotice" type="checkbox" required data-testid="privacy-notice" style={{ marginTop: "2px", width: "14px", height: "14px", accentColor: "#3b82f6" }} />
            <span>
              <Link href="/privacy" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>KVKK Aydınlatma Metnini</Link> okudum; <Link href="/terms" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Kullanım Koşullarını</Link> kabul ediyorum.
            </span>
          </label>

          <label className="consent-check" style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
            <input name="marketingConsent" type="checkbox" style={{ marginTop: "2px", width: "14px", height: "14px", accentColor: "#3b82f6" }} />
            <span>Kampanya ve duyurular için elektronik ileti izni veriyorum.</span>
          </label>
        </div>
      )}

      {error && <div className="form-error" style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "12px", border: "1px solid #fecaca", fontSize: "13px", fontWeight: 500, margin: "14px 0", textAlign: "center" }}>{error}</div>}

      <button className="primary full" disabled={loading} data-testid="auth-submit" style={{ width: "100%", padding: "14px", borderRadius: "100px", fontSize: "15px", fontWeight: 700, marginTop: "20px", transition: "all 0.2s", opacity: loading ? 0.7 : 1 }}>
        {loading ? "İşleniyor..." : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
      </button>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
        {mode === "login" ? (
          <>Hesabın yok mu? <Link href={isProfessional ? "/pro/register" : "/register"} style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}>Kayıt ol</Link></>
        ) : (
          <>Zaten hesabın var mı? <Link href={isProfessional ? "/pro/login" : "/login"} style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}>Giriş yap</Link></>
        )}
      </p>
    </form>
  );
}
