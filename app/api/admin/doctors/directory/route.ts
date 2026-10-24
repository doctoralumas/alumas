import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.admin;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const specialty = url.searchParams.get("specialty")?.trim() || "";
  const city = url.searchParams.get("city")?.trim() || "";
  const source = url.searchParams.get("source")?.trim() || "";
  const claimStatus = url.searchParams.get("claimStatus")?.trim() || "all";
  const activeFilter = url.searchParams.get("active")?.trim() || "all";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10) || 20));

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { hospital: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { externalRef: { contains: q, mode: "insensitive" } },
    ];
  }

  if (specialty) {
    where.specialty = { equals: specialty, mode: "insensitive" };
  }

  if (city) {
    where.city = { equals: city, mode: "insensitive" };
  }

  if (source) {
    where.source = { equals: source, mode: "insensitive" };
  }

  if (activeFilter === "true") {
    where.isActive = true;
  } else if (activeFilter === "false") {
    where.isActive = false;
  }

  if (claimStatus === "claimed") {
    where.doctorId = { not: null };
  } else if (claimStatus === "unclaimed") {
    where.doctorId = null;
  } else if (claimStatus === "pending") {
    where.claims = { some: { status: "PENDING" } };
  }

  const [total, items, stats] = await Promise.all([
    prisma.directoryDoctor.count({ where }),
    prisma.directoryDoctor.findMany({
      where,
      include: {
        doctor: {
          select: { id: true, name: true, isVerified: true, isPublished: true, user: { select: { email: true } } },
        },
        claims: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, claimantUserId: true, createdAt: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    Promise.all([
      prisma.directoryDoctor.count(),
      prisma.directoryDoctor.count({ where: { isActive: true } }),
      prisma.directoryDoctor.count({ where: { doctorId: { not: null } } }),
      prisma.directoryDoctor.count({ where: { doctorId: null } }),
      prisma.directoryDoctor.count({ where: { claims: { some: { status: "PENDING" } } } }),
    ]),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      total: stats[0],
      active: stats[1],
      claimed: stats[2],
      unclaimed: stats[3],
      pendingClaims: stats[4],
    },
  });
}
