import PhoneLogin from "@/components/phone-login";
import { findDirectoryInstitutionByIdOrSlug } from "@/lib/institution-directory";
import {
  resolvePostAuthDestination,
  sanitizeClaimDirectoryId,
  sanitizeInternalReturnUrl,
} from "@/lib/claim-onboarding";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ claimDirectoryId?: string; next?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const safeClaimId = sanitizeClaimDirectoryId(resolved.claimDirectoryId);
  const safeNext = sanitizeInternalReturnUrl(resolved.next);

  const user = await currentUser();
  if (user) {
    const dest = resolvePostAuthDestination({
      mode: "login",
      accountType: user.role,
      claimDirectoryId: safeClaimId,
      next: safeNext,
    });
    redirect(dest);
  }

  const targetDir = safeClaimId ? await findDirectoryInstitutionByIdOrSlug(safeClaimId) : null;
  const claimInstitutionName = targetDir?.name || null;

  return (
    <div className="page auth-page">
      <PhoneLogin claimInstitutionName={claimInstitutionName} />
    </div>
  );
}