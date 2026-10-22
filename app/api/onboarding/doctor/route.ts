import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentInputError, documentsFromForm } from "@/lib/verification-documents";
import { audit } from "@/lib/audit";
import { sanitizeClaimDoctorId } from "@/lib/claim-onboarding";
import { evaluateClaimIdentityMatch } from "@/lib/claim-identity-verification";

function slugify(v: string) {
  return v
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  if (u.doctorProfile) return NextResponse.json({ error: "Doktor profiliniz zaten var" }, { status: 409 });

  const form = await req.formData();
  const b = Object.fromEntries(
    [...form.entries()].filter(([, value]) => typeof value === "string")
  );

  for (const k of ["title", "specialty", "city", "hospital", "licenseNumber", "bio"]) {
    if (!String(b[k] || "").trim()) {
      return NextResponse.json({ error: "Zorunlu alanları doldurun" }, { status: 400 });
    }
  }

  const claimDoctorId = sanitizeClaimDoctorId(
    String(b.claimDoctorId || b.claimDirectoryId || "")
  );

  let targetDirDoctor: any = null;
  if (claimDoctorId) {
    targetDirDoctor = await prisma.directoryDoctor.findFirst({
      where: {
        OR: [{ id: claimDoctorId }, { slug: claimDoctorId }],
        isActive: true,
      },
      include: {
        claims: true,
      },
    });

    if (!targetDirDoctor) {
      return NextResponse.json(
        { error: "Sahiplenilmek istenen dizin uzman kaydı bulunamadı veya aktif değil." },
        { status: 404 }
      );
    }

    const hasActiveClaim =
      targetDirDoctor.doctorId ||
      targetDirDoctor.claims.some(
        (c: any) => c.status === "PENDING" || c.status === "APPROVED"
      );

    if (hasActiveClaim) {
      return NextResponse.json(
        {
          error:
            "Bu uzman profili için zaten onaylanmış bir kayıt veya incelemede olan bir sahiplenme başvurusu bulunuyor.",
        },
        { status: 409 }
      );
    }

    // Identity match guard: applicant name must be compatible with target directory doctor name
    const identityMatch = evaluateClaimIdentityMatch(u.name, targetDirDoctor.name);
    if (!identityMatch.matches) {
      return NextResponse.json(
        {
          error: `KİMLİK UYUŞMAZLIĞI: ALUMAS hesabınızdaki ad ('${u.name}') ile sahiplenmek istediğiniz hekim ('${targetDirDoctor.title} ${targetDirDoctor.name}') uyuşmuyor. Lütfen kendi adınıza kayıtlı hekim profilini seçin veya hesap adınızı resmi kimliğinizle eşleştirin.`,
          code: "IDENTITY_MISMATCH",
          applicantName: u.name,
          targetDoctorName: targetDirDoctor.name,
          reason: identityMatch.reason,
        },
        { status: 422 }
      );
    }
  }

  try {
    const documents = await documentsFromForm(form, "doctor", null, u.id);
    const effectiveName = targetDirDoctor ? targetDirDoctor.name : u.name;
    const effectiveTitle = targetDirDoctor ? targetDirDoctor.title : String(b.title).trim();

    let base = slugify(`${effectiveTitle}-${effectiveName}`) || `doktor-${u.id.slice(-6)}`;
    let slug = base;
    let i = 2;
    while (await prisma.doctor.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    const doctor = await prisma.$transaction(async (tx) => {
      const d = await tx.doctor.create({
        data: {
          userId: u.id,
          slug,
          name: effectiveName,
          title: effectiveTitle,
          specialty: targetDirDoctor ? targetDirDoctor.specialty : String(b.specialty).trim(),
          hospital: String(b.hospital).trim() || targetDirDoctor?.hospital || "",
          city: String(b.city).trim() || targetDirDoctor?.city || "İstanbul",
          bio: String(b.bio).trim(),
          price: Math.max(0, Number(b.price || 0)),
          nextSlot: "Doğrulama sonrası",
          licenseNumber: String(b.licenseNumber).trim(),
          isVerified: false,
          isPublished: false,
          verificationDocuments: { create: documents },
        },
      });

      if (targetDirDoctor) {
        // Concurrency lock check
        const activeCheck = await tx.doctorClaim.findFirst({
          where: {
            directoryDoctorId: targetDirDoctor.id,
            status: { in: ["PENDING", "APPROVED"] },
          },
        });
        if (activeCheck) {
          throw new DocumentInputError(
            "Bu uzman profili için eşzamanlı bir sahiplenme başvurusu alındı."
          );
        }

        await tx.doctorClaim.create({
          data: {
            directoryDoctorId: targetDirDoctor.id,
            doctorId: d.id,
            claimantUserId: u.id,
            status: "PENDING",
            applicantTitle: String(b.title).trim(),
            applicantNote: b.applicantNote ? String(b.applicantNote).trim() : null,
          },
        });
      }

      return d;
    });

    if (targetDirDoctor) {
      await audit({
        actorUserId: u.id,
        action: "doctor.claim.submit",
        entityType: "DoctorClaim",
        entityId: targetDirDoctor.id,
        metadata: {
          directoryDoctorId: targetDirDoctor.id,
          directoryDoctorName: targetDirDoctor.name,
          doctorId: doctor.id,
        },
        req,
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: doctor.id,
          slug: doctor.slug,
          status: "PENDING_VERIFICATION",
          claimPending: Boolean(targetDirDoctor),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DocumentInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("doctor onboarding failed", error);
    return NextResponse.json({ error: "Profil oluşturulamadı." }, { status: 500 });
  }
}
