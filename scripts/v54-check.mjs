import fs from "node:fs";
const must=[
"lib/professional/document-requirements.ts",
"lib/professional/verification.ts",
"app/api/professional/documents/route.ts",
"app/api/admin/professional-documents/[id]/route.ts",
"app/api/admin/professional-verification/expiry-scan/route.ts",
"components/professional/VerificationDocumentsPanel.tsx",
"app/admin/professional-verification/page.tsx",
"V54_DOCUMENT_VERIFICATION.md"
];
let fail=false;
for(const p of must){if(!fs.existsSync(p)){console.error("MISSING",p);fail=true}}
const req=fs.readFileSync("lib/professional/document-requirements.ts","utf8");
for(const token of ["DOCTOR","HOSPITAL","PHARMACY","HEALTH_TOURISM_AGENCY","HEALTH_TOURISM_AUTHORIZATION"]){
  if(!req.includes(token)){console.error("MISSING DOC RULE",token);fail=true}
}
console.log("v54 document verification",fail?"FAILED":"OK");
if(fail)process.exit(1);
