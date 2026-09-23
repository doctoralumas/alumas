import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { CAPABILITY_DENIED, organizationAllows } from "@/lib/organization-capabilities";

const KINDS = new Set(["EMERGENCY_DEPARTMENT", "EMERGENCY_CONSULT", "AMBULANCE_COORDINATION", "EMERGENCY"]);

async function managed(id: string, user: { id: string; role: string }) {
  return prisma.organization.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managed(id, user);
  if (!org) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  if (!organizationAllows(org.type, "emergency")) return NextResponse.json({ error: CAPABILITY_DENIED.emergency }, { status: 400 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Acil hizmet adı gerekli" }, { status: 400 });
  const kind = KINDS.has(String(body.kind)) ? String(body.kind) : "EMERGENCY_DEPARTMENT";
  return NextResponse.json(await prisma.organizationEmergencyService.create({
    data: {
      organizationId: id,
      name,
      kind,
      phone: body.phone || null,
      is24Hours: !!body.is24Hours,
      description: body.description || null,
    },
  }), { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managed(id, user);
  if (!org) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  if (!organizationAllows(org.type, "emergency")) return NextResponse.json({ error: CAPABILITY_DENIED.emergency }, { status: 400 });
  const body = await req.json();
  const row = await prisma.organizationEmergencyService.findFirst({
    where: { id: String(body.emergencyId || ""), organizationId: id },
  });
  if (!row) return NextResponse.json({ error: "Acil hizmet bulunamadı" }, { status: 404 });
  const kind = body.kind === undefined ? undefined : (KINDS.has(String(body.kind)) ? String(body.kind) : row.kind);
  return NextResponse.json(await prisma.organizationEmergencyService.update({
    where: { id: row.id },
    data: {
      name: body.name ? String(body.name).trim() : undefined,
      kind,
      phone: body.phone === undefined ? undefined : (body.phone || null),
      is24Hours: body.is24Hours === undefined ? undefined : !!body.is24Hours,
      description: body.description === undefined ? undefined : (body.description || null),
      isActive: body.isActive === undefined ? undefined : !!body.isActive,
    },
  }));
}
