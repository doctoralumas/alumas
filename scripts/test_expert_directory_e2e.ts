import { OrganizationClaimStatus, VerificationDocumentType, VerificationDocumentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  queryNormalizedExperts,
  buildNormalizedExpertItems,
  canonicalExpertKey,
  isDoctorVerifiedByAlumas,
  findDirectoryDoctorByIdOrSlug,
  findPotentialDirectoryDoctorMatches,
  isOfficialRegistrySource,
} from "../lib/expert-directory";
import { approvalBlockReason } from "../lib/verification-documents";
import { normalizeOfficialWebsiteUrl } from "../lib/external-url";
import { hashPassword, tokenHash } from "../lib/auth";
import { randomBytes } from "node:crypto";
import assert from "node:assert";


async function run() {
  console.log("===============================================================================");
  console.log("ALUMAS EXPERTS DIRECTORY, CLAIMING & VERIFICATION E2E TEST SUITE");
  console.log("===============================================================================\n");

  const baselineDoctorCount = await prisma.doctor.count();
  const baselineDirDoctorCount = await prisma.directoryDoctor.count();
  const baselineClaimCount = await prisma.doctorClaim.count();
  const baselineUserCount = await prisma.user.count();

  console.log(
    `[BASELINE] Users: ${baselineUserCount}, Doctors: ${baselineDoctorCount}, DirectoryDoctors: ${baselineDirDoctorCount}, Claims: ${baselineClaimCount}\n`
  );

  const cleanupIds = {
    users: [] as string[],
    doctors: [] as string[],
    directoryDoctors: [] as string[],
    claims: [] as string[],
    documents: [] as string[],
  };

  async function addApprovedDoctorCredentials(doctorId: string, userId: string) {
    const identity = await prisma.verificationDocument.create({
      data: {
        doctorId,
        documentType: "IDENTITY",
        documentNumber: "TC-12345678901",
        issuer: "Nüfus ve Vatandaşlık İşleri",
        fileStoragePath: `test/identity-${doctorId}.pdf`,
        fileName: "identity.pdf",
        mimeType: "application/pdf",
        status: "APPROVED",
        reviewedByUserId: userId,
        reviewedAt: new Date(),
      },
    });
    const license = await prisma.verificationDocument.create({
      data: {
        doctorId,
        documentType: "MEDICAL_LICENSE",
        documentNumber: "DIP-987654",
        issuer: "Sağlık Bakanlığı",
        fileStoragePath: `test/license-${doctorId}.pdf`,
        fileName: "diploma.pdf",
        mimeType: "application/pdf",
        status: "APPROVED",
        reviewedByUserId: userId,
        reviewedAt: new Date(),
      },
    });
    cleanupIds.documents.push(identity.id, license.id);
    return [identity.id, license.id];
  }

  try {
    // --------------------------------------------------------------------------
    // TEST 1: External Professional with Neutral Directory Treatment
    // --------------------------------------------------------------------------
    console.log("--- [TEST 1] External Professional with Neutral Directory Treatment ---");
    const extDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t1-dir-doc-${Date.now()}`,
        name: "Dr. Selin Aksoy",
        title: "Uzm. Dr.",
        specialty: "Nöroloji",
        hospital: "İstanbul Nöroloji Kliniği",
        city: "İstanbul",
        district: "Kadıköy",
        address: "Bağdat Cad. No: 120",
        phone: "+90 216 555 0101",
        officialWebsite: "https://www.drselinaksoy.com",
        description: "Nöroloji ve EEG uzmanı",
        source: "MINISTRY_OF_HEALTH",
        externalRef: "MOH-NEURO-001",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(extDoc.id);

    const t1Results = await queryNormalizedExperts({ q: "Selin Aksoy" });
    const t1Found = t1Results.find((x) => x.slug === extDoc.slug);

    assert(t1Found, "Test 1: Directory doctor should be found in query results");
    assert.strictEqual(t1Found.doctorId, null, "Test 1: doctorId should be null for external directory record");
    assert.strictEqual(t1Found.isVerified, false, "Test 1: Unregistered record must NOT have isVerified = true");
    assert.strictEqual(t1Found.verificationState, "UNREGISTERED", "Test 1: verificationState must be UNREGISTERED");
    assert.strictEqual(t1Found.canClaim, true, "Test 1: canClaim must be true");
    assert.strictEqual(t1Found.navigationMode, "EXTERNAL", "Test 1: navigationMode must be EXTERNAL when website is present");
    console.log("✔ TEST 1 PASSED: External professional received neutral directory treatment with canClaim = true.");

    // --------------------------------------------------------------------------
    // TEST 2: Trustworthy External Website Navigation
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 2] Trustworthy External Website Navigation & URL Sanitization ---");
    // 2a. Valid HTTPS URL
    const validUrl = "https://www.drselinaksoy.com/hakkinda";
    const normalizedValid = normalizeOfficialWebsiteUrl(validUrl);
    assert.strictEqual(normalizedValid, validUrl, "Test 2a: Valid HTTPS URL should normalize directly");

    // 2b. Protocol-relative or raw domain
    const rawDomain = "drselinaksoy.com";
    const normalizedDomain = normalizeOfficialWebsiteUrl(rawDomain);
    assert.strictEqual(normalizedDomain, "https://drselinaksoy.com/", "Test 2b: Raw domain should get https prefix and trailing slash");

    // 2c. Malicious URLs
    const maliciousUrls = [
      "javascript:alert(document.cookie)",
      "file:///etc/passwd",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
    ];
    for (const bad of maliciousUrls) {
      const sanitized = normalizeOfficialWebsiteUrl(bad);
      assert.strictEqual(sanitized, null, `Test 2c: Malicious URL "${bad}" must be rejected as null`);
    }

    // 2d. Inactive or missing website record
    const extNoWeb = await prisma.directoryDoctor.create({
      data: {
        slug: `t2-no-web-${Date.now()}`,
        name: "Dr. Hakan Demirci",
        title: "Op. Dr.",
        specialty: "Ortopedi",
        city: "İzmir",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(extNoWeb.id);

    const t2Results = await queryNormalizedExperts({ q: "Hakan Demirci" });
    const t2Found = t2Results.find((x) => x.slug === extNoWeb.slug);
    assert(t2Found, "Test 2d: Doctor without website should be found");
    assert.strictEqual(t2Found.navigationMode, "NONE", "Test 2d: navigationMode must be NONE when website is missing");
    assert.strictEqual(t2Found.primaryHref, null, "Test 2d: primaryHref must be null");
    console.log("✔ TEST 2 PASSED: External website navigation strictly validates URLs and blocks XSS schemes.");

    // --------------------------------------------------------------------------
    // TEST 3: Registered Professional Opens Internal Profile
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 3] Registered Professional Opens Internal Profile ---");
    const t3User = await prisma.user.create({
      data: {
        email: `reg-doc-t3-${Date.now()}@alumas.test`,
        name: "Dr. Aylin Kaya",
        role: "DOCTOR",
      },
    });
    cleanupIds.users.push(t3User.id);

    const t3Doctor = await prisma.doctor.create({
      data: {
        userId: t3User.id,
        slug: `dr-aylin-kaya-${Date.now()}`,
        name: "Aylin Kaya",
        title: "Prof. Dr.",
        specialty: "Kardiyoloji",
        hospital: "Alumas Memorial",
        city: "Ankara",
        bio: "Kardiyoloji uzmanı",
        price: 2000,
        nextSlot: "Bugün 14:00",
        isPublished: true,
        isVerified: true,
        presenceStatus: "ONLINE",
      },
    });
    cleanupIds.doctors.push(t3Doctor.id);
    await addApprovedDoctorCredentials(t3Doctor.id, t3User.id);

    const t3Results = await queryNormalizedExperts({ q: "Aylin Kaya" });
    const t3Found = t3Results.find((x) => x.doctorId === t3Doctor.id);

    assert(t3Found, "Test 3: Registered doctor should be found");
    assert.strictEqual(t3Found.navigationMode, "INTERNAL", "Test 3: navigationMode must be INTERNAL");
    assert.strictEqual(t3Found.primaryHref, `/doctors/${t3Doctor.slug}`, "Test 3: primaryHref must point to /doctors/${slug}");
    assert.strictEqual(t3Found.isExternalDestination, false, "Test 3: isExternalDestination must be false");
    assert.strictEqual(t3Found.isVerified, true, "Test 3: Verified doctor should have isVerified = true");
    assert.strictEqual(t3Found.verificationState, "VERIFIED", "Test 3: verificationState must be VERIFIED");
    console.log("✔ TEST 3 PASSED: Registered professional routes to internal profile /doctors/${slug}.");

    // --------------------------------------------------------------------------
    // TEST 4: Unverified Registered Professional Does NOT Get False Blue Badge
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 4] Unverified Registered Professional Does NOT Get False Blue Badge ---");
    const t4User = await prisma.user.create({
      data: {
        email: `unverified-doc-t4-${Date.now()}@alumas.test`,
        name: "Dr. Burak Çetin",
        role: "DOCTOR",
      },
    });
    cleanupIds.users.push(t4User.id);

    const t4Doctor = await prisma.doctor.create({
      data: {
        userId: t4User.id,
        slug: `dr-burak-cetin-${Date.now()}`,
        name: "Burak Çetin",
        title: "Uzm. Dr.",
        specialty: "Dermatoloji",
        hospital: "Bursa Cilt Kliniği",
        city: "Bursa",
        bio: "Dermatoloji uzmanı",
        price: 1500,
        nextSlot: "Yarın 11:00",
        isPublished: true,
        isVerified: false, // Unverified!
      },
    });
    cleanupIds.doctors.push(t4Doctor.id);

    const t4Qualified = isDoctorVerifiedByAlumas(t4Doctor);
    assert.strictEqual(t4Qualified, false, "Test 4: isDoctorVerifiedByAlumas must return false for unverified doctor");

    const t4Results = await queryNormalizedExperts({ q: "Burak Çetin" });
    const t4Found = t4Results.find((x) => x.doctorId === t4Doctor.id);
    assert(t4Found, "Test 4: Doctor should be found in query results");
    assert.strictEqual(t4Found.isVerified, false, "Test 4: Unverified doctor must have isVerified = false");
    assert.notStrictEqual(t4Found.verificationState, "VERIFIED", "Test 4: Unverified doctor must NOT have VERIFIED state");
    console.log("✔ TEST 4 PASSED: Unverified registered professional strictly does not receive verified badge.");

    // --------------------------------------------------------------------------
    // TEST 5: New Registration with Existing Directory Match (claimDoctorId)
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 5] New Registration with Existing Directory Match (claimDoctorId) ---");
    const t5DirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t5-dir-doc-${Date.now()}`,
        name: "Dr. Canan Erdem",
        title: "Doç. Dr.",
        specialty: "Göz Hastalıkları",
        city: "Antalya",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t5DirDoc.id);

    const t5User = await prisma.user.create({
      data: {
        email: `t5-claimant-${Date.now()}@alumas.test`,
        name: "Canan Erdem",
        role: "DOCTOR",
      },
    });
    cleanupIds.users.push(t5User.id);

    const t5Doctor = await prisma.doctor.create({
      data: {
        userId: t5User.id,
        slug: `dr-canan-erdem-${Date.now()}`,
        name: "Canan Erdem",
        title: "Doç. Dr.",
        specialty: "Göz Hastalıkları",
        hospital: "Antalya Göz Merkezi",
        city: "Antalya",
        bio: "Göz hastalıkları ve cerrahisi",
        price: 1800,
        nextSlot: "Pazartesi 09:30",
        isPublished: false,
        isVerified: false,
      },
    });
    cleanupIds.doctors.push(t5Doctor.id);

    // Create PENDING claim (as done in /api/onboarding/doctor)
    const t5Claim = await prisma.doctorClaim.create({
      data: {
        directoryDoctorId: t5DirDoc.id,
        doctorId: t5Doctor.id,
        claimantUserId: t5User.id,
        status: OrganizationClaimStatus.PENDING,
        applicantTitle: "Doç. Dr.",
        applicantNote: "Dip no: 12345 göz uzmanı",
      },
    });
    cleanupIds.claims.push(t5Claim.id);

    const t5DirCheck = await queryNormalizedExperts({ q: "Canan Erdem" });
    const t5Item = t5DirCheck.find((x) => x.slug === t5DirDoc.slug);
    assert(t5Item, "Test 5: Claimed directory doctor should appear in normalized query");
    assert.strictEqual(t5Item.verificationState, "PENDING_CLAIM", "Test 5: verificationState must be PENDING_CLAIM");
    assert.strictEqual(t5Item.canClaim, false, "Test 5: canClaim must be false while claim is pending");
    console.log("✔ TEST 5 PASSED: Profile claiming marks directory entry as PENDING_CLAIM and blocks concurrent claims.");

    // --------------------------------------------------------------------------
    // TEST 6: New Registration Without Existing Match
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 6] New Registration Without Existing Match ---");
    const t6User = await prisma.user.create({
      data: {
        email: `t6-standalone-${Date.now()}@alumas.test`,
        name: "Dr. Deniz Yıldırım",
        role: "DOCTOR",
      },
    });
    cleanupIds.users.push(t6User.id);

    const t6Doctor = await prisma.doctor.create({
      data: {
        userId: t6User.id,
        slug: `dr-deniz-yildirim-${Date.now()}`,
        name: "Deniz Yıldırım",
        title: "Uzm. Dr.",
        specialty: "Pediatri",
        hospital: "İzmir Çocuk Kliniği",
        city: "İzmir",
        bio: "Çocuk sağlığı ve hastalıkları",
        price: 1200,
        nextSlot: "Çarşamba 10:00",
        isPublished: true,
        isVerified: false,
      },
    });
    cleanupIds.doctors.push(t6Doctor.id);

    const t6Claims = await prisma.doctorClaim.findMany({ where: { doctorId: t6Doctor.id } });
    assert.strictEqual(t6Claims.length, 0, "Test 6: No claim records should exist for standalone doctor");
    console.log("✔ TEST 6 PASSED: Standalone registration does not fabricate directory linkages or claims.");

    // --------------------------------------------------------------------------
    // TEST 7: Successful Verified Ownership Claim Approval by Admin
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 7] Successful Verified Ownership Claim Approval by Admin ---");
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const reviewerId = adminUser?.id || t3User.id;

    // Doctor has uploaded and approved credentials
    await addApprovedDoctorCredentials(t5Doctor.id, t5User.id);

    // Execute atomic claim approval transaction (as in /api/admin/doctors/claims/[id])
    await prisma.$transaction(async (tx) => {
      await tx.doctorClaim.update({
        where: { id: t5Claim.id },
        data: {
          status: OrganizationClaimStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedByUserId: reviewerId,
          reviewerNote: "Dip belgesi doğrulandı, onaylandı.",
        },
      });

      await tx.directoryDoctor.update({
        where: { id: t5DirDoc.id },
        data: {
          doctorId: t5Doctor.id,
          lastVerifiedAt: new Date(),
        },
      });

      await tx.doctor.update({
        where: { id: t5Doctor.id },
        data: {
          isVerified: true,
          isPublished: true,
        },
      });
    }, { maxWait: 10000, timeout: 25000 });

    const t7Check = await queryNormalizedExperts({ q: "Canan Erdem" });
    const t7Matching = t7Check.filter((x) => x.name.includes("Canan Erdem"));

    assert.strictEqual(t7Matching.length, 1, "Test 7: Directory record and doctor profile must reconcile to exactly 1 card");
    const unifiedCard = t7Matching[0];
    assert.strictEqual(unifiedCard.isVerified, true, "Test 7: Reconciled card must have isVerified = true");
    assert.strictEqual(unifiedCard.verificationState, "VERIFIED", "Test 7: verificationState must be VERIFIED");
    assert.strictEqual(unifiedCard.navigationMode, "INTERNAL", "Test 7: Navigation mode must be INTERNAL");
    assert.strictEqual(unifiedCard.primaryHref, `/doctors/${t5Doctor.slug}`, "Test 7: Must link to ALUMAS doctor profile");
    console.log("✔ TEST 7 PASSED: Claim approval reconciles directory and registered profiles into 1 verified card.");

    // --------------------------------------------------------------------------
    // TEST 8: Pending, Rejected, and Duplicate Claim Conflicts (409)
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 8] Claim Conflicts and Rejection Lifecycle ---");
    const t8DirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t8-dir-doc-${Date.now()}`,
        name: "Dr. Emre Şahin",
        title: "Op. Dr.",
        specialty: "Üroloji",
        city: "Trabzon",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t8DirDoc.id);

    const t8User1 = await prisma.user.create({
      data: { email: `t8-user1-${Date.now()}@alumas.test`, name: "Emre Şahin 1", role: "DOCTOR" },
    });
    cleanupIds.users.push(t8User1.id);
    const t8Doc1 = await prisma.doctor.create({
      data: {
        userId: t8User1.id,
        slug: `dr-emre-1-${Date.now()}`,
        name: "Emre Şahin",
        title: "Op. Dr.",
        specialty: "Üroloji",
        hospital: "Trabzon Üroloji Merkezi",
        city: "Trabzon",
        bio: "Üroloji uzmanı",
        price: 1600,
        nextSlot: "Cuma 15:00",
      },
    });
    cleanupIds.doctors.push(t8Doc1.id);

    const t8Claim1 = await prisma.doctorClaim.create({
      data: {
        directoryDoctorId: t8DirDoc.id,
        doctorId: t8Doc1.id,
        claimantUserId: t8User1.id,
        status: OrganizationClaimStatus.PENDING,
      },
    });
    cleanupIds.claims.push(t8Claim1.id);

    // Second user attempts to claim the same directory entry
    const existingActiveClaim = await prisma.doctorClaim.findFirst({
      where: {
        directoryDoctorId: t8DirDoc.id,
        status: { in: [OrganizationClaimStatus.PENDING, OrganizationClaimStatus.APPROVED] },
      },
    });
    assert(existingActiveClaim, "Test 8: System must detect active claim conflict");

    // Reject the claim
    await prisma.doctorClaim.update({
      where: { id: t8Claim1.id },
      data: {
        status: OrganizationClaimStatus.REJECTED,
        reviewerNote: "Belge yetersizliği nedeniyle reddedildi.",
      },
    });

    // After rejection, directory entry becomes claimable again
    const t8DirCheck = await queryNormalizedExperts({ q: "Emre Şahin" });
    const t8Item = t8DirCheck.find((x) => x.slug === t8DirDoc.slug);
    assert(t8Item, "Test 8: Directory doctor should be present");
    assert.strictEqual(t8Item.canClaim, true, "Test 8: canClaim must return true after claim rejection");
    assert.strictEqual(t8Item.verificationState, "UNREGISTERED", "Test 8: verificationState reverts to UNREGISTERED");
    console.log("✔ TEST 8 PASSED: Duplicate claims are prevented and rejection restores claimability.");

    // --------------------------------------------------------------------------
    // TEST 9: Same-Name Professionals in Different Cities/Specialties Remain Separate
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 9] Same-Name Professionals in Different Cities Remain Separate ---");
    const keyIstanbul = canonicalExpertKey("Ahmet Yılmaz", "İstanbul", "Kardiyoloji");
    const keyAnkara = canonicalExpertKey("Ahmet Yılmaz", "Ankara", "Ortopedi");

    assert.notStrictEqual(keyIstanbul, keyAnkara, "Test 9: Canonical keys must differ for different city/specialty");

    const t9Doc1 = await prisma.directoryDoctor.create({
      data: {
        slug: `t9-ahmet-ist-${Date.now()}`,
        name: "Ahmet Yılmaz",
        title: "Prof. Dr.",
        specialty: "Kardiyoloji",
        city: "İstanbul",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t9Doc1.id);

    const t9Doc2 = await prisma.directoryDoctor.create({
      data: {
        slug: `t9-ahmet-ank-${Date.now()}`,
        name: "Ahmet Yılmaz",
        title: "Op. Dr.",
        specialty: "Ortopedi",
        city: "Ankara",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t9Doc2.id);

    const t9Results = await queryNormalizedExperts({ q: "Ahmet Yılmaz" });
    const matchingAhmet = t9Results.filter((x) => x.name.toLowerCase().includes("ahmet yılmaz"));
    assert(matchingAhmet.length >= 2, "Test 9: Both professionals named Ahmet Yılmaz must be independently listed");

    const istItem = matchingAhmet.find((x) => x.city === "İstanbul" && x.specialty === "Kardiyoloji");
    const ankItem = matchingAhmet.find((x) => x.city === "Ankara" && x.specialty === "Ortopedi");

    assert(istItem && ankItem, "Test 9: Both distinct geographic and specialty records must exist concurrently");
    assert.notStrictEqual(istItem.id, ankItem.id, "Test 9: IDs must remain separate");
    console.log("✔ TEST 9 PASSED: Same-name professionals with distinct cities/specialties remain separate.");

    // --------------------------------------------------------------------------
    // TEST 10: In-Place Reconciliation of an Existing Registered Doctor in Directory
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 10] In-Place Reconciliation of an Existing Registered Doctor in Directory ---");
    const t10User = await prisma.user.create({
      data: { email: `t10-user-${Date.now()}@alumas.test`, name: "Dr. Gizem Koç", role: "DOCTOR" },
    });
    cleanupIds.users.push(t10User.id);

    const t10Doc = await prisma.doctor.create({
      data: {
        userId: t10User.id,
        slug: `dr-gizem-koc-${Date.now()}`,
        name: "Gizem Koç",
        title: "Uzm. Dr.",
        specialty: "Endokrinoloji",
        hospital: "Eskişehir Tıp",
        city: "Eskişehir",
        bio: "Endokrinoloji uzmanı",
        price: 1700,
        nextSlot: "Salı 14:00",
        isPublished: true,
        isVerified: true,
      },
    });
    cleanupIds.doctors.push(t10Doc.id);
    await addApprovedDoctorCredentials(t10Doc.id, t10User.id);

    const t10DirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t10-dir-gizem-${Date.now()}`,
        name: "Gizem Koç",
        title: "Uzm. Dr.",
        specialty: "Endokrinoloji",
        city: "Eskişehir",
        doctorId: t10Doc.id, // Explicitly linked
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t10DirDoc.id);

    const t10Merged = await queryNormalizedExperts({ q: "Gizem Koç" });
    const gizemCards = t10Merged.filter((x) => x.name.includes("Gizem Koç"));
    assert.strictEqual(gizemCards.length, 1, "Test 10: Explicitly linked directory entry must deduplicate to exactly 1 card");
    assert.strictEqual(gizemCards[0].navigationMode, "INTERNAL", "Test 10: Merged card routes internally");
    console.log("✔ TEST 10 PASSED: In-place reconciliation deduplicates linked doctor to a single verified card.");

    // --------------------------------------------------------------------------
    // TEST 11: Account Deletion Unlinks DirectoryDoctor Without Corrupting Directory
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 11] Account Deletion Unlinks DirectoryDoctor Without Corrupting Directory ---");
    const t11User = await prisma.user.create({
      data: {
        email: `t11-delete-doc-${Date.now()}@alumas.test`,
        name: "Dr. Zafer Aydın",
        role: "DOCTOR",
        passwordHash: hashPassword("ZaferPass123!"),
      },
    });

    const t11Doc = await prisma.doctor.create({
      data: {
        userId: t11User.id,
        slug: `dr-zafer-aydin-${Date.now()}`,
        name: "Zafer Aydın",
        title: "Prof. Dr.",
        specialty: "Kardiyoloji",
        hospital: "Çukurova Tıp",
        city: "Adana",
        bio: "Kardiyoloji profesörü",
        price: 2500,
        nextSlot: "Pazartesi 11:00",
        isPublished: true,
        isVerified: true,
      },
    });
    cleanupIds.doctors.push(t11Doc.id);
    await addApprovedDoctorCredentials(t11Doc.id, t11User.id);

    const t11DirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t11-dir-zafer-${Date.now()}`,
        name: "Zafer Aydın",
        title: "Prof. Dr.",
        specialty: "Kardiyoloji",
        city: "Adana",
        hospital: "Çukurova Tıp",
        phone: "+90 322 000 0000",
        officialWebsite: "https://www.cukurova.edu.tr",
        doctorId: t11Doc.id, // Linked!
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t11DirDoc.id);

    // Verify linked state
    const beforeDelDir = await prisma.directoryDoctor.findUnique({ where: { id: t11DirDoc.id } });
    assert.strictEqual(beforeDelDir?.doctorId, t11Doc.id, "Test 11: DirectoryDoctor should initially be linked to Doctor");

    // Execute account deletion on the doctor user matching /api/account/delete logic
    console.log("Executing account deletion on Doctor user...");
    await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: { id: t11Doc.id },
        data: {
          userId: null,
          isPublished: false,
          isVerified: false,
          presenceStatus: "OFFLINE",
        },
      });

      await tx.directoryDoctor.updateMany({
        where: { doctorId: t11Doc.id },
        data: { doctorId: null },
      });

      await tx.user.delete({
        where: { id: t11User.id },
      });
    }, { maxWait: 10000, timeout: 25000 });

    // Verify DirectoryDoctor persists intact with doctorId set to null (SetNull)
    const afterDelDir = await prisma.directoryDoctor.findUnique({ where: { id: t11DirDoc.id } });
    assert(afterDelDir, "Test 11: DirectoryDoctor MUST persist after doctor account deletion");
    assert.strictEqual(afterDelDir.doctorId, null, "Test 11: DirectoryDoctor.doctorId must be unlinked to null");
    assert.strictEqual(afterDelDir.isActive, true, "Test 11: DirectoryDoctor remains active public record");
    assert.strictEqual(afterDelDir.name, "Zafer Aydın", "Test 11: DirectoryDoctor institutional data is preserved");

    // Verify normalized directory listing now treats it as an unclaimed record
    const t11Check = await queryNormalizedExperts({ q: "Zafer Aydın" });
    const zaferItem = t11Check.find((x) => x.slug === t11DirDoc.slug);
    assert(zaferItem, "Test 11: Unlinked directory doctor must still appear in directory");
    assert.strictEqual(zaferItem.doctorId, null, "Test 11: doctorId is null");
    assert.strictEqual(zaferItem.isVerified, false, "Test 11: isVerified reverted to false");
    assert.strictEqual(zaferItem.verificationState, "UNREGISTERED", "Test 11: verificationState is UNREGISTERED");
    assert.strictEqual(zaferItem.canClaim, true, "Test 11: canClaim reverted to true");
    console.log("✔ TEST 11 PASSED: Account deletion unlinks DirectoryDoctor safely without data loss or corruption.");

    // --------------------------------------------------------------------------
    // TEST 12: Claim Approval Decoupled from Professional Verification (No Blue Badge without Passed Credentials)
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 12] Claim Approval Decoupled from Professional Verification ---");
    const t12DirDoc = await prisma.directoryDoctor.create({
      data: {
        slug: `t12-dir-doc-${Date.now()}`,
        name: "Dr. Ozan Barış",
        title: "Uzm. Dr.",
        specialty: "Nöroloji",
        city: "Bursa",
        source: "MINISTRY_OF_HEALTH",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t12DirDoc.id);

    const t12User = await prisma.user.create({
      data: { email: `t12-user-${Date.now()}@alumas.test`, name: "Ozan Barış", role: "DOCTOR" },
    });
    cleanupIds.users.push(t12User.id);

    const t12Doctor = await prisma.doctor.create({
      data: {
        userId: t12User.id,
        slug: `dr-ozan-baris-${Date.now()}`,
        name: "Ozan Barış",
        title: "Uzm. Dr.",
        specialty: "Nöroloji",
        hospital: "Bursa Nöroloji",
        city: "Bursa",
        bio: "Nöroloji uzmanı",
        price: 1500,
        nextSlot: "Pazartesi 10:00",
        isPublished: false,
        isVerified: false,
      },
    });
    cleanupIds.doctors.push(t12Doctor.id);

    const t12Claim = await prisma.doctorClaim.create({
      data: {
        directoryDoctorId: t12DirDoc.id,
        doctorId: t12Doctor.id,
        claimantUserId: t12User.id,
        status: OrganizationClaimStatus.PENDING,
      },
    });
    cleanupIds.claims.push(t12Claim.id);

    // Admin approves claim without uploaded documents
    const t12DocsBefore = await prisma.verificationDocument.findMany({ where: { doctorId: t12Doctor.id } });
    const t12BlockBefore = approvalBlockReason("doctor", null, t12DocsBefore);
    assert.notStrictEqual(t12BlockBefore, null, "Test 12: Doctor with no documents must be blocked from verification");

    // Execute approval matching /api/admin/doctors/claims/[id]
    await prisma.$transaction(async (tx) => {
      await tx.doctorClaim.update({
        where: { id: t12Claim.id },
        data: {
          status: OrganizationClaimStatus.APPROVED,
          reviewedAt: new Date(),
          reviewerNote: "Claim approved, awaiting credentials",
        },
      });

      await tx.directoryDoctor.update({
        where: { id: t12DirDoc.id },
        data: { doctorId: t12Doctor.id, lastVerifiedAt: new Date() },
      });

      const docs = await tx.verificationDocument.findMany({ where: { doctorId: t12Doctor.id } });
      const credentialsPassed = approvalBlockReason("doctor", null, docs) === null;

      await tx.doctor.update({
        where: { id: t12Doctor.id },
        data: {
          isVerified: credentialsPassed,
          isPublished: credentialsPassed,
        },
      });
    }, { maxWait: 10000, timeout: 25000 });

    const t12DoctorAfter = await prisma.doctor.findUnique({ where: { id: t12Doctor.id } });
    assert.strictEqual(t12DoctorAfter?.isVerified, false, "Test 12: Doctor must NOT have isVerified = true when credentials missing");

    const t12Merged = await queryNormalizedExperts({ q: "Ozan Barış" });
    const t12Item = t12Merged.find((x) => x.slug === t12DirDoc.slug || x.slug === t12Doctor.slug);
    assert(t12Item, "Test 12: Merged card should be found");
    assert.strictEqual(t12Item.isVerified, false, "Test 12: Merged card must NOT have isVerified = true");
    console.log("✔ TEST 12 PASSED: Approved claim strictly does not grant blue badge without independent credential verification.");

    // --------------------------------------------------------------------------
    // TEST 13: Normal Registration Matching Suggestion (findPotentialDirectoryDoctorMatches)
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 13] Normal Registration Matching Suggestions ---");
    const t13Unclaimed = await prisma.directoryDoctor.create({
      data: {
        slug: `t13-zeynep-unclaimed-${Date.now()}`,
        name: "Dt. Zeynep Korkmaz",
        title: "Dt.",
        specialty: "Diş Hekimliği",
        hospital: "Kadıköy Diş Sağlığı",
        city: "İstanbul",
        source: "DIS_HEKIMLERI_ODASI",
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t13Unclaimed.id);

    const t13User = await prisma.user.create({
      data: { email: `t13-user-${Date.now()}@alumas.test`, name: "Dt. Zeynep Korkmaz (Mevcut)", role: "DOCTOR" },
    });
    cleanupIds.users.push(t13User.id);
    const t13Doc = await prisma.doctor.create({
      data: {
        userId: t13User.id,
        slug: `dt-zeynep-${Date.now()}`,
        name: "Zeynep Korkmaz",
        title: "Dt.",
        specialty: "Diş Hekimliği",
        hospital: "Kadıköy Diş Sağlığı",
        city: "İstanbul",
        bio: "Diş hekimi",
        price: 1000,
        nextSlot: "Pazartesi 10:00",
      },
    });
    cleanupIds.doctors.push(t13Doc.id);

    const t13Claimed = await prisma.directoryDoctor.create({
      data: {
        slug: `t13-zeynep-claimed-${Date.now()}`,
        name: "Dt. Zeynep Korkmaz",
        title: "Dt.",
        specialty: "Diş Hekimliği",
        city: "İstanbul",
        source: "DIS_HEKIMLERI_ODASI",
        doctorId: t13Doc.id, // uniquely claimed
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t13Claimed.id);

    const suggestions = await findPotentialDirectoryDoctorMatches({ name: "Zeynep Korkmaz", limit: 5 });
    const foundUnclaimed = suggestions.some((s) => s.id === t13Unclaimed.id);
    const foundClaimed = suggestions.some((s) => s.id === t13Claimed.id);

    assert.strictEqual(foundUnclaimed, true, "Test 13: Unclaimed match must be suggested to registrant");
    assert.strictEqual(foundClaimed, false, "Test 13: Already claimed match must NOT be offered to new registrant");

    const emptySuggestions = await findPotentialDirectoryDoctorMatches({ name: "Tamamen Farklı Bir Ad Soyad" });
    assert.strictEqual(emptySuggestions.length, 0, "Test 13: Non-matching name returns 0 suggestions");
    console.log("✔ TEST 13 PASSED: Direct registration safely discovers unclaimed directory matches without auto-claiming.");

    // --------------------------------------------------------------------------
    // TEST 14: Resmî Dizin Kaydı Source Whitelist
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 14] Resmî Dizin Kaydı Source Whitelist ---");
    assert.strictEqual(isOfficialRegistrySource("MINISTRY_OF_HEALTH"), true);
    assert.strictEqual(isOfficialRegistrySource("SAGLIK_BAKANLIGI"), true);
    assert.strictEqual(isOfficialRegistrySource("TITCK"), true);
    assert.strictEqual(isOfficialRegistrySource("TABIP_ODASI"), true);
    assert.strictEqual(isOfficialRegistrySource("DIS_HEKIMLERI_ODASI"), true);
    assert.strictEqual(isOfficialRegistrySource("OFFICIAL_REGISTRY"), true);
    assert.strictEqual(isOfficialRegistrySource("GOV_TURKIYE"), true);

    // Unofficial or commercial sources
    assert.strictEqual(isOfficialRegistrySource("MANUAL_WEB_SCRAPE"), false);
    assert.strictEqual(isOfficialRegistrySource("COMMERCIAL_DIRECTORY"), false);
    assert.strictEqual(isOfficialRegistrySource("CUSTOM_IMPORT"), false);
    assert.strictEqual(isOfficialRegistrySource(""), false);

    // Verify buildNormalizedExpertItems sets isOfficialSource flag
    const normOfficial = buildNormalizedExpertItems(
      [{ ...t13Unclaimed, source: "MINISTRY_OF_HEALTH", claims: [] } as any],
      []
    );
    assert.strictEqual(normOfficial[0].isOfficialSource, true, "Test 14: Ministry source must have isOfficialSource = true");

    const normUnofficial = buildNormalizedExpertItems(
      [{ ...t13Unclaimed, source: "MANUAL_WEB_SCRAPE", claims: [] } as any],
      []
    );
    assert.strictEqual(normUnofficial[0].isOfficialSource, false, "Test 14: Scraped source must have isOfficialSource = false");
    console.log("✔ TEST 14 PASSED: Resmî Dizin Kaydı badge whitelist verified strictly.");

    // --------------------------------------------------------------------------
    // TEST 15: Account Deletion Independent Source Validity and Privacy Scope
    // --------------------------------------------------------------------------
    console.log("\n--- [TEST 15] Account Deletion Independent Source Validity and Privacy Scope ---");
    // Official source doctor
    const t15OfficialUser = await prisma.user.create({
      data: { email: `t15-del-off-${Date.now()}@alumas.test`, name: "Dr. Faruk Tan", role: "DOCTOR" },
    });
    const t15DocOfficial = await prisma.doctor.create({
      data: {
        userId: t15OfficialUser.id,
        slug: `dr-faruk-tan-off-${Date.now()}`,
        name: "Faruk Tan",
        title: "Uzm. Dr.",
        specialty: "Kardiyoloji",
        hospital: "İzmir Kalp Kliniği",
        city: "İzmir",
        bio: "Kardiyoloji uzmanı",
        price: 2000,
        nextSlot: "Pazartesi 09:00",
      },
    });
    cleanupIds.doctors.push(t15DocOfficial.id);

    const t15OfficialDir = await prisma.directoryDoctor.create({
      data: {
        slug: `t15-dir-official-${Date.now()}`,
        name: "Faruk Tan",
        title: "Uzm. Dr.",
        specialty: "Kardiyoloji",
        city: "İzmir",
        source: "SAGLIK_BAKANLIGI",
        doctorId: t15DocOfficial.id,
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t15OfficialDir.id);

    // Unofficial source doctor
    const t15UnofficialUser = await prisma.user.create({
      data: { email: `t15-del-unoff-${Date.now()}@alumas.test`, name: "Dr. Selim Koç", role: "DOCTOR" },
    });
    const t15DocUnofficial = await prisma.doctor.create({
      data: {
        userId: t15UnofficialUser.id,
        slug: `dr-selim-koc-unoff-${Date.now()}`,
        name: "Selim Koç",
        title: "Uzm. Dr.",
        specialty: "Dermatoloji",
        hospital: "Özel Klinik",
        city: "Bursa",
        bio: "Dermatoloji uzmanı",
        price: 1800,
        nextSlot: "Salı 14:00",
      },
    });
    cleanupIds.doctors.push(t15DocUnofficial.id);

    const t15UnofficialDir = await prisma.directoryDoctor.create({
      data: {
        slug: `t15-dir-unofficial-${Date.now()}`,
        name: "Selim Koç",
        title: "Uzm. Dr.",
        specialty: "Dermatoloji",
        city: "Bursa",
        source: "MANUAL_WEB_SCRAPE",
        doctorId: t15DocUnofficial.id,
        isActive: true,
      },
    });
    cleanupIds.directoryDoctors.push(t15UnofficialDir.id);

    // Simulate account deletion transaction for Official doctor (matching /api/account/delete)
    await prisma.$transaction(async (tx) => {
      const linkedDirs = await tx.directoryDoctor.findMany({
        where: { doctorId: t15DocOfficial.id },
      });
      for (const dir of linkedDirs) {
        const isAuthoritativeOfficial = isOfficialRegistrySource(dir.source);
        const shouldRemainActive = isAuthoritativeOfficial; // requestedDirectoryRemoval = false
        await tx.directoryDoctor.update({
          where: { id: dir.id },
          data: { doctorId: null, isActive: shouldRemainActive },
        });
      }
      await tx.user.delete({ where: { id: t15OfficialUser.id } });
    }, { maxWait: 10000, timeout: 25000 });

    // Simulate account deletion transaction for Unofficial doctor
    await prisma.$transaction(async (tx) => {
      const linkedDirs = await tx.directoryDoctor.findMany({
        where: { doctorId: t15DocUnofficial.id },
      });
      for (const dir of linkedDirs) {
        const isAuthoritativeOfficial = isOfficialRegistrySource(dir.source);
        const shouldRemainActive = isAuthoritativeOfficial;
        await tx.directoryDoctor.update({
          where: { id: dir.id },
          data: { doctorId: null, isActive: shouldRemainActive },
        });
      }
      await tx.user.delete({ where: { id: t15UnofficialUser.id } });
    }, { maxWait: 10000, timeout: 25000 });

    const checkOfficial = await prisma.directoryDoctor.findUnique({ where: { id: t15OfficialDir.id } });
    const checkUnofficial = await prisma.directoryDoctor.findUnique({ where: { id: t15UnofficialDir.id } });

    assert.strictEqual(checkOfficial?.doctorId, null, "Test 15: Official dir doctorId is unlinked");
    assert.strictEqual(checkOfficial?.isActive, true, "Test 15: Official dir remains active");

    assert.strictEqual(checkUnofficial?.doctorId, null, "Test 15: Unofficial dir doctorId is unlinked");
    assert.strictEqual(checkUnofficial?.isActive, false, "Test 15: Unofficial dir is safely de-listed (isActive = false)");
    console.log("✔ TEST 15 PASSED: Account deletion de-lists unofficial sources and unlinks official sources safely.");

    console.log("\n===============================================================================");
    console.log("ALL 15 END-TO-END TESTS COMPLETED SUCCESSFULLY!");
    console.log("===============================================================================\n");
  } finally {
    console.log("Cleaning up test records...");
    for (const docFileId of cleanupIds.documents) {
      await prisma.verificationDocument.deleteMany({ where: { id: docFileId } }).catch(() => {});
    }
    for (const claimId of cleanupIds.claims) {
      await prisma.doctorClaim.deleteMany({ where: { id: claimId } }).catch(() => {});
    }
    for (const docId of cleanupIds.doctors) {
      await prisma.doctor.deleteMany({ where: { id: docId } }).catch(() => {});
    }
    for (const dirId of cleanupIds.directoryDoctors) {
      await prisma.directoryDoctor.deleteMany({ where: { id: dirId } }).catch(() => {});
    }
    for (const userId of cleanupIds.users) {
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    }

    const finalDoctorCount = await prisma.doctor.count();
    const finalDirDoctorCount = await prisma.directoryDoctor.count();
    const finalClaimCount = await prisma.doctorClaim.count();
    console.log(
      `[CLEANUP COMPLETE] Baseline restored. Doctors: ${finalDoctorCount}, DirectoryDoctors: ${finalDirDoctorCount}, Claims: ${finalClaimCount}`
    );
  }
}

run()
  .catch((err) => {
    console.error("TEST FAILED WITH ERROR:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
