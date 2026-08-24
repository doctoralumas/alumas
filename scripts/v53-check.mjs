import fs from "node:fs";
const files=["lib/professional/account-config.ts","lib/professional/guards.ts","app/api/professional/agency/apply/route.ts","app/api/admin/professional-verification/[id]/route.ts","components/professional/ProfessionalDashboard.tsx","V53_PROFESSIONAL_ACCOUNTS.md"];
let fail=false; for(const f of files) if(!fs.existsSync(f)){console.error("MISSING",f);fail=true}
const a=fs.readFileSync("app/api/professional/agency/apply/route.ts","utf8");
const admin=fs.readFileSync("app/api/admin/professional-verification/[id]/route.ts","utf8");
if(!a.includes("HEALTH_TOURISM_AGENCY")||!a.includes("authorizationNumber")) fail=true;
if(!admin.includes("yetki belgesi onaylanmadan")) fail=true;
console.log("v53 professional accounts",fail?"FAILED":"OK"); if(fail)process.exit(1);
