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
  console.log("ALUMAS EXPERTS VALIDATOR — REGRESSION TEST SUITE (QUALITY V2)");
  console.log("Testing generic redirects, 404s, false matches, Hospitadent branches & quarantine");
  console.log("===============================================================================\n");

  // 1. Generic listing detector
  assert(isGenericDirectoryUrl("https://www.medicana.com.tr/hekimlerimiz"), "Detects /hekimlerimiz as generic directory");
  assert(isGenericDirectoryUrl("https://www.acibadem.com.tr/doktorlar/"), "Detects /doktorlar/ as generic directory");
  assert(isGenericDirectoryUrl("https://www.hospitadent.com/tibbi-yayin-kurulu"), "Detects /tibbi-yayin-kurulu as generic directory");
  assert(!isGenericDirectoryUrl("https://www.medicana.com.tr/hekim-detay/21039/orcun-gurbuz"), "Accepts individual Medicana profile URL as non-generic");
  assert(!isGenericDirectoryUrl("https://www.acibadem.com.tr/doktor/berna-ozkan/"), "Accepts individual Acibadem profile URL as non-generic");
  assert(!isGenericDirectoryUrl("https://www.hospitadent.com/hekimlerimiz/dt-irem-cetinbak-guvenc"), "Accepts individual Hospitadent profile URL as non-generic");

  // 2. Generic redirect rejection
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

  // 3. Acibadem 404 URL rejection
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

  // 4. False identity match rejection
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

  // 5. Hospitadent branch extraction: Kocaeli branch (Dt. İrem Çetinbak Güvenç)
  console.log("\n--- Testing Hospitadent Non-Istanbul Branch Extraction ---");
  const iremKocaeli = await verifyExpertProfile({
    name: "İrem Çetinbak Güvenç",
    sourceId: "SRC-HOSPITADENT-01",
    sourceUrl: "https://www.hospitadent.com/hekimlerimiz/dt-irem-cetinbak-guvenc",
  });
  assert(
    iremKocaeli.isEligible &&
    iremKocaeli.extractedCity === "Kocaeli" &&
    iremKocaeli.extractedDistrict === "İzmit" &&
    iremKocaeli.extractedHospital === "Hospitadent Kocaeli Diş Hastanesi",
    "Correctly extracts Kocaeli / İzmit location for Dt. İrem Çetinbak Güvenç from 'Çalıştığı Şube' block",
    iremKocaeli
  );

  // 6. Hospitadent branch extraction: Kayseri branch (Ahmet Turan Pekyürek)
  const ahmetKayseri = await verifyExpertProfile({
    name: "Ahmet Turan Pekyürek",
    sourceId: "SRC-HOSPITADENT-01",
    sourceUrl: "https://www.hospitadent.com/hekimlerimiz/dt-ahmet-turan-pekyurek",
  });
  assert(
    ahmetKayseri.isEligible &&
    ahmetKayseri.extractedCity === "Kayseri" &&
    ahmetKayseri.extractedDistrict === "Melikgazi" &&
    ahmetKayseri.extractedHospital === "Hospitadent Kayseri Diş Hastanesi",
    "Correctly extracts Kayseri / Melikgazi location for Dt. Ahmet Turan Pekyürek",
    ahmetKayseri
  );

  // 7. Hospitadent Quarantine Check: Serinhisar without street address (Feride Ertuğrul)
  console.log("\n--- Testing Hospitadent Quarantine on Insufficient Location Evidence ---");
  const ferideQuarantine = await verifyExpertProfile({
    name: "Feride Ertuğrul",
    sourceId: "SRC-HOSPITADENT-01",
    sourceUrl: "https://www.hospitadent.com/hekimlerimiz/dt-feride-ertugrul",
  });
  assert(
    !ferideQuarantine.isEligible &&
    ferideQuarantine.rejectionCode === "INSUFFICIENT_LOCATION_EVIDENCE",
    "Quarantines profile lacking street address / localized contact",
    ferideQuarantine.exclusionReason
  );

  // 8. Positive Control: Medicana individual profile
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
    medValid.isEligible && medValid.extractedCity === "Bursa" && medValid.extractedDistrict === "Nilüfer",
    "Accepts valid Medicana doctor with attributed Bursa / Nilüfer location",
    medValid
  );

  // 9. Positive Control: Acibadem individual profile
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
    aciValid.isEligible && aciValid.extractedCity === "İstanbul" && aciValid.extractedDistrict === "Ataşehir",
    "Accepts valid Acibadem doctor with attributed Istanbul / Ataşehir location",
    aciValid
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
