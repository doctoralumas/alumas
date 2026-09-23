import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Yönetici hesabı gerekli" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!["APPROVED", "REJECTED"].includes(body.status)) return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  const current = await prisma.verificationDocument.findUnique({ where: { id } });
  if (!current || current.status === "SUPERSEDED") return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
  if (body.status === "APPROVED" && current.expiresAt && current.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Süresi dolmuş belge onaylanamaz." }, { status: 400 });
  }
  const documentUpdate = prisma.verificationDocument.update({
    where: { id: current.id },
    data: {
      status: body.status,
      reviewerNote: body.note ? String(body.note).slice(0, 500) : null,
      reviewedAt: new Date(),
      reviewedByUserId: user.id,
    },
  });
  const document = body.status === "APPROVED"
    ? (await prisma.$transaction([
        prisma.verificationDocument.updateMany({
          where: {
            id: { not: current.id },
            documentType: current.documentType,
            status: "APPROVED",
            organizationId: current.organizationId,
            doctorId: current.doctorId,
            agencyId: current.agencyId,
          },
          data: { status: "SUPERSEDED" },
        }),
        documentUpdate,
      ]))[1]
    : await documentUpdate;
  await audit({ actorUserId: user.id, action: `verification_document.${String(body.status).toLowerCase()}`, entityType: "VerificationDocument", entityId: id, req });
  return NextResponse.json(document);
}
