import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { approvalBlockReason } from "@/lib/verification-documents";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body?.status || "").toUpperCase();
  const reason = typeof body?.reason === "string" ? body.reason.trim() : null;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum (APPROVED veya REJECTED olmalı)." }, { status: 400 });
  }

  const claim = await prisma.doctorClaim.findUnique({
    where: { id },
    include: {
      directoryDoctor: true,
      doctor: true,
    },
  });

  if (!claim) {
    return NextResponse.json({ ok: false, error: "Sahiplenme başvurusu bulunamadı." }, { status: 404 });
  }

  const now = new Date();
  const isApproved = status === "APPROVED";

  // If approving, ensure directory doctor is not already claimed by another doctor
  if (isApproved) {
    if (claim.directoryDoctor.doctorId && claim.directoryDoctor.doctorId !== claim.doctorId) {
      return NextResponse.json(
        { ok: false, error: "Bu dizin uzmanı başka bir doktor hesabı tarafından zaten sahiplenilmiş." },
        { status: 409 }
      );
    }
  }

  const updatedClaim = await prisma.$transaction(async (tx) => {
    // 1. Update claim status
    const c = await tx.doctorClaim.update({
      where: { id },
      data: {
        status: isApproved ? "APPROVED" : "REJECTED",
        reviewerNote: reason,
        reviewedAt: now,
        reviewedByUserId: user.id,
      },
    });

    if (isApproved) {
      // 2. Link directory doctor to registered doctor
      await tx.directoryDoctor.update({
        where: { id: claim.directoryDoctorId },
        data: {
          doctorId: claim.doctorId,
          lastVerifiedAt: now,
        },
      });

      // 3. Independent professional credential check:
      // An approved claim links directory identity, but does NOT grant verified status
      // unless required credentials (IDENTITY, MEDICAL_LICENSE) independently pass verification rules.
      const docs = await tx.verificationDocument.findMany({
        where: { doctorId: claim.doctorId },
      });
      const block = approvalBlockReason("doctor", null, docs);
      const credentialsPassed = block === null;

      await tx.doctor.update({
        where: { id: claim.doctorId },
        data: {
          isVerified: credentialsPassed,
          isPublished: credentialsPassed,
          nextSlot: credentialsPassed ? "Müsaitlik takvimine bakın" : "Doğrulama bekleniyor",
        },
      });
    } else {
      // If rejected, ensure directory doctor is unlinked
      await tx.directoryDoctor.updateMany({
        where: { id: claim.directoryDoctorId, doctorId: claim.doctorId },
        data: {
          doctorId: null,
        },
      });
    }

    return c;
  }, { maxWait: 10000, timeout: 25000 });

  await audit({
    actorUserId: user.id,
    action: isApproved ? "doctor.claim.approved" : "doctor.claim.rejected",
    entityType: "DoctorClaim",
    entityId: id,
    metadata: {
      directoryDoctorId: claim.directoryDoctorId,
      doctorId: claim.doctorId,
      reason,
      reviewedAt: now.toISOString(),
    },
    req,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    data: updatedClaim,
  });
}

