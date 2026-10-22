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
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      verificationDocuments: {
        orderBy: { createdAt: "desc" },
      },
      claims: {
        include: {
          directoryDoctor: true,
          claimant: { select: { id: true, name: true, email: true } },
        },
      },
      directoryDoctor: true,
      _count: {
        select: {
          appointments: true,
          carePlans: true,
          reviews: true,
          patientNotes: true,
          videoConsultations: true,
        },
      },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Hekim bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: doctor });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Hekim bulunamadı" }, { status: 404 });
  }

  const updateData: any = {};
  if (typeof body.name === "string" && body.name.trim()) updateData.name = body.name.trim();
  if (typeof body.title === "string") updateData.title = body.title.trim();
  if (typeof body.specialty === "string" && body.specialty.trim()) updateData.specialty = body.specialty.trim();
  if (typeof body.city === "string" && body.city.trim()) updateData.city = body.city.trim();
  if (body.hospital !== undefined) updateData.hospital = body.hospital ? String(body.hospital).trim() : null;
  if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber ? String(body.licenseNumber).trim() : null;
  if (body.bio !== undefined) updateData.bio = body.bio ? String(body.bio).trim() : null;
  if (body.price !== undefined && !isNaN(Number(body.price))) updateData.price = Number(body.price);
  if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished);
  if (body.isVerified !== undefined) updateData.isVerified = Boolean(body.isVerified);

  if (body.nextSlot !== undefined) {
    updateData.nextSlot = String(body.nextSlot).trim();
  } else if (body.isPublished !== undefined) {
    updateData.nextSlot = body.isPublished ? "Müsaitlik takvimine bakın" : "Yayında değil";
  }

  const updated = await prisma.doctor.update({
    where: { id },
    data: updateData,
  });

  await audit({
    actorUserId: admin.id,
    action: "doctor.profile.updated",
    entityType: "Doctor",
    entityId: id,
    metadata: {
      changes: updateData,
      previous: {
        name: existing.name,
        specialty: existing.specialty,
        city: existing.city,
        isPublished: existing.isPublished,
        isVerified: existing.isVerified,
      },
    },
    req,
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          appointments: true,
          carePlans: true,
          reviews: true,
          patientNotes: true,
          videoConsultations: true,
        },
      },
      directoryDoctor: true,
      claims: true,
      verificationDocuments: true,
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Hekim bulunamadı" }, { status: 404 });
  }

  // Dependency Guard: Active clinical or patient dependencies block hard deletion
  const clinicalDependencyCount =
    (doctor._count.appointments || 0) +
    (doctor._count.carePlans || 0) +
    (doctor._count.reviews || 0) +
    (doctor._count.patientNotes || 0) +
    (doctor._count.videoConsultations || 0);

  if (clinicalDependencyCount > 0) {
    return NextResponse.json(
      {
        error:
          "Bu hekim profili aktif klinik kayıtlara (randevular, bakım planları veya yorumlar) sahip olduğu için kalıcı olarak silinemez. Güvenlik ve mevzuat gereği profili yayından kaldırmanız (deaktif etmeniz) önerilir.",
        code: "HAS_DEPENDENCIES",
        dependencies: doctor._count,
      },
      { status: 400 }
    );
  }

  // Safe disposal
  // 1. Unlink directory doctor if associated
  if (doctor.directoryDoctor) {
    await prisma.directoryDoctor.update({
      where: { id: doctor.directoryDoctor.id },
      data: { doctorId: null },
    });
  }

  // 2. Cascade delete claims and verification documents
  await prisma.doctorClaim.deleteMany({ where: { doctorId: id } });
  await prisma.verificationDocument.deleteMany({ where: { doctorId: id } });

  // 3. Demote user role if they have no other doctor profile
  if (doctor.userId) {
    const otherDoctors = await prisma.doctor.count({
      where: { userId: doctor.userId, id: { not: id } },
    });
    if (otherDoctors === 0) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: { role: "PATIENT" },
      });
    }
  }

  // 4. Delete the doctor
  await prisma.doctor.delete({ where: { id } });

  // 5. Audit
  await audit({
    actorUserId: admin.id,
    action: "doctor.profile.deleted",
    entityType: "Doctor",
    entityId: id,
    metadata: {
      doctorName: doctor.name,
      specialty: doctor.specialty,
      city: doctor.city,
      userId: doctor.userId,
      reason: "Safe disposal of disposable/test doctor profile with zero clinical dependencies",
    },
    req,
  });

  return NextResponse.json({
    ok: true,
    message: "Hekim profili güvenle silindi.",
  });
}
