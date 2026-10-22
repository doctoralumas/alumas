/**
 * ALUMAS — Hybrid Modular Translation Loader
 * 
 * Provides typed, deterministic, and statically-bundled locale messages
 * organized by clear ownership boundaries:
 * - Shared (common UI, navigation, global components)
 * - Features (appointments, auth, search, health, professional)
 * - Pages (home, about, contact, maintenance, profile, legal)
 * 
 * Zero runtime filesystem scanning; 100% compatible with Next.js 16 SSR & Turbopack.
 */

// Shared Modules
import trSharedCommon from "./shared/common/tr.json";
import enSharedCommon from "./shared/common/en.json";
import trSharedNav from "./shared/navigation/tr.json";
import enSharedNav from "./shared/navigation/en.json";
import trSharedComp from "./shared/components/tr.json";
import enSharedComp from "./shared/components/en.json";

// Feature Modules
import trFeatAppt from "./features/appointments/tr.json";
import enFeatAppt from "./features/appointments/en.json";
import trFeatAuth from "./features/auth/tr.json";
import enFeatAuth from "./features/auth/en.json";
import trFeatSearch from "./features/search/tr.json";
import enFeatSearch from "./features/search/en.json";
import trFeatHealth from "./features/health/tr.json";
import enFeatHealth from "./features/health/en.json";
import trFeatPro from "./features/professional/tr.json";
import enFeatPro from "./features/professional/en.json";

// Page Modules
import trPageHome from "./pages/home/tr.json";
import enPageHome from "./pages/home/en.json";
import trPageAbout from "./pages/about/tr.json";
import enPageAbout from "./pages/about/en.json";
import trPageContact from "./pages/contact/tr.json";
import enPageContact from "./pages/contact/en.json";
import trPageMaint from "./pages/maintenance/tr.json";
import enPageMaint from "./pages/maintenance/en.json";
import trPageProfile from "./pages/profile/tr.json";
import enPageProfile from "./pages/profile/en.json";
import trPageLegal from "./pages/legal/tr.json";
import enPageLegal from "./pages/legal/en.json";
import trPageServices from "./pages/services/tr.json";
import enPageServices from "./pages/services/en.json";

function assembleLocaleMessages(
  common: typeof trSharedCommon,
  nav: typeof trSharedNav,
  comp: typeof trSharedComp,
  appt: typeof trFeatAppt,
  auth: typeof trFeatAuth,
  search: typeof trFeatSearch,
  health: typeof trFeatHealth,
  pro: typeof trFeatPro,
  home: typeof trPageHome,
  about: typeof trPageAbout,
  contact: typeof trPageContact,
  maint: typeof trPageMaint,
  profile: typeof trPageProfile,
  legal: typeof trPageLegal,
  services: typeof trPageServices
) {
  const mergedHealth = {
    ...health,
    ...(health.health || {}),
  };

  return {
    // Canonical root namespaces (preserves existing call sites: useTranslations("common"), etc.)
    ...common,
    ...nav,
    ...comp,
    ...appt,
    ...auth,
    ...search,
    ...health,
    ...pro,
    ...home,
    ...about,
    ...contact,
    ...maint,
    ...profile,
    ...legal,
    ...services,

    // Feature domain wrappers (enables call sites: useTranslations("search.organizationProfile"), useTranslations("health.familyTracking"), etc.)
    search: search,
    health: mergedHealth,
    professional: pro.professional || pro,
    admin: {
      ...(pro.admin || {}),
      doctorList: (pro.admin as any)?.doctorList || (pro as any).doctorList || {},
      adminVerificationDocs: (pro.admin as any)?.adminVerificationDocs || (pro as any).adminVerificationDocs || {},
      organizationsList: (pro.admin as any)?.organizationsList || (pro as any).organizationsList || {},
      agencyList: (pro.admin as any)?.agencyList || (pro as any).agencyList || {},
    },
    doctorList: (pro.admin as any)?.doctorList || (pro as any).doctorList || {},
    adminVerificationDocs: (pro.admin as any)?.adminVerificationDocs || (pro as any).adminVerificationDocs || {},

    // Domain ownership aliases (enables modular call sites: useTranslations("shared.common"), etc.)
    shared: {
      common: common.common,
      navigation: nav,
      components: comp,
    },
    features: {
      appointments: appt.appointments || appt,
      auth: auth.auth || auth,
      search: search,
      health: mergedHealth,
      professional: pro.professional || pro,
    },
    pages: {
      home: home.home || home,
      about: about.about || about,
      contact: contact.contact || contact,
      maintenance: maint.maintenance || maint,
      profile: profile.profile || profile,
      legal: legal.legal || legal,
      services: services.services || services,
    },
  };
}

export const trMessages = assembleLocaleMessages(
  trSharedCommon,
  trSharedNav,
  trSharedComp,
  trFeatAppt,
  trFeatAuth,
  trFeatSearch,
  trFeatHealth,
  trFeatPro,
  trPageHome,
  trPageAbout,
  trPageContact,
  trPageMaint,
  trPageProfile,
  trPageLegal,
  trPageServices
);

export const enMessages = assembleLocaleMessages(
  enSharedCommon,
  enSharedNav,
  enSharedComp,
  enFeatAppt,
  enFeatAuth,
  enFeatSearch,
  enFeatHealth,
  enFeatPro,
  enPageHome,
  enPageAbout,
  enPageContact,
  enPageMaint,
  enPageProfile,
  enPageLegal,
  enPageServices
);

export type Messages = typeof trMessages;

/**
 * Returns the fully assembled messages object for the specified locale.
 * Defaults deterministically to Turkish ("tr") if an unsupported locale is requested.
 */
export function getMessagesForLocale(locale: string): Messages {
  if (locale === "en") {
    return enMessages;
  }
  return trMessages;
}

