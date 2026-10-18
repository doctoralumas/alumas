import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createSession, currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { normalizePhone } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json();
  const { code, login } = body;
  const phone = normalizePhone(body.phone);

  if (!phone || !code) {
    return NextResponse.json({ error: "Telefon ve kod gerekli" }, { status: 400 });
  }

  const row = await prisma.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });

  if (!row || row.attempts >= 5) {
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş" }, { status: 400 });
  }

  const got = Buffer.from(createHash("sha256").update(String(code)).digest("hex"));
  const expected = Buffer.from(row.codeHash);
  const valid = got.length === expected.length && timingSafeEqual(got, expected);

  if (!valid) {
    await prisma.otpCode.update({
      where: { id: row.id },
      data: {
        attempts: { increment: 1 },
        ...(row.attempts >= 4 ? { usedAt: new Date() } : {})
      }
    });
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş" }, { status: 400 });
  }

  const authUser = await currentUser();

  // Mark OTP code as used
  await prisma.otpCode.update({
    where: { id: row.id },
    data: {
      usedAt: new Date(),
      userId: authUser?.id ?? row.userId ?? null
    }
  });

  // Flow 1: Phone Login
  if (login) {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Alumas Kullanıcısı ${phone.slice(-4)}`,
          email: `phone-${Date.now()}@alumas.local`,
          phone,
          role: "PATIENT"
        }
      });
    }
    await createSession(user.id);
    await audit({
      actorUserId: user.id,
      action: "auth.otp_login",
      entityType: "User",
      entityId: user.id,
      req
    });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role }
    });
  }

  // Flow 2: Authenticated user verifying / updating phone on profile
  if (authUser) {
    const existingWithPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingWithPhone && existingWithPhone.id !== authUser.id) {
      return NextResponse.json(
        { error: "Bu telefon numarası başka bir hesap tarafından kullanılıyor." },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { phone },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });

    await audit({
      actorUserId: authUser.id,
      action: "auth.phone_verify",
      entityType: "User",
      entityId: authUser.id,
      metadata: { phoneTail: phone.slice(-4) },
      req
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      phone,
      user: updated
    });
  }

  // Flow 3: Standalone OTP verification
  return NextResponse.json({ ok: true, verified: true, phone });
}

