import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import BusinessDashboard from "@/components/business-dashboard";
import { getTranslations } from "next-intl/server";

export default async function Business() {
  if (!(await currentUser())) redirect("/login");
  const t = await getTranslations("professional.businessDashboard");
  return (
    <div className="page workspace">
      <div className="page-title row between">
        <div>
          <span className="kicker">{t("kicker")}</span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <a className="primary" href="/business/apply">
          {t("newOrg")}
        </a>
      </div>
      <BusinessDashboard />
    </div>
  );
}
