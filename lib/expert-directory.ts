import { prisma } from "@/lib/prisma";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import { resolveSearchSpecialties } from "@/lib/search-aliases";
import { missingRequiredDocuments } from "@/lib/verification-requirements";
import { matchesSpecialtyFilter } from "@/lib/specialty-taxonomy";
import { evaluateClaimIdentityMatch } from "@/lib/claim-identity-verification";

export type ExpertVerificationState =
  | "VERIFIED"
  | "PENDING_CLAIM"
  | "UNREGISTERED";

export type ExpertNavigationMode = "INTERNAL" | "EXTERNAL" | "NONE";

export interface NormalizedExpertItem {
  id: string;
  directoryId: string | null;
  doctorId: string | null;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  hospital: string;
  city: string;
  district: string | null;
  phone: string;
  rating: number | null;
  reviewCount: number;
  presenceStatus: string;
  // Verification & Badges
  isVerified: boolean;
  verificationState: ExpertVerificationState;
  verifiedAt: string | null;
  isOfficialSource: boolean;
  // Navigation & Destination
  navigationMode: ExpertNavigationMode;
  primaryHref: string | null;
  isExternalDestination: boolean;
  officialWebsite: string | null;
  hasOfficialWebsite: boolean;
  canClaim: boolean;
  // Metadata & Offerings
  source: string;
  externalRef: string | null;
  price: number | null;
  bio: string | null;
  nextSlot: string | null;
}

export interface DirectoryDoctorRecord {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  hospital: string | null;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  officialWebsite: string | null;
  description: string | null;
  source: string;
  externalRef: string | null;
  lastVerifiedAt: Date | string | null;
  isActive: boolean;
  doctorId: string | null;
  doctor?: any;
  claims?: any[];
}

export const OFFICIAL_REGISTRY_SOURCES = new Set([
  "MINISTRY_OF_HEALTH",
  "SAGLIK_BAKANLIGI",
  "TITCK",
  "TABIP_ODASI",
  "DIS_HEKIMLERI_ODASI",
  "OFFICIAL_REGISTRY",
  "GOV_TURKIYE",
]);

/**
 * Determines whether a directory source string originates from an official, authoritative registry.
 * Records that are not from an official registry source must not display "Resmî Dizin Kaydı".
 */
export function isOfficialRegistrySource(source: string | null | undefined): boolean {
  if (!source) return false;
  const upper = String(source).trim().toUpperCase();
  if (OFFICIAL_REGISTRY_SOURCES.has(upper)) return true;
  if (upper.startsWith("MOH_") || upper.startsWith("OFFICIAL_") || upper.startsWith("GOV_")) return true;
  return false;
}

/**
 * Strips known medical/specialist titles and honorifics from a name for clean matching.
 * Handles physicians, dentists, psychologists, dietitians, physiotherapists and academics.
 */
export function cleanProfessionalName(rawName: string | null | undefined): string {
  if (!rawName) return "";
  let current = rawName;
  let prev = "";
  const titleRegex = /(?:^|\s+)(prof\s*\.?\s*dr\s*\.?|doç\s*\.?\s*dr\s*\.?|doc\s*\.?\s*dr\s*\.?|uzm\s*\.?\s*dr\s*\.?|op\s*\.?\s*dr\s*\.?|dr\s*\.?|uzm\s*\.?\s*dt\s*\.?|dt\s*\.?|uzm\s*\.?\s*dyt\s*\.?|dyt\s*\.?|uzm\s*\.?\s*fzt\s*\.?|fzt\s*\.?|uzm\s*\.?\s*psk\s*\.?|psk\s*\.?|klinik\s+psk\s*\.?)(?=\s+|$)/giu;

  while (current !== prev) {
    prev = current;
    current = current.replace(titleRegex, " ");
  }

  return current
    .replace(/^[\s.,;:\-]+|[\s.,;:\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function canonicalExpertKey(
  name: string | null | undefined,
  city: string | null | undefined,
  specialty: string | null | undefined
): string {
  const cleanName = cleanProfessionalName(name);
  return `${normalizeTextKey(specialty)}::${normalizeTextKey(city)}::${normalizeTextKey(cleanName || name)}`;
}

/**
 * Determines whether a registered Doctor qualifies for the Blue ALUMAS Verified Badge.
 * Strictly requires:
 * 1. isVerified === true
 * 2. isPublished === true
 * 3. userId !== null (linked to an authenticated active User)
 * 4. No expired approved VerificationDocument
 * 5. If documents exist, all required credentials (IDENTITY, MEDICAL_LICENSE) must be approved
 */
export function isDoctorVerifiedByAlumas(
  doctor: {
    isVerified?: boolean | null;
    isPublished?: boolean | null;
    userId?: string | null;
    verificationDocuments?: Array<{
      documentType?: string;
      status: string;
      expiresAt?: Date | string | null;
    }> | null;
  } | null | undefined,
  now: Date = new Date(),
  options?: { requireDocuments?: boolean }
): boolean {
  if (!doctor) return false;
  if (doctor.isVerified !== true) return false;
  if (doctor.isPublished !== true) return false;
  if (!doctor.userId) return false;

  const docs = doctor.verificationDocuments || [];
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
    options?.requireDocuments ?? (process.env.STRICT_DOCTOR_DOCUMENT_VERIFICATION !== "false");

  if (enforceStrictDocuments || typedDocs.length > 0) {
    const missing = missingRequiredDocuments("doctor", null, typedDocs);
    if (missing.length > 0) return false;
  }

  return true;
}

export interface ExpertDirectoryBuildOptions {
  specialty?: string | null;
  city?: string | null;
  q?: string | null;
  unclaimedOnly?: boolean;
  now?: Date;
}

/**
 * Pure, deterministic builder that merges external/curated DirectoryDoctor records
 * with registered ALUMAS Doctor records, enforces deduplication, badge eligibility,
 * and internal vs external navigation contracts.
 */
export function buildNormalizedExpertItems(
  directoryRecords: DirectoryDoctorRecord[] = [],
  doctors: any[] = [],
  options: ExpertDirectoryBuildOptions = {}
): NormalizedExpertItem[] {
  const now = options.now || new Date();
  const doctorById = new Map<string, any>();
  const approvedDoctorByCanonicalKey = new Map<string, any>();
  const consumedDoctorIds = new Set<string>();

  for (const doc of doctors) {
    doctorById.set(doc.id, doc);
    if (isDoctorVerifiedByAlumas(doc, now)) {
      const key = canonicalExpertKey(doc.name, doc.city, doc.specialty);
      if (!approvedDoctorByCanonicalKey.has(key)) {
        approvedDoctorByCanonicalKey.set(key, doc);
      }
    }
  }

  const items: NormalizedExpertItem[] = [];
  const emittedCanonicalKeys = new Set<string>();

  // 1. Process DirectoryDoctor records
  for (const dir of directoryRecords) {
    if (!dir.isActive) continue;

    const dirCanonicalKey = canonicalExpertKey(dir.name, dir.city, dir.specialty);
    const claims = Array.isArray(dir.claims) ? dir.claims : [];
    const approvedClaim = claims.find((c: any) => c.status === "APPROVED");
    const pendingClaim = claims.find((c: any) => c.status === "PENDING");

    // Determine linked Doctor
    const explicitDocId = dir.doctorId || approvedClaim?.doctorId || null;
    const explicitDoc = explicitDocId
      ? dir.doctor || doctorById.get(explicitDocId) || null
      : null;
    const canonicalMatchedDoc = !explicitDoc
      ? approvedDoctorByCanonicalKey.get(dirCanonicalKey) || null
      : null;
    const linkedDoc = explicitDoc || canonicalMatchedDoc;

    // If linkedDoc is an approved & verified ALUMAS doctor, verify identity match before transition
    const idMatch = linkedDoc ? evaluateClaimIdentityMatch(linkedDoc.name, dir.name) : { matches: false };

    if (linkedDoc && idMatch.matches && isDoctorVerifiedByAlumas(linkedDoc, now)) {
      consumedDoctorIds.add(linkedDoc.id);
      emittedCanonicalKeys.add(dirCanonicalKey);
      emittedCanonicalKeys.add(
        canonicalExpertKey(linkedDoc.name, linkedDoc.city, linkedDoc.specialty)
      );

      items.push(formatDoctorItem(linkedDoc, dir.id, dir.officialWebsite, dir.source, dir.externalRef, true));
      continue;
    }

    // Otherwise, this is an external / unregistered directory doctor (or has a pending claim).
    if (emittedCanonicalKeys.has(dirCanonicalKey)) continue;
    emittedCanonicalKeys.add(dirCanonicalKey);

    if (pendingClaim?.doctorId) {
      consumedDoctorIds.add(pendingClaim.doctorId);
    }

    const safeWebsite = normalizeOfficialWebsiteUrl(dir.officialWebsite);
    const hasPendingClaim = Boolean(pendingClaim);
    const isOfficial = isOfficialRegistrySource(dir.source);

    items.push({
      id: dir.id,
      directoryId: dir.id,
      doctorId: null,
      slug: dir.slug,
      name: dir.name,
      title: dir.title || "Uzm. Dr.",
      specialty: dir.specialty,
      hospital: dir.hospital || "",
      city: dir.city || "İstanbul",
      district: dir.district ?? null,
      phone: dir.phone ?? "",
      rating: null,
      reviewCount: 0,
      presenceStatus: "OFFLINE",
      isVerified: false,
      verificationState: hasPendingClaim ? "PENDING_CLAIM" : "UNREGISTERED",
      verifiedAt: null,
      isOfficialSource: isOfficial,
      navigationMode: safeWebsite ? "EXTERNAL" : "NONE",
      primaryHref: safeWebsite,
      isExternalDestination: Boolean(safeWebsite),
      officialWebsite: safeWebsite,
      hasOfficialWebsite: Boolean(safeWebsite),
      canClaim: !hasPendingClaim,
      source: dir.source || "CURATED_PUBLIC_DIRECTORY",
      externalRef: dir.externalRef ?? null,
      price: null,
      bio: dir.description ?? null,
      nextSlot: null,
    });
  }

  // 2. Process remaining registered ALUMAS Doctors not already merged with a DirectoryDoctor
  for (const doc of doctors) {
    if (consumedDoctorIds.has(doc.id)) continue;
    if (doc.isPublished === false) continue;

    const docKey = canonicalExpertKey(doc.name, doc.city, doc.specialty);
    if (emittedCanonicalKeys.has(docKey)) continue;
    emittedCanonicalKeys.add(docKey);

    const verified = isDoctorVerifiedByAlumas(doc, now);
    items.push(
      formatDoctorItem(
        doc,
        null,
        null,
        verified ? "ALUMAS_VERIFIED" : "ALUMAS_REGISTERED",
        null,
        verified
      )
    );
  }

  // 3. Apply filtering
  const filterCity = options.city ? normalizeTextKey(options.city) : null;
  const filterQ = options.q ? normalizeTextKey(options.q) : null;
  const filterQRaw = options.q ? options.q.trim().toLocaleLowerCase("tr-TR") : null;
  const filterUnclaimedOnly = Boolean(options.unclaimedOnly);

  const filtered = items.filter((item) => {
    if (filterUnclaimedOnly && (item.isVerified || !item.canClaim)) return false;
    if (options.specialty && !matchesSpecialtyFilter(item.specialty, options.specialty)) {
      return false;
    }
    if (filterCity && normalizeTextKey(item.city) !== filterCity) return false;
    if (filterQ && filterQRaw) {
      const aliasSpecialties = resolveSearchSpecialties(filterQRaw).map(normalizeTextKey);
      const matchesSpecialtyAlias = aliasSpecialties.includes(normalizeTextKey(item.specialty));

      const haystack = [
        item.name,
        cleanProfessionalName(item.name),
        item.title,
        item.specialty,
        item.hospital,
        item.city,
        item.district || "",
        item.bio || "",
      ]
        .map(normalizeTextKey)
        .join(" ");

      const matchesHaystack = haystack.includes(filterQ);
      if (!matchesHaystack && !matchesSpecialtyAlias) return false;
    }
    return true;
  });

  return filtered;
}

function formatDoctorItem(
  doc: any,
  directoryId: string | null,
  externalWebsite: string | null,
  source: string,
  externalRef: string | null,
  isVerified: boolean = true
): NormalizedExpertItem {
  const safeExternal = normalizeOfficialWebsiteUrl(externalWebsite);
  const reviews = Array.isArray(doc.reviews) ? doc.reviews : [];
  const reviewCount = reviews.length || doc.reviewCount || 0;
  const avgRating = reviews.length
    ? Number((reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
    : doc.rating ?? 5.0;

  const isOfficial = isOfficialRegistrySource(source);

  return {
    id: doc.id,
    directoryId,
    doctorId: doc.id,
    slug: doc.slug,
    name: doc.name,
    title: doc.title || "Uzm. Dr.",
    specialty: doc.specialty,
    hospital: doc.organization?.name || doc.hospital || "",
    city: doc.city || "İstanbul",
    district: null,
    phone: "",
    rating: reviewCount > 0 ? avgRating : null,
    reviewCount,
    presenceStatus: doc.presenceStatus || "OFFLINE",
    isVerified,
    verificationState: isVerified ? "VERIFIED" : "UNREGISTERED",
    verifiedAt: isVerified && doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    isOfficialSource: isOfficial,
    navigationMode: "INTERNAL",
    primaryHref: `/doctors/${doc.slug}`,
    isExternalDestination: false,
    officialWebsite: safeExternal,
    hasOfficialWebsite: Boolean(safeExternal),
    canClaim: false,
    source,
    externalRef,
    price: doc.price ?? null,
    bio: doc.bio ?? null,
    nextSlot: doc.nextSlot ?? null,
  };
}

export async function queryNormalizedExperts(
  options: ExpertDirectoryBuildOptions = {}
): Promise<NormalizedExpertItem[]> {
  const [directoryDoctors, registeredDoctors] = await Promise.all([
    prisma.directoryDoctor.findMany({
      where: { isActive: true },
      include: {
        claims: true,
        doctor: {
          include: {
            verificationDocuments: true,
            reviews: { where: { status: "APPROVED" }, select: { rating: true } },
            organization: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.doctor.findMany({
      where: { isPublished: true },
      include: {
        verificationDocuments: true,
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        organization: { select: { name: true, slug: true } },
      },
      orderBy: [{ rating: "desc" }, { name: "asc" }],
    }),
  ]);

  return buildNormalizedExpertItems(directoryDoctors as any, registeredDoctors, options);
}

export async function findDirectoryDoctorByIdOrSlug(
  idOrSlug: string
): Promise<DirectoryDoctorRecord | null> {
  if (!idOrSlug) return null;
  const doc = await prisma.directoryDoctor.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true,
    },
    include: {
      claims: true,
      doctor: true,
    },
  });
  return doc as any;
}

/**
 * Searches for potential matching unclaimed DirectoryDoctor records for a registering professional.
 * Strictly used to OFFER claiming — never automatically binds or claims without explicit user action.
 */
export async function findPotentialDirectoryDoctorMatches(options: {
  name: string;
  city?: string | null;
  specialty?: string | null;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    name: string;
    title: string;
    specialty: string;
    hospital: string | null;
    city: string;
    source: string;
    officialWebsite: string | null;
    isOfficialSource: boolean;
  }>
> {
  const cleaned = cleanProfessionalName(options.name);
  if (!cleaned || cleaned.length < 3) return [];

  const nameKey = normalizeTextKey(cleaned);
  const words = nameKey.split("-").filter((w) => w.length >= 2);
  if (!words.length) return [];

  const candidates = await prisma.directoryDoctor.findMany({
    where: {
      isActive: true,
      doctorId: null,
      claims: {
        none: { status: { in: ["PENDING", "APPROVED"] } },
      },
      ...(options.city ? { city: { equals: options.city, mode: "insensitive" } } : {}),
    },
    take: 50,
  });

  const matches = candidates.filter((c) => {
    const candidateClean = cleanProfessionalName(c.name);
    const candidateKey = normalizeTextKey(candidateClean);
    if (candidateKey.includes(nameKey) || nameKey.includes(candidateKey)) return true;
    const candidateWords = candidateKey.split("-").filter((w) => w.length >= 2);
    const commonWords = words.filter((w) => candidateWords.includes(w));
    return commonWords.length >= Math.min(2, words.length);
  });

  const limit = options.limit || 5;
  return matches.slice(0, limit).map((m) => ({
    id: m.id,
    name: m.name,
    title: m.title,
    specialty: m.specialty,
    hospital: m.hospital,
    city: m.city,
    source: m.source,
    officialWebsite: normalizeOfficialWebsiteUrl(m.officialWebsite),
    isOfficialSource: isOfficialRegistrySource(m.source),
  }));
}
