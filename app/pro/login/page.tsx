import AuthForm from "@/components/auth-form";
import Link from "next/link";

export default function ProLogin() {
  return (
    <div className="page auth-page">
      <AuthForm mode="login" isProfessional={true} />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/login" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>Hasta mısınız? Bireysel giriş yapın</Link>
      </div>
    </div>
  )
}

