import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const statusParam = url.searchParams.get("status")?.toUpperCase();
    const typeParam = url.searchParams.get("type")?.toLowerCase();

    const statusFilter =
      statusParam === "ALL"
        ? undefined
        : ["APPROVED", "REJECTED", "PENDING"].includes(statusParam || "")
        ? (statusParam as any)
        : undefined;

    // Build Doctor Review where
    const docWhere: any = {};
    if (statusFilter) {
      docWhere.status = statusFilter;
    }
    if (q) {
      docWhere.OR = [
        { comment: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { doctor: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Build Organization Review where
    const orgWhere: any = {};
    if (statusFilter) {
      orgWhere.status = statusFilter;
    }
    if (q) {
      orgWhere.OR = [
        { comment: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { organization: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Parallel fetch counts for stats
    const [
      pendingDocs,
      pendingOrgs,
      approvedDocs,
      approvedOrgs,
      rejectedDocs,
      rejectedOrgs,
      totalDocs,
      totalOrgs,
    ] = await Promise.all([
      prisma.doctorReview.count({ where: { status: "PENDING" } }),
      prisma.organizationReview.count({ where: { status: "PENDING" } }),
      prisma.doctorReview.count({ where: { status: "APPROVED" } }),
      prisma.organizationReview.count({ where: { status: "APPROVED" } }),
      prisma.doctorReview.count({ where: { status: "REJECTED" } }),
      prisma.organizationReview.count({ where: { status: "REJECTED" } }),
      prisma.doctorReview.count(),
      prisma.organizationReview.count(),
    ]);

    const shouldFetchDocs = typeParam !== "organization";
    const shouldFetchOrgs = typeParam !== "doctor";

    const [docs, orgs] = await Promise.all([
      shouldFetchDocs
        ? prisma.doctorReview.findMany({
            where: docWhere,
            include: {
              user: { select: { id: true, name: true, email: true } },
              doctor: { select: { id: true, name: true, slug: true, specialty: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : Promise.resolve([]),
      shouldFetchOrgs
        ? prisma.organizationReview.findMany({
            where: orgWhere,
            include: {
              user: { select: { id: true, name: true, email: true } },
              organization: { select: { id: true, name: true, slug: true, type: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      organizationReviews: orgs,
      doctorReviews: docs,
      stats: {
        total: totalDocs + totalOrgs,
        pending: pendingDocs + pendingOrgs,
        approved: approvedDocs + approvedOrgs,
        rejected: rejectedDocs + rejectedOrgs,
        doctors: totalDocs,
        organizations: totalOrgs,
      },
    });
  } catch (error) {
    console.error("admin reviews list failed", error);
    return NextResponse.json({ error: "Değerlendirmeler yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const u = auth.user;

  const b = await req.json().catch(() => ({}));
  if (!["organization", "doctor"].includes(b.kind) || !["APPROVED", "REJECTED", "PENDING"].includes(b.status)) {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const data: any = {
    status: b.status,
    moderationReason: b.reason ? String(b.reason).slice(0, 500) : null,
    moderatedAt: new Date(),
    moderatorUserId: u.id,
  };

  let row: any;
  if (b.kind === "organization") {
    row = await prisma.organizationReview.update({ where: { id: b.id }, data });
  } else {
    row = await prisma.doctorReview.update({ where: { id: b.id }, data });
    // Recalculate average rating & count based on APPROVED reviews only
    const aggs = await prisma.doctorReview.aggregate({
      where: { doctorId: row.doctorId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.doctor.update({
      where: { id: row.doctorId },
      data: { rating: aggs._avg.rating || 0, reviewCount: aggs._count.id },
    });
  }

  await audit({
    actorUserId: u.id,
    action: `review.${b.status.toLowerCase()}`,
    entityType: b.kind === "organization" ? "OrganizationReview" : "DoctorReview",
    entityId: b.id,
    metadata: {
      kind: b.kind,
      status: b.status,
      reason: data.moderationReason,
      targetId: b.kind === "organization" ? row.organizationId : row.doctorId,
    },
    req,
  });

  return NextResponse.json(row);
}
