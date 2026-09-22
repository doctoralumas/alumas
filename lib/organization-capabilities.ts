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

export function organizationAllows(type: string, capability: OrganizationCapability) {
  return CAPABILITIES[type]?.[capability] === true;
}

export const IMAGING_MODALITIES = [
  { id: "MR", label: "MR" },
  { id: "BT", label: "BT" },
  { id: "RONTGEN", label: "Röntgen" },
  { id: "ULTRASON", label: "Ultrason" },
  { id: "MAMMOGRAFI", label: "Mamografi" },
  { id: "KEMIK_DANSITOMETRE", label: "Kemik dansitometrisi" },
  { id: "DIGER", label: "Diğer" },
] as const;

export function imagingModalityLabel(id: string) {
  return IMAGING_MODALITIES.find((item) => item.id === id)?.label || id;
}

export const LAB_CATEGORIES = [
  { id: "HEMATOLOJI", label: "Hematoloji" },
  { id: "BIYOKIMYA", label: "Biyokimya" },
  { id: "HORMON", label: "Hormon" },
  { id: "MIKROBIYOLOJI", label: "Mikrobiyoloji" },
  { id: "SEROLOJI", label: "Seroloji" },
  { id: "GENETIK", label: "Genetik" },
  { id: "PATOLOJI", label: "Patoloji" },
  { id: "DIGER", label: "Diğer" },
] as const;

export const LAB_SAMPLE_TYPES = [
  { id: "KAN", label: "Kan" },
  { id: "IDRAR", label: "İdrar" },
  { id: "DISKI", label: "Dışkı" },
  { id: "SURUNTU", label: "Sürüntü" },
  { id: "DIGER", label: "Diğer" },
] as const;

export function labCategoryLabel(id: string) {
  return LAB_CATEGORIES.find((item) => item.id === id)?.label || id;
}

export function labSampleLabel(id: string) {
  return LAB_SAMPLE_TYPES.find((item) => item.id === id)?.label || id;
}
