import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canPerformInsurerOperations,
  InsuranceDomainError,
  normalizeInsurerIdentityKey,
} from "@/lib/insurance-domain";
import {
  createOrDeclareInsuranceAgreement,
  findEnrichedInsurer,
  loadFullInsuranceEcosystemState,
  manageInsurerRepresentativeInStore,
  mutateAgreementStatusInStore,
  recordInsuranceAudit,
  removeAgreementFromStore,
  updateInsurerCorporateProfileInStore,
  upsertInsurerNetworkRecord,
  upsertInsurerProductRecord,
} from "@/lib/insurance-ecosystem-store";

async function resolveInsurerOrganizationAndAccess(orgId: string) {
  const user = await currentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }

  const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });
  let org: any = await prisma.organization
    .findUnique({
      where: { id: orgId },
      include: {
        verificationDocuments: true,
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    .catch(() => null);

  if (!org) {
    org = eco.isolatedOrganizations.find((o: any) => o.id === orgId) || null;
  }

  if (!org) {
    return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };
  }

  if (org.type !== "INSURANCE_COMPANY") {
    return {
      error: NextResponse.json(
        { error: "NOT_INSURANCE_COMPANY", message: "Bu yönetim paneli yalnızca sigorta kurumları içindir." },
        { status: 400 }
      ),
    };
  }

  const linkedInsurer =
    eco.insurers.find(
      (i) =>
        i.organizationId === org.id ||
        (org.claimedInsurerId && (i.id === org.claimedInsurerId || i.slug === org.claimedInsurerId)) ||
        normalizeInsurerIdentityKey(i.name) === normalizeInsurerIdentityKey(org.name)
    ) || null;

  const reps = linkedInsurer ? eco.representatives[linkedInsurer.id] || [] : [];
  const isRep = reps.some(
    (r) =>
      r.status === "ACTIVE" &&
      (r.userId === user.id || (user.email && r.email.toLowerCase() === user.email.toLowerCase()))
  );

  if (user.role !== "ADMIN" && org.ownerUserId !== user.id && !isRep) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  const enriched = linkedInsurer
    ? await findEnrichedInsurer(linkedInsurer.id, { includeHidden: true })
    : null;

  return {
    user,
    org,
    eco,
    insurer: enriched,
    representatives: [
      {
        id: `owner_${org.ownerUserId}`,
        userId: org.ownerUserId,
        name: org.owner?.name || "Kurumsal Hesap Sahibi",
        email: org.owner?.email || org.email || "",
        roleTitle: org.applicantRoleTitle || "Kurumsal Yetkili",
        isPrimaryOwner: true,
        status: "ACTIVE" as const,
        addedAt: org.createdAt ? new Date(org.createdAt).toISOString() : new Date().toISOString(),
      },
      ...reps.filter((r) => r.userId !== org.ownerUserId),
    ],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await resolveInsurerOrganizationAndAccess(id);
  if ("error" in ctx) return ctx.error;

  const { org, insurer, eco, representatives } = ctx;

  const [dbOrgs, dbDirs] = await Promise.all([
    prisma.organization
      .findMany({
        where: {
          status: "APPROVED",
          type: { in: ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"] },
        },
        select: { id: true, name: true, slug: true, type: true, city: true, district: true },
        orderBy: { name: "asc" },
      })
      .catch(() => [] as any[]),
    prisma.directoryInstitution
      .findMany({
        where: {
          isActive: true,
          type: { in: ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"] },
        },
        select: { id: true, name: true, slug: true, type: true, city: true, district: true, organizationId: true },
        take: 120,
        orderBy: { name: "asc" },
      })
      .catch(() => [] as any[]),
  ]);

  const canOperateLive = canPerformInsurerOperations({
    status: org.status,
    type: org.type,
    documents: org.verificationDocuments || [],
  });

  const auditLogs = eco.isolatedAuditLogs
    .filter(
      (log: any) =>
        log.entityId === org.id ||
        (insurer && log.entityId === insurer.id) ||
        log.metadata?.insurerId === insurer?.id ||
        log.metadata?.organizationId === org.id
    )
    .slice(0, 40);

  return NextResponse.json({
    organization: org,
    insurer: insurer?.insurer || null,
    canOperateLive,
    products: insurer?.products || [],
    networks: insurer?.networks || [],
    agreements: insurer?.agreements || [],
    representatives,
    availableFacilities: {
      organizations: dbOrgs,
      directoryInstitutions: dbDirs.filter((d: any) => !d.organizationId),
    },
    auditLogs,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await resolveInsurerOrganizationAndAccess(id);
  if ("error" in ctx) return ctx.error;

  const { user, org, insurer } = ctx;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").toUpperCase();

  if (!insurer) {
    return NextResponse.json(
      {
        error: "INSURER_CATALOG_RECORD_NOT_LINKED",
        message: "Bu kurumsal hesap henüz bir sigorta kataloğu kaydı ile ilişkilendirilmemiş.",
      },
      { status: 400 }
    );
  }

  const canOperateLive =
    user.role === "ADMIN" ||
    canPerformInsurerOperations({
      status: org.status,
      type: org.type,
      documents: org.verificationDocuments || [],
    });

  try {
    if (action === "UPDATE_PROFILE") {
      const updated = await updateInsurerCorporateProfileInStore({
        insurerId: insurer.id,
        organizationId: org.id,
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
        },
      });

      await recordInsuranceAudit({
        actorUserId: user.id,
        action: "insurer.workspace.profile_update",
        entityType: "InsuranceProvider",
        entityId: insurer.id,
        metadata: { organizationId: org.id, insurerId: insurer.id },
        req,
      });

      return NextResponse.json({ ok: true, insurer: updated });
    }

    if (action === "ADD_REPRESENTATIVE" || action === "REVOKE_REPRESENTATIVE") {
      if (action === "ADD_REPRESENTATIVE") {
        const repName = String(body.name || "").trim();
        const repEmail = String(body.email || "").trim();
        const repRole = String(body.roleTitle || "Sigorta Network Uzmanı").trim();
        if (!repName || !repEmail) {
          return NextResponse.json(
            { error: "Yetkili temsilci adı ve kurumsal e-posta adresi zorunludur." },
            { status: 400 }
          );
        }
        const reps = manageInsurerRepresentativeInStore({
          insurerId: insurer.id,
          action: "ADD",
          representative: {
            name: repName,
            email: repEmail,
            roleTitle: repRole,
          },
        });
        await recordInsuranceAudit({
          actorUserId: user.id,
          action: "insurer.workspace.representative_add",
          entityType: "InsuranceProvider",
          entityId: insurer.id,
          metadata: { organizationId: org.id, email: repEmail, roleTitle: repRole },
          req,
        });
        return NextResponse.json({ ok: true, representatives: reps });
      } else {
        const reps = manageInsurerRepresentativeInStore({
          insurerId: insurer.id,
          action: "REVOKE",
          representativeId: String(body.representativeId || ""),
        });
        await recordInsuranceAudit({
          actorUserId: user.id,
          action: "insurer.workspace.representative_revoke",
          entityType: "InsuranceProvider",
          entityId: insurer.id,
          metadata: { organizationId: org.id, representativeId: body.representativeId },
          req,
        });
        return NextResponse.json({ ok: true, representatives: reps });
      }
    }

    // All catalog & agreement mutations below require either ADMIN or an APPROVED + verified insurer org
    if (!canOperateLive) {
      return NextResponse.json(
        {
          error: "INSURER_NOT_APPROVED_FOR_LIVE_OPERATIONS",
          message:
            "Onay bekleyen veya zorunlu SEDDK/yetki belgeleri tamamlanmamış sigorta kurumları canlı ürün, ağ veya anlaşmalı kurum yayınlayamaz.",
        },
        { status: 403 }
      );
    }

    if (action === "UPSERT_PRODUCT") {
      const saved = await upsertInsurerProductRecord({
        insurerId: insurer.id,
        product: {
          id: body.id || null,
          code: String(body.code || ""),
          name: String(body.name || ""),
          productType: body.productType || "TSS",
          requiresPublicSgk: body.requiresPublicSgk,
          status: body.status || "ACTIVE",
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
          effectiveFrom: body.effectiveFrom || null,
          effectiveUntil: body.effectiveUntil || null,
        },
      });
      await recordInsuranceAudit({
        actorUserId: user.id,
        action: "insurer.workspace.product_upsert",
        entityType: "InsuranceProduct",
        entityId: saved.id,
        metadata: { organizationId: org.id, insurerId: insurer.id, code: saved.code },
        req,
      });
      return NextResponse.json({ ok: true, product: saved });
    }

    if (action === "UPSERT_NETWORK") {
      const saved = await upsertInsurerNetworkRecord({
        insurerId: insurer.id,
        network: {
          id: body.id || null,
          productId: body.productId || null,
          code: String(body.code || ""),
          name: String(body.name || ""),
          tierLabel: body.tierLabel || null,
          tierRank: body.tierRank != null ? Number(body.tierRank) : 1,
          status: body.status || "ACTIVE",
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
          effectiveFrom: body.effectiveFrom || null,
          effectiveUntil: body.effectiveUntil || null,
        },
      });
      await recordInsuranceAudit({
        actorUserId: user.id,
        action: "insurer.workspace.network_upsert",
        entityType: "InsuranceNetwork",
        entityId: saved.id,
        metadata: { organizationId: org.id, insurerId: insurer.id, code: saved.code },
        req,
      });
      return NextResponse.json({ ok: true, network: saved });
    }

    if (action === "CREATE_AGREEMENT") {
      const saved = await createOrDeclareInsuranceAgreement({
        actorRole: user.role === "ADMIN" ? "ADMIN" : "INSURER",
        actorUserId: user.id,
        organizationId: body.targetOrganizationId || null,
        directoryInstitutionId: body.targetDirectoryInstitutionId || null,
        insuranceProviderId: insurer.id,
        productType: body.productType || null,
        productId: body.productId || null,
        networkId: body.networkId || null,
        coverageScope: body.coverageScope || "ALL_BRANCHES",
        requestedVerificationStatus: body.verificationStatus || null,
        effectiveFrom: body.effectiveFrom || null,
        expiresAt: body.expiresAt || null,
        note: body.note || null,
        specialtyRules: Array.isArray(body.specialtyRules) ? body.specialtyRules : [],
      });

      await recordInsuranceAudit({
        actorUserId: user.id,
        action: "insurer.workspace.agreement_upsert",
        entityType: "InsuranceProviderAgreement",
        entityId: saved.id,
        metadata: {
          organizationId: org.id,
          insurerId: insurer.id,
          facilityName: saved.facilityName,
          verificationStatus: saved.verificationStatus,
        },
        req,
      });

      return NextResponse.json({ ok: true, agreement: saved }, { status: 201 });
    }

    if (
      action === "CONFIRM_AGREEMENT" ||
      action === "DISPUTE_AGREEMENT" ||
      action === "EXPIRE_AGREEMENT"
    ) {
      const mappedAction =
        action === "CONFIRM_AGREEMENT"
          ? "CONFIRM"
          : action === "DISPUTE_AGREEMENT"
          ? "DISPUTE"
          : "EXPIRE";

      const updated = await mutateAgreementStatusInStore({
        agreementId: String(body.agreementId || ""),
        actor: {
          userId: user.id,
          role: user.role === "ADMIN" ? "ADMIN" : "INSURER",
          ownedInsurerProviderIds: [insurer.id],
        },
        action: mappedAction,
        reason: body.reason || null,
      });

      await recordInsuranceAudit({
        actorUserId: user.id,
        action: `insurer.workspace.agreement_${mappedAction.toLowerCase()}`,
        entityType: "InsuranceProviderAgreement",
        entityId: updated.id,
        metadata: {
          organizationId: org.id,
          insurerId: insurer.id,
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
        actorUserId: user.id,
        action: "insurer.workspace.agreement_remove",
        entityType: "InsuranceProviderAgreement",
        entityId: agreementId,
        metadata: { organizationId: org.id, insurerId: insurer.id },
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

