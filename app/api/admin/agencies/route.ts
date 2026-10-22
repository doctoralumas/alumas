import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approvalBlockReason, withdrawExpiredCredentials } from "@/lib/verification-documents";
import { audit } from "@/lib/audit";

async function ok() {
  const u = await currentUser();
  return u?.role === "ADMIN" ? u : null;
}

export async function GET(req: Request) {
  const admin = await ok();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await withdrawExpiredCredentials();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status")?.trim() || "";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { owner: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  const rows = await prisma.healthTourismAgency.findMany({
    where,
    include: {
      owner: { select: { name: true, email: true } },
      verificationDocuments: { orderBy: { createdAt: "desc" } },
      _count: { select: { packages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const admin = await ok();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const approved = !!b.approved;
  if (approved) {
    const documents = await prisma.verificationDocument.findMany({ where: { agencyId: String(b.id) } });
    const block = approvalBlockReason("agency", null, documents);
    if (block) return NextResponse.json({ error: block }, { status: 400 });
  }

  const a = await prisma.healthTourismAgency.update({
    where: { id: String(b.id) },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      isVerified: approved,
      isActive: approved,
    },
  });

  await prisma.healthTourismPackage.updateMany({
    where: { agencyId: a.id },
    data: { isPublished: approved },
  });

  await audit({
    actorUserId: admin.id,
    action: approved ? "agency.approved" : "agency.rejected",
    entityType: "HealthTourismAgency",
    entityId: a.id,
    metadata: { status: a.status, isVerified: approved, isActive: approved },
    req,
  });

  return NextResponse.json(a);
}

export async function DELETE(req: Request) {
  const admin = await ok();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const agency = await prisma.healthTourismAgency.findUnique({
    where: { id },
    include: { _count: { select: { packages: true } } },
  });

  if (!agency) return NextResponse.json({ error: "Acente bulunamadı" }, { status: 404 });

  if (agency._count.packages > 0) {
    return NextResponse.json(
      {
        error: "Bu acente kayıtlı sağlık turizmi paketlerine sahip olduğu için silinemez. Durumu REJECTED veya pasif yapınız.",
        code: "HAS_DEPENDENCIES",
      },
      { status: 400 }
    );
  }

  await prisma.verificationDocument.deleteMany({ where: { agencyId: id } });
  await prisma.healthTourismAgency.delete({ where: { id } });

  await audit({
    actorUserId: admin.id,
    action: "agency.deleted",
    entityType: "HealthTourismAgency",
    entityId: id,
    metadata: { name: agency.name, city: agency.city },
    req,
  });

  return NextResponse.json({ ok: true, message: "Acente kaydı güvenle silindi." });
}
