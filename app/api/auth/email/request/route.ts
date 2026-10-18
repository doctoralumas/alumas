import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { currentUser, verifyPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { normalizeEmail, requestIp, securityHash } from "@/lib/security";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const body = await req.json();
  const email = normalizeEmail(body.email);
  const currentPassword = body.currentPassword ? String(body.currentPassword) : undefined;

  if (!email || !email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
  }

  // Reject if email is already used by another user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== u.id) {
    return NextResponse.json({ error: "Bu e-posta adresi zaten başka bir hesaba kayıtlı." }, { status: 409 });
  }

  // Step-up / Reauthentication: If the user already has a password, require current password
  if (u.passwordHash) {
    if (!currentPassword || !verifyPassword(currentPassword, u.passwordHash)) {
      return NextResponse.json({ error: "Mevcut şifreniz hatalı veya girilmedi." }, { status: 403 });
    }
  }

  // Rate limiting: max 5 requests per 10 minutes for this email
  const since = new Date(Date.now() - 10 * 60_000);
  const emailIdentifier = `email:${email}`;
  const ipHash = securityHash(requestIp(req));
  const recent = await prisma.otpCode.count({
    where: { phone: emailIdentifier, createdAt: { gt: since } },
  });

  if (recent >= 5) {
    return NextResponse.json({ error: "Çok fazla kod talep edildi. Lütfen 10 dakika sonra tekrar deneyin." }, { status: 429 });
  }

  // Invalidate previous unused codes for this email
  await prisma.otpCode.updateMany({
    where: { phone: emailIdentifier, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const code = String(randomInt(100000, 1000000));
  const codeHash = createHash("sha256").update(code).digest("hex");

  await prisma.otpCode.create({
    data: {
      userId: u.id,
      phone: emailIdentifier,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60_000), // 15 min expiry
    },
  });

  try {
    await sendEmail({
      to: email,
      subject: "ALUMAS — E-posta Doğrulama Kodu",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; borderRadius: 12px;">
          <h2 style="color: #0f172a; margin-top: 0;">ALUMAS E-posta Doğrulama</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            Merhaba <strong>${u.name}</strong>,
          </p>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">
            ALUMAS hesabınıza bu e-posta adresini bağlamak için doğrulama kodunuz:
          </p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0284c7; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px;">
            Bu kod 15 dakika boyunca geçerlidir. Bu işlemi siz başlatmadıysanız lütfen bu e-postayı dikkate almayınız.
          </p>
        </div>
      `,
    });

    await audit({
      actorUserId: u.id,
      action: "otp.email_request",
      entityType: "email",
      entityId: email,
      req,
    });

    const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
    return NextResponse.json({
      ok: true,
      message: "Doğrulama kodu e-posta adresinize gönderildi.",
      ...(!isProduction ? { devCode: code } : {}),
    });
  } catch (err: any) {
    await audit({
      actorUserId: u.id,
      action: "otp.email_request",
      entityType: "email",
      entityId: email,
      outcome: "failed",
      metadata: { error: err.message },
      req,
    });
    return NextResponse.json({ error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyiniz." }, { status: 502 });
  }
}

