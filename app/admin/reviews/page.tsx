import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminReviewModeration from "@/components/admin-review-moderation";
import { getTranslations } from "next-intl/server";

export default async function AdminReviews() {
  const u = await currentUser();
  if (!u || u.role !== "ADMIN") redirect("/login");
  const t = await getTranslations("admin.reviewsPage");

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </div>
      <section className="panel">
        <AdminReviewModeration />
      </section>
    </div>
  );
}
