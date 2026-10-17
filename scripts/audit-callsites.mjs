import fs from "fs";
import path from "path";

const tr = JSON.parse(fs.readFileSync("messages/tr.json", "utf8"));
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));

function getByPath(obj, p) {
  if (!p) return obj;
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
      
      // Match all translation hooks/helpers:
      // const t = useTranslations("ns")
      // const t = await getTranslations("ns")
      // const tX = useTranslations("ns")
      const regex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*["']([^"']*)["']\s*\)/g;
      let m;
      const tInstances = [];
      while ((m = regex.exec(content)) !== null) {
        tInstances.push({ varName: m[1], ns: m[2] });
      }

      // Also match inline getTranslations: (await getTranslations("ns"))("key")
      results.push({ file: full.replace(/\\/g, "/"), content, tInstances });
    }
  }
  return results;
}

const files = [...walk("./app"), ...walk("./components")];

const errors = [];

for (const f of files) {
  for (const inst of f.tInstances) {
    const trScope = getByPath(tr, inst.ns);
    const enScope = getByPath(en, inst.ns);

    if (!trScope) {
      errors.push({ file: f.file, type: "MISSING_NAMESPACE_TR", ns: inst.ns });
    }
    if (!enScope) {
      errors.push({ file: f.file, type: "MISSING_NAMESPACE_EN", ns: inst.ns });
    }

    if (trScope && enScope) {
      // Find all calls like varName("key") or varName('key')
      // Regex: \bvarName\(\s*["']([^"']+)["']
      const callRegex = new RegExp(`\\b${inst.varName}\\(\\s*["']([^"']+)["'](\\s*\\+)?`, "g");
      let cm;
      while ((cm = callRegex.exec(f.content)) !== null) {
        const key = cm[1];
        if (cm[2] || key.includes("${") || key.includes("+")) continue;
        const valTr = getByPath(trScope, key);
        const valEn = getByPath(enScope, key);

        if (valTr === undefined) {
          errors.push({ file: f.file, type: "MISSING_KEY_TR", fullKey: `${inst.ns ? inst.ns + "." : ""}${key}` });
        }
        if (valEn === undefined) {
          errors.push({ file: f.file, type: "MISSING_KEY_EN", fullKey: `${inst.ns ? inst.ns + "." : ""}${key}` });
        }
      }
    }
  }
}

console.log(`Audited ${files.length} files.`);
console.log(`Found ${errors.length} translation resolution errors:`);

const byType = {};
for (const err of errors) {
  const k = `${err.type}: ${err.ns || err.fullKey}`;
  if (!byType[k]) byType[k] = [];
  byType[k].push(err.file);
}

for (const [k, files] of Object.entries(byType)) {
  console.log(`- ${k} (${files.length} occurrences) in: ${files.join(", ")}`);
}
