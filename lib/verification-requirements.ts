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
  labelEn?: string;
  required: boolean;
  expires: boolean;
};

const ORGANIZATION_DOCUMENTS: Record<string, RequiredDocument[]> = {
  HOSPITAL: [
    { type: "FACILITY_LICENSE", label: "Sağlık tesisi ruhsatı", labelEn: "Healthcare Facility License", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", labelEn: "Trade Registry Gazette", required: true, expires: false },
    { type: "TAX_CERTIFICATE", label: "Vergi levhası", labelEn: "Tax Registration Certificate", required: true, expires: false },
  ],
  CLINIC: [
    { type: "FACILITY_LICENSE", label: "Klinik ruhsatı", labelEn: "Clinic Operating License", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", labelEn: "Trade Registry Gazette", required: true, expires: false },
  ],
  PHARMACY: [
    { type: "FACILITY_LICENSE", label: "Eczane ruhsatı", labelEn: "Pharmacy Operating License", required: true, expires: true },
    { type: "MEDICAL_LICENSE", label: "Sorumlu eczacı belgesi", labelEn: "Responsible Pharmacist License", required: true, expires: false },
  ],
  IMAGING_CENTER: [
    { type: "FACILITY_LICENSE", label: "Görüntüleme merkezi ruhsatı", labelEn: "Imaging Center License", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Kurum kayıt belgesi", labelEn: "Institution Registration Certificate", required: true, expires: false },
  ],
  LABORATORY: [
    { type: "FACILITY_LICENSE", label: "Laboratuvar ruhsatı", labelEn: "Medical Laboratory License", required: true, expires: true },
    { type: "TRADE_REGISTRY", label: "Kurum kayıt belgesi", labelEn: "Institution Registration Certificate", required: true, expires: false },
  ],
};

const DOCTOR_DOCUMENTS: RequiredDocument[] = [
  { type: "IDENTITY", label: "Kimlik belgesi", labelEn: "Identity Document", required: true, expires: false },
  { type: "MEDICAL_LICENSE", label: "Diploma / hekimlik belgesi", labelEn: "Medical Diploma / License", required: true, expires: false },
  { type: "SPECIALTY_CERTIFICATE", label: "Uzmanlık belgesi", labelEn: "Specialty Certificate", required: false, expires: false },
];

const AGENCY_DOCUMENTS: RequiredDocument[] = [
  { type: "HEALTH_TOURISM_AUTHORIZATION", label: "Uluslararası sağlık turizmi yetki belgesi", labelEn: "International Health Tourism Authorization Certificate", required: true, expires: true },
  { type: "TRADE_REGISTRY", label: "Ticaret sicil belgesi", labelEn: "Trade Registry Gazette", required: true, expires: false },
  { type: "TAX_CERTIFICATE", label: "Vergi levhası", labelEn: "Tax Registration Certificate", required: true, expires: false },
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

export const DOCUMENT_TYPE_LABELS_EN: Record<string, string> = {
  IDENTITY: "Identity Document",
  MEDICAL_LICENSE: "Medical / Practitioner License",
  SPECIALTY_CERTIFICATE: "Specialty Certificate",
  FACILITY_LICENSE: "Facility Operating License",
  HEALTH_TOURISM_AUTHORIZATION: "Health Tourism Authorization Certificate",
  TAX_CERTIFICATE: "Tax Registration Certificate",
  TRADE_REGISTRY: "Trade Registry Gazette",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "İncelemede",
  APPROVED: "Onaylı",
  REJECTED: "Reddedildi",
  EXPIRED: "Süresi doldu",
  SUPERSEDED: "Yenisi yüklendi",
};

export const DOCUMENT_STATUS_LABELS_EN: Record<string, string> = {
  PENDING: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  SUPERSEDED: "Superseded",
};

export function getDocumentTypeLabel(type: string, locale: string = "tr") {
  return (locale === "en" ? DOCUMENT_TYPE_LABELS_EN[type] : DOCUMENT_TYPE_LABELS[type]) || type;
}

export function getDocumentStatusLabel(status: string, locale: string = "tr") {
  return (locale === "en" ? DOCUMENT_STATUS_LABELS_EN[status] : DOCUMENT_STATUS_LABELS[status]) || status;
}

export function requiredDocuments(kind: DocumentOwnerKind, entityType?: string | null, locale: string = "tr") {
  const base =
    kind === "doctor"
      ? DOCTOR_DOCUMENTS
      : kind === "agency"
      ? AGENCY_DOCUMENTS
      : ORGANIZATION_DOCUMENTS[String(entityType || "").toUpperCase()] || [];
  if (locale === "en") {
    return base.map((item) => ({ ...item, label: item.labelEn || item.label }));
  }
  return base;
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

export function missingRequiredDocuments(kind: DocumentOwnerKind, entityType: string | null | undefined, documents: { documentType: string; status: string; expiresAt?: Date | string | null }[], locale: string = "tr") {
  return requiredDocuments(kind, entityType, locale).filter((requirement) => requirement.required && !documents.some((document) =>
    document.documentType === requirement.type && document.status === "APPROVED" && !documentExpired(document.expiresAt)
  ));
}
