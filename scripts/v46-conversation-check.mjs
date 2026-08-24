import fs from "node:fs";
const files=["components/ai/health-navigator.tsx","app/api/ai/navigate/route.ts"];
for(const f of files){if(!fs.existsSync(f)) throw new Error(`missing ${f}`)}
const ui=fs.readFileSync(files[0],"utf8"), api=fs.readFileSync(files[1],"utf8");
for(const token of ["Neden bu branş?","Hangi kaynaklara göre?","Başka hangi seçenekler var?","Ben sağlık profesyoneli değilim."]){if(!ui.includes(token)&&!api.includes(token)) throw new Error(`missing ${token}`)}
if(!api.includes("conversationTurns")) throw new Error("conversation audit missing");
console.log("v46 conversational grounded navigation ✓");
