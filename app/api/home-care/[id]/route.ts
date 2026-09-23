import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLegacyHomeRequest } from "@/lib/home-care";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const row = await prisma.homeCareRequest.findUnique({ where: { id } });
  if (!row || row.userId !== user.id) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  if (isLegacyHomeRequest(row)) return NextResponse.json({ error: "Eski talepler bu akışta değişmez." }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (body?.status !== "CANCELLED") return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  if (row.status !== "REQUESTED" && row.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Bu talep artık iptal edilemez." }, { status: 409 });
  }
  return NextResponse.json(await prisma.homeCareRequest.update({ where: { id }, data: { status: "CANCELLED" } }));
}
