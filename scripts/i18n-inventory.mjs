import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Directories to scan
const APP_DIR = path.resolve("app");
const COMPONENTS_DIR = path.resolve("components");
const REPORTS_DIR = path.resolve("reports");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Helper to recursively collect files
function collectFiles(dir, filterRegex) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath, filterRegex));
    } else if (filterRegex.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Identify UI Routes and API Routes
const allAppFiles = collectFiles(APP_DIR, /\.(tsx|ts|jsx|js)$/);
const uiRouteFiles = allAppFiles.filter(f => /page\.(tsx|jsx)$/.test(f));
const apiRouteFiles = allAppFiles.filter(f => /route\.(ts|js)$/.test(f));
const componentFiles = collectFiles(COMPONENTS_DIR, /\.(tsx|jsx)$/);

console.log(`=== REVALIDATED REPOSITORY COUNTS ===`);
console.log(`UI Routes (app/**/page.tsx): ${uiRouteFiles.length}`);
console.log(`API Routes (app/api/**/route.ts): ${apiRouteFiles.length}`);
console.log(`Reusable UI Components (components/**/*.tsx): ${componentFiles.length}`);

// Turkish character / common word detection heuristic
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const TURKISH_WORDS = /\b(ve|ile|için|veya|olan|daha|gün|ay|yıl|randevu|doktor|sağlık|kurum|profil|giriş|kayıt|ara|araç|seç|tarih|saat|onayla|iptal|tamam|evet|hayır|bilgi|detay|hastane|klinik|hakkında|yardım|iletişim|şifre|e-posta|telefon|ad|soyad|adres|sonuç|analiz|rapor)\b/i;

function isLikelyTurkish(text) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  // Ignore purely technical, numbers, code, classnames, URLs
  if (/^[0-9\s.,:%/\-_()#+*]+$/.test(trimmed)) return false;
  if (/^(http|\/api|\/assets|px|rem|em|vh|vw|rgba?|hsla?)/.test(trimmed)) return false;
  return TURKISH_CHARS.test(trimmed) || TURKISH_WORDS.test(trimmed);
}

// Classification heuristic
function classifyText(text, filePath) {
  const lower = text.toLowerCase();
  if (filePath.includes("legal") || filePath.includes("terms") || filePath.includes("privacy") || filePath.includes("cookies") || lower.includes("aydınlatma") || lower.includes("kvkk") || lower.includes("onam")) {
    return "Sensitive clinical/legal text";
  }
  if (lower.includes("sistolik") || lower.includes("diyastolik") || lower.includes("tahlil") || lower.includes("teşhis") || lower.includes("reçete") || lower.includes("epikriz") || lower.includes("klinik")) {
    return "Sensitive clinical/legal text";
  }
  if (lower.includes("doktor") || lower.includes("hastane") || lower.includes("klinik") || lower.includes("uzman") || lower.includes("sigorta") || lower.includes("randevu")) {
    return "Structured business terminology";
  }
  if (text.includes("{") || text.includes("$") || text.includes("%s")) {
    return "Dynamic/interpolated UI text";
  }
  return "Static UI text";
}

// AST Extraction
const inventory = [];
const routeCoverage = {};

function inspectSourceFile(filePath, isRoute) {
  const code = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") || filePath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  const fileItems = [];
  const usesNextIntl = code.includes("next-intl") || code.includes("useTranslations") || code.includes("getTranslations") || code.includes("createTranslator");

  function visit(node) {
    // 1. JSX Text
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).trim();
      if (isLikelyTurkish(text)) {
        fileItems.push({
          type: "JsxText",
          text,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }
    }

    // 2. JSX Attributes (placeholder, title, alt, aria-label, label)
    if (ts.isJsxAttribute(node) && node.initializer) {
      const attrName = node.name.getText(sourceFile);
      if (["placeholder", "title", "alt", "aria-label", "label"].includes(attrName)) {
        if (ts.isStringLiteral(node.initializer)) {
          const text = node.initializer.text.trim();
          if (isLikelyTurkish(text)) {
            fileItems.push({
              type: `JsxAttribute[${attrName}]`,
              text,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            });
          }
        }
      }
    }

    // 3. String literals inside return or JSX children (e.g. ternary conditions, button labels)
    if (ts.isStringLiteral(node) && !ts.isImportDeclaration(node.parent) && !ts.isJsxAttribute(node.parent)) {
      const text = node.text.trim();
      if (isLikelyTurkish(text) && text.length > 2) {
        // Exclude classnames, paths, css
        if (!text.includes("flex") && !text.includes("grid") && !text.startsWith("/") && !text.includes("btn-")) {
          fileItems.push({
            type: "StringLiteral",
            text,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  for (const item of fileItems) {
    const category = classifyText(item.text, relativePath);
    inventory.push({
      file: relativePath,
      line: item.line,
      type: item.type,
      text: item.text,
      category,
      isLocalized: usesNextIntl,
    });
  }

  if (isRoute) {
    const routeName = "/" + relativePath.replace(/^app\/?/, "").replace(/\/page\.(tsx|jsx)$/, "").replace(/^page\.(tsx|jsx)$/, "");
    routeCoverage[routeName] = {
      file: relativePath,
      usesNextIntl,
      stringCount: fileItems.length,
      sampleStrings: fileItems.slice(0, 3).map(i => i.text),
    };
  }
}

// Run inspection
for (const file of uiRouteFiles) {
  inspectSourceFile(file, true);
}
for (const file of componentFiles) {
  inspectSourceFile(file, false);
}

// Summary stats
const uniqueStrings = new Set(inventory.map(i => i.text));
const categories = {};
for (const item of inventory) {
  categories[item.category] = (categories[item.category] || 0) + 1;
}

const totalRoutes = Object.keys(routeCoverage).length;
const localizedRoutes = Object.values(routeCoverage).filter(r => r.usesNextIntl).length;

const reportData = {
  timestamp: new Date().toISOString(),
  metrics: {
    uiRoutesTotal: uiRouteFiles.length,
    apiRoutesTotal: apiRouteFiles.length,
    reusableComponentsTotal: componentFiles.length,
    totalRawExtractedOccurrences: inventory.length,
    uniqueUserFacingStrings: uniqueStrings.size,
    localizedRoutesCount: localizedRoutes,
    unlocalizedRoutesCount: totalRoutes - localizedRoutes,
  },
  categories,
  routeCoverage,
  inventory: inventory.slice(0, 500), // First 500 for brevity in report file
};

fs.writeFileSync(path.join(REPORTS_DIR, "i18n-inventory.json"), JSON.stringify(reportData, null, 2), "utf8");

console.log(`\n=== LOCALIZATION INVENTORY RESULTS ===`);
console.log(`Total Extracted Occurrences: ${inventory.length}`);
console.log(`Unique User-Facing Strings: ${uniqueStrings.size}`);
console.log(`Categories:`, categories);
console.log(`Routes Localized: ${localizedRoutes} / ${totalRoutes}`);
console.log(`Report written to: reports/i18n-inventory.json`);

