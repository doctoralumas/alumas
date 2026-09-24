import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u || u.role !== 'DOCTOR') return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  
  const doctor = await prisma.doctor.findUnique({ where: { userId: u.id } });
  if (!doctor) return NextResponse.json({ error: 'Doktor profili bulunamadı' }, { status: 404 });

  const b = await req.json();
  const data: any = {};
  
  for (const k of ['name', 'specialty', 'title', 'hospital', 'city', 'bio']) {
    if (b[k] !== undefined) data[k] = b[k] || '';
  }
  
  if (b.price !== undefined) data.price = Number(b.price) || 0;

  const updated = await prisma.doctor.update({
    where: { id: doctor.id },
    data
  });

  return NextResponse.json(updated);
}
