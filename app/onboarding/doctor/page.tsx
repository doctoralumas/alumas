import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import DoctorOnboardingForm from "@/components/doctor-onboarding-form";
import { getTranslations } from "next-intl/server";
import { sanitizeClaimDoctorId } from "@/lib/claim-onboarding";
import {
  findDirectoryDoctorByIdOrSlug,
  findPotentialDirectoryDoctorMatches,
} from "@/lib/expert-directory";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ claimDoctorId?: string; claimDirectoryId?: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/pro/login");
  if (u.doctorProfile) redirect("/doctor");

  const resolved = searchParams ? await searchParams : {};
  const safeClaimId = sanitizeClaimDoctorId(resolved.claimDoctorId || resolved.claimDirectoryId);
  const targetDirDoctor = safeClaimId ? await findDirectoryDoctorByIdOrSlug(safeClaimId) : null;

  // If registering normally without claimDoctorId, look up potential directory matches to safely offer claiming flow
  const suggestedMatches =
    !targetDirDoctor && u.name
      ? await findPotentialDirectoryDoctorMatches({ name: u.name, limit: 3 })
      : [];

  const t = await getTranslations("professional.onboarding");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <DoctorOnboardingForm
          claimDoctor={
            targetDirDoctor
              ? {
                  id: targetDirDoctor.id,
                  name: targetDirDoctor.name,
                  title: targetDirDoctor.title,
                  specialty: targetDirDoctor.specialty,
                  hospital: targetDirDoctor.hospital,
                  city: targetDirDoctor.city,
                }
              : null
          }
          suggestedMatches={suggestedMatches}
        />
      </section>
    </div>
  );
}
