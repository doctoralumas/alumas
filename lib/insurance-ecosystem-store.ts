import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import {
  buildAgreementTupleKey,
  canClaimInsurer,
  CANONICAL_INSURER_CATALOG_METADATA,
  evaluateInsurerVerification,
  InsuranceDomainError,
  isInsurerPubliclyDiscoverable,
  normalizeInsurerIdentityKey,
  resolveAgreementFacilityTarget,
  resolveInitialAgreementVerificationStatus,
  transitionAgreementVerificationStatus,
  validateCanonicalInsurerEntry,
  type AgreementCoverageScope,
  type AgreementSource,
  type AgreementVerificationStatus,
  type CanonicalInsurerRecord,
  type CatalogLifecycleStatus,
  type InsuranceAgreementRecord,
  type InsuranceNetworkRecord,
  type InsurancePayerKind,
  type InsuranceProductRecord,
  type InsuranceProductType,
  type InsuranceProviderLifecycleStatus,
  type SpecialtyRuleRecord,
} from "@/lib/insurance-domain";
import { isOrganizationVerifiedByAlumas, normalizeTextKey } from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";

export interface EnrichedInsurerCatalogRecord extends CanonicalInsurerRecord {
  legalName: string | null;
  phone: string | null;
  claimsPhone: string | null;
  provisionPortalUrl: string | null;
  headquartersCity: string | null;
  headquartersDistrict: string | null;
  headquartersAddress: string | null;
  description: string | null;
  source: string;
  lastVerifiedAt: string | null;
  supportedProductTypes: InsuranceProductType[];
  products: InsuranceProductRecord[];
  networks: InsuranceNetworkRecord[];
  isVerifiedOrganization: boolean;
  verifiedOrganizationSlug: string | null;
  organizationStatus: string | null;
  confirmedAgreementCount: number;
  declaredAgreementCount: number;
  canClaim: boolean;
  claimBlockReason: string | null;
}

export interface EnrichedAgreementRecord extends InsuranceAgreementRecord {
  insurerName?: string;
  insurerSlug?: string;
  facilityName?: string;
  facilityCity?: string;
  facilityType?: string;
  facilitySlug?: string;
  isExternalDirectoryFacility?: boolean;
  productName?: string | null;
  networkName?: string | null;
}

export interface InsurerRepresentativeRecord {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleTitle: string;
  isPrimaryOwner: boolean;
  status: "ACTIVE" | "PENDING" | "REVOKED";
  addedAt: string;
}

interface IsolatedInsuranceOverlayState {
  insurers: Record<string, Partial<EnrichedInsurerCatalogRecord>>;
  customInsurers: EnrichedInsurerCatalogRecord[];
  deletedInsurerIds: string[];
  products: Record<string, InsuranceProductRecord[]>;
  networks: Record<string, InsuranceNetworkRecord[]>;
  agreements: EnrichedAgreementRecord[];
  deletedAgreementIds: string[];
  representatives: Record<string, InsurerRepresentativeRecord[]>;
  isolatedOrganizations: any[];
  isolatedClaims: any[];
  isolatedAuditLogs: any[];
}

const DEFAULT_CORPORATE_METADATA: Record<
  string,
  {
    legalName: string;
    canonicalCode: string;
    seddkLicenseRef: string;
    tsbMemberCode: string;
    claimsPhone: string;
    provisionPortalUrl: string;
    headquartersCity: string;
    headquartersDistrict: string;
    headquartersAddress: string;
  }
> = {
  allianz: {
    legalName: "Allianz Sigorta A.Ş.",
    canonicalCode: "TR-INS-ALLIANZ",
    seddkLicenseRef: "SEDDK-RUHSAT-ALLIANZ-001",
    tsbMemberCode: "TSB-001",
    claimsPhone: "0850 399 99 99",
    provisionPortalUrl: "https://www.allianz.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Ataşehir",
    headquartersAddress: "Allianz Tower, Küçükbakkalköy Mah. Kayışdağı Cad. No:1 Ataşehir",
  },
  "bupa-acibadem": {
    legalName: "Bupa Acıbadem Sigorta A.Ş.",
    canonicalCode: "TR-INS-BUPA-ACIBADEM",
    seddkLicenseRef: "SEDDK-RUHSAT-BUPA-002",
    tsbMemberCode: "TSB-002",
    claimsPhone: "444 9 555",
    provisionPortalUrl: "https://www.bupaacibadem.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Üsküdar",
    headquartersAddress: "Küçük Çamlıca Mah. Şehit İsmail Moray Sok. No:2/1 Üsküdar",
  },
  axa: {
    legalName: "AXA Sigorta A.Ş.",
    canonicalCode: "TR-INS-AXA",
    seddkLicenseRef: "SEDDK-RUHSAT-AXA-003",
    tsbMemberCode: "TSB-003",
    claimsPhone: "0850 222 0 999",
    provisionPortalUrl: "https://www.axasigorta.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Beyoğlu",
    headquartersAddress: "Meclisi Mebusan Cad. No:15 Salıpazarı Beyoğlu",
  },
  anadolu: {
    legalName: "Anadolu Anonim Türk Sigorta Şirketi",
    canonicalCode: "TR-INS-ANADOLU",
    seddkLicenseRef: "SEDDK-RUHSAT-ANADOLU-004",
    tsbMemberCode: "TSB-004",
    claimsPhone: "0850 724 0 850",
    provisionPortalUrl: "https://www.anadolusigorta.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Beşiktaş",
    headquartersAddress: "Rüzgarlıbahçe Mah. Çam Pınarı Sok. No:6 Kavacık / Beşiktaş",
  },
  mapfre: {
    legalName: "Mapfre Sigorta A.Ş.",
    canonicalCode: "TR-INS-MAPFRE",
    seddkLicenseRef: "SEDDK-RUHSAT-MAPFRE-005",
    tsbMemberCode: "TSB-005",
    claimsPhone: "0850 755 0 755",
    provisionPortalUrl: "https://www.mapfre.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Şişli",
    headquartersAddress: "Torun Tower, Fulya Mah. Büyükdere Cad. No:74/D Şişli",
  },
  sompo: {
    legalName: "Sompo Sigorta A.Ş.",
    canonicalCode: "TR-INS-SOMPO",
    seddkLicenseRef: "SEDDK-RUHSAT-SOMPO-006",
    tsbMemberCode: "TSB-006",
    claimsPhone: "0850 250 81 81",
    provisionPortalUrl: "https://www.somposigorta.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Beykoz",
    headquartersAddress: "Rüzgarlıbahçe Mah. Cumhuriyet Cad. No:10 Kavacık Beykoz",
  },
  "turkiye-sigorta": {
    legalName: "Türkiye Sigorta A.Ş.",
    canonicalCode: "TR-INS-TURKIYE",
    seddkLicenseRef: "SEDDK-RUHSAT-TS-007",
    tsbMemberCode: "TSB-007",
    claimsPhone: "0850 202 20 20",
    provisionPortalUrl: "https://www.turkiyesigorta.com.tr",
    headquartersCity: "İstanbul",
    headquartersDistrict: "Ümraniye",
    headquartersAddress: "Saray Mah. Dr. Adnan Büyükdeniz Cad. No:7/A Ümraniye",
  },
};

function getOverlayFilePath(): string {
  const customPath = process.env.ALUMAS_INSURANCE_OVERLAY_FILE;
  if (customPath) return customPath;
  return path.join(process.cwd(), ".next", "cache", "alumas-insurance-phase3-overlay.json");
}

function createEmptyOverlay(): IsolatedInsuranceOverlayState {
  return {
    insurers: {},
    customInsurers: [],
    deletedInsurerIds: [],
    products: {},
    networks: {},
    agreements: [],
    deletedAgreementIds: [],
    representatives: {},
    isolatedOrganizations: [],
    isolatedClaims: [],
    isolatedAuditLogs: [],
  };
}

export function readInsuranceOverlayState(): IsolatedInsuranceOverlayState {
  try {
    const file = getOverlayFilePath();
    if (!fs.existsSync(/*turbopackIgnore: true*/ file)) return createEmptyOverlay();
    const raw = fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...createEmptyOverlay(),
      ...parsed,
    };
  } catch {
    return createEmptyOverlay();
  }
}

export function writeInsuranceOverlayState(state: IsolatedInsuranceOverlayState): void {
  try {
    const file = getOverlayFilePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
    }
    fs.writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore file write errors in read-only environments
  }
}

export function resetInsuranceOverlayState(): void {
  try {
    const file = getOverlayFilePath();
    if (fs.existsSync(/*turbopackIgnore: true*/ file)) {
      fs.unlinkSync(/*turbopackIgnore: true*/ file);
    }
  } catch {
    // Ignore
  }
}

export const resetInsuranceEcosystemOverlay = resetInsuranceOverlayState;

function isIsolatedTestMode(): boolean {
  return (
    process.env.ALUMAS_ISOLATED_TEST_MODE === "1" ||
    process.env.NEXT_PUBLIC_DISABLE_INSURANCE_DB_WRITES === "true"
  );
}

export async function recordInsuranceAudit(params: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  const overlay = readInsuranceOverlayState();
  overlay.isolatedAuditLogs.unshift({
    id: `ins_audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId || null,
    metadata: params.metadata || {},
    createdAt: new Date().toISOString(),
  });
  if (overlay.isolatedAuditLogs.length > 250) {
    overlay.isolatedAuditLogs = overlay.isolatedAuditLogs.slice(0, 250);
  }
  writeInsuranceOverlayState(overlay);

  if (!isIsolatedTestMode()) {
    await audit({
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || undefined,
      metadata: params.metadata,
      req: params.req,
    }).catch(() => {});
  }
}

/**
 * Loads all canonical insurers, products, networks, linked organizations, and agreements.
 */
export async function loadFullInsuranceEcosystemState(options: {
  includeHidden?: boolean;
} = {}): Promise<{
  insurers: EnrichedInsurerCatalogRecord[];
  agreements: EnrichedAgreementRecord[];
  legacyContracts: Array<{
    id: string;
    organizationId: string;
    insuranceProviderId: string;
    isActive: boolean;
    note: string | null;
  }>;
  isolatedOrganizations: any[];
  isolatedClaims: any[];
  isolatedAuditLogs: any[];
  representatives: Record<string, InsurerRepresentativeRecord[]>;
}> {
  const overlay = readInsuranceOverlayState();
  const deletedInsurerSet = new Set(overlay.deletedInsurerIds);
  const deletedAgreementSet = new Set(overlay.deletedAgreementIds);

  // 1. Load base insurers, organizations, directory institutions, legacy contracts, and v57 tables if migrated
  const [
    dbInsurers,
    dbOrgs,
    dbDirs,
    dbLegacyContracts,
    dbProducts,
    dbNetworks,
    dbAgreements,
  ] = await Promise.all([
    prisma.insuranceProvider
      .findMany({
        orderBy: { name: "asc" },
      })
      .catch(() =>
        prisma.insuranceProvider
          .findMany({
            select: {
              id: true,
              name: true,
              slug: true,
              website: true,
              phone: true,
              description: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { name: "asc" },
          })
          .catch(() => [] as any[])
      ),
    prisma.organization
      .findMany({
        include: {
          verificationDocuments: true,
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      })
      .catch(() => [] as any[]),
    prisma.directoryInstitution
      .findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, type: true, city: true, district: true, address: true, organizationId: true },
      })
      .catch(() => [] as any[]),
    prisma.organizationInsurance
      .findMany({
        select: {
          id: true,
          organizationId: true,
          insuranceProviderId: true,
          isActive: true,
          note: true,
        },
      })
      .catch(() => [] as any[]),
    (prisma as any).insuranceProduct
      ?.findMany({ orderBy: { name: "asc" } })
      .catch(() => [] as any[]) ?? Promise.resolve([] as any[]),
    (prisma as any).insuranceNetwork
      ?.findMany({ orderBy: [{ tierRank: "asc" }, { name: "asc" }] })
      .catch(() => [] as any[]) ?? Promise.resolve([] as any[]),
    (prisma as any).insuranceProviderAgreement
      ?.findMany({
        include: {
          specialtyRules: true,
          product: true,
          network: true,
        },
        orderBy: { updatedAt: "desc" },
      })
      .catch(() => [] as any[]) ?? Promise.resolve([] as any[]),
  ]);

  const allOrgs = [...dbOrgs, ...overlay.isolatedOrganizations];
  const orgById = new Map<string, any>();
  for (const o of allOrgs) {
    orgById.set(o.id, o);
  }
  const dirById = new Map<string, any>();
  for (const d of dbDirs) {
    dirById.set(d.id, d);
  }

  // Merge DB insurers + custom overlay insurers
  const rawInsurersMap = new Map<string, any>();
  for (const row of dbInsurers) {
    if (!deletedInsurerSet.has(row.id)) {
      rawInsurersMap.set(row.id, row);
    }
  }
  for (const custom of overlay.customInsurers) {
    if (!deletedInsurerSet.has(custom.id)) {
      rawInsurersMap.set(custom.id, {
        ...rawInsurersMap.get(custom.id),
        ...custom,
      });
    }
  }

  // Build products & networks per insurer
  const productsByInsurer = new Map<string, InsuranceProductRecord[]>();
  const networksByInsurer = new Map<string, InsuranceNetworkRecord[]>();
  const productById = new Map<string, InsuranceProductRecord>();
  const networkById = new Map<string, InsuranceNetworkRecord>();

  for (const raw of rawInsurersMap.values()) {
    const patch = overlay.insurers[raw.id] || {};
    const slug = patch.slug || raw.slug;
    const canonical = CANONICAL_INSURER_CATALOG_METADATA[slug] || {
      supportedProductTypes: ["TSS", "OSS"] as InsuranceProductType[],
      products: [],
      networks: [],
    };

    const dbProdForInsurer = (dbProducts as any[]).filter(
      (p) => p.insuranceProviderId === raw.id
    );
    const baseProducts: InsuranceProductRecord[] =
      dbProdForInsurer.length > 0
        ? dbProdForInsurer.map((p) => ({
            id: p.id,
            insuranceProviderId: raw.id,
            code: p.code,
            slug: p.slug,
            name: p.name,
            productType: p.productType,
            requiresPublicSgk: Boolean(p.requiresPublicSgk),
            status: (p.status as CatalogLifecycleStatus) || "ACTIVE",
            isActive: Boolean(p.isActive),
            effectiveFrom: p.effectiveFrom ? new Date(p.effectiveFrom).toISOString() : null,
            effectiveUntil: p.effectiveUntil ? new Date(p.effectiveUntil).toISOString() : null,
          }))
        : canonical.products.map((cp) => ({
            id: cp.id,
            insuranceProviderId: raw.id,
            code: cp.code,
            slug: cp.slug,
            name: cp.name,
            productType: cp.productType,
            requiresPublicSgk: cp.requiresPublicSgk,
            status: "ACTIVE" as CatalogLifecycleStatus,
            isActive: true,
          }));

    const overlayProducts = overlay.products[raw.id];
    const mergedProductsMap = new Map<string, InsuranceProductRecord>();
    for (const p of baseProducts) mergedProductsMap.set(p.id, p);
    if (Array.isArray(overlayProducts)) {
      for (const op of overlayProducts) {
        mergedProductsMap.set(op.id, op);
      }
    }
    const finalProducts = Array.from(mergedProductsMap.values());
    productsByInsurer.set(raw.id, finalProducts);
    for (const p of finalProducts) productById.set(p.id, p);

    const dbNetForInsurer = (dbNetworks as any[]).filter(
      (n) => n.insuranceProviderId === raw.id
    );
    const baseNetworks: InsuranceNetworkRecord[] =
      dbNetForInsurer.length > 0
        ? dbNetForInsurer.map((n) => ({
            id: n.id,
            insuranceProviderId: raw.id,
            productId: n.productId || null,
            code: n.code,
            slug: n.slug,
            name: n.name,
            tierLabel: n.tierLabel || null,
            tierRank: Number(n.tierRank ?? 1),
            status: (n.status as CatalogLifecycleStatus) || "ACTIVE",
            isActive: Boolean(n.isActive),
            effectiveFrom: n.effectiveFrom ? new Date(n.effectiveFrom).toISOString() : null,
            effectiveUntil: n.effectiveUntil ? new Date(n.effectiveUntil).toISOString() : null,
          }))
        : canonical.networks.map((cn, idx) => ({
            id: cn.id,
            insuranceProviderId: raw.id,
            productId:
              finalProducts.find((p) => p.productType === cn.productType)?.id || null,
            code: cn.code,
            slug: cn.slug,
            name: cn.name,
            tierLabel: cn.tierLabel,
            tierRank: idx + 1,
            status: "ACTIVE" as CatalogLifecycleStatus,
            isActive: true,
          }));

    const overlayNetworks = overlay.networks[raw.id];
    const mergedNetworksMap = new Map<string, InsuranceNetworkRecord>();
    for (const n of baseNetworks) mergedNetworksMap.set(n.id, n);
    if (Array.isArray(overlayNetworks)) {
      for (const on of overlayNetworks) {
        mergedNetworksMap.set(on.id, on);
      }
    }
    const finalNetworks = Array.from(mergedNetworksMap.values());
    networksByInsurer.set(raw.id, finalNetworks);
    for (const n of finalNetworks) networkById.set(n.id, n);
  }

  // Merge DB agreements + overlay agreements
  const agreementsMap = new Map<string, EnrichedAgreementRecord>();
  for (const ag of dbAgreements as any[]) {
    if (deletedAgreementSet.has(ag.id)) continue;
    agreementsMap.set(ag.id, {
      id: ag.id,
      organizationInsuranceId: ag.organizationInsuranceId || null,
      organizationId: ag.organizationId || null,
      directoryInstitutionId: ag.directoryInstitutionId || null,
      insuranceProviderId: ag.insuranceProviderId,
      productType: ag.productType || ag.product?.productType || null,
      productId: ag.productId || null,
      networkId: ag.networkId || null,
      coverageScope: ag.coverageScope || "ALL_BRANCHES",
      verificationStatus: ag.verificationStatus || "UNVERIFIED",
      source: ag.source || "PROVIDER_DECLARATION",
      effectiveFrom: ag.effectiveFrom ? new Date(ag.effectiveFrom).toISOString() : null,
      expiresAt: ag.expiresAt ? new Date(ag.expiresAt).toISOString() : null,
      verifiedAt: ag.verifiedAt ? new Date(ag.verifiedAt).toISOString() : null,
      verifiedByUserId: ag.verifiedByUserId || null,
      declaredByUserId: ag.declaredByUserId || null,
      disputeReason: ag.disputeReason || null,
      note: ag.note || null,
      isActive: Boolean(ag.isActive),
      specialtyRules: Array.isArray(ag.specialtyRules) ? ag.specialtyRules : [],
    });
  }

  for (const oag of overlay.agreements) {
    if (deletedAgreementSet.has(oag.id)) continue;
    agreementsMap.set(oag.id, oag);
  }

  // Enrich agreements with insurer, facility, product, and network names
  const finalAgreements: EnrichedAgreementRecord[] = [];
  for (const ag of agreementsMap.values()) {
    const rawInsurer = rawInsurersMap.get(ag.insuranceProviderId);
    const patchInsurer = overlay.insurers[ag.insuranceProviderId] || {};
    const insurerName = patchInsurer.name || rawInsurer?.name || "Sigorta Kurumu";
    const insurerSlug = patchInsurer.slug || rawInsurer?.slug || "";

    const org = ag.organizationId ? orgById.get(ag.organizationId) : null;
    const dir = ag.directoryInstitutionId ? dirById.get(ag.directoryInstitutionId) : null;
    const prod = ag.productId ? productById.get(ag.productId) : null;
    const net = ag.networkId ? networkById.get(ag.networkId) : null;

    finalAgreements.push({
      ...ag,
      productType: ag.productType || prod?.productType || null,
      product: prod
        ? {
            id: prod.id,
            code: prod.code,
            slug: prod.slug,
            name: prod.name,
            productType: prod.productType,
          }
        : ag.product || null,
      network: net
        ? {
            id: net.id,
            code: net.code,
            slug: net.slug,
            name: net.name,
            tierLabel: net.tierLabel,
          }
        : ag.network || null,
      insurerName,
      insurerSlug,
      facilityName: org?.name || dir?.name || ag.facilityName || "Sağlık Kurumu",
      facilityCity: org?.city || dir?.city || ag.facilityCity || "İstanbul",
      facilityType: org?.type || dir?.type || ag.facilityType || "HOSPITAL",
      facilitySlug: org?.slug || dir?.slug || ag.facilitySlug || "",
      isExternalDirectoryFacility: Boolean(!org && dir),
      productName: prod?.name || ag.productName || null,
      networkName: net?.name || ag.networkName || null,
    });
  }

  // Build final EnrichedInsurerCatalogRecord list
  const finalInsurers: EnrichedInsurerCatalogRecord[] = [];
  for (const raw of rawInsurersMap.values()) {
    const patch = overlay.insurers[raw.id] || {};
    const slug = patch.slug || raw.slug;
    const isDemo = slug === "alumas-demo-sigorta" || raw.lifecycleStatus === "DEMO_INTERNAL";
    const corpMeta = DEFAULT_CORPORATE_METADATA[slug];
    const canonical = CANONICAL_INSURER_CATALOG_METADATA[slug];

    // Resolve if an approved INSURANCE_COMPANY organization is linked
    let linkedOrgId: string | null =
      patch.organizationId !== undefined
        ? patch.organizationId
        : raw.organizationId || null;

    if (!linkedOrgId && !isDemo) {
      const matchedApprovedInsurerOrg = allOrgs.find(
        (o) =>
          o.type === "INSURANCE_COMPANY" &&
          o.status === "APPROVED" &&
          normalizeInsurerIdentityKey(o.name) === normalizeInsurerIdentityKey(patch.name || raw.name)
      );
      if (matchedApprovedInsurerOrg) {
        linkedOrgId = matchedApprovedInsurerOrg.id;
      }
    }

    const linkedOrg = linkedOrgId ? orgById.get(linkedOrgId) || null : null;
    const isVerifiedOrg = Boolean(linkedOrg && isOrganizationVerifiedByAlumas(linkedOrg));

    const lifecycleStatus: InsuranceProviderLifecycleStatus = isDemo
      ? "DEMO_INTERNAL"
      : (patch.lifecycleStatus || raw.lifecycleStatus || "ACTIVE");
    const payerKind: InsurancePayerKind =
      patch.payerKind || raw.payerKind || "COMMERCIAL_INSURER";
    const isActive =
      patch.isActive !== undefined ? Boolean(patch.isActive) : Boolean(raw.isActive);
    const isPubliclyListed = isDemo
      ? false
      : patch.isPubliclyListed !== undefined
      ? Boolean(patch.isPubliclyListed)
      : raw.isPubliclyListed !== undefined
      ? Boolean(raw.isPubliclyListed)
      : true;
    const isClaimable =
      isDemo || payerKind === "PUBLIC_PAYER"
        ? false
        : patch.isClaimable !== undefined
        ? Boolean(patch.isClaimable)
        : raw.isClaimable !== undefined
        ? Boolean(raw.isClaimable)
        : true;

    const prods = productsByInsurer.get(raw.id) || [];
    const nets = networksByInsurer.get(raw.id) || [];
    const supportedProductTypes = Array.from(
      new Set<InsuranceProductType>([
        ...(canonical?.supportedProductTypes || []),
        ...prods.filter((p) => p.isActive).map((p) => p.productType),
      ])
    );

    const insurerAgreements = finalAgreements.filter(
      (a) => a.insuranceProviderId === raw.id && a.isActive
    );
    const confirmedAgreementCount = insurerAgreements.filter(
      (a) =>
        a.verificationStatus === "MUTUALLY_CONFIRMED" ||
        a.verificationStatus === "ADMIN_VERIFIED"
    ).length;
    const legacyCount = dbLegacyContracts.filter(
      (c) => c.insuranceProviderId === raw.id && c.isActive
    ).length;
    const declaredAgreementCount =
      insurerAgreements.filter(
        (a) =>
          a.verificationStatus === "PROVIDER_DECLARED" ||
          a.verificationStatus === "INSURER_DECLARED" ||
          a.verificationStatus === "UNVERIFIED"
      ).length + legacyCount;

    const baseRecord: CanonicalInsurerRecord = {
      id: raw.id,
      name: patch.name || raw.name,
      slug,
      payerKind,
      lifecycleStatus,
      canonicalCode: patch.canonicalCode ?? raw.canonicalCode ?? corpMeta?.canonicalCode ?? null,
      seddkLicenseRef: isDemo
        ? null
        : patch.seddkLicenseRef ?? raw.seddkLicenseRef ?? corpMeta?.seddkLicenseRef ?? null,
      tsbMemberCode: patch.tsbMemberCode ?? raw.tsbMemberCode ?? corpMeta?.tsbMemberCode ?? null,
      website: normalizeOfficialWebsiteUrl(
        patch.website ?? linkedOrg?.website ?? raw.website ?? null
      ),
      isActive,
      isPubliclyListed,
      isClaimable,
      organizationId: isVerifiedOrg ? linkedOrg.id : linkedOrgId,
      directoryInstitutionId: patch.directoryInstitutionId ?? raw.directoryInstitutionId ?? null,
    };

    // Check if there is a pending claim Organization for this insurer
    const hasPendingClaimOrg = allOrgs.some(
      (o) =>
        o.type === "INSURANCE_COMPANY" &&
        o.status === "PENDING" &&
        normalizeInsurerIdentityKey(o.name) === normalizeInsurerIdentityKey(baseRecord.name)
    );

    const claimEval = canClaimInsurer(baseRecord);
    const canClaimNow = claimEval.allowed && !hasPendingClaimOrg;
    const claimBlockReason = !claimEval.allowed
      ? claimEval.reason || null
      : hasPendingClaimOrg
      ? "Bu sigorta kurumu için incelemede olan bir kurumsal sahiplenme başvurusu bulunuyor."
      : null;

    const enriched: EnrichedInsurerCatalogRecord = {
      ...baseRecord,
      legalName: patch.legalName ?? raw.legalName ?? corpMeta?.legalName ?? `${baseRecord.name} A.Ş.`,
      phone: patch.phone ?? linkedOrg?.phone ?? raw.phone ?? corpMeta?.claimsPhone ?? null,
      claimsPhone: patch.claimsPhone ?? raw.claimsPhone ?? corpMeta?.claimsPhone ?? raw.phone ?? null,
      provisionPortalUrl:
        patch.provisionPortalUrl ?? raw.provisionPortalUrl ?? corpMeta?.provisionPortalUrl ?? baseRecord.website ?? null,
      headquartersCity:
        patch.headquartersCity ?? linkedOrg?.city ?? raw.headquartersCity ?? corpMeta?.headquartersCity ?? "İstanbul",
      headquartersDistrict:
        patch.headquartersDistrict ?? linkedOrg?.district ?? raw.headquartersDistrict ?? corpMeta?.headquartersDistrict ?? null,
      headquartersAddress:
        patch.headquartersAddress ?? linkedOrg?.address ?? raw.headquartersAddress ?? corpMeta?.headquartersAddress ?? null,
      description:
        patch.description ?? linkedOrg?.description ?? raw.description ?? null,
      source: raw.source || "ALUMAS_CATALOG",
      lastVerifiedAt:
        linkedOrg?.verifiedAt
          ? new Date(linkedOrg.verifiedAt).toISOString()
          : patch.lastVerifiedAt ?? (raw.lastVerifiedAt ? new Date(raw.lastVerifiedAt).toISOString() : null),
      supportedProductTypes,
      products: prods,
      networks: nets,
      isVerifiedOrganization: isVerifiedOrg,
      verifiedOrganizationSlug: isVerifiedOrg ? linkedOrg.slug : null,
      organizationStatus: linkedOrg?.status || (hasPendingClaimOrg ? "PENDING" : null),
      confirmedAgreementCount,
      declaredAgreementCount,
      canClaim: canClaimNow,
      claimBlockReason,
    };

    if (!options.includeHidden && !isInsurerPubliclyDiscoverable(enriched)) {
      continue;
    }

    finalInsurers.push(enriched);
  }

  return {
    insurers: finalInsurers,
    agreements: finalAgreements,
    legacyContracts: dbLegacyContracts,
    isolatedOrganizations: overlay.isolatedOrganizations,
    isolatedClaims: overlay.isolatedClaims,
    isolatedAuditLogs: overlay.isolatedAuditLogs,
    representatives: overlay.representatives,
  };
}

/**
 * Finds a single enriched insurer by `id`, `slug`, or linked `organizationId`.
 */
export async function findEnrichedInsurer(
  identifier: string,
  options: { includeHidden?: boolean } = {}
): Promise<
  | (EnrichedInsurerCatalogRecord & {
      insurer: EnrichedInsurerCatalogRecord;
      agreements: EnrichedAgreementRecord[];
    })
  | null
> {
  const { insurers, agreements } = await loadFullInsuranceEcosystemState(options);
  const norm = normalizeInsurerIdentityKey(identifier);
  const found =
    insurers.find(
      (i) =>
        i.id === identifier ||
        i.slug === identifier ||
        i.organizationId === identifier ||
        (norm.length >= 3 && normalizeInsurerIdentityKey(i.name) === norm)
    ) || null;
  if (!found) return null;
  const insurerAgreements = agreements.filter((a) => a.insuranceProviderId === found.id);
  return {
    ...found,
    insurer: found,
    agreements: insurerAgreements,
  };
}

/**
 * Links an approved `INSURANCE_COMPANY` Organization to its canonical `InsuranceProvider` record
 * without creating duplicate insurer records.
 */
export async function linkApprovedInsurerOrganization(params: {
  organization?: {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    district?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    description?: string | null;
    verifiedAt?: Date | string | null;
  };
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  claimedInsurerId?: string | null;
  claimedInsurerSlug?: string | null;
  headquartersCity?: string | null;
  headquartersDistrict?: string | null;
  headquartersAddress?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  actorUserId?: string | null;
  metadata?: {
    targetInsuranceProviderId?: string | null;
    seddkLicenseRef?: string | null;
    tsbMemberCode?: string | null;
    legalName?: string | null;
    claimsPhone?: string | null;
    provisionPortalUrl?: string | null;
  };
  seddkLicenseRef?: string | null;
  tsbMemberCode?: string | null;
  legalName?: string | null;
  claimsPhone?: string | null;
  provisionPortalUrl?: string | null;
}): Promise<EnrichedInsurerCatalogRecord> {
  const { insurers } = await loadFullInsuranceEcosystemState({ includeHidden: true });
  const orgObj = params.organization || {
    id: params.organizationId || "",
    name: params.organizationName || "",
    slug: params.organizationSlug || "",
    city: params.headquartersCity || "",
    district: params.headquartersDistrict || null,
    address: params.headquartersAddress || "",
    phone: params.phone || "",
    website: params.website || null,
    description: params.description || null,
  };
  const metaObj = params.metadata || {
    targetInsuranceProviderId: params.claimedInsurerId || params.claimedInsurerSlug || null,
    seddkLicenseRef: params.seddkLicenseRef || null,
    tsbMemberCode: params.tsbMemberCode || null,
    legalName: params.legalName || null,
    claimsPhone: params.claimsPhone || null,
    provisionPortalUrl: params.provisionPortalUrl || null,
  };

  const targetById = metaObj?.targetInsuranceProviderId
    ? insurers.find(
        (i) =>
          i.id === metaObj.targetInsuranceProviderId ||
          i.slug === metaObj.targetInsuranceProviderId
      )
    : null;
  const targetByName = insurers.find(
    (i) => normalizeInsurerIdentityKey(i.name) === normalizeInsurerIdentityKey(orgObj.name)
  );
  const existing = targetById || targetByName || null;

  const overlay = readInsuranceOverlayState();
  const nowIso = new Date().toISOString();

  // If this organization is in the isolated overlay store, mark it approved & verified
  const targetIsoOrg = overlay.isolatedOrganizations.find((o) => o.id === orgObj.id);
  if (targetIsoOrg) {
    targetIsoOrg.status = "APPROVED";
    targetIsoOrg.isPublished = true;
    targetIsoOrg.verifiedAt = nowIso;
    if (Array.isArray(targetIsoOrg.verificationDocuments)) {
      targetIsoOrg.verificationDocuments.forEach((d: any) => {
        d.status = "APPROVED";
      });
    }
  }

  if (existing) {
    if (existing.organizationId && existing.organizationId !== orgObj.id) {
      throw new InsuranceDomainError(
        "Bu sigorta kurumu zaten başka bir onaylı kurumsal hesaba bağlıdır.",
        "INSURER_ALREADY_CLAIMED",
        409
      );
    }

    const updatedPatch: Partial<EnrichedInsurerCatalogRecord> = {
      ...(overlay.insurers[existing.id] || {}),
      organizationId: orgObj.id,
      website: normalizeOfficialWebsiteUrl(orgObj.website) || existing.website,
      phone: orgObj.phone || existing.phone,
      headquartersCity: orgObj.city || existing.headquartersCity,
      headquartersDistrict: orgObj.district ?? existing.headquartersDistrict,
      headquartersAddress: orgObj.address || existing.headquartersAddress,
      description: orgObj.description || existing.description,
      seddkLicenseRef: metaObj?.seddkLicenseRef || existing.seddkLicenseRef,
      tsbMemberCode: metaObj?.tsbMemberCode || existing.tsbMemberCode,
      legalName: metaObj?.legalName || existing.legalName,
      claimsPhone: metaObj?.claimsPhone || existing.claimsPhone,
      provisionPortalUrl: metaObj?.provisionPortalUrl || existing.provisionPortalUrl,
      lastVerifiedAt: nowIso,
    };
    overlay.insurers[existing.id] = updatedPatch;
    writeInsuranceOverlayState(overlay);

    if (!isIsolatedTestMode()) {
      await (prisma.insuranceProvider as any)
        .update({
          where: { id: existing.id },
          data: {
            organizationId: orgObj.id,
            website: updatedPatch.website,
            phone: updatedPatch.phone,
            description: updatedPatch.description,
            seddkLicenseRef: updatedPatch.seddkLicenseRef,
            tsbMemberCode: updatedPatch.tsbMemberCode,
            legalName: updatedPatch.legalName,
            claimsPhone: updatedPatch.claimsPhone,
            provisionPortalUrl: updatedPatch.provisionPortalUrl,
            headquartersCity: updatedPatch.headquartersCity,
            headquartersDistrict: updatedPatch.headquartersDistrict,
            headquartersAddress: updatedPatch.headquartersAddress,
            lastVerifiedAt: new Date(nowIso),
          },
        })
        .catch(() => {});
    }

    return (await findEnrichedInsurer(existing.id, { includeHidden: true }))!;
  }

  // Otherwise create a new canonical insurer linked to this approved organization
  const slug = normalizeTextKey(orgObj.slug || orgObj.name);
  validateCanonicalInsurerEntry(
    {
      name: orgObj.name,
      slug,
      payerKind: "COMMERCIAL_INSURER",
      lifecycleStatus: "ACTIVE",
      seddkLicenseRef: metaObj?.seddkLicenseRef || null,
      isPubliclyListed: true,
      isClaimable: false,
      organizationId: orgObj.id,
    },
    insurers
  );

  let createdId = `ins_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  if (!isIsolatedTestMode()) {
    try {
      const dbCreated = await (prisma.insuranceProvider as any).create({
        data: {
          name: orgObj.name,
          slug,
          website: normalizeOfficialWebsiteUrl(orgObj.website),
          phone: orgObj.phone,
          description: orgObj.description,
          isActive: true,
          organizationId: orgObj.id,
          seddkLicenseRef: metaObj?.seddkLicenseRef || null,
          tsbMemberCode: metaObj?.tsbMemberCode || null,
          legalName: metaObj?.legalName || `${orgObj.name} A.Ş.`,
          claimsPhone: metaObj?.claimsPhone || orgObj.phone,
          provisionPortalUrl: metaObj?.provisionPortalUrl || normalizeOfficialWebsiteUrl(orgObj.website),
          headquartersCity: orgObj.city,
          headquartersDistrict: orgObj.district || null,
          headquartersAddress: orgObj.address,
          lastVerifiedAt: new Date(nowIso),
        },
      });
      createdId = dbCreated.id;
    } catch {
      // Fallback to overlay custom insurer if DB schema is pre-v57
    }
  }

  const newCustom: EnrichedInsurerCatalogRecord = {
    id: createdId,
    name: orgObj.name,
    slug,
    payerKind: "COMMERCIAL_INSURER",
    lifecycleStatus: "ACTIVE",
    canonicalCode: `TR-INS-${slug.toUpperCase().slice(0, 16)}`,
    legalName: metaObj?.legalName ?? `${orgObj.name} A.Ş.`,
    seddkLicenseRef: metaObj?.seddkLicenseRef ?? null,
    tsbMemberCode: metaObj?.tsbMemberCode ?? null,
    website: normalizeOfficialWebsiteUrl(orgObj.website) ?? null,
    phone: orgObj.phone ?? null,
    claimsPhone: metaObj?.claimsPhone ?? orgObj.phone ?? null,
    provisionPortalUrl: metaObj?.provisionPortalUrl ?? normalizeOfficialWebsiteUrl(orgObj.website) ?? null,
    headquartersCity: orgObj.city ?? null,
    headquartersDistrict: orgObj.district ?? null,
    headquartersAddress: orgObj.address ?? null,
    description: orgObj.description ?? null,
    isActive: true,
    isPubliclyListed: true,
    isClaimable: true,
    source: "ALUMAS_VERIFIED_INSURER",
    lastVerifiedAt: nowIso,
    organizationId: orgObj.id,
    directoryInstitutionId: null,
    supportedProductTypes: ["TSS", "OSS"],
    products: [],
    networks: [],
    isVerifiedOrganization: true,
    verifiedOrganizationSlug: orgObj.slug ?? null,
    organizationStatus: "APPROVED",
    confirmedAgreementCount: 0,
    declaredAgreementCount: 0,
    canClaim: false,
    claimBlockReason: "Bu sigorta kurumu zaten doğrulanmış bir kurumsal hesaba bağlıdır.",
  };

  overlay.customInsurers = [
    ...overlay.customInsurers.filter((c) => c.id !== createdId),
    newCustom,
  ];
  writeInsuranceOverlayState(overlay);

  return (await findEnrichedInsurer(createdId, { includeHidden: true })) || newCustom;
}

/**
 * Unlinks an `INSURANCE_COMPANY` Organization from its canonical `InsuranceProvider` when rejected or revoked.
 */
export async function unlinkInsurerOrganization(organizationId: string): Promise<void> {
  const overlay = readInsuranceOverlayState();
  for (const [insId, patch] of Object.entries(overlay.insurers)) {
    if (patch.organizationId === organizationId) {
      overlay.insurers[insId] = { ...patch, organizationId: null };
    }
  }
  overlay.customInsurers = overlay.customInsurers.map((c) =>
    c.organizationId === organizationId ? { ...c, organizationId: null, isVerifiedOrganization: false } : c
  );
  writeInsuranceOverlayState(overlay);

  if (!isIsolatedTestMode()) {
    await (prisma.insuranceProvider as any)
      .updateMany({
        where: { organizationId },
        data: { organizationId: null },
      })
      .catch(() => {});
  }
}

/**
 * Upserts an InsuranceProduct for a given insurer.
 */
export async function upsertInsurerProductRecord(params: {
  insurerId?: string;
  insuranceProviderId?: string;
  product?: {
    id?: string | null;
    code: string;
    name: string;
    productType: InsuranceProductType;
    requiresPublicSgk?: boolean;
    status?: CatalogLifecycleStatus;
    isActive?: boolean;
    effectiveFrom?: string | null;
    effectiveUntil?: string | null;
  };
  id?: string | null;
  code?: string;
  name?: string;
  productType?: InsuranceProductType;
  requiresPublicSgk?: boolean;
  status?: CatalogLifecycleStatus;
  isActive?: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  actorUserId?: string;
}): Promise<InsuranceProductRecord> {
  const insurerId = params.insurerId || params.insuranceProviderId || "";
  const product = params.product || {
    id: params.id,
    code: params.code || "",
    name: params.name || "",
    productType: params.productType || "TSS",
    requiresPublicSgk: params.requiresPublicSgk,
    status: params.status,
    isActive: params.isActive,
    effectiveFrom: params.effectiveFrom,
    effectiveUntil: params.effectiveUntil,
  };
  const code = String(product.code || "").trim().toUpperCase();
  const name = String(product.name || "").trim();
  const slug = normalizeTextKey(code || name);
  if (!code || !name) {
    throw new InsuranceDomainError("Sigorta ürün kodu ve adı zorunludur.", "INVALID_PRODUCT", 400);
  }

  const state = await loadFullInsuranceEcosystemState({ includeHidden: true });
  const insurer = state.insurers.find((i) => i.id === insurerId);
  if (!insurer) {
    throw new InsuranceDomainError("Sigorta kurumu bulunamadı.", "INSURER_NOT_FOUND", 404);
  }

  const existingList = insurer.products || [];
  const existingByCode = existingList.find(
    (p) => p.code.toUpperCase() === code || normalizeTextKey(p.slug) === slug
  );
  if (product.id && existingByCode && existingByCode.id !== product.id) {
    throw new InsuranceDomainError(
      `Bu ürün kodu (${code}) zaten başka bir üründe tanımlı.`,
      "DUPLICATE_PRODUCT_CODE",
      409
    );
  }

  let prodId = product.id || existingByCode?.id || `prod_${insurer.slug}_${slug}_${Date.now().toString(36)}`;
  const record: InsuranceProductRecord = {
    id: prodId,
    insuranceProviderId: insurer.id,
    code,
    slug,
    name,
    productType: product.productType,
    requiresPublicSgk:
      product.requiresPublicSgk !== undefined
        ? Boolean(product.requiresPublicSgk)
        : product.productType === "TSS",
    status: product.status || "ACTIVE",
    isActive: product.isActive !== undefined ? Boolean(product.isActive) : true,
    effectiveFrom: product.effectiveFrom || null,
    effectiveUntil: product.effectiveUntil || null,
  };

  if (!isIsolatedTestMode()) {
    try {
      const dbProd = await (prisma as any).insuranceProduct.upsert({
        where: product.id
          ? { id: product.id }
          : {
              insuranceProviderId_code: {
                insuranceProviderId: insurer.id,
                code,
              },
            },
        update: {
          code,
          slug,
          name,
          productType: record.productType,
          requiresPublicSgk: record.requiresPublicSgk,
          status: record.status,
          isActive: record.isActive,
          effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
          effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
        },
        create: {
          id: prodId,
          insuranceProviderId: insurer.id,
          code,
          slug,
          name,
          productType: record.productType,
          requiresPublicSgk: record.requiresPublicSgk,
          status: record.status,
          isActive: record.isActive,
          effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
          effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
        },
      });
      record.id = dbProd.id;
    } catch {
      // Fallback to overlay state if v57 table is not yet migrated
    }
  }

  const overlay = readInsuranceOverlayState();
  const currentOverlayProds = overlay.products[insurer.id] || existingList;
  overlay.products[insurer.id] = [
    ...currentOverlayProds.filter((p) => p.id !== record.id && p.code !== record.code),
    record,
  ];
  writeInsuranceOverlayState(overlay);

  return record;
}

/**
 * Upserts an InsuranceNetwork for a given insurer.
 */
export async function upsertInsurerNetworkRecord(params: {
  insurerId?: string;
  insuranceProviderId?: string;
  network?: {
    id?: string | null;
    productId?: string | null;
    code: string;
    name: string;
    tierLabel?: string | null;
    tierRank?: number;
    status?: CatalogLifecycleStatus;
    isActive?: boolean;
    effectiveFrom?: string | null;
    effectiveUntil?: string | null;
  };
  id?: string | null;
  productId?: string | null;
  code?: string;
  name?: string;
  tierLabel?: string | null;
  tierRank?: number;
  status?: CatalogLifecycleStatus;
  isActive?: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  actorUserId?: string;
}): Promise<InsuranceNetworkRecord> {
  const insurerId = params.insurerId || params.insuranceProviderId || "";
  const network = params.network || {
    id: params.id,
    productId: params.productId,
    code: params.code || "",
    name: params.name || "",
    tierLabel: params.tierLabel,
    tierRank: params.tierRank,
    status: params.status,
    isActive: params.isActive,
    effectiveFrom: params.effectiveFrom,
    effectiveUntil: params.effectiveUntil,
  };
  const code = String(network.code || "").trim().toUpperCase();
  const name = String(network.name || "").trim();
  const slug = normalizeTextKey(code || name);
  if (!code || !name) {
    throw new InsuranceDomainError("Anlaşmalı kurum ağı kodu ve adı zorunludur.", "INVALID_NETWORK", 400);
  }

  const state = await loadFullInsuranceEcosystemState({ includeHidden: true });
  const insurer = state.insurers.find((i) => i.id === insurerId);
  if (!insurer) {
    throw new InsuranceDomainError("Sigorta kurumu bulunamadı.", "INSURER_NOT_FOUND", 404);
  }

  const existingList = insurer.networks || [];
  const existingByCode = existingList.find(
    (n) => n.code.toUpperCase() === code || normalizeTextKey(n.slug) === slug
  );
  if (network.id && existingByCode && existingByCode.id !== network.id) {
    throw new InsuranceDomainError(
      `Bu ağ kodu (${code}) zaten başka bir ağda tanımlı.`,
      "DUPLICATE_NETWORK_CODE",
      409
    );
  }

  const netId = network.id || existingByCode?.id || `net_${insurer.slug}_${slug}_${Date.now().toString(36)}`;
  const record: InsuranceNetworkRecord = {
    id: netId,
    insuranceProviderId: insurer.id,
    productId: network.productId || null,
    code,
    slug,
    name,
    tierLabel: network.tierLabel ? String(network.tierLabel).trim() : name,
    tierRank: Number.isFinite(Number(network.tierRank)) ? Number(network.tierRank) : 1,
    status: network.status || "ACTIVE",
    isActive: network.isActive !== undefined ? Boolean(network.isActive) : true,
    effectiveFrom: network.effectiveFrom || null,
    effectiveUntil: network.effectiveUntil || null,
  };

  if (!isIsolatedTestMode()) {
    try {
      const dbNet = await (prisma as any).insuranceNetwork.upsert({
        where: network.id
          ? { id: network.id }
          : {
              insuranceProviderId_code: {
                insuranceProviderId: insurer.id,
                code,
              },
            },
        update: {
          productId: record.productId,
          code,
          slug,
          name,
          tierLabel: record.tierLabel,
          tierRank: record.tierRank,
          status: record.status,
          isActive: record.isActive,
          effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
          effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
        },
        create: {
          id: netId,
          insuranceProviderId: insurer.id,
          productId: record.productId,
          code,
          slug,
          name,
          tierLabel: record.tierLabel,
          tierRank: record.tierRank,
          status: record.status,
          isActive: record.isActive,
          effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
          effectiveUntil: record.effectiveUntil ? new Date(record.effectiveUntil) : null,
        },
      });
      record.id = dbNet.id;
    } catch {
      // Fallback to overlay state if v57 table is not yet migrated
    }
  }

  const overlay = readInsuranceOverlayState();
  const currentOverlayNets = overlay.networks[insurer.id] || existingList;
  overlay.networks[insurer.id] = [
    ...currentOverlayNets.filter((n) => n.id !== record.id && n.code !== record.code),
    record,
  ];
  writeInsuranceOverlayState(overlay);

  return record;
}

/**
 * Creates or updates an InsuranceProviderAgreement with strict role and facility branch validation.
 */
export async function createOrDeclareInsuranceAgreement(params: {
  actorRole: "ADMIN" | "PROVIDER" | "INSURER";
  actorUserId: string;
  organizationId?: string | null;
  directoryInstitutionId?: string | null;
  insuranceProviderId: string;
  productType?: InsuranceProductType | null;
  productId?: string | null;
  networkId?: string | null;
  coverageScope?: AgreementCoverageScope;
  requestedVerificationStatus?: AgreementVerificationStatus | null;
  effectiveFrom?: string | null;
  expiresAt?: string | null;
  note?: string | null;
  specialtyRules?: SpecialtyRuleRecord[];
}): Promise<EnrichedAgreementRecord> {
  const [state, dbOrgs, dbDirs] = await Promise.all([
    loadFullInsuranceEcosystemState({ includeHidden: true }),
    prisma.organization
      .findMany({ select: { id: true, name: true, slug: true, type: true, city: true, status: true } })
      .catch(() => [] as any[]),
    prisma.directoryInstitution
      .findMany({ select: { id: true, name: true, slug: true, type: true, city: true, organizationId: true, isActive: true } })
      .catch(() => [] as any[]),
  ]);

  const overlay = readInsuranceOverlayState();
  const allOrgs = [...dbOrgs, ...overlay.isolatedOrganizations];

  const insurer = state.insurers.find(
    (i) => i.id === params.insuranceProviderId || i.slug === params.insuranceProviderId
  );
  if (!insurer || insurer.slug === "alumas-demo-sigorta" || !insurer.isActive) {
    throw new InsuranceDomainError(
      "Seçilen sigorta kurumu bulunamadı veya aktif değil.",
      "INVALID_INSURER",
      400
    );
  }

  const resolvedTarget = resolveAgreementFacilityTarget(
    {
      organizationId: params.organizationId,
      directoryInstitutionId: params.directoryInstitutionId,
    },
    {
      organizations: allOrgs,
      directoryInstitutions: dbDirs,
    }
  );

  const initialStatus = resolveInitialAgreementVerificationStatus({
    actorRole: params.actorRole,
    requestedStatus: params.requestedVerificationStatus,
  });

  const resolvedProd = params.productId
    ? insurer.products.find(
        (p) => p.id === params.productId || p.slug === params.productId || p.code === params.productId
      ) || null
    : null;
  const resolvedNet = params.networkId
    ? insurer.networks.find(
        (n) => n.id === params.networkId || n.slug === params.networkId || n.code === params.networkId
      ) || null
    : null;
  const resolvedProductType =
    params.productType || resolvedProd?.productType || null;

  // Check if an agreement for the exact same (facility, insurer, productType, productId, networkId) tuple already exists
  const candidateTupleKey = `${resolvedTarget.organizationId || ""}::${
    resolvedTarget.directoryInstitutionId || ""
  }::${buildAgreementTupleKey({
    insuranceProviderId: insurer.id,
    productType: resolvedProductType,
    productId: resolvedProd?.id || params.productId || null,
    networkId: resolvedNet?.id || params.networkId || null,
  })}`;

  const existingAg = state.agreements.find((a) => {
    const aKey = `${a.organizationId || ""}::${a.directoryInstitutionId || ""}::${buildAgreementTupleKey(a)}`;
    return aKey === candidateTupleKey;
  });

  // Security rule: A healthcare provider CANNOT overwrite an INSURER_DECLARED, MUTUALLY_CONFIRMED, or ADMIN_VERIFIED agreement via declaration!
  if (
    existingAg &&
    params.actorRole === "PROVIDER" &&
    existingAg.verificationStatus !== "PROVIDER_DECLARED" &&
    existingAg.verificationStatus !== "UNVERIFIED"
  ) {
    throw new InsuranceDomainError(
      "Sigorta şirketi veya sistem yöneticisi tarafından doğrulanmış anlaşma kayıtları kurum tarafından doğrudan üzerine yazılamaz. Lütfen anlaşma onay veya uyuşmazlık/düzeltme bildirimini kullanın.",
      "CANNOT_OVERWRITE_INSURER_AGREEMENT",
      403
    );
  }

  const nowIso = new Date().toISOString();
  const agId =
    existingAg?.id || `ag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const orgObj = resolvedTarget.organizationId
    ? allOrgs.find((o: any) => o.id === resolvedTarget.organizationId)
    : null;
  const dirObj = resolvedTarget.directoryInstitutionId
    ? dbDirs.find((d: any) => d.id === resolvedTarget.directoryInstitutionId)
    : null;

  const cleanRules: SpecialtyRuleRecord[] = Array.isArray(params.specialtyRules)
    ? params.specialtyRules
        .filter((r) => r && String(r.specialtyCode || "").trim())
        .map((r) => ({
          id: r.id || `rule_${Math.random().toString(36).slice(2, 8)}`,
          specialtyCode: normalizeTextKey(r.specialtyCode).toUpperCase(),
          serviceCode: r.serviceCode ? String(r.serviceCode).trim() : null,
          ruleKind: r.ruleKind === "EXCLUDED" ? "EXCLUDED" : "INCLUDED",
          copayPercent:
            r.copayPercent != null && Number.isFinite(Number(r.copayPercent))
              ? Number(r.copayPercent)
              : null,
          note: r.note ? String(r.note).trim() : null,
        }))
    : existingAg?.specialtyRules || [];

  const record: EnrichedAgreementRecord = {
    id: agId,
    organizationInsuranceId: existingAg?.organizationInsuranceId || null,
    organizationId: resolvedTarget.organizationId,
    directoryInstitutionId: resolvedTarget.directoryInstitutionId,
    insuranceProviderId: insurer.id,
    productType: resolvedProductType,
    productId: resolvedProd?.id || params.productId || null,
    networkId: resolvedNet?.id || params.networkId || null,
    coverageScope: params.coverageScope || existingAg?.coverageScope || "ALL_BRANCHES",
    verificationStatus: initialStatus.verificationStatus,
    source: initialStatus.source,
    effectiveFrom: params.effectiveFrom ?? existingAg?.effectiveFrom ?? nowIso,
    expiresAt: params.expiresAt !== undefined ? params.expiresAt : existingAg?.expiresAt ?? null,
    verifiedAt:
      initialStatus.verificationStatus === "ADMIN_VERIFIED" ||
      initialStatus.verificationStatus === "MUTUALLY_CONFIRMED"
        ? nowIso
        : null,
    verifiedByUserId:
      initialStatus.verificationStatus === "ADMIN_VERIFIED" ||
      initialStatus.verificationStatus === "MUTUALLY_CONFIRMED"
        ? params.actorUserId
        : null,
    declaredByUserId: params.actorUserId,
    disputeReason: null,
    note: params.note !== undefined ? (params.note ? String(params.note).trim() : null) : existingAg?.note ?? null,
    isActive: true,
    specialtyRules: cleanRules,
    insurerName: insurer.name,
    insurerSlug: insurer.slug,
    facilityName: orgObj?.name || dirObj?.name || "Sağlık Kurumu",
    facilityCity: orgObj?.city || dirObj?.city || "İstanbul",
    facilityType: orgObj?.type || dirObj?.type || "HOSPITAL",
    facilitySlug: orgObj?.slug || dirObj?.slug || "",
    isExternalDirectoryFacility: Boolean(!orgObj && dirObj),
    productName: resolvedProd?.name || null,
    networkName: resolvedNet?.name || null,
  };

  if (!isIsolatedTestMode()) {
    try {
      let parentContractId: string | null = record.organizationInsuranceId || null;
      if (record.organizationId) {
        const parent = await prisma.organizationInsurance.upsert({
          where: {
            organizationId_insuranceProviderId: {
              organizationId: record.organizationId,
              insuranceProviderId: insurer.id,
            },
          },
          update: {
            isActive: true,
            note: record.note ?? undefined,
          },
          create: {
            organizationId: record.organizationId,
            insuranceProviderId: insurer.id,
            isActive: true,
            note: record.note ?? null,
          },
        });
        parentContractId = parent.id;
        record.organizationInsuranceId = parent.id;
      }

      if ((prisma as any).insuranceProviderAgreement) {
        const savedAg = existingAg
          ? await (prisma as any).insuranceProviderAgreement.update({
              where: { id: existingAg.id },
              data: {
                organizationInsuranceId: parentContractId,
                productType: record.productType,
                coverageScope: record.coverageScope,
                verificationStatus: record.verificationStatus,
                source: record.source,
                effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
                expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
                verifiedAt: record.verifiedAt ? new Date(record.verifiedAt) : null,
                verifiedByUserId: record.verifiedByUserId,
                declaredByUserId: record.declaredByUserId,
                disputeReason: null,
                note: record.note,
                isActive: true,
              },
            })
          : await (prisma as any).insuranceProviderAgreement.create({
              data: {
                id: record.id,
                organizationInsuranceId: parentContractId,
                organizationId: record.organizationId,
                directoryInstitutionId: record.directoryInstitutionId,
                insuranceProviderId: insurer.id,
                productType: record.productType,
                coverageScope: record.coverageScope,
                verificationStatus: record.verificationStatus,
                source: record.source,
                effectiveFrom: record.effectiveFrom ? new Date(record.effectiveFrom) : null,
                expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
                verifiedAt: record.verifiedAt ? new Date(record.verifiedAt) : null,
                verifiedByUserId: record.verifiedByUserId,
                declaredByUserId: record.declaredByUserId,
                note: record.note,
                isActive: true,
              },
            });
        record.id = savedAg.id;
      }
    } catch {
      // Fallback to overlay state if v57 table is not yet migrated
    }
  }

  overlay.agreements = [
    record,
    ...overlay.agreements.filter((a) => a.id !== record.id),
  ];
  overlay.deletedAgreementIds = overlay.deletedAgreementIds.filter((id) => id !== record.id);
  writeInsuranceOverlayState(overlay);

  return record;
}

/**
 * Transitions an agreement's verification status (CONFIRM, DISPUTE, EXPIRE, ADMIN_VERIFY)
 * while enforcing two-party and anti-self-confirmation rules.
 */
export async function mutateAgreementStatusInStore(params: {
  agreementId: string;
  actor: {
    userId: string;
    role: string;
    ownedOrganizationIds?: string[];
    ownedInsurerProviderIds?: string[];
  };
  action: "CONFIRM" | "DISPUTE" | "EXPIRE" | "ADMIN_VERIFY";
  reason?: string | null;
}): Promise<EnrichedAgreementRecord> {
  const state = await loadFullInsuranceEcosystemState({ includeHidden: true });
  const existing = state.agreements.find((a) => a.id === params.agreementId);
  if (!existing) {
    throw new InsuranceDomainError("Sigorta anlaşma kaydı bulunamadı.", "AGREEMENT_NOT_FOUND", 404);
  }

  const transitioned = transitionAgreementVerificationStatus({
    agreement: existing,
    actor: params.actor,
    action: params.action,
    reason: params.reason,
  });

  const updated: EnrichedAgreementRecord = {
    ...existing,
    ...transitioned,
  };

  if (!isIsolatedTestMode() && (prisma as any).insuranceProviderAgreement) {
    await (prisma as any).insuranceProviderAgreement
      .update({
        where: { id: updated.id },
        data: {
          verificationStatus: updated.verificationStatus,
          verifiedAt: updated.verifiedAt ? new Date(updated.verifiedAt) : null,
          verifiedByUserId: updated.verifiedByUserId,
          disputeReason: updated.disputeReason,
          isActive: updated.isActive,
        },
      })
      .catch(() => {});
  }

  const overlay = readInsuranceOverlayState();
  overlay.agreements = [
    updated,
    ...overlay.agreements.filter((a) => a.id !== updated.id),
  ];
  writeInsuranceOverlayState(overlay);

  return updated;
}

/**
 * Creates an isolated `INSURANCE_COMPANY` Organization application in overlay state
 * when `ALUMAS_ISOLATED_TEST_MODE="1"` so E2E tests never mutate production DB records.
 */
export async function createIsolatedInsurerApplication(params: {
  ownerUserId: string;
  ownerUser?: { id: string; name?: string | null; email?: string | null; phone?: string | null };
  name: string;
  slug: string;
  city: string;
  district?: string | null;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  description?: string | null;
  applicantRoleTitle?: string | null;
  applicantNote?: string | null;
  claimedInsurerId?: string | null;
  legalName?: string | null;
  seddkLicenseRef?: string | null;
  tsbMemberCode?: string | null;
  claimsPhone?: string | null;
  provisionPortalUrl?: string | null;
  documents: any[];
}): Promise<any> {
  const overlay = readInsuranceOverlayState();
  const nowIso = new Date().toISOString();
  const orgId = `iso_ins_org_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const createdOrg = {
    id: orgId,
    ownerUserId: params.ownerUserId,
    owner: params.ownerUser || {
      id: params.ownerUserId,
      name: "Kurumsal Sigorta Yetkilisi",
      email: params.email,
      phone: params.phone,
    },
    type: "INSURANCE_COMPANY",
    name: params.name,
    slug: params.slug,
    city: params.city,
    district: params.district || null,
    address: params.address,
    phone: params.phone,
    email: params.email,
    website: params.website || null,
    description: params.description || null,
    status: "PENDING",
    isPublished: false,
    verifiedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    claimedInsurerId: params.claimedInsurerId || null,
    legalName: params.legalName || null,
    seddkLicenseRef: params.seddkLicenseRef || null,
    tsbMemberCode: params.tsbMemberCode || null,
    claimsPhone: params.claimsPhone || null,
    provisionPortalUrl: params.provisionPortalUrl || null,
    applicantRoleTitle: params.applicantRoleTitle || null,
    applicantNote: params.applicantNote || null,
    verificationDocuments: (params.documents || []).map((d, idx) => ({
      id: `iso_doc_${orgId}_${idx + 1}`,
      organizationId: orgId,
      documentType: d.documentType,
      status: "PENDING",
      fileName: d.fileName || `${d.documentType}.pdf`,
      fileStoragePath: d.fileStoragePath || `isolated/${orgId}/${d.documentType}.pdf`,
      mimeType: d.mimeType || "application/pdf",
      fileSizeBytes: d.fileSizeBytes || 2048,
      referenceNo: d.referenceNo || params.seddkLicenseRef || null,
      issuedBy: d.issuedBy || "SEDDK / Ticaret Sicil",
      expiresAt: d.expiresAt || null,
      createdAt: nowIso,
    })),
  };

  overlay.isolatedOrganizations.unshift(createdOrg);
  writeInsuranceOverlayState(overlay);
  return createdOrg;
}

/**
 * Updates an insurer's corporate profile fields in both Prisma (if not isolated) and overlay store.
 */
export async function updateInsurerCorporateProfileInStore(params: {
  insurerId: string;
  organizationId?: string | null;
  patch: {
    name?: string;
    legalName?: string | null;
    seddkLicenseRef?: string | null;
    tsbMemberCode?: string | null;
    website?: string | null;
    phone?: string | null;
    claimsPhone?: string | null;
    provisionPortalUrl?: string | null;
    headquartersCity?: string | null;
    headquartersDistrict?: string | null;
    headquartersAddress?: string | null;
    description?: string | null;
    isPubliclyListed?: boolean;
    isActive?: boolean;
    lifecycleStatus?: InsuranceProviderLifecycleStatus;
  };
}): Promise<EnrichedInsurerCatalogRecord> {
  const found = await findEnrichedInsurer(params.insurerId, { includeHidden: true });
  if (!found) {
    throw new InsuranceDomainError("Sigorta kurumu bulunamadı.", "INSURER_NOT_FOUND", 404);
  }
  if (found.slug === "alumas-demo-sigorta" && params.patch.isPubliclyListed === true) {
    throw new InsuranceDomainError(
      "Dahili demo sigorta kaydı kamuya açık dizinde yayınlanamaz.",
      "DEMO_INSURER_PUBLICATION_BLOCKED",
      400
    );
  }

  const safeWebsite =
    params.patch.website !== undefined
      ? normalizeOfficialWebsiteUrl(params.patch.website)
      : found.website;
  const safePortalUrl =
    params.patch.provisionPortalUrl !== undefined
      ? normalizeOfficialWebsiteUrl(params.patch.provisionPortalUrl)
      : found.provisionPortalUrl;

  const overlay = readInsuranceOverlayState();
  const nextPatch: Partial<EnrichedInsurerCatalogRecord> = {
    ...(overlay.insurers[found.id] || {}),
    ...params.patch,
    website: safeWebsite,
    provisionPortalUrl: safePortalUrl,
    lastVerifiedAt: new Date().toISOString(),
  };
  overlay.insurers[found.id] = nextPatch;

  overlay.customInsurers = overlay.customInsurers.map((c) =>
    c.id === found.id ? { ...c, ...nextPatch } : c
  );

  if (params.organizationId) {
    overlay.isolatedOrganizations = overlay.isolatedOrganizations.map((org: any) =>
      org.id === params.organizationId
        ? {
            ...org,
            name: params.patch.name || org.name,
            city: params.patch.headquartersCity || org.city,
            district:
              params.patch.headquartersDistrict !== undefined
                ? params.patch.headquartersDistrict
                : org.district,
            address: params.patch.headquartersAddress || org.address,
            phone: params.patch.phone || org.phone,
            website: safeWebsite,
            description:
              params.patch.description !== undefined
                ? params.patch.description
                : org.description,
            legalName: params.patch.legalName ?? org.legalName,
            seddkLicenseRef: params.patch.seddkLicenseRef ?? org.seddkLicenseRef,
            tsbMemberCode: params.patch.tsbMemberCode ?? org.tsbMemberCode,
            claimsPhone: params.patch.claimsPhone ?? org.claimsPhone,
            provisionPortalUrl: safePortalUrl ?? org.provisionPortalUrl,
          }
        : org
    );
  }

  writeInsuranceOverlayState(overlay);

  if (!isIsolatedTestMode()) {
    await (prisma.insuranceProvider as any)
      .update({
        where: { id: found.id },
        data: {
          name: params.patch.name || found.name,
          website: safeWebsite,
          phone: params.patch.phone ?? found.phone,
          description: params.patch.description ?? found.description,
          isActive: params.patch.isActive ?? found.isActive,
          isPubliclyListed:
            found.slug === "alumas-demo-sigorta"
              ? false
              : params.patch.isPubliclyListed ?? found.isPubliclyListed,
          legalName: params.patch.legalName ?? found.legalName,
          seddkLicenseRef: params.patch.seddkLicenseRef ?? found.seddkLicenseRef,
          tsbMemberCode: params.patch.tsbMemberCode ?? found.tsbMemberCode,
          claimsPhone: params.patch.claimsPhone ?? found.claimsPhone,
          provisionPortalUrl: safePortalUrl,
          headquartersCity: params.patch.headquartersCity ?? found.headquartersCity,
          headquartersDistrict: params.patch.headquartersDistrict ?? found.headquartersDistrict,
          headquartersAddress: params.patch.headquartersAddress ?? found.headquartersAddress,
        },
      })
      .catch(() => {});

    if (params.organizationId && !String(params.organizationId).startsWith("iso_")) {
      await prisma.organization
        .update({
          where: { id: params.organizationId },
          data: {
            name: params.patch.name || undefined,
            city: params.patch.headquartersCity || undefined,
            district: params.patch.headquartersDistrict,
            address: params.patch.headquartersAddress || undefined,
            phone: params.patch.phone || undefined,
            website: safeWebsite,
            description: params.patch.description,
          },
        })
        .catch(() => {});
    }
  }

  return (await findEnrichedInsurer(found.id, { includeHidden: true }))!;
}

/**
 * Manages authorized representatives for an insurer.
 */
export function manageInsurerRepresentativeInStore(params: {
  insurerId: string;
  action: "ADD" | "REVOKE";
  representative?: {
    id?: string;
    userId?: string;
    name: string;
    email: string;
    roleTitle: string;
    isPrimaryOwner?: boolean;
  };
  representativeId?: string;
}): InsurerRepresentativeRecord[] {
  const overlay = readInsuranceOverlayState();
  const list = overlay.representatives[params.insurerId] || [];

  if (params.action === "ADD" && params.representative) {
    const newRep: InsurerRepresentativeRecord = {
      id: params.representative.id || `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: params.representative.userId || `usr_${Math.random().toString(36).slice(2, 7)}`,
      name: params.representative.name.trim(),
      email: params.representative.email.trim().toLowerCase(),
      roleTitle: params.representative.roleTitle.trim(),
      isPrimaryOwner: Boolean(params.representative.isPrimaryOwner),
      status: "ACTIVE",
      addedAt: new Date().toISOString(),
    };
    overlay.representatives[params.insurerId] = [
      ...list.filter((r) => r.email !== newRep.email),
      newRep,
    ];
  } else if (params.action === "REVOKE" && params.representativeId) {
    overlay.representatives[params.insurerId] = list.map((r) =>
      r.id === params.representativeId && !r.isPrimaryOwner
        ? { ...r, status: "REVOKED" }
        : r
    );
  }

  writeInsuranceOverlayState(overlay);
  return overlay.representatives[params.insurerId] || [];
}

/**
 * Deletes or deactivates an agreement from the store.
 */
export async function removeAgreementFromStore(agreementId: string): Promise<void> {
  const overlay = readInsuranceOverlayState();
  overlay.agreements = overlay.agreements.filter((a) => a.id !== agreementId);
  if (!overlay.deletedAgreementIds.includes(agreementId)) {
    overlay.deletedAgreementIds.push(agreementId);
  }
  writeInsuranceOverlayState(overlay);

  if (!isIsolatedTestMode() && (prisma as any).insuranceProviderAgreement) {
    await (prisma as any).insuranceProviderAgreement
      .delete({ where: { id: agreementId } })
      .catch(() => {});
  }
}
