import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPrivateFile } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const document = await prisma.verificationDocument.findUnique({
    where: { id },
    include: {
      organization: { select: { ownerUserId: true } },
      doctor: { select: { userId: true } },
      agency: { select: { ownerUserId: true } },
    },
  });
  if (!document) return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
  const owner = document.organization?.ownerUserId === user.id || document.doctor?.userId === user.id || document.agency?.ownerUserId === user.id;
  if (user.role !== "ADMIN" && !owner) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  try {
    const body = await readPrivateFile(document.fileStoragePath);
    return new Response(body, {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName || "belge")}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("verification document file failed", error);
    return NextResponse.json({ error: "Dosya okunamadı" }, { status: 500 });
  }
}
