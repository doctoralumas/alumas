import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();

test("ALUMAS Insurance Ecosystem Phase 3 — Insurer Registration, Workspace, Two-Party Agreements & Admin v2 Contracts", () => {
  const inlineScript = `
    import assert from "node:assert/strict";
    import {
      InsuranceDomainError,
      canClaimInsurer,
      evaluateInsurerVerification,
      canPerformInsurerOperations,
      resolveInitialAgreementVerificationStatus,
      transitionAgreementVerificationStatus,
      evaluateFacilityInsuranceCoverage,
    } from "./lib/insurance-domain.ts";
    import { requiredDocuments } from "./lib/verification-requirements.ts";

    // 1. Mandatory documents for INSURANCE_COMPANY
    const rules = requiredDocuments("organization", "INSURANCE_COMPANY", "tr");
    assert.ok(Array.isArray(rules), "INSURANCE_COMPANY must have document rules");
    const requiredTypes = rules.filter((r) => r.required).map((r) => r.type).sort();
    assert.deepEqual(
      requiredTypes,
      ["AUTHORIZATION_LETTER", "SEDDK_LICENSE", "TAX_CERTIFICATE", "TRADE_REGISTRY"],
      "All 4 mandatory insurer documents must be required"
    );

    // 2. Demo & SGK blocking
    const demoClaim = canClaimInsurer({
      id: "ins-demo",
      name: "Alumas Demo Sigorta",
      slug: "alumas-demo-sigorta",
      payerKind: "COMMERCIAL_INSURER",
      lifecycleStatus: "DEMO_INTERNAL",
      isPubliclyListed: false,
      isClaimable: false,
      isActive: false,
      organizationId: null,
    });
    assert.equal(demoClaim.allowed, false);
    assert.equal(demoClaim.code, "INSURER_INACTIVE");

    const sgkClaim = canClaimInsurer({
      id: "ins-sgk",
      name: "SGK",
      slug: "sgk",
      payerKind: "PUBLIC_PAYER",
      lifecycleStatus: "ACTIVE",
      isPubliclyListed: true,
      isClaimable: false,
      isActive: true,
      organizationId: null,
    });
    assert.equal(sgkClaim.allowed, false);
    assert.equal(sgkClaim.code, "PUBLIC_PAYER_NOT_CLAIMABLE");

    // 3. Duplicate claim prevention
    const alreadyClaimed = canClaimInsurer({
      id: "ins-allianz",
      name: "Allianz Sigorta",
      slug: "allianz",
      payerKind: "COMMERCIAL_INSURER",
      lifecycleStatus: "ACTIVE",
      isPubliclyListed: true,
      isClaimable: true,
      isActive: true,
      organizationId: "org_allianz_verified",
    });
    assert.equal(alreadyClaimed.allowed, false);
    assert.equal(alreadyClaimed.code, "INSURER_ALREADY_CLAIMED");

    // 4. Valid private insurer claim
    const validClaim = canClaimInsurer({
      id: "ins-allianz",
      name: "Allianz Sigorta",
      slug: "allianz",
      payerKind: "COMMERCIAL_INSURER",
      lifecycleStatus: "ACTIVE",
      isPubliclyListed: true,
      isClaimable: true,
      isActive: true,
      organizationId: null,
    });
    assert.equal(validClaim.allowed, true);

    // 5. Unverified/pending/suspended insurers cannot perform workspace operations
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const fullApprovedDocs = [
      { documentType: "SEDDK_LICENSE", status: "APPROVED", expiresAt: futureDate },
      { documentType: "TRADE_REGISTRY", status: "APPROVED", expiresAt: null },
      { documentType: "TAX_CERTIFICATE", status: "APPROVED", expiresAt: null },
      { documentType: "AUTHORIZATION_LETTER", status: "APPROVED", expiresAt: futureDate },
    ];

    assert.equal(
      canPerformInsurerOperations({
        organizationStatus: "PENDING",
        documents: fullApprovedDocs,
      }),
      false
    );
    assert.equal(
      canPerformInsurerOperations({
        organizationStatus: "SUSPENDED",
        documents: fullApprovedDocs,
      }),
      false
    );
    assert.equal(
      canPerformInsurerOperations({
        organizationStatus: "APPROVED",
        documents: fullApprovedDocs,
      }),
      true
    );

    // 6. Two-party agreement lifecycle & anti-self-confirmation
    const providerDecl = resolveInitialAgreementVerificationStatus({
      actorRole: "PROVIDER",
      requestedStatus: "MUTUALLY_CONFIRMED",
    });
    assert.equal(providerDecl.verificationStatus, "PROVIDER_DECLARED");

    const insurerDecl = resolveInitialAgreementVerificationStatus({
      actorRole: "INSURER",
      requestedStatus: "MUTUALLY_CONFIRMED",
    });
    assert.equal(insurerDecl.verificationStatus, "INSURER_DECLARED");

    const baseAgreement = {
      id: "agr-1",
      organizationId: "org-hosp-1",
      insuranceProviderId: "ins-allianz",
      coverageScope: "ALL_BRANCHES",
      verificationStatus: "PROVIDER_DECLARED",
      source: "PROVIDER_DECLARATION",
      isActive: true,
    };

    // Healthcare provider CANNOT self-confirm its own PROVIDER_DECLARED agreement
    assert.throws(() => {
      transitionAgreementVerificationStatus({
        agreement: baseAgreement,
        actor: {
          userId: "user-hosp-owner",
          role: "INSTITUTION_STAFF",
          ownedOrganizationIds: ["org-hosp-1"],
          ownedInsurerProviderIds: [],
        },
        action: "CONFIRM",
      });
    }, (err) => err instanceof InsuranceDomainError && err.code === "SELF_CONFIRMATION_FORBIDDEN");

    // Verified insurer CAN confirm PROVIDER_DECLARED -> MUTUALLY_CONFIRMED
    const confirmedByInsurer = transitionAgreementVerificationStatus({
      agreement: baseAgreement,
      actor: {
        userId: "user-insurer-rep",
        role: "INSTITUTION_STAFF",
        ownedOrganizationIds: ["org-allianz"],
        ownedInsurerProviderIds: ["ins-allianz"],
      },
      action: "CONFIRM",
    });
    assert.equal(confirmedByInsurer.verificationStatus, "MUTUALLY_CONFIRMED");

    // Healthcare provider CAN confirm INSURER_DECLARED -> MUTUALLY_CONFIRMED
    const confirmedByProvider = transitionAgreementVerificationStatus({
      agreement: {
        ...baseAgreement,
        verificationStatus: "INSURER_DECLARED",
        source: "INSURER_DECLARATION",
      },
      actor: {
        userId: "user-hosp-owner",
        role: "INSTITUTION_STAFF",
        ownedOrganizationIds: ["org-hosp-1"],
        ownedInsurerProviderIds: [],
      },
      action: "CONFIRM",
    });
    assert.equal(confirmedByProvider.verificationStatus, "MUTUALLY_CONFIRMED");

    // Dispute transition -> DISPUTED
    const disputed = transitionAgreementVerificationStatus({
      agreement: baseAgreement,
      actor: {
        userId: "user-insurer-rep",
        role: "INSTITUTION_STAFF",
        ownedOrganizationIds: ["org-allianz"],
        ownedInsurerProviderIds: ["ins-allianz"],
      },
      action: "DISPUTE",
      reason: "Sözleşme yenilenmedi",
    });
    assert.equal(disputed.verificationStatus, "DISPUTED");
  `;

  execFileSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", inlineScript],
    {
      cwd: rootDir,
      stdio: "inherit",
    }
  );

  // Source code contracts
  const publicDirPage = fs.readFileSync(path.join(rootDir, "app/insurance/page.tsx"), "utf8");
  const publicSlugPage = fs.readFileSync(path.join(rootDir, "app/insurance/[slug]/page.tsx"), "utf8");
  const orgSlugPage = fs.readFileSync(path.join(rootDir, "app/organizations/[slug]/page.tsx"), "utf8");
  const insurerWorkspaceRoute = fs.readFileSync(
    path.join(rootDir, "app/api/organizations/[id]/insurer-workspace/route.ts"),
    "utf8"
  );
  const providerInsuranceRoute = fs.readFileSync(
    path.join(rootDir, "app/api/organizations/[id]/insurance/route.ts"),
    "utf8"
  );
  const adminEcoRoute = fs.readFileSync(
    path.join(rootDir, "app/api/admin/insurance-ecosystem/route.ts"),
    "utf8"
  );

  assert.match(publicDirPage, /\/insurance\/\$\{encodeURIComponent\(r\.slug\)\}/);
  assert.match(publicDirPage, /type=INSURANCE_COMPANY/);
  assert.match(publicSlugPage, /claimInsurerSlug=/);
  assert.match(orgSlugPage, /const isInsurerOrg = o\.type === "INSURANCE_COMPANY"/);
  assert.match(orgSlugPage, /!isInsurerOrg &&[\s\S]*?<OrganizationBooking/);
  assert.match(insurerWorkspaceRoute, /canPerformInsurerOperations/);
  assert.match(insurerWorkspaceRoute, /resolveInsurerOrganizationAndAccess/);
  assert.match(providerInsuranceRoute, /CANNOT_DELETE_INSURER_AGREEMENT/);
  assert.match(providerInsuranceRoute, /mutateAgreementStatusInStore/);
  assert.match(adminEcoRoute, /requireAdmin\(\)/);
  assert.match(adminEcoRoute, /createOrDeclareInsuranceAgreement/);
});
