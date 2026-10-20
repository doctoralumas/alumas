import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { normalizeComparisonKey } from "@/lib/expert-directory";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Giriş yapmanız gerekiyor.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const doctorProfile = user.doctorProfile;
    if (!doctorProfile) {
      return NextResponse.json(
        {
          ok: false,
          error: "Profil sahiplenmek için önce uzman profilinizi tamamlamalısınız.",
          code: "DOCTOR_PROFILE_REQUIRED",
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const directoryDoctorId = String(body?.directoryDoctorId || "").trim();
    const applicantNote = typeof body?.applicantNote === "string" ? body.applicantNote.trim() : null;
    const applicantTitle = typeof body?.applicantTitle === "string" ? body.applicantTitle.trim() : doctorProfile.title;

    if (!directoryDoctorId) {
      return NextResponse.json(
        { ok: false, error: "Dizin uzman kimliği belirtilmelidir.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const targetDir = await prisma.directoryDoctor.findUnique({
      where: { id: directoryDoctorId },
      include: {
        claims: true,
      },
    });

    if (!targetDir || !targetDir.isActive) {
      return NextResponse.json(
        { ok: false, error: "Seçilen dizin uzmanı bulunamadı veya aktif değil.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if target directory doctor is already claimed or has a pending claim
    const hasActiveClaim =
      targetDir.doctorId ||
      targetDir.claims.some(
        (c) => c.status === "PENDING" || c.status === "APPROVED"
      );

    if (hasActiveClaim) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bu uzman profili için zaten onaylanmış bir kayıt veya incelemede olan bir sahiplenme başvurusu bulunuyor.",
          code: "CONFLICT_ACTIVE_CLAIM",
        },
        { status: 409 }
      );
    }

    // Check if this doctor already has an active claim on any directory record
    const existingDoctorClaim = await prisma.doctorClaim.findFirst({
      where: {
        doctorId: doctorProfile.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingDoctorClaim) {
      return NextResponse.json(
        {
          ok: false,
          error: "Zaten incelemede veya onaylanmış bir uzman profili sahiplenme başvurunuz bulunmaktadır.",
          code: "EXISTING_CLAIM",
        },
        { status: 409 }
      );
    }

    // Transactional claim creation with concurrency lock
    const claim = await prisma.$transaction(async (tx) => {
      const activeCheck = await tx.doctorClaim.findFirst({
        where: {
          directoryDoctorId: targetDir.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });

      if (activeCheck) {
        throw new Error("CONFLICT_CONCURRENT");
      }

      return tx.doctorClaim.create({
        data: {
          directoryDoctorId: targetDir.id,
          doctorId: doctorProfile.id,
          claimantUserId: user.id,
          status: "PENDING",
          applicantTitle,
          applicantNote,
        },
      });
    });

    await audit({
      actorUserId: user.id,
      action: "doctor.claim.submit",
      entityType: "DoctorClaim",
      entityId: claim.id,
      metadata: {
        directoryDoctorId: targetDir.id,
        directoryDoctorName: targetDir.name,
        directoryDoctorSpecialty: targetDir.specialty,
        directoryDoctorCity: targetDir.city,
        doctorId: doctorProfile.id,
        doctorName: doctorProfile.name,
      },
      req,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: "Uzman profili sahiplenme başvurunuz başarıyla alındı. Belgeleriniz incelendikten sonra profiliniz doğrulanacaktır.",
      data: claim,
    });
  } catch (error: any) {
    if (error?.message === "CONFLICT_CONCURRENT") {
      return NextResponse.json(
        {
          ok: false,
          error: "Bu uzman profili için eşzamanlı bir başvuru alındı. Lütfen daha sonra tekrar deneyiniz.",
          code: "CONFLICT_CONCURRENT",
        },
        { status: 409 }
      );
    }
    console.error("Doctor claim submission failed:", error);
    return NextResponse.json(
      { ok: false, error: "Sahiplenme başvurusu oluşturulurken bir hata oluştu.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

