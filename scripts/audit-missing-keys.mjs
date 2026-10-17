import fs from "fs";
import path from "path";

const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

function getByPath(obj, p) {
  const parts = p.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function walk(dir, results = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== "node_modules" && file !== ".next") walk(full, results);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");
      // Find useTranslations / getTranslations namespaces
      const nsRegex = /(?:useTranslations|getTranslations)\(\s*["']([^"']+)["']\s*\)/g;
      let nsMatch;
      const namespaces = [];
      while ((nsMatch = nsRegex.exec(content)) !== null) {
        namespaces.push(nsMatch[1]);
      }

      // Check each t("key") call in file
      // Match patterns like t("key") or t('key') or t(`key`)
      const tKeyRegex = /\bt\(\s*["']([^"']+)["']/g;
      let keyMatch;
      const keysUsed = [];
      while ((keyMatch = tKeyRegex.exec(content)) !== null) {
        keysUsed.push(keyMatch[1]);
      }

      results.push({ file: full.replace(/\\/g, "/"), namespaces, keysUsed });
    }
  }
  return results;
}

const files = [...walk("./app"), ...walk("./components")];

const missingNamespaces = new Set();
const missingKeys = [];

for (const f of files) {
  for (const ns of f.namespaces) {
    const trNs = getByPath(tr, ns);
    const enNs = getByPath(en, ns);
    if (!trNs || !enNs) {
      missingNamespaces.add(`${ns} (called in ${f.file}, inTr: ${!!trNs}, inEn: ${!!enNs})`);
    }
  }

  // If file has exactly one namespace, check each key used in that namespace
  if (f.namespaces.length === 1) {
    const ns = f.namespaces[0];
    const trNs = getByPath(tr, ns);
    const enNs = getByPath(en, ns);
    if (trNs && typeof trNs === "object") {
      for (const k of f.keysUsed) {
        // Skip template literal expressions or dynamic keys if any
        if (k.includes("${") || k.includes("+")) continue;
        const valTr = getByPath(trNs, k);
        const valEn = enNs ? getByPath(enNs, k) : undefined;
        if (valTr === undefined || valEn === undefined) {
          missingKeys.push({ file: f.file, fullKey: `${ns}.${k}`, inTr: valTr !== undefined, inEn: valEn !== undefined });
        }
      }
    }
  } else if (f.namespaces.length > 1) {
    // Check if key exists in at least one of the namespaces
    for (const k of f.keysUsed) {
      if (k.includes("${") || k.includes("+")) continue;
      let foundInAnyTr = false;
      let foundInAnyEn = false;
      for (const ns of f.namespaces) {
        const trNs = getByPath(tr, ns);
        const enNs = getByPath(en, ns);
        if (trNs && getByPath(trNs, k) !== undefined) foundInAnyTr = true;
        if (enNs && getByPath(enNs, k) !== undefined) foundInAnyEn = true;
      }
      if (!foundInAnyTr || !foundInAnyEn) {
        missingKeys.push({ file: f.file, key: k, candidateNamespaces: f.namespaces, foundInTr: foundInAnyTr, foundInEn: foundInAnyEn });
      }
    }
  }
}

console.log("=== MISSING NAMESPACES ===");
for (const ns of missingNamespaces) {
  console.log(ns);
}

