export type OrganizationCapability = "services" | "doctors" | "departments" | "emergency" | "imaging" | "laboratory" | "stock";

const CAPABILITIES: Record<string, Record<OrganizationCapability, boolean>> = {
  HOSPITAL: { services: true, doctors: true, departments: true, emergency: true, imaging: false, laboratory: false, stock: false },
  CLINIC: { services: true, doctors: true, departments: false, emergency: false, imaging: false, laboratory: false, stock: false },
  PHARMACY: { services: false, doctors: false, departments: false, emergency: false, imaging: false, laboratory: false, stock: true },
  IMAGING_CENTER: { services: false, doctors: false, departments: false, emergency: false, imaging: true, laboratory: false, stock: false },
  LABORATORY: { services: false, doctors: false, departments: false, emergency: false, imaging: false, laboratory: true, stock: false },
};

export const CAPABILITY_DENIED: Record<OrganizationCapability, string> = {
  services: "Hizmet kaydı bu kurum tipinde kullanılmıyor.",
  doctors: "Doktor daveti bu kurum tipinde kullanılmıyor.",
  departments: "Departman yalnızca hastanelerde yönetilir.",
  emergency: "Acil hizmet yalnızca hastanelerde yönetilir.",
  imaging: "Tetkik kataloğu yalnızca görüntüleme merkezlerinde yönetilir.",
  laboratory: "Tahlil kataloğu yalnızca tıbbi laboratuvarlarda yönetilir.",
  stock: "Stok yalnızca eczanelerde kullanılabilir.",
};

export const CAPABILITY_DENIED_EN: Record<OrganizationCapability, string> = {
  services: "Service records are not available for this institution type.",
  doctors: "Doctor invitations are not available for this institution type.",
  departments: "Departments are managed only for hospitals.",
  emergency: "Emergency services are managed only for hospitals.",
  imaging: "Imaging catalogs are managed only for imaging centers.",
  laboratory: "Laboratory catalogs are managed only for medical laboratories.",
  stock: "Stock management is available only for pharmacies.",
};

export function getCapabilityDeniedMessage(
  capability: OrganizationCapability,
  locale: string = "tr"
) {
  return locale === "en"
    ? CAPABILITY_DENIED_EN[capability]
    : CAPABILITY_DENIED[capability];
}

export function organizationAllows(type: string, capability: OrganizationCapability) {
  return CAPABILITIES[type]?.[capability] === true;
}

export const IMAGING_MODALITIES = [
  { id: "MR", label: "MR", labelEn: "MRI" },
  { id: "BT", label: "BT", labelEn: "CT" },
  { id: "RONTGEN", label: "Röntgen", labelEn: "X-Ray" },
  { id: "ULTRASON", label: "Ultrason", labelEn: "Ultrasound" },
  { id: "MAMMOGRAFI", label: "Mamografi", labelEn: "Mammography" },
  { id: "KEMIK_DANSITOMETRE", label: "Kemik dansitometrisi", labelEn: "Bone Densitometry" },
  { id: "DIGER", label: "Diğer", labelEn: "Other" },
] as const;

export function imagingModalityLabel(id: string, locale: string = "tr") {
  const found = IMAGING_MODALITIES.find((item) => item.id === id);
  if (!found) return id;
  return locale === "en" ? found.labelEn : found.label;
}

export const LAB_CATEGORIES = [
  { id: "HEMATOLOJI", label: "Hematoloji", labelEn: "Hematology" },
  { id: "BIYOKIMYA", label: "Biyokimya", labelEn: "Biochemistry" },
  { id: "HORMON", label: "Hormon", labelEn: "Hormone / Endocrinology" },
  { id: "MIKROBIYOLOJI", label: "Mikrobiyoloji", labelEn: "Microbiology" },
  { id: "SEROLOJI", label: "Seroloji", labelEn: "Serology" },
  { id: "GENETIK", label: "Genetik", labelEn: "Genetics" },
  { id: "PATOLOJI", label: "Patoloji", labelEn: "Pathology" },
  { id: "DIGER", label: "Diğer", labelEn: "Other" },
] as const;

export const LAB_SAMPLE_TYPES = [
  { id: "KAN", label: "Kan", labelEn: "Blood" },
  { id: "IDRAR", label: "İdrar", labelEn: "Urine" },
  { id: "DISKI", label: "Dışkı", labelEn: "Stool" },
  { id: "SURUNTU", label: "Sürüntü", labelEn: "Swab" },
  { id: "DIGER", label: "Diğer", labelEn: "Other" },
] as const;

export function labCategoryLabel(id: string, locale: string = "tr") {
  const found = LAB_CATEGORIES.find((item) => item.id === id);
  if (!found) return id;
  return locale === "en" ? found.labelEn : found.label;
}

export function labSampleLabel(id: string, locale: string = "tr") {
  const found = LAB_SAMPLE_TYPES.find((item) => item.id === id);
  if (!found) return id;
  return locale === "en" ? found.labelEn : found.label;
}
