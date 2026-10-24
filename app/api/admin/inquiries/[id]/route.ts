import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    let recentLogs: any[] = [];
    try {
      recentLogs = await prisma.auditLog.findMany({
        where: {
          entityType: "ContactInquiry",
          entityId: id,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          actorUserId: true,
          outcome: true,
          metadata: true,
          createdAt: true,
        },
      });
    } catch {
      // Ignore
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...inquiry,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("admin inquiry detail error", error);
    return NextResponse.json({ error: "Talep detayları yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.user;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    const { status, note } = body;
    const allowedStatuses = ["new", "in_progress", "resolved", "closed"];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Geçersiz durum. İzin verilen durumlar: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: {
        status: status || inquiry.status,
      },
    });

    await audit({
      actorUserId: admin.id,
      action: "inquiry.status_updated",
      entityType: "ContactInquiry",
      entityId: id,
      metadata: {
        previousStatus: inquiry.status,
        newStatus: updated.status,
        note: note || null,
        subject: inquiry.subject,
        senderEmail: inquiry.email,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
      message: "Talep durumu güncellendi.",
    });
  } catch (error) {
    console.error("admin inquiry update error", error);
    return NextResponse.json({ error: "Talep güncellenirken hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.user;

  try {
    const { id } = await params;
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    await prisma.contactInquiry.delete({
      where: { id },
    });

    await audit({
      actorUserId: admin.id,
      action: "inquiry.deleted",
      entityType: "ContactInquiry",
      entityId: id,
      metadata: {
        subject: inquiry.subject,
        senderEmail: inquiry.email,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Talep başarıyla silindi.",
    });
  } catch (error) {
    console.error("admin inquiry delete error", error);
    return NextResponse.json({ error: "Talep silinirken hata oluştu." }, { status: 500 });
  }
}

