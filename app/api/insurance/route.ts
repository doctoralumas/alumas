import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterPublicCatalogInsurers } from "@/lib/insurance-domain";

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
    const rows = await prisma.insuranceProvider.findMany({
      where: { isActive: true, isPubliclyListed: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(filterPublicCatalogInsurers(rows));
  } catch {
    // Pre-migration fallback: select original v49 columns and filter demo insurer in application layer
    const rows = await prisma.insuranceProvider.findMany({
      where: { isActive: true },
      select: BASE_INSURER_SELECT,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(filterPublicCatalogInsurers(rows));
  }
}
