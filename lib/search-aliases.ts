/**
 * Bilingual medical specialty and healthcare query aliases for ALUMAS search.
 * Maps English medical terms and Turkish synonyms to canonical specialties and keywords.
 */

export interface SpecialtyAlias {
  canonicalTr: string;
  canonicalEn: string;
  keywords: string[];
}

export const SPECIALTY_ALIASES: SpecialtyAlias[] = [
  {
    canonicalTr: "Kardiyoloji",
    canonicalEn: "Cardiology",
    keywords: ["cardiology", "cardiologist", "heart", "kalp", "kardiyolog", "damar", "tansiyon"],
  },
  {
    canonicalTr: "Dermatoloji",
    canonicalEn: "Dermatology",
    keywords: ["dermatology", "dermatologist", "skin", "cildiye", "cilt", "deri", "akne"],
  },
  {
    canonicalTr: "Nöroloji",
    canonicalEn: "Neurology",
    keywords: ["neurology", "neurologist", "brain", "sinir", "beyin", "nörolog", "migraine", "migren"],
  },
  {
    canonicalTr: "Ortopedi ve Travmatoloji",
    canonicalEn: "Orthopedics & Traumatology",
    keywords: ["orthopedics", "orthopedic", "bone", "joint", "kemik", "eklem", "kırık", "ortopedist"],
  },
  {
    canonicalTr: "Çocuk Sağlığı ve Hastalıkları",
    canonicalEn: "Pediatrics",
    keywords: ["pediatrics", "pediatrician", "child", "çocuk", "cocuk", "bebek", "pediatri"],
  },
  {
    canonicalTr: "Göz Hastalıkları",
    canonicalEn: "Ophthalmology",
    keywords: ["ophthalmology", "eye", "vision", "göz", "goz", "görme", "okulist"],
  },
  {
    canonicalTr: "Kulak Burun Boğaz (KBB)",
    canonicalEn: "Otolaryngology (ENT)",
    keywords: ["ent", "otolaryngology", "ear", "nose", "throat", "kbb", "kulak", "burun", "boğaz"],
  },
  {
    canonicalTr: "Dahiliye (İç Hastalıkları)",
    canonicalEn: "Internal Medicine",
    keywords: ["internal medicine", "internist", "dahiliye", "iç hastalıkları", "ic hastaliklari"],
  },
  {
    canonicalTr: "Genel Cerrahi",
    canonicalEn: "General Surgery",
    keywords: ["general surgery", "surgeon", "cerrahi", "ameliyat", "operatör"],
  },
  {
    canonicalTr: "Kadın Hastalıkları ve Doğum",
    canonicalEn: "Obstetrics & Gynecology",
    keywords: ["gynecology", "obstetrics", "obgyn", "kadın doğum", "kadin dogum", "jinekoloji", "gebelik"],
  },
  {
    canonicalTr: "Psikiyatri",
    canonicalEn: "Psychiatry",
    keywords: ["psychiatry", "psychiatrist", "mental health", "psikiyatri", "ruh sağlığı"],
  },
  {
    canonicalTr: "Psikoloji",
    canonicalEn: "Psychology & Psychotherapy",
    keywords: [
      "psychology",
      "psychologist",
      "clinical psychologist",
      "psikolog",
      "klinik psikolog",
      "psikoloji",
      "terapi",
      "psikoterapi",
      "psikolojik danışmanlık",
      "ruh sağlığı",
    ],
  },
  {
    canonicalTr: "Beslenme ve Diyetetik",
    canonicalEn: "Nutrition & Dietetics",
    keywords: [
      "dietitian",
      "nutrition",
      "dietetics",
      "nutritionist",
      "diyetisyen",
      "uzman diyetisyen",
      "dyt",
      "diyet",
      "beslenme",
      "kilo kontrolü",
      "obezite",
    ],
  },
  {
    canonicalTr: "Diş Hekimliği",
    canonicalEn: "Dentistry",
    keywords: [
      "dentistry",
      "dentist",
      "dental",
      "tooth",
      "teeth",
      "diş",
      "dis",
      "diş hekimi",
      "dis hekimi",
      "ağız ve diş sağlığı",
      "agiz ve dis sagligi",
      "dt",
      "implant",
      "ortodonti",
      "periodontoloji",
      "endodonti",
      "pedodonti",
    ],
  },
  {
    canonicalTr: "Üroloji",
    canonicalEn: "Urology",
    keywords: ["urology", "urologist", "üroloji", "uroloji", "böbrek", "kidney"],
  },
  {
    canonicalTr: "Fizik Tedavi ve Rehabilitasyon",
    canonicalEn: "Physical Therapy & Rehabilitation",
    keywords: [
      "physical therapy",
      "physiotherapy",
      "rehabilitation",
      "fizik tedavi",
      "fizyoterapi",
      "fizyoterapist",
      "fzt",
      "uzman fizyoterapist",
      "manuel terapi",
    ],
  },
];

/**
 * Given a search query, returns matched Turkish specialty names to expand DB queries.
 */
export function resolveSearchSpecialties(query: string): string[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const matched = new Set<string>();

  for (const item of SPECIALTY_ALIASES) {
    if (
      item.canonicalTr.toLowerCase().includes(q) ||
      item.canonicalEn.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q) || q.includes(k))
    ) {
      matched.add(item.canonicalTr);
    }
  }

  return Array.from(matched);
}
