import AuthForm from "@/components/auth-form"; 
import Link from "next/link";

export default function Login(){
  return (
    <div className="page auth-page">
      <AuthForm mode="login"/>
      <a className="secondary full auth-secondary" href="/phone-login">Telefonla giriş</a>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/pro/login" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>Sağlık Profesyoneli / Kurum Girişi</Link>
      </div>
    </div>
  )
}
