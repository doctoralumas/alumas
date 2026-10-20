import { verifyExpertProfile, isValidProfileUrlPattern, isGenericDirectoryUrl } from "../lib/expert-validator";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}`, detail ? detail : "");
    failCount++;
  }
}

async function runRegressionSuite() {
  console.log("===============================================================================");
  console.log("ALUMAS EXPERTS VALIDATOR — REGRESSION TEST SUITE");
  console.log("Testing generic redirects, 404s, false matches, mismatched geo & positive controls");
  console.log("===============================================================================\n");

  // 1. URL pattern and generic detector
  assert(isGenericDirectoryUrl("https://www.medicana.com.tr/hekimlerimiz"), "Detects /hekimlerimiz as generic directory");
  assert(isGenericDirectoryUrl("https://www.acibadem.com.tr/doktorlar/"), "Detects /doktorlar/ as generic directory");
  assert(isGenericDirectoryUrl("https://www.hospitadent.com/tibbi-yayin-kurulu"), "Detects /tibbi-yayin-kurulu as generic directory");
  assert(!isGenericDirectoryUrl("https://www.medicana.com.tr/hekim-detay/21039/orcun-gurbuz"), "Accepts individual Medicana profile URL as non-generic");
  assert(!isGenericDirectoryUrl("https://www.acibadem.com.tr/doktor/berna-ozkan/"), "Accepts individual Acibadem profile URL as non-generic");
  assert(!isGenericDirectoryUrl("https://www.hospitadent.com/hekimlerimiz/dt-irem-cetinbak-guvenc"), "Accepts individual Hospitadent profile URL as non-generic");

  // 2. Medicana generic redirect rejection
  console.log("\n--- Testing Medicana Generic Redirects ---");
  const medRedirect = await verifyExpertProfile({
    name: "Ahmet Bilge",
    sourceId: "SRC-MEDICANA-01",
    sourceUrl: "https://www.medicana.com.tr/hekim-detay/401/ahmet-bilge",
  });
  assert(
    !medRedirect.isEligible && (medRedirect.isRedirectedToGeneric || medRedirect.rejectionCode === "GENERIC_PAGE_REDIRECT"),
    "Rejects Medicana URL redirecting to /hekimlerimiz as GENERIC_PAGE_REDIRECT",
    medRedirect.exclusionReason
  );

  // 3. Acibadem 404 broken URL rejection
  console.log("\n--- Testing Acibadem 404 URL ---");
  const aci404 = await verifyExpertProfile({
    name: "Ali Akman",
    sourceId: "SRC-ACIBADEM-01",
    sourceUrl: "https://www.acibadem.com.tr/doktor/ali-akman/",
  });
  assert(
    !aci404.isEligible && aci404.httpStatus === 404,
    "Rejects Acibadem 404 profile with HTTP 404 error",
    aci404.exclusionReason
  );

  // 4. False identity match rejection (wrong name for actual profile)
  console.log("\n--- Testing False Identity Match Prevention ---");
  const falseName = await verifyExpertProfile({
    name: "Tamamen Farkli Bir Isim",
    sourceId: "SRC-MEDICANA-01",
    sourceUrl: "https://www.medicana.com.tr/hekim-detay/21039/orcun-gurbuz",
  });
  assert(
    !falseName.isEligible && falseName.rejectionCode === "NAME_NOT_IN_ENTITY",
    "Rejects profile when expected name is not in entity H1/schema",
    falseName.exclusionReason
  );

  // 5. Positive Control: Medicana individual profile
  console.log("\n--- Testing Positive Controls ---");
  const medValid = await verifyExpertProfile({
    name: "Orçun Gürbüz",
    title: "Doç. Dr.",
    specialty: "Kalp ve Damar Cerrahisi",
    hospital: "Medicana Bursa",
    city: "Bursa",
    sourceId: "SRC-MEDICANA-01",
    sourceUrl: "https://www.medicana.com.tr/hekim-detay/21039/orcun-gurbuz",
  });
  assert(
    medValid.isEligible && medValid.httpStatus === 200 && medValid.extractedCity === "Bursa",
    "Accepts valid Medicana doctor with attributed Bursa location",
    medValid
  );

  // 6. Positive Control: Acibadem individual profile
  const aciValid = await verifyExpertProfile({
    name: "Berna Özkan",
    title: "Prof. Dr.",
    specialty: "Göz Hastalıkları",
    hospital: "Acıbadem Ataşehir Hastanesi",
    city: "İstanbul",
    sourceId: "SRC-ACIBADEM-01",
    sourceUrl: "https://www.acibadem.com.tr/doktor/berna-ozkan/",
  });
  assert(
    aciValid.isEligible && aciValid.httpStatus === 200 && aciValid.extractedCity === "İstanbul",
    "Accepts valid Acibadem doctor with attributed Istanbul location",
    aciValid
  );

  // 7. Positive Control: Hospitadent individual profile
  const hospValid = await verifyExpertProfile({
    name: "İrem Çetinbak Güvenç",
    title: "Dt.",
    specialty: "Diş Hekimliği",
    hospital: "Hospitadent Diş Hastanesi",
    city: "İstanbul",
    sourceId: "SRC-HOSPITADENT-01",
    sourceUrl: "https://www.hospitadent.com/hekimlerimiz/dt-irem-cetinbak-guvenc",
  });
  assert(
    hospValid.isEligible && hospValid.httpStatus === 200 && hospValid.extractedCity === "İstanbul",
    "Accepts valid Hospitadent dentist with attributed Istanbul location",
    hospValid
  );

  console.log("\n===============================================================================");
  if (failCount === 0) {
    console.log(`ALL ${passCount} REGRESSION TESTS PASSED CLEANLY (100% SUCCESS)`);
  } else {
    console.error(`REGRESSION TESTS FAILED: ${passCount} passed, ${failCount} failed.`);
    process.exit(1);
  }
  console.log("===============================================================================");
}

runRegressionSuite().catch((err) => {
  console.error("FATAL ERROR in regression suite:", err);
  process.exit(1);
});

