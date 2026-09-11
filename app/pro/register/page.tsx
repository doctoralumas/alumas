import AuthForm from "@/components/auth-form";
import Link from "next/link";

export default function ProRegister() {
  return (
    <div className="page auth-page">
      <AuthForm mode="register" isProfessional={true} />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/register" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>Hasta mısınız? Bireysel kayıt olun</Link>
      </div>
    </div>
  )
}

