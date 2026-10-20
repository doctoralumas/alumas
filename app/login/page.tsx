import AuthForm from "@/components/auth-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { findDirectoryInstitutionByIdOrSlug } from "@/lib/institution-directory";
import {
  buildAuthHref,
  resolvePostAuthDestination,
  sanitizeClaimDirectoryId,
  sanitizeClaimDoctorId,
  sanitizeInternalReturnUrl,
} from "@/lib/claim-onboarding";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ claimDirectoryId?: string; claimDoctorId?: string; next?: string; type?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const safeClaimId = sanitizeClaimDirectoryId(resolved.claimDirectoryId);
  const safeDoctorClaimId = sanitizeClaimDoctorId(resolved.claimDoctorId);
  const safeNext = sanitizeInternalReturnUrl(resolved.next);

  const user = await currentUser();
  if (user) {
    const dest = resolvePostAuthDestination({
      mode: "login",
      accountType: user.role,
      claimDirectoryId: safeClaimId,
      claimDoctorId: safeDoctorClaimId,
      next: safeNext,
    });
    redirect(dest);
  }

  const t = await getTranslations("auth");
  const targetDir = safeClaimId ? await findDirectoryInstitutionByIdOrSlug(safeClaimId) : null;
  const claimInstitutionName = targetDir?.name || null;

  const phoneHref = buildAuthHref("/phone-login", {
    claimDirectoryId: safeClaimId,
    claimDoctorId: safeDoctorClaimId,
    next: safeNext,
    type: resolved.type,
  });
  const proLoginHref = buildAuthHref("/pro/login", {
    claimDirectoryId: safeClaimId,
    claimDoctorId: safeDoctorClaimId,
    next: safeNext,
    type: resolved.type,
  });

  return (
    <div className="page auth-page">
      <AuthForm mode="login" claimInstitutionName={claimInstitutionName} />
      <Link className="secondary full auth-secondary" href={phoneHref}>
        {t("phoneLogin")}
      </Link>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href={proLoginHref} style={{ fontSize: "0.9rem", color: "var(--brand)" }}>
          {t("proLoginLink")}
        </Link>
      </div>
    </div>
  );
}
