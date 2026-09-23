import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { DocumentInputError, oneDocumentFromForm } from "@/lib/verification-documents";
import { requiredDocuments } from "@/lib/verification-requirements";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  const form = await req.formData();
  const organizationId = String(form.get("organizationId") || "");
  const doctorId = String(form.get("doctorId") || "");
  const agencyId = String(form.get("agencyId") || "");
  const owners = [organizationId, doctorId, agencyId].filter(Boolean);
  if (owners.length !== 1) return NextResponse.json({ error: "Belge tek bir hesaba bağlanmalı." }, { status: 400 });
  const documentType = String(form.get("documentType") || "");

  try {
    if (organizationId) {
      const organization = await prisma.organization.findFirst({ where: user.role === "ADMIN" ? { id: organizationId } : { id: organizationId, ownerUserId: user.id } });
      if (!organization) return NextResponse.json({ error: "Kurum bulunamadı." }, { status: 404 });
      if (!requiredDocuments("organization", organization.type).some((item) => item.type === documentType)) return NextResponse.json({ error: "Bu belge türü kurum için geçerli değil." }, { status: 400 });
      const row = await oneDocumentFromForm(singleTypeForm(form, documentType), "organization", organization.type, documentType, user.id);
      const saved = await prisma.verificationDocument.create({ data: { ...row, organizationId } });
      return NextResponse.json(saved, { status: 201 });
    }
    if (doctorId) {
      const doctor = await prisma.doctor.findFirst({ where: user.role === "ADMIN" ? { id: doctorId } : { id: doctorId, userId: user.id } });
      if (!doctor) return NextResponse.json({ error: "Uzman profili bulunamadı." }, { status: 404 });
      if (!requiredDocuments("doctor").some((item) => item.type === documentType)) return NextResponse.json({ error: "Bu belge türü uzman için geçerli değil." }, { status: 400 });
      const row = await oneDocumentFromForm(singleTypeForm(form, documentType), "doctor", null, documentType, user.id);
      const saved = await prisma.verificationDocument.create({ data: { ...row, doctorId } });
      return NextResponse.json(saved, { status: 201 });
    }
    const agency = await prisma.healthTourismAgency.findFirst({ where: user.role === "ADMIN" ? { id: agencyId } : { id: agencyId, ownerUserId: user.id } });
    if (!agency) return NextResponse.json({ error: "Acente bulunamadı." }, { status: 404 });
    if (!requiredDocuments("agency").some((item) => item.type === documentType)) return NextResponse.json({ error: "Bu belge türü acente için geçerli değil." }, { status: 400 });
    const row = await oneDocumentFromForm(singleTypeForm(form, documentType), "agency", null, documentType, user.id);
    const saved = await prisma.verificationDocument.create({ data: { ...row, agencyId } });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("verification document upload failed", error);
    return NextResponse.json({ error: "Belge kaydedilemedi." }, { status: 500 });
  }
}

function singleTypeForm(form: FormData, documentType: string) {
  const next = new FormData();
  const file = form.get("file");
  if (file) next.set(`docFile_${documentType}`, file);
  next.set(`docNumber_${documentType}`, String(form.get("documentNumber") || ""));
  next.set(`docIssuer_${documentType}`, String(form.get("issuer") || ""));
  next.set(`docIssued_${documentType}`, String(form.get("issuedAt") || ""));
  next.set(`docExpires_${documentType}`, String(form.get("expiresAt") || ""));
  return next;
}
