import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { currentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { normalizeEmail, passwordPolicy } from "@/lib/security";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const body = await req.json();
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();
  const password = body.password ? String(body.password) : undefined;
  const currentPassword = body.currentPassword ? String(body.currentPassword) : undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
  }

  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Lütfen 6 haneli doğrulama kodunu giriniz." }, { status: 400 });
  }

  // Cross-account conflict safety check
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== u.id) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten başka bir hesaba kayıtlı." }, { status: 409 });
  }

  // Reauthentication: existing password accounts must provide currentPassword
  if (u.passwordHash) {
    if (!currentPassword || !verifyPassword(currentPassword, u.passwordHash)) {
      return NextResponse.json({ error: "Mevcut şifreniz hatalı veya girilmedi." }, { status: 403 });
    }
  }

  const emailIdentifier = `email:${email}`;
  const row = await prisma.otpCode.findFirst({
    where: {
      phone: emailIdentifier,
      userId: u.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row || row.attempts >= 5) {
    return NextResponse.json({ error: "Doğrulama kodu geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  const got = Buffer.from(createHash("sha256").update(code).digest("hex"));
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
    return NextResponse.json({ error: "Doğrulama kodu geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  // ATOMIC CONSUMPTION: Single-use consumption preventing replay & concurrency
  const consumed = await prisma.otpCode.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (consumed.count === 0) {
    return NextResponse.json({ error: "Bu kod zaten kullanılmış." }, { status: 400 });
  }

  let newPasswordHash: string | undefined = undefined;
  if (password) {
    const policyErr = passwordPolicy(password);
    if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });
    newPasswordHash = hashPassword(password);
  }

  // Link verified email to the EXACT SAME CANONICAL USER ID
  const updated = await prisma.user.update({
    where: { id: u.id },
    data: {
      email,
      ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
    },
  });

  await audit({
    actorUserId: u.id,
    action: "account.email_link_verified",
    entityType: "User",
    entityId: u.id,
    metadata: { linkedEmail: email, hadPassword: Boolean(u.passwordHash), setPassword: Boolean(newPasswordHash) },
    req,
  });

  return NextResponse.json({
    ok: true,
    message: "E-posta adresiniz başarıyla doğrulandı ve hesabınıza bağlandı.",
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      hasPassword: Boolean(updated.passwordHash),
    },
  });
}

