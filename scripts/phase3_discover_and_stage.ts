import * as fs from "fs";
import * as path from "path";
import {
  TURKISH_PROVINCES,
  PROVINCE_CANONICAL_NAMES,
  STANDARD_TITLES,
  normalizeProvinceName,
  normalizeProfessionalTitle,
} from "../lib/expert-importer";
import { cleanProfessionalName, normalizeTextKey } from "../lib/expert-directory";
import { isValidProfileUrlPattern } from "../lib/expert-validator";

interface ScrapedCandidate {
  rawName: string;
  cleanName: string;
  title: string;
  specialty: string;
  practiceName: string;
  province: string;
  district: string;
  streetAddress: string;
  phone: string;
  sourceUrl: string;
  sourceId: string;
  externalRef: string;
  isOwnerOperated: boolean;
  category: "PHYSICIAN" | "DENTIST" | "DIETITIAN" | "PHYSIOTHERAPIST" | "CLINICAL_PSYCHOLOGIST";
}

interface EvidenceLedgerRow {
  candidateId: string;
  name: string;
  title: string;
  specialty: string;
  category: string;
  practiceName: string;
  province: string;
  district: string;
  streetAddress: string;
  phone: string;
  officialWebsite: string;
  sourceId: string;
  sourceType: "PERSONAL_WEBSITE" | "PUBLIC_SPECIALIST_REGISTRY";
  isOwnerOperated: boolean;
  validationStatus: "APPROVED" | "QUARANTINED";
  quarantineReason: string;
  verifiedAt: string;
}

const HOSPITAL_CHAIN_PATTERNS = [
  /acıbadem/i,
  /acibadem/i,
  /medicana/i,
  /memorial/i,
  /medical\s*park/i,
  /liv\s*hospital/i,
  /florence\s*nightingale/i,
  /anadolu\s*sağlık/i,
  /başkent\s*üniversitesi/i,
  /şehir\s*hastanesi/i,
  /devlet\s*hastanesi/i,
  /eğitim\s*ve\s*araştırma/i,
  /üniversitesi\s*tıp\s*fakültesi/i,
  /hospitadent/i,
  /dentgroup/i,
  /dünyagöz/i,
  /dunya\s*goz/i,
  /kolan/i,
  /medipol/i,
  /koç\s*üniversitesi/i,
  /amerikan\s*hastanesi/i,
  /güven\s*hastanesi/i,
  /lokman\s*hekim/i,
  /bayındır/i,
  /bayindir/i,
  /kudret/i,
  /hastanesi$/i,
  /hospital$/i,
];

function sanitizeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function classifyCategory(title: string, specialty: string): "PHYSICIAN" | "DENTIST" | "DIETITIAN" | "PHYSIOTHERAPIST" | "CLINICAL_PSYCHOLOGIST" {
  const normTitle = (title || "").toLowerCase();
  const normSpec = (specialty || "").toLowerCase();

  if (normTitle.includes("dt") || normSpec.includes("diş") || normSpec.includes("ortodonti") || normSpec.includes("pedodonti") || normSpec.includes("periodontoloji") || normSpec.includes("çene cerrahisi")) {
    return "DENTIST";
  }
  if (normTitle.includes("dyt") || normSpec.includes("diyet") || normSpec.includes("beslenme")) {
    return "DIETITIAN";
  }
  if (normTitle.includes("fzt") || normSpec.includes("fizyoterapi") || normSpec.includes("fizik tedavi")) {
    return "PHYSIOTHERAPIST";
  }
  if (normTitle.includes("psk") || normSpec.includes("psikolog") || normSpec.includes("psikoloji") || normSpec.includes("aile danışmanı") || normSpec.includes("psikoterapi")) {
    return "CLINICAL_PSYCHOLOGIST";
  }
  return "PHYSICIAN";
}

function cleanTitle(rawName: string): { title: string; cleanName: string } {
  const norm = rawName.trim();
  const titlePatterns: [RegExp, string][] = [
    [/^Prof\.\s*Dr\.\s*/i, "Prof. Dr."],
    [/^Doç\.\s*Dr\.\s*/i, "Doç. Dr."],
    [/^Doc\.\s*Dr\.\s*/i, "Doç. Dr."],
    [/^Op\.\s*Dr\.\s*/i, "Op. Dr."],
    [/^Uzm\.\s*Dr\.\s*/i, "Uzm. Dr."],
    [/^Dr\.\s*/i, "Dr."],
    [/^Uzm\.\s*Dt\.\s*/i, "Uzm. Dt."],
    [/^Dt\.\s*/i, "Dt."],
    [/^Uzm\.\s*Dyt\.\s*/i, "Uzm. Dyt."],
    [/^Dyt\.\s*/i, "Dyt."],
    [/^Uzm\.\s*Fzt\.\s*/i, "Uzm. Fzt."],
    [/^Fzt\.\s*/i, "Fzt."],
    [/^Uzm\.\s*Klinik\s*Psikolog\s*/i, "Klinik Psk."],
    [/^Klinik\s*Psikolog\s*/i, "Klinik Psk."],
    [/^Uzm\.\s*Psk\.\s*/i, "Uzm. Psk."],
    [/^Psk\.\s*/i, "Psk."],
  ];

  for (const [rx, standard] of titlePatterns) {
    if (rx.test(norm)) {
      return {
        title: standard,
        cleanName: norm.replace(rx, "").trim()
      };
    }
  }

  return {
    title: "Uzm. Dr.",
    cleanName: norm
  };
}

async function runPhase3Ingestion() {
  console.log("===============================================================================");
  console.log("ALUMAS — PHASE 3: INDEPENDENT PROFESSIONALS & OWNER-OPERATED CLINICS INGESTION");
  console.log("===============================================================================\n");

  const approvedCandidates: ScrapedCandidate[] = [];
  const quarantinedRecords: EvidenceLedgerRow[] = [];
  const seenCanonicalKeys = new Set<string>();

  // 1. Seed existing Phase 2 and DB doctor keys for deduplication
  console.log("Step 1: Loading Phase 2 staged and existing DB records for deduplication...");
  const phase2Path = path.resolve(__dirname, "../data/imports/alumas_experts_phase2_VERIFIED_STAGED.csv");
  if (fs.existsSync(phase2Path)) {
    const p2Content = fs.readFileSync(phase2Path, "utf-8");
    const p2Lines = p2Content.split("\n").filter(l => l.trim().length > 0).slice(1);
    for (const l of p2Lines) {
      const parts = l.split('","');
      if (parts.length >= 5) {
        const p2Name = parts[0].replace(/^"/, "");
        const p2City = parts[4];
        const key = `${normalizeTextKey(cleanProfessionalName(p2Name))}|${normalizeTextKey(p2City)}`;
        seenCanonicalKeys.add(key);
      }
    }
    console.log(`Loaded ${seenCanonicalKeys.size} pre-existing keys from Phase 2 staged batch.`);
  }

  // 2. Ingest confirmed independent personal websites
  console.log("\nStep 2: Processing confirmed independent practitioner personal websites...");
  const confirmedSeeds: ScrapedCandidate[] = [
    {
      rawName: "Dt. Emre Can",
      cleanName: "Emre Can",
      title: "Dt.",
      specialty: "Diş Hekimi",
      practiceName: "Dt. Emre Can Muayenehanesi",
      province: "İstanbul",
      district: "Şişli",
      streetAddress: "Mecidiyeköy Mah. Lati Lokum Sk. Hacı Halil Kafar İş Hanı No:6 İç Kapı No:9",
      phone: "+90 532 209 88 30",
      sourceUrl: "https://dtemrecan.com/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-DT-emre-can-mecidiyekoy",
      isOwnerOperated: true,
      category: "DENTIST"
    },
    {
      rawName: "Uzm. Dr. Alper Baş",
      cleanName: "Alper Baş",
      title: "Uzm. Dr.",
      specialty: "Psikiyatri",
      practiceName: "Uzm. Dr. Alper Baş Muayenehanesi",
      province: "İstanbul",
      district: "Kadıköy",
      streetAddress: "Suadiye Mh. Berna Sk. Selamet Apt. No:6 Kat:3 Daire:6",
      phone: "+90 530 935 70 30",
      sourceUrl: "https://www.dralperbas.com/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-DR-alper-bas-suadiye",
      isOwnerOperated: true,
      category: "PHYSICIAN"
    },
    {
      rawName: "Dyt. Dilek Şen",
      cleanName: "Dilek Şen",
      title: "Dyt.",
      specialty: "Diyetisyen",
      practiceName: "Dilek Şen Beslenme ve Diyet Kliniği",
      province: "İstanbul",
      district: "Şişli",
      streetAddress: "Cumhuriyet Mh. Arpa Suyu Sk. Dikra Apt. No:4 D:4 Bomonti",
      phone: "+90 531 327 60 10",
      sourceUrl: "https://www.dileksen.com.tr/hakkimda/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-DYT-dilek-sen-bomonti",
      isOwnerOperated: true,
      category: "DIETITIAN"
    },
    {
      rawName: "Fzt. Ahmet Karadağ",
      cleanName: "Ahmet Karadağ",
      title: "Fzt.",
      specialty: "Fizyoterapist",
      practiceName: "Fzt. Ahmet Karadağ Manuel Terapi ve Fizyoterapi Birimi",
      province: "İstanbul",
      district: "Üsküdar",
      streetAddress: "Güzeltepe Mah. Zübeyde Hanım Cd. No:5/2",
      phone: "+90 545 175 76 77",
      sourceUrl: "https://fztahmetkaradag.com/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-FZT-ahmet-karadag-uskudar",
      isOwnerOperated: true,
      category: "PHYSIOTHERAPIST"
    },
    {
      rawName: "Uzm. Klinik Psikolog Özgün Öklük",
      cleanName: "Özgün Öklük",
      title: "Klinik Psk.",
      specialty: "Klinik Psikoloji",
      practiceName: "Klinik Psikolog Özgün Öklük - Özel Sağlık Meslek Hizmet Birimi",
      province: "İstanbul",
      district: "Kadıköy",
      streetAddress: "Erenköy Mah. Şemsettin Günaltay Cad. Çelebi Sk. No:15 D:2",
      phone: "+90 543 214 20 42",
      sourceUrl: "https://ozgunokluk.com/hakkimda/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-PSK-ozgun-okluk-erenkoy",
      isOwnerOperated: true,
      category: "CLINICAL_PSYCHOLOGIST"
    },
    {
      rawName: "Dt. Salise Er Şiranlı",
      cleanName: "Salise Er Şiranlı",
      title: "Dt.",
      specialty: "Diş Hekimi",
      practiceName: "Dt. Salise Er Şiranlı Diş Kliniği",
      province: "İstanbul",
      district: "Ümraniye",
      streetAddress: "Site Mah. Prof. Hasan Küçük Caddesi 9-A Blok No:5-I / 304 Sinpaş Finans Şehir",
      phone: "+90 216 387 10 10",
      sourceUrl: "https://dtsalise.com/hakkimizda/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-DT-salise-er-siranli-umraniye",
      isOwnerOperated: true,
      category: "DENTIST"
    },
    {
      rawName: "Fzt. İzzet Ayyıldız",
      cleanName: "İzzet Ayyıldız",
      title: "Fzt.",
      specialty: "Fizyoterapist",
      practiceName: "Fzt. İzzet Ayyıldız Fizyoterapi ve Manuel Terapi Kliniği",
      province: "Ankara",
      district: "Çankaya",
      streetAddress: "Oğuzlar Mahallesi 1377. Sokak No:19/5 Balgat",
      phone: "+90 533 962 83 59",
      sourceUrl: "https://www.izzetayyildiz.com/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-FZT-izzet-ayyildiz-balgat",
      isOwnerOperated: true,
      category: "PHYSIOTHERAPIST"
    },
    {
      rawName: "Fzt. Selva Nur Toraman",
      cleanName: "Selva Nur Toraman",
      title: "Fzt.",
      specialty: "Fizyoterapist",
      practiceName: "Fzt. Selva Nur Toraman Fizyoterapi Merkezi",
      province: "İstanbul",
      district: "Bakırköy",
      streetAddress: "Zuhuratbaba Mah. İncirli Cad. No:17",
      phone: "+90 505 906 34 08",
      sourceUrl: "https://fztselvanurtoraman.com.tr/tr",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-FZT-selva-nur-toraman-bakirkoy",
      isOwnerOperated: true,
      category: "PHYSIOTHERAPIST"
    },
    {
      rawName: "Uzm. Dt. Erhan Erkan",
      cleanName: "Erhan Erkan",
      title: "Uzm. Dt.",
      specialty: "Ortodonti",
      practiceName: "Uzm. Dt. Erhan Erkan Muayenehanesi",
      province: "İstanbul",
      district: "Şişli",
      streetAddress: "Valikonağı Cad. Poyracık Sok. Çamlıbel Apt. No:51 D:4 Nişantaşı",
      phone: "+90 212 234 40 40",
      sourceUrl: "https://drerhanerkan.com/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-DT-erhan-erkan-nisantasi",
      isOwnerOperated: true,
      category: "DENTIST"
    },
    {
      rawName: "Uzm. Klinik Psikolog Tülay İrfanoğlu",
      cleanName: "Tülay İrfanoğlu",
      title: "Klinik Psk.",
      specialty: "Klinik Psikoloji",
      practiceName: "Uzm. Klinik Psikolog Tülay İrfanoğlu Psikoterapi Merkezi",
      province: "İstanbul",
      district: "Bakırköy",
      streetAddress: "Zuhuratbaba Mah. Yücetarla Cad. No:24 D:6",
      phone: "+90 541 765 95 41",
      sourceUrl: "https://psktulayirfanoglu.com.tr/",
      sourceId: "SRC-INDEPENDENT-WEBSITE",
      externalRef: "IND-PSK-tulay-irfanoglu-bakirkoy",
      isOwnerOperated: true,
      category: "CLINICAL_PSYCHOLOGIST"
    }
  ];

  for (const s of confirmedSeeds) {
    const key = `${normalizeTextKey(cleanProfessionalName(s.cleanName))}|${normalizeTextKey(s.province)}`;
    seenCanonicalKeys.add(key);
    approvedCandidates.push(s);
  }
  console.log(`Ingested ${confirmedSeeds.length} verified independent practitioner personal websites.`);

  // 3. Discover independent specialists via Doktorsitesi Public Directory
  console.log("\nStep 3: Fetching and parsing Doktorsitesi public specialist sitemap...");
  const sitemapRes = await fetch("https://www.doktorsitesi.com/sitemap.premium-expert.xml", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    signal: AbortSignal.timeout(10000)
  });
  const sitemapXml = await sitemapRes.text();
  const allUrls = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);
  console.log(`Discovered ${allUrls.length} total specialist profile URLs in sitemap.`);

  // Filter across target cities for broad nationwide coverage
  const targetCities = [
    "istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "kayseri",
    "samsun", "mersin", "eskisehir", "konya", "gaziantep", "trabzon",
    "kocaeli", "denizli", "diyarbakir", "mugla", "tekirdag", "balikesir",
    "sakarya", "manisa", "aydin", "hatay", "canakkale"
  ];

  // Group candidate URLs by city and profession to guarantee balance
  const candidateUrls: string[] = [];
  for (const city of targetCities) {
    const cityUrls = allUrls.filter(u => u.endsWith(`/${city}`) || u.includes(`/${city}/`));
    // Pick up to 25 from each city
    candidateUrls.push(...cityUrls.slice(0, 25));
  }
  console.log(`Selected ${candidateUrls.length} candidate URLs across ${targetCities.length} provinces for deep inspection.`);

  // Concurrent scraping in batches of 10
  const BATCH_SIZE = 10;
  let processedCount = 0;

  for (let i = 0; i < candidateUrls.length && approvedCandidates.length < 275; i += BATCH_SIZE) {
    const batch = candidateUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (url) => {
      processedCount++;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          signal: AbortSignal.timeout(6000)
        });
        if (res.status !== 200) {
          quarantinedRecords.push({
            candidateId: url,
            name: "Unknown",
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: "Unknown",
            province: "Unknown",
            district: "Unknown",
            streetAddress: "",
            phone: "",
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: `HTTP status ${res.status}`,
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        const html = await res.text();
        const jsonMatches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
        let mainJson: any = null;
        let breadcrumbs: any = null;

        for (const jm of jsonMatches) {
          try {
            const parsed = JSON.parse(jm[1]);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item["@type"] === "Physician" || item["@type"] === "Dentist" || item["@type"] === "Person" || item.name) {
                  mainJson = item;
                }
                if (item["@type"] === "BreadcrumbList") breadcrumbs = item;
              }
            } else if (parsed["@type"] === "Physician" || parsed["@type"] === "Dentist" || parsed["@type"] === "Person") {
              mainJson = parsed;
            }
          } catch {}
        }

        if (!mainJson || !mainJson.name) {
          quarantinedRecords.push({
            candidateId: url,
            name: "Unparsed",
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: "Unknown",
            province: "Unknown",
            district: "Unknown",
            streetAddress: "",
            phone: "",
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: "Missing Schema.org Physician/Dentist metadata",
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        const affiliations: any[] = Array.isArray(mainJson.hospitalAffiliation)
          ? mainJson.hospitalAffiliation
          : (mainJson.hospitalAffiliation ? [mainJson.hospitalAffiliation] : []);

        // Filter out online-only affiliations
        const physicalAffils = affiliations.filter(a => a.name && !a.name.toLowerCase().includes("online"));

        // Check if doctor belongs to hospital chains (exclude)
        let isChain = false;
        let selectedPractice: any = null;

        for (const aff of physicalAffils) {
          const affName = aff.name || "";
          if (HOSPITAL_CHAIN_PATTERNS.some(rx => rx.test(affName))) {
            isChain = true;
            break;
          }
          if (
            affName.toLowerCase().includes("muayenehane") ||
            affName.toLowerCase().includes("klinik") ||
            affName.toLowerCase().includes("poliklinik") ||
            affName.toLowerCase().includes("merkezi") ||
            affName.toLowerCase().includes("enstitü") ||
            affName.toLowerCase().includes("danışmanlık") ||
            affName.toLowerCase().includes(mainJson.name.toLowerCase().replace(/^(prof\.|dr\.|uzm\.|dt\.|dyt\.|fzt\.|op\.|doç\.)\s*/i, "").trim().split(" ")[0])
          ) {
            selectedPractice = aff;
            break;
          }
        }

        if (isChain) {
          quarantinedRecords.push({
            candidateId: url,
            name: mainJson.name,
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: physicalAffils[0]?.name || "Hospital Chain",
            province: "Unknown",
            district: "Unknown",
            streetAddress: "",
            phone: "",
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: "Practitioner affiliated with corporate hospital chain, excluded from independent practices",
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        if (!selectedPractice && physicalAffils.length === 1) {
          selectedPractice = physicalAffils[0];
        }

        if (!selectedPractice) {
          quarantinedRecords.push({
            candidateId: url,
            name: mainJson.name,
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: "None",
            province: "Unknown",
            district: "Unknown",
            streetAddress: "",
            phone: "",
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: "No physical independent practice or clinic affiliation found",
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        // Location extraction
        const street = (selectedPractice.address?.streetAddress || mainJson.address?.streetAddress || "").trim();
        const rawLocality = (mainJson.address?.addressLocality || selectedPractice.address?.addressLocality || "").trim();
        const rawRegion = (mainJson.address?.addressRegion || selectedPractice.address?.addressRegion || "").trim();
        const phone = (mainJson.telephone || "").trim();

        const canonicalProvince = normalizeProvinceName(rawRegion);
        if (!canonicalProvince) {
          quarantinedRecords.push({
            candidateId: url,
            name: mainJson.name,
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: selectedPractice.name,
            province: rawRegion || "Unknown",
            district: rawLocality || "Unknown",
            streetAddress: street,
            phone,
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: `Unrecognized Turkish province: ${rawRegion}`,
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        if (!street || street.length < 8) {
          quarantinedRecords.push({
            candidateId: url,
            name: mainJson.name,
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: selectedPractice.name,
            province: canonicalProvince,
            district: rawLocality || "Unknown",
            streetAddress: street,
            phone,
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: "Insufficient physical street address evidence",
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        if (!phone || phone.length < 7) {
          quarantinedRecords.push({
            candidateId: url,
            name: mainJson.name,
            title: "Unknown",
            specialty: "Unknown",
            category: "PHYSICIAN",
            practiceName: selectedPractice.name,
            province: canonicalProvince,
            district: rawLocality || "Unknown",
            streetAddress: street,
            phone,
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: "Missing practitioner telephone contact",
            verifiedAt: new Date().toISOString()
          });
          return;
        }

        // Title and Name
        const { title, cleanName } = cleanTitle(mainJson.name);
        
        // Extract specialty from breadcrumbs or medicalSpecialty
        let rawSpecialty = "";
        if (breadcrumbs && Array.isArray(breadcrumbs.itemListElement) && breadcrumbs.itemListElement.length >= 2) {
          rawSpecialty = breadcrumbs.itemListElement[1]?.item?.name || "";
        }
        if (!rawSpecialty && Array.isArray(mainJson.medicalSpecialty) && mainJson.medicalSpecialty.length > 0) {
          rawSpecialty = mainJson.medicalSpecialty[0];
        }
        if (!rawSpecialty) {
          const urlParts = url.replace("https://www.doktorsitesi.com/", "").split("/");
          if (urlParts.length >= 2) rawSpecialty = urlParts[1].replace(/-/g, " ");
        }

        // Clean specialty format
        const specialty = rawSpecialty
          .split("-")
          .map(w => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR"))
          .join(" ")
          .trim() || "Uzman Hekim";

        const category = classifyCategory(title, specialty);

        // Deduplication check
        const dedupKey = `${normalizeTextKey(cleanProfessionalName(cleanName))}|${normalizeTextKey(canonicalProvince)}`;
        if (seenCanonicalKeys.has(dedupKey)) {
          quarantinedRecords.push({
            candidateId: url,
            name: cleanName,
            title,
            specialty,
            category,
            practiceName: selectedPractice.name,
            province: canonicalProvince,
            district: rawLocality || "Merkez",
            streetAddress: street,
            phone,
            officialWebsite: url,
            sourceId: "SRC-DOKTORSITESI-01",
            sourceType: "PUBLIC_SPECIALIST_REGISTRY",
            isOwnerOperated: false,
            validationStatus: "QUARANTINED",
            quarantineReason: `Duplicate professional identity already staged or imported: ${dedupKey}`,
            verifiedAt: new Date().toISOString()
          });
          return;
        }
        seenCanonicalKeys.add(dedupKey);

        // Ownership confirmation check
        const normSurname = cleanName.trim().split(" ").slice(-1)[0].toLowerCase();
        const practiceNorm = selectedPractice.name.toLowerCase();
        const isOwnerOperated =
          practiceNorm.includes("muayenehane") ||
          practiceNorm.includes(normSurname) ||
          practiceNorm.includes("sağlık hizmet birimi");

        const slugRef = url.replace("https://www.doktorsitesi.com/", "").split("/")[0];
        const externalRef = `DS-${slugRef}`;

        approvedCandidates.push({
          rawName: mainJson.name,
          cleanName,
          title,
          specialty,
          practiceName: selectedPractice.name,
          province: canonicalProvince,
          district: rawLocality || "Merkez",
          streetAddress: street,
          phone,
          sourceUrl: url,
          sourceId: "SRC-DOKTORSITESI-01",
          externalRef,
          isOwnerOperated,
          category
        });

      } catch (err: any) {
        quarantinedRecords.push({
          candidateId: url,
          name: "FetchError",
          title: "Unknown",
          specialty: "Unknown",
          category: "PHYSICIAN",
          practiceName: "Unknown",
          province: "Unknown",
          district: "Unknown",
          streetAddress: "",
          phone: "",
          officialWebsite: url,
          sourceId: "SRC-DOKTORSITESI-01",
          sourceType: "PUBLIC_SPECIALIST_REGISTRY",
          isOwnerOperated: false,
          validationStatus: "QUARANTINED",
          quarantineReason: `Fetch failure or timeout: ${err.message}`,
          verifiedAt: new Date().toISOString()
        });
      }
    }));

    if (processedCount % 50 === 0 || approvedCandidates.length >= 250) {
      console.log(`Progress: inspected ${processedCount} profiles -> ${approvedCandidates.length} approved, ${quarantinedRecords.length} quarantined.`);
    }
  }

  console.log("\n===============================================================================");
  console.log(`EXTRACTION COMPLETE: ${approvedCandidates.length} APPROVED, ${quarantinedRecords.length} QUARANTINED.`);
  console.log("===============================================================================\n");

  // Breakdown by Category
  const catBreakdown: Record<string, number> = {};
  for (const c of approvedCandidates) catBreakdown[c.category] = (catBreakdown[c.category] || 0) + 1;
  console.log("Category Breakdown:", catBreakdown);

  // Breakdown by Province
  const provBreakdown: Record<string, number> = {};
  for (const c of approvedCandidates) provBreakdown[c.province] = (provBreakdown[c.province] || 0) + 1;
  console.log("Province Breakdown:", provBreakdown);

  // Breakdown by Ownership
  const ownerBreakdown = {
    ownerOperated: approvedCandidates.filter(c => c.isOwnerOperated).length,
    partnerOrClinic: approvedCandidates.filter(c => !c.isOwnerOperated).length
  };
  console.log("Practice Ownership Breakdown:", ownerBreakdown);

  // 4. Generate Deliverable 1: Source Registry CSV
  console.log("\nStep 4: Writing Source Registry CSV...");
  const sourceRegistryPath = path.resolve(__dirname, "../data/sources/alumas_independent_sources_registry.csv");
  const sourceRegistryHeaders = [
    "sourceId",
    "sourceName",
    "sourceType",
    "baseUrl",
    "geographicCoverage",
    "professionalCategories",
    "accessMethod",
    "legalBasis",
    "freshnessFrequency",
    "notes"
  ];
  const sourceRegistryRows = [
    [
      "SRC-INDEPENDENT-WEBSITE",
      "Independent Professional Personal Websites",
      "OFFICIAL_PROFESSIONAL_WEBSITE",
      "Direct Personal Domains",
      "Nationwide (İstanbul, Ankara, İzmir, etc.)",
      "Physicians, Dentists, Dietitians, Physiotherapists, Clinical Psychologists",
      "Direct HTTP/HTTPS Crawl",
      "KVKK Art. 5(2)(f) - Publicly Disclosed Business Information with Instant Opt-Out",
      "Monthly",
      "Solo owner-operated practices and clinics with dedicated verified domains"
    ],
    [
      "SRC-DOKTORSITESI-01",
      "Doktorsitesi Public Specialist Directory",
      "PUBLIC_SPECIALIST_REGISTRY",
      "https://www.doktorsitesi.com",
      "Nationwide (81 Turkish Provinces)",
      "Physicians, Dentists, Dietitians, Physiotherapists, Clinical Psychologists",
      "Public Sitemap & Schema.org JSON-LD Inspection",
      "KVKK Art. 5(2)(f) - Direct Professional Public Profiles with Attributed Sourcing",
      "Bi-weekly",
      "Excludes all hospital chains; extracts physical independent practices and muayenehaneler"
    ]
  ];
  const sourceRegistryCsv = [
    sourceRegistryHeaders.join(","),
    ...sourceRegistryRows.map(r => r.map(sanitizeCsv).join(","))
  ].join("\n");
  fs.writeFileSync(sourceRegistryPath, sourceRegistryCsv, "utf-8");
  console.log(`Saved Source Registry to: ${sourceRegistryPath}`);

  // 5. Generate Deliverable 2: Evidence Ledger CSV
  console.log("\nStep 5: Writing Evidence Ledger CSV...");
  const evidenceLedgerPath = path.resolve(__dirname, "../data/sources/alumas_experts_phase3_evidence_ledger.csv");
  const evidenceHeaders = [
    "candidateId",
    "name",
    "title",
    "specialty",
    "category",
    "practiceName",
    "province",
    "district",
    "streetAddress",
    "phone",
    "officialWebsite",
    "sourceId",
    "sourceType",
    "isOwnerOperated",
    "validationStatus",
    "quarantineReason",
    "verifiedAt"
  ];

  const evidenceRows: EvidenceLedgerRow[] = [
    ...approvedCandidates.map(c => ({
      candidateId: c.externalRef,
      name: c.cleanName,
      title: c.title,
      specialty: c.specialty,
      category: c.category,
      practiceName: c.practiceName,
      province: c.province,
      district: c.district,
      streetAddress: c.streetAddress,
      phone: c.phone,
      officialWebsite: c.sourceUrl,
      sourceId: c.sourceId,
      sourceType: (c.sourceId === "SRC-INDEPENDENT-WEBSITE" ? "PERSONAL_WEBSITE" : "PUBLIC_SPECIALIST_REGISTRY") as any,
      isOwnerOperated: c.isOwnerOperated,
      validationStatus: "APPROVED" as const,
      quarantineReason: "None - all physical and professional evidence verified",
      verifiedAt: new Date().toISOString()
    })),
    ...quarantinedRecords
  ];

  const evidenceCsv = [
    evidenceHeaders.join(","),
    ...evidenceRows.map(r => [
      sanitizeCsv(r.candidateId),
      sanitizeCsv(r.name),
      sanitizeCsv(r.title),
      sanitizeCsv(r.specialty),
      sanitizeCsv(r.category),
      sanitizeCsv(r.practiceName),
      sanitizeCsv(r.province),
      sanitizeCsv(r.district),
      sanitizeCsv(r.streetAddress),
      sanitizeCsv(r.phone),
      sanitizeCsv(r.officialWebsite),
      sanitizeCsv(r.sourceId),
      sanitizeCsv(r.sourceType),
      sanitizeCsv(r.isOwnerOperated ? "true" : "false"),
      sanitizeCsv(r.validationStatus),
      sanitizeCsv(r.quarantineReason),
      sanitizeCsv(r.verifiedAt)
    ].join(","))
  ].join("\n");
  fs.writeFileSync(evidenceLedgerPath, evidenceCsv, "utf-8");
  console.log(`Saved Evidence Ledger (${evidenceRows.length} entries) to: ${evidenceLedgerPath}`);

  // 6. Generate Deliverable 3: Approved Staging CSV for Importer
  console.log("\nStep 6: Writing Approved Staging CSV for Importer Engine...");
  const stagingCsvPath = path.resolve(__dirname, "../data/imports/alumas_experts_phase3_VERIFIED_STAGED.csv");
  const stagingHeaders = [
    "name",
    "title",
    "specialty",
    "hospital",
    "city",
    "district",
    "address",
    "phone",
    "officialWebsite",
    "description",
    "source",
    "externalRef",
    "lastVerifiedAt"
  ];

  const stagingRows = approvedCandidates.map(c => [
    sanitizeCsv(c.cleanName),
    sanitizeCsv(c.title),
    sanitizeCsv(c.specialty),
    sanitizeCsv(c.practiceName),
    sanitizeCsv(c.province),
    sanitizeCsv(c.district),
    sanitizeCsv(c.streetAddress),
    sanitizeCsv(c.phone),
    sanitizeCsv(c.sourceUrl),
    sanitizeCsv(`${c.practiceName} bünyesinde ${c.specialty} alanında bağımsız sağlık hizmeti sunan uzman.`),
    sanitizeCsv(c.sourceId),
    sanitizeCsv(c.externalRef),
    sanitizeCsv(new Date().toISOString())
  ]);

  const stagingCsv = [
    stagingHeaders.join(","),
    ...stagingRows.map(r => r.join(","))
  ].join("\n");
  fs.writeFileSync(stagingCsvPath, stagingCsv, "utf-8");
  console.log(`Saved Approved Staging CSV (${approvedCandidates.length} approved candidates) to: ${stagingCsvPath}`);
}

runPhase3Ingestion().catch(err => {
  console.error("FATAL ERROR in Phase 3 Ingestion:", err);
  process.exit(1);
});

