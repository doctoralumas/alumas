import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const item = await prisma.directoryDoctor.findUnique({
    where: { id },
    include: {
      doctor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      claims: {
        include: {
          claimant: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Dizin hekimi bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: item });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.directoryDoctor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Dizin hekimi bulunamadı" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof body.name === "string" && body.name.trim()) updateData.name = body.name.trim();
  if (typeof body.title === "string") updateData.title = body.title.trim();
  if (typeof body.specialty === "string" && body.specialty.trim()) updateData.specialty = body.specialty.trim();
  if (typeof body.city === "string" && body.city.trim()) updateData.city = body.city.trim();
  if (body.hospital !== undefined) updateData.hospital = body.hospital ? String(body.hospital).trim() : null;
  if (body.district !== undefined) updateData.district = body.district ? String(body.district).trim() : null;
  if (body.address !== undefined) updateData.address = body.address ? String(body.address).trim() : null;
  if (body.phone !== undefined) updateData.phone = body.phone ? String(body.phone).trim() : null;
  if (body.officialWebsite !== undefined) updateData.officialWebsite = body.officialWebsite ? String(body.officialWebsite).trim() : null;
  if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null;
  if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

  updateData.lastVerifiedAt = new Date();

  const updated = await prisma.directoryDoctor.update({
    where: { id },
    data: updateData,
  });

  await audit({
    actorUserId: admin.id,
    action: "directory_doctor.updated",
    entityType: "DirectoryDoctor",
    entityId: id,
    metadata: {
      changes: updateData,
      reason: body.reason || "Admin directory doctor update",
      previous: {
        name: existing.name,
        specialty: existing.specialty,
        city: existing.city,
        hospital: existing.hospital,
        isActive: existing.isActive,
      },
    },
    req,
  });

  return NextResponse.json({ ok: true, data: updated });
}
