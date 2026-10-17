import fs from "fs";
import path from "path";

function walk(dir, results = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== "node_modules" && file !== ".next") walk(full, results);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");
      const regex = /(?:useTranslations|getTranslations)\(\s*["']([^"']+)["']\s*\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({ file: full.replace(/\\/g, "/"), ns: match[1] });
      }
    }
  }
  return results;
}

const calls = [...walk("./app"), ...walk("./components")];
const counts = {};
for (const c of calls) {
  counts[c.ns] = (counts[c.ns] || 0) + 1;
}

console.log("Total calls:", calls.length);
console.log("Namespaces called in codebase:");
console.table(counts);

