/**
 * Display-only identity matching for ODbL hospitals.
 * The standalone OSM snapshot is NEVER rewritten, joined with ALUMAS data,
 * or reduced in the downloadable dataset.
 */
export interface HospitalIdentity {
  name: string;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SourceHospitalIdentity extends HospitalIdentity {
  sourceId: string;
}

export function hospitalNameKey(value: string | null | undefined): string {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GENERIC_NAMES = new Set(["hastane", "hastanesi", "hospital", "devlet hastanesi", "medical center"]);
const IGNORED_NAME_TOKENS = new Set([
  "ozel", "hastane", "hastanesi", "hastaneleri", "hospital", "hospitals", "ve", "t", "c", "vkv",
]);

/** Ignore entrances, emergency departments, clinics and annexes, not actual hospitals. */
export function isDisplayableOsmHospital(row: HospitalIdentity): boolean {
  const name = hospitalNameKey(row.name);
  if (name.length < 3 || GENERIC_NAMES.has(name)) return false;
  if (/(^| )eski( |$)/.test(name)) return false;
  if (/(^| )(acil servisi|acil servis|acil girisi|acil giris|acil bolumu|kvc girisi|radyasyon onkolojisi|merkez poliklinigi|poliklinikler|poliklinigi|ek binasi|ana binasi)( |$)/.test(name)) return false;
  if (/(^| )acil$/.test(name) || /(^| )(ana giris|giris|[a-z]+ binasi|[a-z] blok|ayak sagligi birimi|kan alma birimi)$/.test(name)) return false;
  // Many legitimate OSM hospitals have *only* name, OSM object ID and location.
  // Requiring address, city, website or telephone would silently hide them.
  return row.latitude != null && row.longitude != null
    && Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
    && Math.abs(row.latitude) <= 90 && Math.abs(row.longitude) <= 180;
}

export function hospitalDistanceMetres(a: HospitalIdentity, b: HospitalIdentity): number {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null
    || !Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)
    || !Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)) return Infinity;
  const toRad = Math.PI / 180;
  const lat1 = a.latitude * toRad, lat2 = b.latitude * toRad;
  const dLat = lat2 - lat1, dLon = (b.longitude - a.longitude) * toRad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function identityTokens(name: string): string[] {
  return hospitalNameKey(name).split(" ").filter((token) => token.length >= 2 && !IGNORED_NAME_TOKENS.has(token));
}

export function samePhysicalHospital(a: HospitalIdentity, b: HospitalIdentity): boolean {
  const firstName = hospitalNameKey(a.name), secondName = hospitalNameKey(b.name);
  if (!firstName || !secondName || GENERIC_NAMES.has(firstName) || GENERIC_NAMES.has(secondName)) return false;
  const distance = hospitalDistanceMetres(a, b);

  // If both locations are missing, only merge on exact unique name + city + address.
  // Chain hospitals with the same name in different branches must not be merged.
  if (!Number.isFinite(distance)) {
    const aCity = hospitalNameKey(a.city), bCity = hospitalNameKey(b.city);
    const aAddress = hospitalNameKey(a.address), bAddress = hospitalNameKey(b.address);
    return firstName === secondName && firstName.length >= 9
      && Boolean(aCity && bCity && aCity === bCity)
      && aAddress.length >= 12 && aAddress === bAddress;
  }

  // Map markers may identify a facility entrance or polygon centroid, which can
  // differ by a few hundred metres. Allow that margin ONLY for exact names or
  // names that become identical after removing a legal-entity prefix (e.g. VKV).
  if (distance > 325) return false;
  const aCity = hospitalNameKey(a.city), bCity = hospitalNameKey(b.city);
  if (aCity && bCity && aCity !== bCity && distance > 35) return false;
  if (firstName === secondName && firstName.length >= 8) return true;

  const first = identityTokens(a.name), second = identityTokens(b.name);
  if (!first.length || !second.length) return false;
  if (first.join(" ") === second.join(" ") && first.join("").length >= 7
    && (distance <= 175 || (
      distance <= 300 && first.length === 1 && first[0].length >= 7
    ))) return true;
  // Looser token overlap is only safe within the same small campus footprint.
  if (distance > 45) return false;
  const small = first.length <= second.length ? first : second;
  const large = small === first ? second : first;
  const shared = small.filter((token) => large.includes(token));
  if (shared.length !== small.length) return false;
  if (shared.length >= 2 && small.join("").length >= 7) return true;
  // Allow a distinctive short brand + campus qualifier (e.g. Liv Hospital / Liv Hospital Ulus)
  // only when the two map markers are virtually at the same position.
  return distance <= 15 && shared.length === 1 && shared[0].length >= 3
    && large.length <= 2;
}

function recordQuality(row: SourceHospitalIdentity): number {
  return Number(Boolean(row.website)) * 16 + Number(Boolean(row.address)) * 8
    + Number(Boolean(row.city)) * 4 + Number(Boolean(row.district)) * 2
    + Number(row.sourceId.startsWith("OSM:way/")) + row.name.length / 1000;
}

/** Deterministic OSM-only display selection, never a destructive source-data operation. */
export function uniqueOsmDisplayIds<T extends SourceHospitalIdentity>(rows: T[]): Set<string> {
  const selected: T[] = [];
  const sorted = rows.filter(isDisplayableOsmHospital)
    .sort((a, b) => recordQuality(b) - recordQuality(a) || a.sourceId.localeCompare(b.sourceId));
  for (const row of sorted) {
    if (!selected.some((existing) => samePhysicalHospital(row, existing))) selected.push(row);
  }
  return new Set(selected.map((row) => row.sourceId));
}

/** ALUMAS-owned/curated cards always take precedence; OSM records remain exportable. */
export function hideCuratedHospitalDuplicates<T extends HospitalIdentity>(osm: T[], curated: HospitalIdentity[]): T[] {
  return osm.filter((osmRow) => !curated.some((item) => samePhysicalHospital(item, osmRow)));
}
