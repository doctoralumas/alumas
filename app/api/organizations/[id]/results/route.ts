import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imagingModalityLabel, labCategoryLabel, organizationAllows } from "@/lib/organization-capabilities";

async function managedOrganization(id: string, user: { id: string; role: string }) {
  return prisma.organization.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id },
  });
}

async function linkedPatients(organizationId: string, ownerUserId: string) {
  const [messages, appointments] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: ownerUserId }, { recipientId: ownerUserId }] },
      select: { senderId: true, recipientId: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.appointment.findMany({
      where: {
        status: { not: "cancelled" },
        OR: [{ organizationId }, { doctor: { organizationId } }],
      },
      select: { userId: true },
      take: 300,
    }),
  ]);
  const ids = new Set<string>();
  for (const message of messages) {
    const other = message.senderId === ownerUserId ? message.recipientId : message.senderId;
    if (other !== ownerUserId) ids.add(other);
  }
  for (const appointment of appointments) ids.add(appointment.userId);
  if (!ids.size) return [];
  return prisma.user.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

function numberOrNull(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "imaging") && !organizationAllows(org.type, "laboratory")) {
    return NextResponse.json({ error: "Sonuç iletimi bu kurum tipinde kullanılmıyor." }, { status: 400 });
  }
  return NextResponse.json({ patients: await linkedPatients(org.id, org.ownerUserId) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const patientId = String(body.patientId || "");
  const patients = await linkedPatients(org.id, org.ownerUserId);
  const patient = patients.find((item) => item.id === patientId);
  if (!patient) {
    return NextResponse.json({ error: "Sonuç yalnızca bu kurumla mesajı veya randevusu olan hastaya işlenir." }, { status: 403 });
  }

  if (organizationAllows(org.type, "imaging")) {
    const exam = await prisma.imagingExam.findFirst({
      where: { id: String(body.catalogId || ""), organizationId: org.id, isActive: true },
    });
    if (!exam) return NextResponse.json({ error: "Kataloğundan bir tetkik seçin." }, { status: 400 });
    const reportText = String(body.reportText || "").trim();
    if (reportText.length < 2) return NextResponse.json({ error: "Rapor metni gerekli." }, { status: 400 });
    const performedAt = body.performedAt ? new Date(body.performedAt) : new Date();
    if (!Number.isFinite(performedAt.getTime())) return NextResponse.json({ error: "Çekim tarihini kontrol edin." }, { status: 400 });
    const row = await prisma.imagingResult.create({
      data: {
        userId: patient.id,
        title: exam.name.slice(0, 160),
        modality: imagingModalityLabel(exam.modality).slice(0, 80),
        bodyPart: exam.bodyRegion,
        provider: org.name.slice(0, 160),
        reportText: reportText.slice(0, 8000),
        impression: body.impression ? String(body.impression).slice(0, 2000) : null,
        performedAt,
      },
    });
    await prisma.notification.create({
      data: {
        userId: patient.id,
        title: "Yeni görüntüleme sonucu",
        body: `${org.name}: ${exam.name}`,
        kind: "imaging_result",
      },
    });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  }

  if (organizationAllows(org.type, "laboratory")) {
    const test = await prisma.laboratoryTest.findFirst({
      where: { id: String(body.catalogId || ""), organizationId: org.id, isActive: true },
    });
    if (!test) return NextResponse.json({ error: "Kataloğundan bir tahlil seçin." }, { status: 400 });
    if (body.value == null || String(body.value).trim() === "") {
      return NextResponse.json({ error: "Sonuç değeri gerekli." }, { status: 400 });
    }
    const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();
    if (!Number.isFinite(measuredAt.getTime())) return NextResponse.json({ error: "Numune tarihini kontrol edin." }, { status: 400 });
    const numericValue = numberOrNull(body.value);
    const referenceLow = numberOrNull(body.referenceLow);
    const referenceHigh = numberOrNull(body.referenceHigh);
    let status = "normal";
    if (numericValue != null) {
      if (referenceLow != null && numericValue < referenceLow) status = "low";
      else if (referenceHigh != null && numericValue > referenceHigh) status = "high";
    }
    const row = await prisma.labResult.create({
      data: {
        userId: patient.id,
        testName: test.name.slice(0, 120),
        normalizedName: test.name.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").slice(0, 120),
        panel: labCategoryLabel(test.category).slice(0, 120),
        value: String(body.value).trim().slice(0, 80),
        numericValue,
        unit: body.unit ? String(body.unit).slice(0, 40) : null,
        reference: body.reference ? String(body.reference).slice(0, 100) : null,
        referenceLow,
        referenceHigh,
        status,
        provider: org.name.slice(0, 160),
        measuredAt,
      },
    });
    await prisma.notification.create({
      data: {
        userId: patient.id,
        title: "Yeni tahlil sonucu",
        body: `${org.name}: ${test.name}`,
        kind: "lab_result",
      },
    });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  }

  return NextResponse.json({ error: "Sonuç iletimi bu kurum tipinde kullanılmıyor." }, { status: 400 });
}
