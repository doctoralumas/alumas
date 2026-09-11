import AuthForm from "@/components/auth-form"; 
import Link from "next/link";

export default function Register(){
  return (
    <div className="page auth-page">
      <AuthForm mode="register"/>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/pro/register" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>Sağlık Profesyoneli veya Kurum musunuz?</Link>
      </div>
    </div>
  )
}
