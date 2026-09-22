import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CAPABILITY_DENIED, LAB_CATEGORIES, LAB_SAMPLE_TYPES, organizationAllows } from "@/lib/organization-capabilities";

const CATEGORY_IDS = new Set(LAB_CATEGORIES.map((item) => item.id));
const SAMPLE_IDS = new Set(LAB_SAMPLE_TYPES.map((item) => item.id));

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

function testInput(body: any) {
  const category = String(body.category || "").trim();
  const sampleType = String(body.sampleType || "").trim();
  const name = String(body.name || "").trim();
  if (!CATEGORY_IDS.has(category as typeof LAB_CATEGORIES[number]["id"])) {
    return { error: "Tahlil grubunu seçin." };
  }
  if (!SAMPLE_IDS.has(sampleType as typeof LAB_SAMPLE_TYPES[number]["id"])) {
    return { error: "Numune türünü seçin." };
  }
  if (name.length < 2) return { error: "Tahlil adı en az 2 karakter olmalı." };
  const fastingHours = optionalInt(body.fastingHours);
  const turnaroundHours = optionalInt(body.turnaroundHours);
  const price = optionalInt(body.price);
  if (fastingHours === undefined || turnaroundHours === undefined || price === undefined) {
    return { error: "Açlık, sonuç süresi ve fiyat sıfır veya pozitif tam sayı olmalı." };
  }
  return {
    data: {
      category,
      sampleType,
      name,
      fastingHours,
      turnaroundHours,
      preparation: optionalText(body.preparation),
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
  if (!organizationAllows(org.type, "laboratory")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.laboratory }, { status: 400 });
  }
  return NextResponse.json(await prisma.laboratoryTest.findMany({
    where: { organizationId: id, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  }));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "laboratory")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.laboratory }, { status: 400 });
  }
  const parsed = testInput(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const row = await prisma.laboratoryTest.create({ data: { organizationId: id, ...parsed.data } });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu tahlil adı katalogda zaten var." }, { status: 409 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "laboratory")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.laboratory }, { status: 400 });
  }
  const body = await req.json();
  const testId = String(body.testId || "");
  const existing = await prisma.laboratoryTest.findFirst({ where: { id: testId, organizationId: id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "Tahlil bulunamadı" }, { status: 404 });
  const parsed = testInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    return NextResponse.json(await prisma.laboratoryTest.update({ where: { id: existing.id }, data: parsed.data }));
  } catch {
    return NextResponse.json({ error: "Bu tahlil adı katalogda zaten var." }, { status: 409 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const { id } = await params;
  const org = await managedOrganization(id, user);
  if (!org) return NextResponse.json({ error: "Yetki yok" }, { status: 403 });
  if (!organizationAllows(org.type, "laboratory")) {
    return NextResponse.json({ error: CAPABILITY_DENIED.laboratory }, { status: 400 });
  }
  const testId = new URL(req.url).searchParams.get("testId") || "";
  const existing = await prisma.laboratoryTest.findFirst({ where: { id: testId, organizationId: id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "Tahlil bulunamadı" }, { status: 404 });
  await prisma.laboratoryTest.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
