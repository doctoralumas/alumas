import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approvalBlockReason } from "@/lib/verification-documents";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const agency = await prisma.healthTourismAgency.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        packages: {
          select: {
            id: true,
            title: true,
            startingPrice: true,
            currency: true,
            isPublished: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        services: {
          select: {
            id: true,
            kind: true,
            title: true,
            price: true,
            currency: true,
            isActive: true,
          },
        },
        _count: { select: { packages: true, services: true } },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Acente bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: agency });
  } catch (error) {
    console.error("admin agency detail error", error);
    return NextResponse.json({ error: "Acente detayları yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.admin;

  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const existingAgency = await prisma.healthTourismAgency.findUnique({
    where: { id },
  });
  if (!existingAgency) {
    return NextResponse.json({ error: "Acente bulunamadı" }, { status: 404 });
  }

  // --- Administrative Field Editing Branch ---
  if (b.action === "EDIT" || (b.name && b.approved === undefined && !b.status)) {
    const name = String(b.name || "").trim();
    const city = b.city ? String(b.city).trim() : null;
    const phone = b.phone ? String(b.phone).trim() : null;
    const email = b.email ? String(b.email).trim() : null;
    const website = b.website ? String(b.website).trim() : null;
    const description = b.description !== undefined ? (b.description ? String(b.description).trim() : null) : undefined;
    const isActive = typeof b.isActive === "boolean" ? b.isActive : undefined;

    let languages: string[] | undefined = undefined;
    if (Array.isArray(b.languages)) {
      languages = b.languages.map((l: any) => String(l).trim()).filter(Boolean);
    } else if (typeof b.languages === "string") {
      languages = b.languages.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Geçerli bir acente adı giriniz (en az 2 karakter)." }, { status: 400 });
    }

    const updateData: any = {
      name,
      city,
      phone,
      email,
      website,
    };
    if (languages !== undefined) updateData.languages = languages;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.healthTourismAgency.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        _count: { select: { packages: true, services: true } },
      },
    });

    await audit({
      actorUserId: admin.id,
      action: "agency.updated",
      entityType: "HealthTourismAgency",
      entityId: id,
      metadata: {
        reason: b.reason || "Yönetici acente bilgilerini güncelledi",
        updatedFields: Object.keys(updateData),
      },
      req,
    });

    return NextResponse.json({
      ok: true,
      data: updated,
      message: "Acente bilgileri başarıyla güncellendi.",
    });
  }

  // --- Approval / Status Toggle Branch ---
  const approved = b.approved !== undefined ? !!b.approved : b.status === "APPROVED";
  const newStatus = approved ? "APPROVED" : b.status === "SUSPENDED" ? "SUSPENDED" : "REJECTED";

  if (approved) {
    const documents = await prisma.verificationDocument.findMany({ where: { agencyId: id } });
    const block = approvalBlockReason("agency", null, documents);
    if (block) return NextResponse.json({ error: block }, { status: 400 });
  }

  const a = await prisma.healthTourismAgency.update({
    where: { id },
    data: {
      status: newStatus,
      isVerified: approved,
      isActive: approved,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      verificationDocuments: { orderBy: { createdAt: "desc" } },
      _count: { select: { packages: true } },
    },
  });

  await prisma.healthTourismPackage.updateMany({
    where: { agencyId: a.id },
    data: { isPublished: approved },
  });

  await audit({
    actorUserId: admin.id,
    action: approved ? "agency.approved" : newStatus === "SUSPENDED" ? "agency.suspended" : "agency.rejected",
    entityType: "HealthTourismAgency",
    entityId: a.id,
    metadata: {
      status: a.status,
      isVerified: approved,
      isActive: approved,
      reason: b.reason || null,
    },
    req,
  });

  return NextResponse.json({ ok: true, data: a });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.admin;

  const { id } = await params;

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
