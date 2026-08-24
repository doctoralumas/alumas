import fs from "node:fs";
const must=[
"lib/ai/match-engine.ts","lib/ai/context.ts",
"app/api/ai/matches/route.ts","app/api/ai/facilities/route.ts",
"V49_CONTEXTUAL_MATCHING.md"
];
let fail=false;
for(const p of must) if(!fs.existsSync(p)){console.error("MISSING",p);fail=true}
const m=fs.readFileSync("app/api/ai/matches/route.ts","utf8");
for(const token of ["availabilities","insuranceContracts","organizationOpenNow","Ben sağlık profesyoneli değilim."]){
  if(!m.includes(token)){console.error("MISSING TOKEN",token);fail=true}
}
console.log("v49 contextual matching",fail?"FAILED":"OK");
if(fail) process.exit(1);
