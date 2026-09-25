import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function doctorCanSee(patientId: string, doctorId: string) {
  const [c, s] = await Promise.all([
    prisma.healthShareConsent.findUnique({ where: { patientId_doctorId: { patientId, doctorId } } }),
    prisma.healthReportShare.findFirst({ where: { patientId, doctorId, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } })
  ]);
  return (c?.status === 'active' && c.scopes.includes('labs')) || !!s;
}

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  const url = new URL(req.url);
  const asDoctor = url.searchParams.get('asDoctor') === 'true';

  if (asDoctor && u.role === 'DOCTOR' && u.doctorProfile) {
    const patientId = String(url.searchParams.get('patientId') || '');
    if (!patientId || !(await doctorCanSee(patientId, u.doctorProfile.id))) return NextResponse.json({ error: 'Erişim yok' }, { status: 403 });
    return NextResponse.json(await prisma.labResultComment.findMany({ where: { patientId }, include: { doctor: { select: { name: true } }, labResult: { select: { testName: true, value: true, unit: true, measuredAt: true } } }, orderBy: { createdAt: 'desc' } }));
  }

  // Default: Patient fetching their own lab comments
  return NextResponse.json(await prisma.labResultComment.findMany({ where: { patientId: u.id, patientVisible: true }, include: { doctor: { select: { name: true } }, labResult: { select: { testName: true, value: true, unit: true, measuredAt: true } } }, orderBy: { createdAt: 'desc' } }));
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u || u.role !== 'DOCTOR' || !u.doctorProfile) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  const b = await req.json(), labResultId = String(b.labResultId || ''), text = String(b.text || '').trim();
  if (!labResultId || !text) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  const lab = await prisma.labResult.findUnique({ where: { id: labResultId } });
  if (!lab) return NextResponse.json({ error: 'Sonuç yok' }, { status: 404 });
  if (!(await doctorCanSee(lab.userId, u.doctorProfile.id))) return NextResponse.json({ error: 'Erişim yok' }, { status: 403 });
  
  const row = await prisma.labResultComment.create({
    data: { patientId: lab.userId, doctorId: u.doctorProfile.id, labResultId, text: text.slice(0, 1000), patientVisible: b.patientVisible !== false }
  });
  
  if (row.patientVisible) {
    await prisma.notification.create({
      data: { userId: lab.userId, title: 'Laboratuvar sonucuna yorum', body: `${lab.testName} sonucu için uzman yorumu eklendi.`, kind: 'clinical' }
    });
  }
  return NextResponse.json(row, { status: 201 });
}
