import { prisma } from "../lib/prisma";

async function audit() {
  const total = await prisma.directoryInstitution.count();
  const active = await prisma.directoryInstitution.count({ where: { isActive: true } });
  const byType = await prisma.directoryInstitution.groupBy({
    by: ["type"],
    _count: { id: true },
  });
  const withWebsite = await prisma.directoryInstitution.count({
    where: { isActive: true, officialWebsite: { not: null } },
  });
  const hospitalsAndClinicsWithWeb = await prisma.directoryInstitution.findMany({
    where: {
      isActive: true,
      type: { in: ["HOSPITAL", "CLINIC"] },
      officialWebsite: { not: null },
    },
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
      district: true,
      officialWebsite: true,
      source: true,
    },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });

  console.log("=== INSTITUTION SEED AUDIT ===");
  console.log({
    total,
    active,
    byType,
    withWebsite,
    hospitalClinicWebCount: hospitalsAndClinicsWithWeb.length,
  });

  // Unique domains
  const domainMap = new Map<string, number>();
  for (const h of hospitalsAndClinicsWithWeb) {
    if (!h.officialWebsite) continue;
    try {
      const u = new URL(h.officialWebsite);
      const domain = u.hostname.replace(/^www\./, "");
      domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
    } catch {}
  }

  console.log("Unique domains count:", domainMap.size);
  const topDomains = Array.from(domainMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  console.log("Top domains:", topDomains);

  console.log("Sample 15 hospital/clinic websites:");
  console.log(JSON.stringify(hospitalsAndClinicsWithWeb.slice(0, 15), null, 2));
}

audit().finally(() => prisma.$disconnect());
