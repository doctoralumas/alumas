import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";
import { cleanProfessionalName, normalizeTextKey } from "../lib/expert-directory";
import { normalizeProvinceName, normalizeProfessionalTitle } from "../lib/expert-importer";

interface CleanedCandidate {
  name: string;
  title: string;
  specialty: string;
  hospital: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  officialWebsite: string;
  description: string;
  source: string;
  externalRef: string;
  lastVerifiedAt: string;
  // Audit classifications
  sourceType: "OWN_WEBSITE" | "OWN_CLINIC_WEBSITE" | "THIRD_PARTY_PROFILE";
  practiceRole: "SOLO_PRIVATE_PRACTICE" | "INDEPENDENT_CLINIC_PRACTITIONER";
  category: "PHYSICIAN" | "DENTIST" | "DIETITIAN" | "PHYSIOTHERAPIST" | "CLINICAL_PSYCHOLOGIST";
  phoneType: "LANDLINE" | "PUBLISHED_PRACTICE_MOBILE" | "TOLL_FREE_OR_DIRECT";
}

interface QuarantineRecord {
  candidateId: string;
  name: string;
  title: string;
  specialty: string;
  hospital: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  officialWebsite: string;
  source: string;
  rejectionReason: string;
  verifiedAt: string;
}

const STRICT_HOSPITAL_OR_ACADEMIC_PATTERNS = [
  /hastane/i,
  /hastanesi/i,
  /hospital/i,
  /fakültesi/i,
  /fakultesi/i,
  /üniversitesi/i,
  /universitesi/i,
  /tıp\s*merkezi/i, // General multi-specialty medical centers
  /tip\s*merkezi/i,
  /şehir\s*hastanesi/i,
  /devlet\s*hastanesi/i,
  /eğitim\s*ve\s*araştırma/i,
  /egitim\s*ve\s*arastirma/i,
  /sağlık\s*uygulama/i,
  /acıbadem/i,
  /acibadem/i,
  /medicana/i,
  /memorial/i,
  /medical\s*park/i,
  /liv/i,
  /florence/i,
  /anadolu\s*sağlık/i,
  /başkent/i,
  /dünyagöz/i,
  /dunya\s*goz/i,
  /hospitadent/i,
  /dentgroup/i,
  /kolan/i,
  /medipol/i,
  /koç/i,
  /koc/i,
  /amerikan/i,
  /güven/i,
  /lokman/i,
  /bayındır/i,
  /bayindir/i,
  /kudret/i,
  /aritm/i,
  /royal/i,
  /defa\s*life/i,
  /büyük\s*anadolu/i,
  /buyuk\s*anadolu/i,
  /ümit\s*vişnelik/i,
  /alpi/i,
];

function sanitizeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/[\r\n\t]+/g, " ").replace(/"/g, '""').trim();
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

function parseMultiLineCsv(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records: string[][] = [];
  let curRow: string[] = [];
  let curVal = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (c === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curRow.push(curVal.trim());
      curVal = "";
    } else if (c === '\n' && !inQuotes) {
      curRow.push(curVal.trim());
      records.push(curRow);
      curRow = [];
      curVal = "";
    } else {
      curVal += c;
    }
  }
  if (curVal || curRow.length > 0) {
    curRow.push(curVal.trim());
    records.push(curRow);
  }
  return records;
}

async function reconcileAndClean() {
  console.log("===============================================================================");
  console.log("ALUMAS — RECONCILIATION & STRICT AUDIT OF PHASE 3 INDEPENDENT PROFESSIONALS");
  console.log("===============================================================================\n");

  const stagedPath = path.resolve(__dirname, "../data/imports/alumas_experts_phase3_VERIFIED_STAGED.csv");
  const rawCsv = fs.readFileSync(stagedPath, "utf-8");
  const allRows = parseMultiLineCsv(rawCsv);
  console.log(`Parsed ${allRows.length} total rows from staged CSV (including header).`);

  const header = allRows[0];
  const rows = allRows.slice(1);

  // 1. Fetch DB baseline for cross-source deduplication
  const dbDirectoryDoctors = await prisma.directoryDoctor.findMany({
    select: {
      id: true,
      name: true,
      title: true,
      specialty: true,
      hospital: true,
      city: true,
      phone: true,
      officialWebsite: true,
      externalRef: true,
    },
  });
  const dbRegisteredDoctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  console.log(`DB baseline: ${dbDirectoryDoctors.length} DirectoryDoctors, ${dbRegisteredDoctors.length} Registered Doctors.`);

  const dbIdentityMap = new Map<string, any>();
  for (const d of dbDirectoryDoctors) {
    const key = `${normalizeTextKey(cleanProfessionalName(d.name))}|${normalizeTextKey(d.city)}`;
    dbIdentityMap.set(key, d);
  }
  for (const r of dbRegisteredDoctors) {
    if (r.user?.name) {
      const key = normalizeTextKey(cleanProfessionalName(r.user.name));
      dbIdentityMap.set(key, r);
    }
  }

  const approvedList: CleanedCandidate[] = [];
  const quarantinedList: QuarantineRecord[] = [];
  const seenBatchKeys = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 12) {
      console.warn(`Row ${i + 2} has incomplete columns (${r.length}), skipping.`);
      continue;
    }

    const [
      rawName,
      rawTitle,
      rawSpecialty,
      rawHospital,
      rawCity,
      rawDistrict,
      rawAddress,
      rawPhone,
      rawWebsite,
      rawDescription,
      rawSource,
      rawRef,
    ] = r;

    const name = rawName.replace(/[\r\n\t]+/g, " ").trim();
    const title = normalizeProfessionalTitle(rawTitle) || rawTitle.trim();
    const specialty = rawSpecialty.replace(/[\r\n\t]+/g, " ").trim();
    const hospital = rawHospital.replace(/[\r\n\t]+/g, " ").trim();
    const city = normalizeProvinceName(rawCity) || rawCity.trim();
    const district = rawDistrict.replace(/[\r\n\t]+/g, " ").trim();
    const address = rawAddress.replace(/[\r\n\t]+/g, " ").trim();
    const phone = rawPhone.replace(/[\r\n\t]+/g, " ").trim();
    const officialWebsite = rawWebsite.replace(/[\r\n\t]+/g, " ").trim();
    const source = rawSource.replace(/[\r\n\t]+/g, " ").trim();
    const externalRef = rawRef.replace(/[\r\n\t]+/g, " ").trim();

    // Check 1: Strict Hospital / University / Academic Clinic Exclusion
    const matchesHospital = STRICT_HOSPITAL_OR_ACADEMIC_PATTERNS.some(rx => rx.test(hospital));
    if (matchesHospital) {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Hospital or academic faculty affiliation excluded from independent practice scope: ${hospital}`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    // Check 2: Physical Practice Verification
    // Practice must be a confirmed Muayenehane, private clinic, polyclinic, or specialized healthcare unit
    const hospNorm = hospital.toLowerCase();
    const surname = name.trim().split(" ").slice(-1)[0].toLowerCase();
    const isMuayenehane = hospNorm.includes("muayenehane") || hospNorm.includes("sağlık hizmet birimi") || hospNorm.includes(surname);
    const isPrivateClinic = hospNorm.includes("klinik") || hospNorm.includes("poliklinik") || hospNorm.includes("merkezi") || hospNorm.includes("enstitü") || hospNorm.includes("danışmanlık");

    if (!isMuayenehane && !isPrivateClinic) {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Uncertain practice entity type (not clearly a muayenehane, private clinic or therapy center): ${hospital}`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    const practiceRole: "SOLO_PRIVATE_PRACTICE" | "INDEPENDENT_CLINIC_PRACTITIONER" = isMuayenehane
      ? "SOLO_PRIVATE_PRACTICE"
      : "INDEPENDENT_CLINIC_PRACTITIONER";

    // Check 3: Address & Phone Validity
    if (!address || address.length < 8) {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: "Insufficient physical street address evidence",
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!phone || cleanDigits.length < 7) {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: "Missing or invalid practice telephone contact",
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    let phoneType: "LANDLINE" | "PUBLISHED_PRACTICE_MOBILE" | "TOLL_FREE_OR_DIRECT" = "TOLL_FREE_OR_DIRECT";
    if (cleanDigits.startsWith("0850") || cleanDigits.startsWith("850") || cleanDigits.startsWith("90850") || cleanDigits.startsWith("0800")) {
      phoneType = "TOLL_FREE_OR_DIRECT";
    } else if (
      cleanDigits.startsWith("02") || cleanDigits.startsWith("03") || cleanDigits.startsWith("04") ||
      cleanDigits.startsWith("2") || cleanDigits.startsWith("3") || cleanDigits.startsWith("4") ||
      cleanDigits.startsWith("902") || cleanDigits.startsWith("903") || cleanDigits.startsWith("904")
    ) {
      phoneType = "LANDLINE";
    } else if (cleanDigits.startsWith("05") || cleanDigits.startsWith("5") || cleanDigits.startsWith("905")) {
      phoneType = "PUBLISHED_PRACTICE_MOBILE";
    }

    // Check 4: Website Source Classification
    let sourceType: "OWN_WEBSITE" | "OWN_CLINIC_WEBSITE" | "THIRD_PARTY_PROFILE";
    const webLower = officialWebsite.toLowerCase();
    if (source === "SRC-INDEPENDENT-WEBSITE") {
      if (webLower.includes("klinik") || webLower.includes("poliklinik") || webLower.includes("merkez")) {
        sourceType = "OWN_CLINIC_WEBSITE";
      } else {
        sourceType = "OWN_WEBSITE";
      }
    } else if (webLower.includes("doktorsitesi.com")) {
      sourceType = "THIRD_PARTY_PROFILE";
    } else {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Unclassified external website source: ${officialWebsite}`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    // Check 5: Cross-Source Deduplication against DB DirectoryDoctors & Doctors
    const normName = normalizeTextKey(cleanProfessionalName(name));
    const normCity = normalizeTextKey(city);
    const key = `${normName}|${normCity}`;

    if (dbIdentityMap.has(key)) {
      const match = dbIdentityMap.get(key);
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Duplicate of DB DirectoryDoctor ID ${match.id} (${match.name}, ${match.hospital})`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    if (dbIdentityMap.has(normName)) {
      const match = dbIdentityMap.get(normName);
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Duplicate of DB Registered Doctor ID ${match.id} (${match.user?.name})`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }

    // Check 6: Intra-batch duplicate check
    if (seenBatchKeys.has(key)) {
      quarantinedList.push({
        candidateId: externalRef,
        name,
        title,
        specialty,
        hospital,
        city,
        district,
        address,
        phone,
        officialWebsite,
        source,
        rejectionReason: `Intra-batch duplicate professional key: ${key}`,
        verifiedAt: new Date().toISOString()
      });
      continue;
    }
    seenBatchKeys.add(key);

    // Format clean professional description (STRICT: no unverified corporate ownership claims!)
    let description = "";
    if (practiceRole === "SOLO_PRIVATE_PRACTICE") {
      description = `${hospital} bünyesinde ${specialty} alanında hizmet veren bağımsız uzman.`;
    } else {
      description = `${hospital} bünyesinde ${specialty} alanında bağımsız sağlık hizmeti sunan uzman hekim/sağlık profesyoneli.`;
    }

    const category = classifyCategory(title, specialty);

    approvedList.push({
      name,
      title,
      specialty,
      hospital,
      city,
      district,
      address,
      phone,
      officialWebsite,
      description,
      source,
      externalRef,
      lastVerifiedAt: new Date().toISOString(),
      sourceType,
      practiceRole,
      category,
      phoneType,
    });
  }

  console.log("\n===============================================================================");
  console.log(`RECONCILIATION SUMMARY: ${approvedList.length} APPROVED, ${quarantinedList.length} QUARANTINED.`);
  console.log("===============================================================================\n");

  // Breakdown by Source Category
  const bySourceCat: Record<string, number> = {
    OWN_WEBSITE: 0,
    OWN_CLINIC_WEBSITE: 0,
    THIRD_PARTY_PROFILE: 0,
    UNCERTAIN: 0,
  };
  for (const c of approvedList) bySourceCat[c.sourceType]++;
  bySourceCat.UNCERTAIN = quarantinedList.length;
  console.log("Source Category Breakdown:", bySourceCat);

  // Breakdown by Practice Role
  const byRole: Record<string, number> = {
    SOLO_PRIVATE_PRACTICE: 0,
    INDEPENDENT_CLINIC_PRACTITIONER: 0,
  };
  for (const c of approvedList) byRole[c.practiceRole]++;
  console.log("Practice Role Breakdown:", byRole);

  // Breakdown by Category
  const byCat: Record<string, number> = {};
  for (const c of approvedList) byCat[c.category] = (byCat[c.category] || 0) + 1;
  console.log("Category Breakdown:", byCat);

  // Breakdown by Province
  const byCity: Record<string, number> = {};
  for (const c of approvedList) byCity[c.city] = (byCity[c.city] || 0) + 1;
  console.log("City Breakdown (Provinces):", byCity);

  // Breakdown by Phone Type
  const byPhone: Record<string, number> = {};
  for (const c of approvedList) byPhone[c.phoneType] = (byPhone[c.phoneType] || 0) + 1;
  console.log("Phone Type Breakdown:", byPhone);

  // Write Approved Staging CSV
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
  const stagingCsvRows = approvedList.map(c => [
    sanitizeCsv(c.name),
    sanitizeCsv(c.title),
    sanitizeCsv(c.specialty),
    sanitizeCsv(c.hospital),
    sanitizeCsv(c.city),
    sanitizeCsv(c.district),
    sanitizeCsv(c.address),
    sanitizeCsv(c.phone),
    sanitizeCsv(c.officialWebsite),
    sanitizeCsv(c.description),
    sanitizeCsv(c.source),
    sanitizeCsv(c.externalRef),
    sanitizeCsv(c.lastVerifiedAt),
  ]);
  const stagingCsv = [
    stagingHeaders.join(","),
    ...stagingCsvRows.map(r => r.join(","))
  ].join("\n");
  fs.writeFileSync(stagedPath, stagingCsv, "utf-8");
  console.log(`\nUpdated Staged CSV with ${approvedList.length} clean, validated records: ${stagedPath}`);

  // Write Evidence Ledger CSV
  const evidencePath = path.resolve(__dirname, "../data/sources/alumas_experts_phase3_evidence_ledger.csv");
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
    "practiceRole",
    "phoneType",
    "validationStatus",
    "quarantineReason",
    "verifiedAt"
  ];
  const evidenceRows = [
    ...approvedList.map(c => [
      sanitizeCsv(c.externalRef),
      sanitizeCsv(c.name),
      sanitizeCsv(c.title),
      sanitizeCsv(c.specialty),
      sanitizeCsv(c.category),
      sanitizeCsv(c.hospital),
      sanitizeCsv(c.city),
      sanitizeCsv(c.district),
      sanitizeCsv(c.address),
      sanitizeCsv(c.phone),
      sanitizeCsv(c.officialWebsite),
      sanitizeCsv(c.source),
      sanitizeCsv(c.sourceType),
      sanitizeCsv(c.practiceRole),
      sanitizeCsv(c.phoneType),
      sanitizeCsv("APPROVED"),
      sanitizeCsv("None - fully verified independent practice"),
      sanitizeCsv(c.lastVerifiedAt),
    ]),
    ...quarantinedList.map(q => [
      sanitizeCsv(q.candidateId),
      sanitizeCsv(q.name),
      sanitizeCsv(q.title),
      sanitizeCsv(q.specialty),
      sanitizeCsv(classifyCategory(q.title, q.specialty)),
      sanitizeCsv(q.hospital),
      sanitizeCsv(q.city),
      sanitizeCsv(q.district),
      sanitizeCsv(q.address),
      sanitizeCsv(q.phone),
      sanitizeCsv(q.officialWebsite),
      sanitizeCsv(q.source),
      sanitizeCsv("UNCERTAIN"),
      sanitizeCsv("EXCLUDED"),
      sanitizeCsv("EXCLUDED"),
      sanitizeCsv("QUARANTINED"),
      sanitizeCsv(q.rejectionReason),
      sanitizeCsv(q.verifiedAt),
    ])
  ];
  const evidenceCsv = [
    evidenceHeaders.join(","),
    ...evidenceRows.map(r => r.join(","))
  ].join("\n");
  fs.writeFileSync(evidencePath, evidenceCsv, "utf-8");
  console.log(`Updated Evidence Ledger with ${evidenceRows.length} total entries: ${evidencePath}`);
}

reconcileAndClean().catch(err => {
  console.error("FATAL ERROR in Reconcile:", err);
  process.exit(1);
});
