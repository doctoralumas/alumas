import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/fcm";
import { homeCareTitle, homeVisitStatusLabel, isClinicHomeKind, isLegacyHomeRequest, parsePreferredAt, publishedOrganizationWhere, sameCity } from "@/lib/home-care";

function presentVisit(row: {
  id: string;
  serviceType: string;
  city: string;
  district: string | null;
  addressNote: string | null;
  preferredAt: Date | null;
  note: string | null;
  status: string;
  organizationId: string | null;
  serviceId: string | null;
  laboratoryTestId: string | null;
  createdAt: Date;
  organization?: { name: string } | null;
  service?: { name: string } | null;
  laboratoryTest?: { name: string } | null;
}) {
  const legacy = isLegacyHomeRequest(row);
  return {
    id: row.id,
    serviceType: row.serviceType,
    title: legacy ? row.serviceType : homeCareTitle(row.serviceType),
    city: row.city,
    district: row.district,
    addressNote: row.addressNote,
    preferredAt: row.preferredAt,
    note: row.note,
    status: row.status,
    legacy,
    statusLabel: homeVisitStatusLabel(row.status, legacy),
    providerName: row.organization?.name || null,
    detail: row.service?.name || row.laboratoryTest?.name || null,
    createdAt: row.createdAt,
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const [rows, homeAppointments] = await Promise.all([
    prisma.homeCareRequest.findMany({
      where: { userId: user.id },
      include: {
        organization: { select: { name: true } },
        service: { select: { name: true } },
        laboratoryTest: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      where: { userId: user.id, type: "home" },
      include: { doctor: { select: { name: true, specialty: true, slug: true } } },
      orderBy: { startsAt: "desc" },
      take: 20,
    }),
  ]);
  const visits = rows.filter((row) => !isLegacyHomeRequest(row)).map(presentVisit);
  const legacy = rows.filter((row) => isLegacyHomeRequest(row)).map(presentVisit);
  return NextResponse.json({
    visits,
    legacy,
    homeAppointments: homeAppointments.map((row) => ({
      id: row.id,
      doctorName: row.doctor.name,
      specialty: row.doctor.specialty,
      doctorId: row.doctor.slug,
      startsAt: row.startsAt,
      status: row.status,
      visitCity: row.visitCity,
      visitDistrict: row.visitDistrict,
      visitAddress: row.visitAddress,
    })),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  if (user.role !== "PATIENT" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Bu hesap tipi evde hizmet talebi oluşturamaz." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  const kind = String(body.kind || "");
  const city = String(body.city || "").trim();
  const district = String(body.district || "").trim();
  const addressNote = String(body.addressNote || "").trim();
  const note = String(body.note || "").trim();
  const preferredAt = parsePreferredAt(body.preferredAt);
  if (!city || !district || !addressNote || !preferredAt || Number.isNaN(preferredAt.getTime())) {
    return NextResponse.json({ error: "Şehir, ilçe, adres ve tercih edilen zaman gerekli." }, { status: 400 });
  }

  if (isClinicHomeKind(kind)) {
    const service = await prisma.organizationService.findFirst({
      where: {
        id: String(body.serviceId || ""),
        isActive: true,
        atHome: true,
        homeCareKind: kind,
        organization: { ...publishedOrganizationWhere(), type: { in: ["HOSPITAL", "CLINIC"] } },
      },
      include: { organization: { select: { id: true, name: true, ownerUserId: true, city: true } } },
    });
    if (!service || !sameCity(service.organization.city, city)) return NextResponse.json({ error: "Bu şehirde seçilen evde hizmet yayında değil." }, { status: 404 });
    const row = await prisma.homeCareRequest.create({
      data: {
        userId: user.id,
        serviceType: kind,
        city: service.organization.city,
        district,
        addressNote,
        preferredAt,
        note: note || null,
        status: "REQUESTED",
        organizationId: service.organization.id,
        serviceId: service.id,
      },
    });
    await notifyUser(service.organization.ownerUserId, "Evde hizmet talebi", `${homeCareTitle(kind)} · ${service.name}`, "home_care", { requestId: row.id }).catch(() => {});
    return NextResponse.json(row, { status: 201 });
  }

  if (kind === "blood") {
    const test = await prisma.laboratoryTest.findFirst({
      where: {
        id: String(body.laboratoryTestId || ""),
        isActive: true,
        homeCollection: true,
        organization: { ...publishedOrganizationWhere(), type: "LABORATORY" },
      },
      include: { organization: { select: { id: true, name: true, ownerUserId: true, city: true } } },
    });
    if (!test || !sameCity(test.organization.city, city)) return NextResponse.json({ error: "Bu şehirde seçilen evde numune tahlili yayında değil." }, { status: 404 });
    const row = await prisma.homeCareRequest.create({
      data: {
        userId: user.id,
        serviceType: "blood",
        city: test.organization.city,
        district,
        addressNote,
        preferredAt,
        note: note || null,
        status: "REQUESTED",
        organizationId: test.organization.id,
        laboratoryTestId: test.id,
      },
    });
    await notifyUser(test.organization.ownerUserId, "Evde numune talebi", test.name, "home_care", { requestId: row.id }).catch(() => {});
    return NextResponse.json(row, { status: 201 });
  }

  return NextResponse.json({ error: "Doktor ziyareti randevu saatiyle alınır." }, { status: 400 });
}
