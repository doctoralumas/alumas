import fs from "node:fs";
const must={
  "lib/ai/medical-knowledge.ts":["T.C. Sağlık Bakanlığı","World Health Organization","NHS","Ben sağlık profesyoneli değilim."],
  "app/api/ai/navigate/route.ts":["evidenceFor","evidenceBasedCommentary","curated_versioned_sources"],
  "components/ai/health-navigator.tsx":["Kaynağı aç","Ben sağlık profesyoneli değilim.","Kaynaklı bilgi modu aktif"],
};
let fail=false;
for(const [file,parts] of Object.entries(must)){
  const text=fs.readFileSync(file,"utf8");
  for(const part of parts) if(!text.includes(part)){console.error(`MISSING ${part} in ${file}`);fail=true}
}
if(fail) process.exit(1);
console.log("v45 grounded AI checks OK");
