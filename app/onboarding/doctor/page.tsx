import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import DoctorOnboardingForm from "@/components/doctor-onboarding-form";
import { getTranslations } from "next-intl/server";
import { sanitizeClaimDoctorId } from "@/lib/claim-onboarding";
import {
  findDirectoryDoctorByIdOrSlug,
  findPotentialDirectoryDoctorMatches,
} from "@/lib/expert-directory";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

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
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "clamp(24px, 4vw, 40px) clamp(16px, 3vw, 24px) 80px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header Area */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            color: "#0f766e",
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "100px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          <Sparkle size={13} weight="fill" /> {t("kicker")}
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 34px)",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.03em",
            margin: "0 0 8px",
            lineHeight: 1.25,
          }}
        >
          {t("title")}
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#64748b",
            margin: 0,
            lineHeight: 1.6,
            maxWidth: "600px",
          }}
        >
          {t("subtitle")}
        </p>
      </div>

      {/* Main Form Panel */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          padding: "clamp(20px, 4vw, 36px)",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
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
