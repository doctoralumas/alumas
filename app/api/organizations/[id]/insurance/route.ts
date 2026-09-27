import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const org = await prisma.organization.findFirst({ where: { id, ownerUserId: user.role === 'ADMIN' ? undefined : user.id } });
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const body = await req.json();
    const { insuranceProviderId, note } = body;

    const contract = await prisma.organizationInsurance.upsert({
      where: {
        organizationId_insuranceProviderId: {
          organizationId: id,
          insuranceProviderId
        }
      },
      update: {
        isActive: true,
        note
      },
      create: {
        organizationId: id,
        insuranceProviderId,
        note,
        isActive: true
      },
      include: {
        insuranceProvider: true
      }
    });

    return NextResponse.json(contract);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const org = await prisma.organization.findFirst({ where: { id, ownerUserId: user.role === 'ADMIN' ? undefined : user.id } });
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const url = new URL(req.url);
    const insuranceProviderId = url.searchParams.get('providerId');

    if (!insuranceProviderId) return NextResponse.json({ error: 'Missing providerId' }, { status: 400 });

    await prisma.organizationInsurance.delete({
      where: {
        organizationId_insuranceProviderId: {
          organizationId: id,
          insuranceProviderId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

