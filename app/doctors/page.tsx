import SectionVisual from "@/components/section-visual";
import {prisma} from "@/lib/prisma";
import { withdrawExpiredCredentials } from "@/lib/verification-documents";
import { Info } from "@phosphor-icons/react/dist/ssr";
import DoctorClientList from "@/components/doctor-client-list";
import { getTranslations } from "next-intl/server";

export default async function Page({searchParams}:{searchParams:Promise<{profileId?:string}>}) {
  const {profileId}=await searchParams;
  const t = await getTranslations("discovery");
  await withdrawExpiredCredentials();
  const doctors=await prisma.doctor.findMany({
    where:{isVerified:true,isPublished:true,verificationDocuments:{none:{status:"APPROVED",expiresAt:{lt:new Date()}}}},
    select:{id:true,slug:true,name:true,specialty:true,presenceStatus:true,city:true,reviewCount:true,rating:true},
    orderBy:[{rating:'desc'},{name:'asc'}],
    take:60
  });

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      <SectionVisual slug="doctors" alt={t("specialistsAlt")} />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
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
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "16px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", color: "#16a34a" }}>
          <Info size={24} weight="duotone" />
          <span style={{ fontWeight: 500 }}>{t("familyProfileActiveNotice")}</span>
        </div>
      )}

      {/* Doktorlar Client Grid (Arama & Filtreleme) */}
      <DoctorClientList doctors={doctors} profileId={profileId} />
    </div>
  );
}
