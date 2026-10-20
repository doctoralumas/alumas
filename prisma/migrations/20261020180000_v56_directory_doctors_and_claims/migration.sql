-- v56: Public DirectoryDoctor listings and DoctorClaim workflow

CREATE TABLE "DirectoryDoctor" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "hospital" TEXT,
  "city" TEXT NOT NULL DEFAULT 'İstanbul',
  "district" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "officialWebsite" TEXT,
  "description" TEXT,
  "source" TEXT NOT NULL DEFAULT 'CURATED_PUBLIC_DIRECTORY',
  "externalRef" TEXT,
  "lastVerifiedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "doctorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectoryDoctor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DoctorClaim" (
  "id" TEXT NOT NULL,
  "directoryDoctorId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "claimantUserId" TEXT NOT NULL,
  "status" "OrganizationClaimStatus" NOT NULL DEFAULT 'PENDING',
  "applicantTitle" TEXT,
  "applicantNote" TEXT,
  "reviewerNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DoctorClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectoryDoctor_slug_key" ON "DirectoryDoctor"("slug");
CREATE UNIQUE INDEX "DirectoryDoctor_externalRef_key" ON "DirectoryDoctor"("externalRef");
CREATE UNIQUE INDEX "DirectoryDoctor_doctorId_key" ON "DirectoryDoctor"("doctorId");
CREATE INDEX "DirectoryDoctor_isActive_idx" ON "DirectoryDoctor"("isActive");
CREATE INDEX "DirectoryDoctor_city_idx" ON "DirectoryDoctor"("city");
CREATE INDEX "DirectoryDoctor_specialty_idx" ON "DirectoryDoctor"("specialty");
CREATE INDEX "DirectoryDoctor_isActive_city_specialty_idx" ON "DirectoryDoctor"("isActive", "city", "specialty");

CREATE INDEX "DoctorClaim_directoryDoctorId_status_idx" ON "DoctorClaim"("directoryDoctorId", "status");
CREATE INDEX "DoctorClaim_claimantUserId_status_idx" ON "DoctorClaim"("claimantUserId", "status");
CREATE INDEX "DoctorClaim_doctorId_status_idx" ON "DoctorClaim"("doctorId", "status");
CREATE INDEX "DoctorClaim_status_createdAt_idx" ON "DoctorClaim"("status", "createdAt");

ALTER TABLE "DirectoryDoctor" ADD CONSTRAINT "DirectoryDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DoctorClaim" ADD CONSTRAINT "DoctorClaim_directoryDoctorId_fkey" FOREIGN KEY ("directoryDoctorId") REFERENCES "DirectoryDoctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorClaim" ADD CONSTRAINT "DoctorClaim_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorClaim" ADD CONSTRAINT "DoctorClaim_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DoctorClaim" ADD CONSTRAINT "DoctorClaim_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

