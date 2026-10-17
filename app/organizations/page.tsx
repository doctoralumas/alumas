import SectionVisual from "@/components/section-visual";
import OrganizationDirectory from '@/components/organization-directory';
import { currentUser } from '@/lib/auth';
import Link from 'next/link';
import { getTranslations } from "next-intl/server";

export default async function Organizations() {
  const user = await currentUser();
  const t = await getTranslations("discovery");

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="organizations" alt={t("networkTitle")} />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="kicker">{t("networkKicker")}</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>{t("networkTitle")}</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            {t("networkSubtitle")}
          </p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "18px" }}>🌍</span>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          <strong>{t("globalDiscoveryNoticeStrong")}</strong> {t("globalDiscoveryNoticeText")}{" "}
          <Link href="/nearby" style={{ color: "#0f172a", fontWeight: 600, textDecoration: "underline" }}>
            {t("globalDiscoveryLink")}
          </Link>
        </p>
      </div>

      <OrganizationDirectory isLoggedIn={!!user} />
    </div>
  );
}
