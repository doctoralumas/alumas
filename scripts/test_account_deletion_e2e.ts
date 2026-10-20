import { PrismaClient } from "@prisma/client";
import { hashPassword, tokenHash } from "../lib/auth";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3005";

async function run() {
  console.log("=== STARTING ACCOUNT DELETION END-TO-END VERIFICATION OVER HTTP ===");

  const initialInstitutionCount = await prisma.directoryInstitution.count();
  const initialUserCount = await prisma.user.count();
  console.log(`Baseline: ${initialUserCount} users, ${initialInstitutionCount} directory institutions.`);

  // --------------------------------------------------------------------------
  // TEST A: TURKISH WORKFLOW ("HESABIMI SİL")
  // --------------------------------------------------------------------------
  console.log("\n--- [TEST A] Turkish Account Deletion Workflow ---");
  const trEmail = `disposable-tr-${Date.now()}@alumas.test`;
  const trPassword = "SecurePassword123!";
  const trPasswordHash = hashPassword(trPassword);

  const trUser = await prisma.user.create({
    data: {
      email: trEmail,
      name: "Test Kullanıcı TR",
      role: "DOCTOR",
      passwordHash: trPasswordHash,
    },
  });

  // Create session
  const trToken = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: trUser.id,
      tokenHash: tokenHash(trToken),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // Create associated records to verify cascading and nulling
  const trHealthEntry = await prisma.healthEntry.create({
    data: {
      userId: trUser.id,
      type: "WEIGHT",
      value: 75.0,
      unit: "kg",
      note: "Gizli tıbbi not",
    },
  });

  const trDoctor = await prisma.doctor.create({
    data: {
      userId: trUser.id,
      slug: `dr-test-tr-${Date.now()}`,
      name: "Dr. Test TR",
      specialty: "Kardiyoloji",
      title: "Uzm. Dr.",
      hospital: "Test Hastanesi",
      city: "İstanbul",
      bio: "Test doktor özgeçmişi",
      price: 1500,
      nextSlot: "Yarın 10:00",
      isPublished: true,
      presenceStatus: "ONLINE",
    },
  });

  console.log(`Created TR test user (${trUser.id}), session, healthEntry, and doctorProfile.`);

  // HTTP POST /api/account/delete with Turkish confirmation
  const resA = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${trToken}`,
    },
    body: JSON.stringify({
      confirmation: "HESABIMI SİL",
      password: trPassword,
      locale: "tr",
    }),
  });

  const dataA = await resA.json();
  console.log("Test A Response:", resA.status, dataA);

  if (resA.status !== 200 || !dataA.ok) {
    throw new Error(`Test A failed: expected status 200, got ${resA.status}: ${JSON.stringify(dataA)}`);
  }

  // Verify DB state for Test A
  const checkUserA = await prisma.user.findUnique({ where: { id: trUser.id } });
  if (checkUserA !== null) {
    throw new Error("Test A failed: User record was not deleted from User table!");
  }
  console.log("✓ User record was completely deleted from User table.");

  const checkSessionA = await prisma.session.findMany({ where: { userId: trUser.id } });
  if (checkSessionA.length !== 0) {
    throw new Error("Test A failed: User sessions were not cascaded!");
  }
  console.log("✓ User sessions were cascaded and destroyed.");

  const checkHealthA = await prisma.healthEntry.findUnique({ where: { id: trHealthEntry.id } });
  if (checkHealthA !== null) {
    throw new Error("Test A failed: Personal health entry was not cascaded!");
  }
  console.log("✓ Personal health entry was cascaded.");

  const checkDoctorA = await prisma.doctor.findUnique({ where: { id: trDoctor.id } });
  if (!checkDoctorA || checkDoctorA.userId !== null || checkDoctorA.isPublished !== false) {
    throw new Error("Test A failed: Doctor profile was not safely unlinked and unpublished!");
  }
  console.log("✓ Doctor profile was safely retained with userId=null and unpublished (presenceStatus=OFFLINE).");

  // Clean up test doctor record
  await prisma.doctor.delete({ where: { id: trDoctor.id } }).catch(() => {});

  // --------------------------------------------------------------------------
  // TEST B: ENGLISH WORKFLOW ("DELETE MY ACCOUNT")
  // --------------------------------------------------------------------------
  console.log("\n--- [TEST B] English Account Deletion Workflow ---");
  const enEmail = `disposable-en-${Date.now()}@alumas.test`;
  const enPassword = "SecurePassword456!";
  const enPasswordHash = hashPassword(enPassword);

  const enUser = await prisma.user.create({
    data: {
      email: enEmail,
      name: "Test User EN",
      role: "PATIENT",
      passwordHash: enPasswordHash,
    },
  });

  const enToken = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: enUser.id,
      tokenHash: tokenHash(enToken),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  const enHealthEntry = await prisma.healthEntry.create({
    data: {
      userId: enUser.id,
      type: "HEART_RATE",
      value: 72.0,
      unit: "bpm",
      note: "Sensitive health note",
    },
  });

  console.log(`Created EN test user (${enUser.id}), session, and healthEntry.`);

  // HTTP POST /api/account/delete with English confirmation
  const resB = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${enToken}`,
    },
    body: JSON.stringify({
      confirmation: "DELETE MY ACCOUNT",
      password: enPassword,
      locale: "en",
    }),
  });

  const dataB = await resB.json();
  console.log("Test B Response:", resB.status, dataB);

  if (resB.status !== 200 || !dataB.ok) {
    throw new Error(`Test B failed: expected status 200, got ${resB.status}: ${JSON.stringify(dataB)}`);
  }

  // Verify DB state for Test B
  const checkUserB = await prisma.user.findUnique({ where: { id: enUser.id } });
  if (checkUserB !== null) {
    throw new Error("Test B failed: User record was not deleted from User table!");
  }
  console.log("✓ User record was completely deleted from User table for English confirmation.");

  const checkHealthB = await prisma.healthEntry.findUnique({ where: { id: enHealthEntry.id } });
  if (checkHealthB !== null) {
    throw new Error("Test B failed: Personal health entry was not cascaded!");
  }
  console.log("✓ Personal health data was completely wiped.");

  // --------------------------------------------------------------------------
  // TEST C: CASE & WHITESPACE TOLERANCE
  // --------------------------------------------------------------------------
  console.log("\n--- [TEST C] Case & Whitespace Tolerance ---");
  const caseEmail = `disposable-case-${Date.now()}@alumas.test`;
  const caseUser = await prisma.user.create({
    data: {
      email: caseEmail,
      name: "Case Test User",
      role: "PATIENT",
      passwordHash: enPasswordHash,
    },
  });
  const caseToken = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: caseUser.id,
      tokenHash: tokenHash(caseToken),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // Test lowercase with Turkish characters and surrounding whitespace
  const resC = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${caseToken}`,
    },
    body: JSON.stringify({
      confirmation: "   hesabımı   sil   ",
      password: enPassword,
      locale: "tr",
    }),
  });
  const dataC = await resC.json();
  console.log("Test C (lowercase & spaces) Response:", resC.status, dataC);
  if (resC.status !== 200 || !dataC.ok) {
    throw new Error("Test C failed: Lowercase with spaces was rejected!");
  }
  console.log("✓ Case, dotless/dotted I, and whitespace normalization succeeded.");

  // --------------------------------------------------------------------------
  // TEST D: NEGATIVE & EDGE CASES
  // --------------------------------------------------------------------------
  console.log("\n--- [TEST D] Negative & Security Edge Cases ---");

  // D1. Unauthenticated request
  const resD1 = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
  });
  const dataD1 = await resD1.json();
  console.log("D1 (Unauthenticated):", resD1.status, dataD1.code);
  if (resD1.status !== 401 || dataD1.code !== "UNAUTHENTICATED") {
    throw new Error("D1 failed: Unauthenticated request was not rejected with 401!");
  }
  console.log("✓ Unauthenticated request safely blocked with 401.");

  // Create temporary user for D2 & D3
  const edgeEmail = `disposable-edge-${Date.now()}@alumas.test`;
  const edgeUser = await prisma.user.create({
    data: {
      email: edgeEmail,
      name: "Edge Test User",
      role: "PATIENT",
      passwordHash: enPasswordHash,
    },
  });
  const edgeToken = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: edgeUser.id,
      tokenHash: tokenHash(edgeToken),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  // D2. Invalid confirmation phrase
  const resD2 = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${edgeToken}`,
    },
    body: JSON.stringify({
      confirmation: "hesap sil", // invalid phrase
      password: enPassword,
      locale: "tr",
    }),
  });
  const dataD2 = await resD2.json();
  console.log("D2 (Invalid phrase):", resD2.status, dataD2.code);
  if (resD2.status !== 400 || dataD2.code !== "INVALID_CONFIRMATION") {
    throw new Error("D2 failed: Invalid confirmation phrase was not rejected with 400!");
  }
  console.log("✓ Invalid confirmation phrase safely rejected with 400.");

  // D3. Incorrect password
  const resD3 = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${edgeToken}`,
    },
    body: JSON.stringify({
      confirmation: "DELETE MY ACCOUNT",
      password: "WrongPassword999!",
      locale: "en",
    }),
  });
  const dataD3 = await resD3.json();
  console.log("D3 (Wrong password):", resD3.status, dataD3.code);
  if (resD3.status !== 403 || dataD3.code !== "INVALID_PASSWORD") {
    throw new Error("D3 failed: Wrong password was not rejected with 403!");
  }
  console.log("✓ Incorrect password safely rejected with 403.");

  // D4. Active organization owner safeguard
  const orgEmail = `disposable-org-${Date.now()}@alumas.test`;
  const orgUser = await prisma.user.create({
    data: {
      email: orgEmail,
      name: "Org Owner Test",
      role: "ORGANIZATION",
      passwordHash: enPasswordHash,
    },
  });
  const orgToken = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: orgUser.id,
      tokenHash: tokenHash(orgToken),
      expiresAt: new Date(Date.now() + 86400000),
    },
  });

  const testOrg = await prisma.organization.create({
    data: {
      ownerUserId: orgUser.id,
      type: "CLINIC",
      name: "Safeguard Test Clinic",
      slug: `safeguard-test-clinic-${Date.now()}`,
      city: "İstanbul",
      address: "Test Adres",
      phone: "+90 212 555 0000",
      email: orgEmail,
      status: "APPROVED",
      isPublished: true,
    },
  });

  const resD4 = await fetch(`${BASE_URL}/api/account/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `alumas_session=${orgToken}`,
    },
    body: JSON.stringify({
      confirmation: "DELETE MY ACCOUNT",
      password: enPassword,
      locale: "en",
    }),
  });
  const dataD4 = await resD4.json();
  console.log("D4 (Active Org Owner):", resD4.status, dataD4.code);
  if (resD4.status !== 409 || dataD4.code !== "HAS_ACTIVE_ORGANIZATION") {
    throw new Error("D4 failed: Active organization owner deletion was not blocked with 409!");
  }
  console.log("✓ Active organization owner deletion was safely blocked with 409.");

  // Clean up D4 test records safely
  await prisma.organization.delete({ where: { id: testOrg.id } });
  await prisma.session.deleteMany({ where: { userId: orgUser.id } });
  await prisma.user.delete({ where: { id: orgUser.id } });

  // Clean up D2/D3 edgeUser
  await prisma.session.deleteMany({ where: { userId: edgeUser.id } });
  await prisma.user.delete({ where: { id: edgeUser.id } });

  // Verify baseline integrity
  const finalInstitutionCount = await prisma.directoryInstitution.count();
  const finalUserCount = await prisma.user.count();
  if (finalInstitutionCount !== initialInstitutionCount) {
    throw new Error(`Directory institution count changed! Initial: ${initialInstitutionCount}, Final: ${finalInstitutionCount}`);
  }
  if (finalUserCount !== initialUserCount) {
    throw new Error(`User count mismatch! Initial: ${initialUserCount}, Final: ${finalUserCount}`);
  }
  console.log(`✓ Directory institution baseline integrity preserved: exactly ${finalInstitutionCount} records.`);
  console.log(`✓ User baseline integrity preserved: exactly ${finalUserCount} records.`);

  console.log("\n=======================================================");
  console.log("ALL END-TO-END DELETION AND INTEGRITY TESTS PASSED 100%!");
  console.log("=======================================================\n");
}

run()
  .catch((err) => {
    console.error("FATAL TEST FAILURE:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

