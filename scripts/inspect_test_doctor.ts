import { prisma } from "../lib/prisma";

async function inspect() {
  const doctor = await prisma.doctor.findFirst({
    where: { name: { contains: "Abuzer" } },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      claims: true,
      verificationDocuments: true,
      appointments: true,
      availabilities: true,
      carePlans: true,
      healthShares: true,
      organization: true,
      organizationInvites: true,
      favorites: true,
      reviews: true,
      healthReportShares: true,
      healthSummaryShares: true,
      patientNotes: true,
      healthGoals: true,
      carePlanEvents: true,
      labResultComments: true,
      patientQuestions: true,
      diagnosticRequests: true,
      videoConsultations: true,
      directoryDoctor: true,
    },
  });

  console.log("=== DOCTOR RECORD ===");
  console.log(JSON.stringify(doctor, null, 2));

  const abuzerUser = await prisma.user.findFirst({
    where: { email: "abuzereczane@gmail.com" },
    include: {
      organizations: true,
      doctorClaims: true,
      doctorProfile: true,
    },
  });

  console.log("=== ABUZER USER ===");
  console.log(JSON.stringify(abuzerUser, null, 2));

  const bulentOktay = await prisma.directoryDoctor.findFirst({
    where: { name: { contains: "Bülent Oktay" } },
    include: {
      claims: true,
      doctor: true,
    },
  });

  console.log("=== BÜLENT OKTAY DIRECTORY ===");
  console.log(JSON.stringify(bulentOktay, null, 2));

  // Count all doctors
  const allDoctors = await prisma.doctor.findMany({
    select: { id: true, name: true, isVerified: true, isPublished: true, userId: true },
  });
  console.log("=== ALL DOCTORS IN DB ===");
  console.log(JSON.stringify(allDoctors, null, 2));

  // Audit logs concerning doctor
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: doctor?.id },
        { action: { contains: "doctor" } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  console.log("=== RECENT DOCTOR AUDIT LOGS ===");
  console.log(JSON.stringify(logs, null, 2));
}

inspect().catch(console.error);
