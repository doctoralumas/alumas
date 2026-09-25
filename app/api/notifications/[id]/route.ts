import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  
  await prisma.notification.updateMany({
    where: { id, userId: u.id },
    data: { readAt: new Date() }
  });
  
  return NextResponse.json({ ok: true });
}
