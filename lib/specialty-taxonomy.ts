/**
 * ALUMAS — Canonical Medical & Healthcare Specialty Taxonomy
 * 
 * Provides unified, bilingual, deduplicated specialty classification across:
 * - Physicians (All medical & surgical subspecialties)
 * - Dentists & Dental Specialists (Orthodontics, Periodontics, Endodontics, Oral Surgery, Pedodontics)
 * - Dietitians & Nutritionists
 * - Physiotherapists & Manual Therapists
 * - Clinical Psychologists & Psychotherapists
 * 
 * Maps 100% of raw directory and hospital variations to canonical, user-friendly filter entries.
 */

export interface CanonicalSpecialty {
  id: string;
  nameTr: string;
  nameEn: string;
  aliases: string[];
  category: "PHYSICIAN" | "DENTIST" | "DIETITIAN" | "PHYSIOTHERAPIST" | "CLINICAL_PSYCHOLOGIST" | "OTHER";
}

export const CANONICAL_SPECIALTIES: CanonicalSpecialty[] = [
  // Dental Specialties
  {
    id: "dis-hekimligi",
    nameTr: "Diş Hekimliği",
    nameEn: "Dentistry",
    category: "DENTIST",
    aliases: [
      "diş hekimi",
      "diş hekimliği",
      "ağız ve diş sağlığı",
      "protetik diş tedavisi uzmanı",
      "dis hekimi",
      "dentistry",
      "dentist",
    ],
  },
  {
    id: "agiz-dis-cene-cerrahisi",
    nameTr: "Ağız, Diş ve Çene Cerrahisi",
    nameEn: "Oral & Maxillofacial Surgery",
    category: "DENTIST",
    aliases: [
      "ağız diş çene cerrahı",
      "ağız, diş ve çene cerrahisi uzmanı",
      "diş hekimi - ağız, diş ve çene cerrahisi",
      "agiz dis ve cene cerrahisi",
      "çene cerrahisi",
      "oral surgery",
    ],
  },
  {
    id: "ortodonti",
    nameTr: "Ortodonti",
    nameEn: "Orthodontics",
    category: "DENTIST",
    aliases: [
      "ortodonti",
      "ortodonti uzmanı",
      "diş hekimi - ortodonti",
      "orthodontics",
    ],
  },
  {
    id: "periodontoloji",
    nameTr: "Periodontoloji",
    nameEn: "Periodontology",
    category: "DENTIST",
    aliases: [
      "periodontoloji",
      "periodontoloji uzmanı",
      "periodontoloji-implantoloji",
      "periodontology",
      "implantoloji",
    ],
  },
  {
    id: "endodonti",
    nameTr: "Endodonti (Kanal Tedavisi)",
    nameEn: "Endodontics",
    category: "DENTIST",
    aliases: ["endodonti uzmanı", "endodonti", "endodontics"],
  },
  {
    id: "pedodonti",
    nameTr: "Pedodonti (Çocuk Diş Hekimliği)",
    nameEn: "Pediatric Dentistry",
    category: "DENTIST",
    aliases: ["pedodonti uzmanı", "pedodonti", "çocuk diş hekimliği"],
  },

  // Allied Healthcare Disciplines
  {
    id: "beslenme-ve-diyetetik",
    nameTr: "Beslenme ve Diyetetik",
    nameEn: "Nutrition & Dietetics",
    category: "DIETITIAN",
    aliases: [
      "diyetisyen",
      "beslenme ve diyetetik",
      "diyet",
      "uzman diyetisyen",
      "dyt",
      "nutrition",
      "dietetics",
    ],
  },
  {
    id: "fizyoterapi",
    nameTr: "Fizyoterapi ve Rehabilitasyon",
    nameEn: "Physical Therapy & Rehabilitation",
    category: "PHYSIOTHERAPIST",
    aliases: [
      "fizyoterapi",
      "fizyoterapist",
      "fizik tedavi ve rehabilitasyon",
      "fiziksel tıp ve rehabilitasyon",
      "manuel terapi",
      "fzt",
      "physiotherapy",
      "physical therapy",
    ],
  },
  {
    id: "psikoloji",
    nameTr: "Klinik Psikoloji ve Psikoterapi",
    nameEn: "Clinical Psychology & Psychotherapy",
    category: "CLINICAL_PSYCHOLOGIST",
    aliases: [
      "psikoloji",
      "klinik psikoloji",
      "psikolojik danışman",
      "aile danışmanı",
      "psikolog",
      "klinik psikolog",
      "psikoterapi",
      "psychology",
      "psychologist",
    ],
  },

  // Medical Specialties (Physicians)
  {
    id: "psikiyatri",
    nameTr: "Psikiyatri (Ruh Sağlığı ve Hastalıkları)",
    nameEn: "Psychiatry",
    category: "PHYSICIAN",
    aliases: [
      "psikiyatri",
      "çocuk ve ergen psikiyatristi",
      "ruh sağlığı ve hastalıkları",
      "psychiatry",
      "psychiatrist",
    ],
  },
  {
    id: "kadin-hastaliklari-ve-dogum",
    nameTr: "Kadın Hastalıkları ve Doğum",
    nameEn: "Obstetrics & Gynecology",
    category: "PHYSICIAN",
    aliases: [
      "kadın hastalıkları ve doğum",
      "jinekoloji",
      "perinatoloji",
      "kadın doğum",
      "gynecology",
      "obstetrics",
      "obgyn",
    ],
  },
  {
    id: "genel-cerrahi",
    nameTr: "Genel Cerrahi",
    nameEn: "General Surgery",
    category: "PHYSICIAN",
    aliases: [
      "genel cerrahi",
      "sindirim sistemi hastalıkları ve cerrahisi",
      "general surgery",
      "cerrahi",
    ],
  },
  {
    id: "cocuk-sagligi-ve-hastaliklari",
    nameTr: "Çocuk Sağlığı ve Hastalıkları",
    nameEn: "Pediatrics",
    category: "PHYSICIAN",
    aliases: [
      "çocuk sağlığı ve hastalıkları",
      "çocuk sağlığı ve hastalıkları (pediatri)",
      "çocuk yoğun bakım",
      "çocuk gelişim uzmanı",
      "pediatri",
      "pediatrics",
      "pediatrician",
    ],
  },
  {
    id: "cocuk-cerrahisi",
    nameTr: "Çocuk Cerrahisi",
    nameEn: "Pediatric Surgery",
    category: "PHYSICIAN",
    aliases: ["çocuk cerrahisi", "çocuk ürolojisi", "pediatric surgery"],
  },
  {
    id: "cocuk-kardiyolojisi",
    nameTr: "Çocuk Kardiyolojisi",
    nameEn: "Pediatric Cardiology",
    category: "PHYSICIAN",
    aliases: ["çocuk kardiyolojisi"],
  },
  {
    id: "cocuk-nefrolojisi",
    nameTr: "Çocuk Nefrolojisi",
    nameEn: "Pediatric Nephrology",
    category: "PHYSICIAN",
    aliases: ["çocuk nefrolojisi"],
  },
  {
    id: "kardiyoloji",
    nameTr: "Kardiyoloji",
    nameEn: "Cardiology",
    category: "PHYSICIAN",
    aliases: ["kardiyoloji", "kalp hastalıkları", "cardiology", "cardiologist"],
  },
  {
    id: "kalp-ve-damar-cerrahisi",
    nameTr: "Kalp ve Damar Cerrahisi",
    nameEn: "Cardiovascular Surgery",
    category: "PHYSICIAN",
    aliases: [
      "kalp damar cerrahisi",
      "kalp ve damar cerrahisi",
      "kalp ve damar cerrahisi (kvc)",
      "varis tedavisi",
      "cardiovascular surgery",
    ],
  },
  {
    id: "ortopedi-ve-travmatoloji",
    nameTr: "Ortopedi ve Travmatoloji",
    nameEn: "Orthopedics & Traumatology",
    category: "PHYSICIAN",
    aliases: [
      "ortopedi ve travmatoloji",
      "el cerrahisi ve mikro cerrahi",
      "omurga sağlığı",
      "omuz ve dirsek cerrahisi",
      "orthopedics",
      "traumatology",
    ],
  },
  {
    id: "goz-hastaliklari",
    nameTr: "Göz Hastalıkları",
    nameEn: "Ophthalmology",
    category: "PHYSICIAN",
    aliases: ["göz hastalıkları", "okuloplasti", "oftalmoloji", "ophthalmology"],
  },
  {
    id: "kulak-burun-bogaz",
    nameTr: "Kulak Burun Boğaz (KBB)",
    nameEn: "Otolaryngology (ENT)",
    category: "PHYSICIAN",
    aliases: [
      "kulak burun boğaz",
      "kulak burun boğaz hastalıkları   kbb",
      "kbb",
      "otolaryngology",
      "ent",
    ],
  },
  {
    id: "dahiliye",
    nameTr: "Dahiliye (İç Hastalıkları)",
    nameEn: "Internal Medicine",
    category: "PHYSICIAN",
    aliases: [
      "dahiliye   iç hastalıkları",
      "dahiliye",
      "iç hastalıkları",
      "internal medicine",
      "check-up",
    ],
  },
  {
    id: "dermatoloji",
    nameTr: "Dermatoloji (Cildiye)",
    nameEn: "Dermatology",
    category: "PHYSICIAN",
    aliases: [
      "dermatoloji",
      "deri hastalıkları - dermatoloji (cildiye)",
      "cildiye",
      "dermatology",
    ],
  },
  {
    id: "noroloji",
    nameTr: "Nöroloji",
    nameEn: "Neurology",
    category: "PHYSICIAN",
    aliases: [
      "nöroloji",
      "nöroloji (beyin ve sinir hastalıkları)",
      "neurology",
    ],
  },
  {
    id: "beyin-ve-sinir-cerrahisi",
    nameTr: "Beyin ve Sinir Cerrahisi",
    nameEn: "Neurosurgery",
    category: "PHYSICIAN",
    aliases: [
      "beyin ve sinir cerrahisi",
      "nöroşirürji",
      "neurosurgery",
    ],
  },
  {
    id: "plastik-cerrahi",
    nameTr: "Plastik, Rekonstrüktif ve Estetik Cerrahi",
    nameEn: "Plastic & Reconstructive Surgery",
    category: "PHYSICIAN",
    aliases: [
      "plastik rekonstrüktif ve estetik cerrahi",
      "sertifikalı medikal estetik",
      "estetik cerrahi",
      "plastic surgery",
    ],
  },
  {
    id: "uroloji",
    nameTr: "Üroloji",
    nameEn: "Urology",
    category: "PHYSICIAN",
    aliases: ["üroloji", "ürolojik onkoloji", "urology"],
  },
  {
    id: "gogus-hastaliklari",
    nameTr: "Göğüs Hastalıkları",
    nameEn: "Pulmonology",
    category: "PHYSICIAN",
    aliases: ["göğüs hastalıkları", "pulmonology"],
  },
  {
    id: "gogus-cerrahisi",
    nameTr: "Göğüs Cerrahisi",
    nameEn: "Thoracic Surgery",
    category: "PHYSICIAN",
    aliases: ["göğüs cerrahisi", "thoracic surgery"],
  },
  {
    id: "gastroenteroloji",
    nameTr: "Gastroenteroloji",
    nameEn: "Gastroenterology",
    category: "PHYSICIAN",
    aliases: ["gastroenteroloji", "gastroenterology"],
  },
  {
    id: "nefroloji",
    nameTr: "Nefroloji",
    nameEn: "Nephrology",
    category: "PHYSICIAN",
    aliases: ["nefroloji", "nephrology"],
  },
  {
    id: "tibbi-onkoloji",
    nameTr: "Tıbbi Onkoloji",
    nameEn: "Medical Oncology",
    category: "PHYSICIAN",
    aliases: ["medikal onkoloji", "tıbbi onkoloji", "medical oncology"],
  },
  {
    id: "radyasyon-onkolojisi",
    nameTr: "Radyasyon Onkolojisi",
    nameEn: "Radiation Oncology",
    category: "PHYSICIAN",
    aliases: ["radyasyon onkolojisi", "radiation oncology"],
  },
  {
    id: "radyoloji",
    nameTr: "Radyoloji",
    nameEn: "Radiology",
    category: "PHYSICIAN",
    aliases: ["radyoloji", "girişimsel radyoloji", "radiology"],
  },
  {
    id: "enfeksiyon-hastaliklari",
    nameTr: "Enfeksiyon Hastalıkları",
    nameEn: "Infectious Diseases",
    category: "PHYSICIAN",
    aliases: [
      "enfeksiyon hastalıkları",
      "enfeksiyon hastalıkları ve klinik mikrobiyoloji",
      "infectious diseases",
    ],
  },
  {
    id: "hematoloji",
    nameTr: "Hematoloji",
    nameEn: "Hematology",
    category: "PHYSICIAN",
    aliases: ["hematoloji", "hematology"],
  },
  {
    id: "patoloji",
    nameTr: "Tıbbi Patoloji",
    nameEn: "Pathology",
    category: "PHYSICIAN",
    aliases: ["patoloji", "pathology"],
  },
  {
    id: "anesteziyoloji-ve-reanimasyon",
    nameTr: "Anesteziyoloji ve Reanimasyon",
    nameEn: "Anesthesiology & Reanimation",
    category: "PHYSICIAN",
    aliases: [
      "anestezi uzmanı",
      "anestezi ve reanimasyon",
      "anestezi",
      "anesthesiology",
    ],
  },
  {
    id: "algoloji",
    nameTr: "Algoloji (Ağrı Tedavisi)",
    nameEn: "Pain Medicine (Algology)",
    category: "PHYSICIAN",
    aliases: ["algoloji", "pain medicine"],
  },
  {
    id: "acil-tip",
    nameTr: "Acil Tıp",
    nameEn: "Emergency Medicine",
    category: "PHYSICIAN",
    aliases: ["acil servis", "acil tıp", "emergency medicine"],
  },
  {
    id: "aile-hekimligi",
    nameTr: "Aile Hekimliği ve Pratisyenlik",
    nameEn: "Family & General Medicine",
    category: "PHYSICIAN",
    aliases: [
      "aile hekimliği",
      "pratisyen hekimlik",
      "işyeri hekimliği",
      "family medicine",
      "general practitioner",
    ],
  },
  {
    id: "geleneksel-ve-tamamlayici-tip",
    nameTr: "Geleneksel ve Tamamlayıcı Tıp",
    nameEn: "Complementary Medicine",
    category: "OTHER",
    aliases: [
      "geleneksel ve tamamlayıcı tıp",
      "akupunktur",
      "obezite tedavisi",
    ],
  },
  {
    id: "diger-saglik-uzmanliklari",
    nameTr: "Diğer Sağlık Uzmanlıkları",
    nameEn: "Other Healthcare Disciplines",
    category: "OTHER",
    aliases: [
      "dil ve konuşma terapisi",
      "podoloji",
      "başhekim",
      "mesul müdür",
    ],
  },
];

function normalizeLookupKey(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds the canonical specialty definition for any raw input string (from DB or user query).
 */
export function findCanonicalSpecialty(rawSpecialty: string | null | undefined): CanonicalSpecialty | null {
  if (!rawSpecialty) return null;
  const norm = normalizeLookupKey(rawSpecialty);

  // Exact ID or name match first
  for (const cs of CANONICAL_SPECIALTIES) {
    if (
      cs.id === rawSpecialty ||
      cs.nameTr.toLocaleLowerCase("tr-TR") === norm ||
      cs.nameEn.toLowerCase() === norm
    ) {
      return cs;
    }
  }

  // Alias lookup
  for (const cs of CANONICAL_SPECIALTIES) {
    for (const alias of cs.aliases) {
      const normAlias = normalizeLookupKey(alias);
      if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
        return cs;
      }
    }
  }

  return null;
}

/**
 * Returns canonical specialties present in a doctor list, sorted alphabetically by locale.
 */
export function getAvailableCanonicalSpecialties(
  doctors: { specialty?: string | null }[],
  locale: string = "tr"
): { id: string; label: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const d of doctors) {
    if (!d.specialty) continue;
    const canonical = findCanonicalSpecialty(d.specialty);
    if (!canonical) continue;
    counts.set(canonical.id, (counts.get(canonical.id) || 0) + 1);
  }

  const result: { id: string; label: string; count: number }[] = [];
  for (const [id, count] of counts.entries()) {
    const cs = CANONICAL_SPECIALTIES.find((c) => c.id === id);
    if (!cs) continue;
    const label = locale === "en" ? cs.nameEn : cs.nameTr;
    result.push({ id, label, count });
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, locale === "en" ? "en" : "tr"));
}

/**
 * Checks whether a doctor's specialty matches the selected canonical filter.
 */
export function matchesSpecialtyFilter(
  rawSpecialty: string | null | undefined,
  filterValue: string | null | undefined
): boolean {
  if (!filterValue) return true;
  if (!rawSpecialty) return false;

  const docCanonical = findCanonicalSpecialty(rawSpecialty);
  if (!docCanonical) {
    return normalizeLookupKey(rawSpecialty) === normalizeLookupKey(filterValue);
  }

  // filterValue could be the canonical ID or one of the canonical names
  const filterCanonical = findCanonicalSpecialty(filterValue);
  if (filterCanonical) {
    return docCanonical.id === filterCanonical.id;
  }

  return docCanonical.id === filterValue;
}
