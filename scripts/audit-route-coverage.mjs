import fs from "fs";
import path from "path";

function getPageFiles(dir = "app") {
  const pages = [];
  for (const item of fs.readdirSync(dir, { recursive: true })) {
    const full = path.join(dir, item).replace(/\\/g, "/");
    if (full.endsWith("/page.tsx")) {
      pages.push(full);
    }
  }
  return pages;
}

const pages = getPageFiles();
const status = {
  fullyLocalized: [],
  partiallyLocalized: [],
  notLocalized: [],
  excluded: [],
};

for (const p of pages) {
  const content = fs.readFileSync(p, "utf8");
  const hasI18n = content.includes("useTranslations") || content.includes("getTranslations");
  const hasTurkishChars = /[çğıöşüÇĞİÖŞÜ]/.test(content);

  // Check if excluded (e.g. redirect-only or dev/internal debug pages)
  if (content.length < 300 && content.includes("redirect(")) {
    status.excluded.push({ path: p, reason: "Redirect-only route" });
  } else if (hasI18n && !hasTurkishChars) {
    status.fullyLocalized.push(p);
  } else if (hasI18n && hasTurkishChars) {
    status.partiallyLocalized.push(p);
  } else {
    status.notLocalized.push(p);
  }
}

console.log("=== UI ROUTE LOCALIZATION STATUS ===");
console.log(`Total UI Routes: ${pages.length}`);
console.log(`Fully Localized: ${status.fullyLocalized.length}`);
console.log(`Partially Localized: ${status.partiallyLocalized.length}`);
console.log(`Not Localized: ${status.notLocalized.length}`);
console.log(`Excluded (redirects): ${status.excluded.length}`);

console.log("\n--- Fully Localized Routes ---");
status.fullyLocalized.forEach((p) => console.log(" ✔ " + p));

console.log("\n--- Partially Localized Routes ---");
status.partiallyLocalized.forEach((p) => console.log(" ◑ " + p));

console.log("\n--- Top 15 Not Localized Routes (by string content) ---");
status.notLocalized.slice(0, 15).forEach((p) => console.log(" ✖ " + p));

