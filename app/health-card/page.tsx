import SectionVisual from "@/components/section-visual";
import EmergencyHealthCard from "@/components/emergency-health-card";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("health.healthCard");
  return (
    <div className="page">
      <SectionVisual slug="health-card" alt={t("title")} />
      <EmergencyHealthCard />
    </div>
  );
}
