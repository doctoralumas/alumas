import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (p) => fs.readFileSync(p, "utf8");

test("1-9 & 15: Runtime behavioral verification of Institution Directory, Badge Eligibility, Claim Lifecycle, URL Security & Filtering", () => {
  const inlineScript = `
    import assert from "node:assert/strict";
    import { normalizeOfficialWebsiteUrl, isSafeOfficialWebsiteUrl } from "./lib/external-url.ts";
    import {
      sanitizeClaimDirectoryId,
      sanitizeInternalReturnUrl,
      resolvePostAuthDestination,
      buildAuthHref,
    } from "./lib/claim-onboarding.ts";
    import { CURATED_DIRECTORY_INSTITUTIONS } from "./lib/directory-fixtures.ts";
    import { approvalBlockReason } from "./lib/verification-documents.ts";
    import {
      isOrganizationVerifiedByAlumas,
      buildNormalizedDirectoryItems,
    } from "./lib/institution-directory.ts";

    const now = new Date("2026-10-17T12:00:00.000Z");

    // --- Scenario 0: Production Curated Fixture Data Quality Verification ---
    const removedIds = ["dir-moda-merkez-eczanesi", "dir-synlab-istanbul", "dir-affidea-goruntuleme"];
    for (const removedId of removedIds) {
      assert.equal(
        CURATED_DIRECTORY_INSTITUTIONS.some((d) => d.id === removedId),
        false,
        "Fictional or unverified fixture must not exist in runtime CURATED_DIRECTORY_INSTITUTIONS: " + removedId
      );
    }
    const medicanaFixture = CURATED_DIRECTORY_INSTITUTIONS.find((d) => d.id === "dir-medicana-kadikoy");
    assert.ok(medicanaFixture, "Medicana Kadıköy Hastanesi must exist in curated fixtures");
    assert.equal(medicanaFixture.name, "Medicana Kadıköy Hastanesi");
    assert.equal(medicanaFixture.slug, "medicana-kadikoy-hastanesi");
    assert.equal(medicanaFixture.type, "HOSPITAL");
    assert.equal(medicanaFixture.phone, null, "Unverified phone must be null rather than fabricated");

    // --- Claim Onboarding Return URL & Open Redirect Security (Matrix 1, 2, 3, 12, 13) ---
    assert.equal(sanitizeClaimDirectoryId("dir-medicana-kadikoy"), "dir-medicana-kadikoy");
    assert.equal(sanitizeClaimDirectoryId("  medicana-kadikoy-hastanesi  "), "medicana-kadikoy-hastanesi");
    assert.equal(sanitizeClaimDirectoryId("javascript:alert(1)"), null);
    assert.equal(sanitizeClaimDirectoryId("../etc/passwd"), null);
    assert.equal(sanitizeClaimDirectoryId(""), null);

    // Open redirect prevention (Matrix 13)
    const openRedirectPayloads = [
      "https://evil.example.com/phish",
      "http://evil.example.com",
      "//evil.example.com/path",
      "/\\\\evil.example.com",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "/login",
      "/pro/login?next=/profile",
      "/register",
      "/api/auth/logout",
      "",
    ];
    for (const badNext of openRedirectPayloads) {
      assert.equal(
        sanitizeInternalReturnUrl(badNext),
        null,
        "Open redirect or disallowed return URL must be rejected: " + badNext
      );
    }

    assert.equal(
      sanitizeInternalReturnUrl("/business/apply?claimDirectoryId=dir-medicana-kadikoy"),
      "/business/apply?claimDirectoryId=dir-medicana-kadikoy"
    );

    // Guest creates account or signs in via claim flow -> returns to exact claimed institution (Matrix 2 & 3)
    assert.equal(
      resolvePostAuthDestination({
        mode: "register",
        accountType: "ORGANIZATION",
        claimDirectoryId: "dir-medicana-kadikoy",
        next: "/business/apply?claimDirectoryId=dir-medicana-kadikoy",
      }),
      "/business/apply?claimDirectoryId=dir-medicana-kadikoy"
    );
    assert.equal(
      resolvePostAuthDestination({
        mode: "register",
        accountType: "PATIENT",
        claimDirectoryId: "dir-medicana-kadikoy",
        next: null,
      }),
      "/business/apply?claimDirectoryId=dir-medicana-kadikoy"
    );
    assert.equal(
      resolvePostAuthDestination({
        mode: "login",
        claimDirectoryId: "dir-medicana-kadikoy",
        next: "https://evil.example.com",
      }),
      "/business/apply?claimDirectoryId=dir-medicana-kadikoy"
    );
    assert.equal(
      resolvePostAuthDestination({
        mode: "login",
        claimDirectoryId: null,
        next: "https://evil.example.com",
      }),
      "/profile"
    );

    const builtProLoginHref = buildAuthHref("/pro/login", {
      claimDirectoryId: "dir-medicana-kadikoy",
    });
    assert.match(builtProLoginHref, /claimDirectoryId=dir-medicana-kadikoy/);
    assert.match(builtProLoginHref, /next=%2Fbusiness%2Fapply%3FclaimDirectoryId%3Ddir-medicana-kadikoy/);

    // Synthetic fixtures strictly scoped to unit tests (never exported from runtime lib/directory-fixtures.ts)
    const TEST_SYNTHETIC_FIXTURES = [
      ...CURATED_DIRECTORY_INSTITUTIONS,
      {
        id: "test-dir-synlab-istanbul",
        slug: "synlab-klinik-laboratuvari-besiktas",
        name: "Synlab Klinik Laboratuvarı (Test)",
        type: "LABORATORY",
        city: "İstanbul",
        district: "Beşiktaş",
        address: "Test Adresi No:1",
        phone: null,
        officialWebsite: "https://www.synlab.com.tr",
        description: "Test laboratuvar kaydı.",
        latitude: 41.0598,
        longitude: 29.0132,
        isOnDuty: false,
        onDutyUntil: null,
        source: "TEST_FIXTURE",
        externalRef: "TEST-SYNLAB",
        lastVerifiedAt: "2026-10-01T09:00:00.000Z",
        isActive: true,
        organizationId: null,
      },
      {
        id: "test-dir-no-website-pharmacy",
        slug: "moda-cadde-eczanesi-kadikoy",
        name: "Moda Cadde Eczanesi (Test)",
        type: "PHARMACY",
        city: "İstanbul",
        district: "Kadıköy",
        address: "Test Moda Cad. No:1",
        phone: null,
        officialWebsite: null,
        description: "Resmi web sitesi bulunmayan güvenli geri dönüş test kaydı.",
        latitude: 40.9832,
        longitude: 29.0258,
        isOnDuty: false,
        onDutyUntil: null,
        source: "TEST_FIXTURE",
        externalRef: "TEST-NO-WEBSITE",
        lastVerifiedAt: "2026-10-01T09:00:00.000Z",
        isActive: true,
        organizationId: null,
      },
      {
        id: "test-dir-medicana-atasehir",
        slug: "medicana-atasehir-hastanesi",
        name: "Medicana Ataşehir Hastanesi",
        type: "HOSPITAL",
        city: "İstanbul",
        district: "Ataşehir",
        address: "Küçükbakkalköy Mah. Vedat Günyol Cad. No:28",
        phone: null,
        officialWebsite: "https://www.medicana.com.tr",
        description: "Test ikinci şube kaydı.",
        latitude: 40.9841,
        longitude: 29.1082,
        isOnDuty: false,
        onDutyUntil: null,
        source: "TEST_FIXTURE",
        externalRef: "TEST-MEDICANA-ATASEHIR",
        lastVerifiedAt: "2026-10-01T09:00:00.000Z",
        isActive: true,
        organizationId: null,
      },
    ];

    // --- Scenario 1: Verified ALUMAS Institution ---
    const alumasHospital = {
      id: "org-alumas-sehir",
      ownerUserId: "user-owner-1",
      slug: "alumas-sehir-hastanesi",
      name: "Alumas Şehir Hastanesi",
      type: "HOSPITAL",
      status: "APPROVED",
      isPublished: true,
      verifiedAt: new Date("2026-01-15T10:00:00.000Z"),
      city: "İstanbul",
      district: "Şişli",
      address: "Merkez Mah. No:10",
      phone: "+90 212 000 00 00",
      website: "https://sehirhastanesi.example.org",
      latitude: 41.06,
      longitude: 28.98,
      verificationDocuments: [
        { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: new Date("2027-12-31T00:00:00.000Z") },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED", expiresAt: null },
        { documentType: "TRADE_REGISTRY", status: "APPROVED", expiresAt: null },
      ],
      reviews: [{ rating: 5 }, { rating: 4 }],
      services: [{ id: "srv-1", name: "Kardiyoloji Muayenesi" }],
      _count: { doctors: 12, reviews: 2 },
    };

    assert.equal(isOrganizationVerifiedByAlumas(alumasHospital, now), true, "Approved org with valid docs must be verified");
    assert.equal(
      isOrganizationVerifiedByAlumas({ ...alumasHospital, verificationDocuments: [] }, now, { requireDocuments: true }),
      false,
      "Strict document mode must reject organizations with 0 VerificationDocument records"
    );
    assert.ok(
      approvalBlockReason("organization", "HOSPITAL", []),
      "Admin approval must be blocked when an organization has 0 VerificationDocument records"
    );

    const initialItems = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital],
      { now }
    );

    const verifiedCard = initialItems.find((i) => i.slug === "alumas-sehir-hastanesi");
    assert.ok(verifiedCard, "Alumas Şehir Hastanesi must appear in directory");
    assert.equal(verifiedCard.isVerified, true, "Verified institution must have blue badge (isVerified=true)");
    assert.equal(verifiedCard.verificationState, "VERIFIED");
    assert.equal(verifiedCard.navigationMode, "INTERNAL");
    assert.equal(verifiedCard.primaryHref, "/organizations/alumas-sehir-hastanesi");
    assert.equal(verifiedCard.isExternalDestination, false);
    assert.equal(verifiedCard.canClaim, false);
    assert.equal(verifiedCard._count.doctors, 12);

    // --- Scenario 2: External Unregistered Institution ---
    const acibademCard = initialItems.find((i) => i.slug === "acibadem-maslak-hastanesi");
    assert.ok(acibademCard, "External Acıbadem Maslak Hastanesi must appear in directory");
    assert.equal(acibademCard.isVerified, false, "External institution must NOT have blue badge");
    assert.equal(acibademCard.verificationState, "UNREGISTERED");
    assert.equal(acibademCard.navigationMode, "EXTERNAL");
    assert.equal(acibademCard.primaryHref, "https://www.acibadem.com.tr/");
    assert.equal(acibademCard.isExternalDestination, true);
    assert.equal(acibademCard.organizationId, null, "External institution must not have internal booking org ID");
    assert.equal(acibademCard.canClaim, true);

    // --- Matrix 6: Branch-Specific Claim Isolation (Medicana Kadıköy vs Medicana Ataşehir) ---
    const medicanaKadikoyClaimOrg = {
      id: "org-medicana-kadikoy-approved",
      ownerUserId: "user-medicana-kadikoy",
      slug: "medicana-kadikoy-hastanesi",
      name: "Medicana Kadıköy Hastanesi",
      type: "HOSPITAL",
      status: "APPROVED",
      isPublished: true,
      verifiedAt: new Date("2026-10-17T11:00:00.000Z"),
      city: "İstanbul",
      district: "Kadıköy",
      address: "Zühtüpaşa Mah., Recep Peker Cd. No:11",
      phone: "+90 216 000 00 00",
      website: "https://www.medicana.com.tr",
      verificationDocuments: [
        { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: new Date("2028-01-01T00:00:00.000Z") },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED", expiresAt: null },
        { documentType: "TRADE_REGISTRY", status: "APPROVED", expiresAt: null },
      ],
    };
    const dirWithBranchClaim = TEST_SYNTHETIC_FIXTURES.map((d) =>
      d.id === "dir-medicana-kadikoy"
        ? {
            ...d,
            organizationId: medicanaKadikoyClaimOrg.id,
            organization: medicanaKadikoyClaimOrg,
            claims: [
              {
                id: "claim-medicana-kadikoy",
                directoryInstitutionId: d.id,
                organizationId: medicanaKadikoyClaimOrg.id,
                claimantUserId: "user-medicana-kadikoy",
                status: "APPROVED",
              },
            ],
          }
        : d
    );
    const branchIsolationItems = buildNormalizedDirectoryItems(
      dirWithBranchClaim,
      [alumasHospital, medicanaKadikoyClaimOrg],
      { now }
    );
    const kadikoyItem = branchIsolationItems.find((i) => i.slug === "medicana-kadikoy-hastanesi");
    const atasehirItem = branchIsolationItems.find((i) => i.slug === "medicana-atasehir-hastanesi");
    assert.ok(kadikoyItem && atasehirItem);
    assert.equal(kadikoyItem.isVerified, true, "Claimed Medicana Kadıköy branch is verified");
    assert.equal(kadikoyItem.navigationMode, "INTERNAL");
    assert.equal(atasehirItem.isVerified, false, "Other branch (Medicana Ataşehir) must remain unverified and unclaimed");
    assert.equal(atasehirItem.canClaim, true, "Other branch (Medicana Ataşehir) must remain independently claimable");
    assert.equal(atasehirItem.navigationMode, "EXTERNAL");

    // --- Scenario 3 (Matrix 8): External Institution With Pending Claim ---
    const pendingClaimOrg = {
      id: "org-claim-pending-1",
      ownerUserId: "user-claimant-1",
      slug: "acibadem-maslak-hastanesi",
      name: "Acıbadem Maslak Hastanesi",
      type: "HOSPITAL",
      status: "PENDING",
      isPublished: false,
      verifiedAt: null,
      city: "İstanbul",
      district: "Sarıyer",
      address: "Darüşşafaka, Büyükdere Cd. No:40",
      phone: "+90 212 304 44 44",
    };

    const dirWithPendingClaim = TEST_SYNTHETIC_FIXTURES.map((d) =>
      d.id === "dir-acibadem-maslak"
        ? {
            ...d,
            claims: [
              {
                id: "claim-1",
                directoryInstitutionId: d.id,
                organizationId: pendingClaimOrg.id,
                claimantUserId: "user-claimant-1",
                status: "PENDING",
              },
            ],
          }
        : d
    );

    const pendingItems = buildNormalizedDirectoryItems(
      dirWithPendingClaim,
      [alumasHospital, pendingClaimOrg],
      { now }
    );

    const acibademMatchesDuringPending = pendingItems.filter((i) =>
      i.name.includes("Acıbadem Maslak")
    );
    assert.equal(acibademMatchesDuringPending.length, 1, "Must NOT create duplicate card while claim is pending");
    const pendingCard = acibademMatchesDuringPending[0];
    assert.equal(pendingCard.isVerified, false, "Pending claim must NOT grant blue badge");
    assert.equal(pendingCard.verificationState, "PENDING_CLAIM");
    assert.equal(pendingCard.navigationMode, "EXTERNAL", "Pending claim on existing external listing must remain external");
    assert.equal(pendingCard.primaryHref, "https://www.acibadem.com.tr/");
    assert.equal(pendingCard.canClaim, false, "Second user cannot claim while a claim is PENDING");

    // Also verify a brand-new unapproved institution (not in external directory) is NOT exposed publicly
    const brandNewPendingOrg = {
      id: "org-new-unapproved",
      ownerUserId: "user-2",
      slug: "yeni-onaysiz-klinik",
      name: "Yeni Onaysız Klinik",
      type: "CLINIC",
      status: "PENDING",
      isPublished: false,
      verifiedAt: null,
      city: "İzmir",
      address: "Alsancak",
      phone: "02320000000",
    };
    const withBrandNewPending = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital, brandNewPendingOrg],
      { now }
    );
    assert.equal(
      withBrandNewPending.some((i) => i.slug === "yeni-onaysiz-klinik"),
      false,
      "Brand-new unapproved applicant must NOT be exposed in public directory"
    );

    // --- Scenario 4 (Matrix 9): Approved Claim Transition Without Duplication ---
    const approvedClaimOrg = {
      ...pendingClaimOrg,
      status: "APPROVED",
      isPublished: true,
      verifiedAt: new Date("2026-10-17T10:00:00.000Z"),
      verificationDocuments: [
        { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: new Date("2028-01-01T00:00:00.000Z") },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED", expiresAt: null },
        { documentType: "TRADE_REGISTRY", status: "APPROVED", expiresAt: null },
      ],
    };

    const dirWithApprovedClaim = TEST_SYNTHETIC_FIXTURES.map((d) =>
      d.id === "dir-acibadem-maslak"
        ? {
            ...d,
            organizationId: approvedClaimOrg.id,
            organization: approvedClaimOrg,
            claims: [
              {
                id: "claim-1",
                directoryInstitutionId: d.id,
                organizationId: approvedClaimOrg.id,
                claimantUserId: "user-claimant-1",
                status: "APPROVED",
              },
            ],
          }
        : d
    );

    const approvedItems = buildNormalizedDirectoryItems(
      dirWithApprovedClaim,
      [alumasHospital, approvedClaimOrg],
      { now }
    );

    const acibademMatchesAfterApproval = approvedItems.filter((i) =>
      i.name.includes("Acıbadem Maslak")
    );
    assert.equal(acibademMatchesAfterApproval.length, 1, "Approved claim must transition in-place with zero duplicate cards");
    const transitionedCard = acibademMatchesAfterApproval[0];
    assert.equal(transitionedCard.isVerified, true, "Approved claim must grant blue ALUMAS badge");
    assert.equal(transitionedCard.verificationState, "VERIFIED");
    assert.equal(transitionedCard.navigationMode, "INTERNAL", "Approved claim must transition navigation from EXTERNAL to INTERNAL");
    assert.equal(transitionedCard.primaryHref, "/organizations/acibadem-maslak-hastanesi");
    assert.equal(transitionedCard.isExternalDestination, false);
    assert.equal(transitionedCard.organizationId, approvedClaimOrg.id);
    assert.equal(transitionedCard.directoryId, "dir-acibadem-maslak");

    // --- Scenario 5 (Matrix 10): Rejected Claim ---
    const rejectedClaimOrg = {
      ...pendingClaimOrg,
      status: "REJECTED",
      isPublished: false,
      verifiedAt: null,
    };
    const dirWithRejectedClaim = TEST_SYNTHETIC_FIXTURES.map((d) =>
      d.id === "dir-acibadem-maslak"
        ? {
            ...d,
            organizationId: null,
            claims: [
              {
                id: "claim-1",
                directoryInstitutionId: d.id,
                organizationId: rejectedClaimOrg.id,
                claimantUserId: "user-claimant-1",
                status: "REJECTED",
              },
            ],
          }
        : d
    );

    const rejectedItems = buildNormalizedDirectoryItems(
      dirWithRejectedClaim,
      [alumasHospital, rejectedClaimOrg],
      { now }
    );
    const rejectedCard = rejectedItems.find((i) => i.slug === "acibadem-maslak-hastanesi");
    assert.ok(rejectedCard);
    assert.equal(rejectedCard.isVerified, false, "Rejected claim must NOT grant blue badge");
    assert.equal(rejectedCard.organizationId, null, "Rejected claim must NOT grant ownership");
    assert.equal(rejectedCard.navigationMode, "EXTERNAL", "Rejected claim on external listing keeps external website navigation");
    assert.equal(rejectedCard.canClaim, true, "Rejected claim re-opens ability for legitimate owner to claim");

    // --- Scenario 7: Missing Official Website Fallback ---
    const missingWebCard = initialItems.find((i) => i.slug === "moda-cadde-eczanesi-kadikoy");
    assert.ok(missingWebCard, "Synthetic pharmacy without official website must appear in test directory");
    assert.equal(missingWebCard.isVerified, false);
    assert.equal(missingWebCard.hasOfficialWebsite, false);
    assert.equal(missingWebCard.officialWebsite, null);
    assert.equal(missingWebCard.navigationMode, "NONE");
    assert.equal(missingWebCard.primaryHref, null, "Must NOT invent a website URL when missing");
    assert.equal(missingWebCard.isExternalDestination, false);

    // --- Scenario 8: Malicious Website Input Rejection ---
    const maliciousInputs = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(document.cookie)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "ftp://files.example.com",
      "http://localhost:3000/admin",
      "https://127.0.0.1/secret",
      "https://192.168.1.1/router",
      "https://admin:password@hospital.example.com",
      "https://bit.ly/fake-hospital",
      "https://tinyurl.com/fake-clinic",
      "https://alumas.com/organizations/fake",
      "/organizations/alumas-sehir-hastanesi",
      "not a url",
      "",
    ];
    for (const bad of maliciousInputs) {
      assert.equal(
        normalizeOfficialWebsiteUrl(bad),
        null,
        "Malicious or invalid URL must be rejected: " + bad
      );
      assert.equal(isSafeOfficialWebsiteUrl(bad), false);
    }

    assert.equal(
      normalizeOfficialWebsiteUrl("https://www.amerikanhastanesi.org/tr"),
      "https://www.amerikanhastanesi.org/tr"
    );
    assert.equal(
      normalizeOfficialWebsiteUrl("http://www.memorial.com.tr"),
      "https://www.memorial.com.tr/"
    );

    // --- Scenario 9 (Matrix 11): Suspended / Revoked Institution ---
    const suspendedOrg = {
      ...approvedClaimOrg,
      status: "SUSPENDED",
      isPublished: false,
      verifiedAt: null,
    };
    assert.equal(isOrganizationVerifiedByAlumas(suspendedOrg, now), false, "Suspended org must lose verified status");

    const dirWithSuspendedOrg = TEST_SYNTHETIC_FIXTURES.map((d) =>
      d.id === "dir-acibadem-maslak"
        ? {
            ...d,
            organizationId: suspendedOrg.id,
            organization: suspendedOrg,
          }
        : d
    );
    const suspendedItems = buildNormalizedDirectoryItems(
      dirWithSuspendedOrg,
      [alumasHospital, suspendedOrg],
      { now }
    );
    assert.equal(
      suspendedItems.some((i) => i.slug === "acibadem-maslak-hastanesi"),
      false,
      "Suspended organization must be suppressed and must NOT bypass suspension by redirecting to external website"
    );

    // Expired document also revokes badge
    const expiredDocOrg = {
      ...alumasHospital,
      verificationDocuments: [
        { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: new Date("2025-01-01T00:00:00.000Z") },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED", expiresAt: null },
        { documentType: "TRADE_REGISTRY", status: "APPROVED", expiresAt: null },
      ],
    };
    assert.equal(isOrganizationVerifiedByAlumas(expiredDocOrg, now), false, "Expired mandatory document must revoke blue badge");

    // --- Scenario 15: Search, Category Filters, On-Duty Filter, Unclaimed Filter & Geolocation Sorting ---
    const labsOnly = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital],
      { type: "LABORATORY", now }
    );
    assert.ok(labsOnly.length >= 1);
    assert.ok(labsOnly.every((i) => i.type === "LABORATORY"));

    const ankaraOnly = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital],
      { city: "Ankara", now }
    );
    assert.equal(ankaraOnly.length, 1);
    assert.equal(ankaraOnly[0].slug, "ankara-bilkent-sehir-hastanesi");

    const searchSynlab = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital],
      { q: "Synlab", now }
    );
    assert.equal(searchSynlab.length, 1);
    assert.equal(searchSynlab[0].slug, "synlab-klinik-laboratuvari-besiktas");

    const unclaimedOnly = buildNormalizedDirectoryItems(
      dirWithPendingClaim,
      [alumasHospital, pendingClaimOrg],
      { unclaimedOnly: true, now }
    );
    assert.ok(unclaimedOnly.every((i) => !i.isVerified && i.canClaim));
    assert.equal(
      unclaimedOnly.some((i) => i.slug === "acibadem-maslak-hastanesi"),
      false,
      "Institution with pending claim must not appear in unclaimedOnly list"
    );

    const geoSorted = buildNormalizedDirectoryItems(
      TEST_SYNTHETIC_FIXTURES,
      [alumasHospital],
      { lat: 40.9905, lng: 29.029, now } // Kadıköy coordinates
    );
    assert.ok(geoSorted[0].distanceKm !== null);
    assert.ok(
      geoSorted[0].distanceKm <= (geoSorted[1].distanceKm ?? 99999),
      "Geolocation query must sort directory items by ascending distanceKm"
    );
  `;

  execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", inlineScript], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});

test("6, 10-14: Security, RBAC, Claim Onboarding Gate, Branch Tampering Protection, Resubmission & Public/Private Boundary Contracts", () => {
  // Public profile /organizations/[slug] must never expose private management controls or unapproved orgs
  const publicProfile = read("app/organizations/[slug]/page.tsx");
  assert.match(publicProfile, /status:\s*"APPROVED"/);
  assert.match(publicProfile, /isPublished:\s*true/);
  assert.match(publicProfile, /isOrganizationVerifiedByAlumas/);
  assert.match(publicProfile, /normalizeOfficialWebsiteUrl/);

  // Business Apply page must render the contextual Claim Onboarding Gate for unauthenticated guests instead of losing claimDirectoryId
  const businessApplyPage = read("app/business/apply/page.tsx");
  assert.match(businessApplyPage, /findDirectoryInstitutionByIdOrSlug/);
  assert.match(businessApplyPage, /claim-onboarding-gate/);
  assert.match(businessApplyPage, /claim-onboarding-banner/);
  assert.match(businessApplyPage, /claim-login-cta/);
  assert.match(businessApplyPage, /claim-register-cta/);

  // BusinessApplicationForm must pre-populate and lock branch identity when claiming a directory institution
  const businessApplyForm = read("components/business-application-form.tsx");
  assert.match(businessApplyForm, /isBranchIdentityLocked/);
  assert.match(businessApplyForm, /claimed-branch-summary/);
  assert.match(businessApplyForm, /claim-invalid-id-warning/);
  assert.match(businessApplyForm, /claim-already-active-notice/);

  // AuthForm and PhoneLogin must preserve claimDirectoryId and next return URL
  const authForm = read("components/auth-form.tsx");
  assert.match(authForm, /resolvePostAuthDestination/);
  assert.match(authForm, /auth-claim-context-banner/);
  const phoneLogin = read("components/phone-login.tsx");
  assert.match(phoneLogin, /resolvePostAuthDestination/);
  assert.match(phoneLogin, /auth-claim-context-banner/);

  // Private dashboard /business/[id] must enforce currentUser() and ownerUserId / ADMIN check (compatible with existing PATIENT accounts who own an org)
  const privateDashboardPage = read("app/business/[id]/page.tsx");
  assert.match(privateDashboardPage, /currentUser\(\)/);
  assert.match(privateDashboardPage, /ownerUserId:\s*u\.id/);
  assert.match(privateDashboardPage, /u\.role\s*===\s*["']ADMIN["']/);

  const orgIdApi = read("app/api/organizations/[id]/route.ts");
  assert.match(orgIdApi, /org\.ownerUserId\s*!==\s*u\.id/);
  assert.match(orgIdApi, /u\.role\s*!==\s*["']ADMIN["']/);
  assert.match(orgIdApi, /b\.resubmit\s*===\s*true/);
  assert.match(orgIdApi, /organization\.resubmit/);

  // API /api/organizations POST must require auth, validate requestedDirId strictly, enforce branch identity, execute transactionally, and return 409 on duplicate claims
  const orgApi = read("app/api/organizations/route.ts");
  assert.match(orgApi, /currentUser\(\)/);
  assert.match(orgApi, /normalizeOfficialWebsiteUrl/);
  assert.match(orgApi, /Seçilen dizin kurumu bulunamadı veya aktif değil/);
  assert.match(orgApi, /Sahiplenilen şube kimliği/);
  assert.match(orgApi, /prisma\.\$transaction/);
  assert.match(orgApi, /status:\s*409/);
  assert.match(orgApi, /organization\.claim\.submit/);

  // Admin API /api/admin/organizations/[id] must require ADMIN role, check approvalBlockReason, execute transactionally, and prevent duplicate approved claims
  const adminOrgIdApi = read("app/api/admin/organizations/[id]/route.ts");
  assert.match(adminOrgIdApi, /u\.role\s*!==\s*"ADMIN"/);
  assert.match(adminOrgIdApi, /approvalBlockReason/);
  assert.match(adminOrgIdApi, /prisma\.\$transaction/);
  assert.match(adminOrgIdApi, /organization\.claim\.approved/);
  assert.match(adminOrgIdApi, /status:\s*409/);

  // All operational routes must block unapproved / pending / suspended organizations
  const approvedGatedRoutes = [
    "app/api/organizations/[id]/results/route.ts",
    "app/api/organizations/[id]/invites/route.ts",
    "app/api/organizations/[id]/home-visits/route.ts",
    "app/api/organizations/[id]/campaigns/route.ts",
    "app/api/organizations/[id]/departments/route.ts",
    "app/api/organizations/[id]/doctor-department/route.ts",
    "app/api/organizations/[id]/emergency-services/route.ts",
    "app/api/organizations/[id]/hours/route.ts",
    "app/api/organizations/[id]/imaging-exams/route.ts",
    "app/api/organizations/[id]/laboratory-tests/route.ts",
    "app/api/organizations/[id]/insurance/route.ts",
    "app/api/organizations/[id]/services/route.ts",
    "app/api/organizations/[id]/service-variants/route.ts",
    "app/api/organizations/[id]/stock/route.ts",
  ];
  for (const routePath of approvedGatedRoutes) {
    const content = read(routePath);
    assert.match(
      content,
      /status\s*!==\s*["']APPROVED["']\s*\|\|\s*!(?:org|o)\.isPublished/,
      `Route ${routePath} must gate operational features behind APPROVED and isPublished`
    );
  }

  const inviteAcceptApi = read("app/api/organization-invites/[id]/route.ts");
  assert.match(inviteAcceptApi, /inv\.organization\.status\s*!==\s*['"]APPROVED['"]\s*\|\|\s*!inv\.organization\.isPublished/);

  const orgManagerUi = read("components/business/organization-manager.tsx");
  assert.match(orgManagerUi, /const isApproved = currentStatus === "APPROVED" && !!org\.isPublished/);
  assert.match(orgManagerUi, /org-status-banner-pending/);
  assert.match(orgManagerUi, /org-status-banner-rejected/);
  assert.match(orgManagerUi, /org-resubmit-btn/);
  assert.match(orgManagerUi, /org-status-banner-suspended/);

  // Backfill script must default to dry-run and only write when --apply is passed
  const backfillScript = read("scripts/backfill-directory-institutions.mjs");
  assert.match(backfillScript, /process\.argv\.includes\("--apply"\)/);
  assert.match(backfillScript, /process\.argv\.includes\("--only-approved-orgs"\)/);
  assert.match(backfillScript, /DRY_RUN/);

  // Directory UI must use target="_blank" rel="noopener noreferrer" for external links and separate INTERNAL vs EXTERNAL vs NONE
  const directoryUi = read("components/organization-directory.tsx");
  assert.match(directoryUi, /rel="noopener noreferrer"/);
  assert.match(directoryUi, /visitOfficialWebsite/);
  assert.match(directoryUi, /websiteUnavailable/);
  assert.match(directoryUi, /alumasVerified/);
  assert.match(directoryUi, /claimInstitution/);
});

test("16: Localization parity for TR and EN directory, verification badge, and claim onboarding keys", () => {
  const tr = JSON.parse(read("messages/tr.json"));
  const en = JSON.parse(read("messages/en.json"));

  const requiredDiscoveryKeys = [
    "visitOfficialWebsite",
    "externalSiteNotice",
    "websiteUnavailable",
    "alumasVerified",
    "alumasVerifiedTooltip",
    "claimPendingBadge",
    "claimPendingTooltip",
    "externalDirectoryListing",
    "externalDirectoryTooltip",
    "claimInstitution",
  ];

  for (const key of requiredDiscoveryKeys) {
    assert.ok(tr.discovery?.[key], `Missing TR discovery.${key}`);
    assert.ok(en.discovery?.[key], `Missing EN discovery.${key}`);
  }

  assert.equal(tr.discovery.visitOfficialWebsite, "Web sitesine git");
  assert.equal(en.discovery.visitOfficialWebsite, "Visit Website");

  const requiredApplyKeys = [
    "modeNewInstitution",
    "modeClaimDirectory",
    "verificationReviewNotice",
    "selectDirectoryInstitutionLabel",
    "applicantRoleLabel",
    "submitClaimButton",
    "claimGateKicker",
    "claimGateTitle",
    "claimGateSubtitle",
    "claimGateWhyDocsTitle",
    "claimGateWhyDocsDesc",
    "claimGateBranchScopeNotice",
    "claimGateExistingAccountTitle",
    "claimGateExistingAccountDesc",
    "claimGateLoginProButton",
    "claimGateRegisterProButton",
    "claimedBranchBadge",
    "invalidClaimDirectoryWarning",
    "alreadyClaimedWarning",
  ];

  for (const key of requiredApplyKeys) {
    assert.ok(tr.professional?.businessApply?.[key], `Missing TR professional.businessApply.${key}`);
    assert.ok(en.professional?.businessApply?.[key], `Missing EN professional.businessApply.${key}`);
  }

  const requiredAuthKeys = [
    "claimContextKicker",
    "claimContextTitle",
    "claimContextSubtitle",
    "claimExistingAccountHint",
  ];
  for (const key of requiredAuthKeys) {
    assert.ok(tr.auth?.[key], `Missing TR auth.${key}`);
    assert.ok(en.auth?.[key], `Missing EN auth.${key}`);
  }
});
