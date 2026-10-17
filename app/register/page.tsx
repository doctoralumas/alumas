import AuthForm from "@/components/auth-form"; 
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Register(){
  const t = await getTranslations("auth");

  return (
    <div className="page auth-page">
      <AuthForm mode="register"/>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/pro/register" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>{t("proRegisterLink")}</Link>
      </div>
    </div>
  )
}
