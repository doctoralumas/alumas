import fs from "fs";
import path from "path";

function readModule(dir, file) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
}

function assemble(locale) {
  const file = `${locale}.json`;
  const common = readModule("locales/shared/common", file);
  const nav = readModule("locales/shared/navigation", file);
  const comp = readModule("locales/shared/components", file);
  const appt = readModule("locales/features/appointments", file);
  const auth = readModule("locales/features/auth", file);
  const search = readModule("locales/features/search", file);
  const health = readModule("locales/features/health", file);
  const pro = readModule("locales/features/professional", file);
  const home = readModule("locales/pages/home", file);
  const about = readModule("locales/pages/about", file);
  const contact = readModule("locales/pages/contact", file);
  const maint = readModule("locales/pages/maintenance", file);
  const profile = readModule("locales/pages/profile", file);
  const legal = readModule("locales/pages/legal", file);
  const services = readModule("locales/pages/services", file);

  const mergedHealth = {
    ...health,
    ...(health.health || {}),
  };

  return {
    // 1. Canonical flat root namespaces
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

    // 2. Feature domain wrappers
    search: search,
    health: mergedHealth,
    professional: pro.professional || pro,
    admin: pro.admin || {},

    // 3. Domain ownership aliases
    shared: {
      common: common.common || common,
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

const tr = assemble("tr");
const en = assemble("en");

fs.writeFileSync("messages/tr.json", JSON.stringify(tr, null, 2) + "\n", "utf8");
fs.writeFileSync("messages/en.json", JSON.stringify(en, null, 2) + "\n", "utf8");

console.log("Successfully synchronized messages/tr.json and messages/en.json with full canonical & domain hierarchy.");
