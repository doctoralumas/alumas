import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withdrawExpiredCredentials } from "@/lib/verification-documents";
import { isOrganizationVerifiedByAlumas } from "@/lib/institution-directory";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;
  const requested = new URL(req.url).searchParams.get("status") || "";
  const statuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
  const status = statuses.find((item) => item === requested);
  try {
    await withdrawExpiredCredentials();
    const rows = await prisma.organization.findMany({
      where: status ? { status } : {},
      include: {
        owner: { select: { id: true, name: true, email: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        _count: { select: { doctors: true, services: true } },
      },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("admin organizations list failed", error);
    return NextResponse.json({ error: "Kurumlar yüklenemedi." }, { status: 500 });
  }
}
