
"use server"

import { prisma } from "./prisma";

export async function performLiveSearch(query: string) {
  if (!query || query.length < 2) return { doctors: [], organizations: [], services: [] };

  try {
    // 1. Search Doctors
    const doctors = await prisma.doctor.findMany({
      where: {
        name: { contains: query, mode: "insensitive" }
      },
      select: { id: true, name: true, slug: true, specialty: true },
      take: 3
    });

    // 2. Search Organizations (Hospitals/Clinics)
    const organizations = await prisma.organization.findMany({
      where: {
        name: { contains: query, mode: "insensitive" }
      },
      select: { id: true, name: true, slug: true, type: true },
      take: 3
    });

    // 3. Static Services Search (Hardcoded dictionary for instant routing)
    const staticServices = [
      { name: "Doktor Bul", url: "/doctors", keywords: ["doktor", "uzman", "hekim", "randevu"] },
      { name: "Hastaneler & Klinikler", url: "/organizations", keywords: ["hastane", "klinik", "merkez", "kurum"] },
      { name: "Evde Sağlık", url: "/home-care", keywords: ["evde", "bakım", "hemşire", "iğne", "serum"] },
      { name: "Sigortalar", url: "/insurance", keywords: ["sigorta", "allianz", "tamamlayıcı", "tss", "öss"] },
      { name: "Sağlık Turizmi", url: "/health-tourism", keywords: ["turizm", "yurtdışı", "uçak", "tedavi"] },
      { name: "Laboratuvar", url: "/health/labs", keywords: ["tahlil", "laboratuvar", "kan", "test", "sonuç"] },
      { name: "Regl Takibi", url: "/health/cycle", keywords: ["regl", "kadın", "adet", "takvim", "döngü"] },
      { name: "İlaçlarım", url: "/health/medications", keywords: ["ilaç", "eczane", "reçete", "hatırlatıcı"] }
    ];

    const qLower = query.toLowerCase();
    const services = staticServices.filter(s => 
      s.name.toLowerCase().includes(qLower) || s.keywords.some(k => k.includes(qLower))
    ).slice(0, 3);

    return { doctors, organizations, services };
  } catch (error) {
    console.error("Live Search Error:", error);
    return { doctors: [], organizations: [], services: [] };
  }
}
