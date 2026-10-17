import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminDoctorList from "@/components/admin-doctor-list";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");
  const t = await getTranslations("admin.doctorsPage");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
      </div>
      <section className="panel">
        <AdminDoctorList />
      </section>
    </div>
  );
}