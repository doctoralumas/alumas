import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/fcm";
import { homeCareTitle, homeVisitStatusLabel, isLegacyHomeRequest } from "@/lib/home-care";

async function managedOrganization(id: string, user: { id: string; role: string }) {
  return prisma.organization.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id },
    select: { id: true, type: true },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (org.type !== "HOSPITAL" && org.type !== "CLINIC" && org.type !== "LABORATORY") {
    return NextResponse.json([]);
  }
  const rows = await prisma.homeCareRequest.findMany({
    where: { organizationId: id },
    include: {
      user: { select: { name: true } },
      service: { select: { name: true } },
      laboratoryTest: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(rows.filter((row) => !isLegacyHomeRequest(row)).map((row) => ({
    id: row.id,
    patientName: row.user.name,
    title: homeCareTitle(row.serviceType),
    detail: row.service?.name || row.laboratoryTest?.name || "",
    city: row.city,
    district: row.district,
    addressNote: row.addressNote,
    preferredAt: row.preferredAt,
    note: row.note,
    status: row.status,
    statusLabel: homeVisitStatusLabel(row.status, false),
  })));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const next = String(body?.status || "");
  if (!["ACCEPTED", "DECLINED", "COMPLETED"].includes(next)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }
  const row = await prisma.homeCareRequest.findFirst({ where: { id: String(body?.requestId || ""), organizationId: id } });
  if (!row || isLegacyHomeRequest(row)) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  const allowed = (row.status === "REQUESTED" && (next === "ACCEPTED" || next === "DECLINED"))
    || (row.status === "ACCEPTED" && next === "COMPLETED");
  if (!allowed) return NextResponse.json({ error: "Bu talep bu duruma geçemez." }, { status: 409 });
  const updated = await prisma.homeCareRequest.update({ where: { id: row.id }, data: { status: next } });
  const label = homeVisitStatusLabel(next, false);
  await notifyUser(row.userId, "Evde hizmet talebi", `${homeCareTitle(row.serviceType)}: ${label}`, "home_care", { requestId: row.id }).catch(() => {});
  return NextResponse.json({ ...updated, statusLabel: label });
}
