import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        startsAt: true,
        type: true,
        status: true,
        note: true,
        visitCity: true,
        visitDistrict: true,
        visitAddress: true,
        reviewRequestedAt: true,
        reviewSubmittedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            title: true,
            city: true,
            hospital: true,
            slug: true,
            isVerified: true,
            isPublished: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            status: true,
            isPublished: true,
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
    });

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }

    // Also fetch last 10 audit logs related to this appointment
    let recentLogs: any[] = [];
    try {
      recentLogs = await prisma.auditLog.findMany({
        where: {
          entityType: "Appointment",
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
      // Ignore audit log error
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...appointment,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("admin appointment detail error", error);
    return NextResponse.json({ error: "Randevu detayları yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.user;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }

    const { status, note, reason } = body;
    const allowedStatuses = ["confirmed", "completed", "cancelled", "pending"];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Geçersiz randevu durumu. İzin verilen durumlar: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status && status !== appointment.status) {
      updateData.status = status;
    }
    if (note !== undefined) {
      updateData.note = note ? String(note).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: true, data: appointment, message: "Değişiklik yapılmadı." });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
      },
    });

    await audit({
      actorUserId: admin.id,
      action: "appointment.updated",
      entityType: "Appointment",
      entityId: id,
      metadata: {
        previousStatus: appointment.status,
        newStatus: updateData.status ?? appointment.status,
        reason: reason || null,
        noteChanged: updateData.note !== undefined,
        patientName: appointment.user.name,
        doctorName: appointment.doctor.name,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
      message: "Randevu başarıyla güncellendi.",
    });
  } catch (error) {
    console.error("admin appointment update error", error);
    return NextResponse.json({ error: "Randevu güncellenirken hata oluştu." }, { status: 500 });
  }
}

