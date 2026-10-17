import fs from "fs";
import path from "path";

const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

const modules = [
  {
    path: "locales/shared/common",
    tr: { common: tr.common },
    en: { common: en.common },
  },
  {
    path: "locales/shared/navigation",
    tr: { header: tr.header, navigation: tr.navigation },
    en: { header: en.header, navigation: en.navigation },
  },
  {
    path: "locales/shared/components",
    tr: {
      cookieConsent: tr.cookieConsent,
      legalFooter: tr.legalFooter,
      locationSelector: tr.locationSelector,
    },
    en: {
      cookieConsent: en.cookieConsent,
      legalFooter: en.legalFooter,
      locationSelector: en.locationSelector,
    },
  },
  {
    path: "locales/features/appointments",
    tr: { appointments: tr.appointments },
    en: { appointments: en.appointments },
  },
  {
    path: "locales/features/auth",
    tr: { auth: tr.auth },
    en: { auth: en.auth },
  },
  {
    path: "locales/features/search",
    tr: { discovery: tr.discovery, liveSearch: tr.liveSearch },
    en: { discovery: en.discovery, liveSearch: en.liveSearch },
  },
  {
    path: "locales/features/health",
    tr: {
      health: tr.health,
      healthModule: tr.healthModule,
      healthDashboard: tr.healthDashboard,
      familyHub: tr.familyHub,
    },
    en: {
      health: en.health,
      healthModule: en.healthModule,
      healthDashboard: en.healthDashboard,
      familyHub: en.familyHub,
    },
  },
  {
    path: "locales/features/professional",
    tr: { professional: tr.professional, admin: tr.admin },
    en: { professional: en.professional, admin: en.admin },
  },
  {
    path: "locales/pages/home",
    tr: { home: tr.home },
    en: { home: en.home },
  },
  {
    path: "locales/pages/about",
    tr: { about: tr.about },
    en: { about: en.about },
  },
  {
    path: "locales/pages/contact",
    tr: { contact: tr.contact },
    en: { contact: en.contact },
  },
  {
    path: "locales/pages/maintenance",
    tr: { maintenance: tr.maintenance },
    en: { maintenance: en.maintenance },
  },
  {
    path: "locales/pages/profile",
    tr: { profile: tr.profile },
    en: { profile: en.profile },
  },
  {
    path: "locales/pages/legal",
    tr: { legal: tr.legal },
    en: { legal: en.legal },
  },
];

console.log("Creating modular locale files...");

let totalKeysTr = 0;
let totalKeysEn = 0;

for (const m of modules) {
  fs.mkdirSync(m.path, { recursive: true });
  fs.writeFileSync(path.join(m.path, "tr.json"), JSON.stringify(m.tr, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(m.path, "en.json"), JSON.stringify(m.en, null, 2) + "\n", "utf8");

  for (const ns of Object.keys(m.tr)) {
    totalKeysTr += Object.keys(m.tr[ns]).length;
  }
  for (const ns of Object.keys(m.en)) {
    totalKeysEn += Object.keys(m.en[ns]).length;
  }
}

console.log(`Migrated ${modules.length} modules.`);
console.log(`TR total keys migrated: ${totalKeysTr}`);
console.log(`EN total keys migrated: ${totalKeysEn}`);

// Re-assemble and verify 100% equivalence
const assembledTr = {};
const assembledEn = {};

for (const m of modules) {
  Object.assign(assembledTr, JSON.parse(fs.readFileSync(path.join(m.path, "tr.json"), "utf8")));
  Object.assign(assembledEn, JSON.parse(fs.readFileSync(path.join(m.path, "en.json"), "utf8")));
}

const origTrStr = JSON.stringify(tr);
const origEnStr = JSON.stringify(en);
const assemTrStr = JSON.stringify(assembledTr);
const assemEnStr = JSON.stringify(assembledEn);

if (origTrStr === assemTrStr && origEnStr === assemEnStr) {
  console.log("SUCCESS: Assembled modular dictionaries match original messages exactly (100% byte equivalence).");
} else {
  console.error("MISMATCH DETECTED!");
  process.exit(1);
}

