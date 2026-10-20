import SectionVisual from "@/components/section-visual";
import { withdrawExpiredCredentials } from "@/lib/verification-documents";
import { Info } from "@phosphor-icons/react/dist/ssr";
import DoctorClientList from "@/components/doctor-client-list";
import { getTranslations } from "next-intl/server";
import { queryNormalizedExperts } from "@/lib/expert-directory";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; q?: string; specialty?: string; city?: string }>;
}) {
  const { profileId, q, specialty, city } = await searchParams;
  const t = await getTranslations("discovery");
  await withdrawExpiredCredentials();

  const experts = await queryNormalizedExperts({
    q,
    specialty,
    city,
  });

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="doctors" alt={t("specialistsAlt")} />

      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="kicker">{t("medicalStaffKicker")}</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>
            {profileId ? t("selectSpecialistForFamily") : t("doctorsTitle")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            {profileId ? t("familyDoctorSubtitle") : t("doctorsSubtitle")}
          </p>
        </div>
      </div>

      {profileId && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "16px",
            borderRadius: "16px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#16a34a",
          }}
        >
          <Info size={24} weight="duotone" />
          <span style={{ fontWeight: 500 }}>{t("familyProfileActiveNotice")}</span>
        </div>
      )}

      {/* Doktor ve Uzmanlar Grid (Arama, Filtreleme, Sahiplenme & Doğrulama) */}
      <DoctorClientList doctors={experts} profileId={profileId} />
    </div>
  );
}
