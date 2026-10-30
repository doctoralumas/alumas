import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertPreferenceOwnership,
  CANONICAL_INSURER_CATALOG_METADATA,
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

function isLegacySchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  if (code === "P2021" || code === "P2022") return true;
  const msg = String((err as { message?: string }).message || "").toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("unknown field") ||
    msg.includes("unknown argument")
  );
}

/**
 * Resolves `productId` and `networkId` against the database or canonical insurer metadata,
 * automatically upserting canonical product/network rows if the v57 tables exist and the
 * canonical row has not yet been seeded, and rejecting invalid/foreign IDs.
 */
async function resolveAndEnsureProductAndNetworkInTx(
  tx: any,
  insurer: { id: string; slug: string },
  requestedProductId: string | null,
  requestedNetworkId: string | null
): Promise<{ dbProductId: string | null; dbNetworkId: string | null }> {
  const canonical = CANONICAL_INSURER_CATALOG_METADATA[insurer.slug] || {
    products: [],
    networks: [],
  };

  let dbProductId: string | null = null;
  if (requestedProductId) {
    const existingProd = await tx.insuranceProduct.findFirst({
      where: {
        insuranceProviderId: insurer.id,
        OR: [
          { id: requestedProductId },
          { slug: requestedProductId },
          { code: requestedProductId },
        ],
      },
      select: { id: true },
    });
    if (existingProd) {
      dbProductId = existingProd.id;
    } else {
      const canonicalProd = canonical.products.find(
        (p) =>
          p.id === requestedProductId ||
          p.slug === requestedProductId ||
          p.code === requestedProductId
      );
      if (!canonicalProd) {
        throw new InsuranceDomainError(
          "Seçilen poliçe ürünü bu sigorta kurumu için geçerli değil.",
          "INVALID_PRODUCT_OR_NETWORK",
          400
        );
      }
      const createdProd = await tx.insuranceProduct.upsert({
        where: {
          insuranceProviderId_code: {
            insuranceProviderId: insurer.id,
            code: canonicalProd.code,
          },
        },
        update: {},
        create: {
          id: canonicalProd.id,
          insuranceProviderId: insurer.id,
          code: canonicalProd.code,
          slug: canonicalProd.slug,
          name: canonicalProd.name,
          productType: canonicalProd.productType,
          requiresPublicSgk: canonicalProd.requiresPublicSgk,
          status: "ACTIVE",
          isActive: true,
        },
        select: { id: true },
      });
      dbProductId = createdProd.id;
    }
  }

  let dbNetworkId: string | null = null;
  if (requestedNetworkId) {
    const existingNet = await tx.insuranceNetwork.findFirst({
      where: {
        insuranceProviderId: insurer.id,
        OR: [
          { id: requestedNetworkId },
          { slug: requestedNetworkId },
          { code: requestedNetworkId },
        ],
      },
      select: { id: true },
    });
    if (existingNet) {
      dbNetworkId = existingNet.id;
    } else {
      const canonicalNet = canonical.networks.find(
        (n) =>
          n.id === requestedNetworkId ||
          n.slug === requestedNetworkId ||
          n.code === requestedNetworkId
      );
      if (!canonicalNet) {
        throw new InsuranceDomainError(
          "Seçilen anlaşmalı kurum ağı bu sigorta kurumu için geçerli değil.",
          "INVALID_PRODUCT_OR_NETWORK",
          400
        );
      }
      const createdNet = await tx.insuranceNetwork.upsert({
        where: {
          insuranceProviderId_code: {
            insuranceProviderId: insurer.id,
            code: canonicalNet.code,
          },
        },
        update: {},
        create: {
          id: canonicalNet.id,
          insuranceProviderId: insurer.id,
          code: canonicalNet.code,
          slug: canonicalNet.slug,
          name: canonicalNet.name,
          tierLabel: canonicalNet.tierLabel,
          status: "ACTIVE",
          isActive: true,
        },
        select: { id: true },
      });
      dbNetworkId = createdNet.id;
    }
  }

  return { dbProductId, dbNetworkId };
}

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
    return NextResponse.json({ ok: true, userId: user.id, data: preferences });
  } catch (err) {
    if (!isLegacySchemaMissingError(err)) {
      return NextResponse.json({ error: "Sigorta tercihleri yüklenemedi." }, { status: 500 });
    }
    // Pre-migration fallback for legacy v49 schema
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
    return NextResponse.json({ ok: true, userId: user.id, data: preferences });
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

    let created: any;
    try {
      created = await prisma.$transaction(async (tx) => {
        const existingCount = await tx.userInsurancePreference.count({
          where: { userId: user.id, isActive: true },
        });
        const effectivePrimary = existingCount === 0 ? true : input.isPrimary;
        const effectiveActiveDiscovery =
          existingCount === 0 ? true : effectivePrimary ? true : input.isActiveDiscovery;

        const { dbProductId, dbNetworkId } = await resolveAndEnsureProductAndNetworkInTx(
          tx,
          insurer,
          input.productId,
          input.networkId
        );

        const existing = await tx.userInsurancePreference.findFirst({
          where: {
            userId: user.id,
            insuranceProviderId: input.insuranceProviderId,
            productType: input.productType,
            productId: dbProductId,
            networkId: dbNetworkId,
          },
        });

        if (effectivePrimary || effectiveActiveDiscovery) {
          await tx.userInsurancePreference.updateMany({
            where: {
              userId: user.id,
              ...(existing ? { id: { not: existing.id } } : {}),
            },
            data: {
              ...(effectivePrimary ? { isPrimary: false } : {}),
              ...(effectiveActiveDiscovery ? { isActiveDiscovery: false } : {}),
            },
          });
        }

        if (existing) {
          return tx.userInsurancePreference.update({
            where: { id: existing.id },
            data: {
              isPrimary: effectivePrimary,
              isActiveDiscovery: effectiveActiveDiscovery,
              includePublicSgk: input.includePublicSgk,
              isActive: true,
              policyLabel: input.policyLabel,
            },
            include: {
              insuranceProvider: { select: BASE_INSURER_SELECT },
              product: { select: { id: true, code: true, slug: true, name: true, productType: true } },
              network: { select: { id: true, code: true, slug: true, name: true, tierLabel: true } },
            },
          });
        }

        return tx.userInsurancePreference.create({
          data: {
            userId: user.id,
            insuranceProviderId: input.insuranceProviderId,
            productType: input.productType,
            productId: dbProductId,
            networkId: dbNetworkId,
            isPrimary: effectivePrimary,
            isActiveDiscovery: effectiveActiveDiscovery,
            includePublicSgk: input.includePublicSgk,
            isActive: true,
            policyLabel: input.policyLabel,
          },
          include: {
            insuranceProvider: { select: BASE_INSURER_SELECT },
            product: { select: { id: true, code: true, slug: true, name: true, productType: true } },
            network: { select: { id: true, code: true, slug: true, name: true, tierLabel: true } },
          },
        });
      });
    } catch (err) {
      if (err instanceof InsuranceDomainError) throw err;
      if (!isLegacySchemaMissingError(err)) throw err;

      // Pre-migration fallback ONLY when v57 columns are absent in database
      created = await prisma.$transaction(async (tx) => {
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
          },
          select: { id: true },
        });
        const row = existing
          ? await tx.userInsurancePreference.update({
              where: { id: existing.id },
              data: {
                isPrimary: input.isPrimary,
                policyLabel: input.policyLabel,
              },
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
            })
          : await tx.userInsurancePreference.create({
              data: {
                userId: user.id,
                insuranceProviderId: input.insuranceProviderId,
                isPrimary: input.isPrimary,
                policyLabel: input.policyLabel,
              },
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
            });
        return {
          ...row,
          productType: input.productType,
          productId: input.productId,
          networkId: input.networkId,
          isActiveDiscovery: input.isActiveDiscovery,
          includePublicSgk: input.includePublicSgk,
        };
      });
    }

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

    const insurer = await prisma.insuranceProvider.findUnique({
      where: { id: validated.insuranceProviderId },
      select: BASE_INSURER_SELECT,
    });
    if (!insurer || !isInsurerPubliclyDiscoverable(insurer)) {
      return NextResponse.json(
        { error: "Seçilen sigorta kurumu bulunamadı veya aktif değil." },
        { status: 400 }
      );
    }

    let updated: any;
    try {
      updated = await prisma.$transaction(async (tx) => {
        const effectivePrimary = validated.isPrimary;
        const effectiveActiveDiscovery = effectivePrimary ? true : validated.isActiveDiscovery;

        if (effectivePrimary || effectiveActiveDiscovery) {
          await tx.userInsurancePreference.updateMany({
            where: { userId: user.id, id: { not: preferenceId } },
            data: {
              ...(effectivePrimary ? { isPrimary: false } : {}),
              ...(effectiveActiveDiscovery ? { isActiveDiscovery: false } : {}),
            },
          });
        }

        const { dbProductId, dbNetworkId } = await resolveAndEnsureProductAndNetworkInTx(
          tx,
          insurer,
          validated.productId,
          validated.networkId
        );

        return tx.userInsurancePreference.update({
          where: { id: preferenceId },
          data: {
            insuranceProviderId: insurer.id,
            productType: validated.productType,
            productId: dbProductId,
            networkId: dbNetworkId,
            isPrimary: effectivePrimary,
            isActiveDiscovery: effectiveActiveDiscovery,
            includePublicSgk: validated.includePublicSgk,
            policyLabel: validated.policyLabel,
          },
          include: {
            insuranceProvider: { select: BASE_INSURER_SELECT },
            product: { select: { id: true, code: true, slug: true, name: true, productType: true } },
            network: { select: { id: true, code: true, slug: true, name: true, tierLabel: true } },
          },
        });
      });
    } catch (err) {
      if (err instanceof InsuranceDomainError) throw err;
      if (!isLegacySchemaMissingError(err)) throw err;

      updated = await prisma.$transaction(async (tx) => {
        if (validated.isPrimary) {
          await tx.userInsurancePreference.updateMany({
            where: { userId: user.id, id: { not: preferenceId }, isPrimary: true },
            data: { isPrimary: false },
          });
        }
        const row = await tx.userInsurancePreference.update({
          where: { id: preferenceId },
          data: {
            isPrimary: validated.isPrimary,
            policyLabel: validated.policyLabel,
          },
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
        });
        return {
          ...row,
          productType: validated.productType,
          productId: validated.productId,
          networkId: validated.networkId,
          isActiveDiscovery: validated.isActiveDiscovery,
          includePublicSgk: validated.includePublicSgk,
        };
      });
    }

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
      select: { id: true, userId: true, isPrimary: true },
    });
    assertPreferenceOwnership(user, existing);

    await prisma.$transaction(async (tx) => {
      await tx.userInsurancePreference.delete({
        where: { id: preferenceId },
      });

      if (existing?.isPrimary) {
        const nextRemaining = await tx.userInsurancePreference.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (nextRemaining) {
          try {
            await tx.userInsurancePreference.update({
              where: { id: nextRemaining.id },
              data: { isPrimary: true, isActiveDiscovery: true },
            });
          } catch {
            await tx.userInsurancePreference.update({
              where: { id: nextRemaining.id },
              data: { isPrimary: true },
            });
          }
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InsuranceDomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Sigorta tercihi silinemedi." }, { status: 500 });
  }
}
