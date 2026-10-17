import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminOrganizations from "@/components/admin-organizations";
import { getTranslations } from "next-intl/server";

export default async function AdminOrgs() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");
  const t = await getTranslations("admin.organizationsPage");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <AdminOrganizations />
      </section>
    </div>
  );
}
