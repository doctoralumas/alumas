import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizePhoneLegacy(v) {
  let digits = String(v || "").replace(/\D/g, "");
  if (digits.startsWith("0090") && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 15);
}

function normalizePhoneE164(raw) {
  if (!raw) return "";
  const str = String(raw).trim();
  if (!str) return "";
  const startsWithPlus = str.startsWith("+");
  const startsWithZeroZero = str.startsWith("00");
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";

  if (startsWithZeroZero && digits.startsWith("0090")) {
    const after90 = digits.slice(4);
    const sub = after90.startsWith("0") ? after90.slice(1) : after90;
    if (sub.length === 10) return "+90" + sub;
  }
  if ((startsWithPlus || digits.startsWith("90")) && digits.startsWith("90")) {
    const after90 = digits.slice(2);
    const sub = after90.startsWith("0") ? after90.slice(1) : after90;
    if (sub.length === 10) return "+90" + sub;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return "+90" + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    return "+90" + digits;
  }
  if (startsWithPlus && digits.length >= 8 && digits.length <= 15) {
    return "+" + digits;
  }
  if (startsWithZeroZero && digits.length >= 10 && digits.length <= 17) {
    const without00 = digits.slice(2);
    if (without00.length >= 8 && without00.length <= 15) return "+" + without00;
  }
  if (digits.length === 10) return "+90" + digits;
  return "+" + digits;
}

async function run() {
  console.log("=== ALUMAS AUTH IDENTITY DIAGNOSTICS START ===");

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      _count: {
        select: {
          appointments: true,
          healthEntries: true,
          organizations: true,
          sessions: true,
        }
      },
      doctorProfile: { select: { id: true, slug: true } }
    }
  });

  const totalUsers = allUsers.length;
  const emailOnlyUsers = allUsers.filter(u => u.email && !u.phone && !u.email.includes("@alumas.local"));
  const phoneOnlyUsers = allUsers.filter(u => u.phone && u.email.includes("@alumas.local"));
  const linkedBothUsers = allUsers.filter(u => u.phone && u.email && !u.email.includes("@alumas.local"));
  const passwordlessUsers = allUsers.filter(u => !u.passwordHash);

  // Phone normalization comparison
  const phoneNormalizationDiscrepancies = [];
  const phoneCounts = new Map();
  const phoneE164Counts = new Map();

  for (const u of allUsers) {
    if (!u.phone) continue;
    const leg = normalizePhoneLegacy(u.phone);
    const e164 = normalizePhoneE164(u.phone);
    if (leg !== e164) {
      phoneNormalizationDiscrepancies.push({
        anonymizedId: u.id.slice(0, 8) + "...",
        storedPhone: u.phone.slice(0, 3) + "***" + u.phone.slice(-2),
        legacyNormalized: leg.slice(0, 3) + "***" + leg.slice(-2),
        e164Normalized: e164.slice(0, 5) + "***" + e164.slice(-2),
      });
    }

    phoneCounts.set(leg, (phoneCounts.get(leg) || 0) + 1);
    phoneE164Counts.set(e164, (phoneE164Counts.get(e164) || 0) + 1);
  }

  // Duplicate phones
  const duplicateLegacyPhones = Array.from(phoneCounts.entries()).filter(([k, v]) => v > 1);
  const duplicateE164Phones = Array.from(phoneE164Counts.entries()).filter(([k, v]) => v > 1);

  // OtpCode audit
  const totalOtpCodes = await prisma.otpCode.count();
  const recentOtpCodes = await prisma.otpCode.count({
    where: { createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  // Active Sessions
  const activeSessions = await prisma.session.count({
    where: { expiresAt: { gt: new Date() } }
  });

  const diagnostics = {
    totalUsers,
    emailOnlyUsersCount: emailOnlyUsers.length,
    phoneOnlyUsersCount: phoneOnlyUsers.length,
    linkedBothUsersCount: linkedBothUsers.length,
    passwordlessUsersCount: passwordlessUsers.length,
    phoneNormalizationDiscrepanciesCount: phoneNormalizationDiscrepancies.length,
    phoneNormalizationDiscrepancies,
    duplicateLegacyPhonesCount: duplicateLegacyPhones.length,
    duplicateE164PhonesCount: duplicateE164Phones.length,
    phoneOnlyUsersList: phoneOnlyUsers.map(u => ({
      anonymizedId: u.id.slice(0, 8) + "...",
      role: u.role,
      phoneTail: u.phone ? u.phone.slice(-4) : null,
      appointments: u._count.appointments,
      healthEntries: u._count.healthEntries,
      organizations: u._count.organizations,
      hasDoctorProfile: !!u.doctorProfile,
      createdAt: u.createdAt,
    })),
    totalOtpCodes,
    recentOtpCodesLast24h: recentOtpCodes,
    activeSessions,
  };

  console.log(JSON.stringify(diagnostics, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());

