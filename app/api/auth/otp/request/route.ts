import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { audit } from "@/lib/audit";
import { getPhoneLookupVariants, isValidPhone, normalizePhone, requestIp, securityHash } from "@/lib/security";
import { currentUser, findUserByPhone } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const phone = normalizePhone(body.phone);
  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: "Geçerli bir telefon numarası giriniz." }, { status: 400 });
  }

  const authUser = await currentUser();

  // If user is authenticated, prevent taking a phone already bound to another account
  if (authUser) {
    const existing = await findUserByPhone(phone);
    if (existing && existing.id !== authUser.id) {
      return NextResponse.json(
        { error: "Bu telefon numarası başka bir hesap tarafından kullanılıyor." },
        { status: 409 }
      );
    }
  }

  const variants = getPhoneLookupVariants(phone);
  const since = new Date(Date.now() - 10 * 60_000);
  const ipHash = securityHash(requestIp(req));
  const [recent, ipRecent] = await Promise.all([
    prisma.otpCode.count({ where: { phone: { in: variants }, createdAt: { gt: since } } }),
    ipHash ? prisma.auditLog.count({ where: { action: "otp.request", ipHash, createdAt: { gt: since } } }) : Promise.resolve(0)
  ]);

  if (recent >= 5 || ipRecent >= 20) {
    return NextResponse.json({ error: "Çok fazla kod istendi. Daha sonra tekrar deneyin." }, { status: 429 });
  }

  await prisma.otpCode.updateMany({
    where: { phone: { in: variants }, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() }
  });

  const code = String(randomInt(100000, 1000000));
  await prisma.otpCode.create({
    data: {
      userId: authUser?.id ?? null,
      phone,
      codeHash: createHash("sha256").update(code).digest("hex"),
      expiresAt: new Date(Date.now() + 3 * 60000)
    }
  });

  try {
    await sendSms(phone, `Almasdent bünyesindeki Alumas için doğrulama kodunuz: ${code}. Kodunuz 3 dakika geçerlidir.`);
    await audit({
      actorUserId: authUser?.id ?? null,
      action: "otp.request",
      entityType: "phone",
      entityId: phone.slice(-4),
      req
    });
    return NextResponse.json({
      ok: true,
      ...(process.env.SMS_PROVIDER !== "twilio" && process.env.SMS_PROVIDER !== "iletimerkezi" && process.env.NODE_ENV !== "production"
        ? { devCode: code }
        : {})
    });
  } catch (e: any) {
    await audit({
      actorUserId: authUser?.id ?? null,
      action: "otp.request",
      entityType: "phone",
      entityId: phone.slice(-4),
      outcome: "failed",
      metadata: { reason: e.message },
      req
    });
    return NextResponse.json({ error: "SMS gönderilemedi" }, { status: 502 });
  }
}

