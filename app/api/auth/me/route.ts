import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/security";

export async function GET() {
  const u = await currentUser();
  return NextResponse.json(u ? { id: u.id, name: u.name, email: u.email, role: u.role, doctorSlug: u.doctorProfile?.slug ?? null } : null);
}

export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  
  const body = await req.json();
  const name = body.name ? String(body.name).trim() : undefined;
  const email = body.email ? normalizeEmail(body.email) : undefined;
  
  if (name && name.length < 2) return NextResponse.json({ error: "Ad çok kısa" }, { status: 400 });
  if (email && !email.includes("@")) return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
  
  if (email && email !== u.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Bu e-posta zaten kullanılıyor" }, { status: 409 });
  }
  
  try {
    const updated = await prisma.user.update({
      where: { id: u.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {})
      },
      select: { id: true, name: true, email: true, role: true }
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
