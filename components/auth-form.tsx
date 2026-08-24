"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = String(params.get("type") || "patient").toLowerCase();
  const initialType = requested === "doctor" ? "DOCTOR" : requested === "organization" ? "ORGANIZATION" : requested === "agency" ? "AGENCY" : "PATIENT";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
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
      if (kind === "DOCTOR") router.push("/onboarding/doctor");
      else if (kind === "ORGANIZATION") router.push("/business/apply");
      else if (kind === "AGENCY") router.push("/agency/apply");
      else router.push("/profile");
    } else {
      router.push("/profile");
    }
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="kicker">Alumas hesabı</span>
      <h1>{mode === "login" ? "Tekrar hoş geldin" : "Sağlığını tek yerde yönet"}</h1>

      {mode === "register" && (
        <>
          <label>
            Ad soyad
            <input name="name" required placeholder="Ad Soyad" data-testid="register-name" />
          </label>

          <label>
            Hesap türü
            <select name="accountType" defaultValue={initialType}>
              <option value="PATIENT">Hasta / bireysel kullanıcı</option>
              <option value="DOCTOR">Doktor / sağlık profesyoneli</option>
              <option value="ORGANIZATION">Hastane / klinik / eczane</option>
              <option value="AGENCY">Sağlık turizmi acentesi</option>
            </select>
          </label>
        </>
      )}

      <label>
        E-posta
        <input name="email" type="email" required placeholder="ornek@email.com" data-testid="auth-email" />
      </label>

      <label>
        Parola
        <input name="password" type="password" minLength={10} required placeholder="En az 10 karakter" data-testid="auth-password" />
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
          <>Hesabın yok mu? <Link href="/register">Kayıt ol</Link></>
        ) : (
          <>Zaten hesabın var mı? <Link href="/login">Giriş yap</Link></>
        )}
      </p>
    </form>
  );
}
