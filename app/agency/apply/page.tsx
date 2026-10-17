import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import AgencyApplicationForm from "@/components/agency-application-form";

export default async function Page() {
  if (!(await currentUser())) redirect("/login");
  const t = await getTranslations("professional.agencyApply");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <AgencyApplicationForm />
      </section>
    </div>
  );
}