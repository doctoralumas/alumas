import SectionVisual from "@/components/section-visual";
import ImagingCenter from "@/components/imaging-center";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("health.healthImaging");
  return (
    <div className="page">
      <SectionVisual slug="imaging" alt={t("visualAlt")} />
      <ImagingCenter />
    </div>
  );
}

