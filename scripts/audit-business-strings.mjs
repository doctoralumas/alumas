import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name !== "node_modules" && f.name !== ".next" && f.name !== ".git") {
        res.push(...walk(p));
      }
    } else if (/\.(tsx|ts)$/.test(f.name)) {
      res.push(p);
    }
  }
  return res;
}

const files = walk(".");
const patterns = [
  /===\s*["'](Onaylandı|Bekliyor|İptal|Reddedildi|Aktif|Pasif)["']/i,
  /includes\s*\(\s*["'][^"']*(başarı|hata|oluşturuldu|onay)[^"']*["']\)/i,
];

console.log("Auditing files for human-readable business logic...");
let found = 0;
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const pat of patterns) {
    const match = content.match(pat);
    if (match) {
      console.log(`Potential issue in ${file}: "${match[0]}"`);
      found++;
    }
  }
}
console.log(`Audit complete. Found ${found} potential issues.`);

