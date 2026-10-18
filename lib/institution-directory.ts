import { prisma } from "@/lib/prisma";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import {
  CURATED_DIRECTORY_INSTITUTIONS,
  type DirectoryInstitutionRecord,
  type DirectoryOrganizationType,
} from "@/lib/directory-fixtures";
import { missingRequiredDocuments } from "@/lib/verification-requirements";

export type VerificationState =
  | "VERIFIED"
  | "PENDING_CLAIM"
  | "UNREGISTERED"
  | "SUSPENDED"
  | "REJECTED";

export type NavigationMode = "INTERNAL" | "EXTERNAL" | "NONE";

export interface NamedOffer {
  id: string;
  name: string;
}

export interface NormalizedDirectoryItem {
  id: string;
  directoryId: string | null;
  organizationId: string | null;
  slug: string;
  type: DirectoryOrganizationType;
  name: string;
  city: string;
  district: string | null;
  address: string;
  phone: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  rating: number | null;
  isOnDuty: boolean;
  onDutyUntil: string | null;
  // Verification & Ownership
  isVerified: boolean;
  verificationState: VerificationState;
  verifiedAt: string | null;
  // Navigation & Destination
  navigationMode: NavigationMode;
  primaryHref: string | null;
  isExternalDestination: boolean;
  officialWebsite: string | null;
  hasOfficialWebsite: boolean;
  canClaim: boolean;
  // Metadata & Offerings
  source: string;
  externalRef: string | null;
  lastVerifiedAt: string | null;
  _count: {
    doctors: number;
    reviews: number;
  };
  services: NamedOffer[];
  imagingExams: NamedOffer[];
  laboratoryTests: NamedOffer[];
}

export const ORG_TYPE_MAP: Record<string, DirectoryOrganizationType> = {
  HASTANE: "HOSPITAL",
  KLINIK: "CLINIC",
  ECZANE: "PHARMACY",
  LABORATUVAR: "LABORATORY",
  GORUNTULEME: "IMAGING_CENTER",
  HOSPITAL: "HOSPITAL",
  CLINIC: "CLINIC",
  PHARMACY: "PHARMACY",
  IMAGING_CENTER: "IMAGING_CENTER",
  LABORATORY: "LABORATORY",
};

export function normalizeTextKey(value: string | null | undefined): string {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const normalizeComparisonKey = normalizeTextKey;

export function canonicalInstitutionKey(
  name: string | null | undefined,
  city: string | null | undefined,
  type: string | null | undefined
): string {
  const normType = ORG_TYPE_MAP[String(type || "").toUpperCase()] || String(type || "").toUpperCase();
  return `${normType}::${normalizeTextKey(city)}::${normalizeTextKey(name)}`;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Determines whether an ALUMAS Organization record qualifies for the Blue ALUMAS Verified Badge.
 * Strictly requires:
 * 1. status === "APPROVED"
 * 2. isPublished === true
 * 3. verifiedAt != null
 * 4. No expired approved VerificationDocument
 * 5. If VerificationDocument records with documentType exist for the organization, all required documents for its type are APPROVED and non-expired.
 */
export interface OrganizationVerificationOptions {
  requireDocuments?: boolean;
}

export function isOrganizationVerifiedByAlumas(
  org: {
    status?: string | null;
    isPublished?: boolean | null;
    verifiedAt?: Date | string | null;
    type?: string | null;
    verificationDocuments?: Array<{
      documentType?: string | null;
      status: string;
      expiresAt?: Date | string | null;
    }> | null;
  } | null | undefined,
  now: Date = new Date(),
  options?: OrganizationVerificationOptions
): boolean {
  if (!org) return false;
  if (org.status !== "APPROVED") return false;
  if (org.isPublished !== true) return false;
  if (!org.verifiedAt) return false;

  const docs = org.verificationDocuments || [];
  const hasExpiredApproved = docs.some(
    (doc) =>
      doc.status === "APPROVED" &&
      doc.expiresAt != null &&
      new Date(doc.expiresAt).getTime() < now.getTime()
  );
  if (hasExpiredApproved) return false;

  const typedDocs = docs.filter(
    (d): d is { documentType: string; status: string; expiresAt?: Date | string | null } =>
      typeof d.documentType === "string" && d.documentType.length > 0
  );
  const enforceStrictDocuments =
    options?.requireDocuments ?? (process.env.STRICT_ORG_DOCUMENT_VERIFICATION !== "false");

  if (enforceStrictDocuments || typedDocs.length > 0) {
    const missing = missingRequiredDocuments("organization", org.type, typedDocs);
    if (missing.length > 0) return false;
  }

  return true;
}

export interface DirectoryBuildOptions {
  type?: string | null;
  city?: string | null;
  q?: string | null;
  onDuty?: boolean;
  unclaimedOnly?: boolean;
  lat?: number | null;
  lng?: number | null;
  now?: Date;
}

/**
 * Pure, deterministic builder that merges external/curated DirectoryInstitution records
 * with registered ALUMAS Organization records, enforces deduplication, badge eligibility,
 * suspension suppression, and internal vs external navigation contracts.
 */
export function buildNormalizedDirectoryItems(
  directoryRecords: DirectoryInstitutionRecord[],
  organizations: any[],
  options: DirectoryBuildOptions = {}
): NormalizedDirectoryItem[] {
  const now = options.now || new Date();
  const orgById = new Map<string, any>();
  const approvedOrgByCanonicalKey = new Map<string, any>();
  const consumedOrgIds = new Set<string>();

  for (const org of organizations) {
    orgById.set(org.id, org);
    if (isOrganizationVerifiedByAlumas(org, now)) {
      const key = canonicalInstitutionKey(org.name, org.city, org.type);
      if (!approvedOrgByCanonicalKey.has(key)) {
        approvedOrgByCanonicalKey.set(key, org);
      }
    }
  }

  const items: NormalizedDirectoryItem[] = [];
  const emittedCanonicalKeys = new Set<string>();

  // 1. Process DirectoryInstitution records (linking to approved ALUMAS organizations when applicable)
  for (const dir of directoryRecords) {
    if (!dir.isActive) continue;

    const dirCanonicalKey = canonicalInstitutionKey(dir.name, dir.city, dir.type);
    const claims = Array.isArray(dir.claims) ? dir.claims : [];
    const approvedClaim = claims.find((c: any) => c.status === "APPROVED");
    const pendingClaim = claims.find((c: any) => c.status === "PENDING");

    // Determine linked Organization
    const explicitOrgId = dir.organizationId || approvedClaim?.organizationId || null;
    const explicitOrg = explicitOrgId ? (dir.organization || orgById.get(explicitOrgId) || null) : null;
    const canonicalMatchedOrg = !explicitOrg ? approvedOrgByCanonicalKey.get(dirCanonicalKey) || null : null;
    const linkedOrg = explicitOrg || canonicalMatchedOrg;

    // If an explicitly linked organization (or an ALUMAS_APPROVED_BACKFILL row) is missing,
    // unpublished, suspended, rejected, or fails verification, suppress it completely so it
    // never degrades into an unverified external directory card.
    if (explicitOrgId || dir.source === "ALUMAS_APPROVED_BACKFILL") {
      if (explicitOrgId) consumedOrgIds.add(explicitOrgId);
      if (explicitOrg) consumedOrgIds.add(explicitOrg.id);
      if (
        !explicitOrg ||
        explicitOrg.status === "SUSPENDED" ||
        explicitOrg.status === "REJECTED" ||
        !isOrganizationVerifiedByAlumas(explicitOrg, now)
      ) {
        emittedCanonicalKeys.add(dirCanonicalKey);
        continue;
      }
    }

    // If linkedOrg is a verified ALUMAS organization, transition this directory listing in-place
    // to the verified internal ALUMAS profile without creating a duplicate card.
    if (linkedOrg && isOrganizationVerifiedByAlumas(linkedOrg, now)) {
      consumedOrgIds.add(linkedOrg.id);
      emittedCanonicalKeys.add(dirCanonicalKey);
      emittedCanonicalKeys.add(canonicalInstitutionKey(linkedOrg.name, linkedOrg.city, linkedOrg.type));

      items.push(
        formatVerifiedOrganizationItem(linkedOrg, dir.id, dir.officialWebsite, dir.source, dir.externalRef, options, now)
      );
      continue;
    }

    // Otherwise, this is an external / unregistered directory institution (or has a pending/rejected claim).
    if (emittedCanonicalKeys.has(dirCanonicalKey)) continue;
    emittedCanonicalKeys.add(dirCanonicalKey);

    // If there is a pending claim's Organization row, mark it consumed so it is never emitted separately
    for (const c of claims) {
      if (c?.organizationId) consumedOrgIds.add(c.organizationId);
    }

    const safeWebsite = normalizeOfficialWebsiteUrl(dir.officialWebsite);
    const hasPendingClaim = Boolean(pendingClaim);
    const lat = options.lat != null && Number.isFinite(options.lat) ? options.lat : null;
    const lng = options.lng != null && Number.isFinite(options.lng) ? options.lng : null;
    const distance =
      lat != null && lng != null && dir.latitude != null && dir.longitude != null
        ? Number(calculateDistanceKm(lat, lng, dir.latitude, dir.longitude).toFixed(1))
        : null;

    const dutyActive =
      Boolean(dir.isOnDuty) &&
      (!dir.onDutyUntil || new Date(dir.onDutyUntil).getTime() >= now.getTime());

    items.push({
      id: dir.id,
      directoryId: dir.id,
      organizationId: null,
      slug: dir.slug,
      type: dir.type,
      name: dir.name,
      city: dir.city,
      district: dir.district ?? null,
      address: dir.address,
      phone: dir.phone ?? "",
      description: dir.description ?? null,
      latitude: dir.latitude ?? null,
      longitude: dir.longitude ?? null,
      distanceKm: distance,
      rating: null,
      isOnDuty: dutyActive,
      onDutyUntil: dir.onDutyUntil ? new Date(dir.onDutyUntil).toISOString() : null,
      isVerified: false,
      verificationState: hasPendingClaim ? "PENDING_CLAIM" : "UNREGISTERED",
      verifiedAt: null,
      navigationMode: safeWebsite ? "EXTERNAL" : "NONE",
      primaryHref: safeWebsite,
      isExternalDestination: Boolean(safeWebsite),
      officialWebsite: safeWebsite,
      hasOfficialWebsite: Boolean(safeWebsite),
      canClaim: !hasPendingClaim,
      source: dir.source || "CURATED_PUBLIC_DIRECTORY",
      externalRef: dir.externalRef ?? null,
      lastVerifiedAt: dir.lastVerifiedAt ? new Date(dir.lastVerifiedAt).toISOString() : null,
      _count: { doctors: 0, reviews: 0 },
      services: [],
      imagingExams: [],
      laboratoryTests: [],
    });
  }

  // 2. Process remaining registered ALUMAS Organizations not already merged with a DirectoryInstitution
  for (const org of organizations) {
    if (consumedOrgIds.has(org.id)) continue;
    if (!isOrganizationVerifiedByAlumas(org, now)) continue;

    const orgKey = canonicalInstitutionKey(org.name, org.city, org.type);
    if (emittedCanonicalKeys.has(orgKey)) continue;
    emittedCanonicalKeys.add(orgKey);

    items.push(
      formatVerifiedOrganizationItem(org, null, org.website, "ALUMAS_VERIFIED", null, options, now)
    );
  }

  // 3. Apply filtering (type, city, onDuty, q)
  const filterType = options.type ? ORG_TYPE_MAP[options.type.toUpperCase()] || null : null;
  const filterCity = options.city ? normalizeTextKey(options.city) : null;
  const filterQ = options.q ? normalizeTextKey(options.q) : null;
  const filterQRaw = options.q ? options.q.trim().toLocaleLowerCase("tr-TR") : null;
  const filterOnDuty = Boolean(options.onDuty);
  const filterUnclaimedOnly = Boolean(options.unclaimedOnly);

  let filtered = items.filter((item) => {
    if (filterUnclaimedOnly && (item.isVerified || !item.canClaim)) return false;
    if (filterType && item.type !== filterType) return false;
    if (filterCity && normalizeTextKey(item.city) !== filterCity) return false;
    if (filterOnDuty) {
      if (item.type !== "PHARMACY" || !item.isOnDuty) return false;
    }
    if (filterQ && filterQRaw) {
      const haystack = [
        item.name,
        item.description || "",
        item.city,
        item.district || "",
        item.address,
        ...item.services.map((s) => s.name),
        ...item.imagingExams.map((e) => e.name),
        ...item.laboratoryTests.map((t) => t.name),
      ];
      const matchesRaw = haystack.some((h) => h.toLocaleLowerCase("tr-TR").includes(filterQRaw));
      const matchesNorm = haystack.some((h) => normalizeTextKey(h).includes(filterQ));
      if (!matchesRaw && !matchesNorm) return false;
    }
    return true;
  });

  // 4. Sorting:
  // If user coordinates are provided, sort by distance ascending.
  // Otherwise, sort Verified ALUMAS institutions first (by verifiedAt desc, name asc),
  // followed by external directory institutions (by name asc).
  const hasGeo =
    options.lat != null &&
    options.lng != null &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lng);

  if (hasGeo) {
    filtered = filtered.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
  } else {
    filtered = filtered.sort((a, b) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      if (a.isVerified && b.isVerified) {
        const tA = a.verifiedAt ? new Date(a.verifiedAt).getTime() : 0;
        const tB = b.verifiedAt ? new Date(b.verifiedAt).getTime() : 0;
        if (tA !== tB) return tB - tA;
      }
      return a.name.localeCompare(b.name, "tr-TR");
    });
  }

  return filtered;
}

function formatVerifiedOrganizationItem(
  org: any,
  directoryId: string | null,
  fallbackWebsite: string | null | undefined,
  source: string,
  externalRef: string | null,
  options: DirectoryBuildOptions,
  now: Date
): NormalizedDirectoryItem {
  const reviews: Array<{ rating: number }> = Array.isArray(org.reviews) ? org.reviews : [];
  const rating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : null;

  const lat = options.lat != null && Number.isFinite(options.lat) ? options.lat : null;
  const lng = options.lng != null && Number.isFinite(options.lng) ? options.lng : null;
  const distance =
    lat != null && lng != null && org.latitude != null && org.longitude != null
      ? Number(calculateDistanceKm(lat, lng, org.latitude, org.longitude).toFixed(1))
      : null;

  const dutyActive =
    Boolean(org.isOnDuty) &&
    (!org.onDutyUntil || new Date(org.onDutyUntil).getTime() >= now.getTime());

  const safeWebsite = normalizeOfficialWebsiteUrl(org.website || fallbackWebsite);

  return {
    id: org.id,
    directoryId: directoryId ?? null,
    organizationId: org.id,
    slug: org.slug,
    type: org.type as DirectoryOrganizationType,
    name: org.name,
    city: org.city,
    district: org.district ?? null,
    address: org.address,
    phone: org.phone ?? "",
    description: org.description ?? null,
    latitude: org.latitude ?? null,
    longitude: org.longitude ?? null,
    distanceKm: distance,
    rating,
    isOnDuty: dutyActive,
    onDutyUntil: org.onDutyUntil ? new Date(org.onDutyUntil).toISOString() : null,
    isVerified: true,
    verificationState: "VERIFIED",
    verifiedAt: org.verifiedAt ? new Date(org.verifiedAt).toISOString() : null,
    navigationMode: "INTERNAL",
    primaryHref: `/organizations/${org.slug}`,
    isExternalDestination: false,
    officialWebsite: safeWebsite,
    hasOfficialWebsite: Boolean(safeWebsite),
    canClaim: false,
    source,
    externalRef,
    lastVerifiedAt: org.verifiedAt ? new Date(org.verifiedAt).toISOString() : null,
    _count: {
      doctors: org._count?.doctors ?? 0,
      reviews: org._count?.reviews ?? reviews.length,
    },
    services: Array.isArray(org.services) ? org.services : [],
    imagingExams: Array.isArray(org.imagingExams) ? org.imagingExams : [],
    laboratoryTests: Array.isArray(org.laboratoryTests) ? org.laboratoryTests : [],
  };
}

/**
 * Loads DirectoryInstitution records from PostgreSQL (`DirectoryInstitution` table).
 * Never injects in-memory fixtures in `NODE_ENV === "production"`.
 * In local development (`NODE_ENV === "development"` or `ALLOW_DIRECTORY_FIXTURE_FALLBACK="true"`),
 * merges cleaned curated fixtures when they are not yet backfilled into PostgreSQL.
 */
export async function loadDirectoryInstitutionRecords(): Promise<DirectoryInstitutionRecord[]> {
  const byId = new Map<string, DirectoryInstitutionRecord>();
  const bySlug = new Map<string, DirectoryInstitutionRecord>();
  const isProduction = process.env.NODE_ENV === "production";
  const allowFixtureFallback =
    !isProduction &&
    (process.env.ALLOW_DIRECTORY_FIXTURE_FALLBACK === "true" ||
      (process.env.NODE_ENV === "development" &&
        process.env.ALLOW_DIRECTORY_FIXTURE_FALLBACK !== "false"));

  if (allowFixtureFallback) {
    for (const fixture of CURATED_DIRECTORY_INSTITUTIONS) {
      const copy: DirectoryInstitutionRecord = {
        ...fixture,
        claims: [],
      };
      byId.set(copy.id, copy);
      bySlug.set(copy.slug, copy);
    }
  }

  // Load authoritative records from PostgreSQL DirectoryInstitution table
  try {
    const dbRows = await prisma.directoryInstitution.findMany({
      include: {
        organization: {
          include: {
            verificationDocuments: true,
            services: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
            imagingExams: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
            laboratoryTests: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
            reviews: { where: { status: "APPROVED" }, select: { rating: true } },
            _count: { select: { doctors: true, reviews: { where: { status: "APPROVED" } } } },
          },
        },
        claims: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    for (const row of dbRows) {
      const record: DirectoryInstitutionRecord = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        type: row.type as DirectoryOrganizationType,
        city: row.city,
        district: row.district,
        address: row.address,
        phone: row.phone,
        officialWebsite: row.officialWebsite,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        isOnDuty: row.isOnDuty,
        onDutyUntil: row.onDutyUntil,
        source: row.source,
        externalRef: row.externalRef,
        lastVerifiedAt: row.lastVerifiedAt,
        isActive: row.isActive,
        organizationId: row.organizationId,
        organization: row.organization,
        claims: row.claims,
      };
      byId.set(record.id, record);
      bySlug.set(record.slug, record);
    }
  } catch {
    // Only fall back to curated fixtures if DB table is unavailable in non-production environments
    if (process.env.NODE_ENV !== "production" && byId.size === 0) {
      for (const fixture of CURATED_DIRECTORY_INSTITUTIONS) {
        const copy: DirectoryInstitutionRecord = {
          ...fixture,
          claims: [],
        };
        byId.set(copy.id, copy);
        bySlug.set(copy.slug, copy);
      }
    }
  }

  // Also hydrate any claim links recorded in AuditLog (supports environments prior to DB migration)
  try {
    const claimAudits = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "organization.claim.submit",
            "organization.claim.approved",
            "organization.claim.rejected",
          ],
        },
      },
      orderBy: { createdAt: "asc" },
    });

    for (const log of claimAudits) {
      const meta = (log.metadata || {}) as Record<string, any>;
      const dirId = typeof meta.directoryInstitutionId === "string" ? meta.directoryInstitutionId : null;
      const orgId = log.entityId || (typeof meta.organizationId === "string" ? meta.organizationId : null);
      if (!dirId || !orgId) continue;

      const target = byId.get(dirId) || bySlug.get(dirId);
      if (!target) continue;

      const claims = Array.isArray(target.claims) ? target.claims : [];
      const existingIdx = claims.findIndex((c: any) => c.organizationId === orgId);

      if (log.action === "organization.claim.submit") {
        const claimObj = {
          id: log.id,
          directoryInstitutionId: target.id,
          organizationId: orgId,
          claimantUserId: log.actorUserId,
          status: "PENDING",
          applicantRoleTitle: meta.applicantRoleTitle || null,
          applicantNote: meta.applicantNote || null,
          createdAt: log.createdAt,
        };
        if (existingIdx >= 0) claims[existingIdx] = claimObj;
        else claims.push(claimObj);
      } else if (log.action === "organization.claim.approved") {
        if (existingIdx >= 0) {
          claims[existingIdx].status = "APPROVED";
          claims[existingIdx].reviewedByUserId = log.actorUserId;
          claims[existingIdx].reviewedAt = log.createdAt;
        } else {
          claims.push({
            id: log.id,
            directoryInstitutionId: target.id,
            organizationId: orgId,
            claimantUserId: meta.claimantUserId || null,
            status: "APPROVED",
            reviewedByUserId: log.actorUserId,
            reviewedAt: log.createdAt,
          });
        }
        target.organizationId = orgId;
      } else if (log.action === "organization.claim.rejected") {
        if (existingIdx >= 0) {
          claims[existingIdx].status = "REJECTED";
          claims[existingIdx].reviewerNote = meta.reason || null;
          claims[existingIdx].reviewedByUserId = log.actorUserId;
          claims[existingIdx].reviewedAt = log.createdAt;
        }
        if (target.organizationId === orgId) {
          target.organizationId = null;
        }
      }
      target.claims = claims;
    }
  } catch {
    // Ignore audit log query errors if DB is offline in unit test context
  }

  return Array.from(byId.values());
}

/**
 * Finds a single DirectoryInstitution by id or slug.
 */
export async function findDirectoryInstitutionByIdOrSlug(
  idOrSlug: string
): Promise<DirectoryInstitutionRecord | null> {
  const all = await loadDirectoryInstitutionRecords();
  return (
    all.find((item) => item.id === idOrSlug || item.slug === idOrSlug) || null
  );
}

/**
 * Full server-side query returning normalized directory items for `/api/organizations`.
 */
export async function queryNormalizedDirectory(
  options: DirectoryBuildOptions = {}
): Promise<NormalizedDirectoryItem[]> {
  const [directoryRecords, organizations] = await Promise.all([
    loadDirectoryInstitutionRecords(),
    prisma.organization.findMany({
      include: {
        verificationDocuments: true,
        services: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
        imagingExams: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
        laboratoryTests: { where: { isActive: true }, take: 4, select: { id: true, name: true } },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        _count: { select: { doctors: true, reviews: { where: { status: "APPROVED" } } } },
      },
      orderBy: [{ verifiedAt: "desc" }, { name: "asc" }],
    }),
  ]);

  return buildNormalizedDirectoryItems(directoryRecords, organizations, options);
}
