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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // Hastalar login olduğunda pro formunda iseler patient olarak gitmeli, prolar ise type'a göre
    // Fakat login apisi aynı. Sadece kayıt esnasında form gizli bir accountType göndermeli eğer isProfessional false ise.
    if (!isProfessional && mode === "register") {
      data.accountType = "PATIENT";
    }

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : (json.error?.message || "İşlem başarısız"));
      return;
    }

    if (mode === "register") {
      const kind = String((data as any).accountType || "PATIENT");
      if (kind === "DOCTOR") window.location.href = "/onboarding/doctor";
      else if (kind === "ORGANIZATION") window.location.href = "/business/apply";
      else if (kind === "AGENCY") window.location.href = "/agency/apply";
      else if (kind === "PARTNER") window.location.href = "/partner/apply";
      else window.location.href = "/profile";
    } else {
      window.location.href = "/profile";
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="kicker">{isProfessional ? "Alumas İş Ortağı Ağı" : "Alumas hesabı"}</span>
      <h1>{mode === "login" ? "Tekrar hoş geldin" : (isProfessional ? "Profesyonel ağa katılın" : "Sağlığını tek yerde yönet")}</h1>

      {mode === "register" && (
        <>
          <label>
            {isProfessional ? "Ad Soyad / Yetkili Kişi" : "Ad Soyad"}
            <input name="name" required placeholder="Ad Soyad" data-testid="register-name" />
          </label>

          {isProfessional && (
            <label>
              Hesap türü
              <select name="accountType" defaultValue={initialType}>
                <option value="DOCTOR">Doktor / sağlık profesyoneli</option>
                <option value="ORGANIZATION">Hastane / klinik / eczane</option>
                <option value="AGENCY">Sağlık turizmi acentesi</option>
                <option value="PARTNER">Çözüm Ortağı / Aracı Kurum</option>
              </select>
            </label>
          )}
        </>
      )}

      <label>
        E-posta
        <input name="email" type="email" required placeholder="ornek@email.com" data-testid="auth-email" />
      </label>

      <label>
        Parola
        <input name="password" type="password" minLength={mode === "login" ? 1 : 10} required placeholder="En az 10 karakter" data-testid="auth-password" />
      </label>

      {mode === "register" && (
        <>
          <label className="consent-check">
            <input name="privacyNotice" type="checkbox" required data-testid="privacy-notice" />
            <span>
              <Link href="/privacy">KVKK Aydınlatma Metnini</Link> okudum; <Link href="/terms">Kullanım Koşullarını</Link> kabul ediyorum.
            </span>
          </label>

          <label className="consent-check">
            <input name="marketingConsent" type="checkbox" />
            <span>Kampanya/ticari elektronik ileti izni veriyorum (isteğe bağlı).</span>
          </label>
        </>
      )}

      {error && <div className="form-error">{error}</div>}

      <button className="primary full" disabled={loading} data-testid="auth-submit">
        {loading ? "İşleniyor..." : mode === "login" ? "Giriş yap" : "Hesap oluştur"}
      </button>

      <p>
        {mode === "login" ? (
          <>Hesabın yok mu? <Link href={isProfessional ? "/pro/register" : "/register"}>Kayıt ol</Link></>
        ) : (
          <>Zaten hesabın var mı? <Link href={isProfessional ? "/pro/login" : "/login"}>Giriş yap</Link></>
        )}
      </p>
    </form>
  );
}
