import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CAPABILITY_DENIED, IMAGING_MODALITIES, organizationAllows } from "@/lib/organization-capabilities";

const MODALITY_IDS = new Set(IMAGING_MODALITIES.map((item) => item.id));

async function managedOrganization(id: string, user: { id: string; role: string }) {
  return prisma.organization.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, ownerUserId: user.id },
  });
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalInt(value: unknown) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return undefined;
  return number;
}

function examInput(body: any) {
  const modality = String(body.modality || "").trim();
  const name = String(body.name || "").trim();
  if (!MODALITY_IDS.has(modality as typeof IMAGING_MODALITIES[number]["id"])) {
    return { error: "Tetkik türünü seçin." };
  }
  if (name.length < 2) return { error: "Tetkik adı en az 2 karakter olmalı." };
  const durationMinutes = optionalInt(body.durationMinutes);
  const reportHours = optionalInt(body.reportHours);
  const price = optionalInt(body.price);
  if (durationMinutes === undefined || reportHours === undefined || price === undefined) {
    return { error: "Süre, rapor süresi ve fiyat sıfır veya pozitif tam sayı olmalı." };
  }
  return {
    data: {
      modality,
      name,
      bodyRegion: optionalText(body.bodyRegion),
      preparation: optionalText(body.preparation),
      durationMinutes,
      reportHours,
      price,
    },
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "imaging")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.imaging }, { status: 400 });
  }
  return NextResponse.json(await prisma.imagingExam.findMany({
    where: { organizationId: id, isActive: true },
    orderBy: [{ modality: "asc" }, { name: "asc" }],
  }));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "imaging")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.imaging }, { status: 400 });
  }
  const parsed = examInput(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const row = await prisma.imagingExam.create({ data: { organizationId: id, ...parsed.data } });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu tetkik adı katalogda zaten var." }, { status: 409 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "imaging")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.imaging }, { status: 400 });
  }
  const body = await req.json();
  const examId = String(body.examId || "");
  const existing = await prisma.imagingExam.findFirst({ where: { id: examId, organizationId: id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "Tetkik bulunamadı" }, { status: 404 });
  const parsed = examInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    return NextResponse.json(await prisma.imagingExam.update({ where: { id: existing.id }, data: parsed.data }));
  } catch {
    return NextResponse.json({ error: "Bu tetkik adı katalogda zaten var." }, { status: 409 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "imaging")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.imaging }, { status: 400 });
  }
  const examId = new URL(req.url).searchParams.get("examId") || "";
  const existing = await prisma.imagingExam.findFirst({ where: { id: examId, organizationId: id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "Tetkik bulunamadı" }, { status: 404 });
  await prisma.imagingExam.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
