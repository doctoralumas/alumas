import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { CAPABILITY_DENIED, organizationAllows } from "@/lib/organization-capabilities";

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const org = await prisma.organization.findFirst({
      where: { id, ownerUserId: user.role === "ADMIN" ? undefined : user.id },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (!organizationAllows(org.type, "providerInsuranceContracts")) {
      return NextResponse.json({ error: CAPABILITY_DENIED.providerInsuranceContracts }, { status: 400 });
    }
    if (org.status !== "APPROVED" || !org.isPublished) {
      return NextResponse.json(
        { error: "Sigorta anlaşması yönetimi yalnızca yönetici onaylı kurumlar için aktiftir." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { insuranceProviderId, note } = body;
    if (!insuranceProviderId) {
      return NextResponse.json({ error: "Missing insuranceProviderId" }, { status: 400 });
    }

    const contract = await prisma.organizationInsurance.upsert({
      where: {
        organizationId_insuranceProviderId: {
          organizationId: id,
          insuranceProviderId: String(insuranceProviderId),
        },
      },
      update: {
        isActive: true,
        note: note ?? null,
      },
      create: {
        organizationId: id,
        insuranceProviderId: String(insuranceProviderId),
        note: note ?? null,
        isActive: true,
      },
      include: {
        insuranceProvider: {
          select: BASE_INSURER_SELECT,
        },
      },
    });

    return NextResponse.json({
      ...contract,
      verificationStatus: "PROVIDER_DECLARED",
      confirmed: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const org = await prisma.organization.findFirst({
      where: { id, ownerUserId: user.role === "ADMIN" ? undefined : user.id },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    if (!organizationAllows(org.type, "providerInsuranceContracts")) {
      return NextResponse.json({ error: CAPABILITY_DENIED.providerInsuranceContracts }, { status: 400 });
    }
    if (org.status !== "APPROVED" || !org.isPublished) {
      return NextResponse.json(
        { error: "Sigorta anlaşması yönetimi yalnızca yönetici onaylı kurumlar için aktiftir." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const insuranceProviderId = url.searchParams.get("providerId");

    if (!insuranceProviderId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

    await prisma.organizationInsurance.delete({
      where: {
        organizationId_insuranceProviderId: {
          organizationId: id,
          insuranceProviderId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
