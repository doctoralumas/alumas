import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import {
  CAPABILITY_DENIED,
  organizationAllows,
} from "@/lib/organization-capabilities";
import { sendEmail } from "@/lib/email";

async function orgForManager(id: string, u: any) {
  return prisma.organization.findFirst({
    where: u.role === "ADMIN" ? { id } : { id, ownerUserId: u.id },
  });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  if (!(await orgForManager(id, u)))
    return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  return NextResponse.json(
    await prisma.organizationDoctorInvite.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await orgForManager(id, u);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "doctors"))
    return NextResponse.json(
      { error: CAPABILITY_DENIED.doctors },
      { status: 400 }
    );

  const b = await req.json();
  const email = String(b.email || "")
    .trim()
    .toLowerCase();
  if (!email)
    return NextResponse.json(
      { error: "Doktor e-postası gerekli" },
      { status: 400 }
    );

  const doctorUser = await prisma.user.findUnique({
    where: { email },
    include: { doctorProfile: true },
  });
  if (doctorUser && doctorUser.role !== "DOCTOR")
    return NextResponse.json(
      { error: "Bu e-posta doktor hesabına ait değil" },
      { status: 400 }
    );
  if (doctorUser?.doctorProfile?.organizationId === id)
    return NextResponse.json(
      { error: "Doktor zaten bu kuruma bağlı" },
      { status: 409 }
    );

  const existing = await prisma.organizationDoctorInvite.findFirst({
    where: { organizationId: id, email, status: "PENDING" },
  });
  if (existing)
    return NextResponse.json(
      { error: "Bu doktora bekleyen davet zaten var" },
      { status: 409 }
    );

  const row = await prisma.organizationDoctorInvite.create({
    data: {
      organizationId: id,
      email,
      specialty: b.specialty || doctorUser?.doctorProfile?.specialty || null,
      doctorId: doctorUser?.doctorProfile?.id || null,
      doctorUserId: doctorUser?.id || null,
      invitedById: u.id,
    },
  });

  await audit({
    actorUserId: u.id,
    action: "organization.doctor_invite",
    entityType: "OrganizationDoctorInvite",
    entityId: row.id,
    metadata: { organizationId: id, email },
    req,
  });

  // E-posta Gönderimi
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alumas.com";
  const htmlContent =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #f8fafc;">' +
    '<div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #0f172a; margin: 0;">Alumas Sağlık</h1></div>' +
    '<div style="background-color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">' +
    '<h2 style="color: #0f172a; margin-top: 0;">Kurumsal Kadro Daveti</h2>' +
    '<p style="color: #475569; font-size: 16px; line-height: 1.6;">Sayın Hekimimiz,<br/><br/><strong>' +
    org.name +
    "</strong> (" +
    org.city +
    ") bünyesindeki doktor kadrosuna katılmanız için size bir davet gönderdi.</p>" +
    '<p style="color: #475569; font-size: 16px; line-height: 1.6;">Bu daveti kabul ettiğinizde, profiliniz kurumun sayfası altında listelenecek ve kurumun sağladığı dijital altyapıyı kullanabileceksiniz.</p>' +
    '<div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">' +
    '<a href="' +
    appUrl +
    '/doctor" style="display: inline-block; background-color: #0284c7; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 100px; font-weight: bold; font-size: 16px;">Daveti Görüntüle ve Yanıtla</a>' +
    "</div>" +
    '<p style="color: #94a3b8; font-size: 14px; text-align: center;">Eğer henüz Alumas doktor hesabınız yoksa, daveti kabul etmek için aynı e-posta adresiyle ücretsiz doktor profili oluşturabilirsiniz.</p>' +
    "</div></div>";

  try {
    await sendEmail({
      to: email,
      subject: org.name + " - Kadro Daveti (Alumas)",
      html: htmlContent,
    });
  } catch (err) {
    console.error("Doktor davet e-postası gönderilemedi:", err);
  }

  return NextResponse.json(row, { status: 201 });
}
