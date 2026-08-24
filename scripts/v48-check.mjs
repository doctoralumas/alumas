import fs from "node:fs";
const must=["lib/ai/match-engine.ts","app/api/ai/matches/route.ts","V48_EXPLAINABLE_MATCHING.md"];
let fail=false; for(const p of must){if(!fs.existsSync(p)){console.error("MISSING",p);fail=true}}
const route=fs.readFileSync("app/api/ai/matches/route.ts","utf8");
if(!route.includes("Ben sağlık profesyoneli değilim.")){console.error("DISCLAIMER MISSING");fail=true}
if(!route.includes("isVerified:true")||!route.includes("isPublished:true")){console.error("VERIFICATION FILTER MISSING");fail=true}
console.log("v48 explainable matching checks", fail?"FAILED":"OK");
if(fail) process.exit(1);
