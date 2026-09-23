export const HOME_CARE_KINDS = [
  { id: "doctor", title: "Evde Doktor Ziyareti" },
  { id: "nurse", title: "Evde Hemşirelik" },
  { id: "blood", title: "Kan / Numune Alma" },
  { id: "dressing", title: "Pansuman" },
  { id: "physio", title: "Fizyoterapi Desteği" },
] as const;

export type HomeCareKind = (typeof HOME_CARE_KINDS)[number]["id"];
export const CLINIC_HOME_KINDS = ["nurse", "dressing", "physio"] as const;
export type ClinicHomeKind = (typeof CLINIC_HOME_KINDS)[number];

export function homeCareTitle(kind: string) {
  return HOME_CARE_KINDS.find((item) => item.id === kind)?.title || kind;
}

export function isClinicHomeKind(kind: string): kind is ClinicHomeKind {
  return (CLINIC_HOME_KINDS as readonly string[]).includes(kind);
}

export function isLegacyHomeRequest(row: { organizationId?: string | null; serviceId?: string | null; laboratoryTestId?: string | null }) {
  return !row.organizationId && !row.serviceId && !row.laboratoryTestId;
}

export function homeVisitStatusLabel(status: string, legacy: boolean) {
  if (legacy) return "Karşılanmamış eski talep";
  if (status === "REQUESTED") return "Talep bekliyor";
  if (status === "ACCEPTED") return "Kabul edildi";
  if (status === "DECLINED") return "Reddedildi";
  if (status === "COMPLETED") return "Tamamlandı";
  if (status === "CANCELLED") return "İptal edildi";
  return "Karşılanmamış eski talep";
}

export function appointmentPlaceLabel(type: string) {
  if (type === "online") return "Online";
  if (type === "home") return "Evde";
  return "Klinik";
}

export function foldCity(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

export function sameCity(left?: string | null, right?: string | null) {
  if (!left?.trim() || !right?.trim()) return false;
  return foldCity(left) === foldCity(right);
}

export function parsePreferredAt(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const zoned = /[zZ]$|[+-]\d{2}:\d{2}$/.test(text);
  const date = new Date(zoned ? text : `${text.length === 16 ? `${text}:00` : text}+03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function publishedOrganizationWhere() {
  return {
    status: "APPROVED" as const,
    isPublished: true,
    verificationDocuments: { none: { status: "APPROVED" as const, expiresAt: { lt: new Date() } } },
  };
}
