import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withdrawExpiredCredentials } from "@/lib/verification-documents";
import { isOrganizationVerifiedByAlumas } from "@/lib/institution-directory";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    await withdrawExpiredCredentials();

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const requestedStatus = url.searchParams.get("status")?.trim().toUpperCase() || "";
    const requestedType = url.searchParams.get("type")?.trim().toUpperCase() || "";
    const requestedCity = url.searchParams.get("city")?.trim() || "";
    const format = url.searchParams.get("format")?.trim() || "";

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "15", 10) || 15));

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
    const status = validStatuses.find((s) => s === requestedStatus);

    const validTypes = ["HOSPITAL", "CLINIC", "PHARMACY", "IMAGING_CENTER", "LABORATORY"] as const;
    const orgType = validTypes.find((t) => t === requestedType);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (orgType) {
      where.type = orgType;
    }

    if (requestedCity && requestedCity !== "all") {
      where.city = { contains: requestedCity, mode: "insensitive" };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { owner: { name: { contains: q, mode: "insensitive" } } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, totalAll, pendingCount, approvedCount, suspendedCount, rejectedCount] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "PENDING" } }),
      prisma.organization.count({ where: { status: "APPROVED" } }),
      prisma.organization.count({ where: { status: "SUSPENDED" } }),
      prisma.organization.count({ where: { status: "REJECTED" } }),
    ]);

    const rows = await prisma.organization.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            doctors: true,
            services: true,
            reviews: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const orgIds = rows.map((r) => r.id);
    const claimByOrgId = new Map<
      string,
      {
        isDirectoryClaim: boolean;
        directoryInstitutionId: string | null;
        directoryInstitutionName: string | null;
        applicantRoleTitle: string | null;
        applicantNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: string | null;
      }
    >();

    if (orgIds.length > 0) {
      // 1. Check AuditLog for claim metadata
      try {
        const logs = await prisma.auditLog.findMany({
          where: {
            entityType: "Organization",
            entityId: { in: orgIds },
            action: {
              in: [
                "organization.claim.submit",
                "organization.apply",
                "organization.claim.approved",
                "organization.claim.rejected",
                "organization.approved",
                "organization.rejected",
                "organization.suspended",
              ],
            },
          },
          orderBy: { createdAt: "asc" },
          select: {
            entityId: true,
            action: true,
            actorUserId: true,
            metadata: true,
            createdAt: true,
          },
        });

        for (const log of logs) {
          if (!log.entityId) continue;
          const meta =
            log.metadata && typeof log.metadata === "object"
              ? (log.metadata as Record<string, unknown>)
              : {};
          const prev = claimByOrgId.get(log.entityId) || {
            isDirectoryClaim: false,
            directoryInstitutionId: null,
            directoryInstitutionName: null,
            applicantRoleTitle: null,
            applicantNote: null,
            reviewedByUserId: null,
            reviewedAt: null,
          };

          if (log.action === "organization.claim.submit") {
            prev.isDirectoryClaim = true;
            prev.directoryInstitutionId =
              typeof meta.directoryInstitutionId === "string"
                ? meta.directoryInstitutionId
                : prev.directoryInstitutionId;
            prev.directoryInstitutionName =
              typeof meta.directoryInstitutionName === "string"
                ? meta.directoryInstitutionName
                : prev.directoryInstitutionName;
            prev.applicantRoleTitle =
              typeof meta.applicantRoleTitle === "string"
                ? meta.applicantRoleTitle
                : prev.applicantRoleTitle;
            prev.applicantNote =
              typeof meta.applicantNote === "string" ? meta.applicantNote : prev.applicantNote;
          } else if (log.action === "organization.apply") {
            prev.applicantRoleTitle =
              typeof meta.applicantRoleTitle === "string"
                ? meta.applicantRoleTitle
                : prev.applicantRoleTitle;
          } else {
            prev.reviewedByUserId = log.actorUserId || prev.reviewedByUserId;
            prev.reviewedAt = log.createdAt.toISOString();
          }

          claimByOrgId.set(log.entityId, prev);
        }
      } catch {
        // Ignore audit enrichment error
      }

      // 2. Also check OrganizationClaim table if migrated
      try {
        const anyPrisma = prisma as unknown as {
          organizationClaim?: {
            findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
          };
        };
        if (anyPrisma.organizationClaim) {
          const dbClaims = await anyPrisma.organizationClaim.findMany({
            where: { organizationId: { in: orgIds } },
            include: { directoryInstitution: { select: { id: true, name: true } } },
          });
          for (const c of dbClaims) {
            const oid = String(c.organizationId || "");
            if (!oid) continue;
            const dir = c.directoryInstitution as { id?: string; name?: string } | null;
            claimByOrgId.set(oid, {
              isDirectoryClaim: true,
              directoryInstitutionId: String(c.directoryInstitutionId || dir?.id || ""),
              directoryInstitutionName: dir?.name ? String(dir.name) : null,
              applicantRoleTitle: c.applicantRoleTitle ? String(c.applicantRoleTitle) : null,
              applicantNote: c.applicantNote ? String(c.applicantNote) : null,
              reviewedByUserId: c.reviewedByUserId ? String(c.reviewedByUserId) : null,
              reviewedAt:
                c.reviewedAt instanceof Date ? c.reviewedAt.toISOString() : null,
            });
          }
        }
      } catch {
        // Table not yet migrated in remote DB; AuditLog enrichment above handles it
      }
    }

    const enriched = rows.map((row) => ({
      ...row,
      isVerified: isOrganizationVerifiedByAlumas(row),
      claim: claimByOrgId.get(row.id) || null,
    }));

    if (format === "array") {
      return NextResponse.json(enriched);
    }

    return NextResponse.json({
      ok: true,
      rows: enriched,
      items: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        total: totalAll,
        pending: pendingCount,
        approved: approvedCount,
        suspended: suspendedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("admin organizations list failed", error);
    return NextResponse.json({ error: "Kurumlar yüklenemedi." }, { status: 500 });
  }
}
