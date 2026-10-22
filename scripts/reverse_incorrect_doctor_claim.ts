import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_PRECONDITIONS = {
  directoryDoctorId: "cmvht427o002fypighba3fnd1",
  expectedDoctorName: "A. Bülent Oktay",
  claimId: "cmvji7e3o0006l608yv09a5j1",
  testDoctorId: "cmvji7e160001l608mmkxm7um",
  claimantUserId: "cmtycfliu0000la04qq2kebcp",
  claimantEmail: "abuzereczane@gmail.com",
};

async function run(execute: boolean = false) {
  console.log(`=== ALUMAS REVERSAL SCRIPT [Mode: ${execute ? "EXECUTE (MUTATION)" : "DRY-RUN (READ-ONLY)"}] ===\n`);

  // 1. Fetch and verify DirectoryDoctor
  const dirDoctor = await prisma.directoryDoctor.findUnique({
    where: { id: TARGET_PRECONDITIONS.directoryDoctorId },
  });
  if (!dirDoctor) {
    throw new Error(`PRECONDITION FAILED: DirectoryDoctor ${TARGET_PRECONDITIONS.directoryDoctorId} not found.`);
  }
  if (dirDoctor.name !== TARGET_PRECONDITIONS.expectedDoctorName) {
    throw new Error(`PRECONDITION FAILED: Expected doctor name "${TARGET_PRECONDITIONS.expectedDoctorName}", found "${dirDoctor.name}".`);
  }
  if (dirDoctor.doctorId !== TARGET_PRECONDITIONS.testDoctorId) {
    throw new Error(`PRECONDITION FAILED: Expected DirectoryDoctor.doctorId to be "${TARGET_PRECONDITIONS.testDoctorId}", found "${dirDoctor.doctorId}".`);
  }
  console.log("✔ DirectoryDoctor precondition verified:");
  console.log(`  - ID: ${dirDoctor.id}`);
  console.log(`  - Name: ${dirDoctor.title} ${dirDoctor.name}`);
  console.log(`  - Specialty: ${dirDoctor.specialty} (${dirDoctor.hospital})`);
  console.log(`  - Current doctorId: ${dirDoctor.doctorId}`);

  // 2. Fetch and verify DoctorClaim
  const claim = await prisma.doctorClaim.findUnique({
    where: { id: TARGET_PRECONDITIONS.claimId },
  });
  if (!claim) {
    throw new Error(`PRECONDITION FAILED: DoctorClaim ${TARGET_PRECONDITIONS.claimId} not found.`);
  }
  if (claim.directoryDoctorId !== TARGET_PRECONDITIONS.directoryDoctorId) {
    throw new Error(`PRECONDITION FAILED: Claim directoryDoctorId mismatch.`);
  }
  if (claim.claimantUserId !== TARGET_PRECONDITIONS.claimantUserId) {
    throw new Error(`PRECONDITION FAILED: Claim claimantUserId mismatch.`);
  }
  console.log("\n✔ DoctorClaim precondition verified:");
  console.log(`  - ID: ${claim.id}`);
  console.log(`  - Status: ${claim.status}`);
  console.log(`  - Claimant: ${claim.claimantUserId}`);

  // 3. Fetch and verify test Doctor record
  const doctor = await prisma.doctor.findUnique({
    where: { id: TARGET_PRECONDITIONS.testDoctorId },
    include: { verificationDocuments: true },
  });
  if (!doctor) {
    throw new Error(`PRECONDITION FAILED: Doctor ${TARGET_PRECONDITIONS.testDoctorId} not found.`);
  }
  if (doctor.userId !== TARGET_PRECONDITIONS.claimantUserId) {
    throw new Error(`PRECONDITION FAILED: Doctor userId mismatch.`);
  }
  console.log("\n✔ Test Doctor record precondition verified:");
  console.log(`  - ID: ${doctor.id}`);
  console.log(`  - Name: ${doctor.name}`);
  console.log(`  - Slug: ${doctor.slug}`);
  console.log(`  - isVerified: ${doctor.isVerified}, isPublished: ${doctor.isPublished}`);
  console.log(`  - Documents count: ${doctor.verificationDocuments.length}`);

  // 4. Fetch and verify User
  const user = await prisma.user.findUnique({
    where: { id: TARGET_PRECONDITIONS.claimantUserId },
    include: { organizations: true },
  });
  if (!user) {
    throw new Error(`PRECONDITION FAILED: User ${TARGET_PRECONDITIONS.claimantUserId} not found.`);
  }
  if (user.email !== TARGET_PRECONDITIONS.claimantEmail) {
    throw new Error(`PRECONDITION FAILED: User email mismatch.`);
  }
  console.log("\n✔ User record precondition verified:");
  console.log(`  - ID: ${user.id}`);
  console.log(`  - Name: ${user.name}`);
  console.log(`  - Email: ${user.email}`);
  console.log(`  - Current Role: ${user.role}`);
  console.log(`  - Owned Organizations count: ${user.organizations.length}`);
  user.organizations.forEach((org) => {
    console.log(`    * Org ID: ${org.id}, Name: ${org.name}, Type: ${org.type}, Status: ${org.status}`);
  });

  if (!execute) {
    console.log("\n[DRY-RUN COMPLETE] All preconditions satisfied. Run with --execute to perform reversal transaction.");
    return;
  }

  // 5. Execute narrowly scoped atomic transaction
  console.log("\nExecuting atomic database reversal transaction...");
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 5.1 Unlink DirectoryDoctor
    await tx.directoryDoctor.update({
      where: { id: TARGET_PRECONDITIONS.directoryDoctorId },
      data: {
        doctorId: null,
        lastVerifiedAt: null,
      },
    });

    // 5.2 Invalidate & Revoke DoctorClaim
    await tx.doctorClaim.update({
      where: { id: TARGET_PRECONDITIONS.claimId },
      data: {
        status: "REJECTED",
        reviewerNote: "REVOKED_TEST_CLAIM: Yanlış hekim sahiplenme testi geri alındı; kimlik uyuşmazlığı nedeniyle iptal edildi.",
        reviewedAt: now,
      },
    });

    // 5.3 Reject test VerificationDocuments
    await tx.verificationDocument.updateMany({
      where: { doctorId: TARGET_PRECONDITIONS.testDoctorId },
      data: {
        status: "REJECTED",
        reviewerNote: "REVOKED_TEST_CLAIM: Test doğrulaması iptal edildi.",
        reviewedAt: now,
      },
    });

    // 5.4 Safely deactivate and disassociate the test Doctor profile
    await tx.doctor.update({
      where: { id: TARGET_PRECONDITIONS.testDoctorId },
      data: {
        userId: null,
        isVerified: false,
        isPublished: false,
        slug: `deactivated-test-claim-${TARGET_PRECONDITIONS.testDoctorId}`,
        nextSlot: "Deaktif",
      },
    });

    // 5.5 Revert User role to PATIENT (preserving account and owned pharmacy)
    await tx.user.update({
      where: { id: TARGET_PRECONDITIONS.claimantUserId },
      data: {
        role: "PATIENT",
      },
    });

    // 5.6 Create Audit Log for transparency and regulatory traceability
    await tx.auditLog.create({
      data: {
        actorUserId: TARGET_PRECONDITIONS.claimantUserId,
        action: "doctor.claim.revoked",
        entityType: "DoctorClaim",
        entityId: TARGET_PRECONDITIONS.claimId,
        outcome: "success",
        metadata: {
          reason: "Security & identity integrity reversal: disassociated Abuzer Eczanesi from Prof. Dr. A. Bülent Oktay",
          directoryDoctorId: TARGET_PRECONDITIONS.directoryDoctorId,
          directoryDoctorName: dirDoctor.name,
          testDoctorId: TARGET_PRECONDITIONS.testDoctorId,
          revertedAt: now.toISOString(),
        },
      },
    });
  });

  console.log("✔ Atomic transaction committed successfully!");

  // 6. Verify post-transaction state
  const postDirDoctor = await prisma.directoryDoctor.findUnique({
    where: { id: TARGET_PRECONDITIONS.directoryDoctorId },
  });
  const postClaim = await prisma.doctorClaim.findUnique({
    where: { id: TARGET_PRECONDITIONS.claimId },
  });
  const postDoctor = await prisma.doctor.findUnique({
    where: { id: TARGET_PRECONDITIONS.testDoctorId },
  });
  const postUser = await prisma.user.findUnique({
    where: { id: TARGET_PRECONDITIONS.claimantUserId },
    include: { organizations: true },
  });

  console.log("\n=== POST-REVERSAL VERIFICATION ===");
  console.log(`DirectoryDoctor doctorId: ${postDirDoctor?.doctorId} (Expected: null)`);
  console.log(`DoctorClaim status: ${postClaim?.status} (Expected: REJECTED)`);
  console.log(`Doctor userId: ${postDoctor?.userId} (Expected: null)`);
  console.log(`Doctor isVerified: ${postDoctor?.isVerified} (Expected: false)`);
  console.log(`Doctor isPublished: ${postDoctor?.isPublished} (Expected: false)`);
  console.log(`Doctor slug: ${postDoctor?.slug}`);
  console.log(`User role: ${postUser?.role} (Expected: PATIENT)`);
  console.log(`User owned orgs count: ${postUser?.organizations.length} (Expected: 1)`);
  console.log(`User pharmacy intact: ${postUser?.organizations[0]?.name}`);
}

const isExecute = process.argv.includes("--execute");
run(isExecute)
  .catch((err) => {
    console.error("FATAL ERROR during reversal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
