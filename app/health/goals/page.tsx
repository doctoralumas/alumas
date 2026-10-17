import HealthGoals from "@/components/health-goals";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("health.healthGoals");
  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("myTitle")}</h1>
        <p>{t("mySubtitle")}</p>
      </div>
      <HealthGoals />
    </div>
  );
}

