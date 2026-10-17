"use server";

import { prisma } from "./prisma";
import { resolveSearchSpecialties } from "./search-aliases";

export async function performLiveSearch(query: string) {
  if (!query || query.trim().length < 2) return { doctors: [], organizations: [], services: [] };

  const trimmed = query.trim();
  const qLower = trimmed.toLowerCase();
  const matchedSpecialties = resolveSearchSpecialties(trimmed);

  try {
    // 1. Search Doctors by name OR specialty (including English-resolved Turkish specialties)
    const doctorWhereOr: any[] = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { specialty: { contains: trimmed, mode: "insensitive" } },
    ];

    for (const spec of matchedSpecialties) {
      doctorWhereOr.push({ specialty: { contains: spec, mode: "insensitive" } });
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        OR: doctorWhereOr,
      },
      select: { id: true, name: true, slug: true, specialty: true },
      take: 3,
    });

    // 2. Search Organizations (Hospitals/Clinics)
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { city: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, type: true },
      take: 3,
    });

    // 3. Static Services Search (Bilingual dictionary for instant routing)
    const staticServices = [
      {
        name: "Doktor Bul",
        nameEn: "Find Doctors",
        url: "/doctors",
        keywords: ["doktor", "uzman", "hekim", "randevu", "doctor", "specialist", "physician", "appointment"],
      },
      {
        name: "Hastaneler & Klinikler",
        nameEn: "Hospitals & Clinics",
        url: "/organizations",
        keywords: ["hastane", "klinik", "merkez", "kurum", "hospital", "clinic", "medical center", "facility"],
      },
      {
        name: "Evde Sağlık",
        nameEn: "Home Care",
        url: "/home-care",
        keywords: ["evde", "bakım", "hemşire", "iğne", "serum", "home care", "nurse", "home visit"],
      },
      {
        name: "Sigortalar",
        nameEn: "Insurance",
        url: "/insurance",
        keywords: ["sigorta", "allianz", "tamamlayıcı", "tss", "öss", "insurance", "policy", "coverage"],
      },
      {
        name: "Sağlık Turizmi",
        nameEn: "Health Tourism",
        url: "/health-tourism",
        keywords: ["turizm", "yurtdışı", "uçak", "tedavi", "tourism", "cross-border", "travel"],
      },
      {
        name: "Laboratuvar",
        nameEn: "Laboratory",
        url: "/health/labs",
        keywords: ["tahlil", "laboratuvar", "kan", "test", "sonuç", "lab", "blood", "test results"],
      },
      {
        name: "Regl Takibi",
        nameEn: "Cycle Tracker",
        url: "/health/cycle",
        keywords: ["regl", "kadın", "adet", "takvim", "döngü", "cycle", "period", "menstrual", "women"],
      },
      {
        name: "İlaçlarım",
        nameEn: "Medications",
        url: "/health/medications",
        keywords: ["ilaç", "eczane", "reçete", "hatırlatıcı", "medication", "pill", "pharmacy", "prescription"],
      },
    ];

    const services = staticServices
      .filter(
        (s) =>
          s.name.toLowerCase().includes(qLower) ||
          s.nameEn.toLowerCase().includes(qLower) ||
          s.keywords.some((k) => k.includes(qLower) || qLower.includes(k))
      )
      .slice(0, 3);

    return { doctors, organizations, services };
  } catch (error) {
    console.error("Live Search Error:", error);
    return { doctors: [], organizations: [], services: [] };
  }
}
