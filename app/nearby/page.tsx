import SectionVisual from "@/components/section-visual";
import GoogleNearbyPlaces from "@/components/google-nearby-places";
import { currentUser } from "@/lib/auth";
import Link from "next/link";
import LockedOverlay from "@/components/locked-overlay";
import { getTranslations } from "next-intl/server";

export default async function NearbyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await currentUser();
  const q = await searchParams;
  const t = await getTranslations("search.nearby.page");

  return (
    <div className="page" style={{ maxWidth: "1200px" }}>
      {!user && <LockedOverlay />}
      <SectionVisual slug="nearby" alt={t("altVisual")} />

      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="kicker">{t("kicker")}</span>
          <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>
            {t("title")}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "600px" }}>
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "18px" }}>💡</span>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          <strong>{t("tipTitle")}</strong> {t("tipTextPrefix")}{" "}
          <Link
            href="/organizations"
            style={{ color: "#0f172a", fontWeight: 600, textDecoration: "underline" }}
          >
            {t("tipLink")}
          </Link>{" "}
          {t("tipTextSuffix")}
        </p>
      </div>

      <GoogleNearbyPlaces initial={q?.category} isLoggedIn={true} />
    </div>
  );
}
