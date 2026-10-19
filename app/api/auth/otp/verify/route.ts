import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createSession, currentUser, findUserByPhone } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getPhoneLookupVariants, isValidPhone, normalizePhone } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json();
  const { code, login, mode: rawMode } = body;
  const mode = rawMode || (login ? "login" : undefined);
  const canonicalPhone = normalizePhone(body.phone);

  if (!canonicalPhone || !isValidPhone(canonicalPhone) || !code) {
    return NextResponse.json({ error: "Geçerli bir telefon numarası ve kod giriniz.", code: "INVALID_INPUT" }, { status: 400 });
  }

  const variants = getPhoneLookupVariants(canonicalPhone);
  const row = await prisma.otpCode.findFirst({
    where: {
      phone: { in: variants },
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.attempts >= 5) {
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş", code: "INVALID_OR_EXPIRED_CODE" }, { status: 400 });
  }

  const got = Buffer.from(createHash("sha256").update(String(code).trim()).digest("hex"));
  const expected = Buffer.from(row.codeHash);
  const valid = got.length === expected.length && timingSafeEqual(got, expected);

  if (!valid) {
    await prisma.otpCode.update({
      where: { id: row.id },
      data: {
        attempts: { increment: 1 },
        ...(row.attempts >= 4 ? { usedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş", code: "INVALID_OR_EXPIRED_CODE" }, { status: 400 });
  }

  const authUser = await currentUser();

  // If the OTP was requested by a specific authenticated user, ensure the verifying session matches
  if (row.userId && authUser && row.userId !== authUser.id) {
    return NextResponse.json({ error: "Doğrulama yetkisi uyuşmuyor.", code: "UNAUTHORIZED_OTP" }, { status: 403 });
  }

  const otpId = row.id;
  const otpUserId = row.userId;

  // Helper to atomically consume OTP code
  async function consumeOtp() {
    return prisma.otpCode.updateMany({
      where: { id: otpId, usedAt: null },
      data: {
        usedAt: new Date(),
        userId: authUser?.id ?? otpUserId ?? null,
      },
    });
  }

  // FLOW 1: Explicit LOGIN
  if (mode === "login") {
    const user = await findUserByPhone(canonicalPhone);
    if (!user) {
      // Invariant: Login NEVER silently provisions a new application account!
      return NextResponse.json(
        {
          error: "Bu telefon numarasıyla kayıtlı bir hesap bulunamadı. Lütfen kayıt olun veya hesabınıza giriş yaparak profilinizden telefon numaranızı doğrulayın.",
          code: "ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const consumed = await consumeOtp();
    if (consumed.count === 0) {
      return NextResponse.json({ error: "Kod zaten kullanılmış veya geçersiz.", code: "CODE_ALREADY_USED" }, { status: 400 });
    }

    // Ensure user's phone is healed to canonical E.164 if stored in legacy format
    if (user.phone !== canonicalPhone) {
      const collision = await prisma.user.findUnique({ where: { phone: canonicalPhone } });
      if (!collision) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { phone: canonicalPhone },
          })
          .catch(() => {});
        user.phone = canonicalPhone;
      }
    }

    await createSession(user.id);
    await audit({
      actorUserId: user.id,
      action: "auth.otp_login",
      entityType: "User",
      entityId: user.id,
      req,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        doctorSlug: user.doctorProfile?.slug ?? null,
      },
    });
  }

  // FLOW 2: Explicit REGISTER with Phone
  if (mode === "register") {
    const existing = await findUserByPhone(canonicalPhone);
    if (existing) {
      return NextResponse.json(
        {
          error: "Bu telefon numarası zaten başka bir hesaba kayıtlı. Lütfen giriş yapın.",
          code: "PHONE_ALREADY_REGISTERED",
        },
        { status: 409 }
      );
    }

    const consumed = await consumeOtp();
    if (consumed.count === 0) {
      return NextResponse.json({ error: "Kod zaten kullanılmış veya geçersiz.", code: "CODE_ALREADY_USED" }, { status: 400 });
    }

    const name = String(body.name || "").trim() || `Alumas Kullanıcısı ${canonicalPhone.slice(-4)}`;
    const role = ["PATIENT", "DOCTOR", "ORGANIZATION", "AGENCY"].includes(
      String(body.role || "").toUpperCase()
    )
      ? String(body.role).toUpperCase()
      : "PATIENT";
    const dummyEmail = `phone-${Date.now()}-${randomBytes(4).toString("hex")}@alumas.local`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email: dummyEmail,
        phone: canonicalPhone,
        role: role as any,
      },
    });

    await createSession(newUser.id);
    await audit({
      actorUserId: newUser.id,
      action: "account.register_phone",
      entityType: "User",
      entityId: newUser.id,
      req,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          role: newUser.role,
          email: newUser.email,
          phone: newUser.phone,
        },
      },
      { status: 201 }
    );
  }

  // FLOW 3: Authenticated user verifying / linking phone to their canonical account
  if (authUser) {
    const existingWithPhone = await findUserByPhone(canonicalPhone);
    if (existingWithPhone && existingWithPhone.id !== authUser.id) {
      return NextResponse.json(
        { error: "Bu telefon numarası başka bir hesap tarafından kullanılıyor.", code: "PHONE_IN_USE" },
        { status: 409 }
      );
    }

    const consumed = await consumeOtp();
    if (consumed.count === 0) {
      return NextResponse.json({ error: "Kod zaten kullanılmış veya geçersiz.", code: "CODE_ALREADY_USED" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { phone: canonicalPhone },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    await audit({
      actorUserId: authUser.id,
      action: "auth.phone_verify",
      entityType: "User",
      entityId: authUser.id,
      metadata: { phoneTail: canonicalPhone.slice(-4) },
      req,
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      phone: canonicalPhone,
      user: updated,
    });
  }

  // FLOW 4: Standalone OTP verification (guest proving phone control without immediate session creation)
  const consumed = await consumeOtp();
  if (consumed.count === 0) {
    return NextResponse.json({ error: "Kod zaten kullanılmış veya geçersiz.", code: "CODE_ALREADY_USED" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, verified: true, phone: canonicalPhone });
}
