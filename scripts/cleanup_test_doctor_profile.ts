import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

async function runCleanup() {
  console.log("=== STARTING TARGETED TEST DOCTOR CLEANUP ===");

  const targetDoctorId = "cmvji7e160001l608mmkxm7um";

  // 1. Fetch doctor with all dependencies
  const doctor = await prisma.doctor.findUnique({
    where: { id: targetDoctorId },
    include: {
      user: true,
      claims: true,
      verificationDocuments: true,
      appointments: true,
      carePlans: true,
      reviews: true,
      healthShares: true,
      patientNotes: true,
      diagnosticRequests: true,
      videoConsultations: true,
      directoryDoctor: true,
    },
  });

  if (!doctor) {
    console.log(`Doctor with id ${targetDoctorId} not found. Already cleaned up?`);
    return;
  }

  console.log(`Found target doctor: ${doctor.name} (${doctor.id})`);
  console.log(`Associated userId: ${doctor.userId}`);
  console.log(`Claims count: ${doctor.claims.length}`);
  console.log(`Documents count: ${doctor.verificationDocuments.length}`);
  console.log(`Appointments count: ${doctor.appointments.length}`);
  console.log(`CarePlans count: ${doctor.carePlans.length}`);
  console.log(`Reviews count: ${doctor.reviews.length}`);

  // Safety checks
  if (doctor.appointments.length > 0 || doctor.carePlans.length > 0 || doctor.reviews.length > 0) {
    throw new Error("ABORTING: Target doctor has active clinical or patient dependencies!");
  }

  if (doctor.userId !== null) {
    throw new Error(`ABORTING: Doctor is still linked to user ${doctor.userId}!`);
  }

  // 2. Check document files on disk (clean up uploaded test files if they exist in uploads)
  for (const doc of doctor.verificationDocuments) {
    if (doc.fileStoragePath && doc.fileStoragePath.startsWith("/uploads/")) {
      const fullPath = path.join(process.cwd(), "public", doc.fileStoragePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`Deleted test document file: ${fullPath}`);
        } catch (err) {
          console.warn(`Could not delete file ${fullPath}:`, err);
        }
      }
    }
  }

  // 3. Audit log creation before disposal
  console.log("Logging administrative audit event...");
  await prisma.auditLog.create({
    data: {
      action: "doctor.test_profile_disposed",
      entityType: "Doctor",
      entityId: targetDoctorId,
      metadata: {
        doctorName: doctor.name,
        slug: doctor.slug,
        reason: "Disposable test doctor profile cleanup from reversed claim test",
        deletedClaimsCount: doctor.claims.length,
        deletedDocumentsCount: doctor.verificationDocuments.length,
        performedBy: "ADMIN_SYSTEM_CLEANUP",
      },
    },
  });
  console.log("Audit log recorded successfully.");

  // 4. Clean up test claims attached to this test profile
  const claimsDeleted = await prisma.doctorClaim.deleteMany({
    where: { doctorId: targetDoctorId },
  });
  console.log(`Deleted test claims: ${claimsDeleted.count}`);

  // 5. Clean up verification documents attached to this test profile
  const docsDeleted = await prisma.verificationDocument.deleteMany({
    where: { doctorId: targetDoctorId },
  });
  console.log(`Deleted test documents: ${docsDeleted.count}`);

  // 6. Delete the disposable test doctor profile
  await prisma.doctor.delete({
    where: { id: targetDoctorId },
  });
  console.log(`Successfully deleted test doctor ${targetDoctorId}.`);

  // 7. Verify post-cleanup database state
  const remainingDoctors = await prisma.doctor.findMany({
    select: { id: true, name: true, specialty: true, isVerified: true, isPublished: true, userId: true },
  });
  console.log("\n=== POST-CLEANUP REGISTERED DOCTORS (EXPECTED: 3) ===");
  console.table(remainingDoctors);

  const abuzerUser = await prisma.user.findFirst({
    where: { email: "abuzereczane@gmail.com" },
    include: {
      organizations: { select: { id: true, name: true, type: true } },
      doctorProfile: true,
      doctorClaims: true,
    },
  });
  console.log("\n=== ABUZER USER STATE ===");
  console.log(`ID: ${abuzerUser?.id}`);
  console.log(`Name: ${abuzerUser?.name}`);
  console.log(`Role: ${abuzerUser?.role}`);
  console.log(`DoctorProfile: ${abuzerUser?.doctorProfile ? "EXISTS (ERROR!)" : "NULL (CORRECT)"}`);
  console.log(`DoctorClaims: ${abuzerUser?.doctorClaims.length} (EXPECTED: 0)`);
  console.log(`Organizations: ${JSON.stringify(abuzerUser?.organizations)}`);

  const bulentOktay = await prisma.directoryDoctor.findFirst({
    where: { name: { contains: "Bülent Oktay" } },
    include: { doctor: true, claims: true },
  });
  console.log("\n=== BÜLENT OKTAY DIRECTORY STATE ===");
  console.log(`ID: ${bulentOktay?.id}`);
  console.log(`Name: ${bulentOktay?.name}`);
  console.log(`DoctorId: ${bulentOktay?.doctorId} (EXPECTED: NULL)`);
  console.log(`Claims Count: ${bulentOktay?.claims.length} (EXPECTED: 0)`);
  console.log(`Official Website: ${bulentOktay?.officialWebsite}`);

  const totalDirectory = await prisma.directoryDoctor.count();
  console.log(`\nTotal DirectoryDoctor Count: ${totalDirectory} (EXPECTED: 386)`);
}

runCleanup()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
