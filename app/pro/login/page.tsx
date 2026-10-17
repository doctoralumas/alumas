import AuthForm from "@/components/auth-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ProLogin() {
  const t = await getTranslations("auth");

  return (
    <div className="page auth-page">
      <AuthForm mode="login" isProfessional={true} />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/login" style={{ fontSize: "0.9rem", color: "var(--brand)" }}>{t("patientLoginLink")}</Link>
      </div>
    </div>
  )
}

