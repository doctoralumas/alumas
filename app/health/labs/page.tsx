import SectionVisual from "@/components/section-visual";
import LabCenter from "@/components/lab-center";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("health.healthLabs");
  return (
    <div className="page">
      <SectionVisual slug="labs" alt={t("visualAlt")} />
      <LabCenter />
    </div>
  );
}

