import fs from "node:fs";
const must=["lib/integrations/google-places.ts","app/api/places/live/route.ts","app/api/ai/facilities/live/route.ts","V50_GOOGLE_PLACES_LIVE.md"];
let fail=false;
for(const p of must){if(!fs.existsSync(p)){console.error("MISSING",p);fail=true}}
const g=fs.readFileSync("lib/integrations/google-places.ts","utf8");
for(const t of ["places:searchNearby","X-Goog-FieldMask","currentOpeningHours","GOOGLE_PLACES_API_KEY"]){
  if(!g.includes(t)){console.error("MISSING TOKEN",t);fail=true}
}
console.log("v50 google places live",fail?"FAILED":"OK");
if(fail) process.exit(1);
