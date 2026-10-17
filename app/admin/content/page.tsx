import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import ContentAdminClient from "@/components/content-admin-client";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");
  const t = await getTranslations("admin.contentPage");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <ContentAdminClient />
    </div>
  );
}