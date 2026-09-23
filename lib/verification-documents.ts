import { storePrivateFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import {
  type DocumentOwnerKind,
  type DocumentType,
  documentExpired,
  missingRequiredDocuments,
  requiredDocuments,
} from "@/lib/verification-requirements";

const FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export class DocumentInputError extends Error {}

function dateOrNull(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw new DocumentInputError("Tarih geçersiz.");
  return date;
}

async function readDocument(form: FormData, requirement: { type: DocumentType; label: string; required: boolean; expires: boolean }, userId: string, optional: boolean) {
  const file = form.get(`docFile_${requirement.type}`);
  const uploaded = file instanceof File && file.size > 0;
  if (!uploaded) {
    if (requirement.required && !optional) throw new DocumentInputError(`${requirement.label} yükleyin.`);
    return null;
  }
  if (file.size > 8 * 1024 * 1024) throw new DocumentInputError(`${requirement.label} 8 MB'dan küçük olmalı.`);
  if (!FILE_TYPES.has(file.type)) throw new DocumentInputError(`${requirement.label} PDF, JPG veya PNG olmalı.`);
  const documentNumber = String(form.get(`docNumber_${requirement.type}`) || "").trim();
  const issuer = String(form.get(`docIssuer_${requirement.type}`) || "").trim();
  if (!documentNumber || !issuer) throw new DocumentInputError(`${requirement.label} için belge numarası ve veren kurum gerekli.`);
  const issuedAt = dateOrNull(form.get(`docIssued_${requirement.type}`));
  const expiresAt = requirement.expires ? dateOrNull(form.get(`docExpires_${requirement.type}`)) : null;
  if (requirement.expires && !expiresAt) throw new DocumentInputError(`${requirement.label} için son kullanma tarihi gerekli.`);
  if (expiresAt && expiresAt.getTime() <= Date.now()) throw new DocumentInputError(`${requirement.label} süresi dolmuş. Güncel belge yükleyin.`);
  return {
    documentType: requirement.type,
    documentNumber,
    issuer,
    issuedAt,
    expiresAt,
    fileStoragePath: await storePrivateFile(file, userId),
    fileName: file.name,
    mimeType: file.type.startsWith("image/") ? "image/webp" : file.type,
  };
}

export async function documentsFromForm(form: FormData, kind: DocumentOwnerKind, entityType: string | null | undefined, userId: string) {
  const rows = [];
  for (const requirement of requiredDocuments(kind, entityType)) {
    const row = await readDocument(form, requirement, userId, false);
    if (row) rows.push(row);
  }
  if (!rows.length) throw new DocumentInputError("En az bir doğrulama belgesi yükleyin.");
  return rows;
}

export async function oneDocumentFromForm(form: FormData, kind: DocumentOwnerKind, entityType: string | null | undefined, documentType: string, userId: string) {
  const requirement = requiredDocuments(kind, entityType).find((item) => item.type === documentType);
  if (!requirement) throw new DocumentInputError("Bu belge türü bu hesap için geçerli değil.");
  const row = await readDocument(form, requirement, userId, false);
  if (!row) throw new DocumentInputError(`${requirement.label} yükleyin.`);
  return row;
}

export function approvalBlockReason(kind: DocumentOwnerKind, entityType: string | null | undefined, documents: { documentType: string; status: string; expiresAt?: Date | string | null }[]) {
  if (!documents.length) return null;
  const missing = missingRequiredDocuments(kind, entityType, documents);
  if (!missing.length) return null;
  return `Onay için şu belgeler onaylı ve süresi geçerli olmalı: ${missing.map((item) => item.label).join(", ")}.`;
}

type ExpiredCredential = {
  id: string;
  organizationId: string | null;
  doctorId: string | null;
  agencyId: string | null;
};

function uniqueIds(values: Array<string | null>): string[] {
  const ids: string[] = [];
  for (const value of values) {
    if (value && !ids.includes(value)) ids.push(value);
  }
  return ids;
}

export async function withdrawExpiredCredentials() {
  const now = new Date();
  const expired: ExpiredCredential[] = await prisma.verificationDocument.findMany({
    where: { status: "APPROVED", expiresAt: { lt: now } },
    select: { id: true, organizationId: true, doctorId: true, agencyId: true },
  });
  if (!expired.length) return { expired: 0 };
  const ids = expired.map((document) => document.id);
  const organizationIds = uniqueIds(expired.map((document) => document.organizationId));
  const doctorIds = uniqueIds(expired.map((document) => document.doctorId));
  const agencyIds = uniqueIds(expired.map((document) => document.agencyId));
  await prisma.verificationDocument.updateMany({ where: { id: { in: ids } }, data: { status: "EXPIRED" } });
  if (organizationIds.length) {
    await prisma.organization.updateMany({
      where: { id: { in: organizationIds }, isPublished: true },
      data: { isPublished: false, rejectionReason: "Zorunlu belgenin süresi doldu." },
    });
  }
  if (doctorIds.length) {
    await prisma.doctor.updateMany({
      where: { id: { in: doctorIds }, isPublished: true },
      data: { isPublished: false },
    });
  }
  if (agencyIds.length) {
    await prisma.healthTourismAgency.updateMany({
      where: { id: { in: agencyIds }, isActive: true },
      data: { isActive: false },
    });
  }
  return { expired: expired.length };
}

export function documentIsCurrent(document: { status: string; expiresAt?: Date | string | null }) {
  return document.status === "APPROVED" && !documentExpired(document.expiresAt);
}
