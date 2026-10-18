import { NextResponse } from "next/server";
import { currentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, passwordPolicy } from "@/lib/security";

export async function GET() {
  const u = await currentUser();
  return NextResponse.json(
    u
      ? {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone ?? null,
          role: u.role,
          hasPassword: Boolean(u.passwordHash),
          isPhoneAccount: u.email.includes("@alumas.local"),
          doctorSlug: u.doctorProfile?.slug ?? null,
        }
      : null
  );
}

export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json();
  const name = body.name ? String(body.name).trim() : undefined;
  const email = body.email ? normalizeEmail(body.email) : undefined;
  const password = body.password ? String(body.password) : undefined;
  const currentPassword = body.currentPassword ? String(body.currentPassword) : undefined;

  if (name && name.length < 2) return NextResponse.json({ error: "Ad çok kısa" }, { status: 400 });
  if (email && !email.includes("@")) return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });

  // REAUTHENTICATION: Stolen or stale sessions must not silently replace credentials
  if (email && email !== u.email) {
    return NextResponse.json(
      {
        error: "E-posta adresinizi güncellemek veya hesabınıza bağlamak için lütfen e-posta doğrulama kodunu kullanın.",
        code: "EMAIL_VERIFICATION_REQUIRED",
      },
      { status: 400 }
    );
  }

  let passwordHash: string | undefined = undefined;
  if (password) {
    if (u.passwordHash) {
      if (!currentPassword || !verifyPassword(currentPassword, u.passwordHash)) {
        return NextResponse.json({ error: "Mevcut şifreniz hatalı veya girilmedi." }, { status: 403 });
      }
    } else {
      return NextResponse.json(
        { error: "Şifre belirlemek için lütfen e-posta doğrulama sürecini kullanınız." },
        { status: 400 }
      );
    }
    const policyErr = passwordPolicy(password);
    if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });
    passwordHash = hashPassword(password);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: u.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, passwordHash: true },
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        hasPassword: Boolean(updated.passwordHash),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
