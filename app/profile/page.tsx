import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import OtpPanel from "@/components/otp-panel";
import FavoriteDoctors from "@/components/favorite-doctors";
import FavoriteOrganizations from "@/components/favorite-organizations";
import PrivacyCenter from "@/components/privacy-center";
import PushSettings from "@/components/push-settings";
import AccountControls from "@/components/account-controls";
import PersonalInfoEditor from "@/components/personal-info-editor";
import SectionVisual from "@/components/section-visual";
import { User, Briefcase, IdentificationCard, ShieldCheck, ShieldStar, Heart, Buildings } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) return redirect("/login");
  const t = await getTranslations("profile");

  const [orgCount, agencyCount] = await Promise.all([
    prisma.organization.count({ where: { ownerUserId: user.id } }),
    prisma.healthTourismAgency.count({ where: { ownerUserId: user.id } })
  ]);

  const displayRole = user.role === "ADMIN" ? t("roleAdmin") 
    : user.role === "DOCTOR" ? t("roleDoctor") 
    : orgCount > 0 ? t("roleOrg") 
    : agencyCount > 0 ? t("roleAgency")
    : t("rolePatient");

  return (
    <div className="page" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "64px" }}>
      <SectionVisual slug="profile" alt={t("title")}/>
      
      <div style={{ marginBottom: "32px" }}>
        <span className="kicker">{t("kicker")}</span>
        <h1 style={{ fontSize: "36px", color: "#0f172a", margin: "8px 0" }}>{t("title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>{t("subtitle")}</p>
      </div>

      {/* Hero Profile Card */}
      <section style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "32px", padding: "40px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", marginBottom: "40px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
        <div style={{ width: "96px", height: "96px", borderRadius: "32px", background: "#334155", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid rgba(255,255,255,0.1)" }}>
          <User size={48} weight="duotone" />
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "28px", color: "#fff" }}>{user.name}</h2>
          <p style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "16px" }}>{user.email.includes("@alumas.local") ? t("noEmail") : user.email}</p>
          <span style={{ display: "inline-block", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "6px 16px", borderRadius: "100px", fontSize: "14px", fontWeight: 700, border: "1px solid rgba(56,189,248,0.3)" }}>
            {displayRole}
          </span>
        </div>
        <div>
          <LogoutButton />
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          <PersonalInfoEditor initialName={user.name} initialEmail={user.email} initialHasPassword={Boolean(user.passwordHash)} />

          <section style={{ background: "#fff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", color: "#0f172a" }}>
              <Briefcase size={24} weight="duotone" color="#3b82f6" />
              <h2 style={{ margin: 0, fontSize: "20px" }}>{t("proPanels")}</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
              {t("proPanelsDesc")}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {orgCount > 0 ? (
                <Link href="/business" style={{ padding: "10px 20px", background: "#0ea5e9", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("orgPortal")}</Link>
              ) : (
                <Link href="/business/apply" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("orgApply")}</Link>
              )}
              
              {agencyCount > 0 ? (
                <Link href="/agency" style={{ padding: "10px 20px", background: "#0ea5e9", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("agencyPortal")}</Link>
              ) : (
                <Link href="/agency/apply" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("agencyApply")}</Link>
              )}

              {user.role === "DOCTOR" ? (
                <Link href="/doctor" style={{ padding: "10px 20px", background: "#0ea5e9", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("doctorPortal")}</Link>
              ) : (
                <Link href="/onboarding/doctor" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("doctorApply")}</Link>
              )}
              
              {user.role === "ADMIN" && (
                <Link href="/admin" style={{ padding: "10px 20px", background: "#991b1b", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>{t("adminPortal")}</Link>
              )}
            </div>
          </section>

          <section style={{ background: "#fff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", color: "#0f172a" }}>
              <IdentificationCard size={24} weight="duotone" color="#8b5cf6" />
              <h2 style={{ margin: 0, fontSize: "20px" }}>{t("phoneVerification")}</h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
              {t("phoneVerificationDesc")}
            </p>
            <OtpPanel initialPhone={user.phone} />
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#0f172a" }}>
                <Heart size={24} weight="duotone" color="#ec4899" />
                <h2 style={{ margin: 0, fontSize: "20px" }}>{t("favoriteDoctors")}</h2>
              </div>
            </div>
            <FavoriteDoctors />
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#0f172a" }}>
                <Buildings size={24} weight="duotone" color="#059669" />
                <h2 style={{ margin: 0, fontSize: "20px" }}>{t("favoriteOrgs")}</h2>
              </div>
            </div>
            <FavoriteOrganizations />
          </section>

        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          <section style={{ background: "#fff", padding: "32px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", color: "#0f172a" }}>
              <ShieldCheck size={24} weight="duotone" color="#10b981" />
              <h2 style={{ margin: 0, fontSize: "20px" }}>{t("privacyCenter.title")}</h2>
            </div>
            <PrivacyCenter />
          </section>

          <section>
            <PushSettings />
          </section>

          <section style={{ background: "#f8fafc", padding: "24px", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldStar size={24} weight="duotone" />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>{t("encryptionTitle")}</strong>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>{t("encryptionDesc")}</p>
              </div>
            </div>
          </section>

          <section style={{ background: "#fff", padding: "32px", borderRadius: "24px", border: "1px solid #fee2e2", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
            <AccountControls />
          </section>

        </div>
      </div>
    </div>
  )
}
