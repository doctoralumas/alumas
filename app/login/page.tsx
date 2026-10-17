import AuthForm from "@/components/auth-form"; 
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Login(){
  const t = await getTranslations("auth");

  return (
    <div className="page auth-page">
      <AuthForm mode="login"/>
      <a className="secondary full auth-secondary" href="/phone-login">{t("phoneLogin")}</a>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/pro/login" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>{t("proLoginLink")}</Link>
      </div>
    </div>
  )
}
