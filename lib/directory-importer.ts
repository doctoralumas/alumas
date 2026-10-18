import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import {
  canonicalInstitutionKey,
  normalizeTextKey,
} from "@/lib/institution-directory";
import type {
  DirectoryInstitutionRecord,
  DirectoryOrganizationType,
} from "@/lib/directory-fixtures";

export interface RawDirectoryCsvRow {
  rowNumber: number;
  name: string;
  externalRef: string;
  type: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  officialWebsite: string;
  latitude: string;
  longitude: string;
  source: string;
  lastVerifiedAt: string;
  description?: string;
}

export interface NormalizedDirectoryImportCandidate {
  rowNumber: number;
  id: string;
  slug: string;
  name: string;
  type: DirectoryOrganizationType;
  city: string;
  district: string | null;
  address: string;
  phone: string | null;
  officialWebsite: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  externalRef: string | null;
  lastVerifiedAt: string | null;
  warnings: string[];
}

export type ImportDecisionKind =
  | "CREATE"
  | "UPDATE"
  | "UNCHANGED"
  | "SKIP_OWNED"
  | "DUPLICATE_IN_CSV"
  | "AMBIGUOUS_MANUAL_REVIEW"
  | "INVALID";

export interface ImportRowDecision {
  rowNumber: number;
  decision: ImportDecisionKind;
  reason: string;
  rawName: string;
  rawCity: string;
  rawDistrict: string;
  rawType: string;
  externalRef: string | null;
  candidate?: NormalizedDirectoryImportCandidate;
  matchedExistingId?: string;
  matchedOrganizationId?: string;
  changedFields?: string[];
}

export interface DirectoryImportPlan {
  totalRows: number;
  summary: {
    creates: number;
    updates: number;
    unchanged: number;
    skippedOwned: number;
    duplicatesInCsv: number;
    ambiguousManualReview: number;
    invalid: number;
  };
  decisions: ImportRowDecision[];
}

const CATEGORY_ALIASES: Record<string, DirectoryOrganizationType> = {
  // Hospital (TR & EN)
  HOSPITAL: "HOSPITAL",
  HASTANE: "HOSPITAL",
  "OZEL HASTANE": "HOSPITAL",
  "ÖZEL HASTANE": "HOSPITAL",
  "DEVLET HASTANESI": "HOSPITAL",
  "DEVLET HASTANESİ": "HOSPITAL",
  "SEHIR HASTANESI": "HOSPITAL",
  "ŞEHİR HASTANESİ": "HOSPITAL",
  "UNIVERSITE HASTANESI": "HOSPITAL",
  "ÜNİVERSİTE HASTANESİ": "HOSPITAL",
  "EGITIM VE ARASTIRMA HASTANESI": "HOSPITAL",
  "EĞİTİM VE ARAŞTIRMA HASTANESİ": "HOSPITAL",
  "GENERAL HOSPITAL": "HOSPITAL",
  "PRIVATE HOSPITAL": "HOSPITAL",
  // Clinic (TR & EN)
  CLINIC: "CLINIC",
  KLINIK: "CLINIC",
  KLİNİK: "CLINIC",
  POLIKLINIK: "CLINIC",
  POLİKLİNİK: "CLINIC",
  "TIP MERKEZI": "CLINIC",
  "TIP MERKEZİ": "CLINIC",
  "OZEL TIP MERKEZI": "CLINIC",
  "ÖZEL TIP MERKEZİ": "CLINIC",
  "AGIZ VE DIS SAGLIGI MERKEZI": "CLINIC",
  "AĞIZ VE DİŞ SAĞLIĞI MERKEZİ": "CLINIC",
  "MEDICAL CENTER": "CLINIC",
  "OUTPATIENT CLINIC": "CLINIC",
  // Pharmacy (TR & EN)
  PHARMACY: "PHARMACY",
  ECZANE: "PHARMACY",
  "SERBEST ECZANE": "PHARMACY",
  "COMMUNITY PHARMACY": "PHARMACY",
  // Imaging Center (TR & EN)
  IMAGING_CENTER: "IMAGING_CENTER",
  "IMAGING CENTER": "IMAGING_CENTER",
  GORUNTULEME: "IMAGING_CENTER",
  GÖRÜNTÜLEME: "IMAGING_CENTER",
  "GORUNTULEME MERKEZI": "IMAGING_CENTER",
  "GÖRÜNTÜLEME MERKEZİ": "IMAGING_CENTER",
  "RADYOLOJI MERKEZI": "IMAGING_CENTER",
  "RADYOLOJİ MERKEZİ": "IMAGING_CENTER",
  "TIBBI GORUNTULEME MERKEZI": "IMAGING_CENTER",
  "TIBBİ GÖRÜNTÜLEME MERKEZİ": "IMAGING_CENTER",
  "DIAGNOSTIC IMAGING": "IMAGING_CENTER",
  // Laboratory (TR & EN)
  LABORATORY: "LABORATORY",
  LABORATUVAR: "LABORATORY",
  "TIBBI LABORATUVAR": "LABORATORY",
  "TIBBİ LABORATUVAR": "LABORATORY",
  "KLINIK LABORATUVAR": "LABORATORY",
  "KLİNİK LABORATUVAR": "LABORATORY",
  "MEDICAL LABORATORY": "LABORATORY",
  "CLINICAL LABORATORY": "LABORATORY",
};

/**
 * Resolves a Turkish or English institution category label to a canonical DirectoryOrganizationType.
 */
export function resolveInstitutionCategory(rawType: string | null | undefined): DirectoryOrganizationType | null {
  if (!rawType) return null;
  const trimmed = rawType.trim().replace(/\s+/g, " ");
  const upperTr = trimmed.toLocaleUpperCase("tr-TR");
  const upperEn = trimmed.toUpperCase();
  if (CATEGORY_ALIASES[upperTr]) return CATEGORY_ALIASES[upperTr];
  if (CATEGORY_ALIASES[upperEn]) return CATEGORY_ALIASES[upperEn];

  const asciiKey = normalizeTextKey(trimmed).replace(/-/g, " ").toUpperCase();
  return CATEGORY_ALIASES[asciiKey] || null;
}

/**
 * Cleans whitespace while preserving official Turkish characters and punctuation.
 */
export function cleanOfficialTurkishText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Validates and normalizes a Turkish or international phone number without fabricating missing digits.
 */
export function normalizeOptionalPhone(rawPhone: string | null | undefined): {
  phone: string | null;
  warning?: string;
} {
  const cleaned = cleanOfficialTurkishText(rawPhone);
  if (!cleaned) return { phone: null };

  const digits = cleaned.replace(/\D/g, "");
  // Reject obvious fake/placeholder phone numbers
  if (
    digits.length < 7 ||
    digits.length > 15 ||
    /^0+$/.test(digits) ||
    /0000000/.test(digits) ||
    /1234567/.test(digits)
  ) {
    return {
      phone: null,
      warning: `Geçersiz veya yer tutucu telefon numarası ("${cleaned}") yoksayıldı.`,
    };
  }
  return { phone: cleaned };
}

/**
 * RFC-4180 compliant CSV parser supporting quoted fields, escaped quotes, and UTF-8 BOM.
 */
export function parseDirectoryCsv(csvContent: string): RawDirectoryCsvRow[] {
  const cleanText = csvContent.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (ch === "\r" && next === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += ch;
      }
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (nonEmptyRows.length <= 1) return [];

  const headerRow = nonEmptyRows[0].map((h) => normalizeTextKey(h).replace(/-/g, "_"));

  const colIndex = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headerRow.indexOf(c);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxName = colIndex(["name", "institution_name", "kurum_adi", "kurum"]);
  const idxExtRef = colIndex(["external_ref", "externalref", "source_ref", "unique_source_reference", "kurum_kodu", "ref"]);
  const idxType = colIndex(["type", "institution_type", "category", "kurum_turu", "tur"]);
  const idxCity = colIndex(["city", "province", "il", "sehir"]);
  const idxDistrict = colIndex(["district", "ilce"]);
  const idxAddress = colIndex(["address", "full_address", "acik_adres", "adres"]);
  const idxPhone = colIndex(["phone", "telephone", "telefon"]);
  const idxWebsite = colIndex(["official_website", "officialwebsite", "website", "web_sitesi", "url"]);
  const idxLat = colIndex(["latitude", "lat", "enlem"]);
  const idxLng = colIndex(["longitude", "lng", "lon", "boylam"]);
  const idxSource = colIndex(["source", "source_provenance", "kaynak"]);
  const idxVerifiedAt = colIndex(["last_verified_at", "lastverifiedat", "verified_at", "check_date", "dogrulama_tarihi"]);
  const idxDesc = colIndex(["description", "aciklama"]);

  const getCell = (row: string[], idx: number): string => (idx >= 0 && idx < row.length ? row[idx].trim() : "");

  const parsed: RawDirectoryCsvRow[] = [];
  for (let i = 1; i < nonEmptyRows.length; i++) {
    const r = nonEmptyRows[i];
    parsed.push({
      rowNumber: i + 1,
      name: getCell(r, idxName),
      externalRef: getCell(r, idxExtRef),
      type: getCell(r, idxType),
      city: getCell(r, idxCity),
      district: getCell(r, idxDistrict),
      address: getCell(r, idxAddress),
      phone: getCell(r, idxPhone),
      officialWebsite: getCell(r, idxWebsite),
      latitude: getCell(r, idxLat),
      longitude: getCell(r, idxLng),
      source: getCell(r, idxSource),
      lastVerifiedAt: getCell(r, idxVerifiedAt),
      description: getCell(r, idxDesc),
    });
  }

  return parsed;
}

/**
 * Generates a deterministic slug and stable ID for a directory institution branch.
 */
export function buildStableDirectoryIdentity(params: {
  name: string;
  city: string;
  district: string | null;
  externalRef: string | null;
  existingSlugs: Set<string>;
  matchedExistingSlug?: string | null;
  matchedExistingId?: string | null;
}): { id: string; slug: string } {
  if (params.matchedExistingId && params.matchedExistingSlug) {
    return { id: params.matchedExistingId, slug: params.matchedExistingSlug };
  }

  const nameSlug = normalizeTextKey(params.name).slice(0, 56) || "kurum";
  const citySlug = normalizeTextKey(params.city).slice(0, 20) || "tr";
  const districtSlug = params.district ? normalizeTextKey(params.district).slice(0, 20) : "";

  let baseSlug = nameSlug;
  if (params.existingSlugs.has(baseSlug)) {
    baseSlug = districtSlug && !nameSlug.includes(districtSlug)
      ? `${nameSlug}-${districtSlug}`
      : `${nameSlug}-${citySlug}`;
  }

  let finalSlug = baseSlug;
  let counter = 2;
  while (params.existingSlugs.has(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const refSlug = params.externalRef ? normalizeTextKey(params.externalRef).slice(0, 40) : "";
  const id = refSlug ? `dir-${refSlug}` : `dir-${finalSlug}`;

  return { id, slug: finalSlug };
}

/**
 * Computes token similarity between two normalized institution names in the same city
 * to flag potential ambiguous matches for manual review.
 */
function isAmbiguousNearMatch(
  city: string,
  nameA: string,
  districtA: string | null | undefined,
  addressA: string,
  nameB: string,
  districtB: string | null | undefined,
  addressB: string
): string | null {
  const normA = normalizeTextKey(nameA);
  const normB = normalizeTextKey(nameB);
  if (!normA || !normB) return null;

  const cityNorm = normalizeTextKey(city);
  const distA = normalizeTextKey(districtA || "");
  const distB = normalizeTextKey(districtB || "");

  // If the addresses are nearly identical in the same city/district but the institution names differ
  const addrA = normalizeTextKey(addressA);
  const addrB = normalizeTextKey(addressB);
  if (addrA.length >= 12 && addrA === addrB && normA !== normB) {
    return `Aynı açık adresi paylaşan farklı isimli kurum kaydı tespit edildi ("${nameB}").`;
  }

  // Generic stop-tokens in healthcare institution names + location tokens
  const stopTokens = new Set([
    "ozel",
    "hastanesi",
    "hastane",
    "klinigi",
    "klinik",
    "tip",
    "merkezi",
    "eczanesi",
    "eczane",
    "laboratuvari",
    "laboratuvar",
    "goruntuleme",
    "saglik",
    "grubu",
    "hospital",
    "clinic",
    cityNorm,
    distA,
    distB,
  ]);

  const tokensA = normA.split("-").filter((t) => t.length > 2 && !stopTokens.has(t));
  const tokensB = normB.split("-").filter((t) => t.length > 2 && !stopTokens.has(t));
  if (tokensA.length === 0 || tokensB.length === 0) return null;

  const shared = tokensA.filter((t) => tokensB.includes(t));
  if (shared.length === 0) return null;

  // Same brand/root in the same district (or one row is missing district) with slightly different naming
  const sameOrMissingDistrict = !distA || !distB || distA === distB;
  if (sameOrMissingDistrict && shared.length >= Math.min(tokensA.length, tokensB.length)) {
    return `Aynı il/ilçede benzer kurum adı ("${nameB}") mevcut; şube ayrımı veya mükerrerlik için manuel inceleme gerekiyor.`;
  }

  return null;
}

export interface DirectoryImportOptions {
  allowSyntheticFixtures?: boolean;
}

/**
 * Pure, deterministic planner that validates CSV rows, normalizes Turkish names and categories,
 * checks duplicates against existing DirectoryInstitution and Organization records,
 * flags ambiguous rows for manual review, and guarantees zero ownership/approval mutations.
 */
export function planDirectoryCsvImport(
  rawRows: RawDirectoryCsvRow[],
  existingDirectory: DirectoryInstitutionRecord[],
  existingOrganizations: Array<{
    id: string;
    slug: string;
    name: string;
    type: string;
    city: string;
    district?: string | null;
    address?: string | null;
    status?: string | null;
  }>,
  options: DirectoryImportOptions = {}
): DirectoryImportPlan {
  const decisions: ImportRowDecision[] = [];

  const existingByExtRef = new Map<string, DirectoryInstitutionRecord>();
  const existingByCanonicalBranchKey = new Map<string, DirectoryInstitutionRecord>();
  const existingSlugs = new Set<string>();

  for (const dir of existingDirectory) {
    existingSlugs.add(dir.slug);
    if (dir.externalRef) {
      existingByExtRef.set(normalizeTextKey(dir.externalRef), dir);
    }
    const branchKey = `${canonicalInstitutionKey(dir.name, dir.city, dir.type)}::${normalizeTextKey(dir.district || "")}`;
    existingByCanonicalBranchKey.set(branchKey, dir);
  }

  const orgByCanonicalKey = new Map<string, (typeof existingOrganizations)[number]>();
  for (const org of existingOrganizations) {
    if (org.slug) existingSlugs.add(org.slug);
    const key = canonicalInstitutionKey(org.name, org.city, org.type);
    if (!orgByCanonicalKey.has(key)) {
      orgByCanonicalKey.set(key, org);
    }
  }

  const seenCsvExtRefs = new Set<string>();
  const seenCsvBranchKeys = new Set<string>();

  for (const row of rawRows) {
    const name = cleanOfficialTurkishText(row.name);
    const city = cleanOfficialTurkishText(row.city);
    const district = cleanOfficialTurkishText(row.district) || null;
    const address = cleanOfficialTurkishText(row.address);
    const externalRef = cleanOfficialTurkishText(row.externalRef) || null;
    const source = cleanOfficialTurkishText(row.source) || "CSV_IMPORT";
    const description = cleanOfficialTurkishText(row.description) || null;
    const resolvedType = resolveInstitutionCategory(row.type);

    // 1. Validate required fields & category
    if (!name || name.length < 3) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "INVALID",
        reason: "Kurum adı (name) zorunludur ve en az 3 karakter olmalıdır.",
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: row.type,
        externalRef,
      });
      continue;
    }

    if (!resolvedType) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "INVALID",
        reason: `Geçersiz veya desteklenmeyen kurum türü: "${row.type}". Desteklenen türler: HOSPITAL, CLINIC, PHARMACY, IMAGING_CENTER, LABORATORY.`,
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: row.type,
        externalRef,
      });
      continue;
    }

    if (!city || city.length < 2) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "INVALID",
        reason: "İl / şehir (city) alanı zorunludur.",
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: row.type,
        externalRef,
      });
      continue;
    }

    if (!address || address.length < 5) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "INVALID",
        reason: "Açık adres (address) alanı zorunludur; uydurma veya boş adres kabul edilmez.",
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: row.type,
        externalRef,
      });
      continue;
    }

    // 2. Validate officialWebsite (never allow unsafe URLs)
    const rawWeb = cleanOfficialTurkishText(row.officialWebsite);
    let safeWebsite: string | null = null;
    if (rawWeb) {
      safeWebsite = normalizeOfficialWebsiteUrl(rawWeb);
      if (!safeWebsite) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "INVALID",
          reason: `Güvensiz veya geçersiz resmi web sitesi adresi: "${rawWeb}".`,
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: row.type,
          externalRef,
        });
        continue;
      }
    }

    // 3. Validate coordinates if provided
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (row.latitude || row.longitude) {
      const parsedLat = Number(row.latitude);
      const parsedLng = Number(row.longitude);
      if (
        !Number.isFinite(parsedLat) ||
        !Number.isFinite(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "INVALID",
          reason: `Geçersiz koordinat (latitude="${row.latitude}", longitude="${row.longitude}").`,
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: row.type,
          externalRef,
        });
        continue;
      }
      latitude = parsedLat;
      longitude = parsedLng;
    }

    // 4. Validate lastVerifiedAt if provided
    let lastVerifiedAt: string | null = null;
    if (row.lastVerifiedAt) {
      const parsedDate = new Date(row.lastVerifiedAt);
      if (Number.isNaN(parsedDate.getTime())) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "INVALID",
          reason: `Geçersiz doğrulama tarihi (lastVerifiedAt="${row.lastVerifiedAt}"). ISO-8601 veya YYYY-MM-DD bekleniyor.`,
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: row.type,
          externalRef,
        });
        continue;
      }
      lastVerifiedAt = parsedDate.toISOString();
    }

    // 5. Reject synthetic/test rows when allowSyntheticFixtures is false
    if (!options.allowSyntheticFixtures) {
      const lowerCheck = `${name} ${address} ${externalRef || ""}`.toLocaleLowerCase("tr-TR");
      if (/\b(test|ornek|örnek|demo|fake|deneme)\b/.test(lowerCheck)) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "INVALID",
          reason:
            "Sentetik/test verisi tespit edildi. Üretim içe aktarımında sentetik kayıtlar engellenir (test ortamı için --allow-synthetic-fixtures kullanın).",
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: row.type,
          externalRef,
        });
        continue;
      }
    }

    const warnings: string[] = [];
    const { phone, warning: phoneWarning } = normalizeOptionalPhone(row.phone);
    if (phoneWarning) warnings.push(phoneWarning);

    // 6. Check for duplicate rows inside the same CSV file
    const extRefKey = externalRef ? normalizeTextKey(externalRef) : null;
    const branchKey = `${canonicalInstitutionKey(name, city, resolvedType)}::${normalizeTextKey(district || "")}`;

    if ((extRefKey && seenCsvExtRefs.has(extRefKey)) || seenCsvBranchKeys.has(branchKey)) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "DUPLICATE_IN_CSV",
        reason: "Aynı CSV dosyası içinde mükerrer kurum/şube veya referans kodu bulundu.",
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: resolvedType,
        externalRef,
      });
      continue;
    }
    if (extRefKey) seenCsvExtRefs.add(extRefKey);
    seenCsvBranchKeys.add(branchKey);

    // 7. Match against existing DirectoryInstitution (by externalRef first, then by exact canonical branch key)
    const matchedByRef = extRefKey ? existingByExtRef.get(extRefKey) || null : null;
    const matchedByBranch = existingByCanonicalBranchKey.get(branchKey) || null;
    const exactExistingDir = matchedByRef || matchedByBranch;

    if (exactExistingDir) {
      // Never overwrite or detach a directory record that already has a linked ALUMAS Organization or active claim
      const hasActiveClaim =
        Boolean(exactExistingDir.organizationId) ||
        (Array.isArray(exactExistingDir.claims) &&
          exactExistingDir.claims.some(
            (c: any) => c.status === "PENDING" || c.status === "APPROVED"
          ));

      const identity = buildStableDirectoryIdentity({
        name,
        city,
        district,
        externalRef: externalRef || exactExistingDir.externalRef,
        existingSlugs,
        matchedExistingId: exactExistingDir.id,
        matchedExistingSlug: exactExistingDir.slug,
      });

      const candidate: NormalizedDirectoryImportCandidate = {
        rowNumber: row.rowNumber,
        id: identity.id,
        slug: identity.slug,
        name,
        type: resolvedType,
        city,
        district: district ?? exactExistingDir.district ?? null,
        address,
        phone: phone ?? exactExistingDir.phone ?? null,
        officialWebsite: safeWebsite ?? normalizeOfficialWebsiteUrl(exactExistingDir.officialWebsite),
        description: description ?? exactExistingDir.description ?? null,
        latitude: latitude ?? exactExistingDir.latitude ?? null,
        longitude: longitude ?? exactExistingDir.longitude ?? null,
        source,
        externalRef: externalRef ?? exactExistingDir.externalRef ?? null,
        lastVerifiedAt:
          lastVerifiedAt ??
          (exactExistingDir.lastVerifiedAt
            ? new Date(exactExistingDir.lastVerifiedAt).toISOString()
            : null),
        warnings,
      };

      if (hasActiveClaim) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "SKIP_OWNED",
          reason:
            "Bu dizin kaydı doğrulanmış bir ALUMAS kurumuna veya aktif bir sahiplenme başvurusuna bağlıdır; sahiplik ve onay durumu korunarak atlandı.",
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: resolvedType,
          externalRef,
          candidate,
          matchedExistingId: exactExistingDir.id,
          matchedOrganizationId: exactExistingDir.organizationId || undefined,
        });
        continue;
      }

      // Compute field diffs for safe update vs idempotent unchanged
      const changedFields: string[] = [];
      if (exactExistingDir.name !== candidate.name) changedFields.push("name");
      if (exactExistingDir.type !== candidate.type) changedFields.push("type");
      if (exactExistingDir.city !== candidate.city) changedFields.push("city");
      if ((exactExistingDir.district || null) !== candidate.district) changedFields.push("district");
      if (exactExistingDir.address !== candidate.address) changedFields.push("address");
      if ((exactExistingDir.phone || null) !== candidate.phone) changedFields.push("phone");
      if (
        normalizeOfficialWebsiteUrl(exactExistingDir.officialWebsite) !== candidate.officialWebsite
      ) {
        changedFields.push("officialWebsite");
      }
      if ((exactExistingDir.latitude ?? null) !== candidate.latitude) changedFields.push("latitude");
      if ((exactExistingDir.longitude ?? null) !== candidate.longitude) changedFields.push("longitude");
      if ((exactExistingDir.externalRef || null) !== candidate.externalRef) {
        changedFields.push("externalRef");
      }

      if (changedFields.length === 0) {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "UNCHANGED",
          reason: "Mevcut dizin kaydı ile birebir aynı (idempotent no-op).",
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: resolvedType,
          externalRef,
          candidate,
          matchedExistingId: exactExistingDir.id,
        });
      } else {
        decisions.push({
          rowNumber: row.rowNumber,
          decision: "UPDATE",
          reason: `Mevcut dizin kaydı güncellenecek (${changedFields.join(", ")}).`,
          rawName: name,
          rawCity: city,
          rawDistrict: district || "",
          rawType: resolvedType,
          externalRef,
          candidate,
          matchedExistingId: exactExistingDir.id,
          changedFields,
        });
      }
      continue;
    }

    // 8. Check if an existing ALUMAS Organization already matches this canonical key
    const canonicalOrgKey = canonicalInstitutionKey(name, city, resolvedType);
    const matchedOrg = orgByCanonicalKey.get(canonicalOrgKey);
    if (matchedOrg) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "SKIP_OWNED",
        reason: `Mevcut ALUMAS Organization kaydı ("${matchedOrg.name}", id=${matchedOrg.id}) ile eşleşti; sahiplik/onay durumuna müdahale edilmeden atlandı.`,
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: resolvedType,
        externalRef,
        matchedOrganizationId: matchedOrg.id,
      });
      continue;
    }

    // 9. Check for ambiguous / near matches in the same city against existing DirectoryInstitution or Organization rows
    let ambiguousReason: string | null = null;
    let ambiguousTargetId: string | undefined;

    for (const dir of existingDirectory) {
      if (normalizeTextKey(dir.city) !== normalizeTextKey(city)) continue;
      const reason = isAmbiguousNearMatch(
        city,
        name,
        district,
        address,
        dir.name,
        dir.district,
        dir.address
      );
      if (reason) {
        ambiguousReason = reason;
        ambiguousTargetId = dir.id;
        break;
      }
    }

    if (!ambiguousReason) {
      for (const org of existingOrganizations) {
        if (normalizeTextKey(org.city) !== normalizeTextKey(city)) continue;
        const reason = isAmbiguousNearMatch(
          city,
          name,
          district,
          address,
          org.name,
          org.district,
          org.address || ""
        );
        if (reason) {
          ambiguousReason = reason;
          ambiguousTargetId = org.id;
          break;
        }
      }
    }

    if (ambiguousReason) {
      decisions.push({
        rowNumber: row.rowNumber,
        decision: "AMBIGUOUS_MANUAL_REVIEW",
        reason: ambiguousReason,
        rawName: name,
        rawCity: city,
        rawDistrict: district || "",
        rawType: resolvedType,
        externalRef,
        matchedExistingId: ambiguousTargetId,
      });
      continue;
    }

    // 10. Valid new CREATE candidate
    const identity = buildStableDirectoryIdentity({
      name,
      city,
      district,
      externalRef,
      existingSlugs,
    });
    existingSlugs.add(identity.slug);

    const candidate: NormalizedDirectoryImportCandidate = {
      rowNumber: row.rowNumber,
      id: identity.id,
      slug: identity.slug,
      name,
      type: resolvedType,
      city,
      district,
      address,
      phone,
      officialWebsite: safeWebsite,
      description,
      latitude,
      longitude,
      source,
      externalRef,
      lastVerifiedAt,
      warnings,
    };

    decisions.push({
      rowNumber: row.rowNumber,
      decision: "CREATE",
      reason: "Yeni doğrulanmış dizin kurumu olarak eklenecek.",
      rawName: name,
      rawCity: city,
      rawDistrict: district || "",
      rawType: resolvedType,
      externalRef,
      candidate,
    });
  }

  return {
    totalRows: rawRows.length,
    summary: {
      creates: decisions.filter((d) => d.decision === "CREATE").length,
      updates: decisions.filter((d) => d.decision === "UPDATE").length,
      unchanged: decisions.filter((d) => d.decision === "UNCHANGED").length,
      skippedOwned: decisions.filter((d) => d.decision === "SKIP_OWNED").length,
      duplicatesInCsv: decisions.filter((d) => d.decision === "DUPLICATE_IN_CSV").length,
      ambiguousManualReview: decisions.filter((d) => d.decision === "AMBIGUOUS_MANUAL_REVIEW")
        .length,
      invalid: decisions.filter((d) => d.decision === "INVALID").length,
    },
    decisions,
  };
}
