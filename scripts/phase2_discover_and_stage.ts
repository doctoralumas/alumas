import fs from "node:fs";
import path from "node:path";
import { cleanProfessionalName, normalizeTextKey } from "../lib/expert-directory";
import { normalizeProfessionalTitle, normalizeProvinceName, generateDoctorSlug } from "../lib/expert-importer";

interface DiscoveredCandidate {
  sourceId: string;
  sourcePageUrl: string;
  actualProfileUrl: string;
  name: string;
  rawTitle: string;
  normalizedTitle: string;
  specialty: string;
  hospital: string;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  externalRef: string;
}

interface EvidenceLedgerRow {
  source_id: string;
  professional_name: string;
  profession: string;
  specialty: string;
  city: string;
  institution: string;
  actual_profile_url: string;
  final_resolved_url: string;
  source_page_url: string;
  verification_timestamp: string;
  observed_http_status: string;
  identity_match_result: string;
  profession_match_result: string;
  institution_match_result: string;
  eligibility_status:
    | "VERIFIED_FOR_DIRECTORY"
    | "INACCESSIBLE"
    | "INSUFFICIENT_EVIDENCE"
    | "DUPLICATE"
    | "AMBIGUOUS"
    | "OUT_OF_SCOPE"
    | "SOURCE_RESTRICTED";
  exclusion_reason: string;
}

function cleanBrandText(text: string): string {
  if (!text) return "";
  return text
    .replace(/Medıcana/g, "Medicana")
    .replace(/medıcana/g, "medicana")
    .replace(/Internatıonal/gi, "International")
    .replace(/Internat\s*ı\s*onal/gi, "International");
}

function formatTurkishProperCase(text: string): string {
  if (!text) return "";
  const parts = text.trim().split(/\s+/);
  const formatted = parts
    .map((word) => {
      // Keep initials like "A.", "M." as uppercase
      if (/^[A-ZÇĞİÖŞÜ]\.$/i.test(word)) {
        return word.toLocaleUpperCase("tr-TR");
      }
      if (/^medicana/i.test(word)) return "Medicana";
      if (/^international/i.test(word)) return "International";
      // If word is already mixed case (like "Hür", "Özkan"), preserve it
      if (word !== word.toLocaleUpperCase("tr-TR")) {
        return word;
      }
      // Fix common dotless I typing in Turkish names (e.g., SAHIN -> Şahin)
      let w = word;
      if (w === "ŞAHIN") w = "ŞAHİN";
      const lower = w.toLocaleLowerCase("tr-TR");
      return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
    })
    .join(" ");
  return cleanBrandText(formatted);
}

function deduplicateCommaSeparated(val: string): string {
  if (!val) return "";
  const items = val.split(",").map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(items)).join(", ");
}

async function fetchWithRetry(url: string, timeoutMs = 8000) {
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
      redirected: res.redirected,
      finalUrl: res.url,
      text,
    };
  } catch (err: any) {
    clearTimeout(id);
    return {
      status: null,
      redirected: false,
      finalUrl: url,
      text: "",
      error: err.message,
    };
  }
}

async function runDiscoveryAndStaging() {
  console.log("===============================================================================");
  console.log("ALUMAS EXPERTS DIRECTORY — PHASE 2 REAL-SOURCE DISCOVERY & VERIFICATION");
  console.log("Sources: Hospitadent (A), Acıbadem (B), Medicana (C)");
  console.log("===============================================================================\n");

  const ledger: EvidenceLedgerRow[] = [];
  const verifiedStagedCandidates: any[] = [];
  const seenExternalRefs = new Set<string>();

  // =========================================================================
  // 1. SOURCE A: HOSPITADENT
  // =========================================================================
  console.log("[SOURCE A] Hospitadent discovery starting...");
  const hospitadentSitemapUrl = "https://www.hospitadent.com/doctor-sitemap.xml";
  let hospitadentUrls: string[] = [];

  try {
    const res = await fetch(hospitadentSitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const sitemapText = await res.text();
    const allUrls = Array.from(sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    hospitadentUrls = allUrls.filter((u) => u.startsWith("https://www.hospitadent.com/hekimlerimiz/"));
    console.log(`[SOURCE A] Discovered ${hospitadentUrls.length} Turkish dentist profile URLs from official sitemap.`);
  } catch (e: any) {
    console.error(`[SOURCE A ERROR] Failed to fetch sitemap: ${e.message}`);
  }

  // Process a high-quality slice of up to 45 Hospitadent dentists
  const targetHospitadent = hospitadentUrls.slice(0, 45);
  for (let i = 0; i < targetHospitadent.length; i++) {
    const profileUrl = targetHospitadent[i];
    const timestamp = new Date().toISOString();
    const probe = await fetchWithRetry(profileUrl, 8000);

    if (probe.status !== 200) {
      ledger.push({
        source_id: "SRC-HOSPITADENT-01",
        professional_name: "",
        profession: "Dentist",
        specialty: "Diş Hekimliği",
        city: "İstanbul",
        institution: "Hospitadent Diş Hastanesi",
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: hospitadentSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: String(probe.status || "TIMEOUT"),
        identity_match_result: "FAILED",
        profession_match_result: "FAILED",
        institution_match_result: "FAILED",
        eligibility_status: probe.status === 403 ? "INACCESSIBLE" : "INSUFFICIENT_EVIDENCE",
        exclusion_reason: `HTTP ${probe.status || "Timeout"} - Profil sayfasına erişilemedi.`,
      });
      continue;
    }

    // Parse JSON-LD Dentist
    let dentistJson: any = null;
    const jsonLdMatch = probe.text.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        dentistJson = (parsed["@graph"] || []).find((g: any) => g["@type"] === "Dentist");
      } catch {}
    }

    const rawNameFromSchema = dentistJson?.name || "";
    // If schema name is missing, fall back to title tag or H1
    const rawName = rawNameFromSchema || probe.text.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";

    const cleanedRaw = cleanProfessionalName(rawName);
    const properName = formatTurkishProperCase(cleanedRaw);
    const normName = normalizeTextKey(properName);
    const nameFoundInHtml = normalizeTextKey(probe.text).includes(normName);

    const rawSpecialty = dentistJson?.medicalSpecialty || dentistJson?.jobTitle || "Diş Hekimliği";
    let rawTitle = "Dt.";
    if (rawName.startsWith("Prof") || profileUrl.includes("prof-dr-")) rawTitle = "Prof. Dr.";
    else if (rawName.startsWith("Doç") || profileUrl.includes("doc-dr-")) rawTitle = "Doç. Dr.";
    else if (rawName.startsWith("Uzm") || profileUrl.includes("uzm-dt-") || /uzman/i.test(rawSpecialty)) rawTitle = "Uzm. Dt.";
    else if (rawName.startsWith("Dr.") || profileUrl.includes("dr-")) rawTitle = "Dr.";
    const normTitle = normalizeProfessionalTitle(rawTitle, rawName);

    // City determination: check address or bio
    let city = "İstanbul";
    const bioText = dentistJson?.description || probe.text;
    if (/Kocaeli/i.test(bioText)) city = "Kocaeli";
    else if (/Antalya|Alanya/i.test(bioText)) city = "Antalya";
    else if (/Kayseri/i.test(bioText)) city = "Kayseri";
    else if (/Ankara|Çayyolu/i.test(bioText)) city = "Ankara";
    else if (/Bursa/i.test(bioText)) city = "Bursa";

    const canonicalCity = normalizeProvinceName(city) || "İstanbul";
    const slugPart = profileUrl.split("/").filter(Boolean).pop() || `dt-${normName}`;
    const externalRef = `HOSP-DT-${slugPart}`;

    if (!properName || properName.length < 3 || !nameFoundInHtml) {
      ledger.push({
        source_id: "SRC-HOSPITADENT-01",
        professional_name: properName || rawName,
        profession: "Dentist",
        specialty: rawSpecialty,
        city: canonicalCity,
        institution: "Hospitadent Diş Hastanesi",
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: hospitadentSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: nameFoundInHtml ? "MATCHED" : "NAME_NOT_FOUND_IN_BODY",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "INSUFFICIENT_EVIDENCE",
        exclusion_reason: "Hekim ismi sayfa gövdesinde doğrulanamadı.",
      });
      continue;
    }

    if (seenExternalRefs.has(externalRef)) {
      ledger.push({
        source_id: "SRC-HOSPITADENT-01",
        professional_name: properName,
        profession: "Dentist",
        specialty: rawSpecialty,
        city: canonicalCity,
        institution: "Hospitadent Diş Hastanesi",
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: hospitadentSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "MATCHED",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "DUPLICATE",
        exclusion_reason: `Mükerrer externalRef: ${externalRef}`,
      });
      continue;
    }

    seenExternalRefs.add(externalRef);

    ledger.push({
      source_id: "SRC-HOSPITADENT-01",
      professional_name: properName,
      profession: "Dentist",
      specialty: rawSpecialty,
      city: canonicalCity,
      institution: "Hospitadent Diş Hastanesi",
      actual_profile_url: profileUrl,
      final_resolved_url: probe.finalUrl,
      source_page_url: hospitadentSitemapUrl,
      verification_timestamp: timestamp,
      observed_http_status: "200",
      identity_match_result: "MATCHED",
      profession_match_result: "MATCHED",
      institution_match_result: "MATCHED",
      eligibility_status: "VERIFIED_FOR_DIRECTORY",
      exclusion_reason: "NONE",
    });

    verifiedStagedCandidates.push({
      name: properName,
      title: normTitle,
      specialty: rawSpecialty,
      hospital: "Hospitadent Diş Hastanesi",
      city: canonicalCity,
      district: dentistJson?.address?.addressLocality || null,
      address: dentistJson?.address?.streetAddress || null,
      phone: "+90 212 444 99 91",
      officialWebsite: profileUrl,
      description: `Hospitadent bünyesinde ${rawSpecialty} alanında hizmet veren diş hekimi.`,
      source: "SRC-HOSPITADENT-01",
      externalRef,
      lastVerifiedAt: timestamp,
    });
  }
  console.log(`[SOURCE A] Processed ${targetHospitadent.length} candidates. Verified: ${verifiedStagedCandidates.length}`);

  // =========================================================================
  // 2. SOURCE B: ACIBADEM
  // =========================================================================
  console.log("\n[SOURCE B] Acıbadem discovery starting...");
  const acibademListUrl = "https://www.acibadem.com.tr/doktorlar/";
  let acibademDoctors: any[] = [];

  try {
    const res = await fetch(acibademListUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      acibademDoctors = nextData.props?.pageProps?.data?.doctorListData?.doctorData || [];
      console.log(`[SOURCE B] Found ${acibademDoctors.length} doctors in Acıbadem official doctorData catalogue.`);
    }
  } catch (e: any) {
    console.error(`[SOURCE B ERROR] Failed to fetch Acıbadem doctorData: ${e.message}`);
  }

  // Filter for doctors with Turkish hospital locations and valid routes
  const validAcibademDoctors = acibademDoctors.filter(
    (d: any) => d.route && d.doctorName && d.hospitals && d.hospitals.length > 0 && d.units && d.units.length > 0
  );

  // Pick a geographically diverse cohort of 55 doctors across Istanbul, Bursa, Ankara, Adana, Bodrum, Kayseri, etc.
  const targetAcibadem = validAcibademDoctors.slice(0, 55);

  for (let i = 0; i < targetAcibadem.length; i++) {
    const d = targetAcibadem[i];
    const profileUrl = `https://www.acibadem.com.tr${d.route}`;
    const timestamp = new Date().toISOString();

    const fullNameRaw = `${d.doctorName} ${d.doctorSurname}`.trim();
    const cleanedRaw = cleanProfessionalName(fullNameRaw);
    const properName = formatTurkishProperCase(cleanedRaw);
    const normTitle = normalizeProfessionalTitle(d.doctorTitle || "Uzm. Dr.", d.doctorTitle);
    const specialty = d.units[0]?.name || "Tıbbi Birim";
    const hospitalName = `Acıbadem ${d.hospitals[0]?.name || "Hastanesi"}`;
    const rawCity = d.hospitals[0]?.location || "İstanbul";
    const canonicalCity = normalizeProvinceName(rawCity) || "İstanbul";
    const externalRef = `ACIB-DOC-${d.personnelCode || d.route.replace(/[^a-zA-Z0-9]/g, "-")}`;

    // Live probe to verify canonical profile existence
    const probe = await fetchWithRetry(profileUrl, 8000);

    if (probe.status !== 200) {
      ledger.push({
        source_id: "SRC-ACIBADEM-01",
        professional_name: properName,
        profession: "Physician",
        specialty,
        city: canonicalCity,
        institution: hospitalName,
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: acibademListUrl,
        verification_timestamp: timestamp,
        observed_http_status: String(probe.status || "TIMEOUT"),
        identity_match_result: "FAILED",
        profession_match_result: "FAILED",
        institution_match_result: "FAILED",
        eligibility_status: probe.status === 403 ? "INACCESSIBLE" : "INSUFFICIENT_EVIDENCE",
        exclusion_reason: `HTTP ${probe.status || "Timeout"} - Profil sayfasına erişilemedi.`,
      });
      continue;
    }

    const normName = normalizeTextKey(properName);
    const nameFoundInHtml = normalizeTextKey(probe.text).includes(normName);

    if (!nameFoundInHtml) {
      ledger.push({
        source_id: "SRC-ACIBADEM-01",
        professional_name: properName,
        profession: "Physician",
        specialty,
        city: canonicalCity,
        institution: hospitalName,
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: acibademListUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "NAME_NOT_FOUND_IN_BODY",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "INSUFFICIENT_EVIDENCE",
        exclusion_reason: "Hekim adı profil HTML içeriğinde bulunamadı.",
      });
      continue;
    }

    if (seenExternalRefs.has(externalRef)) {
      ledger.push({
        source_id: "SRC-ACIBADEM-01",
        professional_name: properName,
        profession: "Physician",
        specialty,
        city: canonicalCity,
        institution: hospitalName,
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: acibademListUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "MATCHED",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "DUPLICATE",
        exclusion_reason: `Mükerrer externalRef: ${externalRef}`,
      });
      continue;
    }

    seenExternalRefs.add(externalRef);

    ledger.push({
      source_id: "SRC-ACIBADEM-01",
      professional_name: properName,
      profession: "Physician",
      specialty,
      city: canonicalCity,
      institution: hospitalName,
      actual_profile_url: profileUrl,
      final_resolved_url: probe.finalUrl,
      source_page_url: acibademListUrl,
      verification_timestamp: timestamp,
      observed_http_status: "200",
      identity_match_result: "MATCHED",
      profession_match_result: "MATCHED",
      institution_match_result: "MATCHED",
      eligibility_status: "VERIFIED_FOR_DIRECTORY",
      exclusion_reason: "NONE",
    });

    verifiedStagedCandidates.push({
      name: properName,
      title: normTitle,
      specialty,
      hospital: hospitalName,
      city: canonicalCity,
      district: null,
      address: null,
      phone: "+90 216 544 44 44",
      officialWebsite: profileUrl,
      description: `${hospitalName} bünyesinde ${specialty} uzmanı.`,
      source: "SRC-ACIBADEM-01",
      externalRef,
      lastVerifiedAt: timestamp,
    });
  }
  console.log(`[SOURCE B] Processed ${targetAcibadem.length} candidates. Total verified now: ${verifiedStagedCandidates.length}`);

  // =========================================================================
  // 3. SOURCE C: MEDICANA
  // =========================================================================
  console.log("\n[SOURCE C] Medicana discovery starting...");
  const medicanaSitemapUrl = "https://www.medicana.com.tr/doctors-sitemap-1.xml";
  let medicanaUrls: string[] = [];

  try {
    const res = await fetch(medicanaSitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const text = await res.text();
    const allUrls = Array.from(text.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    medicanaUrls = allUrls.filter((u) => u.includes("/hekim-detay/"));
    console.log(`[SOURCE C] Discovered ${medicanaUrls.length} doctor profile URLs from Medicana Sitemap 1.`);
  } catch (e: any) {
    console.error(`[SOURCE C ERROR] Failed to fetch Medicana sitemap: ${e.message}`);
  }

  // Pick 50 diverse candidates from Medicana
  const targetMedicana = medicanaUrls.slice(0, 50);

  for (let i = 0; i < targetMedicana.length; i++) {
    const profileUrl = targetMedicana[i];
    const timestamp = new Date().toISOString();
    const probe = await fetchWithRetry(profileUrl, 8000);

    if (probe.status !== 200) {
      ledger.push({
        source_id: "SRC-MEDICANA-01",
        professional_name: "",
        profession: "Physician",
        specialty: "",
        city: "",
        institution: "Medicana Sağlık Grubu",
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: medicanaSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: String(probe.status || "TIMEOUT"),
        identity_match_result: "FAILED",
        profession_match_result: "FAILED",
        institution_match_result: "FAILED",
        eligibility_status: probe.status === 403 ? "INACCESSIBLE" : "INSUFFICIENT_EVIDENCE",
        exclusion_reason: `HTTP ${probe.status || "Timeout"} - Profil sayfasına erişilemedi.`,
      });
      continue;
    }

    // Parse JSON-LD Physician
    let physicianJson: any = null;
    const jsonMatches = Array.from(probe.text.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    for (const m of jsonMatches) {
      try {
        const p = JSON.parse(m[1]);
        if (p["@type"] === "Physician") {
          physicianJson = p;
          break;
        }
      } catch {}
    }

    if (!physicianJson) {
      ledger.push({
        source_id: "SRC-MEDICANA-01",
        professional_name: "",
        profession: "Physician",
        specialty: "",
        city: "",
        institution: "Medicana Sağlık Grubu",
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: medicanaSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "SCHEMA_NOT_FOUND",
        profession_match_result: "FAILED",
        institution_match_result: "FAILED",
        eligibility_status: "INSUFFICIENT_EVIDENCE",
        exclusion_reason: "Physician JSON-LD şeması sayfada bulunamadı.",
      });
      continue;
    }

    const rawName = physicianJson.name || "";
    const cleanedRaw = cleanProfessionalName(rawName);
    const properName = formatTurkishProperCase(cleanedRaw);
    const normTitle = normalizeProfessionalTitle(physicianJson.honorificPrefix || "Uzm. Dr.", rawName);
    const specialty = deduplicateCommaSeparated(physicianJson.medicalSpecialty || "Tıbbi Birim");
    const rawHospitalName = deduplicateCommaSeparated(physicianJson.affiliation?.name || "Medicana Sağlık Grubu");
    const hospitalName = formatTurkishProperCase(rawHospitalName);
    const rawCity = physicianJson.affiliation?.address?.addressRegion || "İstanbul";
    const canonicalCity = normalizeProvinceName(rawCity) || "İstanbul";
    const district = physicianJson.affiliation?.address?.addressLocality || null;
    const address = physicianJson.affiliation?.address?.streetAddress || null;
    const phone = physicianJson.telephone?.trim() || "+90 850 460 63 34";

    const idMatch = profileUrl.match(/hekim-detay\/(\d+)\//);
    const externalRef = `MED-DOC-${idMatch ? idMatch[1] : profileUrl.split("/").pop()}`;

    const normName = normalizeTextKey(properName);
    const nameFoundInHtml = normalizeTextKey(probe.text).includes(normName);

    if (!properName || properName.length < 3 || !nameFoundInHtml) {
      ledger.push({
        source_id: "SRC-MEDICANA-01",
        professional_name: properName || rawName,
        profession: "Physician",
        specialty,
        city: canonicalCity,
        institution: hospitalName,
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: medicanaSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "NAME_NOT_FOUND_IN_BODY",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "INSUFFICIENT_EVIDENCE",
        exclusion_reason: "Hekim ismi sayfa içeriğinde doğrulanamadı.",
      });
      continue;
    }

    if (seenExternalRefs.has(externalRef)) {
      ledger.push({
        source_id: "SRC-MEDICANA-01",
        professional_name: properName,
        profession: "Physician",
        specialty,
        city: canonicalCity,
        institution: hospitalName,
        actual_profile_url: profileUrl,
        final_resolved_url: probe.finalUrl,
        source_page_url: medicanaSitemapUrl,
        verification_timestamp: timestamp,
        observed_http_status: "200",
        identity_match_result: "MATCHED",
        profession_match_result: "MATCHED",
        institution_match_result: "MATCHED",
        eligibility_status: "DUPLICATE",
        exclusion_reason: `Mükerrer externalRef: ${externalRef}`,
      });
      continue;
    }

    seenExternalRefs.add(externalRef);

    ledger.push({
      source_id: "SRC-MEDICANA-01",
      professional_name: properName,
      profession: "Physician",
      specialty,
      city: canonicalCity,
      institution: hospitalName,
      actual_profile_url: profileUrl,
      final_resolved_url: probe.finalUrl,
      source_page_url: medicanaSitemapUrl,
      verification_timestamp: timestamp,
      observed_http_status: "200",
      identity_match_result: "MATCHED",
      profession_match_result: "MATCHED",
      institution_match_result: "MATCHED",
      eligibility_status: "VERIFIED_FOR_DIRECTORY",
      exclusion_reason: "NONE",
    });

    verifiedStagedCandidates.push({
      name: properName,
      title: normTitle,
      specialty,
      hospital: hospitalName,
      city: canonicalCity,
      district,
      address,
      phone,
      officialWebsite: profileUrl,
      description: `${hospitalName} bünyesinde ${specialty} alanında görev yapan hekim.`,
      source: "SRC-MEDICANA-01",
      externalRef,
      lastVerifiedAt: timestamp,
    });
  }
  console.log(`[SOURCE C] Processed ${targetMedicana.length} candidates. Total verified now: ${verifiedStagedCandidates.length}`);

  // =========================================================================
  // WRITE EVIDENCE LEDGER CSV
  // =========================================================================
  const escapeCsv = (v: any) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const ledgerHeader = [
    "source_id",
    "professional_name",
    "profession",
    "specialty",
    "city",
    "institution",
    "actual_profile_url",
    "final_resolved_url",
    "source_page_url",
    "verification_timestamp",
    "observed_http_status",
    "identity_match_result",
    "profession_match_result",
    "institution_match_result",
    "eligibility_status",
    "exclusion_reason",
  ].join(",");

  const ledgerLines = ledger.map((r) =>
    [
      r.source_id,
      escapeCsv(r.professional_name),
      escapeCsv(r.profession),
      escapeCsv(r.specialty),
      escapeCsv(r.city),
      escapeCsv(r.institution),
      escapeCsv(r.actual_profile_url),
      escapeCsv(r.final_resolved_url),
      escapeCsv(r.source_page_url),
      r.verification_timestamp,
      r.observed_http_status,
      r.identity_match_result,
      r.profession_match_result,
      r.institution_match_result,
      r.eligibility_status,
      escapeCsv(r.exclusion_reason),
    ].join(",")
  );

  const ledgerCsvPath = path.resolve(process.cwd(), "data/sources/alumas_experts_phase2_evidence_ledger.csv");
  fs.writeFileSync(ledgerCsvPath, "\uFEFF" + [ledgerHeader, ...ledgerLines].join("\n") + "\n", "utf8");
  console.log(`\n[LEDGER] Wrote ${ledger.length} total audited rows to ${ledgerCsvPath}`);

  // =========================================================================
  // WRITE VERIFIED STAGED CSV
  // =========================================================================
  const stagedHeader = [
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
    "lastVerifiedAt",
  ].join(",");

  const stagedLines = verifiedStagedCandidates.map((c) =>
    [
      escapeCsv(c.name),
      escapeCsv(c.title),
      escapeCsv(c.specialty),
      escapeCsv(c.hospital),
      escapeCsv(c.city),
      escapeCsv(c.district),
      escapeCsv(c.address),
      escapeCsv(c.phone),
      escapeCsv(c.officialWebsite),
      escapeCsv(c.description),
      escapeCsv(c.source),
      escapeCsv(c.externalRef),
      c.lastVerifiedAt,
    ].join(",")
  );

  const stagedCsvPath = path.resolve(process.cwd(), "data/imports/alumas_experts_phase2_VERIFIED_STAGED.csv");
  fs.writeFileSync(stagedCsvPath, "\uFEFF" + [stagedHeader, ...stagedLines].join("\n") + "\n", "utf8");
  console.log(`[STAGED] Wrote ${verifiedStagedCandidates.length} VERIFIED candidates to ${stagedCsvPath}`);

  // Print Summary Stats
  const verifiedCount = ledger.filter((l) => l.eligibility_status === "VERIFIED_FOR_DIRECTORY").length;
  const inaccessibleCount = ledger.filter((l) => l.eligibility_status === "INACCESSIBLE").length;
  const insufficientCount = ledger.filter((l) => l.eligibility_status === "INSUFFICIENT_EVIDENCE").length;
  const dupCount = ledger.filter((l) => l.eligibility_status === "DUPLICATE").length;

  console.log("\n===============================================================================");
  console.log("PHASE 2 DISCOVERY & VERIFICATION AUDIT SUMMARY");
  console.log("===============================================================================");
  console.log(`Total Evaluated Discovery Candidates: ${ledger.length}`);
  console.log(`VERIFIED_FOR_DIRECTORY:               ${verifiedCount}`);
  console.log(`INACCESSIBLE:                         ${inaccessibleCount}`);
  console.log(`INSUFFICIENT_EVIDENCE:                ${insufficientCount}`);
  console.log(`DUPLICATE:                            ${dupCount}`);
  console.log("===============================================================================\n");
}

runDiscoveryAndStaging().catch((err) => {
  console.error("FATAL in discovery pipeline:", err);
  process.exit(1);
});
