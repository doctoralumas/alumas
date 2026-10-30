import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  enrichInsurerCatalogWithProductsAndNetworks,
  filterPublicCatalogInsurers,
} from "@/lib/insurance-domain";
import { loadFullInsuranceEcosystemState } from "@/lib/insurance-ecosystem-store";

const BASE_INSURER_SELECT = {
  id: true,
  name: true,
  slug: true,
  website: true,
  phone: true,
  description: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    const state = await loadFullInsuranceEcosystemState();
    const publicInsurers = filterPublicCatalogInsurers(state.insurers);
    return NextResponse.json(publicInsurers);
  } catch {
    try {
      const rows = await prisma.insuranceProvider.findMany({
        where: { isActive: true, isPubliclyListed: true },
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              code: true,
              slug: true,
              name: true,
              productType: true,
              requiresPublicSgk: true,
            },
          },
          networks: {
            where: { isActive: true },
            select: {
              id: true,
              code: true,
              slug: true,
              name: true,
              tierLabel: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        enrichInsurerCatalogWithProductsAndNetworks(filterPublicCatalogInsurers(rows))
      );
    } catch {
      const rows = await prisma.insuranceProvider.findMany({
        where: { isActive: true },
        select: BASE_INSURER_SELECT,
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        enrichInsurerCatalogWithProductsAndNetworks(filterPublicCatalogInsurers(rows))
      );
    }
  }
}
