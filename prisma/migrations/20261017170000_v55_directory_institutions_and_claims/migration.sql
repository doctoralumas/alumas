-- v55: Separate public DirectoryInstitution listings and OrganizationClaim workflow
CREATE TYPE "OrganizationClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "DirectoryInstitution" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "address" TEXT NOT NULL,
  "phone" TEXT,
  "officialWebsite" TEXT,
  "description" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "isOnDuty" BOOLEAN NOT NULL DEFAULT false,
  "onDutyUntil" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'CURATED_PUBLIC_DIRECTORY',
  "externalRef" TEXT,
  "lastVerifiedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DirectoryInstitution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectoryInstitution_slug_key" ON "DirectoryInstitution"("slug");
CREATE UNIQUE INDEX "DirectoryInstitution_externalRef_key" ON "DirectoryInstitution"("externalRef");
CREATE UNIQUE INDEX "DirectoryInstitution_organizationId_key" ON "DirectoryInstitution"("organizationId");
CREATE INDEX "DirectoryInstitution_isActive_type_city_idx" ON "DirectoryInstitution"("isActive", "type", "city");
CREATE INDEX "DirectoryInstitution_name_idx" ON "DirectoryInstitution"("name");

ALTER TABLE "DirectoryInstitution"
ADD CONSTRAINT "DirectoryInstitution_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OrganizationClaim" (
  "id" TEXT NOT NULL,
  "directoryInstitutionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "claimantUserId" TEXT NOT NULL,
  "status" "OrganizationClaimStatus" NOT NULL DEFAULT 'PENDING',
  "applicantRoleTitle" TEXT,
  "applicantNote" TEXT,
  "reviewerNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationClaim_organizationId_key" ON "OrganizationClaim"("organizationId");
CREATE INDEX "OrganizationClaim_directoryInstitutionId_status_idx" ON "OrganizationClaim"("directoryInstitutionId", "status");
CREATE INDEX "OrganizationClaim_claimantUserId_status_idx" ON "OrganizationClaim"("claimantUserId", "status");
CREATE INDEX "OrganizationClaim_status_createdAt_idx" ON "OrganizationClaim"("status", "createdAt");

ALTER TABLE "OrganizationClaim"
ADD CONSTRAINT "OrganizationClaim_directoryInstitutionId_fkey"
FOREIGN KEY ("directoryInstitutionId") REFERENCES "DirectoryInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationClaim"
ADD CONSTRAINT "OrganizationClaim_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationClaim"
ADD CONSTRAINT "OrganizationClaim_claimantUserId_fkey"
FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationClaim"
ADD CONSTRAINT "OrganizationClaim_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

