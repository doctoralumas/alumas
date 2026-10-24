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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "15", 10) || 15));

    const where: any = {};

    if (requestedStatus && requestedStatus !== "ALL") {
      where.status = requestedStatus;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, totalAll, newCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      prisma.contactInquiry.count({ where }),
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { status: "new" } }),
      prisma.contactInquiry.count({ where: { status: "in_progress" } }),
      prisma.contactInquiry.count({ where: { status: "resolved" } }),
      prisma.contactInquiry.count({ where: { status: "closed" } }),
    ]);

    const inquiries = await prisma.contactInquiry.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      ok: true,
      rows: inquiries,
      items: inquiries,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        total: totalAll,
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
    });
  } catch (error) {
    console.error("admin inquiries list failed", error);
    return NextResponse.json({ error: "İletişim talepleri yüklenemedi." }, { status: 500 });
  }
}
