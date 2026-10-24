import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
            hospital: true,
            city: true,
            isVerified: true,
            isPublished: true,
            _count: { select: { appointments: true, reviews: true } },
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            status: true,
            isPublished: true,
            _count: { select: { doctors: true, services: true, appointments: true } },
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
            _count: { select: { packages: true } },
          },
        },
        _count: {
          select: {
            appointments: true,
            doctorReviews: true,
            organizationReviews: true,
            healthEntries: true,
            documents: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Also fetch last 10 audit logs related to this user
    let recentLogs: any[] = [];
    try {
      recentLogs = await prisma.auditLog.findMany({
        where: {
          OR: [{ actorUserId: id }, { entityId: id }],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          outcome: true,
          createdAt: true,
        },
      });
    } catch {
      // Ignore audit log error
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...user,
        recentLogs,
      },
    });
  } catch (error) {
    console.error("admin user detail error", error);
    return NextResponse.json({ error: "Kullanıcı detayları yüklenemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.user;

  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const targetUser = await prisma.user.findUnique({
    where: { id },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  // --- Strict Security Constraints on Roles ---
  if (b.role !== undefined && b.role !== targetUser.role) {
    if (b.role === "ADMIN") {
      return NextResponse.json(
        { error: "Yönetici (ADMIN) rolü sıradan kullanıcı düzenleme ekranından atanamaz." },
        { status: 403 }
      );
    }
    if (b.role === "DOCTOR") {
      return NextResponse.json(
        { error: "Uzman (DOCTOR) rolü yalnızca resmi uzman başvurusu ve lisans doğrulaması ile atanabilir." },
        { status: 400 }
      );
    }
    if (b.role === "INSTITUTION_STAFF") {
      return NextResponse.json(
        { error: "Kurum Yetkilisi rolü yalnızca geçerli ve onaylanmış bir kurum kaydı ile atanabilir." },
        { status: 400 }
      );
    }
    // Self-lockout protection
    if (admin.id === id && b.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Kendi yönetici rolünüzü kaldıramaz veya değiştiremezsiniz." },
        { status: 400 }
      );
    }
    // Last admin protection
    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Sistemdeki son yönetici hesabı değiştirilemez veya yetkisi kaldırılamaz." },
          { status: 400 }
        );
      }
    }
  }

  const name = b.name !== undefined ? String(b.name).trim() : undefined;
  const phone = b.phone !== undefined ? (b.phone ? String(b.phone).trim() : null) : undefined;
  const birthDate = b.birthDate !== undefined ? (b.birthDate ? new Date(b.birthDate) : null) : undefined;

  if (name !== undefined && name.length < 2) {
    return NextResponse.json({ error: "Geçerli bir ad soyad giriniz (en az 2 karakter)." }, { status: 400 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (birthDate !== undefined) updateData.birthDate = birthDate;

  // Only apply role if explicitly allowed and passed checks above
  if (b.role && ["PATIENT"].includes(b.role) && targetUser.role !== "ADMIN") {
    updateData.role = b.role;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await audit({
    actorUserId: admin.id,
    action: "user.updated",
    entityType: "User",
    entityId: id,
    metadata: {
      previous: { name: targetUser.name, phone: targetUser.phone, role: targetUser.role },
      updated: updateData,
      reason: b.reason || "Yönetici kullanıcı bilgilerini güncelledi",
    },
    req,
  });

  return NextResponse.json({
    ok: true,
    data: updatedUser,
    message: "Kullanıcı bilgileri başarıyla güncellendi.",
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const admin = auth.user;

  const { id } = await params;

  if (admin.id === id) {
    return NextResponse.json(
      { error: "Kendi yönetici hesabınızı silemezsiniz.", code: "SELF_DELETION_PROHIBITED" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      doctorProfile: {
        include: {
          _count: { select: { appointments: true, reviews: true, carePlans: true } },
        },
      },
      organizations: {
        include: {
          _count: { select: { doctors: true, services: true, appointments: true } },
        },
      },
      tourismAgencies: {
        include: {
          _count: { select: { packages: true } },
        },
      },
      _count: {
        select: {
          appointments: true,
          doctorReviews: true,
          organizationReviews: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Yönetici (ADMIN) hesapları doğrudan silinemez.", code: "ADMIN_DELETION_PROHIBITED" },
      { status: 403 }
    );
  }

  // --- Dependency Guards ---
  const docDeps = user.doctorProfile
    ? (user.doctorProfile._count.appointments || 0) +
      (user.doctorProfile._count.reviews || 0) +
      (user.doctorProfile._count.carePlans || 0)
    : 0;

  const orgCount = user.organizations.length;
  const agencyCount = user.tourismAgencies.length;
  const appointmentCount = user._count.appointments || 0;
  const reviewCount = (user._count.doctorReviews || 0) + (user._count.organizationReviews || 0);

  const totalDeps = docDeps + orgCount + agencyCount + appointmentCount + reviewCount;

  if (totalDeps > 0) {
    return NextResponse.json(
      {
        error:
          "Bu kullanıcıya bağlı aktif sağlık kayıtları (kurumlar, uzman profili, randevular veya değerlendirmeler) bulunmaktadır. Veri bütünlüğünü korumak için doğrudan silinemez.",
        code: "HAS_DEPENDENCIES",
        dependencies: {
          clinicalDependencies: docDeps,
          organizations: orgCount,
          tourismAgencies: agencyCount,
          appointments: appointmentCount,
          reviews: reviewCount,
        },
      },
      { status: 400 }
    );
  }

  // Safe disposal of zero-dependency user
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.notification.deleteMany({ where: { userId: id } });
  await prisma.pushDevice.deleteMany({ where: { userId: id } });
  if (user.doctorProfile) {
    await prisma.doctor.delete({ where: { id: user.doctorProfile.id } });
  }
  await prisma.user.delete({ where: { id } });

  await audit({
    actorUserId: admin.id,
    action: "user.deleted",
    entityType: "User",
    entityId: id,
    metadata: {
      name: user.name,
      email: user.email,
      role: user.role,
      reason: "Safe disposal of user with zero clinical dependencies",
    },
    req,
  });

  return NextResponse.json({ ok: true, message: "Kullanıcı hesabı güvenle silindi." });
}

