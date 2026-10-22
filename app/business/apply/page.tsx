import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BusinessApplicationForm, {
  type ClaimedDirectorySummary,
} from "@/components/business-application-form";
import { getTranslations } from "next-intl/server";
import { findDirectoryInstitutionByIdOrSlug } from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import { buildAuthHref, sanitizeClaimDirectoryId } from "@/lib/claim-onboarding";
import { Buildings } from "@phosphor-icons/react/dist/ssr";

export default async function Apply({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; claimDirectoryId?: string }>;
}) {
  const { type, claimDirectoryId } = await searchParams;
  const safeClaimId = sanitizeClaimDirectoryId(claimDirectoryId);
  const t = await getTranslations("professional.businessApply");

  const targetRecord = safeClaimId
    ? await findDirectoryInstitutionByIdOrSlug(safeClaimId)
    : null;

  const isTargetActive = Boolean(targetRecord && targetRecord.isActive !== false);
  const hasActiveClaim = Boolean(
    isTargetActive &&
      targetRecord &&
      (targetRecord.organizationId ||
        (Array.isArray(targetRecord.claims) &&
          targetRecord.claims.some(
            (c: any) => c.status === "PENDING" || c.status === "APPROVED"
          )))
  );

  const claimInstitution: ClaimedDirectorySummary | null =
    isTargetActive && targetRecord
      ? {
          id: targetRecord.id,
          directoryId: targetRecord.id,
          slug: targetRecord.slug,
          type: targetRecord.type,
          name: targetRecord.name,
          city: targetRecord.city,
          district: targetRecord.district ?? null,
          address: targetRecord.address,
          phone: targetRecord.phone ?? "",
          officialWebsite: normalizeOfficialWebsiteUrl(targetRecord.officialWebsite),
          description: targetRecord.description ?? null,
          canClaim: !hasActiveClaim,
        }
      : null;

  const claimLookupFailed = Boolean(safeClaimId && !claimInstitution);
  const user = await currentUser();

  const typeLabelMap: Record<string, string> = {
    HOSPITAL: t("tabHospital"),
    CLINIC: t("tabClinic"),
    PHARMACY: t("tabPharmacy"),
    IMAGING_CENTER: t("tabImaging"),
    LABORATORY: t("tabLab"),
  };

  if (!user) {
    const returnPath = safeClaimId
      ? `/business/apply?claimDirectoryId=${encodeURIComponent(safeClaimId)}`
      : type
      ? `/business/apply?type=${encodeURIComponent(type)}`
      : "/business/apply";

    const proLoginHref = buildAuthHref("/pro/login", {
      claimDirectoryId: safeClaimId,
      next: returnPath,
    });
    const proRegisterHref = buildAuthHref("/pro/register", {
      claimDirectoryId: safeClaimId,
      next: returnPath,
      type: "organization",
    });
    const patientLoginHref = buildAuthHref("/login", {
      claimDirectoryId: safeClaimId,
      next: returnPath,
    });

    return (
      <div className="page" style={{ maxWidth: "780px", margin: "0 auto" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link
            href="/organizations"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              textDecoration: "none",
            }}
          >
            {t("claimGateBackToDirectory")}
          </Link>
        </div>

        <section
          className="panel"
          data-testid="claim-onboarding-gate"
          style={{
            padding: "32px",
            borderRadius: "24px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 32px -12px rgba(15, 23, 42, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div>
            <span
              className="kicker"
              style={{
                display: "inline-block",
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              {t("claimGateKicker")}
            </span>
            <h1
              data-testid="claim-onboarding-banner"
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px 0",
                lineHeight: 1.25,
              }}
            >
              {claimInstitution
                ? t("claimGateTitle", { name: claimInstitution.name })
                : t("claimGateGenericTitle")}
            </h1>
            <p style={{ margin: 0, color: "#475569", fontSize: "15px", lineHeight: 1.55 }}>
              {t("claimGateSubtitle")}
            </p>
          </div>

          {claimLookupFailed && safeClaimId && (
            <div
              data-testid="claim-invalid-id-warning"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "14px",
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {t("invalidClaimDirectoryWarning", { id: safeClaimId })}
            </div>
          )}

          {claimInstitution && (
            <div
              data-testid="claim-target-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "#0f172a",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {typeLabelMap[claimInstitution.type] || claimInstitution.type}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    background: "#e2e8f0",
                    padding: "4px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {t("claimedBranchBadge")}
                </span>
              </div>

              <div style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a" }}>
                {claimInstitution.name}
              </div>

              <div style={{ fontSize: "14px", color: "#475569", lineHeight: 1.5 }}>
                <div>
                  <strong>
                    {claimInstitution.city}
                    {claimInstitution.district ? ` / ${claimInstitution.district}` : ""}
                  </strong>{" "}
                  — {claimInstitution.address}
                </div>
                {claimInstitution.phone && (
                  <div style={{ marginTop: "4px" }}>Tel: {claimInstitution.phone}</div>
                )}
              </div>

              <div
                data-testid="claim-branch-scope-notice"
                style={{
                  marginTop: "4px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e3a8a",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                {t("claimGateBranchScopeNotice", {
                  name: claimInstitution.name,
                  city: claimInstitution.city,
                })}
              </div>
            </div>
          )}

          {claimInstitution && !claimInstitution.canClaim && (
            <div
              data-testid="claim-already-active-notice"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                fontSize: "14px",
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              {t("alreadyClaimedWarning", { name: claimInstitution.name })}
            </div>
          )}

          <div
            data-testid="claim-why-docs-notice"
            style={{
              padding: "16px 18px",
              borderRadius: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "13.5px",
              color: "#334155",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ display: "block", color: "#0f172a", marginBottom: "4px" }}>
              {t("claimGateWhyDocsTitle")}
            </strong>
            {t("claimGateWhyDocsDesc")}
          </div>

          <div
            data-testid="claim-existing-account-notice"
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              fontSize: "13.5px",
              color: "#166534",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {t("claimGateExistingAccountTitle")}
            </strong>
            {t("claimGateExistingAccountDesc")}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            <Link
              href={proLoginHref}
              data-testid="claim-login-cta"
              className="primary"
              style={{
                flex: "1 1 240px",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              {t("claimGateLoginProButton")}
            </Link>
            <Link
              href={proRegisterHref}
              data-testid="claim-register-cta"
              className="secondary"
              style={{
                flex: "1 1 240px",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                background: "#0f172a",
                color: "#ffffff",
              }}
            >
              {t("claimGateRegisterProButton")}
            </Link>
          </div>

          <div style={{ textAlign: "center", marginTop: "4px" }}>
            <Link
              href={patientLoginHref}
              data-testid="claim-patient-login-cta"
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#2563eb",
                textDecoration: "underline",
              }}
            >
              {t("claimGateLoginPatientLink")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  let hasExistingOwnedOrgs = false;
  try {
    const ownedCount = await prisma.organization.count({
      where: { ownerUserId: user.id },
    });
    hasExistingOwnedOrgs = ownedCount > 0;
  } catch {
    hasExistingOwnedOrgs = false;
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: "840px",
        margin: "0 auto",
        padding: "clamp(24px, 4vw, 44px) clamp(16px, 3vw, 24px) 80px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "clamp(24px, 4vw, 36px)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#f0fdfa",
            color: "#0d9488",
            border: "1px solid #ccfbf1",
            padding: "5px 14px",
            borderRadius: "100px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          <Buildings size={15} weight="bold" />
          <span>{t("kicker")}</span>
        </div>
        <h1
          style={{
            fontSize: "clamp(24px, 3.6vw, 32px)",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
            margin: "0 0 10px",
          }}
        >
          {claimInstitution
            ? t("claimGateTitle", { name: claimInstitution.name })
            : t("title")}
        </h1>
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.55,
            color: "#475569",
            maxWidth: "640px",
            margin: "0 auto",
          }}
        >
          {t("subtitle")}
        </p>
      </div>
      <section
        className="panel"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          padding: "clamp(20px, 4vw, 36px)",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.06)",
        }}
      >
        <BusinessApplicationForm
          initialType={claimInstitution?.type || type}
          initialClaimDirectoryId={safeClaimId || undefined}
          initialClaimInstitution={claimInstitution}
          claimLookupFailed={claimLookupFailed}
          hasExistingOwnedOrgs={hasExistingOwnedOrgs}
        />
      </section>
    </div>
  );
}
