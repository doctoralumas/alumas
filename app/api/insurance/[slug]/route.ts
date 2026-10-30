import { NextResponse } from "next/server";
import { findEnrichedInsurer } from "@/lib/insurance-ecosystem-store";
import { isInsurerPubliclyDiscoverable } from "@/lib/insurance-domain";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = String(rawSlug || "").trim();
  if (!slug || slug === "alumas-demo-sigorta") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const found = await findEnrichedInsurer(slug);
  if (!found || !isInsurerPubliclyDiscoverable(found.insurer)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const activeAgreements = found.agreements.filter(
    (a) =>
      a.isActive &&
      a.verificationStatus !== "DISPUTED" &&
      a.verificationStatus !== "EXPIRED"
  );

  const confirmedAgreements = activeAgreements.filter(
    (a) =>
      a.verificationStatus === "MUTUALLY_CONFIRMED" ||
      a.verificationStatus === "ADMIN_VERIFIED" ||
      a.verificationStatus === "INSURER_DECLARED"
  );

  const declaredAgreements = activeAgreements.filter(
    (a) =>
      a.verificationStatus === "PROVIDER_DECLARED" ||
      a.verificationStatus === "UNVERIFIED"
  );

  return NextResponse.json({
    insurer: found.insurer,
    products: found.products.filter((p) => p.isActive !== false),
    networks: found.networks.filter((n) => n.isActive !== false),
    contractedProviders: {
      confirmed: confirmedAgreements,
      declared: declaredAgreements,
      totalCount: confirmedAgreements.length + declaredAgreements.length,
    },
    claimEligibility: {
      canClaim: found.insurer.canClaim,
      reason: found.insurer.claimBlockReason,
      applyHref: found.insurer.canClaim
        ? `/business/apply?type=INSURANCE_COMPANY&claimInsurerSlug=${encodeURIComponent(found.insurer.slug)}`
        : null,
      workspaceHref: found.insurer.organizationId
        ? `/business/${found.insurer.organizationId}`
        : null,
    },
  });
}
