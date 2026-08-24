import fs from "node:fs";
const files=["app/ai/page.tsx","app/api/ai/navigate/route.ts","components/ai/health-navigator.tsx","lib/ai-navigation.ts","public/brand/alumas-logo.png"];
let bad=false;for(const f of files){if(!fs.existsSync(f)){console.error("MISSING",f);bad=true}}
const home=fs.readFileSync("app/page.tsx","utf8");if(!home.includes("HealthNavigator compact")){console.error("AI home card not wired");bad=true}
const api=fs.readFileSync("app/api/ai/navigate/route.ts","utf8");for(const token of ["isVerified:true","isPublished:true","AI_NAVIGATE","diagnosis:false"]){if(!api.includes(token)){console.error("API safety token missing",token);bad=true}}
const engine=fs.readFileSync("lib/ai-navigation.ts","utf8");for(const token of ["emergencyPatterns","urgentPatterns","specialtyRules","navigationSummary"]){if(!engine.includes(token)){console.error("engine token missing",token);bad=true}}
if(bad)process.exit(1);console.log("v43 AI navigation source checks OK");
