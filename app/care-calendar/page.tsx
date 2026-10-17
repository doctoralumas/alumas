import CareCalendar from "@/components/care-calendar";
import SectionVisual from "@/components/section-visual";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const user = await currentUser();
  if (!user) {
    redirect("/login?next=/care-calendar");
  }
  const t = await getTranslations("professional.careCalendar");

  return (
    <div className="page">
      <SectionVisual slug="family" alt={t("title")} />
      <div style={{ marginBottom: "32px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> {t("backToServices")}
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">{t("kicker")}</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>{t("title")}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{t("subtitle")}</p>
          </div>
        </div>
      </div>
      <CareCalendar />
    </div>
  );
}
