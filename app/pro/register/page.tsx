import AuthForm from "@/components/auth-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ProRegister() {
  const t = await getTranslations("auth");

  return (
    <div className="page auth-page">
      <AuthForm mode="register" isProfessional={true} />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/register" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>{t("patientRegisterLink")}</Link>
      </div>
    </div>
  )
}

