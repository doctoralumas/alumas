import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const requestedStatus = searchParams.get("status")?.trim();
    const requestedType = searchParams.get("type")?.trim();
    const fromParam = searchParams.get("from")?.trim();
    const toParam = searchParams.get("to")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "15", 10) || 15));

    const where: any = {};

    // Status filter
    if (requestedStatus && requestedStatus !== "ALL") {
      where.status = requestedStatus;
    }

    // Type filter
    if (requestedType && requestedType !== "ALL") {
      if (requestedType === "home_visit" || requestedType === "home") {
        where.type = { in: ["home", "home_visit"] };
      } else if (requestedType === "in_person" || requestedType === "in-person") {
        where.type = { in: ["in_person", "in-person"] };
      } else {
        where.type = requestedType;
      }
    }

    // Date range filter
    if (fromParam || toParam) {
      where.startsAt = {};
      if (fromParam) {
        const fromDate = new Date(fromParam);
        if (!isNaN(fromDate.getTime())) {
          where.startsAt.gte = fromDate;
        }
      }
      if (toParam) {
        const toDate = new Date(toParam);
        if (!isNaN(toDate.getTime())) {
          where.startsAt.lte = toDate;
        }
      }
    }

    // Search filter across patient, doctor, and organization
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { doctor: { name: { contains: q, mode: "insensitive" } } },
        { doctor: { specialty: { contains: q, mode: "insensitive" } } },
        { organization: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, totalAll, confirmedCount, completedCount, cancelledCount, pendingCount] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "confirmed" } }),
      prisma.appointment.count({ where: { status: "completed" } }),
      prisma.appointment.count({ where: { status: "cancelled" } }),
      prisma.appointment.count({ where: { status: "pending" } }),
    ]);

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        startsAt: true,
        type: true,
        status: true,
        note: true,
        visitCity: true,
        visitDistrict: true,
        visitAddress: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            title: true,
            city: true,
            slug: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
          },
        },
        specialProfile: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { startsAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      ok: true,
      rows: appointments,
      items: appointments,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        total: totalAll,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        pending: pendingCount,
      },
    });
  } catch (error) {
    console.error("admin appointments list failed", error);
    return NextResponse.json({ error: "Randevu listesi yüklenemedi." }, { status: 500 });
  }
}

