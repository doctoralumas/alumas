"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { 
  Stethoscope, Hospital, MapPin, HouseLine, Ambulance, AirplaneTilt, ShieldCheck, Megaphone, AddressBook,
  Heart, Heartbeat, Drop, Moon, DropHalf, Scales, GenderFemale, Pill, Flask, Scan, Syringe, Bug, ClockCounterClockwise, FileText, IdentificationCard, Calendar,
  Users, Key, Baby, CalendarCheck, ChatTeardropText, Bell, UsersThree, MagnifyingGlass, Target, ListChecks, TrendUp, Clock, FileMagnifyingGlass
} from "@phosphor-icons/react";

interface ServiceDefinition {
  href: string;
  key: string;
  tone: string;
  icon: React.ElementType;
}

interface ServiceGroupDefinition {
  groupKey: "healthServices" | "personalHealth" | "familyAndCommunication";
  items: ServiceDefinition[];
}

const SERVICE_GROUPS: ServiceGroupDefinition[] = [
  {
    groupKey: "healthServices",
    items: [
      { href: "/doctors", key: "doctors", tone: "blue", icon: Stethoscope },
      { href: "/organizations", key: "organizations", tone: "blue2", icon: Hospital },
      { href: "/nearby", key: "nearby", tone: "mint", icon: MapPin },
      { href: "/home-care", key: "homeCare", tone: "teal", icon: HouseLine },
      { href: "/emergency", key: "emergency", tone: "emergency", icon: Ambulance },
      { href: "/health-tourism", key: "healthTourism", tone: "navy", icon: AirplaneTilt },
      { href: "/insurance", key: "insurance", tone: "ice", icon: ShieldCheck },
      { href: "/campaigns", key: "campaigns", tone: "sand", icon: Megaphone },
      { href: "/phone-directory", key: "phoneDirectory", tone: "lavender", icon: AddressBook },
    ],
  },
  {
    groupKey: "personalHealth",
    items: [
      { href: "/health", key: "health", tone: "blue", icon: Heart },
      { href: "/health/blood-pressure", key: "bloodPressure", tone: "mint", icon: Heartbeat },
      { href: "/health/glucose", key: "glucose", tone: "sand", icon: Drop },
      { href: "/health/sleep", key: "sleep", tone: "lavender", icon: Moon },
      { href: "/health/water", key: "water", tone: "blue2", icon: DropHalf },
      { href: "/health/body", key: "body", tone: "teal", icon: Scales },
      { href: "/health/cycle", key: "cycle", tone: "pink", icon: GenderFemale },
      { href: "/health/medications", key: "medications", tone: "sand", icon: Pill },
      { href: "/health/labs", key: "labs", tone: "blue", icon: Flask },
      { href: "/health/imaging", key: "imaging", tone: "blue2", icon: Scan },
      { href: "/health/vaccinations", key: "vaccinations", tone: "mint", icon: Syringe },
      { href: "/health/allergies", key: "allergies", tone: "sand", icon: Bug },
      { href: "/health/medical-history", key: "medicalHistory", tone: "lavender", icon: ClockCounterClockwise },
      { href: "/health/timeline", key: "timeline", tone: "blue", icon: Clock },
      { href: "/health/goals", key: "goals", tone: "mint", icon: Target },
      { href: "/health/tasks", key: "tasks", tone: "teal", icon: ListChecks },
      { href: "/health/reports", key: "reports", tone: "ice", icon: FileText },
      { href: "/health/summary", key: "summary", tone: "blue2", icon: FileMagnifyingGlass },
      { href: "/health-card", key: "healthCard", tone: "blue", icon: IdentificationCard },
      { href: "/calendar", key: "calendar", tone: "teal", icon: Calendar },
    ],
  },
  {
    groupKey: "familyAndCommunication",
    items: [
      { href: "/health/family-hub", key: "familyHub", tone: "pink", icon: Users },
      { href: "/health/family", key: "growthPregnancy", tone: "mint", icon: TrendUp },
      { href: "/health/family-access", key: "familyAccess", tone: "mint", icon: Key },
      { href: "/health/family-profiles", key: "familyProfiles", tone: "lavender", icon: Baby },
      { href: "/appointments", key: "appointments", tone: "blue2", icon: CalendarCheck },
      { href: "/care-calendar", key: "careCalendar", tone: "pink", icon: Calendar },
      { href: "/messages", key: "messages", tone: "ice", icon: ChatTeardropText },
      { href: "/notifications", key: "notifications", tone: "sand", icon: Bell },
      { href: "/health-circle", key: "healthCircle", tone: "teal", icon: UsersThree },
    ],
  },
];

export default function ServicesPage() {
  const t = useTranslations("services");
  const [searchQuery, setSearchQuery] = useState("");

  const queryNormalized = searchQuery.trim().toLowerCase();

  const renderedGroups = SERVICE_GROUPS.map((group) => {
    const groupTitle = t(`groups.${group.groupKey}`);
    const items = group.items
      .map((item) => ({
        ...item,
        title: t(`items.${item.key}.title`),
        desc: t(`items.${item.key}.desc`),
      }))
      .filter((item) => {
        if (!queryNormalized) return true;
        return (
          item.title.toLowerCase().includes(queryNormalized) ||
          item.desc.toLowerCase().includes(queryNormalized)
        );
      });

    return {
      title: groupTitle,
      items,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="page services-page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>

        <div style={{ marginTop: "24px", position: "relative", maxWidth: "400px" }}>
          <MagnifyingGlass
            size={20}
            color="var(--primary, #123f6b)"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.5,
            }}
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              borderRadius: "16px",
              border: "1px solid rgba(18,63,107,0.15)",
              backgroundColor: "rgba(255,255,255,0.8)",
              fontSize: "16px",
              color: "#123f6b",
              outline: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              transition: "border-color 0.2s",
            }}
          />
        </div>
      </div>

      {renderedGroups.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "rgba(11,37,69,0.5)" }}>
          <MagnifyingGlass size={48} opacity={0.3} style={{ marginBottom: "16px" }} />
          <h3>{t("noResultsTitle")}</h3>
          <p>{t("noResultsDesc", { query: searchQuery })}</p>
        </div>
      ) : (
        renderedGroups.map((g) => (
          <section key={g.title} className="services-section">
            <h2>{g.title}</h2>
            <div className="services-grid">
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className={`service-link ${i.tone}`}>
                  <i.icon size={28} weight="duotone" style={{ marginBottom: "auto", opacity: 0.85 }} />
                  <b>{i.title}</b>
                  <span>{i.desc}</span>
                  <em>›</em>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
