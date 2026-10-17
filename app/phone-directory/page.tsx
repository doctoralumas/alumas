import SectionVisual from "@/components/section-visual";
import HealthPhoneDirectory from "@/components/health-phone-directory";
import { currentUser } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export default async function PhoneDirectoryPage() {
  const user = await currentUser();
  const t = await getTranslations("search.phoneDirectory");

  return (
    <div className="page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <SectionVisual slug="phone-directory" alt={t("altVisual")} />

      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "0 0 12px", fontWeight: 700 }}>
          {t("title")}
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", lineHeight: "1.5" }}>
          {t("subtitle")}
        </p>
      </div>

      <HealthPhoneDirectory isLoggedIn={!!user} />
    </div>
  );
}