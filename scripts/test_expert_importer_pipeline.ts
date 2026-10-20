import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  parseExpertCsv,
  normalizeProfessionalTitle,
  normalizeProvinceName,
  generateDoctorSlug,
  planExpertCsvImport,
  RawExpertCsvRow,
  TURKISH_PROVINCES,
  PROVINCE_CANONICAL_NAMES,
} from "../lib/expert-importer";
import {
  cleanProfessionalName,
  canonicalExpertKey,
  isOfficialRegistrySource,
} from "../lib/expert-directory";

console.log("===============================================================================");
console.log("ALUMAS EXPERTS INGESTION PIPELINE — AUTOMATED TEST SUITE");
console.log("===============================================================================\n");

let passedTests = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exit(1);
  }
}

// 1. CSV Parser Unit Tests
test("CSV Parser: handles commas inside quotes and quoted fields", () => {
  const csv = `name,title,specialty,hospital,city,district,address,phone,officialWebsite,description,source,externalRef
"Yılmaz, Ahmet",Prof. Dr.,Kardiyoloji,"Acıbadem Kadıköy, Blok A",İstanbul,Kadıköy,"Moda Cad. No:1, Kat:2",+902161234567,https://example.com/dr-ahmet,"Uzman, araştırmacı",Acıbadem,ACIB-001`;

  const rows = parseExpertCsv(csv);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].name, "Yılmaz, Ahmet");
  assert.strictEqual(rows[0].hospital, "Acıbadem Kadıköy, Blok A");
  assert.strictEqual(rows[0].address, "Moda Cad. No:1, Kat:2");
  assert.strictEqual(rows[0].description, "Uzman, araştırmacı");
});

test("CSV Parser: handles escaped quotes and CRLF line endings", () => {
  const csv = "name,title,specialty,city,source,externalRef\r\n\"Dr. \"\"Harika\"\" Can\",Uzm. Dr.,Dahiliye,Ankara,Medicana,MED-99\r\n";
  const rows = parseExpertCsv(csv);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].name, 'Dr. "Harika" Can');
  assert.strictEqual(rows[0].city, "Ankara");
});

// 2. Name & Title Normalization Tests
test("Name Normalization: removes academic titles and cleans whitespace", () => {
  const sample1 = cleanProfessionalName("Prof. Dr. Mehmet Ali Yılmaz");
  assert.strictEqual(sample1, "Mehmet Ali Yılmaz");

  const sample2 = cleanProfessionalName("Doç. Dr. Ayşe Kaya");
  assert.strictEqual(sample2, "Ayşe Kaya");

  const sample3 = cleanProfessionalName("Uzm. Dt. Selin Arslan");
  assert.strictEqual(sample3, "Selin Arslan");

  const sample4 = cleanProfessionalName("Klinik Psk. Burak Demir");
  assert.strictEqual(sample4, "Burak Demir");

  const sample5 = cleanProfessionalName("Uzm. Fzt. Erhan Çelik");
  assert.strictEqual(sample5, "Erhan Çelik");

  const sample6 = cleanProfessionalName("Uzm. Dyt. Gamze Şen");
  assert.strictEqual(sample6, "Gamze Şen");
});

test("Title Normalization: standardizes various raw title expressions", () => {
  assert.strictEqual(normalizeProfessionalTitle("PROF DOKTOR"), "Prof. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("PROF. DR."), "Prof. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("DOC. DR."), "Doç. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("OP. DR."), "Op. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("UZMAN DOKTOR"), "Uzm. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("UZM. DR."), "Uzm. Dr.");
  assert.strictEqual(normalizeProfessionalTitle("DIS HEKIMI"), "Dt.");
  assert.strictEqual(normalizeProfessionalTitle("UZMAN DIS HEKIMI"), "Uzm. Dt.");
  assert.strictEqual(normalizeProfessionalTitle("UZMAN PSIKOLOG"), "Uzm. Psk.");
  assert.strictEqual(normalizeProfessionalTitle("KLINIK PSIKOLOG"), "Klinik Psk.");
  assert.strictEqual(normalizeProfessionalTitle("UZMAN DIYETISYEN"), "Uzm. Dyt.");
  assert.strictEqual(normalizeProfessionalTitle("UZMAN FIZYOTERAPIST"), "Uzm. Fzt.");
  assert.strictEqual(normalizeProfessionalTitle("FIZYOTERAPIST"), "Fzt.");
  assert.strictEqual(normalizeProfessionalTitle("DIYETISYEN"), "Dyt.");
});

// 3. Province Canonicalization Tests
test("Province Canonicalization: supports all 81 Turkish provinces and handles diacritics", () => {
  assert.strictEqual(TURKISH_PROVINCES.size, 81);
  assert.strictEqual(normalizeProvinceName("ISTANBUL"), "İstanbul");
  assert.strictEqual(normalizeProvinceName("istanbul"), "İstanbul");
  assert.strictEqual(normalizeProvinceName("IZMIR"), "İzmir");
  assert.strictEqual(normalizeProvinceName("izmir"), "İzmir");
  assert.strictEqual(normalizeProvinceName("diyarbakir"), "Diyarbakır");
  assert.strictEqual(normalizeProvinceName("kahramanmaras"), "Kahramanmaraş");
  assert.strictEqual(normalizeProvinceName("canakkale"), "Çanakkale");
  assert.strictEqual(normalizeProvinceName("agri"), "Ağrı");
  assert.strictEqual(normalizeProvinceName("UnknownCity"), null);
  assert.strictEqual(normalizeProvinceName("London"), null);
});

// 4. Slug Generation & Collisions
test("Slug Generation: produces clean, URL-safe Turkish slugs", () => {
  const slug = generateDoctorSlug("İsmail Hakkı Özgür", "Kardiyoloji", "İstanbul");
  assert.strictEqual(slug, "dr-ismail-hakki-ozgur-kardiyoloji-istanbul");

  const slugDisambiguated = generateDoctorSlug("İsmail Hakkı Özgür", "Kardiyoloji", "İstanbul", "Acıbadem");
  assert.strictEqual(slugDisambiguated, "dr-ismail-hakki-ozgur-kardiyoloji-istanbul-acibadem");
});

// 5. Official Source Registry Check
test("Official Source Registry: identifies recognized healthcare providers and MoH portals", () => {
  assert.strictEqual(isOfficialRegistrySource("SAGLIK_BAKANLIGI"), true);
  assert.strictEqual(isOfficialRegistrySource("MINISTRY_OF_HEALTH"), true);
  assert.strictEqual(isOfficialRegistrySource("MOH_DOCTORS"), true);
  assert.strictEqual(isOfficialRegistrySource("GOV_TURKIYE"), true);
  assert.strictEqual(isOfficialRegistrySource("OFFICIAL_REGISTRY"), true);
  assert.strictEqual(isOfficialRegistrySource("TABIP_ODASI"), true);
  assert.strictEqual(isOfficialRegistrySource("Medical Park"), false);
  assert.strictEqual(isOfficialRegistrySource("random-unverified-source"), false);
});

// 6. Plan Logic & Validation Errors
test("Plan Logic: rejects rows missing mandatory fields or having invalid province", () => {
  const invalidRows: RawExpertCsvRow[] = [
    {
      rowNumber: 1,
      name: "",
      title: "Uzm. Dr.",
      specialty: "Dahiliye",
      city: "İstanbul",
      source: "Test",
      externalRef: "REF-1",
    },
    {
      rowNumber: 2,
      name: "Ali Veli",
      title: "Uzm. Dr.",
      specialty: "",
      city: "İstanbul",
      source: "Test",
      externalRef: "REF-2",
    },
    {
      rowNumber: 3,
      name: "Ayşe Kaya",
      title: "Uzm. Dr.",
      specialty: "Göz",
      city: "NonExistingProvince",
      source: "Test",
      externalRef: "REF-3",
    },
    {
      rowNumber: 4,
      name: "Mehmet Demir",
      title: "Uzm. Dr.",
      specialty: "Kardiyoloji",
      city: "Ankara",
      source: "",
      externalRef: "REF-4",
    },
    {
      rowNumber: 5,
      name: "Selin Yılmaz",
      title: "Uzm. Dr.",
      specialty: "Pediatri",
      city: "İzmir",
      source: "Test",
      externalRef: "",
    },
  ];

  const plan = planExpertCsvImport(invalidRows, [], []);
  assert.strictEqual(plan.summary.invalid, 5);
  assert.strictEqual(plan.summary.creates, 0);
});

// 7. Plan Logic: Intra-Batch Duplicate Detection
test("Plan Logic: flags intra-batch duplicate externalRefs", () => {
  const dupRows: RawExpertCsvRow[] = [
    {
      rowNumber: 1,
      name: "Ahmet Yılmaz",
      title: "Uzm. Dr.",
      specialty: "Kardiyoloji",
      city: "İstanbul",
      source: "Test",
      externalRef: "DUP-REF-100",
    },
    {
      rowNumber: 2,
      name: "Ahmet Yılmaz",
      title: "Uzm. Dr.",
      specialty: "Kardiyoloji",
      city: "İstanbul",
      source: "Test",
      externalRef: "DUP-REF-100", // Duplicate in input
    },
  ];

  const plan = planExpertCsvImport(dupRows, [], []);
  assert.strictEqual(plan.summary.creates, 1);
  assert.strictEqual(plan.summary.duplicatesInInput, 1);
  assert.strictEqual(plan.decisions[1].decision, "DUPLICATE_IN_INPUT");
});

// 8. Plan Logic: DB Deduplication (CREATE vs UNCHANGED vs UPDATE)
test("Plan Logic: detects UNCHANGED vs UPDATE when matching existing DB records by externalRef", () => {
  const existingDirectoryDoctor: any = {
    id: "existing-dir-doc-1",
    slug: "uzm-dr-kemal-sunal-dahiliye-istanbul",
    name: "Kemal Sunal",
    title: "Uzm. Dr.",
    specialty: "Dahiliye",
    hospital: "Kadıköy Hastanesi",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Bağdat Cad. No:10",
    phone: "+902161112233",
    officialWebsite: "https://example.com/kemal",
    description: "İç Hastalıkları Uzmanı",
    source: "Kadıköy Sağlık Grubu",
    externalRef: "EXT-KEMAL-1",
    doctorId: null,
    isActive: true,
  };

  // Row identical to existing DB record
  const unchangedRows: RawExpertCsvRow[] = [
    {
      rowNumber: 1,
      name: "Kemal Sunal",
      title: "Uzm. Dr.",
      specialty: "Dahiliye",
      hospital: "Kadıköy Hastanesi",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Bağdat Cad. No:10",
      phone: "+902161112233",
      officialWebsite: "https://example.com/kemal",
      description: "İç Hastalıkları Uzmanı",
      source: "Kadıköy Sağlık Grubu",
      externalRef: "EXT-KEMAL-1",
    },
  ];

  const planUnchanged = planExpertCsvImport(unchangedRows, [existingDirectoryDoctor], []);
  assert.strictEqual(planUnchanged.summary.unchanged, 1);
  assert.strictEqual(planUnchanged.summary.creates, 0);
  assert.strictEqual(planUnchanged.summary.updates, 0);

  // Row with updated phone and hospital
  const updatedRows: RawExpertCsvRow[] = [
    {
      rowNumber: 1,
      name: "Kemal Sunal",
      title: "Uzm. Dr.",
      specialty: "Dahiliye",
      hospital: "Ataşehir Yeni Hastane", // changed
      city: "İstanbul",
      district: "Kadıköy",
      address: "Bağdat Cad. No:10",
      phone: "+902169998877", // changed
      officialWebsite: "https://example.com/kemal",
      description: "İç Hastalıkları Uzmanı",
      source: "Kadıköy Sağlık Grubu",
      externalRef: "EXT-KEMAL-1",
    },
  ];

  const planUpdate = planExpertCsvImport(updatedRows, [existingDirectoryDoctor], []);
  assert.strictEqual(planUpdate.summary.updates, 1);
  assert.strictEqual(planUpdate.summary.unchanged, 0);
  assert.strictEqual(planUpdate.decisions[0].decision, "UPDATE");
  assert.ok(planUpdate.decisions[0].changedFields?.includes("hospital"));
  assert.ok(planUpdate.decisions[0].changedFields?.includes("phone"));
});

// 9. Plan Logic: Claim Protection (SKIP_CLAIMED)
test("Plan Logic: refuses to overwrite an already claimed DirectoryDoctor (doctorId != null)", () => {
  const claimedDirectoryDoctor: any = {
    id: "claimed-dir-doc-1",
    slug: "prof-dr-mehmet-oz-kardiyoloji-istanbul",
    name: "Mehmet Öz",
    title: "Prof. Dr.",
    specialty: "Kardiyoloji",
    hospital: "Merkez Hastanesi",
    city: "İstanbul",
    district: "Şişli",
    address: null,
    phone: null,
    officialWebsite: null,
    description: null,
    source: "Merkez Grubu",
    externalRef: "EXT-MEHMET-OZ",
    doctorId: "real-registered-doctor-uuid-1234", // CLAIMED
    isActive: true,
  };

  const incomingRow: RawExpertCsvRow[] = [
    {
      rowNumber: 1,
      name: "Mehmet Öz",
      title: "Prof. Dr.",
      specialty: "Kardiyoloji",
      hospital: "Merkez Hastanesi Değişti",
      city: "İstanbul",
      source: "Merkez Grubu",
      externalRef: "EXT-MEHMET-OZ",
    },
  ];

  const plan = planExpertCsvImport(incomingRow, [claimedDirectoryDoctor], []);
  assert.strictEqual(plan.summary.skippedClaimed, 1);
  assert.strictEqual(plan.summary.updates, 0);
  assert.strictEqual(plan.decisions[0].decision, "SKIP_CLAIMED");
});

// 10. Dry-Run on Pilot Batch 1 File
test("Pilot Batch 1 Staged CSV Integrity & Dry-Run Evaluation", () => {
  const stagedCsvPath = path.resolve(process.cwd(), "data/imports/alumas_experts_pilot_batch1_STAGED.csv");
  assert.ok(fs.existsSync(stagedCsvPath), "Pilot staged CSV must exist");

  const csvContent = fs.readFileSync(stagedCsvPath, "utf8");
  const rows = parseExpertCsv(csvContent);
  assert.strictEqual(rows.length, 155, "Pilot batch must contain exactly 155 vetted rows");

  const plan = planExpertCsvImport(rows, [], []);
  assert.strictEqual(plan.totalRows, 155);
  assert.strictEqual(plan.summary.creates, 155, "All 155 vetted pilot rows must be ready to CREATE");
  assert.strictEqual(plan.summary.invalid, 0, "No invalid rows allowed in pilot batch");
  assert.strictEqual(plan.summary.duplicatesInInput, 0, "No duplicate externalRefs allowed");

  // Verify geographic coverage in pilot batch
  const cities = new Set(plan.decisions.map((d) => d.candidate?.city));
  assert.ok(cities.has("İstanbul"), "Must cover İstanbul");
  assert.ok(cities.has("Ankara"), "Must cover Ankara");
  assert.ok(cities.has("İzmir"), "Must cover İzmir");
  assert.ok(cities.has("Antalya"), "Must cover Antalya");
  assert.ok(cities.has("Bursa"), "Must cover Bursa");
  assert.ok(cities.has("Adana"), "Must cover Adana");
  assert.ok(cities.has("Gaziantep"), "Must cover Gaziantep");
  assert.ok(cities.has("Kocaeli"), "Must cover Kocaeli");
  assert.ok(cities.has("Samsun"), "Must cover Samsun");
  assert.ok(cities.has("Trabzon"), "Must cover Trabzon");
  assert.ok(cities.has("Kayseri"), "Must cover Kayseri");
  assert.ok(cities.has("Konya"), "Must cover Konya");
  assert.strictEqual(cities.size, 12, "Pilot batch must span 12 target provinces");

  // Verify professional categories coverage
  const titles = new Set(plan.decisions.map((d) => d.candidate?.title));
  assert.ok(titles.has("Prof. Dr.") || titles.has("Doç. Dr.") || titles.has("Op. Dr.") || titles.has("Uzm. Dr."), "Must include Physicians");
  assert.ok(titles.has("Dt.") || titles.has("Uzm. Dt."), "Must include Dentists");
  assert.ok(titles.has("Dyt.") || titles.has("Uzm. Dyt."), "Must include Dietitians");
  assert.ok(titles.has("Fzt.") || titles.has("Uzm. Fzt."), "Must include Physiotherapists");
  assert.ok(titles.has("Psk.") || titles.has("Uzm. Psk.") || titles.has("Klinik Psk."), "Must include Clinical Psychologists");

  // Verify URL safety and no malicious schemes
  for (const d of plan.decisions) {
    if (d.candidate?.officialWebsite) {
      assert.ok(
        d.candidate.officialWebsite.startsWith("https://") || d.candidate.officialWebsite.startsWith("http://"),
        `Invalid URL scheme for ${d.candidate.name}: ${d.candidate.officialWebsite}`
      );
    }
  }
});

console.log(`\n===============================================================================`);
console.log(`ALL ${passedTests} TEST SUITES PASSED CLEANLY (100% SUCCESS)`);
console.log(`===============================================================================\n`);
