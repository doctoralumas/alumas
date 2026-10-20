import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Yönetici yetkisi gerekli." }, { status: 403 });
  }

  const claims = await prisma.doctorClaim.findMany({
    include: {
      directoryDoctor: true,
      doctor: {
        include: {
          verificationDocuments: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      claimant: {
        select: { id: true, name: true, email: true, phone: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: claims,
    total: claims.length,
  });
}

