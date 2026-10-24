import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

test("ALUMAS Insurance Ecosystem Phase 1 — Comprehensive Domain, Security, Migration & Regression Contracts (1–11)", () => {
  // Verify migration SQL exists and contains all required additive DDL & constraints
  const migrationPath =
    "prisma/migrations/20261024200000_v57_insurance_ecosystem_phase1/migration.sql";
  assert.equal(fs.existsSync(migrationPath), true, "Phase 1 migration SQL must exist");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  for (const requiredToken of [
    "ALTER TYPE \"OrganizationType\" ADD VALUE IF NOT EXISTS 'INSURANCE_COMPANY'",
    "ALTER TYPE \"VerificationDocumentType\" ADD VALUE IF NOT EXISTS 'SEDDK_LICENSE'",
    "ALTER TYPE \"VerificationDocumentType\" ADD VALUE IF NOT EXISTS 'AUTHORIZATION_LETTER'",
    "CREATE TYPE \"InsurancePayerKind\"",
    "CREATE TYPE \"InsuranceProductType\"",
    "CREATE TYPE \"AgreementVerificationStatus\"",
    "CREATE TABLE \"InsuranceProduct\"",
    "CREATE TABLE \"InsuranceNetwork\"",
    "CREATE TABLE \"InsuranceProviderAgreement\"",
    "CREATE TABLE \"InsuranceAgreementSpecialtyRule\"",
    "InsuranceProvider_public_payer_unclaimable_check",
    "InsuranceProvider_demo_internal_isolation_check",
    "InsuranceProviderAgreement_facility_target_check",
    "InsuranceProviderAgreement_org_insurer_prod_net_key",
    "InsuranceProviderAgreement_dir_insurer_prod_net_key",
    "UserInsurancePreference_user_insurer_prod_net_key",
    "UserInsurancePreference_userId_single_primary_key",
  ]) {
    assert.ok(
      migrationSql.includes(requiredToken),
      `Migration SQL missing required constraint/DDL token: ${requiredToken}`
    );
  }

  const inlineScript = `
    import assert from "node:assert/strict";
    import {
      requiredDocuments,
      missingRequiredDocuments,
    } from "./lib/verification-requirements.ts";
    import {
      organizationAllows,
      isHealthcareFacilityType,
      isInsuranceCompanyType,
    } from "./lib/organization-capabilities.ts";
    import {
      buildNormalizedDirectoryItems,
      isOrganizationVerifiedByAlumas,
    } from "./lib/institution-directory.ts";
    import {
      InsuranceDomainError,
      normalizeInsurerIdentityKey,
      isInsurerPubliclyDiscoverable,
      filterPublicCatalogInsurers,
      validateCanonicalInsurerEntry,
      canClaimInsurer,
      evaluateInsurerVerification,
      resolveAgreementFacilityTarget,
      resolveInitialAgreementVerificationStatus,
      transitionAgreementVerificationStatus,
      evaluateFacilityInsuranceCoverage,
      reconcileClaimedFacilityAgreements,
      validatePatientInsurancePreferenceInput,
      assertPreferenceOwnership,
    } from "./lib/insurance-domain.ts";

    const now = new Date("2026-10-24T19:00:00.000Z");

    // =========================================================================
    // 1. Existing insurance records remain unchanged & demo insurer isolated
    // =========================================================================
    const EXISTING_EIGHT_INSURERS = [
      { id: "cmtkaf9rp0089ypj4t4680pc9", name: "Alumas Demo Sigorta", slug: "alumas-demo-sigorta", isActive: true, lifecycleStatus: "DEMO_INTERNAL", isPubliclyListed: false, isClaimable: false },
      { id: "cmuk34i050000ypvshyuhm1yf", name: "Allianz Sigorta", slug: "allianz", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.allianz.com.tr" },
      { id: "cmuk34ipp0001ypvsu9jj91b3", name: "Bupa Acıbadem Sigorta", slug: "bupa-acibadem", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.bupaacibadem.com.tr" },
      { id: "cmuk34jkz0002ypvsbky6097f", name: "Axa Sigorta", slug: "axa", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.axasigorta.com.tr" },
      { id: "cmuk34k780003ypvsrlbs053k", name: "Anadolu Sigorta", slug: "anadolu", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.anadolusigorta.com.tr" },
      { id: "cmuk34ki90004ypvse9yfl46p", name: "Mapfre Sigorta", slug: "mapfre", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.mapfre.com.tr" },
      { id: "cmuk34kte0005ypvs6nvmnsal", name: "Sompo Sigorta", slug: "sompo", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.somposigorta.com.tr" },
      { id: "cmuk34l4l0006ypvsu6ckntzp", name: "Türkiye Sigorta", slug: "turkiye-sigorta", isActive: true, payerKind: "COMMERCIAL_INSURER", lifecycleStatus: "ACTIVE", isPubliclyListed: true, isClaimable: true, website: "https://www.turkiyesigorta.com.tr" },
    ];

    assert.equal(EXISTING_EIGHT_INSURERS.length, 8);
    const publicInsurers = filterPublicCatalogInsurers(EXISTING_EIGHT_INSURERS);
    assert.equal(publicInsurers.length, 7, "All 7 real insurers must be publicly discoverable while demo insurer is excluded from public catalog");
    assert.equal(publicInsurers.some((i) => i.slug === "alumas-demo-sigorta"), false, "Demo insurer must never be published as a genuine verified company");
    assert.equal(isInsurerPubliclyDiscoverable(EXISTING_EIGHT_INSURERS[0]), false);

    // =========================================================================
    // 2. No duplicate canonical insurer identities
    // =========================================================================
    assert.equal(normalizeInsurerIdentityKey("Allianz Sigorta A.Ş."), "allianz");
    assert.equal(normalizeInsurerIdentityKey("Allianz Sigorta"), "allianz");
    assert.throws(
      () =>
        validateCanonicalInsurerEntry(
          { name: "Allianz Sigorta A.Ş.", slug: "allianz-sigorta-as" },
          EXISTING_EIGHT_INSURERS
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "DUPLICATE_CANONICAL_INSURER"
    );

    assert.throws(
      () =>
        validateCanonicalInsurerEntry(
          { name: "Alumas Demo Sigorta", slug: "alumas-demo-sigorta", lifecycleStatus: "DEMO_INTERNAL", isPubliclyListed: true },
          []
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "DEMO_INSURER_PUBLICATION_FORBIDDEN"
    );

    assert.throws(
      () =>
        validateCanonicalInsurerEntry(
          { name: "Alumas Demo Sigorta", slug: "alumas-demo-sigorta", lifecycleStatus: "DEMO_INTERNAL", seddkLicenseRef: "SEDDK-FAKE-999" },
          []
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "DEMO_INSURER_FABRICATED_LICENSE"
    );

    // =========================================================================
    // 3. Correct commercial vs public payer behavior (SGK vs Commercial Insurers)
    // =========================================================================
    const sgkEntry = {
      id: "payer-sgk",
      name: "SGK (Sosyal Güvenlik Kurumu)",
      slug: "sgk",
      payerKind: "PUBLIC_PAYER",
      isActive: true,
      isPubliclyListed: true,
      isClaimable: false,
      organizationId: null,
      directoryInstitutionId: null,
    };
    validateCanonicalInsurerEntry(sgkEntry, EXISTING_EIGHT_INSURERS);
    assert.equal(canClaimInsurer(sgkEntry).allowed, false);
    assert.equal(canClaimInsurer(sgkEntry).code, "PUBLIC_PAYER_NOT_CLAIMABLE");

    // Attempting to make SGK claimable or linked to a private Organization must fail
    assert.throws(
      () =>
        validateCanonicalInsurerEntry(
          { ...sgkEntry, isClaimable: true },
          EXISTING_EIGHT_INSURERS
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "PUBLIC_PAYER_NOT_CLAIMABLE"
    );
    assert.throws(
      () =>
        validateCanonicalInsurerEntry(
          { ...sgkEntry, organizationId: "org-private-123" },
          EXISTING_EIGHT_INSURERS
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "PUBLIC_PAYER_NOT_CLAIMABLE"
    );

    // Commercial insurer verification: corporate email domain match & TSB code are supporting signals ONLY,
    // never automatic proof of authorization when SEDDK_LICENSE or AUTHORIZATION_LETTER is missing.
    const allianzInsurer = EXISTING_EIGHT_INSURERS[1];
    const partialDocsEval = evaluateInsurerVerification({
      insurer: allianzInsurer,
      applicantEmail: "kurumsal@allianz.com.tr",
      officialWebsite: "https://www.allianz.com.tr",
      tsbMemberCode: "TSB-001",
      documents: [
        { documentType: "TRADE_REGISTRY", status: "APPROVED" },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
      ],
    });
    assert.equal(partialDocsEval.supportingSignals.emailDomainSignal, "CORPORATE_MATCH");
    assert.equal(partialDocsEval.supportingSignals.tsbReferenceProvided, true);
    assert.equal(
      partialDocsEval.canApprove,
      false,
      "Corporate email domain similarity and TSB code must NEVER auto-approve without SEDDK_LICENSE and AUTHORIZATION_LETTER"
    );
    assert.deepEqual(
      partialDocsEval.missingDocuments.map((d) => d.type),
      ["SEDDK_LICENSE", "AUTHORIZATION_LETTER"]
    );

    // Full authoritative documents approved -> canApprove = true
    const fullDocsEval = evaluateInsurerVerification({
      insurer: allianzInsurer,
      applicantEmail: "kurumsal@allianz.com.tr",
      officialWebsite: "https://www.allianz.com.tr",
      tsbMemberCode: "TSB-001",
      documents: [
        { documentType: "SEDDK_LICENSE", status: "APPROVED" },
        { documentType: "TRADE_REGISTRY", status: "APPROVED" },
        { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
        { documentType: "AUTHORIZATION_LETTER", status: "APPROVED", expiresAt: "2027-12-31T00:00:00.000Z" },
      ],
    });
    assert.equal(fullDocsEval.canApprove, true);
    assert.equal(fullDocsEval.missingDocuments.length, 0);

    // =========================================================================
    // 4. Multiple product/network agreements for one provider & preservation of Lab Test <-> Allianz
    // =========================================================================
    const LEGACY_LAB_TEST_CONTRACT = {
      id: "cmuflegacy0001",
      organizationId: "cmudbbvw7000aypggo66s5p34",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", // Allianz Sigorta
      isActive: true,
      note: "Sadece Dahiliye Bölümü",
    };

    // Legacy contract must NOT be treated as confirmed coverage or verified coverage for all Allianz products
    const legacyGeneralEval = evaluateFacilityInsuranceCoverage({
      organizationId: "cmudbbvw7000aypggo66s5p34",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      agreements: [],
      legacyContracts: [LEGACY_LAB_TEST_CONTRACT],
      now,
    });
    assert.equal(legacyGeneralEval.matched, true);
    assert.equal(legacyGeneralEval.confirmed, false, "Existing Lab Test <-> Allianz contract must NOT be auto-marked as confirmed");
    assert.equal(legacyGeneralEval.matchTier, "UNVERIFIED_DECLARATION");
    assert.equal(legacyGeneralEval.note, "Sadece Dahiliye Bölümü");

    const legacySpecificProductEval = evaluateFacilityInsuranceCoverage({
      organizationId: "cmudbbvw7000aypggo66s5p34",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-oss",
      networkId: "net-allianz-beyaz",
      agreements: [],
      legacyContracts: [LEGACY_LAB_TEST_CONTRACT],
      now,
    });
    assert.equal(
      legacySpecificProductEval.confirmed,
      false,
      "Legacy contract must NOT be treated as verified coverage for specific Allianz products/networks"
    );
    assert.equal(legacySpecificProductEval.matched, false);

    // Multiple independent product/network agreements for one hospital + Allianz
    const multiAgreements = [
      {
        id: "ag-tss-mavi",
        organizationId: "org-hosp-1",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-tss",
        networkId: "net-allianz-mavi",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "MUTUALLY_CONFIRMED",
        source: "INSURER_DECLARATION",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        isActive: true,
        specialtyRules: [],
      },
      {
        id: "ag-oss-sari-restricted",
        organizationId: "org-hosp-1",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-oss",
        networkId: "net-allianz-sari",
        coverageScope: "SELECTED_SPECIALTIES",
        verificationStatus: "ADMIN_VERIFIED",
        source: "ADMIN_CURATED",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        expiresAt: "2027-01-01T00:00:00.000Z",
        isActive: true,
        note: "Sadece Dahiliye ve Kardiyoloji",
        specialtyRules: [
          { specialtyCode: "INTERNAL_MEDICINE", ruleKind: "INCLUDED" },
          { specialtyCode: "CARDIOLOGY", ruleKind: "INCLUDED" },
        ],
      },
      {
        id: "ag-oss-beyaz-declared",
        organizationId: "org-hosp-1",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-oss",
        networkId: "net-allianz-beyaz",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "PROVIDER_DECLARED",
        source: "PROVIDER_DECLARATION",
        isActive: true,
        specialtyRules: [],
      },
    ];

    const maviMatch = evaluateFacilityInsuranceCoverage({
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-tss",
      networkId: "net-allianz-mavi",
      specialtyCode: "ORTHOPEDICS",
      agreements: multiAgreements,
      now,
    });
    assert.equal(maviMatch.confirmed, true);
    assert.equal(maviMatch.matchTier, "CONFIRMED");

    const sariCardioMatch = evaluateFacilityInsuranceCoverage({
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-oss",
      networkId: "net-allianz-sari",
      specialtyCode: "CARDIOLOGY",
      agreements: multiAgreements,
      now,
    });
    assert.equal(sariCardioMatch.confirmed, true);
    assert.equal(sariCardioMatch.matchTier, "CONFIRMED");

    const sariOrthoMatch = evaluateFacilityInsuranceCoverage({
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-oss",
      networkId: "net-allianz-sari",
      specialtyCode: "ORTHOPEDICS",
      agreements: multiAgreements,
      now,
    });
    assert.equal(sariOrthoMatch.matched, false);
    assert.equal(sariOrthoMatch.confirmed, false);
    assert.equal(sariOrthoMatch.matchTier, "RESTRICTED_SCOPE");

    const beyazDeclaredMatch = evaluateFacilityInsuranceCoverage({
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-oss",
      networkId: "net-allianz-beyaz",
      agreements: multiAgreements,
      now,
    });
    assert.equal(beyazDeclaredMatch.matched, true);
    assert.equal(beyazDeclaredMatch.confirmed, false);
    assert.equal(beyazDeclaredMatch.matchTier, "UNVERIFIED_DECLARATION");

    // =========================================================================
    // 5. Agreement matching for external DirectoryInstitution branches
    // =========================================================================
    const externalTarget = resolveAgreementFacilityTarget(
      { directoryInstitutionId: "dir-acibadem-maslak" },
      {
        directoryInstitutions: [
          { id: "dir-acibadem-maslak", type: "HOSPITAL", organizationId: null, isActive: true },
        ],
      }
    );
    assert.equal(externalTarget.directoryInstitutionId, "dir-acibadem-maslak");
    assert.equal(externalTarget.organizationId, null);

    // Orphan agreement without facility target must be rejected
    assert.throws(
      () => resolveAgreementFacilityTarget({ organizationId: null, directoryInstitutionId: null }),
      (err) => err instanceof InsuranceDomainError && err.code === "MISSING_FACILITY_TARGET"
    );

    const externalBranchAgreements = [
      {
        id: "ag-ext-maslak-allianz",
        organizationId: null,
        directoryInstitutionId: "dir-acibadem-maslak",
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-tss",
        networkId: "net-allianz-mavi",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "ADMIN_VERIFIED",
        source: "OFFICIAL_PUBLIC_SOURCE",
        isActive: true,
      },
    ];
    const externalEval = evaluateFacilityInsuranceCoverage({
      directoryInstitutionId: "dir-acibadem-maslak",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-tss",
      agreements: externalBranchAgreements,
      now,
    });
    assert.equal(externalEval.matched, true);
    assert.equal(externalEval.confirmed, true);
    assert.equal(externalEval.matchTier, "CONFIRMED");

    // =========================================================================
    // 6. No duplicate public identities or duplicate agreements after institution claiming
    // =========================================================================
    const preClaimAgreements = [
      {
        id: "ag-dir-1",
        organizationId: null,
        directoryInstitutionId: "dir-medicana-kadikoy",
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-tss",
        networkId: "net-allianz-mavi",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "INSURER_DECLARED",
        source: "INSURER_DECLARATION",
        isActive: true,
        specialtyRules: [{ specialtyCode: "CARDIOLOGY", ruleKind: "INCLUDED" }],
      },
      {
        id: "ag-org-dup-1",
        organizationId: "org-medicana-kadikoy",
        directoryInstitutionId: null,
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-tss",
        networkId: "net-allianz-mavi",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "PROVIDER_DECLARED",
        source: "PROVIDER_DECLARATION",
        isActive: true,
        specialtyRules: [{ specialtyCode: "INTERNAL_MEDICINE", ruleKind: "INCLUDED" }],
      },
    ];

    const reconciled = reconcileClaimedFacilityAgreements({
      directoryInstitutionId: "dir-medicana-kadikoy",
      organizationId: "org-medicana-kadikoy",
      agreements: preClaimAgreements,
    });
    assert.equal(reconciled.reconciledAgreements.length, 1, "Duplicate agreements for same (facility, insurer, product, network) must be merged on claim");
    assert.equal(reconciled.removedDuplicateIds.length, 1);
    assert.equal(reconciled.reconciledAgreements[0].organizationId, "org-medicana-kadikoy");
    assert.equal(reconciled.reconciledAgreements[0].directoryInstitutionId, "dir-medicana-kadikoy");
    assert.equal(reconciled.reconciledAgreements[0].specialtyRules.length, 2);

    // Public directory deduplication check after claim approval
    const directoryItemsAfterClaim = buildNormalizedDirectoryItems(
      [
        {
          id: "dir-medicana-kadikoy",
          slug: "medicana-kadikoy-hastanesi",
          name: "Medicana Kadıköy Hastanesi",
          type: "HOSPITAL",
          city: "İstanbul",
          district: "Kadıköy",
          address: "Zühtüpaşa Mah.",
          phone: "+90 216 000 00 00",
          officialWebsite: "https://www.medicana.com.tr",
          description: "Hastane",
          latitude: 40.98,
          longitude: 29.04,
          isOnDuty: false,
          onDutyUntil: null,
          source: "CURATED_PUBLIC_DIRECTORY",
          externalRef: "TR-IST-MEDICANA-KADIKOY",
          lastVerifiedAt: now,
          isActive: true,
          organizationId: "org-medicana-kadikoy",
        },
      ],
      [
        {
          id: "org-medicana-kadikoy",
          slug: "medicana-kadikoy-hastanesi",
          name: "Medicana Kadıköy Hastanesi",
          type: "HOSPITAL",
          city: "İstanbul",
          district: "Kadıköy",
          address: "Zühtüpaşa Mah.",
          phone: "+90 216 000 00 00",
          status: "APPROVED",
          isPublished: true,
          verifiedAt: now,
          verificationDocuments: [
            { documentType: "FACILITY_LICENSE", status: "APPROVED", expiresAt: "2028-01-01T00:00:00.000Z" },
            { documentType: "TRADE_REGISTRY", status: "APPROVED" },
            { documentType: "TAX_CERTIFICATE", status: "APPROVED" },
          ],
        },
      ],
      { now }
    );
    assert.equal(directoryItemsAfterClaim.length, 1, "Claimed directory institution must never produce duplicate public identities");
    assert.equal(directoryItemsAfterClaim[0].isVerified, true);
    assert.equal(directoryItemsAfterClaim[0].organizationId, "org-medicana-kadikoy");
    assert.equal(directoryItemsAfterClaim[0].directoryId, "dir-medicana-kadikoy");

    // =========================================================================
    // 7. Unverified relationships never become confirmed automatically
    // =========================================================================
    const providerInitial = resolveInitialAgreementVerificationStatus({
      actorRole: "PROVIDER",
      requestedStatus: "MUTUALLY_CONFIRMED", // Attempted bypass
    });
    assert.equal(providerInitial.verificationStatus, "PROVIDER_DECLARED");

    const insurerInitial = resolveInitialAgreementVerificationStatus({
      actorRole: "INSURER",
      requestedStatus: "ADMIN_VERIFIED", // Attempted bypass
    });
    assert.equal(insurerInitial.verificationStatus, "INSURER_DECLARED");

    // Self-confirmation must be rejected
    const sampleProviderDeclared = {
      id: "ag-self-test",
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      coverageScope: "ALL_BRANCHES",
      verificationStatus: "PROVIDER_DECLARED",
      source: "PROVIDER_DECLARATION",
      isActive: true,
    };
    assert.throws(
      () =>
        transitionAgreementVerificationStatus({
          agreement: sampleProviderDeclared,
          actor: { userId: "user-hosp-owner", role: "PATIENT", ownedOrganizationIds: ["org-hosp-1"] },
          action: "CONFIRM",
          now,
        }),
      (err) => err instanceof InsuranceDomainError && err.code === "SELF_CONFIRMATION_FORBIDDEN"
    );

    // Counterparty (insurer) confirmation succeeds -> MUTUALLY_CONFIRMED
    const counterpartyConfirmed = transitionAgreementVerificationStatus({
      agreement: sampleProviderDeclared,
      actor: { userId: "user-allianz-rep", role: "PATIENT", ownedInsurerProviderIds: ["cmuk34i050000ypvshyuhm1yf"] },
      action: "CONFIRM",
      now,
    });
    assert.equal(counterpartyConfirmed.verificationStatus, "MUTUALLY_CONFIRMED");

    // =========================================================================
    // 8. Expired agreements do not count as confirmed
    // =========================================================================
    const expiredAgreements = [
      {
        id: "ag-expired-1",
        organizationId: "org-hosp-1",
        insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
        productId: "prod-allianz-tss",
        coverageScope: "ALL_BRANCHES",
        verificationStatus: "MUTUALLY_CONFIRMED",
        source: "INSURER_DECLARATION",
        effectiveFrom: "2024-01-01T00:00:00.000Z",
        expiresAt: "2025-12-31T23:59:59.000Z", // Past date relative to now (2026-10-24)
        isActive: true,
      },
    ];
    const expiredEval = evaluateFacilityInsuranceCoverage({
      organizationId: "org-hosp-1",
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productId: "prod-allianz-tss",
      agreements: expiredAgreements,
      now,
    });
    assert.equal(expiredEval.confirmed, false, "Expired agreement must never count as confirmed");
    assert.equal(expiredEval.matched, false, "Expired agreement must never count as an active match");
    assert.equal(expiredEval.matchTier, "EXPIRED");

    // =========================================================================
    // 9. Patient preference ownership isolation & KVKK data minimization
    // =========================================================================
    const validPref = validatePatientInsurancePreferenceInput({
      insuranceProviderId: "cmuk34i050000ypvshyuhm1yf",
      productType: "TSS",
      productId: "prod-allianz-tss",
      networkId: "net-allianz-mavi",
      isPrimary: true,
      includePublicSgk: true,
      policyLabel: "Kurumsal TSS",
    });
    assert.equal(validPref.productType, "TSS");
    assert.equal(validPref.policyLabel, "Kurumsal TSS");

    // Reject forbidden PII fields (TCKN, policyNumber, medicalRecord, etc.)
    for (const badPayload of [
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", tcKimlikNo: "12345678901" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyNumber: "POL-99887766" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", medicalRecord: "Diabetes" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyLabel: "TC 12345678901 Poliçe" },
      { insuranceProviderId: "cmuk34i050000ypvshyuhm1yf", policyLabel: "Poliçe No: 9988776655" },
    ]) {
      assert.throws(
        () => validatePatientInsurancePreferenceInput(badPayload),
        (err) =>
          err instanceof InsuranceDomainError &&
          (err.code === "PII_COLLECTION_FORBIDDEN" || err.code === "PII_IN_LABEL_FORBIDDEN")
      );
    }

    // Ownership isolation check
    const patientAPref = { id: "pref-1", userId: "patient-a" };
    assertPreferenceOwnership({ id: "patient-a", role: "PATIENT" }, patientAPref);
    assert.throws(
      () => assertPreferenceOwnership({ id: "patient-b", role: "PATIENT" }, patientAPref),
      (err) => err instanceof InsuranceDomainError && err.code === "PREFERENCE_OWNERSHIP_VIOLATION" && err.status === 403
    );
    assert.throws(
      () => assertPreferenceOwnership({ id: "doctor-1", role: "DOCTOR" }, patientAPref),
      (err) => err instanceof InsuranceDomainError && err.code === "PREFERENCE_OWNERSHIP_VIOLATION" && err.status === 403
    );

    // =========================================================================
    // 10. Unauthorized mutations are rejected
    // =========================================================================
    assert.throws(
      () => assertPreferenceOwnership(null, patientAPref),
      (err) => err instanceof InsuranceDomainError && err.code === "AUTH_REQUIRED" && err.status === 401
    );
    assert.throws(
      () =>
        transitionAgreementVerificationStatus({
          agreement: sampleProviderDeclared,
          actor: { userId: "random-user", role: "PATIENT", ownedOrganizationIds: [] },
          action: "CONFIRM",
          now,
        }),
      (err) => err instanceof InsuranceDomainError && err.code === "UNAUTHORIZED_AGREEMENT_MUTATION" && err.status === 403
    );
    assert.throws(
      () =>
        transitionAgreementVerificationStatus({
          agreement: sampleProviderDeclared,
          actor: { userId: "user-allianz-rep", role: "PATIENT", ownedInsurerProviderIds: ["cmuk34i050000ypvshyuhm1yf"] },
          action: "ADMIN_VERIFY",
          now,
        }),
      (err) => err instanceof InsuranceDomainError && err.code === "ADMIN_REQUIRED" && err.status === 403
    );

    // =========================================================================
    // 11. All existing healthcare facility behaviors continue to work & Insurers isolated
    // =========================================================================
    for (const facilityType of ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"]) {
      assert.equal(isHealthcareFacilityType(facilityType), true);
      assert.equal(isInsuranceCompanyType(facilityType), false);
      assert.equal(organizationAllows(facilityType, "providerInsuranceContracts"), true);
      const reqDocs = requiredDocuments("organization", facilityType);
      assert.equal(reqDocs.some((d) => d.type === "FACILITY_LICENSE"), true);
    }

    // INSURANCE_COMPANY must NOT inherit healthcare facility licenses or clinical capabilities
    assert.equal(isHealthcareFacilityType("INSURANCE_COMPANY"), false);
    assert.equal(isInsuranceCompanyType("INSURANCE_COMPANY"), true);
    const insurerDocs = requiredDocuments("organization", "INSURANCE_COMPANY");
    assert.equal(insurerDocs.some((d) => d.type === "FACILITY_LICENSE"), false, "Insurer must NOT require FACILITY_LICENSE");
    assert.deepEqual(
      insurerDocs.map((d) => d.type),
      ["SEDDK_LICENSE", "TRADE_REGISTRY", "TAX_CERTIFICATE", "AUTHORIZATION_LETTER"]
    );

    for (const forbiddenCap of [
      "services",
      "doctors",
      "departments",
      "emergency",
      "imaging",
      "laboratory",
      "stock",
      "appointments",
      "providerInsuranceContracts",
    ]) {
      assert.equal(
        organizationAllows("INSURANCE_COMPANY", forbiddenCap),
        false,
        "INSURANCE_COMPANY must not allow clinical capability: " + forbiddenCap
      );
    }
    assert.equal(organizationAllows("INSURANCE_COMPANY", "insurerCatalog"), true);

    // Insurer cannot be target of a healthcare facility agreement
    assert.throws(
      () =>
        resolveAgreementFacilityTarget(
          { organizationId: "org-insurer-allianz" },
          { organizations: [{ id: "org-insurer-allianz", type: "INSURANCE_COMPANY" }] }
        ),
      (err) => err instanceof InsuranceDomainError && err.code === "INVALID_FACILITY_TYPE"
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
