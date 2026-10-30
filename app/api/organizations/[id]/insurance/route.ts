import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { CAPABILITY_DENIED, organizationAllows } from "@/lib/organization-capabilities";
import {
  filterPublicCatalogInsurers,
  InsuranceDomainError,
} from "@/lib/insurance-domain";
import {
  createOrDeclareInsuranceAgreement,
  loadFullInsuranceEcosystemState,
  mutateAgreementStatusInStore,
  recordInsuranceAudit,
  removeAgreementFromStore,
} from "@/lib/insurance-ecosystem-store";

async function resolveProviderOrgAccess(id: string) {
  const user = await currentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const org = await prisma.organization.findUnique({
    where: { id },
  });
  if (!org) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) };
  }
  if (user.role !== "ADMIN" && org.ownerUserId !== user.id) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  if (!organizationAllows(org.type, "providerInsuranceContracts")) {
    return {
      error: NextResponse.json(
        { error: CAPABILITY_DENIED.providerInsuranceContracts },
        { status: 400 }
      ),
    };
  }

  return { user, org };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await resolveProviderOrgAccess(id);
  if ("error" in ctx) return ctx.error;

  const eco = await loadFullInsuranceEcosystemState();
  const orgAgreements = eco.agreements.filter((a) => a.organizationId === id);
  const legacyContracts = eco.legacyContracts.filter((c) => c.organizationId === id);

  return NextResponse.json({
    insurers: filterPublicCatalogInsurers(eco.insurers),
    agreements: orgAgreements,
    legacyContracts,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await resolveProviderOrgAccess(id);
    if ("error" in ctx) return ctx.error;
    const { user, org } = ctx;

    if (org.status !== "APPROVED" || !org.isPublished) {
      return NextResponse.json(
        { error: "Sigorta anlaşması yönetimi yalnızca yönetici onaylı kurumlar için aktiftir." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      insuranceProviderId,
      productType,
      productId,
      networkId,
      coverageScope,
      specialtyRules,
      effectiveFrom,
      expiresAt,
      note,
      verificationStatus,
    } = body;

    if (!insuranceProviderId) {
      return NextResponse.json({ error: "Missing insuranceProviderId" }, { status: 400 });
    }

    // Security check: non-admin healthcare provider cannot request verified status on creation
    if (
      user.role !== "ADMIN" &&
      verificationStatus &&
      verificationStatus !== "PROVIDER_DECLARED" &&
      verificationStatus !== "UNVERIFIED"
    ) {
      return NextResponse.json(
        {
          error: "SELF_VERIFICATION_FORBIDDEN",
          message:
            "Sağlık kurumları kendi sigorta anlaşma beyanlarını doğrudan onaylı (MUTUALLY_CONFIRMED / ADMIN_VERIFIED) olarak işaretleyemez.",
        },
        { status: 403 }
      );
    }

    const agreement = await createOrDeclareInsuranceAgreement({
      actorRole: user.role === "ADMIN" ? "ADMIN" : "PROVIDER",
      actorUserId: user.id,
      organizationId: id,
      insuranceProviderId: String(insuranceProviderId),
      productType: productType || null,
      productId: productId || null,
      networkId: networkId || null,
      coverageScope: coverageScope || "ALL_BRANCHES",
      requestedVerificationStatus:
        user.role === "ADMIN" ? verificationStatus || null : "PROVIDER_DECLARED",
      effectiveFrom: effectiveFrom || null,
      expiresAt: expiresAt || null,
      note: note ?? null,
      specialtyRules: Array.isArray(specialtyRules) ? specialtyRules : [],
    });

    await recordInsuranceAudit({
      actorUserId: user.id,
      action: "provider.insurance.agreement_declare",
      entityType: "InsuranceProviderAgreement",
      entityId: agreement.id,
      metadata: {
        organizationId: id,
        insuranceProviderId: agreement.insuranceProviderId,
        productType: agreement.productType,
        verificationStatus: agreement.verificationStatus,
      },
      req,
    });

    return NextResponse.json({
      ...agreement,
      insuranceProvider: {
        id: agreement.insuranceProviderId,
        name: agreement.insurerName || "",
        slug: agreement.insurerSlug || "",
      },
      confirmed:
        agreement.verificationStatus === "MUTUALLY_CONFIRMED" ||
        agreement.verificationStatus === "ADMIN_VERIFIED",
    });
  } catch (error: any) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.httpStatus }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await resolveProviderOrgAccess(id);
    if ("error" in ctx) return ctx.error;
    const { user, org } = ctx;

    if (org.status !== "APPROVED" || !org.isPublished) {
      return NextResponse.json(
        { error: "Sigorta anlaşması yönetimi yalnızca yönetici onaylı kurumlar için aktiftir." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = String(body.action || "").toUpperCase();
    const agreementId = String(body.agreementId || "");
    if (!agreementId) {
      return NextResponse.json({ error: "Missing agreementId" }, { status: 400 });
    }

    const mappedAction =
      action === "CONFIRM_AGREEMENT" || action === "CONFIRM"
        ? "CONFIRM"
        : action === "DISPUTE_AGREEMENT" || action === "DISPUTE"
        ? "DISPUTE"
        : action === "EXPIRE_AGREEMENT" || action === "EXPIRE"
        ? "EXPIRE"
        : null;

    if (!mappedAction) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const updated = await mutateAgreementStatusInStore({
      agreementId,
      actor: {
        userId: user.id,
        role: user.role === "ADMIN" ? "ADMIN" : "PROVIDER",
        ownedOrganizationIds: [id],
      },
      action: mappedAction,
      reason: body.reason || null,
    });

    await recordInsuranceAudit({
      actorUserId: user.id,
      action: `provider.insurance.agreement_${mappedAction.toLowerCase()}`,
      entityType: "InsuranceProviderAgreement",
      entityId: updated.id,
      metadata: {
        organizationId: id,
        verificationStatus: updated.verificationStatus,
        reason: body.reason || null,
      },
      req,
    });

    return NextResponse.json({ ok: true, agreement: updated });
  } catch (error: any) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.httpStatus }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await resolveProviderOrgAccess(id);
    if ("error" in ctx) return ctx.error;
    const { user, org } = ctx;

    if (org.status !== "APPROVED" || !org.isPublished) {
      return NextResponse.json(
        { error: "Sigorta anlaşması yönetimi yalnızca yönetici onaylı kurumlar için aktiftir." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const agreementId = url.searchParams.get("agreementId");
    const insuranceProviderId = url.searchParams.get("providerId");

    if (agreementId) {
      const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });
      const target = eco.agreements.find((a) => a.id === agreementId);
      if (!target || target.organizationId !== id) {
        return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
      }
      if (
        user.role !== "ADMIN" &&
        target.verificationStatus !== "PROVIDER_DECLARED" &&
        target.verificationStatus !== "UNVERIFIED"
      ) {
        return NextResponse.json(
          {
            error: "CANNOT_DELETE_INSURER_AGREEMENT",
            message:
              "Sigorta şirketi veya yönetici tarafından doğrulanmış anlaşmalar kurum tarafından doğrudan silinemez; uyuşmazlık veya süre sonlandırma bildirimini kullanın.",
          },
          { status: 403 }
        );
      }
      await removeAgreementFromStore(agreementId);
      return NextResponse.json({ success: true });
    }

    if (!insuranceProviderId) {
      return NextResponse.json({ error: "Missing providerId or agreementId" }, { status: 400 });
    }

    await prisma.organizationInsurance
      .delete({
        where: {
          organizationId_insuranceProviderId: {
            organizationId: id,
            insuranceProviderId: String(insuranceProviderId),
          },
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
