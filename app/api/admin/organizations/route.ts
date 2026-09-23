import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withdrawExpiredCredentials } from "@/lib/verification-documents";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yönetici hesabı gerekli" }, { status: 403 });
  }
  const requested = new URL(req.url).searchParams.get("status") || "";
  const statuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
  const status = statuses.find((item) => item === requested);
  try {
    await withdrawExpiredCredentials();
    const rows = await prisma.organization.findMany({
      where: status ? { status } : {},
      include: {
        owner: { select: { id: true, name: true, email: true } },
        verificationDocuments: { orderBy: { createdAt: "desc" } },
        _count: { select: { doctors: true, services: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("admin organizations list failed", error);
    return NextResponse.json({ error: "Kurumlar yüklenemedi." }, { status: 500 });
  }
}
