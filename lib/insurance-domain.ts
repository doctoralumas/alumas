import { isHealthcareFacilityType } from "@/lib/organization-capabilities";
import { missingRequiredDocuments } from "@/lib/verification-requirements";
import { normalizeTextKey } from "@/lib/institution-directory";

export type InsurancePayerKind = "COMMERCIAL_INSURER" | "PUBLIC_PAYER";
export type InsuranceProviderLifecycleStatus = "ACTIVE" | "DEMO_INTERNAL" | "INACTIVE";
export type InsuranceProductType =
  | "TSS"
  | "OSS"
  | "TRAVEL"
  | "FOREIGN_HEALTH"
  | "CRITICAL_ILLNESS"
  | "CORPORATE_HEALTH"
  | "PUBLIC_SGK";
export type CatalogLifecycleStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "RETIRED";
export type AgreementVerificationStatus =
  | "UNVERIFIED"
  | "PROVIDER_DECLARED"
  | "INSURER_DECLARED"
  | "MUTUALLY_CONFIRMED"
  | "ADMIN_VERIFIED"
  | "DISPUTED"
  | "EXPIRED";
export type AgreementSource =
  | "LEGACY_MIGRATED"
  | "PROVIDER_DECLARATION"
  | "INSURER_DECLARATION"
  | "ADMIN_CURATED"
  | "OFFICIAL_PUBLIC_SOURCE";
export type AgreementCoverageScope =
  | "ALL_BRANCHES"
  | "SELECTED_SPECIALTIES"
  | "INPATIENT_ONLY"
  | "OUTPATIENT_ONLY"
  | "EMERGENCY_ONLY";
export type SpecialtyRuleKind = "INCLUDED" | "EXCLUDED";

export class InsuranceDomainError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string = "INSURANCE_DOMAIN_ERROR", status: number = 400) {
    super(message);
    this.name = "InsuranceDomainError";
    this.code = code;
    this.status = status;
  }
}

export interface CanonicalInsurerRecord {
  id: string;
  name: string;
  slug: string;
  payerKind?: InsurancePayerKind;
  lifecycleStatus?: InsuranceProviderLifecycleStatus;
  canonicalCode?: string | null;
  seddkLicenseRef?: string | null;
  tsbMemberCode?: string | null;
  website?: string | null;
  isActive: boolean;
  isPubliclyListed?: boolean;
  isClaimable?: boolean;
  organizationId?: string | null;
  directoryInstitutionId?: string | null;
}

export interface InsuranceProductRecord {
  id: string;
  insuranceProviderId: string;
  code: string;
  slug: string;
  name: string;
  productType: InsuranceProductType;
  requiresPublicSgk?: boolean;
  status?: CatalogLifecycleStatus;
  isActive: boolean;
  effectiveFrom?: Date | string | null;
  effectiveUntil?: Date | string | null;
}

export interface InsuranceNetworkRecord {
  id: string;
  insuranceProviderId: string;
  productId?: string | null;
  code: string;
  slug: string;
  name: string;
  tierLabel?: string | null;
  tierRank?: number;
  status?: CatalogLifecycleStatus;
  isActive: boolean;
  effectiveFrom?: Date | string | null;
  effectiveUntil?: Date | string | null;
}

export interface SpecialtyRuleRecord {
  id?: string;
  specialtyCode: string;
  serviceCode?: string | null;
  ruleKind: SpecialtyRuleKind;
  copayPercent?: number | null;
  note?: string | null;
}

export interface InsuranceAgreementRecord {
  id: string;
  organizationInsuranceId?: string | null;
  organizationId?: string | null;
  directoryInstitutionId?: string | null;
  insuranceProviderId: string;
  productId?: string | null;
  networkId?: string | null;
  coverageScope: AgreementCoverageScope;
  verificationStatus: AgreementVerificationStatus;
  source: AgreementSource;
  effectiveFrom?: Date | string | null;
  expiresAt?: Date | string | null;
  verifiedAt?: Date | string | null;
  verifiedByUserId?: string | null;
  declaredByUserId?: string | null;
  disputeReason?: string | null;
  note?: string | null;
  isActive: boolean;
  specialtyRules?: SpecialtyRuleRecord[];
}

export interface LegacyOrganizationInsuranceRecord {
  id: string;
  organizationId: string;
  insuranceProviderId: string;
  isActive: boolean;
  note?: string | null;
}

const INSURER_CORPORATE_SUFFIXES = [
  "anonim-sirketi",
  "a-s",
  "as",
  "sigorta-a-s",
  "sigorta-anonim-sirketi",
  "emeklilik-ve-hayat",
  "hayat-ve-emeklilik",
  "sigorta",
];

/**
 * Normalizes an insurer name or slug into a canonical comparison key so duplicate
 * insurer identities (e.g. "Allianz Sigorta" vs "Allianz Sigorta A.Ş.") cannot be created.
 */
export function normalizeInsurerIdentityKey(value: string | null | undefined): string {
  let key = normalizeTextKey(value);
  for (const suffix of INSURER_CORPORATE_SUFFIXES) {
    if (key.endsWith(`-${suffix}`)) {
      key = key.slice(0, -(suffix.length + 1));
    }
  }
  return key.replace(/^-|-$/g, "");
}

/**
 * Determines whether an InsuranceProvider record should be returned in public
 * discovery/catalog responses. Excludes inactive records and internal demo records.
 */
export function isInsurerPubliclyDiscoverable(insurer: {
  slug?: string | null;
  isActive?: boolean | null;
  isPubliclyListed?: boolean | null;
  lifecycleStatus?: string | null;
}): boolean {
  if (!insurer || insurer.isActive !== true) return false;
  if (insurer.slug === "alumas-demo-sigorta") return false;
  if (insurer.lifecycleStatus === "DEMO_INTERNAL" || insurer.lifecycleStatus === "INACTIVE") {
    return false;
  }
  if (insurer.isPubliclyListed === false) return false;
  return true;
}

export function filterPublicCatalogInsurers<
  T extends {
    slug?: string | null;
    isActive?: boolean | null;
    isPubliclyListed?: boolean | null;
    lifecycleStatus?: string | null;
  }
>(insurers: T[]): T[] {
  return insurers.filter((insurer) => isInsurerPubliclyDiscoverable(insurer));
}

/**
 * Enforces canonical insurer uniqueness, public payer (SGK) non-claimability,
 * and demo insurer isolation.
 */
export function validateCanonicalInsurerEntry(
  candidate: {
    id?: string;
    name: string;
    slug: string;
    payerKind?: InsurancePayerKind;
    lifecycleStatus?: InsuranceProviderLifecycleStatus;
    canonicalCode?: string | null;
    seddkLicenseRef?: string | null;
    isPubliclyListed?: boolean;
    isClaimable?: boolean;
    organizationId?: string | null;
    directoryInstitutionId?: string | null;
  },
  existingInsurers: CanonicalInsurerRecord[] = []
): void {
  const name = String(candidate.name || "").trim();
  const slug = normalizeTextKey(candidate.slug || candidate.name);
  if (!name || !slug) {
    throw new InsuranceDomainError(
      "Sigorta kurumu adı ve tekil kısa adı (slug) zorunludur.",
      "INVALID_INSURER_IDENTITY",
      400
    );
  }

  const payerKind = candidate.payerKind || "COMMERCIAL_INSURER";
  const lifecycleStatus = candidate.lifecycleStatus || "ACTIVE";

  // 1. Public payer (e.g. SGK) must never be modeled as a claimable private company
  if (payerKind === "PUBLIC_PAYER") {
    if (candidate.isClaimable === true || candidate.organizationId || candidate.directoryInstitutionId) {
      throw new InsuranceDomainError(
        "Kamusal sağlık güvencesi (SGK) özel bir sigorta şirketi gibi sahiplenilemez veya ticari kurum hesabına bağlanamaz.",
        "PUBLIC_PAYER_NOT_CLAIMABLE",
        400
      );
    }
  }

  // 2. Demo internal insurer must never be publicly listed, claimable, or carry fabricated SEDDK licenses
  if (lifecycleStatus === "DEMO_INTERNAL" || slug === "alumas-demo-sigorta") {
    if (candidate.isPubliclyListed === true || candidate.isClaimable === true) {
      throw new InsuranceDomainError(
        "Demo / test sigorta kaydı gerçek doğrulanmış kurum olarak yayınlanamaz veya sahiplenmeye açılamaz.",
        "DEMO_INSURER_PUBLICATION_FORBIDDEN",
        400
      );
    }
    if (candidate.seddkLicenseRef) {
      throw new InsuranceDomainError(
        "Demo sigorta kaydı için resmi SEDDK ruhsat numarası tanımlanamaz.",
        "DEMO_INSURER_FABRICATED_LICENSE",
        400
      );
    }
  }

  // 3. Canonical identity deduplication
  const candidateCanonicalKey = normalizeInsurerIdentityKey(name);
  const candidateSlugKey = normalizeInsurerIdentityKey(slug);
  const candidateCode = candidate.canonicalCode ? String(candidate.canonicalCode).trim().toUpperCase() : null;

  for (const existing of existingInsurers) {
    if (candidate.id && existing.id === candidate.id) continue;

    const existingSlug = normalizeTextKey(existing.slug);
    const existingCanonicalKey = normalizeInsurerIdentityKey(existing.name);
    const existingSlugKey = normalizeInsurerIdentityKey(existing.slug);
    const existingCode = existing.canonicalCode ? String(existing.canonicalCode).trim().toUpperCase() : null;

    if (
      slug === existingSlug ||
      (candidateCanonicalKey.length >= 3 && candidateCanonicalKey === existingCanonicalKey) ||
      (candidateSlugKey.length >= 3 && candidateSlugKey === existingSlugKey) ||
      (candidateCode && existingCode && candidateCode === existingCode)
    ) {
      throw new InsuranceDomainError(
        `Bu sigorta kurumu kimliği zaten katalogda mevcut (${existing.name}). Mükerrer sigorta kaydı oluşturulamaz.`,
        "DUPLICATE_CANONICAL_INSURER",
        409
      );
    }
  }
}

/**
 * Checks whether an InsuranceProvider is eligible to be claimed by a corporate representative.
 */
export function canClaimInsurer(insurer: CanonicalInsurerRecord): {
  allowed: boolean;
  code?: string;
  reason?: string;
} {
  if (!insurer.isActive) {
    return {
      allowed: false,
      code: "INSURER_INACTIVE",
      reason: "Aktif olmayan sigorta kaydı sahiplenilemez.",
    };
  }
  if (insurer.payerKind === "PUBLIC_PAYER") {
    return {
      allowed: false,
      code: "PUBLIC_PAYER_NOT_CLAIMABLE",
      reason: "Kamusal sağlık güvencesi (SGK) özel sigorta şirketi olarak sahiplenilemez.",
    };
  }
  if (
    insurer.lifecycleStatus === "DEMO_INTERNAL" ||
    insurer.slug === "alumas-demo-sigorta" ||
    insurer.isClaimable === false
  ) {
    return {
      allowed: false,
      code: "INSURER_NOT_CLAIMABLE",
      reason: "Bu sigorta kaydı kurumsal sahiplenmeye kapalıdır.",
    };
  }
  if (insurer.organizationId) {
    return {
      allowed: false,
      code: "INSURER_ALREADY_CLAIMED",
      reason: "Bu sigorta kurumu zaten doğrulanmış bir kurumsal hesaba bağlıdır.",
    };
  }
  return { allowed: true };
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "yandex.com",
  "yandex.com.tr",
  "protonmail.com",
  "proton.me",
  "live.com",
  "msn.com",
]);

function extractRootDomain(urlOrEmail: string | null | undefined): string | null {
  const raw = String(urlOrEmail || "").trim().toLowerCase();
  if (!raw) return null;

  let host = raw;
  if (raw.includes("@")) {
    host = raw.split("@").pop() || "";
  } else {
    try {
      const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      host = parsed.hostname.toLowerCase();
    } catch {
      return null;
    }
  }
  host = host.replace(/^www\./, "").replace(/^kurumsal\./, "").replace(/^portal\./, "");
  return host || null;
}

export interface InsurerVerificationEvaluation {
  canApprove: boolean;
  missingDocuments: Array<{ type: string; label: string }>;
  blockReason: string | null;
  supportingSignals: {
    emailDomainSignal: "CORPORATE_MATCH" | "DOMAIN_MISMATCH" | "FREE_EMAIL_PROVIDER" | "UNAVAILABLE";
    applicantEmailDomain: string | null;
    officialWebsiteDomain: string | null;
    tsbReferenceProvided: boolean;
    seddkReferenceProvided: boolean;
    advisoryNote: string;
  };
}

/**
 * Evaluates authoritative SEDDK license, corporate registration, and representative authorization.
 * Treats TSB membership reference and corporate email-domain similarity strictly as supporting
 * evidence for human review — NEVER as automatic proof of authorization.
 */
export function evaluateInsurerVerification(params: {
  insurer?: CanonicalInsurerRecord | null;
  applicantEmail?: string | null;
  officialWebsite?: string | null;
  tsbMemberCode?: string | null;
  seddkLicenseRef?: string | null;
  documents: Array<{
    documentType: string;
    status: string;
    expiresAt?: Date | string | null;
  }>;
  locale?: string;
}): InsurerVerificationEvaluation {
  const locale = params.locale || "tr";

  if (params.insurer) {
    const claimEligibility = canClaimInsurer(params.insurer);
    if (!claimEligibility.allowed) {
      return {
        canApprove: false,
        missingDocuments: [],
        blockReason: claimEligibility.reason || "Bu sigorta kurumu onaylanamaz.",
        supportingSignals: {
          emailDomainSignal: "UNAVAILABLE",
          applicantEmailDomain: null,
          officialWebsiteDomain: null,
          tsbReferenceProvided: false,
          seddkReferenceProvided: false,
          advisoryNote: claimEligibility.reason || "",
        },
      };
    }
  }

  const missing = missingRequiredDocuments("organization", "INSURANCE_COMPANY", params.documents, locale);

  const applicantDomain = extractRootDomain(params.applicantEmail);
  const websiteDomain = extractRootDomain(params.officialWebsite || params.insurer?.website);

  let emailDomainSignal: "CORPORATE_MATCH" | "DOMAIN_MISMATCH" | "FREE_EMAIL_PROVIDER" | "UNAVAILABLE" =
    "UNAVAILABLE";
  if (applicantDomain) {
    if (FREE_EMAIL_DOMAINS.has(applicantDomain)) {
      emailDomainSignal = "FREE_EMAIL_PROVIDER";
    } else if (websiteDomain) {
      emailDomainSignal =
        applicantDomain === websiteDomain ||
        applicantDomain.endsWith(`.${websiteDomain}`) ||
        websiteDomain.endsWith(`.${applicantDomain}`)
          ? "CORPORATE_MATCH"
          : "DOMAIN_MISMATCH";
    }
  }

  const tsbReferenceProvided = Boolean(
    (params.tsbMemberCode || params.insurer?.tsbMemberCode || "").trim()
  );
  const seddkReferenceProvided = Boolean(
    (params.seddkLicenseRef || params.insurer?.seddkLicenseRef || "").trim() ||
      params.documents.some((d) => d.documentType === "SEDDK_LICENSE" && d.status === "APPROVED")
  );

  const canApprove = missing.length === 0;
  const blockReason = canApprove
    ? null
    : locale === "en"
    ? `For insurer approval, authoritative documents must be approved and valid: ${missing
        .map((m) => m.label)
        .join(", ")}. Supporting signals (email domain or TSB code) never replace required documents.`
    : `Sigorta kurumu onayı için zorunlu yetki belgeleri onaylı ve geçerli olmalıdır: ${missing
        .map((m) => m.label)
        .join(", ")}. Kurumsal e-posta veya TSB kodu destekleyici sinyaldir; resmi SEDDK ve temsil belgelerinin yerine geçmez.`;

  const advisoryNote =
    emailDomainSignal === "CORPORATE_MATCH"
      ? "Başvuru e-posta alan adı kurumsal web sitesi ile uyumlu (Destekleyici sinyal — tek başına yetki kanıtı değildir)."
      : emailDomainSignal === "FREE_EMAIL_PROVIDER"
      ? "Başvuru genel e-posta sağlayıcısı ile yapılmış; temsil yetki belgesi ve imza sirküleri dikkatle incelenmelidir."
      : emailDomainSignal === "DOMAIN_MISMATCH"
      ? "Başvuru e-posta alan adı ile kurumsal web sitesi alan adı farklı; vekalet/yetki belgesi kontrol edilmelidir."
      : "Kurumsal alan adı karşılaştırması için veri mevcut değil.";

  return {
    canApprove,
    missingDocuments: missing.map((m) => ({ type: m.type, label: m.label })),
    blockReason,
    supportingSignals: {
      emailDomainSignal,
      applicantEmailDomain: applicantDomain,
      officialWebsiteDomain: websiteDomain,
      tsbReferenceProvided,
      seddkReferenceProvided,
      advisoryNote,
    },
  };
}

/**
 * Resolves and validates the healthcare facility branch identity for an insurance agreement.
 * Supports both registered `Organization` facilities and unregistered external `DirectoryInstitution` branches.
 */
export function resolveAgreementFacilityTarget(
  input: {
    organizationId?: string | null;
    directoryInstitutionId?: string | null;
  },
  context: {
    organizations?: Array<{ id: string; type: string; status?: string }>;
    directoryInstitutions?: Array<{ id: string; type: string; organizationId?: string | null; isActive?: boolean }>;
  } = {}
): {
  organizationId: string | null;
  directoryInstitutionId: string | null;
} {
  let orgId = input.organizationId ? String(input.organizationId).trim() : null;
  let dirId = input.directoryInstitutionId ? String(input.directoryInstitutionId).trim() : null;

  if (!orgId && !dirId) {
    throw new InsuranceDomainError(
      "Sigorta anlaşması belirli bir sağlık tesisi veya dizin şubesi kimliği ile ilişkilendirilmelidir.",
      "MISSING_FACILITY_TARGET",
      400
    );
  }

  const orgMap = new Map((context.organizations || []).map((o) => [o.id, o]));
  const dirMap = new Map((context.directoryInstitutions || []).map((d) => [d.id, d]));

  if (dirId) {
    const dir = dirMap.get(dirId);
    if (dir) {
      if (!isHealthcareFacilityType(dir.type)) {
        throw new InsuranceDomainError(
          "Sağlık tesisi sigorta anlaşması yalnızca hastane, klinik, eczane, laboratuvar veya görüntüleme merkezi için tanımlanabilir.",
          "INVALID_FACILITY_TYPE",
          400
        );
      }
      if (dir.organizationId) {
        if (orgId && orgId !== dir.organizationId) {
          throw new InsuranceDomainError(
            "Seçilen harici dizin şubesi farklı bir kayıtlı kuruma bağlıdır; çelişkili kurum kimliği kullanılamaz.",
            "FACILITY_IDENTITY_CONFLICT",
            409
          );
        }
        orgId = dir.organizationId;
      }
    }
  }

  if (orgId) {
    const org = orgMap.get(orgId);
    if (org && !isHealthcareFacilityType(org.type)) {
      throw new InsuranceDomainError(
        "Sağlık tesisi sigorta anlaşması sigorta şirketleri veya sağlık tesisi olmayan kayıtlar için oluşturulamaz.",
        "INVALID_FACILITY_TYPE",
        400
      );
    }
    if (!dirId && context.directoryInstitutions) {
      const linkedDir = context.directoryInstitutions.find((d) => d.organizationId === orgId);
      if (linkedDir) {
        dirId = linkedDir.id;
      }
    }
  }

  return {
    organizationId: orgId,
    directoryInstitutionId: dirId,
  };
}

export function buildAgreementTupleKey(agreement: {
  insuranceProviderId: string;
  productId?: string | null;
  networkId?: string | null;
}): string {
  return `${agreement.insuranceProviderId}::${agreement.productId || "__ANY_PRODUCT__"}::${
    agreement.networkId || "__ANY_NETWORK__"
  }`;
}

/**
 * Enforces that provider or insurer declarations NEVER automatically become confirmed agreements.
 */
export function resolveInitialAgreementVerificationStatus(params: {
  actorRole: "ADMIN" | "PROVIDER" | "INSURER";
  requestedStatus?: AgreementVerificationStatus | null;
}): {
  verificationStatus: AgreementVerificationStatus;
  source: AgreementSource;
} {
  if (params.actorRole === "ADMIN") {
    const status =
      params.requestedStatus === "ADMIN_VERIFIED" ||
      params.requestedStatus === "MUTUALLY_CONFIRMED" ||
      params.requestedStatus === "DISPUTED"
        ? params.requestedStatus
        : "ADMIN_VERIFIED";
    return {
      verificationStatus: status,
      source: "ADMIN_CURATED",
    };
  }

  if (params.actorRole === "INSURER") {
    // Even if an insurer passes MUTUALLY_CONFIRMED or ADMIN_VERIFIED in payload,
    // a unilateral insurer declaration starts strictly as INSURER_DECLARED.
    return {
      verificationStatus: "INSURER_DECLARED",
      source: "INSURER_DECLARATION",
    };
  }

  // Healthcare provider declaration starts strictly as PROVIDER_DECLARED.
  return {
    verificationStatus: "PROVIDER_DECLARED",
    source: "PROVIDER_DECLARATION",
  };
}

/**
 * Enforces strict authorization and two-party / admin rules when updating agreement verification status.
 */
export function transitionAgreementVerificationStatus(params: {
  agreement: InsuranceAgreementRecord;
  actor: {
    userId: string;
    role: string;
    ownedOrganizationIds?: string[];
    ownedInsurerProviderIds?: string[];
  };
  action: "CONFIRM" | "DISPUTE" | "EXPIRE" | "ADMIN_VERIFY";
  reason?: string | null;
  now?: Date;
}): InsuranceAgreementRecord {
  const now = params.now || new Date();
  const { agreement, actor, action } = params;

  const isAdmin = actor.role === "ADMIN";
  const isFacilityOwner = Boolean(
    agreement.organizationId && actor.ownedOrganizationIds?.includes(agreement.organizationId)
  );
  const isInsurerOwner = Boolean(
    actor.ownedInsurerProviderIds?.includes(agreement.insuranceProviderId)
  );

  if (!isAdmin && !isFacilityOwner && !isInsurerOwner) {
    throw new InsuranceDomainError(
      "Bu sigorta anlaşmasını değiştirme yetkiniz yok.",
      "UNAUTHORIZED_AGREEMENT_MUTATION",
      403
    );
  }

  if (action === "ADMIN_VERIFY") {
    if (!isAdmin) {
      throw new InsuranceDomainError(
        "Yalnızca sistem yöneticileri ADMIN_VERIFIED doğrulaması yapabilir.",
        "ADMIN_REQUIRED",
        403
      );
    }
    return {
      ...agreement,
      verificationStatus: "ADMIN_VERIFIED",
      verifiedAt: now.toISOString(),
      verifiedByUserId: actor.userId,
      disputeReason: null,
    };
  }

  if (action === "DISPUTE") {
    return {
      ...agreement,
      verificationStatus: "DISPUTED",
      disputeReason: params.reason || "Taraflarca uyuşmazlık bildirildi.",
    };
  }

  if (action === "EXPIRE") {
    return {
      ...agreement,
      verificationStatus: "EXPIRED",
      isActive: false,
    };
  }

  // action === "CONFIRM"
  if (isAdmin) {
    return {
      ...agreement,
      verificationStatus: "ADMIN_VERIFIED",
      verifiedAt: now.toISOString(),
      verifiedByUserId: actor.userId,
      disputeReason: null,
    };
  }

  // Prevent unilateral self-confirmation!
  if (agreement.verificationStatus === "PROVIDER_DECLARED" && isInsurerOwner) {
    return {
      ...agreement,
      verificationStatus: "MUTUALLY_CONFIRMED",
      verifiedAt: now.toISOString(),
      verifiedByUserId: actor.userId,
      disputeReason: null,
    };
  }

  if (agreement.verificationStatus === "INSURER_DECLARED" && isFacilityOwner) {
    return {
      ...agreement,
      verificationStatus: "MUTUALLY_CONFIRMED",
      verifiedAt: now.toISOString(),
      verifiedByUserId: actor.userId,
      disputeReason: null,
    };
  }

  throw new InsuranceDomainError(
    "Kurum veya sigorta şirketi kendi tek taraflı beyanını karşı taraf onayı olmadan 'Onaylı Anlaşma' (MUTUALLY_CONFIRMED) durumuna geçiremez.",
    "SELF_CONFIRMATION_FORBIDDEN",
    403
  );
}

export function isAgreementExpired(
  agreement: {
    verificationStatus?: AgreementVerificationStatus | string;
    expiresAt?: Date | string | null;
  },
  now: Date = new Date()
): boolean {
  if (agreement.verificationStatus === "EXPIRED") return true;
  if (agreement.expiresAt != null && new Date(agreement.expiresAt).getTime() <= now.getTime()) {
    return true;
  }
  return false;
}

export function isAgreementConfirmedAndActive(
  agreement: InsuranceAgreementRecord,
  now: Date = new Date()
): boolean {
  if (!agreement.isActive) return false;
  if (isAgreementExpired(agreement, now)) return false;
  if (
    agreement.effectiveFrom != null &&
    new Date(agreement.effectiveFrom).getTime() > now.getTime()
  ) {
    return false;
  }
  return (
    agreement.verificationStatus === "MUTUALLY_CONFIRMED" ||
    agreement.verificationStatus === "ADMIN_VERIFIED"
  );
}

export interface FacilityInsuranceMatchResult {
  matched: boolean;
  confirmed: boolean;
  matchTier:
    | "CONFIRMED"
    | "UNVERIFIED_DECLARATION"
    | "RESTRICTED_SCOPE"
    | "EXPIRED"
    | "DISPUTED"
    | "NO_MATCH";
  matchedAgreementIds: string[];
  note: string | null;
}

/**
 * Evaluates insurance agreement eligibility for either a registered `Organization` or an
 * unregistered external `DirectoryInstitution` branch across multiple product/network agreements.
 *
 * Strictly guarantees:
 * 1. Unverified declarations (`PROVIDER_DECLARED`, `INSURER_DECLARED`, `UNVERIFIED`, or legacy `OrganizationInsurance`)
 *    NEVER count as `confirmed: true`.
 * 2. Legacy `OrganizationInsurance` records (e.g. `Lab Test` <-> `Allianz Sigorta`) are NOT treated as
 *    verified coverage for all insurer products/networks.
 * 3. Expired or disputed agreements NEVER count as confirmed or active matches.
 */
export function evaluateFacilityInsuranceCoverage(params: {
  organizationId?: string | null;
  directoryInstitutionId?: string | null;
  insuranceProviderId: string;
  productId?: string | null;
  networkId?: string | null;
  specialtyCode?: string | null;
  agreements: InsuranceAgreementRecord[];
  legacyContracts?: LegacyOrganizationInsuranceRecord[];
  now?: Date;
}): FacilityInsuranceMatchResult {
  const now = params.now || new Date();
  const normalizedSpecialty = params.specialtyCode
    ? normalizeTextKey(params.specialtyCode).toUpperCase()
    : null;

  // Filter agreements belonging to this exact facility/branch and insurer
  const candidateAgreements = params.agreements.filter((a) => {
    if (a.insuranceProviderId !== params.insuranceProviderId) return false;
    const matchesOrg =
      Boolean(params.organizationId) && a.organizationId === params.organizationId;
    const matchesDir =
      Boolean(params.directoryInstitutionId) &&
      a.directoryInstitutionId === params.directoryInstitutionId;
    return matchesOrg || matchesDir;
  });

  let sawExpired = false;
  let sawDisputed = false;
  let sawRestrictedScope = false;
  let restrictedNote: string | null = null;
  const confirmedIds: string[] = [];
  const unverifiedIds: string[] = [];
  let primaryNote: string | null = null;

  for (const ag of candidateAgreements) {
    if (!ag.isActive) continue;

    // Product & network filtering
    if (params.productId && ag.productId && ag.productId !== params.productId) {
      continue;
    }
    if (params.networkId && ag.networkId && ag.networkId !== params.networkId) {
      continue;
    }

    if (ag.verificationStatus === "DISPUTED") {
      sawDisputed = true;
      continue;
    }

    if (isAgreementExpired(ag, now)) {
      sawExpired = true;
      continue;
    }

    if (ag.effectiveFrom && new Date(ag.effectiveFrom).getTime() > now.getTime()) {
      continue;
    }

    // Specialty restriction evaluation
    const rules = ag.specialtyRules || [];
    if (normalizedSpecialty) {
      const isExcluded = rules.some(
        (r) =>
          r.ruleKind === "EXCLUDED" &&
          normalizeTextKey(r.specialtyCode).toUpperCase() === normalizedSpecialty
      );
      if (isExcluded) {
        sawRestrictedScope = true;
        restrictedNote = ag.note || "Aranan branş bu anlaşma kapsamı dışında tutulmuştur.";
        continue;
      }

      if (ag.coverageScope === "SELECTED_SPECIALTIES") {
        const includedRules = rules.filter((r) => r.ruleKind === "INCLUDED");
        const isIncluded = includedRules.some(
          (r) => normalizeTextKey(r.specialtyCode).toUpperCase() === normalizedSpecialty
        );
        if (!isIncluded) {
          sawRestrictedScope = true;
          restrictedNote = ag.note || "Anlaşma yalnızca belirli branşlarda geçerlidir.";
          continue;
        }
      }
    }

    if (
      ag.verificationStatus === "MUTUALLY_CONFIRMED" ||
      ag.verificationStatus === "ADMIN_VERIFIED"
    ) {
      confirmedIds.push(ag.id);
      if (!primaryNote && ag.note) primaryNote = ag.note;
    } else {
      // UNVERIFIED, PROVIDER_DECLARED, INSURER_DECLARED
      unverifiedIds.push(ag.id);
      if (!primaryNote && ag.note) primaryNote = ag.note;
    }
  }

  if (confirmedIds.length > 0) {
    return {
      matched: true,
      confirmed: true,
      matchTier: "CONFIRMED",
      matchedAgreementIds: confirmedIds,
      note: primaryNote,
    };
  }

  if (unverifiedIds.length > 0) {
    return {
      matched: true,
      confirmed: false,
      matchTier: "UNVERIFIED_DECLARATION",
      matchedAgreementIds: unverifiedIds,
      note: primaryNote,
    };
  }

  if (sawRestrictedScope) {
    return {
      matched: false,
      confirmed: false,
      matchTier: "RESTRICTED_SCOPE",
      matchedAgreementIds: [],
      note: restrictedNote,
    };
  }

  // Check legacy OrganizationInsurance rows ONLY when no specific product/network filter requires verified child records.
  // Legacy rows are NEVER treated as confirmed coverage or verified coverage for all products.
  if (params.organizationId && params.legacyContracts?.length) {
    const legacy = params.legacyContracts.find(
      (c) =>
        c.isActive &&
        c.organizationId === params.organizationId &&
        c.insuranceProviderId === params.insuranceProviderId
    );
    if (legacy) {
      // If caller asked for a specific productId or networkId, a legacy general note cannot satisfy verified product/network coverage
      if (params.productId || params.networkId) {
        return {
          matched: false,
          confirmed: false,
          matchTier: "RESTRICTED_SCOPE",
          matchedAgreementIds: [],
          note: legacy.note || "Poliçe/ağ detayı doğrulanmamış kurum beyanı.",
        };
      }
      return {
        matched: true,
        confirmed: false,
        matchTier: "UNVERIFIED_DECLARATION",
        matchedAgreementIds: [legacy.id],
        note: legacy.note ?? null,
      };
    }
  }

  if (sawExpired) {
    return {
      matched: false,
      confirmed: false,
      matchTier: "EXPIRED",
      matchedAgreementIds: [],
      note: "Anlaşma süresi dolmuş.",
    };
  }

  if (sawDisputed) {
    return {
      matched: false,
      confirmed: false,
      matchTier: "DISPUTED",
      matchedAgreementIds: [],
      note: "Anlaşma uyuşmazlık durumunda.",
    };
  }

  return {
    matched: false,
    confirmed: false,
    matchTier: "NO_MATCH",
    matchedAgreementIds: [],
    note: null,
  };
}

const VERIFICATION_TRUST_RANK: Record<AgreementVerificationStatus, number> = {
  ADMIN_VERIFIED: 6,
  MUTUALLY_CONFIRMED: 5,
  INSURER_DECLARED: 4,
  PROVIDER_DECLARED: 3,
  UNVERIFIED: 2,
  EXPIRED: 1,
  DISPUTED: 0,
};

/**
 * Reconciles external `DirectoryInstitution` agreements when the directory listing is claimed
 * and linked to a registered `Organization`.
 * Ensures zero duplicate agreements for the same `(facility, insurer, product, network)` tuple
 * and never upgrades unverified declarations to confirmed automatically.
 */
export function reconcileClaimedFacilityAgreements(params: {
  directoryInstitutionId: string;
  organizationId: string;
  agreements: InsuranceAgreementRecord[];
}): {
  reconciledAgreements: InsuranceAgreementRecord[];
  removedDuplicateIds: string[];
} {
  const { directoryInstitutionId, organizationId, agreements } = params;
  const byTuple = new Map<string, InsuranceAgreementRecord>();
  const passthrough: InsuranceAgreementRecord[] = [];
  const removedDuplicateIds: string[] = [];

  for (const ag of agreements) {
    const belongsToClaimedPair =
      ag.directoryInstitutionId === directoryInstitutionId ||
      ag.organizationId === organizationId;

    if (!belongsToClaimedPair) {
      passthrough.push(ag);
      continue;
    }

    const normalized: InsuranceAgreementRecord = {
      ...ag,
      organizationId,
      directoryInstitutionId,
    };

    const tupleKey = buildAgreementTupleKey(normalized);
    const existing = byTuple.get(tupleKey);

    if (!existing) {
      byTuple.set(tupleKey, normalized);
      continue;
    }

    // Deterministic deduplication: keep higher trust status without auto-confirming
    const existingRank = VERIFICATION_TRUST_RANK[existing.verificationStatus] ?? 0;
    const candidateRank = VERIFICATION_TRUST_RANK[normalized.verificationStatus] ?? 0;

    const winner = candidateRank > existingRank ? normalized : existing;
    const loser = candidateRank > existingRank ? existing : normalized;
    removedDuplicateIds.push(loser.id);

    // Merge specialty rules without duplicates
    const mergedRulesMap = new Map<string, SpecialtyRuleRecord>();
    for (const r of [...(winner.specialtyRules || []), ...(loser.specialtyRules || [])]) {
      const rKey = `${normalizeTextKey(r.specialtyCode).toUpperCase()}::${r.ruleKind}`;
      if (!mergedRulesMap.has(rKey)) {
        mergedRulesMap.set(rKey, r);
      }
    }

    byTuple.set(tupleKey, {
      ...winner,
      organizationId,
      directoryInstitutionId,
      note: winner.note || loser.note || null,
      specialtyRules: Array.from(mergedRulesMap.values()),
    });
  }

  return {
    reconciledAgreements: [...passthrough, ...Array.from(byTuple.values())],
    removedDuplicateIds,
  };
}

/**
 * Transactional Prisma helper invoked when a DirectoryInstitution claim is approved.
 * Safely links external directory agreements to the claimed Organization without duplicates.
 */
export async function reconcileClaimedFacilityAgreementsInTx(
  tx: any,
  directoryInstitutionId: string,
  organizationId: string
): Promise<void> {
  if (!tx?.insuranceProviderAgreement) return;
  try {
    const existingRows: InsuranceAgreementRecord[] = await tx.insuranceProviderAgreement.findMany({
      where: {
        OR: [{ directoryInstitutionId }, { organizationId }],
      },
      include: { specialtyRules: true },
    });

    if (!existingRows.length) return;

    const { reconciledAgreements, removedDuplicateIds } = reconcileClaimedFacilityAgreements({
      directoryInstitutionId,
      organizationId,
      agreements: existingRows,
    });

    if (removedDuplicateIds.length > 0) {
      await tx.insuranceProviderAgreement.deleteMany({
        where: { id: { in: removedDuplicateIds } },
      });
    }

    for (const row of reconciledAgreements) {
      const parentContract = await tx.organizationInsurance.upsert({
        where: {
          organizationId_insuranceProviderId: {
            organizationId,
            insuranceProviderId: row.insuranceProviderId,
          },
        },
        update: {},
        create: {
          organizationId,
          insuranceProviderId: row.insuranceProviderId,
          isActive: row.isActive,
          note: row.note ?? null,
        },
      });

      await tx.insuranceProviderAgreement.update({
        where: { id: row.id },
        data: {
          organizationId,
          directoryInstitutionId,
          organizationInsuranceId: parentContract.id,
          note: row.note ?? null,
        },
      });
    }
  } catch {
    // Gracefully skip if InsuranceProviderAgreement table is not yet migrated in environment
  }
}

const FORBIDDEN_PATIENT_PII_FIELDS = [
  "tcKimlikNo",
  "tckn",
  "nationalId",
  "identityNumber",
  "passportNumber",
  "policyNumber",
  "policeNo",
  "memberNumber",
  "cardNumber",
  "iban",
  "medicalRecord",
  "healthHistory",
  "diagnosis",
  "policyDocument",
  "documentUrl",
  "fileStoragePath",
] as const;

const VALID_PRODUCT_TYPES = new Set<InsuranceProductType>([
  "TSS",
  "OSS",
  "TRAVEL",
  "FOREIGN_HEALTH",
  "CRITICAL_ILLNESS",
  "CORPORATE_HEALTH",
  "PUBLIC_SGK",
]);

export interface ValidatedPatientPreferenceInput {
  insuranceProviderId: string;
  productType: InsuranceProductType | null;
  productId: string | null;
  networkId: string | null;
  isPrimary: boolean;
  isActiveDiscovery: boolean;
  includePublicSgk: boolean;
  policyLabel: string | null;
}

/**
 * Validates patient insurance preference payloads while enforcing KVKK data minimization:
 * rejects national ID numbers, policy numbers, medical records, and document uploads.
 */
export function validatePatientInsurancePreferenceInput(
  raw: Record<string, unknown> | null | undefined
): ValidatedPatientPreferenceInput {
  if (!raw || typeof raw !== "object") {
    throw new InsuranceDomainError("Geçersiz sigorta tercihi verisi.", "INVALID_PAYLOAD", 400);
  }

  for (const forbiddenKey of FORBIDDEN_PATIENT_PII_FIELDS) {
    if (raw[forbiddenKey] !== undefined && raw[forbiddenKey] !== null && raw[forbiddenKey] !== "") {
      throw new InsuranceDomainError(
        `KVKK ve veri minimizasyonu gereği '${forbiddenKey}' alanı (T.C. Kimlik No, poliçe numarası, sağlık verisi veya poliçe belgesi) toplanmaz ve kaydedilemez.`,
        "PII_COLLECTION_FORBIDDEN",
        400
      );
    }
  }

  const insuranceProviderId = String(raw.insuranceProviderId || "").trim();
  if (!insuranceProviderId) {
    throw new InsuranceDomainError("Sigorta kurumu seçimi zorunludur.", "MISSING_INSURER", 400);
  }

  let productType: InsuranceProductType | null = null;
  if (raw.productType !== undefined && raw.productType !== null && raw.productType !== "") {
    const candidateType = String(raw.productType).trim().toUpperCase() as InsuranceProductType;
    if (!VALID_PRODUCT_TYPES.has(candidateType)) {
      throw new InsuranceDomainError("Geçersiz sigorta ürün türü.", "INVALID_PRODUCT_TYPE", 400);
    }
    productType = candidateType;
  }

  const productId = raw.productId ? String(raw.productId).trim() : null;
  const networkId = raw.networkId ? String(raw.networkId).trim() : null;

  let policyLabel: string | null = null;
  if (raw.policyLabel !== undefined && raw.policyLabel !== null) {
    const trimmed = String(raw.policyLabel).trim();
    if (trimmed.length > 60) {
      throw new InsuranceDomainError(
        "Poliçe etiketi en fazla 60 karakter olabilir.",
        "LABEL_TOO_LONG",
        400
      );
    }
    // Reject 11-digit Turkish National ID or 8+ digit policy/card number sequences inside label
    const digitsOnly = trimmed.replace(/\D+/g, "");
    if (/\b[1-9]\d{10}\b/.test(trimmed) || digitsOnly.length >= 8) {
      throw new InsuranceDomainError(
        "Poliçe etiketine T.C. Kimlik Numarası, poliçe numarası veya kart numarası yazmayınız.",
        "PII_IN_LABEL_FORBIDDEN",
        400
      );
    }
    policyLabel = trimmed || null;
  }

  return {
    insuranceProviderId,
    productType,
    productId,
    networkId,
    isPrimary: Boolean(raw.isPrimary),
    isActiveDiscovery: raw.isActiveDiscovery === undefined ? true : Boolean(raw.isActiveDiscovery),
    includePublicSgk: Boolean(raw.includePublicSgk),
    policyLabel,
  };
}

/**
 * Enforces strict patient ownership isolation for UserInsurancePreference records.
 * Neither other patients, doctors, hospitals, nor insurance companies can access or mutate another user's preferences.
 */
export function assertPreferenceOwnership(
  actorUser: { id: string; role?: string } | null | undefined,
  preference: { userId: string } | null | undefined
): void {
  if (!actorUser?.id) {
    throw new InsuranceDomainError("Giriş gerekli.", "AUTH_REQUIRED", 401);
  }
  if (!preference) {
    throw new InsuranceDomainError("Sigorta tercihi bulunamadı.", "NOT_FOUND", 404);
  }
  if (preference.userId !== actorUser.id) {
    throw new InsuranceDomainError(
      "Başka bir kullanıcının sigorta tercihine erişemez veya değiştiremezsiniz.",
      "PREFERENCE_OWNERSHIP_VIOLATION",
      403
    );
  }
}

