CREATE TABLE "OrganizationInsurance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "insuranceProviderId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationInsurance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationInsurance_organizationId_insuranceProviderId_key"
ON "OrganizationInsurance"("organizationId","insuranceProviderId");
CREATE INDEX "OrganizationInsurance_insuranceProviderId_isActive_idx"
ON "OrganizationInsurance"("insuranceProviderId","isActive");
ALTER TABLE "OrganizationInsurance"
ADD CONSTRAINT "OrganizationInsurance_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationInsurance"
ADD CONSTRAINT "OrganizationInsurance_insuranceProviderId_fkey"
FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserInsurancePreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "insuranceProviderId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "policyLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserInsurancePreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserInsurancePreference_userId_insuranceProviderId_key"
ON "UserInsurancePreference"("userId","insuranceProviderId");
CREATE INDEX "UserInsurancePreference_userId_isPrimary_idx"
ON "UserInsurancePreference"("userId","isPrimary");
ALTER TABLE "UserInsurancePreference"
ADD CONSTRAINT "UserInsurancePreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInsurancePreference"
ADD CONSTRAINT "UserInsurancePreference_insuranceProviderId_fkey"
FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
