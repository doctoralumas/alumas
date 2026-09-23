export const DOCUMENT_TYPES = [
  "IDENTITY",
  "MEDICAL_LICENSE",
  "SPECIALTY_CERTIFICATE",
  "FACILITY_LICENSE",
  "HEALTH_TOURISM_AUTHORIZATION",
  "TAX_CERTIFICATE",
  "TRADE_REGISTRY",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentOwnerKind = "organization" | "doctor" | "agency";

export type RequiredDocument = {
  type: DocumentType;
  label: string;
  required: boolean;
  expires: boolean;
};

const ORGANIZATION_DOCUMENTS: Record<string, RequiredDocument[]> = {
  HOSPITAL: [
    { type: "FACILITY_LICENSE", label: "Sağlık tesisi ruhsatı", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", required: true, expires: false },
    { type: "TAX_CERTIFICATE", label: "Vergi levhası", required: true, expires: false },
  ],
  CLINIC: [
    { type: "FACILITY_LICENSE", label: "Klinik ruhsatı", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", required: true, expires: false },
  ],
  PHARMACY: [
    { type: "FACILITY_LICENSE", label: "Eczane ruhsatı", required: true, expires: true },
    { type: "MEDICAL_LICENSE", label: "Sorumlu eczacı belgesi", required: true, expires: false },
  ],
  IMAGING_CENTER: [
    { type: "FACILITY_LICENSE", label: "Görüntüleme merkezi ruhsatı", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Kurum kayıt belgesi", required: true, expires: false },
  ],
  LABORATORY: [
    { type: "FACILITY_LICENSE", label: "Laboratuvar ruhsatı", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Kurum kayıt belgesi", required: true, expires: false },
  ],
};

const DOCTOR_DOCUMENTS: RequiredDocument[] = [
  { type: "IDENTITY", label: "Kimlik belgesi", required: true, expires: false },
  { type: "MEDICAL_LICENSE", label: "Diploma / hekimlik belgesi", required: true, expires: false },
  { type: "SPECIALTY_CERTIFICATE", label: "Uzmanlık belgesi", required: false, expires: false },
];

const AGENCY_DOCUMENTS: RequiredDocument[] = [
  { type: "HEALTH_TOURISM_AUTHORIZATION", label: "Uluslararası sağlık turizmi yetki belgesi", required: true, expires: true },
  { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", required: true, expires: false },
  { type: "TAX_CERTIFICATE", label: "Vergi levhası", required: true, expires: false },
];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  IDENTITY: "Kimlik belgesi",
  MEDICAL_LICENSE: "Mesleki belge",
  SPECIALTY_CERTIFICATE: "Uzmanlık belgesi",
  FACILITY_LICENSE: "Ruhsat / faaliyet belgesi",
  HEALTH_TOURISM_AUTHORIZATION: "Sağlık turizmi yetki belgesi",
  TAX_CERTIFICATE: "Vergi levhası",
  TRADE_REGISTRY: "Ticaret sicil belgesi",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "İncelemede",
  APPROVED: "Onaylı",
  REJECTED: "Reddedildi",
  EXPIRED: "Süresi doldu",
  SUPERSEDED: "Yenisi yüklendi",
};

export function requiredDocuments(kind: DocumentOwnerKind, entityType?: string | null) {
  if (kind === "doctor") return DOCTOR_DOCUMENTS;
  if (kind === "agency") return AGENCY_DOCUMENTS;
  return ORGANIZATION_DOCUMENTS[String(entityType || "").toUpperCase()] || [];
}

export function documentExpired(expiresAt?: Date | string | null) {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
}

export function excludeExpiredDocuments() {
  return {
    verificationDocuments: {
      none: { status: "APPROVED" as const, expiresAt: { lt: new Date() } },
    },
  };
}

export function missingRequiredDocuments(kind: DocumentOwnerKind, entityType: string | null | undefined, documents: { documentType: string; status: string; expiresAt?: Date | string | null }[]) {
  return requiredDocuments(kind, entityType).filter((requirement) => requirement.required && !documents.some((document) =>
    document.documentType === requirement.type && document.status === "APPROVED" && !documentExpired(document.expiresAt)
  ));
}
