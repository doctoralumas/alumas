import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("ALUMAS Insurance Ecosystem Phase 2 — Patient Insurance Management & Insurance-Aware Discovery Contracts (1–15)", () => {
  const inlineScript = `
    import assert from "node:assert/strict";
    import {
      InsuranceDomainError,
      filterPublicCatalogInsurers,
      enrichInsurerCatalogWithProductsAndNetworks,
      validatePatientInsurancePreferenceInput,
      assertPreferenceOwnership,
      evaluateFacilityInsuranceCoverage,
      filterAndRankByInsuranceDiscovery,
    } from "./lib/insurance-domain.ts";
    import {
      buildNormalizedDirectoryItems,
    } from "./lib/institution-directory.ts";
    import {
      scoreContextualDoctorMatch,
    } from "./lib/ai/match-engine.ts";

    const now = new Date("2026-10-24T20:00:00.000Z");

    const CATALOG_INSURERS = [
      { id: "cmtkaf9rp0089ypj4t4680pc9", name: "Alumas Demo Sigorta", slug: "alumas-demo-sigorta", isActive: true, lifecycleStatus: "DEMO_INTERNAL", isPubliclyListed: false },
      { id: "cmuk34i050000ypvshyuhm1yf", name: "Allianz Sigorta", slug: "allianz", isActive: true, lifecycleStatus: "ACTIVE", isPubliclyListed: true },
      { id: "cmuk34ipp0001ypvsu9jj91b3", name: "Bupa Acıbadem Sigorta", slug: "bupa-acibadem", isActive: true, lifecycleStatus: "ACTIVE", isPubliclyListed: true },
      { id: "cmuk34jkz0002ypvsbky6097f", name: "Axa Sigorta", slug: "axa", isActive: true, lifecycleStatus: "ACTIVE", isPubliclyListed: true },
    ];

    const publicCatalog = enrichInsurerCatalogWithProductsAndNetworks(
      filterPublicCatalogInsurers(CATALOG_INSURERS)
    );
    assert.equal(publicCatalog.length, 3);
    assert.equal(publicCatalog.some((i) => i.slug === "alumas-demo-sigorta"), false, "Demo insurer must never appear in patient catalog");
    assert.equal(publicCatalog[0].supportedProductTypes.includes("TSS"), true);
    assert.equal(publicCatalog[0].supportedProductTypes.includes("OSS"), true);
    assert.equal(publicCatalog[0].networks.length > 0, true);

    // =========================================================================
    // 1. Adding a preference (insurer + productType + network + SGK)
    // =========================================================================
    const pref1 = validatePatientInsurancePreferenceInput({
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productType: "TSS",
      networkId: "allianz-mavi-ag",
      includePublicSgk: true,
      isPrimary: true,
      policyLabel: "Kurumsal TSS",
    });
    assert.equal(pref1.insuranceProviderId, "cmuk34i050000ypvshyuhm1yf");
    assert.equal(pref1.productType, "TSS");
    assert.equal(pref1.networkId, "allianz-mavi-ag");
    assert.equal(pref1.isPrimary, true);
    assert.equal(pref1.includePublicSgk, true);

    // =========================================================================
    // 2. Adding multiple preferences & 3. Switching active discovery preference
    // =========================================================================
    const pref2 = validatePatientInsurancePreferenceInput({
      insuranceProviderId: "cmuk34ipp0001ypvsu9jj91b3",
      productType: "OSS",
      networkId: "bupa-a-plus-ag",
      includePublicSgk: false,
      isPrimary: false,
      policyLabel: "Bireysel ÖSS",
    });
    let userPrefs = [
      { id: "p-1", userId: "u-1", ...pref1 },
      { id: "p-2", userId: "u-1", ...pref2 },
    ];
    assert.equal(userPrefs.length, 2);
    assert.equal(userPrefs.find((p) => p.isPrimary)?.id, "p-1");

    // Switch active discovery preference to p-2
    userPrefs = userPrefs.map((p) => ({
      ...p,
      isPrimary: p.id === "p-2",
      isActiveDiscovery: p.id === "p-2",
    }));
    assert.equal(userPrefs.find((p) => p.isPrimary)?.id, "p-2");
    assert.equal(userPrefs.filter((p) => p.isPrimary).length, 1);

    // =========================================================================
    // 4. Updating and removing preferences
    // =========================================================================
    const updatedPref2 = validatePatientInsurancePreferenceInput({
      insuranceProviderId: "cmuk34ipp0001ypvsu9jj91b3",
      productType: "TSS",
      networkId: null, // User does not know network
      includePublicSgk: true,
      isPrimary: true,
      policyLabel: "Güncel TSS",
    });
    assert.equal(updatedPref2.productType, "TSS");
    assert.equal(updatedPref2.networkId, null);
    assert.equal(updatedPref2.policyLabel, "Güncel TSS");

    userPrefs = userPrefs.filter((p) => p.id !== "p-1");
    assert.equal(userPrefs.length, 1);

    // =========================================================================
    // 5. Rejecting unauthorized access to another user's preferences
    // =========================================================================
    assertPreferenceOwnership({ id: "u-1", role: "PATIENT" }, { userId: "u-1" });
    assert.throws(
      () => assertPreferenceOwnership({ id: "u-2", role: "PATIENT" }, { userId: "u-1" }),
      (err) => err instanceof InsuranceDomainError && err.code === "PREFERENCE_OWNERSHIP_VIOLATION" && err.status === 403
    );

    // =========================================================================
    // 6. Rejecting forbidden PII fields (TCKN, policyNumber, cardNumber, etc.)
    // =========================================================================
    for (const forbiddenPayload of [
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", tcKimlikNo: "12345678901" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyNumber: "99887766" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyDocument: "https://evil.example/doc.pdf" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyLabel: "Poliçe 123456789" },
    ]) {
      assert.throws(
        () => validatePatientInsurancePreferenceInput(forbiddenPayload),
        (err) =>
          err instanceof InsuranceDomainError &&
          (err.code === "PII_COLLECTION_FORBIDDEN" || err.code === "PII_IN_LABEL_FORBIDDEN")
      );
    }

    // =========================================================================
    // 7–13. Discovery Ranking, Strict Filter, Unverified/Expired/Google Isolation,
    //       and Insurance Company Exclusion from Physical Facility Discovery
    // =========================================================================
    const sampleOrganizations = [
      {
        id: "org-confirmed-hosp",
        slug: "confirmed-hospital",
        name: "Onaylı Anlaşmalı Hastane",
        type: "HOSPITAL",
        city: "İstanbul",
        address: "Şişli",
        phone: "02120000001",
        latitude: 41.06,
        longitude: 28.99,
        status: "APPROVED",
        isPublished: true,
        verifiedAt: now,
        verificationDocuments: [
          { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: "2028-01-01T00:00:00.000Z" },
          { documentType: "TRADE_REGISTRY", status: "APPROVED" },
          { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
        ],
      },
      {
        id: "org-declared-clinic",
        slug: "declared-clinic",
        name: "Beyan Edilen Klinik",
        type: "CLINIC",
        city: "İstanbul",
        address: "Beşiktaş",
        phone: "02120000002",
        latitude: 41.04,
        longitude: 29.0,
        status: "APPROVED",
        isPublished: true,
        verifiedAt: now,
        verificationDocuments: [
          { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: "2028-01-01T00:00:00.000Z" },
          { documentType: "TRADE_REGISTRY", status: "APPROVED" },
          { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
        ],
      },
      {
        id: "org-expired-hosp",
        slug: "expired-hospital",
        name: "Süresi Dolmuş Anlaşmalı Hastane",
        type: "HOSPITAL",
        city: "İstanbul",
        address: "Kadıköy",
        phone: "02160000003",
        latitude: 40.99,
        longitude: 29.03,
        status: "APPROVED",
        isPublished: true,
        verifiedAt: now,
        verificationDocuments: [
          { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: "2028-01-01T00:00:00.000Z" },
          { documentType: "TRADE_REGISTRY", status: "APPROVED" },
          { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
        ],
      },
      {
        id: "org-insurer-company",
        slug: "allianz-sigorta-kurumu",
        name: "Allianz Sigorta A.Ş.",
        type: "INSURANCE_COMPANY",
        city: "İstanbul",
        address: "Ataşehir",
        phone: "08503999999",
        latitude: 40.99,
        longitude: 29.12,
        status: "APPROVED",
        isPublished: true,
        verifiedAt: now,
        verificationDocuments: [
          { documentType: "SEDDK_LICENSE", status: "APPROVED" },
          { documentType: "TRADE_REGISTRY", status: "APPROVED" },
          { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
          { documentType: "AUTHORIZATION_LETTER", status: "APPROVED", expiresAt: "2028-01-01T00:00:00.000Z" },
        ],
      },
    ];

    const sampleDirectoryRecords = [
      {
        id: "dir-unknown-hosp",
        slug: "unknown-directory-hospital",
        name: "Anlaşma Verisi Olmayan Dizin Hastanesi",
        type: "HOSPITAL",
        city: "İstanbul",
        district: "Üsküdar",
        address: "Üsküdar",
        phone: "02160000004",
        officialWebsite: "https://example.org",
        description: "Hastane",
        latitude: 41.02,
        longitude: 29.01,
        isOnDuty: false,
        onDutyUntil: null,
        source: "CURATED_PUBLIC_DIRECTORY",
        externalRef: "TR-IST-UNKNOWN-1",
        lastVerifiedAt: now,
        isActive: true,
        organizationId: null,
      },
    ];

    const sampleAgreements = [
      {
        id: "ag-confirmed-1",
        organizationId: "org-confirmed-hosp",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productType: "TSS",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "MUTUALLY_CONFIRMED",
        source: "INSURER_DECLARATION",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-12-31T00:00:00.000Z",
        isActive: true,
      },
      {
        id: "ag-declared-1",
        organizationId: "org-declared-clinic",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productType: "TSS",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "PROVIDER_DECLARED",
        source: "PROVIDER_DECLARATION",
        isActive: true,
      },
      {
        id: "ag-expired-1",
        organizationId: "org-expired-hosp",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productType: "TSS",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "ADMIN_VERIFIED",
        source: "ADMIN_CURATED",
        effectiveFrom: "2024-01-01T00:00:00.000Z",
        expiresAt: "2025-12-31T00:00:00.000Z",
        isActive: true,
      },
    ];

    // 7 & 8 & 13: Prioritize confirmed in-network while keeping non-matched providers visible,
    // and never mixing INSURANCE_COMPANY into physical healthcare discovery!
    const prioritizedList = buildNormalizedDirectoryItems(
      sampleDirectoryRecords,
      sampleOrganizations,
      {
        now,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productType: "TSS",
        prioritizeInNetwork: true,
        strictConfirmedOnly: false,
        agreements: sampleAgreements,
        insurers: [{ id: "cmuk34i050000ypvshyuhm1yf", slug: "allianz", name: "Allianz Sigorta" }],
      }
    );

    // INSURANCE_COMPANY must NOT appear in physical facility discovery
    assert.equal(
      prioritizedList.some((item) => item.type === "INSURANCE_COMPANY"),
      false,
      "INSURANCE_COMPANY must never be mixed into physical healthcare facility discovery"
    );
    assert.equal(prioritizedList.length, 4, "All 4 healthcare facilities remain visible when strictConfirmedOnly is false");

    // First item must be CONFIRMED_MATCH, second DECLARED_OR_UNVERIFIED
    assert.equal(prioritizedList[0].id, "org-confirmed-hosp");
    assert.equal(prioritizedList[0].insuranceMatch?.eligibilityState, "CONFIRMED_MATCH");
    assert.equal(prioritizedList[1].id, "org-declared-clinic");
    assert.equal(prioritizedList[1].insuranceMatch?.eligibilityState, "DECLARED_OR_UNVERIFIED");
    assert.equal(prioritizedList[1].insuranceMatch?.confirmed, false, "Unverified declaration must never be marked confirmed");

    // Expired agreement must be CONFIRMED_NON_MATCH and ranked last
    const expiredItem = prioritizedList.find((i) => i.id === "org-expired-hosp");
    assert.equal(expiredItem?.insuranceMatch?.eligibilityState, "CONFIRMED_NON_MATCH");
    assert.equal(expiredItem?.insuranceMatch?.confirmed, false);

    // Unknown directory facility must be UNKNOWN
    const unknownItem = prioritizedList.find((i) => i.id === "dir-unknown-hosp");
    assert.equal(unknownItem?.insuranceMatch?.eligibilityState, "UNKNOWN");

    // 9. Strict confirmed-match filter returns only CONFIRMED_MATCH facilities
    const strictList = buildNormalizedDirectoryItems(
      sampleDirectoryRecords,
      sampleOrganizations,
      {
        now,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productType: "TSS",
        prioritizeInNetwork: true,
        strictConfirmedOnly: true,
        agreements: sampleAgreements,
        insurers: [{ id: "cmuk34i050000ypvshyuhm1yf", slug: "allianz", name: "Allianz Sigorta" }],
      }
    );
    assert.equal(strictList.length, 1);
    assert.equal(strictList[0].id, "org-confirmed-hosp");
    assert.equal(strictList[0].insuranceMatch?.eligibilityState, "CONFIRMED_MATCH");

    // 12. External Google Places results remain UNKNOWN and are never labeled as insurance-compatible
    const nearbyMixed = filterAndRankByInsuranceDiscovery(
      [
        {
          id: "google-place-1",
          name: "Google Harici Klinik",
          distanceKm: 0.5,
          isVerified: false,
          insuranceMatch: {
            matched: false,
            confirmed: false,
            eligibilityState: "UNKNOWN",
          },
        },
        {
          id: "alumas-confirmed-1",
          name: "ALUMAS Onaylı Hastane",
          distanceKm: 2.1,
          isVerified: true,
          insuranceMatch: {
            matched: true,
            confirmed: true,
            eligibilityState: "CONFIRMED_MATCH",
          },
        },
      ],
      { prioritizeInNetwork: true, strictConfirmedOnly: false, hasGeo: true }
    );
    assert.equal(nearbyMixed[0].id, "alumas-confirmed-1");
    assert.equal(nearbyMixed[1].id, "google-place-1");
    assert.equal(nearbyMixed[1].insuranceMatch?.eligibilityState, "UNKNOWN");

    // AI Match Engine 5-state scoring check
    const aiConfirmedScore = scoreContextualDoctorMatch({
      specialtyMatch: 1,
      distanceKm: 3,
      hasAvailabilityToday: true,
      verificationScore: 1,
      organizationPublished: true,
      organizationOpenNow: true,
      insuranceMatch: true,
      insuranceEligibilityState: "CONFIRMED_MATCH",
    });
    const aiDeclaredScore = scoreContextualDoctorMatch({
      specialtyMatch: 1,
      distanceKm: 3,
      hasAvailabilityToday: true,
      verificationScore: 1,
      organizationPublished: true,
      organizationOpenNow: true,
      insuranceMatch: false,
      insuranceEligibilityState: "DECLARED_OR_UNVERIFIED",
    });
    assert.ok(
      aiConfirmedScore.total > aiDeclaredScore.total,
      "Confirmed agreement must score higher than unverified declaration in AI matching"
    );
  `;

  execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", inlineScript],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    }
  );
});

