import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import DoctorOnboardingForm from "@/components/doctor-onboarding-form";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.doctorProfile) redirect("/doctor");
  const t = await getTranslations("professional.onboarding");
  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <DoctorOnboardingForm />
      </section>
    </div>
  );
}