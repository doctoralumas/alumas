import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import BusinessApplicationForm from "@/components/business-application-form";
import { getTranslations } from "next-intl/server";

export default async function Apply({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  if (!await currentUser()) redirect("/login");
  const { type } = await searchParams;
  const t = await getTranslations("professional.businessApply");
  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <BusinessApplicationForm initialType={type} />
      </section>
    </div>
  );
}
