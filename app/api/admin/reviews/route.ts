import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

async function admin() {
  const u = await currentUser();
  return u?.role === "ADMIN" ? u : null;
}

export async function GET(req: Request) {
  const u = await admin();
  if (!u) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status")?.toUpperCase();

  const statusFilter =
    statusParam === "ALL"
      ? undefined
      : ["APPROVED", "REJECTED", "PENDING"].includes(statusParam || "")
      ? (statusParam as any)
      : "PENDING";

  const orgWhere: any = statusFilter ? { status: statusFilter } : {};
  const docWhere: any = statusFilter ? { status: statusFilter } : {};

  const [orgs, docs] = await Promise.all([
    prisma.organizationReview.findMany({
      where: orgWhere,
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.doctorReview.findMany({
      where: docWhere,
      include: {
        user: { select: { name: true, email: true } },
        doctor: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ organizationReviews: orgs, doctorReviews: docs });
}

export async function PATCH(req: Request) {
  const u = await admin();
  if (!u) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (!["organization", "doctor"].includes(b.kind) || !["APPROVED", "REJECTED"].includes(b.status)) {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const data = {
    status: b.status,
    moderationReason: String(b.reason || "").slice(0, 500) || null,
    moderatedAt: new Date(),
    moderatorUserId: u.id,
  };

  let row: any;
  if (b.kind === "organization") {
    row = await prisma.organizationReview.update({ where: { id: b.id }, data });
  } else {
    row = await prisma.doctorReview.update({ where: { id: b.id }, data });
    if (b.status === "APPROVED") {
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
