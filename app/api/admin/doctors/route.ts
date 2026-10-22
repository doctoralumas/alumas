import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approvalBlockReason, withdrawExpiredCredentials } from "@/lib/verification-documents";
import { audit } from "@/lib/audit";

async function adminUser() {
  const u = await currentUser();
  return u?.role === "ADMIN" ? u : null;
}

export async function GET(req: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await withdrawExpiredCredentials();

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status")?.trim() || "all";
  const published = url.searchParams.get("published")?.trim() || "all";

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { hospital: { contains: q, mode: "insensitive" } },
      { licenseNumber: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (status === "verified") {
    where.isVerified = true;
  } else if (status === "pending") {
    where.isVerified = false;
  }

  if (published === "true") {
    where.isPublished = true;
  } else if (published === "false") {
    where.isPublished = false;
  }

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      verificationDocuments: { orderBy: { createdAt: "desc" } },
      directoryDoctor: { select: { id: true, name: true, source: true } },
      _count: {
        select: {
          appointments: true,
          carePlans: true,
          reviews: true,
          patientNotes: true,
          videoConsultations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(doctors);
}

export async function PATCH(req: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const approved = !!b.approved;
  const locale = req.headers.get("x-locale") || (req.headers.get("cookie")?.includes("NEXT_LOCALE=en") ? "en" : "tr");

  if (approved) {
    const documents = await prisma.verificationDocument.findMany({ where: { doctorId: String(b.id) } });
    const block = approvalBlockReason("doctor", null, documents, locale);
    if (block) return NextResponse.json({ error: block, code: "REQUIRED_DOCUMENTS_MISSING" }, { status: 400 });
  }

  const updated = await prisma.doctor.update({
    where: { id: String(b.id) },
    data: {
      isVerified: approved,
      isPublished: approved,
      nextSlot: approved
        ? locale === "en"
          ? "Check availability calendar"
          : "Müsaitlik takvimine bakın"
        : locale === "en"
        ? "Post verification"
        : "Doğrulama sonrası",
    },
  });

  await audit({
    actorUserId: user.id,
    action: approved ? "doctor.verified" : "doctor.unverified",
    entityType: "Doctor",
    entityId: String(b.id),
    metadata: { isVerified: approved, isPublished: approved },
    req,
  });

  return NextResponse.json(updated);
}
