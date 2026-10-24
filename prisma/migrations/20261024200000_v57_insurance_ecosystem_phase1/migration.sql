-- v57: ALUMAS Insurance Ecosystem Integration — Phase 1 Foundation
-- Additive, non-destructive migration preserving all existing InsuranceProvider,
-- OrganizationInsurance, UserInsurancePreference, Organization, and DirectoryInstitution records.

-- 1. Extend existing enums safely
ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'INSURANCE_COMPANY';
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'SEDDK_LICENSE';
ALTER TYPE "VerificationDocumentType" ADD VALUE IF NOT EXISTS 'AUTHORIZATION_LETTER';

-- 2. Create Phase 1 Insurance Domain Enums
CREATE TYPE "InsurancePayerKind" AS ENUM ('COMMERCIAL_INSURER', 'PUBLIC_PAYER');
CREATE TYPE "InsuranceProviderLifecycleStatus" AS ENUM ('ACTIVE', 'DEMO_INTERNAL', 'INACTIVE');
CREATE TYPE "InsuranceProductType" AS ENUM (
  'TSS',
  'OSS',
  'TRAVEL',
  'FOREIGN_HEALTH',
  'CRITICAL_ILLNESS',
  'CORPORATE_HEALTH',
  'PUBLIC_SGK'
);
CREATE TYPE "CatalogLifecycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'RETIRED');
CREATE TYPE "AgreementVerificationStatus" AS ENUM (
  'UNVERIFIED',
  'PROVIDER_DECLARED',
  'INSURER_DECLARED',
  'MUTUALLY_CONFIRMED',
  'ADMIN_VERIFIED',
  'DISPUTED',
  'EXPIRED'
);
CREATE TYPE "AgreementSource" AS ENUM (
  'LEGACY_MIGRATED',
  'PROVIDER_DECLARATION',
  'INSURER_DECLARATION',
  'ADMIN_CURATED',
  'OFFICIAL_PUBLIC_SOURCE'
);
CREATE TYPE "AgreementCoverageScope" AS ENUM (
  'ALL_BRANCHES',
  'SELECTED_SPECIALTIES',
  'INPATIENT_ONLY',
  'OUTPATIENT_ONLY',
  'EMERGENCY_ONLY'
);
CREATE TYPE "SpecialtyRuleKind" AS ENUM ('INCLUDED', 'EXCLUDED');

-- 3. Extend canonical InsuranceProvider table (preserving all 8 existing records)
ALTER TABLE "InsuranceProvider"
  ADD COLUMN "payerKind" "InsurancePayerKind" NOT NULL DEFAULT 'COMMERCIAL_INSURER',
  ADD COLUMN "lifecycleStatus" "InsuranceProviderLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "canonicalCode" TEXT,
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "seddkLicenseRef" TEXT,
  ADD COLUMN "tsbMemberCode" TEXT,
  ADD COLUMN "claimsPhone" TEXT,
  ADD COLUMN "provisionPortalUrl" TEXT,
  ADD COLUMN "headquartersCity" TEXT,
  ADD COLUMN "headquartersDistrict" TEXT,
  ADD COLUMN "headquartersAddress" TEXT,
  ADD COLUMN "isPubliclyListed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isClaimable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ALUMAS_CATALOG',
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "directoryInstitutionId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Isolate the existing internal demo insurer so it is preserved for referential integrity
-- but never published as a genuine verified company or opened for external claiming.
UPDATE "InsuranceProvider"
SET
  "lifecycleStatus" = 'DEMO_INTERNAL',
  "isPubliclyListed" = false,
  "isClaimable" = false,
  "source" = 'INTERNAL_DEMO'
WHERE "slug" = 'alumas-demo-sigorta';

CREATE UNIQUE INDEX "InsuranceProvider_canonicalCode_key" ON "InsuranceProvider"("canonicalCode");
CREATE UNIQUE INDEX "InsuranceProvider_organizationId_key" ON "InsuranceProvider"("organizationId");
CREATE UNIQUE INDEX "InsuranceProvider_directoryInstitutionId_key" ON "InsuranceProvider"("directoryInstitutionId");
CREATE INDEX "InsuranceProvider_payerKind_isActive_isPubliclyListed_idx"
  ON "InsuranceProvider"("payerKind", "isActive", "isPubliclyListed");
CREATE INDEX "InsuranceProvider_lifecycleStatus_isActive_idx"
  ON "InsuranceProvider"("lifecycleStatus", "isActive");

ALTER TABLE "InsuranceProvider"
  ADD CONSTRAINT "InsuranceProvider_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InsuranceProvider"
  ADD CONSTRAINT "InsuranceProvider_directoryInstitutionId_fkey"
  FOREIGN KEY ("directoryInstitutionId") REFERENCES "DirectoryInstitution"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce that public payers (e.g. SGK) and internal demo records cannot be claimed as private companies
ALTER TABLE "InsuranceProvider"
  ADD CONSTRAINT "InsuranceProvider_public_payer_unclaimable_check"
  CHECK (
    "payerKind" <> 'PUBLIC_PAYER'
    OR ("isClaimable" = false AND "organizationId" IS NULL AND "directoryInstitutionId" IS NULL)
  );

ALTER TABLE "InsuranceProvider"
  ADD CONSTRAINT "InsuranceProvider_demo_internal_isolation_check"
  CHECK (
    "lifecycleStatus" <> 'DEMO_INTERNAL'
    OR ("isClaimable" = false AND "isPubliclyListed" = false)
  );

-- 4. Create InsuranceProduct table
CREATE TABLE "InsuranceProduct" (
  "id" TEXT NOT NULL,
  "insuranceProviderId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "productType" "InsuranceProductType" NOT NULL,
  "description" TEXT,
  "requiresPublicSgk" BOOLEAN NOT NULL DEFAULT false,
  "status" "CatalogLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InsuranceProduct_valid_date_range_check" CHECK (
    "effectiveUntil" IS NULL OR "effectiveFrom" IS NULL OR "effectiveUntil" >= "effectiveFrom"
  )
);

CREATE UNIQUE INDEX "InsuranceProduct_insuranceProviderId_code_key"
  ON "InsuranceProduct"("insuranceProviderId", "code");
CREATE UNIQUE INDEX "InsuranceProduct_insuranceProviderId_slug_key"
  ON "InsuranceProduct"("insuranceProviderId", "slug");
CREATE INDEX "InsuranceProduct_insuranceProviderId_productType_isActive_idx"
  ON "InsuranceProduct"("insuranceProviderId", "productType", "isActive");

ALTER TABLE "InsuranceProduct"
  ADD CONSTRAINT "InsuranceProduct_insuranceProviderId_fkey"
  FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Create InsuranceNetwork table (insurer-specific networks, not global enums)
CREATE TABLE "InsuranceNetwork" (
  "id" TEXT NOT NULL,
  "insuranceProviderId" TEXT NOT NULL,
  "productId" TEXT,
  "code" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tierLabel" TEXT,
  "tierRank" INTEGER NOT NULL DEFAULT 1,
  "description" TEXT,
  "status" "CatalogLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceNetwork_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InsuranceNetwork_valid_date_range_check" CHECK (
    "effectiveUntil" IS NULL OR "effectiveFrom" IS NULL OR "effectiveUntil" >= "effectiveFrom"
  )
);

CREATE UNIQUE INDEX "InsuranceNetwork_insuranceProviderId_code_key"
  ON "InsuranceNetwork"("insuranceProviderId", "code");
CREATE UNIQUE INDEX "InsuranceNetwork_insuranceProviderId_slug_key"
  ON "InsuranceNetwork"("insuranceProviderId", "slug");
CREATE INDEX "InsuranceNetwork_insuranceProviderId_isActive_idx"
  ON "InsuranceNetwork"("insuranceProviderId", "isActive");
CREATE INDEX "InsuranceNetwork_productId_isActive_idx"
  ON "InsuranceNetwork"("productId", "isActive");

ALTER TABLE "InsuranceNetwork"
  ADD CONSTRAINT "InsuranceNetwork_insuranceProviderId_fkey"
  FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InsuranceNetwork"
  ADD CONSTRAINT "InsuranceNetwork_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Create normalized InsuranceProviderAgreement table
-- Supports multiple product/network agreements per facility AND external DirectoryInstitution records
CREATE TABLE "InsuranceProviderAgreement" (
  "id" TEXT NOT NULL,
  "organizationInsuranceId" TEXT,
  "organizationId" TEXT,
  "directoryInstitutionId" TEXT,
  "insuranceProviderId" TEXT NOT NULL,
  "productId" TEXT,
  "networkId" TEXT,
  "coverageScope" "AgreementCoverageScope" NOT NULL DEFAULT 'ALL_BRANCHES',
  "verificationStatus" "AgreementVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "source" "AgreementSource" NOT NULL DEFAULT 'PROVIDER_DECLARATION',
  "effectiveFrom" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "declaredByUserId" TEXT,
  "disputeReason" TEXT,
  "note" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceProviderAgreement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InsuranceProviderAgreement_facility_target_check" CHECK (
    "organizationId" IS NOT NULL OR "directoryInstitutionId" IS NOT NULL
  ),
  CONSTRAINT "InsuranceProviderAgreement_valid_date_range_check" CHECK (
    "expiresAt" IS NULL OR "effectiveFrom" IS NULL OR "expiresAt" >= "effectiveFrom"
  )
);

-- Prevent duplicate agreements for the same (facility, insurer, product, network)
-- across both registered Organizations and external DirectoryInstitutions
CREATE UNIQUE INDEX "InsuranceProviderAgreement_org_insurer_prod_net_key"
  ON "InsuranceProviderAgreement" (
    "organizationId",
    "insuranceProviderId",
    COALESCE("productId", '__ANY_PRODUCT__'),
    COALESCE("networkId", '__ANY_NETWORK__')
  )
  WHERE "organizationId" IS NOT NULL;

CREATE UNIQUE INDEX "InsuranceProviderAgreement_dir_insurer_prod_net_key"
  ON "InsuranceProviderAgreement" (
    "directoryInstitutionId",
    "insuranceProviderId",
    COALESCE("productId", '__ANY_PRODUCT__'),
    COALESCE("networkId", '__ANY_NETWORK__')
  )
  WHERE "directoryInstitutionId" IS NOT NULL;

CREATE INDEX "InsuranceProviderAgreement_organizationId_insuranceProvider_idx"
  ON "InsuranceProviderAgreement"("organizationId", "insuranceProviderId", "isActive");
CREATE INDEX "InsuranceProviderAgreement_directoryInstitutionId_insurance_idx"
  ON "InsuranceProviderAgreement"("directoryInstitutionId", "insuranceProviderId", "isActive");
CREATE INDEX "InsuranceProviderAgreement_insuranceProviderId_verification_idx"
  ON "InsuranceProviderAgreement"("insuranceProviderId", "verificationStatus", "isActive");
CREATE INDEX "InsuranceProviderAgreement_productId_networkId_isActive_idx"
  ON "InsuranceProviderAgreement"("productId", "networkId", "isActive");
CREATE INDEX "InsuranceProviderAgreement_expiresAt_isActive_idx"
  ON "InsuranceProviderAgreement"("expiresAt", "isActive");

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_organizationInsuranceId_fkey"
  FOREIGN KEY ("organizationInsuranceId") REFERENCES "OrganizationInsurance"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_directoryInstitutionId_fkey"
  FOREIGN KEY ("directoryInstitutionId") REFERENCES "DirectoryInstitution"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_insuranceProviderId_fkey"
  FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InsuranceProviderAgreement"
  ADD CONSTRAINT "InsuranceProviderAgreement_networkId_fkey"
  FOREIGN KEY ("networkId") REFERENCES "InsuranceNetwork"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Create normalized InsuranceAgreementSpecialtyRule table
CREATE TABLE "InsuranceAgreementSpecialtyRule" (
  "id" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL,
  "specialtyCode" TEXT NOT NULL,
  "serviceCode" TEXT,
  "ruleKind" "SpecialtyRuleKind" NOT NULL DEFAULT 'INCLUDED',
  "copayPercent" DOUBLE PRECISION,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsuranceAgreementSpecialtyRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InsuranceAgreementSpecialtyRule_copay_range_check" CHECK (
    "copayPercent" IS NULL OR ("copayPercent" >= 0 AND "copayPercent" <= 100)
  )
);

CREATE UNIQUE INDEX "InsuranceAgreementSpecialtyRule_agreementId_specialtyCode_r_key"
  ON "InsuranceAgreementSpecialtyRule"("agreementId", "specialtyCode", "ruleKind");
CREATE INDEX "InsuranceAgreementSpecialtyRule_agreementId_ruleKind_idx"
  ON "InsuranceAgreementSpecialtyRule"("agreementId", "ruleKind");
CREATE INDEX "InsuranceAgreementSpecialtyRule_specialtyCode_ruleKind_idx"
  ON "InsuranceAgreementSpecialtyRule"("specialtyCode", "ruleKind");

ALTER TABLE "InsuranceAgreementSpecialtyRule"
  ADD CONSTRAINT "InsuranceAgreementSpecialtyRule_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "InsuranceProviderAgreement"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Extend UserInsurancePreference for product/network/multi-preference foundation
ALTER TABLE "UserInsurancePreference"
  ADD COLUMN "productType" "InsuranceProductType",
  ADD COLUMN "productId" TEXT,
  ADD COLUMN "networkId" TEXT,
  ADD COLUMN "isActiveDiscovery" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "includePublicSgk" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "UserInsurancePreference_userId_insuranceProviderId_key";

CREATE INDEX "UserInsurancePreference_userId_insuranceProviderId_idx"
  ON "UserInsurancePreference"("userId", "insuranceProviderId");
CREATE INDEX "UserInsurancePreference_userId_isActiveDiscovery_isActive_idx"
  ON "UserInsurancePreference"("userId", "isActiveDiscovery", "isActive");

CREATE UNIQUE INDEX "UserInsurancePreference_user_insurer_prod_net_key"
  ON "UserInsurancePreference" (
    "userId",
    "insuranceProviderId",
    "productType",
    "productId",
    "networkId"
  ) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX "UserInsurancePreference_userId_single_primary_key"
  ON "UserInsurancePreference"("userId")
  WHERE "isPrimary" = true AND "isActive" = true;

ALTER TABLE "UserInsurancePreference"
  ADD CONSTRAINT "UserInsurancePreference_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserInsurancePreference"
  ADD CONSTRAINT "UserInsurancePreference_networkId_fkey"
  FOREIGN KEY ("networkId") REFERENCES "InsuranceNetwork"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
