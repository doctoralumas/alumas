import { prisma } from "../lib/prisma";

async function verifyStateIntegrity() {
  console.log("=== PHASE 1: DATABASE & ENTITY INTEGRITY CHECK ===");

  const results: Record<string, boolean> = {};

  // 1. Check Registered Doctors
  const doctors = await prisma.doctor.findMany({
    select: { id: true, name: true, specialty: true, city: true, isVerified: true, isPublished: true, userId: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n1. Registered Doctors Count: ${doctors.length} (Expected: 3)`);
  console.table(doctors);
  results["doctors_count_is_3"] = doctors.length === 3;
  results["doctors_names_valid"] = doctors.every((d) =>
    ["Yiğit Tilaver", "Ali Can Aydın", "Fahri Tunç"].includes(d.name)
  );

  // 2. Check Abuzer test doctor is completely gone
  const testDoctor = await prisma.doctor.findUnique({
    where: { id: "cmvji7e160001l608mmkxm7um" },
  });
  console.log(`\n2. Abuzer Test Doctor cmvji7e160001l608mmkxm7um exists: ${!!testDoctor} (Expected: false)`);
  results["test_doctor_is_gone"] = testDoctor === null;

  // 3. Check Abuzer legitimate user & pharmacy
  const abuzerUser = await prisma.user.findFirst({
    where: { email: "abuzereczane@gmail.com" },
    include: {
      doctorProfile: true,
      doctorClaims: true,
      organizations: true,
    },
  });
  console.log(`\n3. Abuzer User:`);
  console.log(`   ID: ${abuzerUser?.id}`);
  console.log(`   Role: ${abuzerUser?.role} (Expected: PATIENT)`);
  console.log(`   Doctor Profile: ${abuzerUser?.doctorProfile ? "EXISTS (FAIL)" : "NULL (PASS)"}`);
  console.log(`   Doctor Claims Count: ${abuzerUser?.doctorClaims.length} (Expected: 0)`);
  console.log(`   Organizations Count: ${abuzerUser?.organizations.length} (Expected: 1)`);
  if (abuzerUser?.organizations[0]) {
    console.log(`   Pharmacy Name: ${abuzerUser.organizations[0].name}`);
    console.log(`   Pharmacy Type: ${abuzerUser.organizations[0].type}`);
    console.log(`   Pharmacy Status: ${abuzerUser.organizations[0].status}`);
  }

  results["abuzer_user_role_patient"] = abuzerUser?.role === "PATIENT";
  results["abuzer_doctor_profile_null"] = abuzerUser?.doctorProfile === null;
  results["abuzer_doctor_claims_empty"] = abuzerUser?.doctorClaims.length === 0;
  results["abuzer_pharmacy_intact"] =
    abuzerUser?.organizations.length === 1 &&
    abuzerUser.organizations[0].name === "Abuzer Kömürcü" &&
    abuzerUser.organizations[0].status === "APPROVED";

  // 4. Check Bülent Oktay DirectoryDoctor
  const bulentOktay = await prisma.directoryDoctor.findFirst({
    where: { name: { contains: "Bülent Oktay" } },
    include: { doctor: true, claims: true },
  });
  console.log(`\n4. Prof. Dr. A. Bülent Oktay DirectoryDoctor:`);
  console.log(`   ID: ${bulentOktay?.id}`);
  console.log(`   Name: ${bulentOktay?.name}`);
  console.log(`   DoctorId: ${bulentOktay?.doctorId} (Expected: null)`);
  console.log(`   Claims: ${bulentOktay?.claims.length} (Expected: 0)`);
  console.log(`   Active: ${bulentOktay?.isActive} (Expected: true)`);
  console.log(`   Website: ${bulentOktay?.officialWebsite}`);

  results["bulent_oktay_unclaimed"] = bulentOktay?.doctorId === null && bulentOktay?.claims.length === 0;
  results["bulent_oktay_active"] = bulentOktay?.isActive === true;

  // 5. Check Total Directory Doctors
  const totalDirectory = await prisma.directoryDoctor.count();
  console.log(`\n5. Total Directory Doctors Count: ${totalDirectory} (Expected: 386)`);
  results["total_directory_is_386"] = totalDirectory === 386;

  // 6. Check Audit Logs for cleanup and reversal
  const cleanupLog = await prisma.auditLog.findFirst({
    where: { action: "doctor.test_profile_disposed" },
  });
  const revokeLog = await prisma.auditLog.findFirst({
    where: { action: "doctor.claim.revoked" },
  });
  console.log(`\n6. Historical Audit Trail:`);
  console.log(`   doctor.test_profile_disposed log: ${cleanupLog ? "FOUND (" + cleanupLog.id + ")" : "MISSING"}`);
  console.log(`   doctor.claim.revoked log: ${revokeLog ? "FOUND (" + revokeLog.id + ")" : "MISSING"}`);
  results["cleanup_audit_log_exists"] = cleanupLog !== null;
  results["revoke_audit_log_exists"] = revokeLog !== null;

  console.log("\n=== INTEGRITY RESULTS SUMMARY ===");
  console.table(results);

  const allPassed = Object.values(results).every(Boolean);
  if (!allPassed) {
    console.error("FAIL: One or more integrity checks failed!");
    process.exit(1);
  } else {
    console.log("PASS: All database & entity integrity checks PASSED!");
  }
}

verifyStateIntegrity()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

