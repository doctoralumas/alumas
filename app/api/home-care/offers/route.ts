import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClinicHomeKind, publishedOrganizationWhere, sameCity } from "@/lib/home-care";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const url = new URL(req.url);
  const kind = String(url.searchParams.get("kind") || "");
  const city = String(url.searchParams.get("city") || "").trim();
  if (!city) return NextResponse.json({ error: "Şehir gerekli" }, { status: 400 });
  const now = new Date();

  if (kind === "doctor") {
    const prior = await prisma.appointment.findMany({
      where: { userId: user.id, status: { not: "cancelled" } },
      select: { doctorId: true },
      distinct: ["doctorId"],
    });
    const priorIds = new Set(prior.map((row) => row.doctorId));
    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true,
        isPublished: true,
        verificationDocuments: { none: { status: "APPROVED", expiresAt: { lt: now } } },
        availabilities: { some: { type: "home", isActive: true, startsAt: { gte: now } } },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        specialty: true,
        city: true,
        price: true,
        availabilities: {
          where: { type: "home", isActive: true, startsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 12,
          select: { startsAt: true },
        },
        appointments: {
          where: { status: { not: "cancelled" }, startsAt: { gte: now } },
          select: { startsAt: true },
        },
      },
    });
    const offers = doctors.filter((doctor) => sameCity(doctor.city, city)).flatMap((doctor) => {
      const busy = new Set(doctor.appointments.map((row) => row.startsAt.toISOString()));
      const slots = doctor.availabilities.filter((slot) => !busy.has(slot.startsAt.toISOString())).slice(0, 8);
      if (!slots.length) return [];
      return [{
        id: doctor.slug,
        providerName: doctor.name,
        detail: doctor.specialty,
        city: doctor.city,
        price: doctor.price,
        prior: priorIds.has(doctor.id),
        slots: slots.map((slot) => ({ startsAt: slot.startsAt.toISOString() })),
      }];
    }).sort((a, b) => Number(b.prior) - Number(a.prior));
    return NextResponse.json({ kind, city, offers });
  }

  if (isClinicHomeKind(kind)) {
    const services = await prisma.organizationService.findMany({
      where: {
        isActive: true,
        atHome: true,
        homeCareKind: kind,
        organization: { ...publishedOrganizationWhere(), type: { in: ["HOSPITAL", "CLINIC"] } },
      },
      select: {
        id: true,
        name: true,
        price: true,
        organization: { select: { id: true, name: true, city: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      kind,
      city,
      offers: services.filter((service) => sameCity(service.organization.city, city)).map((service) => ({
        id: service.id,
        providerName: service.organization.name,
        detail: service.name,
        city: service.organization.city,
        price: service.price,
        organizationId: service.organization.id,
        serviceId: service.id,
      })),
    });
  }

  if (kind === "blood") {
    const tests = await prisma.laboratoryTest.findMany({
      where: {
        isActive: true,
        homeCollection: true,
        organization: { ...publishedOrganizationWhere(), type: "LABORATORY" },
      },
      select: {
        id: true,
        name: true,
        sampleType: true,
        price: true,
        organization: { select: { id: true, name: true, city: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      kind,
      city,
      offers: tests.filter((test) => sameCity(test.organization.city, city)).map((test) => ({
        id: test.id,
        providerName: test.organization.name,
        detail: test.name,
        city: test.organization.city,
        price: test.price,
        organizationId: test.organization.id,
        laboratoryTestId: test.id,
        sampleType: test.sampleType,
      })),
    });
  }

  return NextResponse.json({ error: "Hizmet türü geçersiz" }, { status: 400 });
}
