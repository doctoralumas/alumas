import PhoneLogin from "@/components/phone-login";
import { findDirectoryInstitutionByIdOrSlug } from "@/lib/institution-directory";
import { sanitizeClaimDirectoryId } from "@/lib/claim-onboarding";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ claimDirectoryId?: string; next?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const safeClaimId = sanitizeClaimDirectoryId(resolved.claimDirectoryId);
  const targetDir = safeClaimId ? await findDirectoryInstitutionByIdOrSlug(safeClaimId) : null;
  const claimInstitutionName = targetDir?.name || null;

  return (
    <div className="page auth-page">
      <PhoneLogin claimInstitutionName={claimInstitutionName} />
    </div>
  );
}