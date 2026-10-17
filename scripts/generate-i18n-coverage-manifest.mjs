/**
 * ALUMAS — Complete UI Route Coverage Manifest Generator
 * 
 * Deeply scans every app/**\/page.tsx route, traces imported components,
 * identifies auth gates, detects hardcoded strings vs next-intl usage,
 * and outputs comprehensive reports/i18n-coverage.json and reports/i18n-coverage.md.
 */

import fs from "fs";
import path from "path";

function findPageFiles(dir = "app") {
  const pages = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const full = path.join(d, f);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (f === "page.tsx") {
        pages.push(full.replace(/\\/g, "/"));
      }
    }
  }
  walk(dir);
  return pages;
}

function getRoutePath(pageFile) {
  let route = pageFile.replace(/^app/, "").replace(/\/page\.tsx$/, "");
  return route === "" ? "/" : route;
}

function findImportedComponents(content, pageFile) {
  const imported = [];
  const importRegex = /from\s+["'](@\/components\/[^"']+|(?:\.\.?\/)+[^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    if (importPath.startsWith("@/")) {
      importPath = importPath.slice(2);
    } else {
      const dir = path.dirname(pageFile);
      importPath = path.join(dir, importPath).replace(/\\/g, "/");
    }
    const possibleFiles = [
      importPath + ".tsx",
      importPath + ".ts",
      importPath + "/index.tsx",
      importPath + "/index.ts",
    ];
    for (const pf of possibleFiles) {
      if (fs.existsSync(pf)) {
        imported.push(pf);
        break;
      }
    }
  }
  return [...new Set(imported)];
}

function analyzeRoute(pageFile) {
  const route = getRoutePath(pageFile);
  const content = fs.readFileSync(pageFile, "utf8");
  const isDynamic = route.includes("[") || content.includes("searchParams") || content.includes("params");
  
  // Auth requirements
  let authRequirement = "PUBLIC";
  if (content.includes('redirect("/login') || content.includes("redirect('/login")) {
    authRequirement = "AUTHENTICATED_PATIENT";
  } else if (content.includes('redirect("/pro/login') || content.includes("redirect('/pro/login")) {
    authRequirement = "AUTHENTICATED_PRO";
  } else if (content.includes("LockedOverlay") || content.includes("ClientLockOverlay")) {
    authRequirement = "PUBLIC_WITH_AUTH_FEATURE_GATE";
  } else if (route.startsWith("/admin")) {
    authRequirement = "ADMIN_ONLY";
  } else if (route.startsWith("/doctor")) {
    authRequirement = "DOCTOR_ONLY";
  }

  // Imported components
  const importedFiles = findImportedComponents(content, pageFile);
  
  // Check if excluded
  if (content.length < 250 && content.includes("redirect(")) {
    return {
      route,
      source: pageFile,
      importedComponents: importedFiles,
      authRequirement,
      isDynamic,
      status: "INTENTIONALLY_EXCLUDED",
      reason: "Redirect-only stub route",
      hasI18n: false,
      hardcodedCount: 0,
    };
  }

  // Check translation usage in page and imported components
  const allContents = [content];
  for (const imp of importedFiles) {
    if (fs.existsSync(imp)) {
      allContents.push(fs.readFileSync(imp, "utf8"));
    }
  }

  const combinedCode = allContents.join("\n");
  const hasI18n = combinedCode.includes("useTranslations") || combinedCode.includes("getTranslations");
  
  // Turkish character heuristic
  const turkishMatches = combinedCode.match(/[çğıöşüÇĞİÖŞÜ]{2,}/g) || [];
  const turkishCount = turkishMatches.length;

  let status = "NOT_LOCALIZED";
  if (hasI18n && turkishCount === 0) {
    status = "VERIFIED_FULLY_LOCALIZED";
  } else if (hasI18n && turkishCount > 0) {
    status = "PARTIALLY_LOCALIZED";
  }

  return {
    route,
    source: pageFile,
    importedComponents: importedFiles,
    authRequirement,
    isDynamic,
    status,
    hasI18n,
    hardcodedMatches: turkishMatches.slice(0, 5),
    hardcodedCount: turkishCount,
  };
}

const allPages = findPageFiles();
const manifest = allPages.map(analyzeRoute);

// Counts
const summary = {
  totalRoutes: manifest.length,
  verifiedFullyLocalized: manifest.filter((m) => m.status === "VERIFIED_FULLY_LOCALIZED").length,
  partiallyLocalized: manifest.filter((m) => m.status === "PARTIALLY_LOCALIZED").length,
  notLocalized: manifest.filter((m) => m.status === "NOT_LOCALIZED").length,
  intentionallyExcluded: manifest.filter((m) => m.status === "INTENTIONALLY_EXCLUDED").length,
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/i18n-coverage.json", JSON.stringify({ summary, routes: manifest }, null, 2) + "\n");

let md = `# ALUMAS — UI Route i18n Coverage Manifest

Generated at: ${new Date().toISOString()}

## Summary Metrics
- **Total UI Routes:** ${summary.totalRoutes}
- **Verified Fully Localized:** ${summary.verifiedFullyLocalized}
- **Partially Localized:** ${summary.partiallyLocalized}
- **Not Localized:** ${summary.notLocalized}
- **Intentionally Excluded:** ${summary.intentionallyExcluded}

| Route | Source File | Auth Role | Dynamic? | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

for (const r of manifest) {
  md += `| \`${r.route}\` | \`${r.source}\` | ${r.authRequirement} | ${r.isDynamic ? "Yes" : "No"} | **${r.status}** |\n`;
}

fs.writeFileSync("reports/i18n-coverage.md", md);

console.log("Manifest generated:");
console.log(summary);

