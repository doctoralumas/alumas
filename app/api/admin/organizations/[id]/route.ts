import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { approvalBlockReason } from "@/lib/verification-documents";
import { isOrganizationVerifiedByAlumas, normalizeComparisonKey } from "@/lib/institution-directory";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const u = auth.user;
  if (!u || u.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici hesabı gerekli" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        verificationDocuments: {
          orderBy: { createdAt: "desc" },
        },
        doctors: {
          select: {
            id: true,
            name: true,
            specialty: true,
            title: true,
            hospital: true,
            city: true,
          },
          take: 20,
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
          take: 20,
        },
        _count: {
          select: {
            doctors: true,
            services: true,
            reviews: true,
            appointments: true,
            stocks: true,
            imagingExams: true,
            laboratoryTests: true,
          },
        },
        directoryListing: true,
        claim: {
          include: {
            directoryInstitution: {
              select: { id: true, name: true, city: true, type: true },
            },
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Kurum bulunamadı" }, { status: 404 });
    }

    // Check AuditLog for claim metadata if not present
    let claimData: any = (org as any).claim || null;
    if (!claimData) {
      try {
        const claimLog = await prisma.auditLog.findFirst({
          where: {
            entityType: "Organization",
            entityId: id,
            action: { in: ["organization.claim.submit", "organization.apply"] },
          },
          orderBy: { createdAt: "desc" },
        });

        if (claimLog?.metadata && typeof claimLog.metadata === "object") {
          const meta = claimLog.metadata as Record<string, unknown>;
          claimData = {
            isDirectoryClaim: claimLog.action === "organization.claim.submit",
            directoryInstitutionId: meta.directoryInstitutionId || null,
            directoryInstitutionName: meta.directoryInstitutionName || null,
            applicantRoleTitle: meta.applicantRoleTitle || null,
            applicantNote: meta.applicantNote || null,
            reviewedByUserId: claimLog.actorUserId,
            reviewedAt: claimLog.createdAt.toISOString(),
          };
        }
      } catch {
        // Ignore audit lookup error
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...org,
        claim: claimData,
        isVerified: isOrganizationVerifiedByAlumas(org),
      },
    });
  } catch (error) {
    console.error("admin organization detail error", error);
    return NextResponse.json({ error: "Kurum detayı yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const u = auth.user;
  if (!u || u.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici hesabı gerekli" }, { status: 403 });
  }
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const targetOrg = await prisma.organization.findUnique({
    where: { id },
    include: { verificationDocuments: true },
  });
  if (!targetOrg) {
    return NextResponse.json({ error: "Kurum bulunamadı" }, { status: 404 });
  }

  // --- Administrative Field Editing Branch ---
  if (b.action === "EDIT" || (b.name && !b.status)) {
    const validTypes = ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"];
    const name = String(b.name || "").trim();
    const type = String(b.type || "").toUpperCase();
    const city = String(b.city || "").trim();
    const district = b.district ? String(b.district).trim() : null;
    const address = String(b.address || "").trim();
    const phone = String(b.phone || "").trim();
    const email = String(b.email || "").trim();
    const website = b.website ? String(b.website).trim() : null;
    const description = b.description !== undefined ? (b.description ? String(b.description).trim() : null) : undefined;
    const isPublished = typeof b.isPublished === "boolean" ? b.isPublished : undefined;
    const isOnDuty = typeof b.isOnDuty === "boolean" ? b.isOnDuty : undefined;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Geçerli bir kurum adı giriniz (en az 2 karakter)." }, { status: 400 });
    }
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Geçersiz kurum türü." }, { status: 400 });
    }
    if (!city || city.length < 2) {
      return NextResponse.json({ error: "Geçerli bir şehir giriniz." }, { status: 400 });
    }
    if (!address || address.length < 5) {
      return NextResponse.json({ error: "Geçerli bir açık adres giriniz (en az 5 karakter)." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Geçerli bir telefon numarası giriniz." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
    }

    const updateData: any = {
      name,
      type,
      city,
      district,
      address,
      phone,
      email,
      website,
    };
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isOnDuty !== undefined) updateData.isOnDuty = isOnDuty;

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        _count: { select: { doctors: true, services: true, reviews: true, appointments: true } },
      },
    });

    await audit({
      actorUserId: u.id,
      action: "organization.updated",
      entityType: "Organization",
      entityId: id,
      metadata: {
        reason: b.reason || "Yönetici kurum bilgilerini güncelledi",
        updatedFields: Object.keys(updateData),
      },
      req,
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...updatedOrg,
        isVerified: isOrganizationVerifiedByAlumas(updatedOrg),
      },
      message: "Kurum bilgileri başarıyla güncellendi.",
    });
  }

  // --- Status Update Branch (Approval / Rejection / Suspension) ---
  if (!["APPROVED", "REJECTED", "SUSPENDED", "PENDING"].includes(b.status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  // Look up whether this organization application was submitted as a DirectoryInstitution claim
  let claimDirId: string | null = null;
  let claimDirName: string | null = null;
  try {
    const claimLog = await prisma.auditLog.findFirst({
      where: {
        entityType: "Organization",
        entityId: id,
        action: "organization.claim.submit",
      },
      orderBy: { createdAt: "desc" },
    });
    if (claimLog?.metadata && typeof claimLog.metadata === "object") {
      const meta = claimLog.metadata as Record<string, unknown>;
      if (typeof meta.directoryInstitutionId === "string") {
        claimDirId = meta.directoryInstitutionId;
      }
      if (typeof meta.directoryInstitutionName === "string") {
        claimDirName = meta.directoryInstitutionName;
      }
    }
  } catch {
    // Ignore audit lookup error
  }

  try {
    const dbClaim = await prisma.organizationClaim.findUnique({
      where: { organizationId: id },
      include: { directoryInstitution: { select: { id: true, name: true } } },
    });
    if (dbClaim) {
      claimDirId = dbClaim.directoryInstitutionId;
      claimDirName = dbClaim.directoryInstitution?.name || claimDirName;
    }
  } catch {
    // Table not yet migrated in test env
  }

  const approved = b.status === "APPROVED";
  const now = new Date();

  if (approved) {
    const block = approvalBlockReason("organization", targetOrg.type, targetOrg.verificationDocuments);
    if (block) return NextResponse.json({ error: block }, { status: 400 });

    // Prevent approving conflicting claims on the same institution in the same city
    const conflictingApproved = await prisma.organization.findMany({
      where: {
        id: { not: id },
        status: "APPROVED",
        city: { equals: targetOrg.city, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });
    const hasDuplicateApproved = conflictingApproved.some(
      (other) => normalizeComparisonKey(other.name) === normalizeComparisonKey(targetOrg.name)
    );
    if (hasDuplicateApproved) {
      return NextResponse.json(
        { error: "Bu kurum için zaten onaylanmış bir başka kayıt bulunuyor." },
        { status: 409 }
      );
    }

    if (claimDirId) {
      try {
        const existingDirLink = await prisma.directoryInstitution.findUnique({
          where: { id: claimDirId },
          select: { organizationId: true },
        });
        if (existingDirLink?.organizationId && existingDirLink.organizationId !== id) {
          return NextResponse.json(
            { error: "Bu dizin kurumu başka bir onaylı hesap tarafından zaten sahiplenilmiş." },
            { status: 409 }
          );
        }
      } catch {
        // Ignore if table unavailable
      }
    }
  }

  const org = await prisma.$transaction(async (tx) => {
    const updatedOrg = await tx.organization.update({
      where: { id },
      data: {
        status: b.status,
        isPublished: approved,
        verifiedAt: approved ? now : null,
        publishedAt: approved ? now : null,
        rejectionReason:
          b.status === "REJECTED" || b.status === "SUSPENDED"
            ? String(b.reason || "İşlem nedeni belirtilmedi")
            : null,
      },
      include: {
        verificationDocuments: { select: { documentType: true, status: true, expiresAt: true } },
      },
    });

    if (claimDirId) {
      try {
        await tx.organizationClaim.updateMany({
          where: { organizationId: id },
          data: {
            status: approved ? "APPROVED" : b.status === "REJECTED" ? "REJECTED" : "PENDING",
            reviewerNote: b.reason ? String(b.reason) : null,
            reviewedAt: now,
            reviewedByUserId: u.id,
          },
        });

        if (approved) {
          await tx.directoryInstitution.updateMany({
            where: { id: claimDirId },
            data: { organizationId: id, lastVerifiedAt: now },
          });
        } else if (b.status === "REJECTED" || b.status === "PENDING") {
          await tx.directoryInstitution.updateMany({
            where: { id: claimDirId, organizationId: id },
            data: { organizationId: null },
          });
        }
      } catch {
        // Fallback relies on AuditLog + canonical Organization link
      }
    }

    return updatedOrg;
  });

  const auditAction = claimDirId
    ? approved
      ? "organization.claim.approved"
      : b.status === "REJECTED"
      ? "organization.claim.rejected"
      : `organization.${String(b.status).toLowerCase()}`
    : `organization.${String(b.status).toLowerCase()}`;

  await audit({
    actorUserId: u.id,
    action: auditAction,
    entityType: "Organization",
    entityId: id,
    metadata: {
      reason: b.reason || null,
      directoryInstitutionId: claimDirId,
      directoryInstitutionName: claimDirName,
      reviewedByUserId: u.id,
      reviewedAt: now.toISOString(),
    },
    req,
  });

  return NextResponse.json({
    ...org,
    isVerified: isOrganizationVerifiedByAlumas(org),
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const u = auth.user;
  if (!u || u.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici hesabı gerekli" }, { status: 403 });
  }

  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          doctors: true,
          services: true,
          reviews: true,
          appointments: true,
        },
      },
      directoryListing: true,
      claim: true,
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Kurum bulunamadı" }, { status: 404 });
  }

  const depCount =
    (org._count.doctors || 0) +
    (org._count.services || 0) +
    (org._count.reviews || 0) +
    (org._count.appointments || 0);

  if (depCount > 0) {
    return NextResponse.json(
      {
        error:
          "Bu kurum aktif hekimlere, hizmetlere veya klinik kayıtlara sahip olduğu için kalıcı olarak silinemez. Bunun yerine durumu SUSPENDED (Askıya alındı) yaparak yayından kaldırabilirsiniz.",
        code: "HAS_DEPENDENCIES",
        dependencies: org._count,
      },
      { status: 400 }
    );
  }

  // Safe disposal
  if (org.directoryListing) {
    await prisma.directoryInstitution.update({
      where: { id: org.directoryListing.id },
      data: { organizationId: null },
    });
  }

  if (org.claim) {
    await prisma.organizationClaim.delete({ where: { organizationId: id } });
  }

  await prisma.verificationDocument.deleteMany({ where: { organizationId: id } });
  await prisma.organization.delete({ where: { id } });

  await audit({
    actorUserId: u.id,
    action: "organization.deleted",
    entityType: "Organization",
    entityId: id,
    metadata: {
      name: org.name,
      slug: org.slug,
      type: org.type,
      city: org.city,
      reason: "Safe disposal of organization with zero dependencies",
    },
    req,
  });

  return NextResponse.json({ ok: true, message: "Kurum kaydı güvenle silindi." });
}
