import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowed = ["measurements", "labs", "documents", "imaging", "care_plans"];

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  
  // NOTE: This endpoint is used by the /health (My Health) page.
  // Even if the user is a DOCTOR, on this page they act as a PATIENT managing their own data sharing.
  // Thus, we ALWAYS return the shares where they are the patient.
  
  const url = new URL(req.url);
  const asDoctor = url.searchParams.get("asDoctor") === "true";
  
  if (asDoctor && u.role === "DOCTOR" && u.doctorProfile) {
    // If the doctor dashboard ever needs to fetch incoming shares
    return NextResponse.json(await prisma.healthShareConsent.findMany({
      where: { doctorId: u.doctorProfile.id, status: "active" },
      include: { patient: true }
    }));
  }
  
  // Default: Return shares where logged-in user is the patient
  return NextResponse.json(await prisma.healthShareConsent.findMany({
    where: { patientId: u.id },
    include: { doctor: true }
  }));
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  
  const { doctorId, scopes = [] } = await req.json();
  const clean = scopes.filter((s: string) => allowed.includes(s));
  
  const row = await prisma.healthShareConsent.upsert({
    where: { patientId_doctorId: { patientId: u.id, doctorId } },
    update: { scopes: clean, status: "active" },
    create: { patientId: u.id, doctorId, scopes: clean }
  });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  
  const { doctorId } = await req.json();
  await prisma.healthShareConsent.updateMany({
    where: { patientId: u.id, doctorId },
    data: { status: "revoked" }
  });
  return NextResponse.json({ ok: true });
}
