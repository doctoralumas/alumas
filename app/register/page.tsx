import AuthForm from "@/components/auth-form";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { findDirectoryInstitutionByIdOrSlug } from "@/lib/institution-directory";
import {
  buildAuthHref,
  sanitizeClaimDirectoryId,
  sanitizeInternalReturnUrl,
} from "@/lib/claim-onboarding";

export default async function Register({
  searchParams,
}: {
  searchParams?: Promise<{ claimDirectoryId?: string; next?: string; type?: string }>;
}) {
  const t = await getTranslations("auth");
  const resolved = searchParams ? await searchParams : {};
  const safeClaimId = sanitizeClaimDirectoryId(resolved.claimDirectoryId);
  const safeNext = sanitizeInternalReturnUrl(resolved.next);
  const targetDir = safeClaimId ? await findDirectoryInstitutionByIdOrSlug(safeClaimId) : null;
  const claimInstitutionName = targetDir?.name || null;

  const proRegisterHref = buildAuthHref("/pro/register", {
    claimDirectoryId: safeClaimId,
    next: safeNext,
    type: safeClaimId ? "organization" : resolved.type,
  });

  return (
    <div className="page auth-page">
      <AuthForm mode="register" claimInstitutionName={claimInstitutionName} />
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href={proRegisterHref} style={{ fontSize: "0.9rem", color: "var(--brand)" }}>
          {t("proRegisterLink")}
        </Link>
      </div>
    </div>
  );
}
