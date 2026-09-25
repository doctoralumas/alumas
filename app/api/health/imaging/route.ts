import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function doctorAccess(patientId: string, doctorId: string) {
  const [c, s] = await Promise.all([
    prisma.healthShareConsent.findUnique({ where: { patientId_doctorId: { patientId, doctorId } } }),
    prisma.healthReportShare.findFirst({ where: { patientId, doctorId, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } })
  ]);
  return (c?.status === 'active' && c.scopes.includes('imaging')) || !!s;
}

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  
  const q = new URL(req.url).searchParams;
  const patientIdQuery = q.get('patientId');
  let userId = u.id;
  
  if (patientIdQuery && u.role === 'DOCTOR' && u.doctorProfile) {
    const p = String(patientIdQuery || '');
    if (!p || !(await doctorAccess(p, u.doctorProfile.id))) {
      return NextResponse.json({ error: 'Erişim yok' }, { status: 403 });
    }
    userId = p;
  }
  
  return NextResponse.json(await prisma.imagingResult.findMany({
    where: { userId },
    orderBy: { performedAt: 'desc' }
  }));
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  
  const b = await req.json();
  if (!b.title || !b.storagePath || !b.reportText) return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  
  const row = await prisma.imagingResult.create({
    data: {
      userId: u.id,
      title: String(b.title).slice(0, 160),
      storagePath: String(b.storagePath).slice(0, 500),
      fileName: b.fileName ? String(b.fileName).slice(0, 200) : null,
      mimeType: b.mimeType ? String(b.mimeType).slice(0, 100) : null,
      fileSize: b.fileSize ? Number(b.fileSize) : null,
      reportText: String(b.reportText).slice(0, 5000),
      findingSummary: b.findingSummary ? String(b.findingSummary).slice(0, 1000) : null,
      performedAt: b.performedAt ? new Date(b.performedAt) : new Date(),
      facilityName: b.facilityName ? String(b.facilityName).slice(0, 160) : null
    }
  });
  return NextResponse.json(row, { status: 201 });
}
