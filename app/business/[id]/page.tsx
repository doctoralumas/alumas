import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import OrganizationManager from "@/components/business/organization-manager";
import InsurerWorkspaceManager from "@/components/business/insurer-workspace-manager";
import { loadFullInsuranceEcosystemState } from "@/lib/insurance-ecosystem-store";
import { filterPublicCatalogInsurers } from "@/lib/insurance-domain";

export default async function ManageOrganization({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/login");
  const { id } = await params;
  let org: any = await prisma.organization.findFirst({
    where: u.role === "ADMIN" ? { id } : { id, ownerUserId: u.id },
    include: {
      services: { include: { variants: true } },
      stocks: true,
      imagingExams: {
        where: { isActive: true },
        orderBy: [{ modality: "asc" }, { name: "asc" }],
      },
      laboratoryTests: {
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
      hours: true,
      departments: true,
      campaigns: { orderBy: { createdAt: "desc" } },
      emergencyServices: true,
      doctors: {
        select: { id: true, name: true, specialty: true, departmentId: true },
      },
      doctorInvites: { orderBy: { createdAt: "desc" } },
      verificationDocuments: { orderBy: { createdAt: "desc" } },
      _count: { select: { doctors: true } },
      insuranceContracts: { include: { insuranceProvider: { select: { id: true, name: true, slug: true, website: true, phone: true, description: true, isActive: true } } } },
    },
  });

  if (!org) {
    const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });
    const iso = eco.isolatedOrganizations.find(
      (o: any) => o.id === id && (u.role === "ADMIN" || o.ownerUserId === u.id)
    );
    if (iso) {
      org = {
        ...iso,
        services: [],
        stocks: [],
        imagingExams: [],
        laboratoryTests: [],
        hours: [],
        departments: [],
        campaigns: [],
        emergencyServices: [],
        doctors: [],
        doctorInvites: [],
        _count: { doctors: 0 },
        insuranceContracts: [],
      };
    }
  }

  if (!org) notFound();

  if (org.type === "INSURANCE_COMPANY") {
    return <InsurerWorkspaceManager organization={org} />;
  }

  const rawGlobalInsurances = await prisma.insuranceProvider.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, website: true, phone: true, description: true, isActive: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  const globalInsurances = filterPublicCatalogInsurers(rawGlobalInsurances);
  const t = await getTranslations("professional.orgManager");

  const statusMap: Record<string, string> = {
    PENDING: t("statusPending"),
    APPROVED: t("statusApproved"),
    REJECTED: t("statusRejected"),
    SUSPENDED: t("statusSuspended"),
  };

  return (
    <div className="page workspace">
      <div className="page-title row between">
        <div>
          <span className="kicker">{t("kicker")}</span>
          <h1>{org.name}</h1>
          <p>
            {org.city} · {org.address}
          </p>
        </div>
        <span className={`status org-${org.status.toLowerCase()}`}>
          {statusMap[org.status] || org.status}
        </span>
      </div>
      <OrganizationManager org={org} globalInsurances={globalInsurances} />
    </div>
  );
}
