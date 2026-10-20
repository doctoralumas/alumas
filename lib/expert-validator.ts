import { cleanProfessionalName, normalizeTextKey } from "./expert-directory";
import { normalizeProfessionalTitle, normalizeProvinceName } from "./expert-importer";

export interface CandidateProfileInput {
  name: string;
  title?: string;
  specialty?: string;
  hospital?: string;
  city?: string;
  district?: string | null;
  sourceId: string;
  sourceUrl: string;
}

export interface ProfileVerificationResult {
  isEligible: boolean;
  httpStatus: number | null;
  originalUrl: string;
  finalResolvedUrl: string;
  isRedirectedToGeneric: boolean;
  nameMatchedInEntity: boolean;
  extractedName: string;
  extractedTitle: string;
  extractedSpecialty: string;
  extractedHospital: string;
  extractedCity: string;
  extractedDistrict: string | null;
  geoConsistent: boolean;
  exclusionReason: string;
  rejectionCode?:
    | "HTTP_ERROR"
    | "TIMEOUT"
    | "GENERIC_PAGE_REDIRECT"
    | "INVALID_URL_STRUCTURE"
    | "NAME_NOT_IN_ENTITY"
    | "MISMATCHED_GEOGRAPHY"
    | "DISPUTED_OR_INACCESSIBLE";
}

const GENERIC_LISTING_PATTERNS = [
  /\/hekimlerimiz\/?$/i,
  /\/doktorlar\/?$/i,
  /\/doktorlarimiz\/?$/i,
  /\/tibbi-yayin-kurulu\/?$/i,
  /\/hekimler\/?$/i,
  /\/uzmanlarimiz\/?$/i,
  /\/arama\/?/i,
  /\/search\/?/i,
  /^https?:\/\/[^\/]+\/?$/i, // Root domain
];

export function isGenericDirectoryUrl(url: string): boolean {
  if (!url) return true;
  const cleanUrl = url.split("?")[0].split("#")[0].trim();
  return GENERIC_LISTING_PATTERNS.some((pattern) => pattern.test(cleanUrl));
}

export function isValidProfileUrlPattern(url: string, sourceId: string): boolean {
  if (!url || isGenericDirectoryUrl(url)) return false;
  const cleanUrl = url.split("?")[0].split("#")[0].trim();

  if (sourceId === "SRC-HOSPITADENT-01") {
    return /^https:\/\/www\.hospitadent\.com\/hekimlerimiz\/[a-z0-9-]+$/i.test(cleanUrl);
  }
  if (sourceId === "SRC-ACIBADEM-01") {
    return /^https:\/\/www\.acibadem\.com\.tr\/doktor\/[a-z0-9-]+\/?$/i.test(cleanUrl);
  }
  if (sourceId === "SRC-MEDICANA-01") {
    return /^https:\/\/www\.medicana\.com\.tr\/hekim-detay\/\d+\/[a-z0-9-]+$/i.test(cleanUrl);
  }
  // Generic fallback: must have at least 2 path segments and not be generic
  try {
    const parsed = new URL(cleanUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

export function formatTurkishProperCase(text: string): string {
  if (!text) return "";
  const parts = text.trim().split(/\s+/);
  return parts
    .map((word) => {
      if (/^[A-ZÇĞİÖŞÜ]\.$/i.test(word)) {
        return word.toLocaleUpperCase("tr-TR");
      }
      if (/^medicana/i.test(word)) return "Medicana";
      if (/^international/i.test(word)) return "International";
      if (/^hospitadent/i.test(word)) return "Hospitadent";
      if (/^acıbadem|^acibadem/i.test(word)) return "Acıbadem";
      if (word !== word.toLocaleUpperCase("tr-TR") && word !== word.toLocaleLowerCase("tr-TR")) {
        return word;
      }
      let w = word;
      if (w === "ŞAHIN") w = "ŞAHİN";
      const lower = w.toLocaleLowerCase("tr-TR");
      return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
    })
    .join(" ");
}

export async function fetchWithStrictTimeout(url: string, timeoutMs = 7000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(id);
    const text = await res.text();
    return {
      status: res.status,
      finalUrl: res.url,
      text,
      error: null,
    };
  } catch (err: any) {
    clearTimeout(id);
    return {
      status: null,
      finalUrl: url,
      text: "",
      error: err.name === "AbortError" ? "TIMEOUT" : err.message,
    };
  }
}

export async function verifyExpertProfile(
  candidate: CandidateProfileInput,
  timeoutMs = 7000
): Promise<ProfileVerificationResult> {
  const originalUrl = candidate.sourceUrl;

  // 1. Initial pattern validity
  if (!isValidProfileUrlPattern(originalUrl, candidate.sourceId)) {
    return {
      isEligible: false,
      httpStatus: null,
      originalUrl,
      finalResolvedUrl: originalUrl,
      isRedirectedToGeneric: isGenericDirectoryUrl(originalUrl),
      nameMatchedInEntity: false,
      extractedName: candidate.name,
      extractedTitle: candidate.title || "",
      extractedSpecialty: candidate.specialty || "",
      extractedHospital: candidate.hospital || "",
      extractedCity: candidate.city || "",
      extractedDistrict: candidate.district || null,
      geoConsistent: false,
      exclusionReason: isGenericDirectoryUrl(originalUrl)
        ? `GENERIC_PAGE_REDIRECT: URL doğrudan genel listeleme sayfasıdır (${originalUrl})`
        : `INVALID_URL_STRUCTURE: URL geçerli bir bireysel hekim profil formatında değil (${originalUrl})`,
      rejectionCode: isGenericDirectoryUrl(originalUrl)
        ? "GENERIC_PAGE_REDIRECT"
        : "INVALID_URL_STRUCTURE",
    };
  }

  // 2. Network probe
  const probe = await fetchWithStrictTimeout(originalUrl, timeoutMs);

  if (probe.status !== 200) {
    const code = probe.error === "TIMEOUT" ? "TIMEOUT" : "HTTP_ERROR";
    return {
      isEligible: false,
      httpStatus: probe.status,
      originalUrl,
      finalResolvedUrl: probe.finalUrl,
      isRedirectedToGeneric: false,
      nameMatchedInEntity: false,
      extractedName: candidate.name,
      extractedTitle: candidate.title || "",
      extractedSpecialty: candidate.specialty || "",
      extractedHospital: candidate.hospital || "",
      extractedCity: candidate.city || "",
      extractedDistrict: candidate.district || null,
      geoConsistent: false,
      exclusionReason: `HTTP_${probe.status || probe.error || "UNKNOWN"} - Profil sayfasına erişilemedi.`,
      rejectionCode: code,
    };
  }

  // 3. Final resolved destination check (following redirects)
  if (isGenericDirectoryUrl(probe.finalUrl)) {
    return {
      isEligible: false,
      httpStatus: 200,
      originalUrl,
      finalResolvedUrl: probe.finalUrl,
      isRedirectedToGeneric: true,
      nameMatchedInEntity: false,
      extractedName: candidate.name,
      extractedTitle: candidate.title || "",
      extractedSpecialty: candidate.specialty || "",
      extractedHospital: candidate.hospital || "",
      extractedCity: candidate.city || "",
      extractedDistrict: candidate.district || null,
      geoConsistent: false,
      exclusionReason: `GENERIC_PAGE_REDIRECT: Profil sayfası genel dizine yönlendi (${probe.finalUrl})`,
      rejectionCode: "GENERIC_PAGE_REDIRECT",
    };
  }

  // 4. Source-specific entity extraction
  let extractedName = "";
  let extractedTitle = "";
  let extractedSpecialty = "";
  let extractedHospital = "";
  let extractedCity = "";
  let extractedDistrict: string | null = null;
  let entityFound = false;

  const h1Match = probe.text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "";

  // Parse JSON-LD scripts
  const jsonLdBlocks = Array.from(
    probe.text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );

  if (candidate.sourceId === "SRC-HOSPITADENT-01") {
    let dentistObj: any = null;
    for (const block of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(block[1]);
        if (parsed["@type"] === "Dentist") {
          dentistObj = parsed;
          break;
        }
        if (parsed["@graph"]) {
          dentistObj = parsed["@graph"].find((g: any) => g["@type"] === "Dentist");
          if (dentistObj) break;
        }
      } catch {}
    }

    if (dentistObj) {
      entityFound = true;
      extractedName = cleanProfessionalName(dentistObj.name || h1Text);
      extractedTitle = normalizeProfessionalTitle(dentistObj.jobTitle || "Dt.", dentistObj.name);
      extractedSpecialty = dentistObj.medicalSpecialty || dentistObj.jobTitle || "Diş Hekimliği";
      extractedHospital = "Hospitadent Diş Hastanesi";
      
      // Individual attribution: schema addressLocality is explicitly "İstanbul"
      // and street address specifies Fulya/Mecidiyeköy
      const schemaLocality = dentistObj.address?.addressLocality;
      extractedCity = normalizeProvinceName(schemaLocality) || "İstanbul";
      extractedDistrict = "Şişli"; // Mecidiyeköy/Fulya is in Şişli district
    } else if (h1Text) {
      entityFound = true;
      extractedName = cleanProfessionalName(h1Text);
      extractedTitle = normalizeProfessionalTitle("Dt.", h1Text);
      extractedSpecialty = candidate.specialty || "Diş Hekimliği";
      extractedHospital = "Hospitadent Diş Hastanesi";
      extractedCity = "İstanbul";
      extractedDistrict = "Şişli";
    }
  } else if (candidate.sourceId === "SRC-ACIBADEM-01") {
    const nextDataMatch = probe.text.match(
      /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (nextDataMatch) {
      try {
        const parsed = JSON.parse(nextDataMatch[1]);
        const props =
          parsed.props?.pageProps?.data?.doctorDetailData?.components?.properties ||
          parsed.props?.pageProps?.data?.components?.properties;
        if (props && props.doctorName) {
          entityFound = true;
          const rawFull = `${props.doctorName} ${props.doctorSurname}`.trim();
          extractedName = formatTurkishProperCase(cleanProfessionalName(rawFull));
          extractedTitle = normalizeProfessionalTitle(props.doctorTitle || "Uzm. Dr.", rawFull);
          extractedSpecialty = props.medicalUnit?.[0]?.name || candidate.specialty || "Tıbbi Birim";
          const hospObj = props.hospitals?.[0];
          extractedHospital = hospObj?.hospitalName
            ? `Acıbadem ${hospObj.hospitalName}`
            : (hospObj?.name ? `Acıbadem ${hospObj.name}` : "Acıbadem Sağlık Grubu");
          const rawCity = hospObj?.cityName || hospObj?.properties?.cityName || hospObj?.location || "İstanbul";
          extractedCity = normalizeProvinceName(rawCity) || "İstanbul";
          extractedDistrict = hospObj?.properties?.addressLocality || null;
        }
      } catch {}
    }

    if (!entityFound && h1Text && !h1Text.includes("404")) {
      entityFound = true;
      extractedName = formatTurkishProperCase(cleanProfessionalName(h1Text));
      extractedTitle = normalizeProfessionalTitle(candidate.title || "Uzm. Dr.", h1Text);
      extractedSpecialty = candidate.specialty || "Tıbbi Birim";
      extractedHospital = candidate.hospital || "Acıbadem Sağlık Grubu";
      extractedCity = normalizeProvinceName(candidate.city) || "İstanbul";
      extractedDistrict = candidate.district || null;
    }
  } else if (candidate.sourceId === "SRC-MEDICANA-01") {
    let physicianObj: any = null;
    for (const block of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(block[1]);
        if (parsed["@type"] === "Physician") {
          physicianObj = parsed;
          break;
        }
      } catch {}
    }

    if (physicianObj) {
      entityFound = true;
      extractedName = formatTurkishProperCase(cleanProfessionalName(physicianObj.name || h1Text));
      extractedTitle = normalizeProfessionalTitle(physicianObj.honorificPrefix || "Uzm. Dr.", physicianObj.name);
      extractedSpecialty = (physicianObj.medicalSpecialty || candidate.specialty || "Tıbbi Birim")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)[0] || "Tıbbi Birim";
      extractedHospital = formatTurkishProperCase(physicianObj.affiliation?.name || "Medicana Sağlık Grubu");
      const rawCity = physicianObj.affiliation?.address?.addressRegion || "İstanbul";
      extractedCity = normalizeProvinceName(rawCity) || "İstanbul";
      extractedDistrict = physicianObj.affiliation?.address?.addressLocality || null;
    } else if (h1Text && !h1Text.includes("Hekimlerimiz")) {
      entityFound = true;
      extractedName = formatTurkishProperCase(cleanProfessionalName(h1Text));
      extractedTitle = normalizeProfessionalTitle(candidate.title || "Uzm. Dr.", h1Text);
      extractedSpecialty = candidate.specialty || "Tıbbi Birim";
      extractedHospital = candidate.hospital || "Medicana Sağlık Grubu";
      extractedCity = normalizeProvinceName(candidate.city) || "İstanbul";
      extractedDistrict = candidate.district || null;
    }
  }

  // 5. Strict entity-level name matching
  const expectedNorm = normalizeTextKey(candidate.name);
  const extractedNorm = normalizeTextKey(extractedName);
  const h1Norm = normalizeTextKey(h1Text);

  const nameMatched =
    (extractedNorm.length >= 3 &&
      (extractedNorm.includes(expectedNorm) || expectedNorm.includes(extractedNorm))) ||
    (h1Norm.length >= 3 &&
      (h1Norm.includes(expectedNorm) || expectedNorm.includes(h1Norm)));

  if (!entityFound || !nameMatched) {
    return {
      isEligible: false,
      httpStatus: 200,
      originalUrl,
      finalResolvedUrl: probe.finalUrl,
      isRedirectedToGeneric: false,
      nameMatchedInEntity: false,
      extractedName: extractedName || candidate.name,
      extractedTitle: extractedTitle || candidate.title || "",
      extractedSpecialty: extractedSpecialty || candidate.specialty || "",
      extractedHospital: extractedHospital || candidate.hospital || "",
      extractedCity: extractedCity || candidate.city || "",
      extractedDistrict,
      geoConsistent: false,
      exclusionReason: `NAME_NOT_IN_ENTITY: Hekim adı ('${candidate.name}') sayfa başlığında (H1: '${h1Text}') veya şemada doğrulanamadı.`,
      rejectionCode: "NAME_NOT_IN_ENTITY",
    };
  }

  // 6. Geographic consistency check
  let geoConsistent = true;
  if (extractedCity && extractedDistrict) {
    // If district is a city name itself (e.g. district = "İstanbul" while city = "Antalya")
    const districtAsCity = normalizeProvinceName(extractedDistrict);
    if (districtAsCity && districtAsCity !== extractedCity) {
      geoConsistent = false;
    }
  }

  if (!geoConsistent) {
    return {
      isEligible: false,
      httpStatus: 200,
      originalUrl,
      finalResolvedUrl: probe.finalUrl,
      isRedirectedToGeneric: false,
      nameMatchedInEntity: true,
      extractedName,
      extractedTitle,
      extractedSpecialty,
      extractedHospital,
      extractedCity,
      extractedDistrict,
      geoConsistent: false,
      exclusionReason: `MISMATCHED_GEOGRAPHY: İl ('${extractedCity}') ile ilçe ('${extractedDistrict}') birbiriyle çelişiyor.`,
      rejectionCode: "MISMATCHED_GEOGRAPHY",
    };
  }

  return {
    isEligible: true,
    httpStatus: 200,
    originalUrl,
    finalResolvedUrl: probe.finalUrl,
    isRedirectedToGeneric: false,
    nameMatchedInEntity: true,
    extractedName: formatTurkishProperCase(extractedName),
    extractedTitle,
    extractedSpecialty,
    extractedHospital,
    extractedCity,
    extractedDistrict,
    geoConsistent: true,
    exclusionReason: "NONE",
  };
}

