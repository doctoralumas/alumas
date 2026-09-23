import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CAPABILITY_DENIED, organizationAllows } from "@/lib/organization-capabilities";
import { isClinicHomeKind } from "@/lib/home-care";

function serviceFields(body: any, existing?: { atHome: boolean; homeCareKind: string | null }) {
  const name = body.name == null ? undefined : String(body.name).trim();
  const description = body.description === undefined ? undefined : (body.description || null);
  const price = body.price === undefined ? undefined : (body.price === "" || body.price == null ? null : Number(body.price));
  const atHome = body.homeCareKind === undefined && body.atHome === undefined
    ? undefined
    : isClinicHomeKind(String(body.homeCareKind || ""));
  if (atHome === false && body.homeCareKind && String(body.homeCareKind).trim()) {
    return { error: "Evde hizmet türü hemşirelik, pansuman veya fizyoterapi olmalı." };
  }
  const homeCareKind = atHome === undefined ? undefined : (atHome ? String(body.homeCareKind) : null);
  if (existing && atHome === true && !homeCareKind) {
    return { error: "Evde sunulan hizmetin türünü seçin." };
  }
  return { data: { name: name || undefined, description, price, ...(atHome === undefined ? {} : { atHome, homeCareKind }) } };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await prisma.organizationService.findMany({ where: { organizationId: id, isActive: true }, orderBy: { name: "asc" } }));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await prisma.organization.findFirst({ where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id } });
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "services")) return NextResponse.json({ error: CAPABILITY_DENIED.services }, { status: 400 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Hizmet adı gerekli" }, { status: 400 });
  const parsed = serviceFields(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await prisma.organizationService.create({
    data: {
      organizationId: id,
      name: String(body.name),
      description: parsed.data.description ?? null,
      price: parsed.data.price ?? null,
      atHome: parsed.data.atHome ?? false,
      homeCareKind: parsed.data.homeCareKind ?? null,
    },
  }), { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await prisma.organization.findFirst({ where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id } });
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "services")) return NextResponse.json({ error: CAPABILITY_DENIED.services }, { status: 400 });
  const body = await req.json();
  if (!body.serviceId) return NextResponse.json({ error: "serviceId gerekli" }, { status: 400 });
  const exists = await prisma.organizationService.findFirst({ where: { id: String(body.serviceId), organizationId: id } });
  if (!exists) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  const parsed = serviceFields(body, exists);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await prisma.organizationService.update({
    where: { id: exists.id },
    data: {
      ...parsed.data,
      isActive: body.isActive === undefined ? undefined : !!body.isActive,
    },
  }));
}
