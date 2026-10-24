import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminUserList from "@/components/admin-user-list";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");

  const t = await getTranslations("admin.usersPage");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <AdminUserList />
      </section>
    </div>
  );
}
