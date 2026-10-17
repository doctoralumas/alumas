import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import AgencyManager from "@/components/agency-manager";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/login");
  const { id } = await params;
  const a = await prisma.healthTourismAgency.findFirst({
    where: u.role === "ADMIN" ? { id } : { id, ownerUserId: u.id },
    include: {
      services: true,
      packages: true,
      verificationDocuments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!a) notFound();
  const t = await getTranslations("professional.agencyDetail");

  return (
    <div className="page workspace">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{a.name}</h1>
        <p>{a.isVerified ? t("verifiedStatus") : t("pendingStatus")}</p>
      </div>
      <AgencyManager agency={a} />
    </div>
  );
}