import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  InsuranceDomainError,
  validateCanonicalInsurerEntry,
} from "@/lib/insurance-domain";
import {
  createOrDeclareInsuranceAgreement,
  loadFullInsuranceEcosystemState,
  mutateAgreementStatusInStore,
  readInsuranceOverlayState,
  recordInsuranceAudit,
  removeAgreementFromStore,
  updateInsurerCorporateProfileInStore,
  upsertInsurerNetworkRecord,
  upsertInsurerProductRecord,
  writeInsuranceOverlayState,
} from "@/lib/insurance-ecosystem-store";
import { normalizeTextKey } from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });

  const dbInsurerOrgs = await prisma.organization
    .findMany({
      where: { type: "INSURANCE_COMPANY" },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        verificationDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [] as any[]);

  const allInsurerOrgs = [...eco.isolatedOrganizations, ...dbInsurerOrgs];
  const pendingInsurerApplications = allInsurerOrgs.filter(
    (o) => o.status === "PENDING"
  );
  const disputedAgreements = eco.agreements.filter(
    (a) => a.verificationStatus === "DISPUTED"
  );

  return NextResponse.json({
    ok: true,
    insurers: eco.insurers,
    agreements: eco.agreements,
    insurerOrganizations: allInsurerOrgs,
    pendingInsurerApplications,
    disputedAgreements,
    auditLogs: eco.isolatedAuditLogs.slice(0, 60),
    stats: {
      totalInsurers: eco.insurers.filter((i) => i.slug !== "alumas-demo-sigorta").length,
      verifiedInsurerOrgs: eco.insurers.filter((i) => i.isVerifiedOrganization).length,
      pendingApplications: pendingInsurerApplications.length,
      totalAgreements: eco.agreements.length,
      confirmedAgreements: eco.agreements.filter(
        (a) =>
          a.verificationStatus === "MUTUALLY_CONFIRMED" ||
          a.verificationStatus === "ADMIN_VERIFIED"
      ).length,
      disputedAgreements: disputedAgreements.length,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const adminUser = auth.user!;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").toUpperCase();

  try {
    if (action === "UPDATE_INSURER") {
      const insurerId = String(body.insurerId || "");
      const updated = await updateInsurerCorporateProfileInStore({
        insurerId,
        patch: {
          name: body.name ? String(body.name).trim() : undefined,
          legalName: body.legalName !== undefined ? String(body.legalName || "").trim() || null : undefined,
          seddkLicenseRef:
            body.seddkLicenseRef !== undefined
              ? String(body.seddkLicenseRef || "").trim() || null
              : undefined,
          tsbMemberCode:
            body.tsbMemberCode !== undefined
              ? String(body.tsbMemberCode || "").trim() || null
              : undefined,
          website: body.website !== undefined ? String(body.website || "").trim() || null : undefined,
          phone: body.phone !== undefined ? String(body.phone || "").trim() || null : undefined,
          claimsPhone:
            body.claimsPhone !== undefined ? String(body.claimsPhone || "").trim() || null : undefined,
          provisionPortalUrl:
            body.provisionPortalUrl !== undefined
              ? String(body.provisionPortalUrl || "").trim() || null
              : undefined,
          headquartersCity:
            body.headquartersCity !== undefined
              ? String(body.headquartersCity || "").trim() || null
              : undefined,
          headquartersDistrict:
            body.headquartersDistrict !== undefined
              ? String(body.headquartersDistrict || "").trim() || null
              : undefined,
          headquartersAddress:
            body.headquartersAddress !== undefined
              ? String(body.headquartersAddress || "").trim() || null
              : undefined,
          description:
            body.description !== undefined ? String(body.description || "").trim() || null : undefined,
          isPubliclyListed:
            body.isPubliclyListed !== undefined ? Boolean(body.isPubliclyListed) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
          lifecycleStatus: body.lifecycleStatus || undefined,
        },
      });

      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.insurer_update",
        entityType: "InsuranceProvider",
        entityId: updated.id,
        metadata: { reason: body.reason || "Admin sigorta kurumu kaydını güncelledi" },
        req,
      });

      return NextResponse.json({ ok: true, insurer: updated });
    }

    if (action === "CREATE_INSURER") {
      const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });
      const name = String(body.name || "").trim();
      const slug = normalizeTextKey(body.slug || name);
      const seddkLicenseRef = String(body.seddkLicenseRef || "").trim() || null;

      validateCanonicalInsurerEntry(
        {
          name,
          slug,
          payerKind: "COMMERCIAL_INSURER",
          lifecycleStatus: "ACTIVE",
          seddkLicenseRef,
          isPubliclyListed: true,
          isClaimable: true,
        },
        eco.insurers
      );

      const overlay = readInsuranceOverlayState();
      const id = `ins_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newInsurer = {
        id,
        name,
        slug,
        payerKind: "COMMERCIAL_INSURER" as const,
        lifecycleStatus: "ACTIVE" as const,
        canonicalCode: `TR-INS-${slug.toUpperCase().slice(0, 14)}`,
        legalName: String(body.legalName || `${name} A.Ş.`).trim(),
        seddkLicenseRef,
        tsbMemberCode: String(body.tsbMemberCode || "").trim() || null,
        website: normalizeOfficialWebsiteUrl(body.website),
        phone: String(body.phone || "").trim() || null,
        claimsPhone: String(body.claimsPhone || body.phone || "").trim() || null,
        provisionPortalUrl: normalizeOfficialWebsiteUrl(body.provisionPortalUrl || body.website),
        headquartersCity: String(body.headquartersCity || "İstanbul").trim(),
        headquartersDistrict: String(body.headquartersDistrict || "").trim() || null,
        headquartersAddress: String(body.headquartersAddress || "").trim() || null,
        description: String(body.description || "").trim() || null,
        isActive: true,
        isPubliclyListed: true,
        isClaimable: true,
        source: "ALUMAS_ADMIN_CATALOG",
        lastVerifiedAt: new Date().toISOString(),
        organizationId: null,
        directoryInstitutionId: null,
        supportedProductTypes: ["TSS", "OSS"] as any,
        products: [],
        networks: [],
        isVerifiedOrganization: false,
        verifiedOrganizationSlug: null,
        organizationStatus: null,
        confirmedAgreementCount: 0,
        declaredAgreementCount: 0,
        canClaim: true,
        claimBlockReason: null,
      };

      overlay.customInsurers.push(newInsurer);
      writeInsuranceOverlayState(overlay);

      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.insurer_create",
        entityType: "InsuranceProvider",
        entityId: id,
        metadata: { name, slug, seddkLicenseRef },
        req,
      });

      return NextResponse.json({ ok: true, insurer: newInsurer }, { status: 201 });
    }

    if (action === "UPSERT_PRODUCT") {
      const saved = await upsertInsurerProductRecord({
        insurerId: String(body.insurerId || ""),
        product: {
          id: body.id || null,
          code: String(body.code || ""),
          name: String(body.name || ""),
          productType: body.productType || "TSS",
          requiresPublicSgk: body.requiresPublicSgk,
          status: body.status || "ACTIVE",
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });
      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.product_upsert",
        entityType: "InsuranceProduct",
        entityId: saved.id,
        metadata: { insurerId: body.insurerId, code: saved.code },
        req,
      });
      return NextResponse.json({ ok: true, product: saved });
    }

    if (action === "UPSERT_NETWORK") {
      const saved = await upsertInsurerNetworkRecord({
        insurerId: String(body.insurerId || ""),
        network: {
          id: body.id || null,
          code: String(body.code || ""),
          name: String(body.name || ""),
          tierLabel: body.tierLabel || null,
          tierRank: body.tierRank != null ? Number(body.tierRank) : 1,
          status: body.status || "ACTIVE",
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        },
      });
      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.network_upsert",
        entityType: "InsuranceNetwork",
        entityId: saved.id,
        metadata: { insurerId: body.insurerId, code: saved.code },
        req,
      });
      return NextResponse.json({ ok: true, network: saved });
    }

    if (action === "CREATE_AGREEMENT") {
      const saved = await createOrDeclareInsuranceAgreement({
        actorRole: "ADMIN",
        actorUserId: adminUser.id,
        organizationId: body.organizationId || null,
        directoryInstitutionId: body.directoryInstitutionId || null,
        insuranceProviderId: String(body.insuranceProviderId || ""),
        productType: body.productType || null,
        productId: body.productId || null,
        networkId: body.networkId || null,
        coverageScope: body.coverageScope || "ALL_BRANCHES",
        requestedVerificationStatus: body.verificationStatus || "ADMIN_VERIFIED",
        effectiveFrom: body.effectiveFrom || null,
        expiresAt: body.expiresAt || null,
        note: body.note || null,
        specialtyRules: Array.isArray(body.specialtyRules) ? body.specialtyRules : [],
      });

      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.agreement_create",
        entityType: "InsuranceProviderAgreement",
        entityId: saved.id,
        metadata: {
          insurerId: saved.insuranceProviderId,
          facilityName: saved.facilityName,
          verificationStatus: saved.verificationStatus,
        },
        req,
      });

      return NextResponse.json({ ok: true, agreement: saved }, { status: 201 });
    }

    if (
      action === "VERIFY_AGREEMENT" ||
      action === "CONFIRM_AGREEMENT" ||
      action === "DISPUTE_AGREEMENT" ||
      action === "EXPIRE_AGREEMENT"
    ) {
      const mappedAction =
        action === "VERIFY_AGREEMENT"
          ? "ADMIN_VERIFY"
          : action === "CONFIRM_AGREEMENT"
          ? "CONFIRM"
          : action === "DISPUTE_AGREEMENT"
          ? "DISPUTE"
          : "EXPIRE";

      const updated = await mutateAgreementStatusInStore({
        agreementId: String(body.agreementId || ""),
        actor: {
          userId: adminUser.id,
          role: "ADMIN",
        },
        action: mappedAction,
        reason: body.reason || null,
      });

      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: `admin.insurance.agreement_${mappedAction.toLowerCase()}`,
        entityType: "InsuranceProviderAgreement",
        entityId: updated.id,
        metadata: {
          verificationStatus: updated.verificationStatus,
          reason: body.reason || null,
        },
        req,
      });

      return NextResponse.json({ ok: true, agreement: updated });
    }

    if (action === "REMOVE_AGREEMENT") {
      const agreementId = String(body.agreementId || "");
      await removeAgreementFromStore(agreementId);
      await recordInsuranceAudit({
        actorUserId: adminUser.id,
        action: "admin.insurance.agreement_remove",
        entityType: "InsuranceProviderAgreement",
        entityId: agreementId,
        metadata: { reason: body.reason || "Admin tarafından kaldırıldı" },
        req,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "UNSUPPORTED_ACTION" }, { status: 400 });
  } catch (err: any) {
    if (err instanceof InsuranceDomainError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.httpStatus }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err?.message || "İşlem gerçekleştirilemedi." },
      { status: 500 }
    );
  }
}

export const PATCH = POST;

