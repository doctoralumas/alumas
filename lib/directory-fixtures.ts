export type DirectoryOrganizationType =
  | "HOSPITAL"
  | "CLINIC"
  | "PHARMACY"
  | "IMAGING_CENTER"
  | "LABORATORY";

export interface DirectoryInstitutionRecord {
  id: string;
  slug: string;
  name: string;
  type: DirectoryOrganizationType;
  city: string;
  district: string | null;
  address: string;
  phone: string | null;
  officialWebsite: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  isOnDuty: boolean;
  onDutyUntil: Date | string | null;
  source: string;
  externalRef: string | null;
  lastVerifiedAt: Date | string | null;
  isActive: boolean;
  organizationId: string | null;
  organization?: any | null;
  claims?: any[];
}

/**
 * Curated public healthcare directory listings representing verified real-world
 * institutions not yet registered or verified on ALUMAS.
 *
 * NOTE: Runtime directory queries (`loadDirectoryInstitutionRecords`) read from the
 * PostgreSQL `DirectoryInstitution` table in production and do NOT automatically
 * inject these fixtures unless `ALLOW_DIRECTORY_FIXTURE_FALLBACK=true` is explicitly
 * set in non-production environments.
 */
export const CURATED_DIRECTORY_INSTITUTIONS: DirectoryInstitutionRecord[] = [
  {
    id: "dir-acibadem-maslak",
    slug: "acibadem-maslak-hastanesi",
    name: "Acıbadem Maslak Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Sarıyer",
    address: "Darüşşafaka Mah. Büyükdere Cad. No:40 Maslak",
    phone: "+90 212 304 44 44",
    // Root corporate domain of Acıbadem Healthcare Group
    officialWebsite: "https://www.acibadem.com.tr",
    description: "Çok branşlı genel hastane ve tanı merkezi (Harici Dizin Kaydı).",
    latitude: 41.1264,
    longitude: 29.0247,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-ACIBADEM-MASLAK",
    lastVerifiedAt: "2026-10-01T09:00:00.000Z",
    isActive: true,
    organizationId: null,
  },
  {
    id: "dir-amerikan-hastanesi",
    slug: "vkv-amerikan-hastanesi",
    name: "VKV Amerikan Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Şişli",
    address: "Teşvikiye Mah. Güzelbahçe Sok. No:20 Nişantaşı",
    phone: "+90 212 444 37 77",
    officialWebsite: "https://www.amerikanhastanesi.org",
    description: "Genel hastane ve poliklinik hizmetleri (Harici Dizin Kaydı).",
    latitude: 41.0522,
    longitude: 28.9935,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-AMERIKAN-SISLI",
    lastVerifiedAt: "2026-10-01T09:00:00.000Z",
    isActive: true,
    organizationId: null,
  },
  {
    id: "dir-memorial-sisli",
    slug: "memorial-sisli-hastanesi",
    name: "Memorial Şişli Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Şişli",
    address: "Kaptanpaşa Mah. Piyalepaşa Bulvarı No:4",
    phone: "+90 212 314 66 66",
    // Root corporate domain of Memorial Healthcare Group
    officialWebsite: "https://www.memorial.com.tr",
    description: "Sağlık hizmetleri ve ileri tanı merkezi (Harici Dizin Kaydı).",
    latitude: 41.0615,
    longitude: 28.9734,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-MEMORIAL-SISLI",
    lastVerifiedAt: "2026-10-01T09:00:00.000Z",
    isActive: true,
    organizationId: null,
  },
  {
    id: "dir-ankara-bilkent-sehir",
    slug: "ankara-bilkent-sehir-hastanesi",
    name: "Ankara Bilkent Şehir Hastanesi",
    type: "HOSPITAL",
    city: "Ankara",
    district: "Çankaya",
    address: "Üniversiteler Mah. 1604. Cad. No:9 Bilkent",
    phone: "+90 312 552 60 00",
    officialWebsite: "https://ankarasehir.saglik.gov.tr",
    description: "Bölge eğitim ve araştırma şehir hastanesi kampüsü (Harici Dizin Kaydı).",
    latitude: 39.8986,
    longitude: 32.7565,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-ANK-BILKENT-SEHIR",
    lastVerifiedAt: "2026-10-01T09:00:00.000Z",
    isActive: true,
    organizationId: null,
  },
  {
    id: "dir-medicana-kadikoy",
    slug: "medicana-kadikoy-hastanesi",
    name: "Medicana Kadıköy Hastanesi",
    type: "HOSPITAL",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Zühtüpaşa Mah. Recep Peker Cad. No:11 Kızıltoprak",
    phone: null,
    // Root corporate domain of Medicana Health Group
    officialWebsite: "https://www.medicana.com.tr",
    description: "Çok branşlı genel hastane ve tanı merkezi (Harici Dizin Kaydı).",
    latitude: 40.9854,
    longitude: 29.0389,
    isOnDuty: false,
    onDutyUntil: null,
    source: "CURATED_PUBLIC_DIRECTORY",
    externalRef: "TR-IST-MEDICANA-KADIKOY",
    lastVerifiedAt: "2026-10-01T09:00:00.000Z",
    isActive: true,
    organizationId: null,
  },
];


