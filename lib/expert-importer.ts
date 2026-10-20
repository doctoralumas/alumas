import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import {
  cleanProfessionalName,
  canonicalExpertKey,
  normalizeTextKey,
} from "@/lib/expert-directory";

export interface RawExpertCsvRow {
  rowNumber: number;
  name: string;
  title: string;
  specialty: string;
  hospital?: string;
  city: string;
  district?: string;
  address?: string;
  phone?: string;
  officialWebsite?: string;
  description?: string;
  source: string;
  externalRef: string;
  lastVerifiedAt?: string;
}

export interface NormalizedExpertCandidate {
  rowNumber: number;
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
  externalRef: string;
  lastVerifiedAt: string | null;
  canonicalKey: string;
  warnings: string[];
}

export type ExpertImportDecisionKind =
  | "CREATE"
  | "UPDATE"
  | "UNCHANGED"
  | "SKIP_CLAIMED"
  | "DUPLICATE_IN_INPUT"
  | "AMBIGUOUS_MANUAL_REVIEW"
  | "INVALID";

export interface ExpertImportDecision {
  rowNumber: number;
  decision: ExpertImportDecisionKind;
  reason: string;
  rawName: string;
  rawTitle: string;
  rawSpecialty: string;
  rawHospital: string;
  rawCity: string;
  externalRef: string;
  candidate?: NormalizedExpertCandidate;
  matchedExistingId?: string;
  matchedDoctorId?: string;
  changedFields?: string[];
}

export interface ExpertImportPlan {
  totalRows: number;
  summary: {
    creates: number;
    updates: number;
    unchanged: number;
    skippedClaimed: number;
    duplicatesInInput: number;
    ambiguousManualReview: number;
    invalid: number;
  };
  decisions: ExpertImportDecision[];
}

export const TURKISH_PROVINCES = new Set([
  "ADANA", "ADIYAMAN", "AFYONKARAHISAR", "AGRI", "AMASYA", "ANKARA", "ANTALYA", "ARTVIN",
  "AYDIN", "BALIKESIR", "BILECIK", "BINGOL", "BITLIS", "BOLU", "BURDUR", "BURSA",
  "CANAKKALE", "CANKIRI", "CORUM", "DENIZLI", "DIYARBAKIR", "EDIRNE", "ELAZIG", "ERZINCAN",
  "ERZURUM", "ESKISEHIR", "GAZIANTEP", "GIRESUN", "GUMUSHANE", "HAKKARI", "HATAY", "ISPARTA",
  "MERSIN", "ISTANBUL", "IZMIR", "KARS", "KASTAMONU", "KAYSERI", "KIRKLARELI", "KIRSEHIR",
  "KOCAELI", "KONYA", "KUTAHYA", "MALATYA", "MANISA", "KAHRAMANMARAS", "MARDIN", "MUGLA",
  "MUS", "NEVSEHIR", "NIGDE", "ORDU", "RIZE", "SAKARYA", "SAMSUN", "SIIRT", "SINOP",
  "SIVAS", "TEKIRDAG", "TOKAT", "TRABZON", "TUNCELI", "SANLIURFA", "USAK", "VAN", "YOZGAT",
  "ZONGULDAK", "AKSARAY", "BAYBURT", "KARAMAN", "KIRIKKALE", "BATMAN", "SIRNAK", "BARTIN",
  "ARDAHAN", "IGDIR", "YALOVA", "KARABUK", "KILIS", "OSMANIYE", "DUZCE",
]);

export const PROVINCE_CANONICAL_NAMES: Record<string, string> = {
  ADANA: "Adana", ADIYAMAN: "Adıyaman", AFYONKARAHISAR: "Afyonkarahisar", AGRI: "Ağrı",
  AMASYA: "Amasya", ANKARA: "Ankara", ANTALYA: "Antalya", ARTVIN: "Artvin",
  AYDIN: "Aydın", BALIKESIR: "Balıkesir", BILECIK: "Bilecik", BINGOL: "Bingöl",
  BITLIS: "Bitlis", BOLU: "Bolu", BURDUR: "Burdur", BURSA: "Bursa",
  CANAKKALE: "Çanakkale", CANKIRI: "Çankırı", CORUM: "Çorum", DENIZLI: "Denizli",
  DIYARBAKIR: "Diyarbakır", EDIRNE: "Edirne", ELAZIG: "Elazığ", ERZINCAN: "Erzincan",
  ERZURUM: "Erzurum", ESKISEHIR: "Eskişehir", GAZIANTEP: "Gaziantep", GIRESUN: "Giresun",
  GUMUSHANE: "Gümüşhane", HAKKARI: "Hakkâri", HATAY: "Hatay", ISPARTA: "Isparta",
  MERSIN: "Mersin", ISTANBUL: "İstanbul", IZMIR: "İzmir", KARS: "Kars",
  KASTAMONU: "Kastamonu", KAYSERI: "Kayseri", KIRKLARELI: "Kırklareli", KIRSEHIR: "Kırşehir",
  KOCAELI: "Kocaeli", KONYA: "Konya", KUTAHYA: "Kütahya", MALATYA: "Malatya",
  MANISA: "Manisa", KAHRAMANMARAS: "Kahramanmaraş", MARDIN: "Mardin", MUGLA: "Muğla",
  MUS: "Muş", NEVSEHIR: "Nevşehir", NIGDE: "Niğde", ORDU: "Ordu",
  RIZE: "Rize", SAKARYA: "Sakarya", SAMSUN: "Samsun", SIIRT: "Siirt",
  SINOP: "Sinop", SIVAS: "Sivas", TEKIRDAG: "Tekirdağ", TOKAT: "Tokat",
  TRABZON: "Trabzon", TUNCELI: "Tunceli", SANLIURFA: "Şanlıurfa", USAK: "Uşak",
  VAN: "Van", YOZGAT: "Yozgat", ZONGULDAK: "Zonguldak", AKSARAY: "Aksaray",
  BAYBURT: "Bayburt", KARAMAN: "Karaman", KIRIKKALE: "Kırıkkale", BATMAN: "Batman",
  SIRNAK: "Şırnak", BARTIN: "Bartın", ARDAHAN: "Ardahan", IGDIR: "Iğdır",
  YALOVA: "Yalova", KARABUK: "Karabük", KILIS: "Kilis", OSMANIYE: "Osmaniye",
  DUZCE: "Düzce",
};

export const STANDARD_TITLES: Record<string, string> = {
  // Physicians
  "PROF. DR.": "Prof. Dr.",
  "PROF.DR.": "Prof. Dr.",
  "PROF DR": "Prof. Dr.",
  "PROF DOKTOR": "Prof. Dr.",
  "PROF. DOKTOR": "Prof. Dr.",
  "PROFESÖR DOKTOR": "Prof. Dr.",
  "PROFESOR DOKTOR": "Prof. Dr.",
  "DOC. DR.": "Doç. Dr.",
  "DOÇ. DR.": "Doç. Dr.",
  "DOÇ.DR.": "Doç. Dr.",
  "DOC DR": "Doç. Dr.",
  "DOÇ DR": "Doç. Dr.",
  "DOÇ DOKTOR": "Doç. Dr.",
  "DOC DOKTOR": "Doç. Dr.",
  "DOÇENT DOKTOR": "Doç. Dr.",
  "DOCENT DOKTOR": "Doç. Dr.",
  "UZM. DR.": "Uzm. Dr.",
  "UZM.DR.": "Uzm. Dr.",
  "UZM DR": "Uzm. Dr.",
  "UZMAN DOKTOR": "Uzm. Dr.",
  "OP. DR.": "Op. Dr.",
  "OP.DR.": "Op. Dr.",
  "OP DR": "Op. Dr.",
  "OPERATOR DOKTOR": "Op. Dr.",
  "OPERATÖR DOKTOR": "Op. Dr.",
  "DR.": "Dr.",
  "DR": "Dr.",
  "DOKTOR": "Dr.",
  // Dentists
  "DT.": "Dt.",
  "DT": "Dt.",
  "DIS HEKIMI": "Dt.",
  "DİŞ HEKİMİ": "Dt.",
  "UZM. DT.": "Uzm. Dt.",
  "UZM.DT.": "Uzm. Dt.",
  "UZM DT": "Uzm. Dt.",
  "UZMAN DIS HEKIMI": "Uzm. Dt.",
  "UZMAN DİŞ HEKİMİ": "Uzm. Dt.",
  // Dietitians
  "DYT.": "Dyt.",
  "DYT": "Dyt.",
  "DIYETISYEN": "Dyt.",
  "DİYETİSYEN": "Dyt.",
  "UZM. DYT.": "Uzm. Dyt.",
  "UZM.DYT.": "Uzm. Dyt.",
  "UZM DYT": "Uzm. Dyt.",
  "UZMAN DIYETISYEN": "Uzm. Dyt.",
  "UZMAN DİYETİSYEN": "Uzm. Dyt.",
  // Physiotherapists
  "FZT.": "Fzt.",
  "FZT": "Fzt.",
  "FIZYOTERAPIST": "Fzt.",
  "FİZYOTERAPİST": "Fzt.",
  "UZM. FZT.": "Uzm. Fzt.",
  "UZM.FZT.": "Uzm. Fzt.",
  "UZM FZT": "Uzm. Fzt.",
  "UZMAN FIZYOTERAPIST": "Uzm. Fzt.",
  "UZMAN FİZYOTERAPİST": "Uzm. Fzt.",
  // Psychologists
  "PSK.": "Psk.",
  "PSK": "Psk.",
  "PSIKOLOG": "Psk.",
  "PSİKOLOG": "Psk.",
  "UZM. PSK.": "Uzm. Psk.",
  "UZM.PSK.": "Uzm. Psk.",
  "UZM PSK": "Uzm. Psk.",
  "UZMAN PSIKOLOG": "Uzm. Psk.",
  "KLINIK PSK.": "Klinik Psk.",
  "KLİNİK PSK.": "Klinik Psk.",
  "KLINIK PSK": "Klinik Psk.",
  "KLİNİK PSK": "Klinik Psk.",
  "KLINIK PSIKOLOG": "Klinik Psk.",
  "KLİNİK PSİKOLOG": "Klinik Psk.",
};

export function normalizeProvinceName(rawCity: string | null | undefined): string | null {
  if (!rawCity) return null;
  const key = normalizeTextKey(rawCity).toUpperCase().replace(/-/g, "");
  if (TURKISH_PROVINCES.has(key)) {
    return PROVINCE_CANONICAL_NAMES[key] || rawCity.trim();
  }
  return null;
}

export function normalizeProfessionalTitle(rawTitle: string | null | undefined, name?: string): string {
  const t = String(rawTitle || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (STANDARD_TITLES[t]) {
    return STANDARD_TITLES[t];
  }
  // Try extracting from name if title is generic
  if (name) {
    const upperName = name.toUpperCase();
    if (upperName.startsWith("PROF. DR.") || upperName.startsWith("PROF.DR.")) return "Prof. Dr.";
    if (upperName.startsWith("DOÇ. DR.") || upperName.startsWith("DOC. DR.")) return "Doç. Dr.";
    if (upperName.startsWith("OP. DR.") || upperName.startsWith("OP.DR.")) return "Op. Dr.";
    if (upperName.startsWith("UZM. DR.") || upperName.startsWith("UZM.DR.")) return "Uzm. Dr.";
    if (upperName.startsWith("UZM. DT.")) return "Uzm. Dt.";
    if (upperName.startsWith("DT.") || upperName.startsWith("DT ")) return "Dt.";
    if (upperName.startsWith("UZM. DYT.")) return "Uzm. Dyt.";
    if (upperName.startsWith("DYT.") || upperName.startsWith("DYT ")) return "Dyt.";
    if (upperName.startsWith("UZM. FZT.")) return "Uzm. Fzt.";
    if (upperName.startsWith("FZT.") || upperName.startsWith("FZT ")) return "Fzt.";
    if (upperName.startsWith("UZM. PSK.")) return "Uzm. Psk.";
    if (upperName.startsWith("KLINIK PSK.") || upperName.startsWith("KLİNİK PSK.")) return "Klinik Psk.";
    if (upperName.startsWith("PSK.") || upperName.startsWith("PSK ")) return "Psk.";
    if (upperName.startsWith("DR.") || upperName.startsWith("DR ")) return "Dr.";
  }
  return rawTitle?.trim() || "Uzm. Dr.";
}

export function generateDoctorSlug(
  cleanName: string,
  specialty: string,
  city: string,
  disambiguation?: string
): string {
  const normName = normalizeTextKey(cleanName);
  const normSpec = normalizeTextKey(specialty);
  const normCity = normalizeTextKey(city);

  let base = `dr-${normName}-${normSpec}-${normCity}`;
  if (disambiguation) {
    base += `-${normalizeTextKey(disambiguation)}`;
  }
  return base.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Fast RFC-compliant CSV parser handling quoted multiline cells, commas in quotes, and UTF-8.
 */
export function parseExpertCsv(content: string): RawExpertCsvRow[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  // Normalize CRLF to LF
  const cleanContent = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < cleanContent.length; i++) {
    const ch = cleanContent[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      currentLine += ch;
    } else if (ch === "\n" && !inQuotes) {
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += ch;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  // Parse header
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let inside = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inside && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inside = !inside;
        }
      } else if (c === "," && !inside) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const header = parseRow(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, "")
  );

  const getCol = (cells: string[], names: string[]): string => {
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0 && idx < cells.length) return cells[idx];
    }
    return "";
  };

  const rows: RawExpertCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (!cells.some((c) => c.length > 0)) continue;

    rows.push({
      rowNumber: i + 1,
      name: getCol(cells, ["name", "doktor_adi", "hekim_adi", "uzman_adi", "full_name"]),
      title: getCol(cells, ["title", "unvan"]),
      specialty: getCol(cells, ["specialty", "uzmanlik", "brans", "bolum"]),
      hospital: getCol(cells, ["hospital", "hastane", "kurum", "klinik", "affiliated_hospital"]),
      city: getCol(cells, ["city", "sehir", "il"]),
      district: getCol(cells, ["district", "ilce"]),
      address: getCol(cells, ["address", "adres"]),
      phone: getCol(cells, ["phone", "telefon"]),
      officialWebsite: getCol(cells, ["officialwebsite", "website", "url", "hekim_url", "profil_url"]),
      description: getCol(cells, ["description", "aciklama", "bio"]),
      source: getCol(cells, ["source", "kaynak"]),
      externalRef: getCol(cells, ["externalref", "ref", "id", "external_id"]),
      lastVerifiedAt: getCol(cells, ["lastverifiedat", "verified_at", "tarih"]),
    });
  }

  return rows;
}

export function normalizeExpertRow(raw: RawExpertCsvRow): {
  candidate?: NormalizedExpertCandidate;
  error?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const rawName = (raw.name || "").trim();
  if (!rawName) return { error: "İsim boş olamaz.", warnings };

  const cleanName = cleanProfessionalName(rawName);
  if (!cleanName || cleanName.length < 3) {
    return { error: `Geçersiz isim: "${rawName}"`, warnings };
  }

  const title = normalizeProfessionalTitle(raw.title, rawName);
  const specialty = (raw.specialty || "").trim();
  if (!specialty || specialty.length < 2) {
    return { error: `Geçersiz veya eksik uzmanlık alanı: "${raw.specialty}"`, warnings };
  }

  const rawCity = (raw.city || "").trim();
  const canonicalCity = normalizeProvinceName(rawCity);
  if (!canonicalCity) {
    return { error: `Bilinmeyen veya geçersiz şehir: "${rawCity}"`, warnings };
  }

  let website: string | null = null;
  if (raw.officialWebsite && raw.officialWebsite.trim()) {
    const normalizedUrl = normalizeOfficialWebsiteUrl(raw.officialWebsite.trim());
    if (!normalizedUrl) {
      warnings.push(`Geçersiz web adresi temizlendi: "${raw.officialWebsite}"`);
    } else {
      website = normalizedUrl;
    }
  }

  const externalRef = (raw.externalRef || "").trim();
  if (!externalRef) {
    return { error: "externalRef (benzersiz harici referans) zorunludur.", warnings };
  }

  const source = (raw.source || "").trim();
  if (!source) {
    return { error: "source (kaynak/kurum adı) zorunludur.", warnings };
  }
  const canonicalKey = canonicalExpertKey(cleanName, canonicalCity, specialty);
  const slug = generateDoctorSlug(cleanName, specialty, canonicalCity);

  return {
    candidate: {
      rowNumber: raw.rowNumber,
      id: `dir-doc-${normalizeTextKey(externalRef).slice(0, 36)}`,
      slug,
      name: cleanName,
      title,
      specialty,
      hospital: raw.hospital ? raw.hospital.trim() : null,
      city: canonicalCity,
      district: raw.district ? raw.district.trim() : null,
      address: raw.address ? raw.address.trim() : null,
      phone: raw.phone ? raw.phone.trim() : null,
      officialWebsite: website,
      description: raw.description ? raw.description.trim() : null,
      source,
      externalRef,
      lastVerifiedAt: raw.lastVerifiedAt ? new Date(raw.lastVerifiedAt).toISOString() : new Date().toISOString(),
      canonicalKey,
      warnings,
    },
    warnings,
  };
}

export function planExpertCsvImport(
  rawRows: RawExpertCsvRow[],
  existingDirectoryDoctors: any[] = [],
  existingRegisteredDoctors: any[] = []
): ExpertImportPlan {
  const decisions: ExpertImportDecision[] = [];
  const counts = {
    creates: 0,
    updates: 0,
    unchanged: 0,
    skippedClaimed: 0,
    duplicatesInInput: 0,
    ambiguousManualReview: 0,
    invalid: 0,
  };

  // Indexes for fast lookup
  const byExternalRef = new Map<string, any>();
  const bySlug = new Map<string, any>();
  const byCanonicalKeyAndHospital = new Map<string, any>();

  for (const dir of existingDirectoryDoctors) {
    if (dir.externalRef) byExternalRef.set(dir.externalRef, dir);
    if (dir.slug) bySlug.set(dir.slug, dir);
    const key = `${dir.canonicalKey || canonicalExpertKey(dir.name, dir.city, dir.specialty)}::${normalizeTextKey(dir.hospital)}`;
    byCanonicalKeyAndHospital.set(key, dir);
  }

  const registeredByDoctorId = new Map<string, any>();
  for (const reg of existingRegisteredDoctors) {
    registeredByDoctorId.set(reg.id, reg);
  }

  // Intra-batch tracking
  const batchExternalRefs = new Set<string>();
  const batchCanonicalKeys = new Set<string>();
  const batchSlugs = new Set<string>();

  for (const raw of rawRows) {
    const { candidate, error, warnings } = normalizeExpertRow(raw);

    if (error || !candidate) {
      counts.invalid++;
      decisions.push({
        rowNumber: raw.rowNumber,
        decision: "INVALID",
        reason: error || "Bilinmeyen doğrulama hatası",
        rawName: raw.name,
        rawTitle: raw.title,
        rawSpecialty: raw.specialty,
        rawHospital: raw.hospital || "",
        rawCity: raw.city,
        externalRef: raw.externalRef,
      });
      continue;
    }

    // 1. Check intra-CSV duplicate
    if (batchExternalRefs.has(candidate.externalRef)) {
      counts.duplicatesInInput++;
      decisions.push({
        rowNumber: raw.rowNumber,
        decision: "DUPLICATE_IN_INPUT",
        reason: `Dosya içerisinde mükerrer externalRef: "${candidate.externalRef}"`,
        rawName: raw.name,
        rawTitle: raw.title,
        rawSpecialty: raw.specialty,
        rawHospital: raw.hospital || "",
        rawCity: raw.city,
        externalRef: raw.externalRef,
        candidate,
      });
      continue;
    }
    batchExternalRefs.add(candidate.externalRef);

    // 2. Check existing record in DB by externalRef or slug
    const matched = byExternalRef.get(candidate.externalRef) || bySlug.get(candidate.slug);

    if (matched) {
      // If already claimed by a registered doctor, do NOT touch via automated pipeline
      if (matched.doctorId) {
        counts.skippedClaimed++;
        decisions.push({
          rowNumber: raw.rowNumber,
          decision: "SKIP_CLAIMED",
          reason: `Kayıtlı uzman tarafından sahiplenilmiş (Doctor ID: ${matched.doctorId}). Otomatik içe aktarım atlandı.`,
          rawName: raw.name,
          rawTitle: raw.title,
          rawSpecialty: raw.specialty,
          rawHospital: raw.hospital || "",
          rawCity: raw.city,
          externalRef: raw.externalRef,
          candidate,
          matchedExistingId: matched.id,
          matchedDoctorId: matched.doctorId,
        });
        continue;
      }

      // Check field diffs
      const changedFields: string[] = [];
      if (matched.name !== candidate.name) changedFields.push("name");
      if (matched.title !== candidate.title) changedFields.push("title");
      if (matched.specialty !== candidate.specialty) changedFields.push("specialty");
      if ((matched.hospital || null) !== candidate.hospital) changedFields.push("hospital");
      if (matched.city !== candidate.city) changedFields.push("city");
      if ((matched.district || null) !== candidate.district) changedFields.push("district");
      if ((matched.officialWebsite || null) !== candidate.officialWebsite) changedFields.push("officialWebsite");
      if ((matched.phone || null) !== candidate.phone) changedFields.push("phone");
      if ((matched.description || null) !== candidate.description) changedFields.push("description");

      if (changedFields.length === 0) {
        counts.unchanged++;
        decisions.push({
          rowNumber: raw.rowNumber,
          decision: "UNCHANGED",
          reason: "Kayıt veritabanında tamamen aynı değerlerle mevcut.",
          rawName: raw.name,
          rawTitle: raw.title,
          rawSpecialty: raw.specialty,
          rawHospital: raw.hospital || "",
          rawCity: raw.city,
          externalRef: raw.externalRef,
          candidate,
          matchedExistingId: matched.id,
        });
      } else {
        counts.updates++;
        decisions.push({
          rowNumber: raw.rowNumber,
          decision: "UPDATE",
          reason: `Mevcut kayıt güncellenecek (${changedFields.join(", ")}).`,
          rawName: raw.name,
          rawTitle: raw.title,
          rawSpecialty: raw.specialty,
          rawHospital: raw.hospital || "",
          rawCity: raw.city,
          externalRef: raw.externalRef,
          candidate,
          matchedExistingId: matched.id,
          changedFields,
        });
      }
      continue;
    }

    // 3. Ensure slug uniqueness within batch if multiple doctors have identical name/spec/city in different hospitals
    let resolvedSlug = candidate.slug;
    if (batchSlugs.has(resolvedSlug)) {
      resolvedSlug = generateDoctorSlug(
        candidate.name,
        candidate.specialty,
        candidate.city,
        candidate.hospital || candidate.externalRef.slice(-6)
      );
      candidate.slug = resolvedSlug;
    }
    batchSlugs.add(resolvedSlug);

    // 4. Safe brand new record
    counts.creates++;
    decisions.push({
      rowNumber: raw.rowNumber,
      decision: "CREATE",
      reason: "Yeni geçerli dizin uzman kaydı oluşturulacak.",
      rawName: raw.name,
      rawTitle: raw.title,
      rawSpecialty: raw.specialty,
      rawHospital: raw.hospital || "",
      rawCity: raw.city,
      externalRef: raw.externalRef,
      candidate,
    });
  }

  return {
    totalRows: rawRows.length,
    summary: counts,
    decisions,
  };
}
