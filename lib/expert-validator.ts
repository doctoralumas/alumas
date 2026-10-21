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
  extractedAddress: string | null;
  extractedPhone: string | null;
  geoConsistent: boolean;
  exclusionReason: string;
  rejectionCode?:
    | "HTTP_ERROR"
    | "TIMEOUT"
    | "GENERIC_PAGE_REDIRECT"
    | "INVALID_URL_STRUCTURE"
    | "NAME_NOT_IN_ENTITY"
    | "MISMATCHED_GEOGRAPHY"
    | "INSUFFICIENT_LOCATION_EVIDENCE"
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

export const HOSPITADENT_BRANCH_MAP: Record<
  string,
  { city: string; district: string; defaultAddress: string; defaultPhone: string; branchTitle: string }
> = {
  "Mecidiyeköy": {
    city: "İstanbul",
    district: "Şişli",
    defaultAddress: "Fulya, Akıncı Bayırı Sk. No:8, 34394 Şişli/İstanbul",
    defaultPhone: "+90 212 274 53 53",
    branchTitle: "Hospitadent Mecidiyeköy Diş Hastanesi",
  },
  "Bakırköy": {
    city: "İstanbul",
    district: "Bakırköy",
    defaultAddress: "Zuhuratbaba, İncirli Cd. No:113, 34147 Bakırköy/İstanbul",
    defaultPhone: "+90 212 543 43 68",
    branchTitle: "Hospitadent Bakırköy Diş Hastanesi",
  },
  "Bağcılar": {
    city: "İstanbul",
    district: "Bağcılar",
    defaultAddress: "Mahmutbey Caddesi No:204 Ateştuğla, 34218 Bağcılar/İstanbul",
    defaultPhone: "+90 212 651 20 00",
    branchTitle: "Hospitadent Bağcılar Diş Hastanesi",
  },
  "Fatih": {
    city: "İstanbul",
    district: "Fatih",
    defaultAddress: "Akşemsettin, Akdeniz Cd. No:28, 34080 Fatih/İstanbul",
    defaultPhone: "+90 212 521 10 10",
    branchTitle: "Hospitadent Fatih Diş Hastanesi",
  },
  "Çamlıca": {
    city: "İstanbul",
    district: "Üsküdar",
    defaultAddress: "Kısıklı Mah, Çamlıca, Alemdağ Cd No:77, 34660 Üsküdar/İstanbul",
    defaultPhone: "+90 216 316 00 16",
    branchTitle: "Hospitadent Çamlıca Diş Hastanesi",
  },
  "Pendik": {
    city: "İstanbul",
    district: "Pendik",
    defaultAddress: "Bahçelievler, Aydınlı Yolu Cd No:26, 34893 Pendik/İstanbul",
    defaultPhone: "+90 216 491 30 30",
    branchTitle: "Hospitadent Pendik Diş Hastanesi",
  },
  "Şerifali": {
    city: "İstanbul",
    district: "Ümraniye",
    defaultAddress: "Şerifali, Turgut Özal Blv No:99, 34775 Ümraniye/İstanbul",
    defaultPhone: "+90 216 316 47 47",
    branchTitle: "Hospitadent Şerifali Diş Hastanesi",
  },
  "Göktürk": {
    city: "İstanbul",
    district: "Eyüpsultan",
    defaultAddress: "Göktürk Merkez Mah. İstanbul Cad. Yalınevler No:56 H, 34077 Eyüpsultan/İstanbul",
    defaultPhone: "+90 212 400 00 68",
    branchTitle: "Hospitadent Göktürk Diş Kliniği",
  },
  "Cevizlibağ": {
    city: "İstanbul",
    district: "Zeytinburnu",
    defaultAddress: "Merkezefendi Mah. D-100 Güney Yan Yol Cad. No:25, 34015 Zeytinburnu/İstanbul",
    defaultPhone: "+90 212 483 10 10",
    branchTitle: "Hospitadent Cevizlibağ Diş Hastanesi",
  },
  "Kavacık": {
    city: "İstanbul",
    district: "Beykoz",
    defaultAddress: "Rüzgarlıbahçe Mah. Cumhuriyet Cad. No:114, 34805 Beykoz/İstanbul",
    defaultPhone: "+90 216 680 00 00",
    branchTitle: "Hospitadent Kavacık Diş Hastanesi",
  },
  "Çayyolu": {
    city: "Ankara",
    district: "Çankaya",
    defaultAddress: "Prof. Dr. Ahmet Taner Kışlalı, Alacaatlı Cd. No:3, 06810 Çankaya/Ankara",
    defaultPhone: "+90 312 468 41 44",
    branchTitle: "Hospitadent Çayyolu Diş Hastanesi",
  },
  "Kayseri": {
    city: "Kayseri",
    district: "Melikgazi",
    defaultAddress: "Köşk Mah., Talas Blv., No:29a ve No:29b Melikgazi/Kayseri",
    defaultPhone: "+90 352 230 10 00",
    branchTitle: "Hospitadent Kayseri Diş Hastanesi",
  },
  "Antalya": {
    city: "Antalya",
    district: "Muratpaşa",
    defaultAddress: "Demircikara Mah. Burhanettin Onat Cad. Ocean City No:59B/D, 07100 Muratpaşa/Antalya",
    defaultPhone: "+90 242 455 59 99",
    branchTitle: "Hospitadent Antalya Diş Hastanesi",
  },
  "Alanya": {
    city: "Antalya",
    district: "Alanya",
    defaultAddress: "Hacet, Keykubat Blv. No:64/B, 07400 Alanya/Antalya",
    defaultPhone: "+90 242 513 49 51",
    branchTitle: "Hospitadent Alanya Diş Hastanesi",
  },
  "Bodrum Diş Kliniği": {
    city: "Muğla",
    district: "Bodrum",
    defaultAddress: "Dirmil Mh. İnönü Cd. no:23/1 Yalıkavak, 48990 Bodrum/Muğla",
    defaultPhone: "+90 252 500 00 22",
    branchTitle: "Hospitadent Bodrum Diş Kliniği",
  },
  "Kocaeli": {
    city: "Kocaeli",
    district: "İzmit",
    defaultAddress: "Kadıköy, Atatürk Blv. 8/A, 41050 İzmit/Kocaeli",
    defaultPhone: "+90 262 610 11 10",
    branchTitle: "Hospitadent Kocaeli Diş Hastanesi",
  },
  "Bursa": {
    city: "Bursa",
    district: "Nilüfer",
    defaultAddress: "İhsaniye Mah. İzmir Yolu Cad. No:114, 16130 Nilüfer/Bursa",
    defaultPhone: "+90 224 451 00 00",
    branchTitle: "Hospitadent Bursa Diş Hastanesi",
  },
};

export const ACIBADEM_HOSPITAL_GEO_MAP: Record<
  string,
  { city: string; district: string; address: string; phone: string }
> = {
  "Acıbadem Ataşehir Hastanesi": {
    city: "İstanbul",
    district: "Ataşehir",
    address: "Atatürk Mah. Turgut Özal Bulvarı A Blok, No:11 Ataşehir / İstanbul",
    phone: "+90 216 512 44 44",
  },
  "Acıbadem Bursa Hastanesi": {
    city: "Bursa",
    district: "Nilüfer",
    address: "Fatih Sultan Mehmet Bulvarı Sümer Sok No:1, 16110 Nilüfer / Bursa",
    phone: "+90 224 270 44 44",
  },
  "Acıbadem Kent Hastanesi (İzmir)": {
    city: "İzmir",
    district: "Çiğli",
    address: "8229/1 Sokak No:56, 35630 Çiğli / İzmir",
    phone: "+90 232 398 00 00",
  },
  "Acıbadem Maslak Hastanesi": {
    city: "İstanbul",
    district: "Sarıyer",
    address: "Büyükdere Cad. No:40 Maslak, 34457 Sarıyer / İstanbul",
    phone: "+90 212 304 44 44",
  },
  "Acıbadem Altunizade Hastanesi": {
    city: "İstanbul",
    district: "Üsküdar",
    address: "Altunizade Mah. Yurtcan Sokağı No:1, 34662 Üsküdar / İstanbul",
    phone: "+90 216 649 44 44",
  },
  "Acıbadem Kayseri Hastanesi": {
    city: "Kayseri",
    district: "Melikgazi",
    address: "Gevher Nesibe Mah. Gür Sok. No:4, 38010 Melikgazi / Kayseri",
    phone: "+90 352 207 44 44",
  },
  "Acıbadem Bakırköy Hastanesi": {
    city: "İstanbul",
    district: "Bakırköy",
    address: "Halit Ziya Uşaklıgil Cad. No:1, 34140 Bakırköy / İstanbul",
    phone: "+90 212 414 44 44",
  },
  "Acıbadem Atakent Hastanesi": {
    city: "İstanbul",
    district: "Küçükçekmece",
    address: "Halkalı Merkez Mah. Turgut Özal Bulvarı No:16, 34303 Küçükçekmece / İstanbul",
    phone: "+90 212 404 44 44",
  },
  "Acıbadem Bodrum Tıp Merkezi": {
    city: "Muğla",
    district: "Bodrum",
    address: "Ortakent Yahşi Mah. Gölbaşı Sok. No:11, 48420 Bodrum / Muğla",
    phone: "+90 252 311 44 44",
  },
  "Acıbadem Kozyatağı Hastanesi": {
    city: "İstanbul",
    district: "Kadıköy",
    address: "İnönü Cad. Okur Sok. No:20 Kozyatağı, 34742 Kadıköy / İstanbul",
    phone: "+90 216 571 44 44",
  },
  "Acıbadem Taksim Hastanesi": {
    city: "İstanbul",
    district: "Beyoğlu",
    address: "İnönü Mah. Nizamiye Cad. No:9/1 Taksim, 34373 Beyoğlu / İstanbul",
    phone: "+90 212 274 44 44",
  },
  "Acıbadem International Hastanesi": {
    city: "İstanbul",
    district: "Bakırköy",
    address: "İstanbul Cad. No:82 Yeşilköy, 34149 Bakırköy / İstanbul",
    phone: "+90 212 468 44 44",
  },
  "Acıbadem Adana Hastanesi": {
    city: "Adana",
    district: "Seyhan",
    address: "Cumhuriyet Cad. No:66, 01130 Seyhan / Adana",
    phone: "+90 322 455 44 44",
  },
  "Acıbadem Fulya Hastanesi": {
    city: "İstanbul",
    district: "Beşiktaş",
    address: "Hakkı Yeten Cad. No:19 Dikilitaş, 34349 Beşiktaş / İstanbul",
    phone: "+90 212 306 44 44",
  },
  "Acıbadem Bodrum Hastanesi": {
    city: "Muğla",
    district: "Bodrum",
    address: "Ortakent Yahşi Mah. Gölbaşı Sok. No:11, 48420 Bodrum / Muğla",
    phone: "+90 252 311 44 44",
  },
  "Acıbadem Ankara Hastanesi": {
    city: "Ankara",
    district: "Çankaya",
    address: "Turan Güneş Bulvarı 630. Sokak No:6 Oran, 06450 Çankaya / Ankara",
    phone: "+90 312 593 44 44",
  },
  "Acıbadem Kartal Hastanesi": {
    city: "İstanbul",
    district: "Kartal",
    address: "Cevizli Mah. Tugay Yolu Cad. No:20/B, 34846 Kartal / İstanbul",
    phone: "+90 216 571 44 44",
  },
};

export function isGenericDirectoryUrl(url: string, isPersonalWebsite = false): boolean {
  if (!url) return true;
  const cleanUrl = url.split("?")[0].split("#")[0].trim();
  if (isPersonalWebsite) {
    return GENERIC_LISTING_PATTERNS.filter(
      (p) => p.source !== "^https?:\\/\\/[^\\/]+\\/?$"
    ).some((pattern) => pattern.test(cleanUrl));
  }
  return GENERIC_LISTING_PATTERNS.some((pattern) => pattern.test(cleanUrl));
}

export function isValidProfileUrlPattern(url: string, sourceId: string): boolean {
  const isPersonalWebsite = sourceId === "SRC-INDEPENDENT-WEBSITE" || sourceId.startsWith("SRC-PERSONAL-");
  if (!url || isGenericDirectoryUrl(url, isPersonalWebsite)) return false;
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
  if (sourceId === "SRC-DOKTORSITESI-01") {
    return /^https:\/\/www\.doktorsitesi\.com\/[a-z0-9-çğıöşü]+\/[a-z0-9-çğıöşü]+\/[a-z0-9-çğıöşü]+$/i.test(cleanUrl);
  }
  if (isPersonalWebsite) {
    try {
      new URL(cleanUrl);
      return true;
    } catch {
      return false;
    }
  }
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
      extractedAddress: null,
      extractedPhone: null,
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
      extractedAddress: null,
      extractedPhone: null,
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
      extractedAddress: null,
      extractedPhone: null,
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
  let extractedAddress: string | null = null;
  let extractedPhone: string | null = null;
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

    if (dentistObj || h1Text) {
      entityFound = true;
      extractedName = cleanProfessionalName(dentistObj?.name || h1Text);
      extractedTitle = normalizeProfessionalTitle(dentistObj?.jobTitle || "Dt.", dentistObj?.name || h1Text);
      extractedSpecialty = dentistObj?.medicalSpecialty || dentistObj?.jobTitle || "Diş Hekimliği";

      // CRITICAL: Extract individual workplace from "Çalıştığı Şube" block ONLY!
      // Never use corporate headquarters or footer!
      const subeHeadingIdx = probe.text.indexOf("Çalıştığı Şube");
      if (subeHeadingIdx !== -1) {
        const block = probe.text.slice(subeHeadingIdx, subeHeadingIdx + 1000);
        const h3Match = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
        const rawBranchName = h3Match ? h3Match[1].replace(/<[^>]+>/g, "").trim() : "";
        const pMatches = Array.from(block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map((m) =>
          m[1].replace(/<[^>]+>/g, "").trim()
        );

        const phoneMatch = block.match(/href=["']tel:([^"']+)["']/i);
        const phone = phoneMatch ? phoneMatch[1].trim() : null;
        const address = pMatches[1] && pMatches[1] !== "null" ? pMatches[1] : null;

        const branchInfo = rawBranchName ? HOSPITADENT_BRANCH_MAP[rawBranchName] : null;

        if (branchInfo && address) {
          extractedHospital = branchInfo.branchTitle;
          extractedCity = branchInfo.city;
          extractedDistrict = branchInfo.district;
          extractedAddress = address;
          extractedPhone = phone || branchInfo.defaultPhone;
        } else if (branchInfo && !address) {
          // If address is explicitly missing or null on the profile, quarantine!
          return {
            isEligible: false,
            httpStatus: 200,
            originalUrl,
            finalResolvedUrl: probe.finalUrl,
            isRedirectedToGeneric: false,
            nameMatchedInEntity: true,
            extractedName: formatTurkishProperCase(extractedName),
            extractedTitle,
            extractedSpecialty,
            extractedHospital: branchInfo.branchTitle,
            extractedCity: branchInfo.city,
            extractedDistrict: branchInfo.district,
            extractedAddress: null,
            extractedPhone: phone,
            geoConsistent: true,
            exclusionReason: `INSUFFICIENT_LOCATION_EVIDENCE: Hekim profilinde ('${rawBranchName}') şube için somut sokak adresi ve doğrudan iletişim bilgisi bulunamadı.`,
            rejectionCode: "INSUFFICIENT_LOCATION_EVIDENCE",
          };
        } else {
          return {
            isEligible: false,
            httpStatus: 200,
            originalUrl,
            finalResolvedUrl: probe.finalUrl,
            isRedirectedToGeneric: false,
            nameMatchedInEntity: true,
            extractedName: formatTurkishProperCase(extractedName),
            extractedTitle,
            extractedSpecialty,
            extractedHospital: "Hospitadent Diş Hastanesi",
            extractedCity: "",
            extractedDistrict: null,
            extractedAddress: null,
            extractedPhone: null,
            geoConsistent: false,
            exclusionReason: `INSUFFICIENT_LOCATION_EVIDENCE: 'Çalıştığı Şube' bilgisi ('${rawBranchName}') bilinen şube haritasında doğrulanamadı.`,
            rejectionCode: "INSUFFICIENT_LOCATION_EVIDENCE",
          };
        }
      } else {
        return {
          isEligible: false,
          httpStatus: 200,
          originalUrl,
          finalResolvedUrl: probe.finalUrl,
          isRedirectedToGeneric: false,
          nameMatchedInEntity: true,
          extractedName: formatTurkishProperCase(extractedName),
          extractedTitle,
          extractedSpecialty,
          extractedHospital: "Hospitadent Diş Hastanesi",
          extractedCity: "",
          extractedDistrict: null,
          extractedAddress: null,
          extractedPhone: null,
          geoConsistent: false,
          exclusionReason: "INSUFFICIENT_LOCATION_EVIDENCE: Profil sayfasında 'Çalıştığı Şube' bloğu bulunamadı.",
          rejectionCode: "INSUFFICIENT_LOCATION_EVIDENCE",
        };
      }
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
          const hospRaw = hospObj?.hospitalName
            ? `Acıbadem ${hospObj.hospitalName}`
            : hospObj?.name
            ? `Acıbadem ${hospObj.name}`
            : candidate.hospital || "Acıbadem Sağlık Grubu";

          const geo = ACIBADEM_HOSPITAL_GEO_MAP[hospRaw];
          if (geo) {
            extractedHospital = hospRaw;
            extractedCity = geo.city;
            extractedDistrict = geo.district;
            extractedAddress = geo.address;
            extractedPhone = geo.phone;
          } else {
            extractedHospital = hospRaw;
            const rawCity = hospObj?.cityName || hospObj?.properties?.cityName || hospObj?.location || "İstanbul";
            extractedCity = normalizeProvinceName(rawCity) || "İstanbul";
            extractedDistrict = hospObj?.properties?.addressLocality || null;
            extractedPhone = "+90 216 544 44 44";
          }
        }
      } catch {}
    }

    if (!entityFound && h1Text && !h1Text.includes("404")) {
      entityFound = true;
      extractedName = formatTurkishProperCase(cleanProfessionalName(h1Text));
      extractedTitle = normalizeProfessionalTitle(candidate.title || "Uzm. Dr.", h1Text);
      extractedSpecialty = candidate.specialty || "Tıbbi Birim";
      extractedHospital = candidate.hospital || "Acıbadem Sağlık Grubu";
      const geo = candidate.hospital ? ACIBADEM_HOSPITAL_GEO_MAP[candidate.hospital] : null;
      if (geo) {
        extractedCity = geo.city;
        extractedDistrict = geo.district;
        extractedAddress = geo.address;
        extractedPhone = geo.phone;
      } else {
        extractedCity = normalizeProvinceName(candidate.city) || "İstanbul";
        extractedDistrict = candidate.district || null;
      }
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
      extractedAddress = physicianObj.affiliation?.address?.streetAddress || null;
      extractedPhone = physicianObj.telephone?.trim() || "+90 850 460 63 34";
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
      extractedAddress,
      extractedPhone,
      geoConsistent: false,
      exclusionReason: `NAME_NOT_IN_ENTITY: Hekim adı ('${candidate.name}') sayfa başlığında (H1: '${h1Text}') veya şemada doğrulanamadı.`,
      rejectionCode: "NAME_NOT_IN_ENTITY",
    };
  }

  // 6. Geographic consistency check
  let geoConsistent = true;
  if (extractedCity && extractedDistrict) {
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
      extractedAddress,
      extractedPhone,
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
    extractedAddress,
    extractedPhone,
    geoConsistent: true,
    exclusionReason: "NONE",
  };
}
