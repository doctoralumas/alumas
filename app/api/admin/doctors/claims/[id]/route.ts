import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { approvalBlockReason } from "@/lib/verification-documents";
import { evaluateClaimIdentityMatch } from "@/lib/claim-identity-verification";

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
  const forceIdentityOverride = Boolean(body?.forceIdentityOverride);
  const overrideReason = typeof body?.overrideReason === "string" ? body.overrideReason.trim() : null;

  if (!["APPROVED", "REJECTED", "REVOKED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz durum (APPROVED, REJECTED veya REVOKED olmalı)." }, { status: 400 });
  }

  const claim = await prisma.doctorClaim.findUnique({
    where: { id },
    include: {
      directoryDoctor: true,
      doctor: true,
      claimant: true,
    },
  });

  if (!claim) {
    return NextResponse.json({ ok: false, error: "Sahiplenme başvurusu bulunamadı." }, { status: 404 });
  }

  const now = new Date();
  const isApproved = status === "APPROVED";
  const isRevoked = status === "REVOKED";

  if (isRevoked && (!reason || reason.length < 10)) {
    return NextResponse.json({ ok: false, error: "Sahiplenmeyi iptal etmek (revoke) için en az 10 karakterlik açıklayıcı gerekçe zorunludur." }, { status: 422 });
  }

  // Evaluate claimant identity against target directory doctor
  const identityMatch = evaluateClaimIdentityMatch(claim.claimant?.name, claim.directoryDoctor?.name);

  // If approving, enforce identity check & existing claim conflict checks
  if (isApproved) {
    if (claim.directoryDoctor.doctorId && claim.directoryDoctor.doctorId !== claim.doctorId) {
      return NextResponse.json(
        { ok: false, error: "Bu dizin uzmanı başka bir doktor hesabı tarafından zaten sahiplenilmiş." },
        { status: 409 }
      );
    }

    if (!identityMatch.matches) {
      if (!forceIdentityOverride || !overrideReason || overrideReason.length < 15) {
        return NextResponse.json(
          {
            ok: false,
            error: `KİMLİK UYUŞMAZLIĞI: Başvuran kullanıcı ('${claim.claimant?.name}') ile hedef dizin hekimi ('${claim.directoryDoctor?.title} ${claim.directoryDoctor?.name}') eşleşmiyor. İstisnai onay için en az 15 karakterlik resmi gerekçe zorunludur.`,
            code: "IDENTITY_MISMATCH",
            claimantName: claim.claimant?.name,
            targetDoctorName: claim.directoryDoctor?.name,
          },
          { status: 422 }
        );
      }
    }
  }

  const updatedClaim = await prisma.$transaction(async (tx) => {
    // 1. Update claim status
    const c = await tx.doctorClaim.update({
      where: { id },
      data: {
        status: isApproved ? "APPROVED" : "REJECTED",
        reviewerNote: isRevoked
          ? `[REVOKED]: ${reason}`
          : forceIdentityOverride && overrideReason
          ? `[OVERRIDE_APPROVED]: ${overrideReason}`
          : reason,
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

      // Canonical Identity Protection:
      // The authentic name and title of the DirectoryDoctor is preserved on the Doctor profile.
      await tx.doctor.update({
        where: { id: claim.doctorId },
        data: {
          name: claim.directoryDoctor.name,
          title: claim.directoryDoctor.title || "Uzm. Dr.",
          specialty: claim.directoryDoctor.specialty,
          hospital: claim.directoryDoctor.hospital || undefined,
          city: claim.directoryDoctor.city,
          isVerified: credentialsPassed,
          isPublished: credentialsPassed,
          nextSlot: credentialsPassed ? "Müsaitlik takvimine bakın" : "Doğrulama bekleniyor",
        },
      });

      // Grant professional role to user only when credentials pass
      if (credentialsPassed && claim.claimantUserId) {
        await tx.user.update({
          where: { id: claim.claimantUserId },
          data: { role: "DOCTOR" },
        });
      }
    } else {
      // If rejected or revoked, ensure directory doctor is unlinked
      await tx.directoryDoctor.updateMany({
        where: { id: claim.directoryDoctorId, doctorId: claim.doctorId },
        data: {
          doctorId: null,
        },
      });

      // Safely unpublish doctor profile
      if (claim.doctorId) {
        await tx.doctor.update({
          where: { id: claim.doctorId },
          data: {
            isVerified: false,
            isPublished: false,
          },
        });
      }

      // If claimant has no other verified doctor profiles, ensure role is PATIENT
      if (claim.claimantUserId) {
        const otherVerified = await tx.doctor.findFirst({
          where: { userId: claim.claimantUserId, isVerified: true, id: { not: claim.doctorId || undefined } },
        });
        if (!otherVerified) {
          await tx.user.update({
            where: { id: claim.claimantUserId },
            data: { role: "PATIENT" },
          });
        }
      }
    }

    return c;
  }, { maxWait: 10000, timeout: 25000 });

  await audit({
    actorUserId: user.id,
    action: isApproved ? "doctor.claim.approved" : isRevoked ? "doctor.claim.revoked" : "doctor.claim.rejected",
    entityType: "DoctorClaim",
    entityId: id,
    metadata: {
      directoryDoctorId: claim.directoryDoctorId,
      doctorId: claim.doctorId,
      reason: isRevoked ? reason : forceIdentityOverride && overrideReason ? `[OVERRIDE_APPROVED]: ${overrideReason}` : reason,
      identityMatchConfidence: identityMatch.confidence,
      forceIdentityOverride,
      reviewedAt: now.toISOString(),
    },
    req,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    data: updatedClaim,
  });
}

