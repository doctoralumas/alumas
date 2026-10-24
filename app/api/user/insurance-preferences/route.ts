import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertPreferenceOwnership,
  InsuranceDomainError,
  isInsurerPubliclyDiscoverable,
  validatePatientInsurancePreferenceInput,
} from "@/lib/insurance-domain";

const BASE_INSURER_SELECT = {
  id: true,
  name: true,
  slug: true,
  website: true,
  phone: true,
  description: true,
  isActive: true,
} as const;

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  try {
    const preferences = await prisma.userInsurancePreference.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        insuranceProvider: { select: BASE_INSURER_SELECT },
        product: { select: { id: true, code: true, slug: true, name: true, productType: true } },
        network: { select: { id: true, code: true, slug: true, name: true, tierLabel: true } },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ ok: true, data: preferences });
  } catch {
    // Pre-migration fallback for legacy schema
    const preferences = await prisma.userInsurancePreference.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        insuranceProviderId: true,
        isPrimary: true,
        policyLabel: true,
        createdAt: true,
        updatedAt: true,
        insuranceProvider: { select: BASE_INSURER_SELECT },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ ok: true, data: preferences });
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  try {
    const raw = await req.json().catch(() => null);
    const input = validatePatientInsurancePreferenceInput(raw);

    const insurer = await prisma.insuranceProvider.findUnique({
      where: { id: input.insuranceProviderId },
      select: BASE_INSURER_SELECT,
    });
    if (!insurer || !isInsurerPubliclyDiscoverable(insurer)) {
      return NextResponse.json(
        { error: "Seçilen sigorta kurumu bulunamadı veya aktif değil." },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.userInsurancePreference.updateMany({
          where: { userId: user.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const existing = await tx.userInsurancePreference.findFirst({
        where: {
          userId: user.id,
          insuranceProviderId: input.insuranceProviderId,
          productType: input.productType,
          productId: input.productId,
          networkId: input.networkId,
        },
      });

      if (existing) {
        return tx.userInsurancePreference.update({
          where: { id: existing.id },
          data: {
            isPrimary: input.isPrimary,
            isActiveDiscovery: input.isActiveDiscovery,
            includePublicSgk: input.includePublicSgk,
            isActive: true,
            policyLabel: input.policyLabel,
          },
          include: {
            insuranceProvider: { select: BASE_INSURER_SELECT },
          },
        });
      }

      return tx.userInsurancePreference.create({
        data: {
          userId: user.id,
          insuranceProviderId: input.insuranceProviderId,
          productType: input.productType,
          productId: input.productId,
          networkId: input.networkId,
          isPrimary: input.isPrimary,
          isActiveDiscovery: input.isActiveDiscovery,
          includePublicSgk: input.includePublicSgk,
          isActive: true,
          policyLabel: input.policyLabel,
        },
        include: {
          insuranceProvider: { select: BASE_INSURER_SELECT },
        },
      });
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Sigorta tercihi kaydedilemedi." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  try {
    const raw = await req.json().catch(() => null);
    const preferenceId = String(raw?.id || "").trim();
    if (!preferenceId) {
      return NextResponse.json({ error: "Tercih kimliği (id) gerekli." }, { status: 400 });
    }

    const existing = await prisma.userInsurancePreference.findUnique({
      where: { id: preferenceId },
      select: { id: true, userId: true, insuranceProviderId: true },
    });
    assertPreferenceOwnership(user, existing);

    const validated = validatePatientInsurancePreferenceInput({
      ...raw,
      insuranceProviderId: raw?.insuranceProviderId || existing!.insuranceProviderId,
    });

    const updated = await prisma.$transaction(async (tx) => {
      if (validated.isPrimary) {
        await tx.userInsurancePreference.updateMany({
          where: { userId: user.id, id: { not: preferenceId }, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.userInsurancePreference.update({
        where: { id: preferenceId },
        data: {
          productType: validated.productType,
          productId: validated.productId,
          networkId: validated.networkId,
          isPrimary: validated.isPrimary,
          isActiveDiscovery: validated.isActiveDiscovery,
          includePublicSgk: validated.includePublicSgk,
          policyLabel: validated.policyLabel,
        },
        include: {
          insuranceProvider: { select: BASE_INSURER_SELECT },
        },
      });
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Sigorta tercihi güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const preferenceId = String(url.searchParams.get("id") || "").trim();
    if (!preferenceId) {
      return NextResponse.json({ error: "Tercih kimliği (id) gerekli." }, { status: 400 });
    }

    const existing = await prisma.userInsurancePreference.findUnique({
      where: { id: preferenceId },
      select: { id: true, userId: true },
    });
    assertPreferenceOwnership(user, existing);

    await prisma.userInsurancePreference.delete({
      where: { id: preferenceId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Sigorta tercihi silinemedi." }, { status: 500 });
  }
}

