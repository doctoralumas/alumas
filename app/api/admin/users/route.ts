import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const requestedRole = url.searchParams.get("role")?.trim().toUpperCase() || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "15", 10) || 15));

    const validRoles = ["PATIENT", "DOCTOR", "INSTITUTION_STAFF", "ORGANIZATION", "AGENCY", "ADMIN"] as const;
    const role = validRoles.find((r) => r === requestedRole);

    const where: any = {};

    if (role) {
      if (role === "INSTITUTION_STAFF") {
        where.role = { in: ["ORGANIZATION", "AGENCY"] };
      } else {
        where.role = role;
      }
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, totalAll, patientCount, doctorCount, orgCount, agencyCount, adminCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "ORGANIZATION" } }),
      prisma.user.count({ where: { role: "AGENCY" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: {
          select: {
            id: true,
            name: true,
            specialty: true,
            title: true,
            isVerified: true,
            isPublished: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            city: true,
            isPublished: true,
          },
        },
        tourismAgencies: {
          select: {
            id: true,
            name: true,
            city: true,
            status: true,
            isVerified: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            doctorReviews: true,
            organizationReviews: true,
            organizations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      ok: true,
      rows: users,
      items: users,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        total: totalAll,
        patients: patientCount,
        doctors: doctorCount,
        institutionStaff: orgCount + agencyCount,
        organizations: orgCount,
        agencies: agencyCount,
        admins: adminCount,
      },
    });
  } catch (error) {
    console.error("admin users list failed", error);
    return NextResponse.json({ error: "Kullanıcı listesi yüklenemedi." }, { status: 500 });
  }
}
