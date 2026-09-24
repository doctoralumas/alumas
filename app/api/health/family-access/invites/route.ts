import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/fcm";
import { sendEmail } from "@/lib/email";

const allowed = new Set([
  "VIEW",
  "APPOINTMENTS",
  "REMINDERS",
  "VACCINATIONS",
  "GROWTH",
  "EDIT_PROFILE",
]);

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const sent = await prisma.familyProfileInvite.findMany({
    where: { senderId: u.id },
    include: { profile: true, recipient: true },
    orderBy: { createdAt: "desc" },
  });
  const received = await prisma.familyProfileInvite.findMany({
    where: {
      OR: [{ recipientUserId: u.id }, { recipientEmail: u.email }],
      status: "PENDING",
    },
    include: { profile: true, sender: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ sent, received });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const b = await req.json();
  const profile = await prisma.specialHealthProfile.findFirst({
    where: { id: String(b.specialProfileId || ""), userId: u.id },
  });
  if (!profile)
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const email = String(b.email || "")
    .trim()
    .toLowerCase();
  if (!email || email === u.email.toLowerCase())
    return NextResponse.json(
      { error: "Geçerli farklı bir e-posta gerekli" },
      { status: 400 }
    );

  const permissions = Array.isArray(b.permissions)
    ? b.permissions.map(String).filter((x: string) => allowed.has(x))
    : ["VIEW"];
  if (!permissions.includes("VIEW")) permissions.unshift("VIEW");

  const recipient = await prisma.user.findUnique({ where: { email } });

  const row = await prisma.familyProfileInvite.create({
    data: {
      specialProfileId: profile.id,
      senderId: u.id,
      recipientEmail: email,
      recipientUserId: recipient?.id || null,
      role: String(b.role || "CAREGIVER").slice(0, 40),
      permissions: [...new Set(permissions)] as string[],
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  // 1. Push Notification
  if (recipient) {
    await notifyUser(
      recipient.id,
      "Aile profili daveti",
      u.name + ", " + profile.name + " profiline erişim daveti gönderdi.",
      "family_invite",
      { inviteId: row.id }
    ).catch(() => {});
  }

  // 2. Email Gönderimi
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alumas.tr";
  const htmlContent =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc;">' +
    '<div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #0f172a; margin: 0;">Alumas Sağlık</h1></div>' +
    '<div style="background-color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">' +
    '<h2 style="color: #0f172a; margin-top: 0;">Aile Erişimi Daveti</h2>' +
    '<p style="color: #475569; font-size: 16px; line-height: 1.6;">Merhaba,<br/><br/><strong>' +
    u.name +
    "</strong> adlı kullanıcı, <strong>" +
    profile.name +
    "</strong> sağlık profiline erişebilmeniz için size bir davet gönderdi.</p>" +
    '<p style="color: #475569; font-size: 16px; line-height: 1.6;">Bu daveti kabul ettiğinizde, sağlık kayıtlarını görüntüleyebilir, randevuları takip edebilir ve belirlenen izinler dahilinde profili yönetebilirsiniz.</p>' +
    '<div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">' +
    '<a href="' +
    appUrl +
    '/health/family-access" style="display: inline-block; background-color: #0284c7; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-weight: bold; font-size: 16px;">Daveti Görüntüle ve Kabul Et</a>' +
    "</div>" +
    '<p style="color: #94a3b8; font-size: 14px; text-align: center;">Eğer Alumas hesabınız yoksa, daveti kabul etmek için aynı e-posta adresiyle ücretsiz hesap oluşturabilirsiniz.</p>' +
    "</div></div>";

  try {
    await sendEmail({
      to: email,
      subject: "Aile Sağlık Profili Daveti - Alumas",
      html: htmlContent,
    });
  } catch (err) {
    console.error("E-posta gönderim hatası:", err);
  }

  return NextResponse.json(row, { status: 201 });
}

